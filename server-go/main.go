package main

import (
        "context"
        "encoding/json"
        "fmt"
        "log"
        "net/http"
        "os"
        "strings"
        "time"

        "github.com/golang-jwt/jwt/v5"
        "github.com/gorilla/mux"
        "go.temporal.io/sdk/client"
)

type EmailTrackingEntry struct {
        ID               string                 `json:"id"`
        UserID           string                 `json:"userId"`
        TenantID         string                 `json:"tenantId"`
        EmailID          string                 `json:"emailId"`
        Status           string                 `json:"status"`
        Timestamp        time.Time              `json:"timestamp"`
        TemporalWorkflow string                 `json:"temporalWorkflow,omitempty"`
        Metadata         map[string]interface{} `json:"metadata,omitempty"`
}

type EmailTrackingRequest struct {
        EmailID          string                 `json:"emailId"`
        Status           string                 `json:"status"`
        TemporalWorkflow string                 `json:"temporalWorkflow,omitempty"`
        Metadata         map[string]interface{} `json:"metadata,omitempty"`
}

type JWTClaims struct {
        UserID   string `json:"userId"`
        TenantID string `json:"tenantId"`
        jwt.RegisteredClaims
}

type Server struct {
        temporalClient client.Client
        jwtSecret      string
}

// Store for email tracking entries (in production, this would be a database)
var emailTrackingStore = make(map[string]EmailTrackingEntry)

func main() {
        server := &Server{
                jwtSecret: getEnvOrDefault("JWT_SECRET", "your-secret-key"),
        }

        // Initialize Temporal client with retry logic
        if err := server.initTemporal(); err != nil {
                log.Fatalf("Failed to initialize Temporal client: %v", err)
        }
        defer server.temporalClient.Close()

        // Setup routes
        router := mux.NewRouter()
        
        // Health check endpoint
        router.HandleFunc("/health", server.healthCheck).Methods("GET")
        
        // Email tracking endpoints (protected)
        api := router.PathPrefix("/api").Subrouter()
        api.Use(server.jwtMiddleware)
        
        api.HandleFunc("/email-tracking", server.createEmailTracking).Methods("POST")
        api.HandleFunc("/email-tracking", server.getEmailTrackings).Methods("GET")
        api.HandleFunc("/email-tracking/{id}", server.getEmailTracking).Methods("GET")
        api.HandleFunc("/email-tracking/{id}", server.updateEmailTracking).Methods("PUT")
        api.HandleFunc("/email-tracking/{id}", server.deleteEmailTracking).Methods("DELETE")

        port := getEnvOrDefault("PORT", "8080")
        log.Printf("Starting Go server on port %s", port)
        log.Printf("Temporal server connection: ✅ Connected")
        
        if err := http.ListenAndServe(":"+port, enableCORS(router)); err != nil {
                log.Fatalf("Server failed to start: %v", err)
        }
}

func (s *Server) initTemporal() error {
        temporalHost := getEnvOrDefault("TEMPORAL_HOST", "localhost:7233")
        maxRetries := 5
        retryDelay := 2 * time.Second

        log.Printf("Attempting to connect to Temporal server at %s", temporalHost)

        for attempt := 1; attempt <= maxRetries; attempt++ {
                log.Printf("Temporal connection attempt %d/%d", attempt, maxRetries)
                
                ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
                defer cancel()

                c, err := client.Dial(client.Options{
                        HostPort: temporalHost,
                })

                if err != nil {
                        log.Printf("Attempt %d failed: %v", attempt, err)
                        if attempt == maxRetries {
                                return fmt.Errorf("failed to connect to Temporal after %d attempts: %v", maxRetries, err)
                        }
                        time.Sleep(retryDelay)
                        continue
                }

                // Test the connection by checking server health
                _, err = c.CheckHealth(ctx, nil)
                if err != nil {
                        log.Printf("Temporal health check failed on attempt %d: %v", attempt, err)
                        c.Close()
                        if attempt == maxRetries {
                                return fmt.Errorf("Temporal health check failed after %d attempts: %v", maxRetries, err)
                        }
                        time.Sleep(retryDelay)
                        continue
                }

                s.temporalClient = c
                log.Printf("✅ Successfully connected to Temporal server")
                return nil
        }

        return fmt.Errorf("exhausted all retry attempts")
}

func (s *Server) jwtMiddleware(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
                authHeader := r.Header.Get("Authorization")
                if authHeader == "" {
                        http.Error(w, "Authorization header required", http.StatusUnauthorized)
                        return
                }

                tokenString := strings.TrimPrefix(authHeader, "Bearer ")
                if tokenString == authHeader {
                        http.Error(w, "Bearer token required", http.StatusUnauthorized)
                        return
                }

                token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
                        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                                return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
                        }
                        return []byte(s.jwtSecret), nil
                })

                if err != nil {
                        log.Printf("JWT validation error: %v", err)
                        http.Error(w, "Invalid token", http.StatusUnauthorized)
                        return
                }

                claims, ok := token.Claims.(*JWTClaims)
                if !ok || !token.Valid {
                        http.Error(w, "Invalid token claims", http.StatusUnauthorized)
                        return
                }

                // Add user info to request context
                ctx := context.WithValue(r.Context(), "userID", claims.UserID)
                ctx = context.WithValue(ctx, "tenantID", claims.TenantID)
                
                log.Printf("🔐 User authenticated: %s (tenant: %s)", claims.UserID, claims.TenantID)
                next.ServeHTTP(w, r.WithContext(ctx))
        })
}

func (s *Server) healthCheck(w http.ResponseWriter, r *http.Request) {
        status := map[string]interface{}{
                "status":   "healthy",
                "temporal": "connected",
                "time":     time.Now().UTC(),
        }

        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(status)
}

func (s *Server) createEmailTracking(w http.ResponseWriter, r *http.Request) {
        userID := r.Context().Value("userID").(string)
        tenantID := r.Context().Value("tenantID").(string)

        var req EmailTrackingRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
                http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
                return
        }

        if req.EmailID == "" || req.Status == "" {
                http.Error(w, "emailId and status are required", http.StatusBadRequest)
                return
        }

        entry := EmailTrackingEntry{
                ID:               generateID(),
                UserID:           userID,
                TenantID:         tenantID,
                EmailID:          req.EmailID,
                Status:           req.Status,
                Timestamp:        time.Now().UTC(),
                TemporalWorkflow: req.TemporalWorkflow,
                Metadata:         req.Metadata,
        }

        emailTrackingStore[entry.ID] = entry

        log.Printf("📧 Created email tracking entry: %s for user %s (status: %s)", entry.ID, userID, req.Status)

        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusCreated)
        json.NewEncoder(w).Encode(entry)
}

func (s *Server) getEmailTrackings(w http.ResponseWriter, r *http.Request) {
        userID := r.Context().Value("userID").(string)
        tenantID := r.Context().Value("tenantID").(string)

        var userEntries []EmailTrackingEntry
        for _, entry := range emailTrackingStore {
                if entry.UserID == userID && entry.TenantID == tenantID {
                        userEntries = append(userEntries, entry)
                }
        }

        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]interface{}{
                "entries": userEntries,
                "count":   len(userEntries),
        })
}

func (s *Server) getEmailTracking(w http.ResponseWriter, r *http.Request) {
        userID := r.Context().Value("userID").(string)
        tenantID := r.Context().Value("tenantID").(string)
        
        vars := mux.Vars(r)
        id := vars["id"]

        entry, exists := emailTrackingStore[id]
        if !exists {
                http.Error(w, "Entry not found", http.StatusNotFound)
                return
        }

        if entry.UserID != userID || entry.TenantID != tenantID {
                http.Error(w, "Access denied", http.StatusForbidden)
                return
        }

        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(entry)
}

func (s *Server) updateEmailTracking(w http.ResponseWriter, r *http.Request) {
        userID := r.Context().Value("userID").(string)
        tenantID := r.Context().Value("tenantID").(string)
        
        vars := mux.Vars(r)
        id := vars["id"]

        entry, exists := emailTrackingStore[id]
        if !exists {
                http.Error(w, "Entry not found", http.StatusNotFound)
                return
        }

        if entry.UserID != userID || entry.TenantID != tenantID {
                http.Error(w, "Access denied", http.StatusForbidden)
                return
        }

        var req EmailTrackingRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
                http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
                return
        }

        // Update the entry
        if req.Status != "" {
                entry.Status = req.Status
        }
        if req.TemporalWorkflow != "" {
                entry.TemporalWorkflow = req.TemporalWorkflow
        }
        if req.Metadata != nil {
                entry.Metadata = req.Metadata
        }
        entry.Timestamp = time.Now().UTC()

        emailTrackingStore[id] = entry

        log.Printf("📧 Updated email tracking entry: %s (status: %s)", id, entry.Status)

        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(entry)
}

func (s *Server) deleteEmailTracking(w http.ResponseWriter, r *http.Request) {
        userID := r.Context().Value("userID").(string)
        tenantID := r.Context().Value("tenantID").(string)
        
        vars := mux.Vars(r)
        id := vars["id"]

        entry, exists := emailTrackingStore[id]
        if !exists {
                http.Error(w, "Entry not found", http.StatusNotFound)
                return
        }

        if entry.UserID != userID || entry.TenantID != tenantID {
                http.Error(w, "Access denied", http.StatusForbidden)
                return
        }

        delete(emailTrackingStore, id)

        log.Printf("📧 Deleted email tracking entry: %s", id)

        w.WriteHeader(http.StatusNoContent)
}

func enableCORS(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
                w.Header().Set("Access-Control-Allow-Origin", "*")
                w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

                if r.Method == "OPTIONS" {
                        w.WriteHeader(http.StatusOK)
                        return
                }

                next.ServeHTTP(w, r)
        })
}

func getEnvOrDefault(key, defaultValue string) string {
        if value := os.Getenv(key); value != "" {
                return value
        }
        return defaultValue
}

func generateID() string {
        return fmt.Sprintf("%d", time.Now().UnixNano())
}
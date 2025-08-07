# Email Tracking Go Server

A Go backend server that provides email lifecycle tracking functionality with Temporal workflow integration and JWT authentication.

## Features

- **Temporal Integration**: Connects to Temporal server at `10.100.0.2` for workflow orchestration
- **JWT Authentication**: Validates JWT tokens from the main Node.js application
- **Email Tracking API**: RESTful endpoints for managing email lifecycle tracking
- **Tenant Isolation**: Multi-tenant support with proper data isolation
- **Health Checks**: Built-in health monitoring and Temporal connectivity verification

## Configuration

The server can be configured using environment variables or a `.env` file. A sample `.env` file is provided in the root directory with all available configuration options.

### Using the .env file

Copy the `.env` file and modify the values as needed:

```bash
# Copy the sample .env file
cp .env .env.local

# Edit the configuration
nano .env.local
```

### Key Environment Variables

```bash
# Server Configuration
PORT=8095                           # Server port (default: 8095)
HOST=0.0.0.0                        # Host interface (default: 0.0.0.0)

# Security Configuration  
JWT_SECRET=your-jwt-secret-key      # Must match the main application's JWT secret
JWT_ALGORITHM=HS256                 # JWT signing algorithm

# Temporal Configuration
TEMPORAL_HOST=172.72.0.3:7233       # Temporal server address
TEMPORAL_NAMESPACE=default          # Temporal namespace
TEMPORAL_RETRY_ATTEMPTS=5           # Connection retry attempts
TEMPORAL_RETRY_DELAY=2s             # Delay between retries
TEMPORAL_CONNECTION_TIMEOUT=10s     # Connection timeout

# Email Tracking Configuration
EMAIL_TRACKING_STORAGE=memory       # Storage type: memory or database
EMAIL_TRACKING_RETENTION_DAYS=30    # Data retention period

# Logging Configuration
LOG_LEVEL=info                      # Log level: debug, info, warn, error
LOG_FORMAT=json                     # Log format: text or json

# Development Configuration
ENVIRONMENT=development             # Environment: development, staging, production
MAIN_APP_URL=http://localhost:5000  # Main application URL
```

## API Endpoints

### Health Check
- `GET /health` - Server health status and Temporal connectivity

### Email Tracking (Protected Routes)
All routes require JWT authentication via `Authorization: Bearer <token>` header:

- `POST /api/email-tracking` - Create new email tracking entry
- `GET /api/email-tracking` - Get all email tracking entries for authenticated user
- `GET /api/email-tracking/{id}` - Get specific email tracking entry
- `PUT /api/email-tracking/{id}` - Update email tracking entry
- `DELETE /api/email-tracking/{id}` - Delete email tracking entry

### Request/Response Format

#### Create Email Tracking
```json
POST /api/email-tracking
{
  "emailId": "email-123",
  "status": "sent",
  "temporalWorkflow": "email-workflow-id",
  "metadata": {
    "recipient": "user@example.com",
    "subject": "Welcome Email"
  }
}
```

#### Response
```json
{
  "id": "1704067200000000000",
  "userId": "user-id",
  "tenantId": "tenant-id",
  "emailId": "email-123",
  "status": "sent",
  "timestamp": "2024-01-01T00:00:00Z",
  "temporalWorkflow": "email-workflow-id",
  "metadata": {
    "recipient": "user@example.com",
    "subject": "Welcome Email"
  }
}
```

## Running the Server

1. Install Go dependencies:
```bash
cd server-go
go mod tidy
```

2. Set environment variables:
```bash
export JWT_SECRET="your-jwt-secret"
export TEMPORAL_HOST="172.72.0.3:7233"
export PORT="8095"
```

3. Run the server:
```bash
go run main.go
```

## Temporal Connection

The server implements robust Temporal connectivity with:
- **Startup validation**: Verifies Temporal connection before accepting requests
- **Retry logic**: 5 connection attempts with exponential backoff
- **Health checks**: Continuous monitoring of Temporal server status
- **Graceful failure**: Clean shutdown if Temporal becomes unavailable

## Security

- **JWT Validation**: All protected routes validate JWT tokens using the same secret as the main application
- **Tenant Isolation**: Users can only access their own tenant's data
- **CORS Support**: Secure cross-origin resource sharing with specific domain allowlist
- **Input Validation**: Request payload validation for all endpoints

## Architecture Integration

This Go server complements the existing Node.js/Express backend by:
- Sharing the same JWT authentication system
- Maintaining tenant isolation consistency
- Providing specialized email workflow tracking
- Integrating with Temporal for advanced workflow management

The server can run alongside the main application or as a separate microservice, depending on deployment needs.
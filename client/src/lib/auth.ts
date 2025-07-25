import { apiRequest } from "./queryClient";

export interface AuthTokens {
  accessToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
  menuExpanded?: boolean;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: AuthUser;
  emailVerificationRequired?: boolean;
}

class AuthManager {
  private readonly ACCESS_TOKEN_KEY = "auth_access_token";
  private refreshPromise: Promise<string> | null = null;

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
  }

  async refreshAccessToken(): Promise<string> {
    // If there's already a refresh in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<string> {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include", // Include httpOnly cookies
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data: AuthResponse = await response.json();
      this.setAccessToken(data.accessToken);
      return data.accessToken;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  async makeAuthenticatedRequest(
    method: string,
    url: string,
    data?: unknown
  ): Promise<Response> {
    let token = this.getAccessToken();

    const makeRequest = async (accessToken: string) => {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
      };

      if (data) {
        headers["Content-Type"] = "application/json";
      }

      return fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });
    };

    if (!token) {
      throw new Error("No access token available");
    }

    let response = await makeRequest(token);

    // If token expired, try to refresh and retry once
    if (response.status === 401) {
      try {
        token = await this.refreshAccessToken();
        response = await makeRequest(token);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = "/auth";
        throw new Error("Authentication failed");
      }
    }

    return response;
  }

  async login(email: string, password: string, twoFactorToken?: string): Promise<AuthResponse | { requires2FA: boolean; tempLoginId: string }> {
    const response = await apiRequest("POST", "/api/auth/login", {
      email,
      password,
      twoFactorToken,
    });

    const data = await response.json();
    
    if (data.requires2FA) {
      return data;
    }

    this.setAccessToken(data.accessToken);
    return data;
  }

  async register(registerData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    confirmPassword: string;
  }): Promise<{ message: string; user: AuthUser }> {
    const response = await apiRequest("POST", "/api/auth/register", registerData);
    return response.json();
  }

  async logout(): Promise<void> {
    try {
      // Try to call logout endpoint
      const token = this.getAccessToken();
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });
      }
    } catch (error) {
      // Even if logout fails, clear local tokens
      console.error("Logout request failed:", error);
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<AuthUser> {
    const response = await this.makeAuthenticatedRequest("GET", "/api/auth/me");
    
    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }

    const data = await response.json();
    return data.user;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiRequest("POST", "/api/auth/forgot-password", { email });
    return response.json();
  }

  async updateProfile(data: {
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<{ message: string; user: AuthUser }> {
    const response = await this.makeAuthenticatedRequest("PUT", "/api/auth/profile", data);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update profile");
    }

    return response.json();
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ message: string }> {
    const response = await this.makeAuthenticatedRequest("PUT", "/api/auth/change-password", data);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to change password");
    }

    return response.json();
  }

  async deleteAccount(): Promise<{ message: string }> {
    const response = await this.makeAuthenticatedRequest("DELETE", "/api/auth/account");
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete account");
    }

    this.clearTokens();
    return response.json();
  }

  async setup2FA(): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    const response = await this.makeAuthenticatedRequest("POST", "/api/auth/2fa/setup");
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to setup 2FA");
    }

    return response.json();
  }

  async enable2FA(token: string): Promise<{ message: string }> {
    const response = await this.makeAuthenticatedRequest("POST", "/api/auth/2fa/enable", { token });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to enable 2FA");
    }

    return response.json();
  }

  async disable2FA(token: string): Promise<{ message: string }> {
    const response = await this.makeAuthenticatedRequest("POST", "/api/auth/2fa/disable", { token });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to disable 2FA");
    }

    return response.json();
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authManager = new AuthManager();

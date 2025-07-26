import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authManager } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,
};

// Async thunk for checking authentication
export const checkAuthentication = createAsyncThunk(
  'auth/checkAuthentication',
  async (_, { rejectWithValue }) => {
    try {
      console.log("Redux: Starting authentication check...");
      
      // If we don't have a valid access token, try to refresh first
      if (!authManager.isAuthenticated()) {
        console.log("Redux: No valid access token, attempting refresh...");
        try {
          await authManager.refreshAccessToken();
          console.log("Redux: Token refresh successful");
        } catch (refreshError: any) {
          console.log("Redux: Token refresh failed:", refreshError.message);
          
          if (refreshError.message?.includes("authentication required")) {
            console.log("Redux: Refresh token invalid, user needs to log in");
            return null;
          }
          
          // For other refresh errors, return rejection but don't clear tokens
          console.log("Redux: Refresh failed with temporary error");
          return rejectWithValue("Temporary authentication error");
        }
      }
      
      // Now check if we have a valid token after potential refresh
      if (!authManager.isAuthenticated()) {
        console.log("Redux: Still no valid token after refresh attempt");
        return null;
      }
      
      console.log("Redux: Fetching current user data...");
      const user = await authManager.getCurrentUser();
      return user;
    } catch (error: any) {
      console.log("Redux: Auth check failed:", error.message);
      
      if (error.message?.includes("Authentication failed") || 
          error.message?.includes("Token refresh failed - authentication required")) {
        console.log("Redux: Authentication definitively failed, clearing tokens");
        authManager.clearTokens();
        return null;
      }
      
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for login
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string; tenantSlug: string; totpCode?: string }, { rejectWithValue }) => {
    try {
      console.log("Redux Login: Starting login request...");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        console.log("Redux Login: Failed with error:", error);
        return rejectWithValue(error.message || "Login failed");
      }

      const data = await response.json();
      console.log("Redux Login: Success, setting access token");
      authManager.setAccessToken(data.accessToken);
      
      // Fetch user data after successful login
      console.log("Redux Login: Fetching user data...");
      const user = await authManager.getCurrentUser();
      console.log("Redux Login: Got user data:", user);
      return user;
    } catch (error: any) {
      console.error("Redux Login: Exception:", error);
      return rejectWithValue(error.message || "Login failed");
    }
  }
);

// Async thunk for logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      authManager.clearTokens();
      return null;
    } catch (error: any) {
      // Even if the server request fails, clear local tokens
      authManager.clearTokens();
      return null;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check authentication
      .addCase(checkAuthentication.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuthentication.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(checkAuthentication.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
        state.error = action.payload as string || "Authentication check failed";
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log("Redux: Login fulfilled, updating state with user:", action.payload);
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.error = null;
        console.log("Redux: State updated - isAuthenticated:", state.isAuthenticated);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload as string || "Login failed";
      })
      
      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError, setInitialized } = authSlice.actions;
export default authSlice.reducer;
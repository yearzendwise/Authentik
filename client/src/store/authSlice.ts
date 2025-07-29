import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/lib/auth";
import { authManager } from "@/lib/auth";

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

// Async thunks for authentication actions
export const checkAuthStatus = createAsyncThunk(
  "auth/checkStatus",
  async (_, { rejectWithValue }) => {
    try {
      console.log("🔐 [Redux] Checking authentication status...");

      // First check if we have a valid refresh token
      const checkResponse = await fetch("/api/auth/check", {
        method: "GET",
        credentials: "include",
      });

      if (!checkResponse.ok) {
        throw new Error("Auth check failed");
      }

      const checkData = await checkResponse.json();
      console.log("🔐 [Redux] Auth check result:", checkData);

      if (!checkData.hasAuth) {
        throw new Error("No valid authentication found");
      }

      // Try to refresh token and get user data
      const refreshResponse = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!refreshResponse.ok) {
        throw new Error("Token refresh failed");
      }

      const refreshData = await refreshResponse.json();
      console.log("🔐 [Redux] Token refreshed successfully");

      return {
        user: refreshData.user,
        accessToken: refreshData.accessToken,
      };
    } catch (error: any) {
      console.log("🔐 [Redux] Auth check failed:", error.message);
      return rejectWithValue(error.message);
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string; twoFactorToken?: string; rememberMe?: boolean },
    { rejectWithValue },
  ) => {
    try {
      console.log("🔐 [Redux] Attempting login...");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      console.log("🔐 [Redux] Login successful");

      // Handle 2FA requirement
      if (data.requires2FA) {
        return rejectWithValue("2FA_REQUIRED");
      }

      return {
        user: data.user,
        accessToken: data.accessToken,
      };
    } catch (error: any) {
      console.log("🔐 [Redux] Login failed:", error.message);
      return rejectWithValue(error.message);
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { getState, rejectWithValue }) => {
    try {
      console.log("🔐 [Redux] Logging out...");

      const state = getState() as { auth: AuthState };
      const token = state.auth.accessToken;

      // Attempt to call logout endpoint if we have a token
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          credentials: "include",
        });
      } else {
        // If no token, just clear the refresh token cookie
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      }

      console.log("🔐 [Redux] Logout successful");
      return null;
    } catch (error: any) {
      console.log("🔐 [Redux] Logout error:", error.message);
      // Even if logout fails on server, clear local state
      return null;
    }
  },
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateProfile",
  async (profileData: any, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.accessToken;

      if (!token) {
        throw new Error("No access token available");
      }

      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Profile update failed");
      }

      const data = await response.json();
      return data.user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
      // Also clear tokens from authManager
      authManager.clearTokens();
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    updateMenuPreference: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.menuExpanded = action.payload;
      }
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    initializeFromAuthManager: (state) => {
      // Get token from authManager if it exists
      const token = authManager.getAccessToken();
      if (token) {
        state.accessToken = token;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isInitialized = true;
        state.error = null;
        
        // Also store token in authManager for proper token management system
        if (action.payload.accessToken) {
          authManager.setAccessToken(action.payload.accessToken);
        }
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
        state.error = action.payload as string;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isInitialized = true;
        state.error = null;
        
        // Also store token in authManager for proper token management system
        if (action.payload.accessToken) {
          authManager.setAccessToken(action.payload.accessToken);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
        
        // Also clear token from authManager
        authManager.clearTokens();
      })

      // Update profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const {
  setAccessToken,
  clearAuth,
  setError,
  clearError,
  setInitialized,
  updateMenuPreference,
  updateUser,
  initializeFromAuthManager,
} = authSlice.actions;
export default authSlice.reducer;

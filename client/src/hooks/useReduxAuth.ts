import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  checkAuthStatus,
  loginUser,
  logoutUser,
  updateUserProfile,
  clearAuth,
  setError,
  clearError,
  initializeFromAuthManager,
} from "@/store/authSlice";
import { useToast } from "@/hooks/use-toast";

// Main authentication hook
export function useReduxAuth() {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);

  // Initialize authentication on mount
  useEffect(() => {
    if (!authState.isInitialized && !authState.isLoading) {
      console.log("🔐 [Hook] Initializing authentication...");
      // First, sync with authManager's localStorage data
      dispatch(initializeFromAuthManager());
      // Then check auth status
      dispatch(checkAuthStatus());
    }
  }, [dispatch, authState.isInitialized, authState.isLoading]);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    isInitialized: authState.isInitialized,
    error: authState.error,
    accessToken: authState.accessToken,
  };
}

// Login hook
export function useReduxLogin() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { isLoginLoading, error } = useAppSelector((state) => state.auth);

  const login = async (credentials: {
    email: string;
    password: string;
    twoFactorToken?: string;
    rememberMe?: boolean;
  }) => {
    try {
      const result = await dispatch(loginUser(credentials)).unwrap();

      toast({
        title: "Success",
        description: "Login successful! Welcome back.",
      });

      return result;
    } catch (error: any) {
      let message = "Login failed. Please try again.";

      if (error === "2FA_REQUIRED") {
        throw new Error("2FA_REQUIRED");
      }

      const errorString = typeof error === 'string' ? error : error.toString();
      
      if (errorString.includes("401")) {
        message = "Invalid email or password. Please check your credentials.";
      } else if (errorString.includes("403") && errorString.includes("verify")) {
        message =
          "Please verify your email address before logging in. Check your inbox for the verification email.";
      } else if (errorString.includes("400")) {
        message = "Please check your input and try again.";
      }

      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });

      throw new Error(error);
    }
  };

  return {
    login,
    isLoading: isLoginLoading,
    error,
  };
}

// Logout hook
export function useReduxLogout() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const logout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();

      toast({
        title: "Success",
        description: "Logged out successfully.",
      });
    } catch (error) {
      // Even if logout fails on server, we've cleared local state
      toast({
        title: "Info",
        description: "Logged out locally.",
      });
    }
  };

  return { logout };
}

// Profile update hook
export function useReduxUpdateProfile() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const updateProfile = async (profileData: any) => {
    try {
      await dispatch(updateUserProfile(profileData)).unwrap();

      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    } catch (error: any) {
      let message = "Failed to update profile. Please try again.";

      if (error.includes("409")) {
        message = "Email already taken by another user.";
      } else if (error.includes("400")) {
        message = "Please check your input and try again.";
      }

      toast({
        title: "Update Failed",
        description: message,
        variant: "destructive",
      });

      throw error;
    }
  };

  return { updateProfile };
}

// Auth error management hook
export function useAuthError() {
  const dispatch = useAppDispatch();
  const error = useAppSelector((state) => state.auth.error);

  const clearAuthError = () => {
    dispatch(clearError());
  };

  const setAuthError = (message: string) => {
    dispatch(setError(message));
  };

  return {
    error,
    clearAuthError,
    setAuthError,
  };
}

// Force logout (for when token refresh fails definitively)
export function useForceLogout() {
  const dispatch = useAppDispatch();

  const forceLogout = () => {
    dispatch(clearAuth());
  };

  return { forceLogout };
}

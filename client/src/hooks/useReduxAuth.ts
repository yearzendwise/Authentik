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
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const login = async (credentials: {
    email: string;
    password: string;
    twoFactorToken?: string;
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

      if (error.includes("401")) {
        message = "Invalid email or password. Please check your credentials.";
      } else if (error.includes("403") && error.includes("verify")) {
        message =
          "Please verify your email address before logging in. Check your inbox for the verification email.";
      } else if (error.includes("400")) {
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
    isLoading,
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
    console.log("🔐 [Hook] Force logout triggered");
    dispatch(clearAuth());
  };

  return { forceLogout };
}

// Menu preference hook (temporary - uses direct API call)
export function useReduxUpdateMenuPreference() {
  const { accessToken } = useAppSelector((state) => state.auth);

  const updateMenuPreference = async (data: { menuExpanded: boolean }) => {
    if (!accessToken) {
      throw new Error("No access token available");
    }

    const response = await fetch("/api/auth/menu-preference", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update menu preference");
    }

    return response.json();
  };

  return {
    mutateAsync: updateMenuPreference,
    isPending: false, // Simplified for now
  };
}

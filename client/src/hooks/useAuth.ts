import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authManager } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { AuthUser, AuthResponse } from "@/lib/auth";
import type { LoginCredentials, RegisterData, UpdateProfileData, ChangePasswordData } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error, isError, isFetched } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        console.log("Starting authentication check...");
        
        // If we don't have a valid access token, try to refresh first
        if (!authManager.isAuthenticated()) {
          console.log("No valid access token, attempting refresh...");
          try {
            // Try to refresh the access token using the refresh token cookie
            const newToken = await authManager.refreshAccessToken();
            console.log("Token refresh successful, proceeding with auth check");
          } catch (refreshError: any) {
            console.log("Token refresh failed:", refreshError.message);
            
            // If refresh failed due to invalid refresh token, user needs to log in
            if (refreshError.message?.includes("authentication required")) {
              console.log("Refresh token invalid, user needs to log in");
              return null;
            }
            
            // For other refresh errors, return null but don't clear tokens
            console.log("Refresh failed with temporary error, returning null but keeping tokens");
            return null;
          }
        }
        
        // Now check if we have a valid token after potential refresh
        if (!authManager.isAuthenticated()) {
          console.log("Still no valid token after refresh attempt");
          return null;
        }
        
        console.log("Fetching current user data...");
        return await authManager.getCurrentUser();
      } catch (error: any) {
        console.log("Auth query failed:", error.message);
        
        // Handle different types of auth failures
        if (error.message?.includes("Authentication failed") || 
            error.message?.includes("Token refresh failed - authentication required")) {
          console.log("Authentication definitively failed, clearing tokens");
          authManager.clearTokens();
          return null;
        }
        
        // For network errors, server errors, or other temporary issues, keep tokens but return null
        console.log("Temporary auth error, keeping tokens but returning null");
        return null;
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry if authentication actually failed
      if (error?.message?.includes("Authentication failed") || 
          error?.message?.includes("Token refresh failed - authentication required")) {
        return false;
      }
      // Retry twice for temporary errors - once with 500ms delay, then 1s delay
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => (attemptIndex + 1) * 500, // 500ms, then 1000ms
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Determine if we've completed the initial authentication check
  const hasInitialized = isFetched || isError;
  
  // Determine authentication state - if we have user data, we're authenticated
  const isAuthenticated = !!user;

  return {
    user,
    isLoading,
    isAuthenticated,
    hasInitialized,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials & { twoFactorToken?: string }) => {
      const loginResult = await authManager.login(credentials.email, credentials.password, credentials.twoFactorToken);
      
      // If 2FA is required, return early
      if ('requires2FA' in loginResult) {
        return loginResult;
      }
      
      // After successful login, check for subscription
      try {
        const subscriptionResponse = await authManager.makeAuthenticatedRequest("GET", "/api/my-subscription");
        const subscriptionData = await subscriptionResponse.json();
        
        return {
          ...loginResult,
          hasSubscription: !!subscriptionData.subscription
        };
      } catch (error) {
        // If subscription check fails, continue with normal login flow
        console.warn("Failed to check subscription status:", error);
        return {
          ...loginResult,
          hasSubscription: false
        };
      }
    },
    onSuccess: (data) => {
      if ('requires2FA' in data) {
        // Handle 2FA required response - this will be handled by the component
        return;
      }
      
      queryClient.setQueryData(["/api/auth/me"], data.user);
      
      // Re-initialize the automatic refresh system after successful login
      setTimeout(() => {
        authManager.initialize();
      }, 100);
      
      toast({
        title: "Success",
        description: "Login successful! Welcome back.",
      });
    },
    onError: (error: Error) => {
      let message = "Login failed. Please try again.";
      
      if (error.message.includes("401")) {
        message = "Invalid email or password. Please check your credentials.";
      } else if (error.message.includes("403") && error.message.includes("verify")) {
        message = "Please verify your email address before logging in. Check your inbox for the verification email.";
      } else if (error.message.includes("400")) {
        message = "Please check your input and try again.";
      }
      
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
    },
  });
}

export function useRegister() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      return authManager.register(data);
    },
    onSuccess: () => {
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account before logging in.",
      });
    },
    onError: (error: Error) => {
      let message = "Registration failed. Please try again.";
      
      if (error.message.includes("409")) {
        message = "An account with this email already exists.";
      } else if (error.message.includes("400")) {
        message = "Please check your input and try again.";
      }
      
      toast({
        title: "Registration Failed",
        description: message,
        variant: "destructive",
      });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      await authManager.logout();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      toast({
        title: "Success",
        description: "Logged out successfully.",
      });
    },
    onError: () => {
      // Even if logout fails, clear local state
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      toast({
        title: "Info",
        description: "Logged out locally.",
      });
    },
  });
}

export function useForgotPassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (email: string) => {
      return authManager.forgotPassword(email);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "If the email exists, a reset link has been sent.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send reset link. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      return authManager.updateProfile(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    },
    onError: (error: Error) => {
      let message = "Failed to update profile. Please try again.";
      
      if (error.message.includes("409")) {
        message = "Email already taken by another user.";
      } else if (error.message.includes("400")) {
        message = "Please check your input and try again.";
      }
      
      toast({
        title: "Update Failed",
        description: message,
        variant: "destructive",
      });
    },
  });
}

export function useChangePassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      return authManager.changePassword(data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully. Please log in again.",
      });
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = "/auth";
      }, 2000);
    },
    onError: (error: Error) => {
      let message = "Failed to change password. Please try again.";
      
      if (error.message.includes("Current password is incorrect")) {
        message = "Current password is incorrect.";
      } else if (error.message.includes("400")) {
        message = "Please check your input and try again.";
      }
      
      toast({
        title: "Password Change Failed",
        description: message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateMenuPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { menuExpanded: boolean }) => {
      const response = await authManager.makeAuthenticatedRequest('PATCH', '/api/auth/menu-preference', data);
      if (!response.ok) {
        throw new Error('Failed to update menu preference');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the cached user data with new menu preference
      queryClient.setQueryData(["/api/auth/me"], (oldData: any) => {
        if (oldData) {
          return { ...oldData, menuExpanded: variables.menuExpanded };
        }
        return oldData;
      });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      return authManager.deleteAccount();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
      });
      // Redirect to auth page after a short delay
      setTimeout(() => {
        window.location.href = "/auth";
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useSetup2FA() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      return authManager.setup2FA();
    },
    onError: (error: Error) => {
      toast({
        title: "2FA Setup Failed",
        description: error.message || "Failed to setup 2FA. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useEnable2FA() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (token: string) => {
      return authManager.enable2FA(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Success",
        description: "Two-factor authentication has been enabled successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "2FA Enable Failed",
        description: error.message || "Failed to enable 2FA. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDisable2FA() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (token: string) => {
      return authManager.disable2FA(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Success",
        description: "Two-factor authentication has been disabled successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "2FA Disable Failed",
        description: error.message || "Failed to disable 2FA. Please try again.",
        variant: "destructive",
      });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authManager } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { AuthUser, AuthResponse } from "@/lib/auth";
import type { LoginCredentials, RegisterData, UpdateProfileData, ChangePasswordData } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        if (!authManager.isAuthenticated()) {
          return null;
        }
        return await authManager.getCurrentUser();
      } catch (error) {
        authManager.clearTokens();
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && authManager.isAuthenticated(),
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      return authManager.login(credentials.email, credentials.password);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data.user);
      toast({
        title: "Success",
        description: "Login successful! Welcome back.",
      });
    },
    onError: (error: Error) => {
      let message = "Login failed. Please try again.";
      
      if (error.message.includes("401")) {
        message = "Invalid email or password. Please check your credentials.";
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
        title: "Success",
        description: "Account created successfully! Please sign in with your credentials.",
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

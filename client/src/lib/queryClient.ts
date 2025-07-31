import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { authManager } from "./auth";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    // Check if user is authenticated, if not use direct fetch for auth endpoints
    if (
      !authManager.isAuthenticated() &&
      (url.includes("/auth/login") ||
        url.includes("/auth/register") ||
        url.includes("/auth/forgot-password") ||
        url.includes("/auth/refresh"))
    ) {
      const headers: Record<string, string> = {
        ...(data ? { "Content-Type": "application/json" } : {}),
      };

      const res = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });

      await throwIfResNotOk(res);
      return res;
    }

    // For authenticated requests, use the auth manager's makeAuthenticatedRequest
    // which handles automatic token refresh on 401 errors
    const res = await authManager.makeAuthenticatedRequest(method, url, data);
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Check if user is authenticated
      if (!authManager.isAuthenticated()) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error("401: Not authenticated");
      }

      // Make authenticated request using auth manager with automatic token refresh
      const res = await authManager.makeAuthenticatedRequest("GET", queryKey.join("/") as string);
      return await res.json();
    } catch (error: any) {
      if (
        unauthorizedBehavior === "returnNull" &&
        (error.message?.includes("401") || error.message?.includes("Authentication failed"))
      ) {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes default stale time
      retry: (failureCount, error: any) => {
        // Retry once for non-auth errors
        if (
          error?.message?.includes("401") ||
          error?.message?.includes("Authentication failed")
        ) {
          return false;
        }
        return failureCount < 1;
      },
      retryDelay: 1000,
    },
    mutations: {
      retry: false,
    },
  },
});

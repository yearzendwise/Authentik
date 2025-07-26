import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Lazy import to avoid circular dependency
let authManager: any = null;
const getAuthManager = async () => {
  if (!authManager) {
    const authModule = await import("./auth");
    authManager = authModule.authManager;
  }
  return authManager;
};

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
    const auth = await getAuthManager();
    
    // Check if user is authenticated, if not use direct fetch for auth endpoints
    if (!auth.isAuthenticated() && (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/forgot-password'))) {
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
    
    // Use auth manager for authenticated requests (handles token refresh automatically)
    return await auth.makeAuthenticatedRequest(method, url, data);
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
      const auth = await getAuthManager();
      
      // Check if user is authenticated
      if (!auth.isAuthenticated()) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error("401: Not authenticated");
      }
      
      // Use auth manager for authenticated requests (handles token refresh automatically)
      const res = await auth.makeAuthenticatedRequest("GET", queryKey.join("/") as string);
      return await res.json();
    } catch (error: any) {
      if (unauthorizedBehavior === "returnNull" && error.message?.includes("401")) {
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
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

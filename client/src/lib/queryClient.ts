import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Lazy import to avoid circular dependency
let store: any = null;
const getStore = async () => {
  if (!store) {
    const storeModule = await import("../store");
    store = storeModule.store;
  }
  return store;
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
    const reduxStore = await getStore();
    const authState = reduxStore.getState().auth;
    
    // Check if user is authenticated, if not use direct fetch for auth endpoints
    if (!authState.isAuthenticated && (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/forgot-password'))) {
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
    
    // For authenticated requests, use the access token from Redux state
    if (!authState.accessToken) {
      throw new Error("No access token available");
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${authState.accessToken}`,
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
      const reduxStore = await getStore();
      const authState = reduxStore.getState().auth;
      
      // Check if user is authenticated
      if (!authState.isAuthenticated || !authState.accessToken) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error("401: Not authenticated");
      }
      
      // Make authenticated request using Redux token
      const res = await apiRequest("GET", queryKey.join("/") as string);
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
      staleTime: 5 * 60 * 1000, // 5 minutes default stale time
      retry: (failureCount, error: any) => {
        // Retry once for non-auth errors
        if (error?.message?.includes("401") || error?.message?.includes("Authentication failed")) {
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

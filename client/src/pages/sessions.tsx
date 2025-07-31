import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authManager } from "@/lib/auth";
import { useReduxAuth } from "@/hooks/useReduxAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Smartphone, Monitor, Tablet, Globe, Clock, MapPin, LogOut } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

interface Session {
  id: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  location?: string;
  lastUsed: string;
  isCurrent: boolean;
  createdAt: string;
}

function getDeviceIcon(deviceName: string) {
  const name = deviceName.toLowerCase();
  if (name.includes('mobile') || name.includes('iphone') || name.includes('android')) {
    return <Smartphone className="h-5 w-5" />;
  }
  if (name.includes('tablet') || name.includes('ipad')) {
    return <Tablet className="h-5 w-5" />;
  }
  return <Monitor className="h-5 w-5" />;
}

export default function Sessions() {
  console.log("🔍 [SessionsPage] Component rendered");
  const { user, isLoading: authLoading } = useReduxAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication first
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['/api/auth/sessions'],
    queryFn: async () => {
      const response = await authManager.makeAuthenticatedRequest('GET', '/api/auth/sessions');
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      return response.json();
    },
    staleTime: 0, // Always consider data stale - fetch fresh data every time
    gcTime: 0, // Don't cache data in memory
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  const sessions = (sessionsData as any)?.sessions || [];

  const logoutSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await authManager.makeAuthenticatedRequest('DELETE', `/api/auth/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to logout session');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/sessions'] });
      toast({
        title: "Success",
        description: "Device logged out successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log out device",
        variant: "destructive",
      });
    },
  });

  const logoutAllOtherSessionsMutation = useMutation({
    mutationFn: async () => {
      const response = await authManager.makeAuthenticatedRequest('DELETE', '/api/auth/sessions');
      if (!response.ok) {
        throw new Error('Failed to logout all other sessions');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/sessions'] });
      toast({
        title: "Success",
        description: "All other devices logged out successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log out other devices",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-6xl mx-auto p-6">
          <div className="space-y-8">
            <div className="mb-12">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <Monitor className="text-white w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent tracking-tight">
                    Active Sessions
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                    Manage your active login sessions across different devices
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-xl">
                  <div className="p-8">
                    <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-xl w-1/3 mb-4"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentSession = sessions.find((s: Session) => s.isCurrent);
  const otherSessions = sessions.filter((s: Session) => !s.isCurrent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-6xl mx-auto p-6">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="mb-12">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <Monitor className="text-white w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent tracking-tight">
                    Active Sessions
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                    Manage your active login sessions across different devices
                  </p>
                </div>
              </div>
            </div>
            {otherSessions.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0 backdrop-blur-sm"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out All Other Devices
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Log Out All Other Devices?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will log you out from all other devices except this one. 
                      You'll need to sign in again on those devices.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => logoutAllOtherSessionsMutation.mutate()}
                      disabled={logoutAllOtherSessionsMutation.isPending}
                    >
                      {logoutAllOtherSessionsMutation.isPending ? "Logging out..." : "Log Out All"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Current Session */}
          {currentSession && (
            <div>
              <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Current Session
              </h2>
              <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/40 rounded-3xl shadow-2xl p-8 transition-all duration-300 hover:shadow-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                      {getDeviceIcon(currentSession.deviceName)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {currentSession.deviceName}
                      </h3>
                      <div className="flex items-center space-x-6 text-gray-600 dark:text-gray-300">
                        <span className="flex items-center">
                          <Globe className="h-4 w-4 mr-2" />
                          {currentSession.ipAddress}
                        </span>
                        {currentSession.location && (
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            {currentSession.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl font-semibold shadow-lg">
                    Current
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/20 dark:border-gray-700/30">
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <Clock className="h-4 w-4 mr-2" />
                    Last active {formatDistanceToNow(new Date(currentSession.lastUsed), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Sessions */}
          {otherSessions.length > 0 ? (
            <div>
              <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Other Sessions
              </h2>
              <div className="grid gap-6">
                {otherSessions.map((session: Session) => (
                  <div 
                    key={session.id} 
                    className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
                          {getDeviceIcon(session.deviceName)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                            {session.deviceName}
                          </h3>
                          <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-300 text-sm">
                            <span className="flex items-center">
                              <Globe className="h-3 w-3 mr-1" />
                              {session.ipAddress}
                            </span>
                            {session.location && (
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {session.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 transition-all duration-300 hover:scale-105"
                          >
                            <LogOut className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-gray-900 dark:text-white">Log Out Device?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                              This will log out this device: {session.deviceName}. 
                              You'll need to sign in again on that device.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => logoutSessionMutation.mutate(session.id)}
                              disabled={logoutSessionMutation.isPending}
                              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0"
                            >
                              {logoutSessionMutation.isPending ? "Logging out..." : "Log Out"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20 dark:border-gray-700/30">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Clock className="h-3 w-3 mr-2" />
                        Last active {formatDistanceToNow(new Date(session.lastUsed), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Other Sessions
              </h2>
              <div className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-xl p-8">
                <p className="text-center text-gray-600 dark:text-gray-300 text-lg">
                  No other active sessions found
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
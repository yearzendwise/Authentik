import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Smartphone, Monitor, Tablet, Globe, Clock, MapPin, LogOut } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['/api/auth/sessions'],
    staleTime: 30000, // 30 seconds
  });

  const sessions = (sessionsData as any)?.sessions || [];

  const logoutSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await apiRequest(`/api/auth/sessions/${sessionId}`, 'DELETE');
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
      await apiRequest('/api/auth/sessions', 'DELETE');
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
      <div className="container max-w-4xl mx-auto py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Active Sessions</h1>
            <p className="text-muted-foreground">
              Manage your active login sessions across different devices
            </p>
          </div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentSession = sessions.find((s: Session) => s.isCurrent);
  const otherSessions = sessions.filter((s: Session) => !s.isCurrent);

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Active Sessions</h1>
            <p className="text-muted-foreground">
              Manage your active login sessions across different devices
            </p>
          </div>
          {otherSessions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
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
            <h2 className="text-lg font-semibold mb-3">Current Session</h2>
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getDeviceIcon(currentSession.deviceName)}
                    <div>
                      <CardTitle className="text-base">{currentSession.deviceName}</CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-1">
                        <span className="flex items-center">
                          <Globe className="h-3 w-3 mr-1" />
                          {currentSession.ipAddress}
                        </span>
                        {currentSession.location && (
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {currentSession.location}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">Current</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  Last active {formatDistanceToNow(new Date(currentSession.lastUsed), { addSuffix: true })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other Sessions */}
        {otherSessions.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold mb-3">Other Sessions</h2>
            <div className="grid gap-4">
              {otherSessions.map((session: Session) => (
                <Card key={session.id}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getDeviceIcon(session.deviceName)}
                        <div>
                          <CardTitle className="text-base">{session.deviceName}</CardTitle>
                          <CardDescription className="flex items-center space-x-4 mt-1">
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
                          </CardDescription>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <LogOut className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Log Out Device?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will log out this device: {session.deviceName}. 
                              You'll need to sign in again on that device.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => logoutSessionMutation.mutate(session.id)}
                              disabled={logoutSessionMutation.isPending}
                            >
                              {logoutSessionMutation.isPending ? "Logging out..." : "Log Out"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      Last active {formatDistanceToNow(new Date(session.lastUsed), { addSuffix: true })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-3">Other Sessions</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No other active sessions found
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
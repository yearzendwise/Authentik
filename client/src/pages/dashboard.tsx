import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { authManager } from "@/lib/auth";
import { Shield, Users, Clock, TrendingUp, LogOut, RefreshCw, Settings, CreditCard, Calendar } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const logoutMutation = useLogout();
  const [tokenExpiry, setTokenExpiry] = useState<string>("--");
  const [sessionCount] = useState(3);
  const [apiRequests] = useState(1247);

  // Fetch user's subscription
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/my-subscription'],
    enabled: !!user,
  });

  // If user doesn't have subscription, redirect to subscription page
  useEffect(() => {
    if (!subscriptionLoading && !subscription) {
      setLocation('/subscribe');
    }
  }, [subscription, subscriptionLoading, setLocation]);

  useEffect(() => {
    // Token countdown simulation
    let interval: NodeJS.Timeout;
    
    const updateTokenExpiry = () => {
      const token = authManager.getAccessToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const expTime = payload.exp * 1000;
          const now = Date.now();
          const timeLeft = expTime - now;
          
          if (timeLeft > 0) {
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            setTokenExpiry(`${minutes}m ${seconds}s`);
          } else {
            setTokenExpiry("Expired");
          }
        } catch (error) {
          setTokenExpiry("Invalid");
        }
      } else {
        setTokenExpiry("No token");
      }
    };

    updateTokenExpiry();
    interval = setInterval(updateTokenExpiry, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation("/auth");
  };

  const handleRefreshToken = async () => {
    try {
      await authManager.refreshAccessToken();
    } catch (error) {
      console.error("Token refresh failed:", error);
      setLocation("/auth");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {user.firstName} {user.lastName}
            </p>
          </div>
        </div>
      </div>
        {/* Subscription Status */}
        {subscription && (
          <Card className="mb-8 border-l-4 border-l-blue-600">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Plan</p>
                  <p className="text-lg font-bold text-gray-900">{subscription.plan?.displayName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Billing</p>
                  <p className="text-sm text-gray-900">{subscription.isYearly ? 'Yearly' : 'Monthly'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Next Payment</p>
                  <p className="text-sm text-gray-900 flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              {subscription.trialEnd && new Date(subscription.trialEnd) > new Date() && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Free Trial Active:</strong> Your trial ends on {new Date(subscription.trialEnd).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Active Sessions</p>
                  <p className="text-2xl font-bold text-blue-900">{sessionCount}</p>
                </div>
                <Users className="text-blue-500 w-8 h-8" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Token Expires In</p>
                  <p className="text-2xl font-bold text-green-900">{tokenExpiry}</p>
                </div>
                <Clock className="text-green-500 w-8 h-8" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">API Requests</p>
                  <p className="text-2xl font-bold text-purple-900">{apiRequests.toLocaleString()}</p>
                </div>
                <TrendingUp className="text-purple-500 w-8 h-8" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token Management Section */}
        <Card>
          <CardHeader>
            <CardTitle>Token Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Access Token</p>
                  <p className="text-sm text-gray-600">Expires in {tokenExpiry}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefreshToken}
                className="bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Refresh Token</p>
                  <p className="text-sm text-gray-600">Expires in 7 days</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                Secure
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* User Info Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-gray-900">{user.firstName} {user.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">User ID</label>
                <p className="text-gray-900 font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Account Status</label>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

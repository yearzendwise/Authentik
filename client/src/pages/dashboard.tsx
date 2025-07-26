import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, useLogout } from "@/hooks/useAuth";
import type { UserSubscriptionResponse } from "@shared/schema";
import { authManager } from "@/lib/auth";
import { 
  Shield, 
  Users, 
  Clock, 
  TrendingUp, 
  LogOut, 
  RefreshCw, 
  Settings, 
  CreditCard, 
  Calendar,
  Zap,
  Activity,
  CheckCircle,
  AlertCircle,
  Key,
  Smartphone,
  Globe,
  User
} from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const logoutMutation = useLogout();
  const [tokenExpiry, setTokenExpiry] = useState<string>("--");
  const [sessionCount] = useState(3);
  const [apiRequests] = useState(1247);

  // Fetch user's subscription
  const { data: subscription, isLoading: subscriptionLoading } = useQuery<UserSubscriptionResponse>({
    queryKey: ['/api/my-subscription'],
    enabled: !!user,
  });

  // If user doesn't have subscription, show subscription prompt instead of hard redirect
  useEffect(() => {
    if (!subscriptionLoading && !subscription?.subscription) {
      // Only redirect if user has been on dashboard for a moment (not immediate)
      const timer = setTimeout(() => {
        setLocation('/subscribe');
      }, 1500); // Give time for auth to stabilize
      
      return () => clearTimeout(timer);
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
        <div className="flex flex-col items-center space-y-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full animate-pulse">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
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
        {subscription?.subscription && (
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Plan</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{subscription.subscription.plan?.displayName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                  <Badge variant={subscription.subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.subscription.status === 'trialing' ? 'Free Trial' : subscription.subscription.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Billing</p>
                  <p className="text-sm text-gray-900 dark:text-white">{subscription.subscription.isYearly ? 'Yearly' : 'Monthly'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {subscription.subscription.status === 'trialing' ? 'Trial Ends' : 'Next Payment'}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {subscription.subscription.status === 'trialing' && subscription.subscription.trialEnd 
                      ? new Date(subscription.subscription.trialEnd).toLocaleDateString()
                      : subscription.subscription.currentPeriodEnd 
                      ? new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
              </div>
              {subscription.subscription.status === 'trialing' && subscription.subscription.trialEnd && new Date(subscription.subscription.trialEnd) > new Date() && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>🎉 Free Trial Active:</strong> Your 14-day trial ends on {new Date(subscription.subscription.trialEnd).toLocaleDateString()}. Enjoy full access to all features!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Sessions</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{sessionCount}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Smartphone className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Token Expires In</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{tokenExpiry}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Clock className="text-green-600 dark:text-green-400 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">API Requests</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{apiRequests.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Activity className="text-purple-600 dark:text-purple-400 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="mr-2 h-5 w-5" />
              Token Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Access Token</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Expires in {tokenExpiry}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefreshToken}
                className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Refresh Token</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Expires in 7 days</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Secure
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* User Info Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p className="text-gray-900 dark:text-white">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                  <p className="text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <Key className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</label>
                  <p className="text-gray-900 dark:text-white font-mono text-sm">{user.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</label>
                  <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

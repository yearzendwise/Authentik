import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useUpdateProfile, useChangePassword, useDeleteAccount, useSetup2FA, useEnable2FA, useDisable2FA, useUpdateMenuPreference, useAuth } from "@/hooks/useAuth";
import { useReduxAuth } from "@/hooks/useReduxAuth";
import { updateProfileSchema, changePasswordSchema } from "@shared/schema";
import type { UpdateProfileData, ChangePasswordData, SubscriptionPlan, UserSubscriptionResponse } from "@shared/schema";
import { calculatePasswordStrength, getPasswordStrengthText, getPasswordStrengthColor } from "@/lib/authUtils";
import { AvatarUpload } from "@/components/AvatarUpload";
import { 
  User, 
  Lock, 
  Mail, 
  Shield, 
  ArrowLeft, 
  Save, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2,
  AlertTriangle,
  Smartphone,
  Settings,
  Menu,
  Camera,
  QrCode,
  CreditCard,
  Check,
  Star
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
}

const CheckoutForm = ({ planId, billingCycle }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Welcome to your new subscription!",
        });
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full">
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Subscribe ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`
        )}
      </Button>
    </form>
  );
};

interface SubscriptionManagementProps {
  subscription: UserSubscriptionResponse['subscription'];
  plans: SubscriptionPlan[];
  onUpgrade: (planId: string, billingCycle: 'monthly' | 'yearly') => void;
  isUpgrading: boolean;
}

const SubscriptionManagement = ({ subscription, plans, onUpgrade, isUpgrading }: SubscriptionManagementProps) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    subscription?.isYearly ? 'yearly' : 'monthly'
  );
  
  if (!subscription) return null;

  const currentPlan = subscription.plan;
  const isTrialing = subscription.status === 'trialing';
  const trialEndsAt = subscription.trialEnd ? new Date(subscription.trialEnd) : null;
  const currentPeriodEnd = new Date(subscription.currentPeriodEnd);
  const daysLeft = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  
  if (!currentPlan) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">Loading subscription details...</h2>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-8">
      {/* Current Subscription Status */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">{currentPlan.displayName}</h3>
            <p className="text-blue-700 dark:text-blue-300">{currentPlan.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              ${subscription.isYearly ? currentPlan.yearlyPrice : currentPlan.price}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              per {subscription.isYearly ? 'year' : 'month'}
            </div>
          </div>
        </div>
        
        {isTrialing && daysLeft && (
          <div className="bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded-md p-3 mb-4">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>Trial Active:</strong> {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining until {formatDate(trialEndsAt!)}
            </p>
          </div>
        )}
        
        <div className="text-sm text-blue-600 dark:text-blue-400">
          {isTrialing ? 'Trial ends' : 'Next billing'}: {formatDate(isTrialing && trialEndsAt ? trialEndsAt : currentPeriodEnd)}
        </div>
      </div>

      {/* Upgrade Options */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Available Plans</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Billing cycle:</span>
            <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">
                  Yearly
                  <Badge variant="secondary" className="ml-2">Save 20%</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans?.map((plan) => {
            const isCurrent = plan.id === currentPlan.id;
            const isUpgrade = parseFloat(plan.price) > parseFloat(currentPlan.price);
            const isDowngrade = parseFloat(plan.price) < parseFloat(currentPlan.price);

            return (
              <Card key={plan.id} className={`relative ${plan.isPopular ? 'border-primary shadow-lg' : ''} ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''}`}>
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  
                  <div className="py-4">
                    <div className="text-3xl font-bold">
                      ${billingCycle === 'yearly' ? plan.yearlyPrice : plan.price}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per {billingCycle === 'yearly' ? 'year' : 'month'}
                    </div>
                    {billingCycle === 'yearly' && plan.yearlyPrice && (
                      <div className="text-xs text-green-600 mt-1">
                        Save ${((parseFloat(plan.price) * 12) - parseFloat(plan.yearlyPrice)).toFixed(2)}/year
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <Button
                    variant={isCurrent ? "outline" : "default"}
                    className="w-full"
                    disabled={isCurrent || isUpgrading}
                    onClick={() => onUpgrade(plan.id, billingCycle)}
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : isUpgrade ? (
                      "Upgrade to This Plan"
                    ) : (
                      "Downgrade to This Plan"
                    )}
                  </Button>

                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                    <div className="space-y-1">
                      {plan.maxUsers && <div>Up to {plan.maxUsers} users</div>}
                      {plan.maxShops && <div>Up to {plan.maxShops} shops</div>}
                      {plan.maxProjects && <div>Up to {plan.maxProjects} projects</div>}
                      {plan.storageLimit && <div>{plan.storageLimit}GB storage</div>}
                      <div className="capitalize">{plan.supportLevel} support</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Need help choosing? <a href="mailto:support@example.com" className="text-primary hover:underline">Contact our support team</a></p>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useReduxAuth();
  const { hasInitialized } = useAuth();
  const { toast } = useToast();
  
  // All hooks must be called before any conditional returns
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const deleteAccountMutation = useDeleteAccount();
  const setup2FAMutation = useSetup2FA();
  const enable2FAMutation = useEnable2FA();
  const disable2FAMutation = useDisable2FA();
  const updateMenuPreferenceMutation = useUpdateMenuPreference();

  // Subscription-related state and queries
  const [clientSecret, setClientSecret] = useState("");
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPlan, setCurrentPlan] = useState<string>('');

  // Check if user already has a subscription
  const { data: userSubscription, isLoading: subscriptionLoading } = useQuery<UserSubscriptionResponse>({
    queryKey: ['/api/my-subscription'],
    enabled: hasInitialized && !!user && !authLoading && user?.role === 'Owner',
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000, // 1 minute
  });

  // Fetch subscription plans
  const { data: plans, isLoading: plansLoading, error: plansError, refetch: refetchPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      // Use direct fetch for subscription plans since it doesn't require auth
      try {
        const response = await fetch('/api/subscription-plans');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
        throw error;
      }
    },
    enabled: user?.role === 'Owner',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Only retry on network errors, not on 4xx errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) return false;
      }
      return failureCount < 3;
    }
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ planId, billingCycle }: { planId: string; billingCycle: 'monthly' | 'yearly' }) => {
      return await apiRequest({
        url: '/api/create-subscription',
        method: 'POST',
        body: { planId, billingCycle }
      });
    },
    onSuccess: (data: any) => {
      setClientSecret(data.clientSecret);
      setCurrentPlan(data.planId);
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    }
  }, queryClient);

  // Upgrade subscription mutation
  const upgradeSubscriptionMutation = useMutation({
    mutationFn: async ({ planId, billingCycle }: { planId: string; billingCycle: 'monthly' | 'yearly' }) => {
      return await apiRequest({
        url: '/api/upgrade-subscription',
        method: 'POST',
        body: { planId, billingCycle }
      });
    },
    onSuccess: () => {
      toast({
        title: "Subscription Updated",
        description: "Your subscription has been updated successfully!",
      });
      // Refetch subscription data
      queryClient.invalidateQueries({ queryKey: ['/api/my-subscription'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Error",
        description: error.message || "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
    }
  }, queryClient);

  // Subscription handler functions
  const handleSelectPlan = (planId: string, billingCycle: 'monthly' | 'yearly') => {
    createSubscriptionMutation.mutate({ planId, billingCycle });
  };

  const handleUpgrade = (planId: string, billingCycle: 'monthly' | 'yearly') => {
    upgradeSubscriptionMutation.mutate({ planId, billingCycle });
  };

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  } | null>(null);
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [disableTwoFactorToken, setDisableTwoFactorToken] = useState("");

  const profileForm = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const watchNewPassword = passwordForm.watch("newPassword");

  // Update password strength when new password changes
  useEffect(() => {
    if (watchNewPassword) {
      setPasswordStrength(calculatePasswordStrength(watchNewPassword));
    }
  }, [watchNewPassword]);

  // Redirect unauthenticated users immediately
  if (hasInitialized && !isAuthenticated) {
    setLocation('/auth');
    return null;
  }

  // Show loading while authentication is being determined
  if (!hasInitialized || authLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-4">Authenticating...</span>
        </div>
      </div>
    );
  }

  const onUpdateProfile = async (data: UpdateProfileData) => {
    await updateProfileMutation.mutateAsync(data);
  };

  const onChangePassword = async (data: ChangePasswordData) => {
    await changePasswordMutation.mutateAsync(data);
    passwordForm.reset();
  };

  const onDeleteAccount = async () => {
    await deleteAccountMutation.mutateAsync();
    setShowDeleteDialog(false);
  };

  const onSetup2FA = async () => {
    try {
      const result = await setup2FAMutation.mutateAsync();
      setTwoFactorSetup(result);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const onEnable2FA = async () => {
    if (!twoFactorToken.trim()) return;
    
    try {
      await enable2FAMutation.mutateAsync(twoFactorToken);
      setTwoFactorSetup(null);
      setTwoFactorToken("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const onDisable2FA = async () => {
    if (!disableTwoFactorToken.trim()) return;
    
    try {
      await disable2FAMutation.mutateAsync(disableTwoFactorToken);
      setDisableTwoFactorToken("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const renderPasswordStrength = () => {
    const strengthBars = Array.from({ length: 4 }, (_, index) => (
      <div
        key={index}
        className={`h-1 w-1/4 rounded ${
          index < passwordStrength
            ? passwordStrength <= 1
              ? "bg-red-400"
              : passwordStrength <= 2
              ? "bg-orange-400"
              : passwordStrength <= 3
              ? "bg-yellow-400"
              : "bg-green-400"
            : "bg-gray-200"
        }`}
      />
    ));

    return (
      <div className="mt-2">
        <div className="flex space-x-1">{strengthBars}</div>
        <p className={`text-xs mt-1 ${getPasswordStrengthColor(passwordStrength)}`}>
          Password strength: {getPasswordStrengthText(passwordStrength)}
        </p>
      </div>
    );
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-5xl mx-auto p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <User className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                Account Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your account information and security settings
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="grid w-full grid-cols-6 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30 p-1 h-auto">
            <TabsTrigger value="profile" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-blue-100 data-[state=active]:dark:from-blue-900/30 data-[state=active]:dark:to-blue-800/30 data-[state=active]:text-blue-700 data-[state=active]:dark:text-blue-300 py-3">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-50 data-[state=active]:to-green-100 data-[state=active]:dark:from-green-900/30 data-[state=active]:dark:to-green-800/30 data-[state=active]:text-green-700 data-[state=active]:dark:text-green-300 py-3">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-50 data-[state=active]:to-purple-100 data-[state=active]:dark:from-purple-900/30 data-[state=active]:dark:to-purple-800/30 data-[state=active]:text-purple-700 data-[state=active]:dark:text-purple-300 py-3">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="2fa" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-50 data-[state=active]:to-orange-100 data-[state=active]:dark:from-orange-900/30 data-[state=active]:dark:to-orange-800/30 data-[state=active]:text-orange-700 data-[state=active]:dark:text-orange-300 py-3">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">2FA</span>
            </TabsTrigger>
            {user?.role === 'Owner' && (
              <TabsTrigger value="subscription" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-50 data-[state=active]:to-indigo-100 data-[state=active]:dark:from-indigo-900/30 data-[state=active]:dark:to-indigo-800/30 data-[state=active]:text-indigo-700 data-[state=active]:dark:text-indigo-300 py-3">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Subscription</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="danger" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-50 data-[state=active]:to-red-100 data-[state=active]:dark:from-red-900/30 data-[state=active]:dark:to-red-800/30 data-[state=active]:text-red-700 data-[state=active]:dark:text-red-300 py-3">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Danger</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/30 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-gray-900 dark:text-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center space-y-4 pb-8 border-b border-blue-200/50 dark:border-blue-700/30">
                    <div className="relative">
                      <AvatarUpload
                        currentAvatarUrl={user?.avatarUrl}
                        userEmail={user?.email}
                        size="lg"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Click to update your profile picture</p>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                          <User className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          className="bg-white/50 dark:bg-gray-700/50 border-blue-200 dark:border-blue-700/50 focus:border-blue-500 dark:focus:border-blue-400 h-11"
                          {...profileForm.register("firstName")}
                        />
                        {profileForm.formState.errors.firstName && (
                          <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                            {profileForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                          <User className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          className="bg-white/50 dark:bg-gray-700/50 border-blue-200 dark:border-blue-700/50 focus:border-blue-500 dark:focus:border-blue-400 h-11"
                          {...profileForm.register("lastName")}
                        />
                        {profileForm.formState.errors.lastName && (
                          <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                            {profileForm.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
                        Email Address
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@company.com"
                          className="pl-11 bg-white/50 dark:bg-gray-700/50 border-blue-200 dark:border-blue-700/50 focus:border-blue-500 dark:focus:border-blue-400 h-11"
                          {...profileForm.register("email")}
                        />
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 dark:text-blue-300 w-4 h-4" />
                      </div>
                      {profileForm.formState.errors.email && (
                        <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                          {profileForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end pt-6">
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white shadow-lg px-6 h-11"
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </Button>
                    </div>
                </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-green-200/50 dark:border-green-700/30 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-gray-900 dark:text-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-400 dark:to-green-500 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <span>Application Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Menu Display Preference */}
                  <div className="bg-green-50/50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-700/30 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <Menu className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <Label className="text-base font-medium text-gray-800 dark:text-gray-200">Expanded Navigation Menu</Label>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 ml-8">
                          Show navigation menu expanded by default with labels visible
                        </p>
                      </div>
                      <Switch
                        checked={user?.menuExpanded || false}
                        onCheckedChange={(checked) => {
                          // Update localStorage immediately for instant UI feedback
                          localStorage.setItem('menuExpanded', JSON.stringify(checked));
                          
                          // Dispatch custom event for immediate UI update in same tab
                          window.dispatchEvent(new CustomEvent('menuPreferenceChanged', { 
                            detail: { menuExpanded: checked } 
                          }));
                          
                          // Update backend preference
                          updateMenuPreferenceMutation.mutate({ menuExpanded: checked });
                        }}
                        disabled={updateMenuPreferenceMutation.isPending}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-purple-200/50 dark:border-purple-700/30 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-gray-900 dark:text-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <span>Change Password</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Lock className="w-4 h-4 mr-2 text-purple-500 dark:text-purple-400" />
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        className="pl-11 pr-11 bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-700/50 focus:border-purple-500 dark:focus:border-purple-400 h-11"
                        {...passwordForm.register("currentPassword")}
                      />
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 dark:text-purple-300 w-4 h-4" />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-400 dark:text-purple-300 hover:text-purple-600 dark:hover:text-purple-200 transition-colors"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Lock className="w-4 h-4 mr-2 text-purple-500 dark:text-purple-400" />
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        className="pl-11 pr-11 bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-700/50 focus:border-purple-500 dark:focus:border-purple-400 h-11"
                        {...passwordForm.register("newPassword")}
                      />
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 dark:text-purple-300 w-4 h-4" />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-400 dark:text-purple-300 hover:text-purple-600 dark:hover:text-purple-200 transition-colors"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                    {renderPasswordStrength()}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Lock className="w-4 h-4 mr-2 text-purple-500 dark:text-purple-400" />
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        className="pl-11 pr-11 bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-700/50 focus:border-purple-500 dark:focus:border-purple-400 h-11"
                        {...passwordForm.register("confirmPassword")}
                      />
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 dark:text-purple-300 w-4 h-4" />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-400 dark:text-purple-300 hover:text-purple-600 dark:hover:text-purple-200 transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end pt-6">
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-500 dark:to-purple-600 dark:hover:from-purple-600 dark:hover:to-purple-700 text-white shadow-lg px-6 h-11"
                    >
                      {changePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Changing...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Change Password</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Two-Factor Authentication Tab */}
          <TabsContent value="2fa">
            <Card className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-orange-200/50 dark:border-orange-700/30 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-gray-900 dark:text-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-500 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <span>Two-Factor Authentication</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user?.twoFactorEnabled ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/30 rounded-xl p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">2FA is enabled</h3>
                          <p className="text-sm text-green-700 dark:text-green-400">Your account is protected with two-factor authentication</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50/50 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-700/30 rounded-lg p-6 space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                        <Lock className="w-4 h-4 mr-2 text-orange-500 dark:text-orange-400" />
                        Disable Two-Factor Authentication
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enter a code from your authenticator app to disable 2FA protection
                      </p>
                      <div className="flex items-center space-x-3">
                        <Input
                          type="text"
                          placeholder="000000"
                          maxLength={6}
                          value={disableTwoFactorToken}
                          onChange={(e) => setDisableTwoFactorToken(e.target.value)}
                          className="w-32 text-center font-mono bg-white/70 dark:bg-gray-700/50 border-orange-200 dark:border-orange-700/50 focus:border-orange-500 dark:focus:border-orange-400 h-11"
                        />
                        <Button
                          onClick={onDisable2FA}
                          disabled={disable2FAMutation.isPending || !disableTwoFactorToken.trim()}
                          variant="destructive"
                          className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg px-4 h-11"
                        >
                          {disable2FAMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Disabling...</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              <span>Disable 2FA</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200/50 dark:border-yellow-700/30 rounded-xl p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">2FA is disabled</h3>
                          <p className="text-sm text-yellow-700 dark:text-yellow-400">Add an extra layer of security to your account</p>
                        </div>
                      </div>
                    </div>

                    {!twoFactorSetup ? (
                      <div className="bg-orange-50/50 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-700/30 rounded-lg p-6 space-y-4">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-orange-500 dark:text-orange-400" />
                          Enable Two-Factor Authentication
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Two-factor authentication adds an extra layer of security to your account by requiring a code from your phone in addition to your password.
                        </p>
                        <Button
                          onClick={onSetup2FA}
                          disabled={setup2FAMutation.isPending}
                          className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 dark:from-orange-500 dark:to-orange-600 dark:hover:from-orange-600 dark:hover:to-orange-700 text-white shadow-lg px-6 h-11"
                        >
                          {setup2FAMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Setting up...</span>
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4" />
                              <span>Set up 2FA</span>
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="bg-orange-50/50 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-700/30 rounded-lg p-6">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                            <QrCode className="w-4 h-4 mr-2 text-orange-500 dark:text-orange-400" />
                            Step 1: Scan QR Code
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                          </p>
                          <div className="flex justify-center">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                              <img 
                                src={twoFactorSetup.qrCode} 
                                alt="2FA QR Code" 
                                className="w-48 h-48 rounded-lg"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-orange-50/50 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-700/30 rounded-lg p-6">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                            <Lock className="w-4 h-4 mr-2 text-orange-500 dark:text-orange-400" />
                            Step 2: Enter Verification Code
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Enter the 6-digit code from your authenticator app to complete setup
                          </p>
                          <div className="flex items-center space-x-3">
                            <Input
                              type="text"
                              placeholder="000000"
                              maxLength={6}
                              value={twoFactorToken}
                              onChange={(e) => setTwoFactorToken(e.target.value)}
                              className="w-32 text-center font-mono bg-white/70 dark:bg-gray-700/50 border-orange-200 dark:border-orange-700/50 focus:border-orange-500 dark:focus:border-orange-400 h-11"
                            />
                            <Button
                              onClick={onEnable2FA}
                              disabled={enable2FAMutation.isPending || !twoFactorToken.trim()}
                              className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 dark:from-orange-500 dark:to-orange-600 dark:hover:from-orange-600 dark:hover:to-orange-700 text-white shadow-lg px-6 h-11"
                            >
                              {enable2FAMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Enabling...</span>
                                </>
                              ) : (
                                <>
                                  <Shield className="w-4 h-4" />
                                  <span>Enable 2FA</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setTwoFactorSetup(null);
                              setTwoFactorToken("");
                            }}
                            className="bg-white/50 dark:bg-gray-700/50 border-orange-200 dark:border-orange-700/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-6 h-11"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab - Only for Owner */}
          {user?.role === 'Owner' && (
            <TabsContent value="subscription">
              <Card className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-700/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-gray-900 dark:text-gray-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <span>Subscription Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Show loading state */}
                  {subscriptionLoading || plansLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="ml-4">Loading subscription details...</span>
                    </div>
                  ) : plansError ? (
                    <div className="text-center py-8">
                      <p className="text-red-600 dark:text-red-400 mb-4">
                        Failed to load subscription plans. Please try again.
                      </p>
                      <Button onClick={() => refetchPlans()} variant="outline">
                        Retry
                      </Button>
                    </div>
                  ) : clientSecret && currentPlan ? (
                    /* Show checkout form if payment is in progress */
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Complete Your Subscription</h3>
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm 
                          planId={currentPlan} 
                          billingCycle={billingCycle}
                        />
                      </Elements>
                    </div>
                  ) : userSubscription?.subscription ? (
                    /* Show subscription management for existing subscribers */
                    <SubscriptionManagement
                      subscription={userSubscription.subscription}
                      plans={plans || []}
                      onUpgrade={handleUpgrade}
                      isUpgrading={upgradeSubscriptionMutation.isPending}
                    />
                  ) : (
                    /* Show plan selection for new users */
                    <div className="space-y-8">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold mb-4">Choose Your Plan</h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                          Start with a 14-day free trial. No credit card required. Cancel anytime.
                        </p>
                      </div>

                      <div className="flex justify-center">
                        <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="monthly">Monthly</TabsTrigger>
                            <TabsTrigger value="yearly">
                              Yearly
                              <Badge variant="secondary" className="ml-2">Save 20%</Badge>
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans?.map((plan) => (
                          <Card key={plan.id} className={`relative ${plan.isPopular ? 'border-primary shadow-lg' : ''}`}>
                            {plan.isPopular && (
                              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                                  <Star className="w-3 h-3 mr-1" />
                                  Most Popular
                                </Badge>
                              </div>
                            )}
                            
                            <CardHeader className="text-center pb-4">
                              <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                              <CardDescription className="text-sm">{plan.description}</CardDescription>
                              
                              <div className="py-4">
                                <div className="text-3xl font-bold">
                                  ${billingCycle === 'yearly' ? plan.yearlyPrice : plan.price}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  per {billingCycle === 'yearly' ? 'year' : 'month'}
                                </div>
                                {billingCycle === 'yearly' && plan.yearlyPrice && (
                                  <div className="text-xs text-green-600 mt-1">
                                    Save ${((parseFloat(plan.price) * 12) - parseFloat(plan.yearlyPrice)).toFixed(2)}/year
                                  </div>
                                )}
                              </div>
                            </CardHeader>
                            
                            <CardContent className="space-y-4">
                              <Button
                                className="w-full"
                                disabled={createSubscriptionMutation.isPending}
                                onClick={() => handleSelectPlan(plan.id, billingCycle)}
                              >
                                {createSubscriptionMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Setting up...
                                  </>
                                ) : (
                                  `Start ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} Plan`
                                )}
                              </Button>

                              <ul className="space-y-2">
                                {plan.features.map((feature, index) => (
                                  <li key={index} className="flex items-center text-sm">
                                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>

                              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                                <div className="space-y-1">
                                  {plan.maxUsers && <div>Up to {plan.maxUsers} users</div>}
                                  {plan.maxShops && <div>Up to {plan.maxShops} shops</div>}
                                  {plan.maxProjects && <div>Up to {plan.maxProjects} projects</div>}
                                  {plan.storageLimit && <div>{plan.storageLimit}GB storage</div>}
                                  <div className="capitalize">{plan.supportLevel} support</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="text-center text-sm text-muted-foreground">
                        <p>Need help choosing? <a href="mailto:support@example.com" className="text-primary hover:underline">Contact our support team</a></p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Danger Zone Tab */}
          <TabsContent value="danger">
            <Card className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-red-200/50 dark:border-red-700/30 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-gray-900 dark:text-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <span>Danger Zone</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200/50 dark:border-red-700/30 rounded-xl p-8">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                      <Trash2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-red-800 dark:text-red-300 mb-2">Delete Account</h3>
                        <p className="text-red-700 dark:text-red-400 leading-relaxed">
                          Once you delete your account, there is no going back. This will permanently deactivate your account and remove all your data including your profile, settings, and all associated information.
                        </p>
                      </div>
                      <div className="pt-2">
                        <Button
                          variant="destructive"
                          onClick={() => setShowDeleteDialog(true)}
                          disabled={deleteAccountMutation.isPending}
                          className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 dark:from-red-500 dark:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700 text-white shadow-lg px-6 h-11"
                        >
                          {deleteAccountMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Deleting...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              <span>Delete Account</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Account Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <span>Delete Account</span>
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDeleteAccount}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                Yes, delete my account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useUpdateProfile, useChangePassword, useDeleteAccount, useSetup2FA, useEnable2FA, useDisable2FA, useUpdateMenuPreference, useAuth } from "@/hooks/useAuth";
import { useReduxAuth } from "@/hooks/useReduxAuth";
import { updateProfileSchema, changePasswordSchema } from "@shared/schema";
import type { UpdateProfileData, ChangePasswordData } from "@shared/schema";
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
  QrCode
} from "lucide-react";
import { useLocation, Link } from "wouter";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useReduxAuth();
  const { hasInitialized } = useAuth();
  
  // All hooks must be called before any conditional returns
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const deleteAccountMutation = useDeleteAccount();
  const setup2FAMutation = useSetup2FA();
  const enable2FAMutation = useEnable2FA();
  const disable2FAMutation = useDisable2FA();
  const updateMenuPreferenceMutation = useUpdateMenuPreference();

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
          <TabsList className="grid w-full grid-cols-5 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30 p-1 h-auto">
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
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-500 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600 data-[state=checked]:shadow-lg data-[state=checked]:shadow-green-500/25 scale-125 transition-all duration-300 ease-in-out transform hover:scale-130 data-[state=checked]:ring-2 data-[state=checked]:ring-green-400/50 data-[state=checked]:ring-offset-2 data-[state=checked]:ring-offset-white dark:data-[state=checked]:ring-offset-gray-800"
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
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLogin, useRegister, useForgotPassword } from "@/hooks/useAuth";
import { loginSchema, registerSchema, forgotPasswordSchema } from "@shared/schema";
import type { LoginCredentials, RegisterData, ForgotPasswordData } from "@shared/schema";
import { calculatePasswordStrength, getPasswordStrengthText, getPasswordStrengthColor } from "@/lib/authUtils";
import { Eye, EyeOff, Shield, CheckCircle, Mail, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

type AuthView = "login" | "register" | "forgot" | "twoFactor";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [currentView, setCurrentView] = useState<AuthView>("login");
  
  // Check URL parameters for free trial
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('plan');
  const billingCycle = urlParams.get('cycle');
  const isTrial = urlParams.get('trial') === 'true';
  
  useEffect(() => {
    if (isTrial && planId) {
      setCurrentView("register");
    }
  }, [isTrial, planId]);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{
    email: string;
    password: string;
    tempLoginId: string;
  } | null>(null);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const forgotPasswordMutation = useForgotPassword();

  const loginForm = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      confirmPassword: "",
    },
  });

  // Handle free trial registration
  const handleFreeTrialRegister = async (data: RegisterData) => {
    if (planId && billingCycle) {
      try {
        const response = await fetch('/api/free-trial-signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            planId,
            billingCycle,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          alert('Account created successfully! Please check your email for verification.');
          setLocation('/pending-verification');
        } else {
          const error = await response.json();
          alert('Error: ' + error.message);
        }
      } catch (error) {
        alert('Error creating account. Please try again.');
      }
    } else {
      // Regular registration
      registerMutation.mutate(data);
    }
  };

  const forgotForm = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const twoFactorForm = useForm<{ token: string }>({
    defaultValues: {
      token: "",
    },
  });

  const watchPassword = registerForm.watch("password");

  useEffect(() => {
    if (watchPassword) {
      setPasswordStrength(calculatePasswordStrength(watchPassword));
    }
  }, [watchPassword]);

  const onLogin = async (data: LoginCredentials) => {
    try {
      const result = await loginMutation.mutateAsync(data);
      if ('requires2FA' in result) {
        setTwoFactorData({
          email: data.email,
          password: data.password,
          tempLoginId: result.tempLoginId,
        });
        setCurrentView("twoFactor");
      } else {
        // Check if email verification is required
        if (result.emailVerificationRequired) {
          setLocation("/pending-verification");
        } else {
          setLocation("/");
        }
      }
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  const onRegister = async (data: RegisterData) => {
    const result = await registerMutation.mutateAsync(data);
    if (result) {
      setCurrentView("login");
      loginForm.setValue("email", data.email);
    }
  };

  const onForgotPassword = async (data: ForgotPasswordData) => {
    await forgotPasswordMutation.mutateAsync(data.email);
  };

  const onTwoFactorSubmit = async (data: { token: string }) => {
    if (!twoFactorData) return;
    
    try {
      const result = await loginMutation.mutateAsync({
        email: twoFactorData.email,
        password: twoFactorData.password,
        twoFactorToken: data.token,
      });
      
      if (!('requires2FA' in result)) {
        // Check if email verification is required
        if (result.emailVerificationRequired) {
          setLocation("/pending-verification");
        } else {
          setLocation("/");
        }
      }
    } catch (error) {
      // Error is handled by the mutation's onError
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
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-40 right-20 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white rounded-full"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Shield className="text-blue-600 w-6 h-6" />
            </div>
            <span className="text-white text-xl font-bold">SecureAuth</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Enterprise-grade authentication for modern SaaS applications
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Secure JWT token management, automatic refresh handling, and comprehensive session management built for scale.
          </p>
        </div>

        <div className="relative z-10">
          <div className="grid grid-cols-2 gap-6 text-white">
            <div className="flex items-center space-x-3">
              <CheckCircle className="text-green-300 w-5 h-5" />
              <span className="text-sm">Advanced Security</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="text-green-300 w-5 h-5" />
              <span className="text-sm">Token Management</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="text-green-300 w-5 h-5" />
              <span className="text-sm">Session Control</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="text-green-300 w-5 h-5" />
              <span className="text-sm">Enterprise Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Authentication Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Tab Navigation */}
          {currentView !== "forgot" && (
            <div className="mb-8">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                    currentView === "login"
                      ? "text-blue-600 bg-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setCurrentView("login")}
                >
                  Sign In
                </button>
                <button
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                    currentView === "register"
                      ? "text-blue-600 bg-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setCurrentView("register")}
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}

          <Card className="shadow-lg border border-gray-100">
            <CardContent className="p-8">
              {/* Login Form */}
              {currentView === "login" && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
                    <p className="text-gray-600">Sign in to your account to continue</p>
                  </div>

                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email address</Label>
                      <div className="relative mt-2">
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-11"
                          {...loginForm.register("email")}
                        />
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>
                      {loginForm.formState.errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative mt-2">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-11 pr-11"
                          {...loginForm.register("password")}
                        />
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-red-500 text-sm mt-1">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked === true)}
                        />
                        <Label htmlFor="remember" className="text-sm text-gray-600">
                          Remember me
                        </Label>
                      </div>
                      <button
                        type="button"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        onClick={() => setCurrentView("forgot")}
                      >
                        Forgot password?
                      </button>
                    </div>

                    <Button
                      type="submit"
                      className="w-full mt-6"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {/* Register Form */}
              {currentView === "register" && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Create account</h2>
                    <p className="text-gray-600">Get started with your free account</p>
                  </div>

                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          className="mt-2"
                          {...registerForm.register("firstName")}
                        />
                        {registerForm.formState.errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">
                            {registerForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          className="mt-2"
                          {...registerForm.register("lastName")}
                        />
                        {registerForm.formState.errors.lastName && (
                          <p className="text-red-500 text-sm mt-1">
                            {registerForm.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="registerEmail">Email address</Label>
                      <div className="relative mt-2">
                        <Input
                          id="registerEmail"
                          type="email"
                          placeholder="john@company.com"
                          className="pl-11"
                          {...registerForm.register("email")}
                        />
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>
                      {registerForm.formState.errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="registerPassword">Password</Label>
                      <div className="relative mt-2">
                        <Input
                          id="registerPassword"
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          className="pl-11 pr-11"
                          {...registerForm.register("password")}
                        />
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        >
                          {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="text-red-500 text-sm mt-1">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                      {renderPasswordStrength()}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm password</Label>
                      <div className="relative mt-2">
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          className="pl-11"
                          {...registerForm.register("confirmPassword")}
                        />
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">
                          {registerForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox id="terms" required />
                      <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                        I agree to the{" "}
                        <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                          Privacy Policy
                        </a>
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full mt-6"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {/* Forgot Password Form */}
              {currentView === "forgot" && (
                <div>
                  <div className="mb-6">
                    <button
                      className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
                      onClick={() => setCurrentView("login")}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to sign in
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset password</h2>
                    <p className="text-gray-600">Enter your email and we'll send you a reset link</p>
                  </div>

                  <form onSubmit={forgotForm.handleSubmit(onForgotPassword)} className="space-y-4">
                    <div>
                      <Label htmlFor="resetEmail">Email address</Label>
                      <div className="relative mt-2">
                        <Input
                          id="resetEmail"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-11"
                          {...forgotForm.register("email")}
                        />
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>
                      {forgotForm.formState.errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                          {forgotForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full mt-6"
                      disabled={forgotPasswordMutation.isPending}
                    >
                      {forgotPasswordMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {/* Two-Factor Authentication Form */}
              {currentView === "twoFactor" && (
                <div>
                  <div className="mb-6">
                    <button
                      onClick={() => {
                        setCurrentView("login");
                        setTwoFactorData(null);
                      }}
                      className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to login
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h2>
                    <p className="text-gray-600">Enter the 6-digit code from your authenticator app</p>
                  </div>

                  <form onSubmit={twoFactorForm.handleSubmit(onTwoFactorSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="twoFactorToken">Authentication Code</Label>
                      <div className="relative mt-2">
                        <Input
                          id="twoFactorToken"
                          type="text"
                          placeholder="000000"
                          maxLength={6}
                          className="text-center text-xl tracking-widest font-mono"
                          {...twoFactorForm.register("token", {
                            required: "Authentication code is required",
                            pattern: {
                              value: /^\d{6}$/,
                              message: "Please enter a valid 6-digit code"
                            }
                          })}
                        />
                        <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>
                      {twoFactorForm.formState.errors.token && (
                        <p className="text-red-500 text-sm mt-1">
                          {twoFactorForm.formState.errors.token.message}
                        </p>
                      )}
                    </div>

                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Open your authenticator app (Google Authenticator, Authy, etc.) and enter the 6-digit code for SecureAuth.
                      </AlertDescription>
                    </Alert>

                    <Button
                      type="submit"
                      className="w-full mt-6"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify & Sign In"
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

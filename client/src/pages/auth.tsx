import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRegister, useForgotPassword } from "@/hooks/useAuth";
import { useAppDispatch, useAppSelector, store } from "@/store";
import { login, clearError } from "@/store/authSlice";
import { loginSchema, registerSchema, forgotPasswordSchema } from "@shared/schema";
import type { LoginCredentials, RegisterData, ForgotPasswordData } from "@shared/schema";
import { calculatePasswordStrength, getPasswordStrengthText, getPasswordStrengthColor } from "@/lib/authUtils";
import { Eye, EyeOff, Shield, CheckCircle, Mail, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";

type AuthView = "login" | "register" | "forgot" | "twoFactor";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [currentView, setCurrentView] = useState<AuthView>("login");
  
  // Removed free trial URL parameter logic for simplified flow
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{
    email: string;
    password: string;
    tempLoginId: string;
  } | null>(null);

  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);
  const { isLoading: isLoginLoading, isAuthenticated } = authState;
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

  // Simplified registration - always use regular registration
  const handleRegister = (data: RegisterData) => {
    registerMutation.mutate(data);
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

  // Redirect to dashboard when authenticated
  useEffect(() => {
    console.log("🔍 Auth page - Redux auth state:", authState);
    console.log("🔍 Auth page - isAuthenticated:", isAuthenticated);
    if (isAuthenticated) {
      console.log("✅ User is authenticated, redirecting to dashboard from useEffect");
      setLocation("/dashboard");
      // Double check with timeout
      setTimeout(() => {
        if (window.location.pathname !== "/dashboard") {
          console.log("🔄 Redirect didn't work, forcing navigation");
          window.location.href = "/dashboard";
        }
      }, 100);
    }
  }, [isAuthenticated, authState, setLocation]);

  const onLogin = async (data: LoginCredentials) => {
    console.log("🚀 onLogin called with data:", data);
    try {
      const loginData = { ...data, tenantSlug: "default" };
      console.log("🔐 Dispatching login action...", loginData);
      const result = await dispatch(login(loginData));
      console.log("🔐 Login action result:", result);
      console.log("🔐 Result type:", result.type);
      console.log("🔐 Result payload:", result.payload);
      console.log("🔐 Result meta:", result.meta);
      
      if (login.fulfilled.match(result)) {
        console.log("✅ Login successful!");
        console.log("✅ User data received:", result.payload);
        console.log("Current auth state after login:", isAuthenticated);
        console.log("Full Redux auth state:", authState);
        // Show success toast
        toast({
          title: "Login Successful",
          description: "Welcome back! Redirecting to dashboard...",
        });
        // Wait a moment for state to update, then force redirect if needed
        setTimeout(() => {
          const currentAuthState = store.getState().auth;
          console.log("🔍 Checking auth state after delay:", currentAuthState);
          if (currentAuthState.isAuthenticated) {
            console.log("✅ State updated, redirecting now");
            setLocation("/dashboard");
          } else {
            console.log("❌ State not updated yet, forcing redirect");
            window.location.href = "/dashboard";
          }
        }, 500);
      } else if (login.rejected.match(result)) {
        console.error("❌ Login rejected:", result.payload);
        toast({
          title: "Login Failed", 
          description: result.payload as string || "Invalid credentials",
          variant: "destructive",
        });
      } else {
        console.log("🤔 Unexpected result:", result);
      }
    } catch (error) {
      console.error("💥 Login error:", error);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
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
      const loginData = {
        email: twoFactorData.email,
        password: twoFactorData.password,
        tenantSlug: "default",
        totpCode: data.token,
      };
      
      console.log("🔐 Dispatching 2FA login action...", loginData);
      const result = await dispatch(login(loginData));
      console.log("🔐 2FA Login action result:", result);
      
      if (result.type === 'auth/login/fulfilled') {
        console.log("✅ 2FA Login successful, redirecting to dashboard...");
        setLocation("/dashboard");
      } else if (result.type === 'auth/login/rejected') {
        console.error("❌ 2FA Login failed:", result.payload);
      } else {
        console.log("🤔 Unexpected 2FA result type:", result.type);
      }
    } catch (error) {
      console.error("💥 2FA Login error:", error);
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

                  <form onSubmit={(e) => {
                    console.log("📝 Form submit event triggered");
                    e.preventDefault();
                    console.log("Form validation state:", loginForm.formState.isValid);
                    console.log("Form errors:", loginForm.formState.errors);
                    loginForm.handleSubmit(onLogin, (errors) => {
                      console.error("Form validation failed:", errors);
                    })(e);
                  }} className="space-y-4">
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
                      disabled={isLoginLoading}
                      onClick={(e) => {
                        console.log("🔘 Button clicked!");
                        console.log("Form errors:", loginForm.formState.errors);
                        console.log("Form values:", loginForm.getValues());
                      }}
                    >
                      {isLoginLoading ? (
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

                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
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
                      disabled={isLoginLoading}
                    >
                      {isLoginLoading ? (
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

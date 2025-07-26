import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { authManager } from "@/lib/auth";
import { useEffect } from "react";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import ProfilePage from "@/pages/profile";
import SessionsPage from "@/pages/sessions";
import UsersPage from "@/pages/users";
import FormsPage from "@/pages/forms";
import Subscribe from "@/pages/subscribe";
import VerifyEmailPage from "@/pages/verify-email";
import PendingVerificationPage from "@/pages/pending-verification";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading state during authentication initialization
  // This prevents flash of login screen when user is actually authenticated
  // Also wait a bit longer for authentication to stabilize
  if (isLoading || (authManager.isAuthenticated() && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only determine email verification status if we have a user object
  const isEmailVerified = user ? user.emailVerified : undefined;

  return (
    <Switch>
      {isAuthenticated && isEmailVerified === true ? (
        <AppLayout>
          <Switch>
            <Route path="/" component={Dashboard} /> {/* Dashboard will handle subscription redirects */}
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/forms/:rest*" component={FormsPage} />
            <Route path="/forms" component={FormsPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/sessions" component={SessionsPage} />
            <Route path="/users" component={UsersPage} />
            <Route path="/subscribe" component={Subscribe} />
            <Route path="/auth" component={Dashboard} /> {/* Redirect logged-in users to dashboard */}
            <Route path="/pending-verification" component={Dashboard} /> {/* Redirect verified users to dashboard */}
          </Switch>
        </AppLayout>
      ) : isAuthenticated && isEmailVerified === false ? (
        <>
          <Route path="/" component={PendingVerificationPage} />
          <Route path="/pending-verification" component={PendingVerificationPage} />
          <Route path="/verify-email" component={VerifyEmailPage} />
          <Route path="/auth" component={PendingVerificationPage} /> {/* Redirect unverified users to pending */}
          {/* Redirect protected routes to pending verification */}
          <Route path="/dashboard" component={PendingVerificationPage} />
          <Route path="/profile" component={PendingVerificationPage} />
          <Route path="/sessions" component={PendingVerificationPage} />
          <Route path="/users" component={PendingVerificationPage} />
        </>
      ) : (
        <>
          <Route path="/" component={AuthPage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/verify-email" component={VerifyEmailPage} />
          {/* Redirect any other route to auth for unauthenticated users */}
          <Route path="/dashboard" component={AuthPage} />
          <Route path="/profile" component={AuthPage} />
          <Route path="/sessions" component={AuthPage} />
          <Route path="/pending-verification" component={AuthPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize automatic token refresh on app start
  useEffect(() => {
    console.log("Initializing authentication system...");
    authManager.initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

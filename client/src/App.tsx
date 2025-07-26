import { Switch, Route } from "wouter";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { store, persistor } from "@/store";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useReduxAuth } from "@/hooks/useReduxAuth";
import { AppLayout } from "@/components/AppLayout";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import ProfilePage from "@/pages/profile";
import SessionsPage from "@/pages/sessions";
import UsersPage from "@/pages/users";
import CompaniesPage from "@/pages/companies";
import FormsPage from "@/pages/forms";
import Subscribe from "@/pages/subscribe";
import VerifyEmailPage from "@/pages/verify-email";
import PendingVerificationPage from "@/pages/pending-verification";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user, isInitialized } = useReduxAuth();

  console.log("🔍 [Redux] Router state:", {
    isAuthenticated,
    isLoading,
    hasUser: !!user,
    isInitialized,
  });

  // Show loading state while authentication is being determined
  if (isLoading && !isInitialized) {
    console.log(
      "📱 [Redux] Showing loading screen - authentication in progress",
    );
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log("🚀 [Redux] Authentication check complete, determining route");

  // Only determine email verification status if we have a user object
  const isEmailVerified = user ? user.emailVerified : undefined;

  return (
    <Switch>
      {isAuthenticated && isEmailVerified === true ? (
        <AppLayout>
          <Switch>
            <Route path="/" component={Dashboard} />{" "}
            {/* Dashboard will handle subscription redirects */}
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/companies" component={CompaniesPage} />
            <Route path="/forms/:rest*" component={FormsPage} />
            <Route path="/forms" component={FormsPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/sessions" component={SessionsPage} />
            <Route path="/users" component={UsersPage} />
            <Route path="/subscribe" component={Subscribe} />
            <Route path="/auth" component={Dashboard} />{" "}
            {/* Redirect logged-in users to dashboard */}
            <Route path="/pending-verification" component={Dashboard} />{" "}
            {/* Redirect verified users to dashboard */}
          </Switch>
        </AppLayout>
      ) : isAuthenticated && isEmailVerified === false ? (
        <>
          <Route path="/" component={PendingVerificationPage} />
          <Route
            path="/pending-verification"
            component={PendingVerificationPage}
          />
          <Route path="/verify-email" component={VerifyEmailPage} />
          <Route path="/auth" component={PendingVerificationPage} />{" "}
          {/* Redirect unverified users to pending */}
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
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }
        persistor={persistor}
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;

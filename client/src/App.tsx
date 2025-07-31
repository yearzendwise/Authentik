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
import { ThemeProvider } from "@/contexts/ThemeContext";
import { lazy, Suspense } from "react";

// Lazy load components for code splitting
const AuthPage = lazy(() => import("@/pages/auth"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const SessionsPage = lazy(() => import("@/pages/sessions"));
const UsersPage = lazy(() => import("@/pages/users"));
const TableExamplePage = lazy(() => import("@/pages/table-example"));
const CompanyPage = lazy(() => import("@/pages/company"));
const ShopsPage = lazy(() => import("@/pages/shops"));
const NewShopPage = lazy(() => import("@/pages/shops/new"));
const ShopDetailsPage = lazy(() => import("@/pages/shops/$id"));
const EditShopPage = lazy(() => import("@/pages/shops/$id.edit"));
const FormsPage = lazy(() => import("@/pages/forms"));
const FormsAddPage = lazy(() => import("@/pages/forms/add"));
const Subscribe = lazy(() => import("@/pages/subscribe"));
const VerifyEmailPage = lazy(() => import("@/pages/verify-email"));
const PendingVerificationPage = lazy(() => import("@/pages/pending-verification"));
const NotFound = lazy(() => import("@/pages/not-found"));
const CampaignsPage = lazy(() => import("@/pages/campaigns").then(module => ({ default: module.CampaignsPage })));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);


function Router() {
  const { isAuthenticated, isLoading, user, isInitialized } = useReduxAuth();

  console.log("🔍 [Redux] Router state:", {
    isAuthenticated,
    isLoading,
    hasUser: !!user,
    isInitialized,
    userEmail: user?.email,
    userEmailVerified: user?.emailVerified,
    userRole: user?.role
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

  console.log("🔍 [Router] Route determination:", {
    isAuthenticated,
    isEmailVerified,
    currentPath: window.location.pathname,
    currentSearch: window.location.search
  });
  
  // Debug: Log when routes are being rendered
  console.log("🚀 [Router] Rendering routes for authenticated:", isAuthenticated, "emailVerified:", isEmailVerified);

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {isAuthenticated && isEmailVerified === true ? (
          <AppLayout>
            <Switch>
              <Route path="/" component={Dashboard} />{" "}
              {/* Dashboard will handle subscription redirects */}
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/company" component={CompanyPage} />
              <Route path="/campaigns" component={CampaignsPage} />
              <Route path="/shops" component={ShopsPage} />
              <Route path="/shops/new" component={NewShopPage} />
              <Route path="/shops/:id" component={ShopDetailsPage} />
              <Route path="/shops/:id/edit" component={EditShopPage} />
              <Route path="/forms" component={FormsPage} />
              <Route path="/forms/add" component={FormsAddPage} />
              <Route path="/profile" component={ProfilePage} />
              <Route path="/sessions" component={SessionsPage} />
              <Route path="/users" component={UsersPage} />
              <Route path="/table-example" component={TableExamplePage} />
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
    </Suspense>
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
            <ThemeProvider>
              <Toaster />
              <Router />
            </ThemeProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;

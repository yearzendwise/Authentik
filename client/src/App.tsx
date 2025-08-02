import { Switch, Route, useLocation } from "wouter";
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
import { lazy, Suspense, useEffect } from "react";

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
const EmailContactsPage = lazy(() => import("@/pages/email-contacts"));
const NewEmailContactPage = lazy(() => import("@/pages/email-contacts/new"));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Content loader for pages within AppLayout
const ContentLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
  </div>
);


// Component to handle route protection and redirection
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useReduxAuth();
  const [location, setLocation] = useLocation();
  
  const isEmailVerified = user ? user.emailVerified : undefined;
  
  // Handle redirects in useEffect to prevent React warnings about updating during render
  useEffect(() => {
    if (!isAuthenticated) {
      // Allow certain routes for unauthenticated users
      if (!['/auth', '/verify-email'].includes(location)) {
        setLocation('/auth');
      }
    } else if (isAuthenticated && isEmailVerified === false) {
      // Allow certain routes for unverified users (strict false check only)
      if (!['/pending-verification', '/verify-email'].includes(location)) {
        setLocation('/pending-verification');
      }
    } else if (isAuthenticated && isEmailVerified === true) {
      // Redirect auth page to dashboard for verified users
      if (['/auth', '/pending-verification'].includes(location)) {
        setLocation('/dashboard');
      }
    }
    // If isEmailVerified is undefined/null (loading state), don't redirect
    // This prevents premature redirects during authentication initialization
  }, [isAuthenticated, isEmailVerified, location, setLocation]);
  
  return <>{children}</>;
}

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
    <ProtectedRoute>
      <Switch>
        {/* Routes that should be wrapped in AppLayout */}
        {isAuthenticated && isEmailVerified === true ? (
          <AppLayout>
            <Suspense fallback={<ContentLoader />}>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/company" component={CompanyPage} />
                <Route path="/campaigns" component={CampaignsPage} />
                <Route path="/email-contacts" component={EmailContactsPage} />
                <Route path="/email-contacts/new" component={NewEmailContactPage} />
                <Route path="/email-contacts/edit/:id" component={lazy(() => import("@/pages/email-contacts/edit"))} />
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
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </AppLayout>
        ) : (
          /* Routes that should NOT be wrapped in AppLayout */
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/" component={isAuthenticated ? PendingVerificationPage : AuthPage} />
              <Route path="/auth" component={AuthPage} />
              <Route path="/pending-verification" component={PendingVerificationPage} />
              <Route path="/verify-email" component={VerifyEmailPage} />
              <Route path="/subscribe" component={Subscribe} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        )}
      </Switch>
    </ProtectedRoute>
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

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  User,
  LogOut,
  Activity,
  Users,
  CreditCard,
  ClipboardList,
  Building2,
  Store,
  Moon,
  Sun,
  Target,
  Mail,
  FileText,
  UserCheck,
  BarChart3,
  Menu,

  Newspaper,
  Settings,
  Grid3X3,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import logoUrl from "@assets/logo.png";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar as CustomAvatar } from "@/components/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useReduxAuth,
  useReduxLogout,
  useReduxUpdateProfile,
} from "@/hooks/useReduxAuth";
import { useUpdateTheme, useUpdateMenuPreference } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import type { UserSubscriptionResponse } from "@shared/schema";

const getNavigation = (userRole?: string) => {
  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Newsletter", href: "/newsletter", icon: Newspaper },
    { name: "Campaigns", href: "/campaigns", icon: Target },
    { name: "Forms", href: "/forms", icon: ClipboardList },
    { name: "Email Campaigns", href: "/email-campaigns", icon: Mail },
    { name: "Email Test", href: "/email-test", icon: Settings },
    { name: "Templates", href: "/email-templates", icon: FileText },
    { name: "Contacts", href: "/email-contacts", icon: UserCheck },
    { name: "Analytics", href: "/email-analytics", icon: BarChart3 },
    { name: "Shops", href: "/shops", icon: Store },
  ];



  // Add Users management for Owner, Admin and Manager roles
  if (userRole === "Owner" || userRole === "Administrator" || userRole === "Manager") {
    baseNavigation.push({ name: "Users", href: "/users", icon: Users });
  }

  return baseNavigation;
};

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, isInitialized } = useReduxAuth();
  const { logout } = useReduxLogout();
  const { theme, toggleTheme, setUserTheme } = useTheme();
  const navigation = getNavigation(user?.role);
  const { updateProfile } = useReduxUpdateProfile();
  const updateThemeMutation = useUpdateTheme();
  const updateMenuPreferenceMutation = useUpdateMenuPreference();
  const [isThemeChanging, setIsThemeChanging] = useState(false);

  // Fetch subscription data for the user's plan
  const { data: subscriptionData } = useQuery<UserSubscriptionResponse>({
    queryKey: ["/api/my-subscription"],
    enabled: !!user && user.role === "Owner",
  });
  
  // Initialize menu state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Only use localStorage as initial state if auth is not initialized yet
    if (!isInitialized) {
      const localPref = localStorage.getItem("menuExpanded");
      if (localPref !== null) {
        return !JSON.parse(localPref);
      }
    }
    // Default to expanded
    return false;
  });

  // Sync menu state when user data loads or changes
  useEffect(() => {
    // Only update menu state after auth is initialized
    if (isInitialized && user) {
      // Use backend preference as source of truth
      const backendCollapsed = user.menuExpanded === false;
      setIsCollapsed(backendCollapsed);
      // Sync localStorage with backend preference
      localStorage.setItem("menuExpanded", JSON.stringify(user.menuExpanded ?? true));
    }
  }, [isInitialized, user, user?.menuExpanded]);

  // Sync theme from backend only on initial load
  const [hasInitializedTheme, setHasInitializedTheme] = useState(false);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  
  useEffect(() => {
    // Reset initialization flag when user changes (logout/login) or when user ID changes
    if (!user) {
      setHasInitializedTheme(false);
      setLastUserId(null);
    } else if (user && (!hasInitializedTheme || user.id !== lastUserId) && !isThemeChanging) {
      // Always set theme from backend when user logs in or changes, even if undefined
      const backendTheme = user.theme || 'light';
      
      console.log(`🎨 [Theme] Syncing theme from backend: ${backendTheme} for user ${user.email}`);
      setUserTheme(backendTheme);
      setHasInitializedTheme(true);
      setLastUserId(user.id);
    }
  }, [user, setUserTheme, hasInitializedTheme, isThemeChanging, lastUserId]);

  // Listen for localStorage changes from other tabs and immediate changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "menuExpanded" && e.newValue) {
        setIsCollapsed(!JSON.parse(e.newValue));
      }
    };

    const handleMenuPreferenceChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsCollapsed(!customEvent.detail.menuExpanded);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "menuPreferenceChanged",
      handleMenuPreferenceChange,
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "menuPreferenceChanged",
        handleMenuPreferenceChange,
      );
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setLocation("/auth");
  };

  const handleThemeToggle = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setIsThemeChanging(true);
    toggleTheme();
    
    // Sync with backend using dedicated theme endpoint
    if (user) {
      updateThemeMutation.mutate({ theme: newTheme }, {
        onSettled: () => {
          // Allow theme sync again after mutation completes
          setTimeout(() => setIsThemeChanging(false), 1000);
        }
      });
    } else {
      setIsThemeChanging(false);
    }
  };



  if (!user) {
    return <>{children}</>;
  }


  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col bg-gray-800 dark:bg-gray-900 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        {/* Header */}
        <div className={cn(
          "p-4 flex items-center justify-center transition-all duration-300"
        )}>
          <div className="flex items-center">
            <div className="bg-indigo-600 dark:bg-indigo-500 rounded-2xl p-2 flex items-center justify-center">
              <img 
                src={logoUrl} 
                alt="Company Logo" 
                className="w-8 h-8 object-contain filter brightness-0 invert"
              />
            </div>
            {!isCollapsed && (
              <div className="ml-3 flex flex-col">
                <span className="text-white dark:text-gray-100 font-semibold text-lg">
                  SaaS Platform
                </span>
                <span className="text-gray-300 dark:text-gray-400 text-sm">
                  Management Suite
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 flex flex-col pt-6 transition-all duration-300",
          isCollapsed ? "items-center space-y-3 px-3" : "px-4 space-y-2"
        )}>
          {navigation.map((item, index) => {
            const isActive =
              location === item.href ||
              (item.href === "/dashboard" && location === "/");
            const Icon = item.icon;

            if (isCollapsed) {
              // Collapsed menu - show only icons with tooltips
              const navButton = (
                <Button
                  key={item.name}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-12 h-12 p-0 rounded-2xl justify-center transition-all duration-200 hover:bg-gray-700 dark:hover:bg-gray-800",
                    isActive 
                      ? "bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600" 
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-200 dark:hover:text-gray-300"
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <Icon className="h-6 w-6" />
                  </Link>
                </Button>
              );

              return (
                <div key={item.name} className="relative group">
                  <Tooltip>
                    <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                    <TooltipContent side="right" className="bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 border-gray-700 dark:border-gray-600">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            } else {
              // Expanded menu - show icons with labels
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-12 px-4 rounded-2xl transition-all duration-200 hover:bg-gray-700 dark:hover:bg-gray-800",
                    isActive 
                      ? "bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600" 
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-200 dark:hover:text-gray-300"
                  )}
                  asChild
                >
                  <Link href={item.href} className="flex items-center space-x-3">
                    <Icon className="h-6 w-6 flex-shrink-0" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </Button>
              );
            }
          })}
        </nav>

        {/* User Profile Menu */}
        <div className={cn(
          "p-4 border-t border-gray-700 dark:border-gray-600 transition-all duration-300",
          isCollapsed ? "flex justify-center" : "flex items-center"
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "rounded-2xl transition-all duration-200 hover:bg-gray-700 dark:hover:bg-gray-800",
                  isCollapsed 
                    ? "w-12 h-12 p-0 justify-center" 
                    : "w-full h-12 px-4 justify-start"
                )}
              >
                <CustomAvatar 
                  user={user}
                  size="sm"
                  className="w-8 h-8 flex-shrink-0"
                />
                {!isCollapsed && (
                  <div className="ml-3 flex flex-col items-start">
                    <span className="text-gray-200 dark:text-gray-100 font-medium text-sm">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs">
                      {user.email}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align={isCollapsed ? "end" : "start"} 
              className="w-64 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg rounded-2xl p-0"
              sideOffset={8}
            >
              {/* User Profile Header */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
                <CustomAvatar 
                  user={user}
                  size="sm"
                  className="w-10 h-10 ring-2 ring-gray-100 dark:ring-gray-700"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {subscriptionData?.subscription?.plan?.displayName || 'Basic Plan'}
                  </p>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <DropdownMenuItem 
                  onClick={() => setLocation('/profile')} 
                  className="cursor-pointer flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 rounded-none"
                >
                  <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm">Profile</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => setLocation('/company')} 
                  className="cursor-pointer flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 rounded-none"
                >
                  <Building2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm">Company</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => setLocation('/sessions')} 
                  className="cursor-pointer flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 rounded-none"
                >
                  <Activity className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm">Sessions</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />

                <div
                  onClick={handleThemeToggle}
                  className="relative flex cursor-pointer select-none items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 rounded-none"
                  role="menuitem"
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm">Dark mode</span>
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm">Light mode</span>
                    </>
                  )}
                </div>
              </div>

              <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />

              {/* Plan Section */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {subscriptionData?.subscription?.plan?.displayName || 'Basic Plan'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      12,000 views
                    </p>
                  </div>
                  <div className="relative">
                    <Button 
                      onClick={() => setLocation('/subscribe')}
                      size="sm" 
                      className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 hover:from-violet-500 hover:via-purple-500 hover:to-blue-500 text-white px-3 py-1.5 text-xs font-semibold rounded-md shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
                    >
                      <span className="relative z-10 flex items-center gap-1">
                        <span className="text-white">
                          ✦ Upgrade
                        </span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Button>
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />

              {/* Logout */}
              <div className="py-2">
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 rounded-none"
                >
                  <LogOut className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm">Logout</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

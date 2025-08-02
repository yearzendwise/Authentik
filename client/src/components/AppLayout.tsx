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
  PenTool,
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
import { useUpdateTheme } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";

const getNavigation = (userRole?: string) => {
  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Company", href: "/company", icon: Building2 },
    { name: "Email Campaigns", href: "/email-campaigns", icon: Mail },
    { name: "Templates", href: "/email-templates", icon: FileText },
    { name: "Contacts", href: "/email-contacts", icon: UserCheck },
    { name: "Analytics", href: "/email-analytics", icon: BarChart3 },
    { name: "Compose", href: "/email-compose", icon: PenTool },
    { name: "Shops", href: "/shops", icon: Store },
    { name: "Forms", href: "/forms", icon: ClipboardList },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Sessions", href: "/sessions", icon: Activity },
  ];

  // Add subscription menu only for Owner role
  if (userRole === "Owner") {
    baseNavigation.splice(8, 0, { name: "Subscription", href: "/subscribe", icon: CreditCard });
  }

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
  const [isThemeChanging, setIsThemeChanging] = useState(false);
  
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
          "flex flex-col bg-gray-800 transition-all duration-200",
          isCollapsed ? "w-20" : "w-20",
        )}
      >
        {/* Header */}
        <div className="p-4 flex justify-center">
          <div className="bg-indigo-600 rounded-2xl p-2 flex items-center justify-center">
            <img 
              src={logoUrl} 
              alt="Company Logo" 
              className="w-8 h-8 object-contain filter brightness-0 invert"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center space-y-3 pt-6 px-3">
          {navigation.map((item, index) => {
            const isActive =
              location === item.href ||
              (item.href === "/dashboard" && location === "/");
            const Icon = item.icon;

            const navButton = (
              <Button
                key={item.name}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-12 h-12 p-0 rounded-2xl justify-center transition-all duration-200 hover:bg-gray-700",
                  isActive 
                    ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                    : "text-gray-400 hover:text-gray-200"
                )}
                asChild
              >
                <Link href={item.href}>
                  <Icon className="h-6 w-6" />
                </Link>
              </Button>
            );

            const buttonElement = (
              <div key={item.name} className="relative group">
                <Tooltip>
                  <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-gray-900 text-white border-gray-700">
                    {item.name}
                  </TooltipContent>
                </Tooltip>

              </div>
            );

            return buttonElement;
          })}
        </nav>

        {/* User Profile Menu */}
        <div className="p-4 flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-12 h-12 p-0 rounded-2xl justify-center hover:bg-gray-700"
              >
                <CustomAvatar 
                  user={user}
                  size="sm"
                  className="w-8 h-8"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-700">
              <DropdownMenuItem onClick={() => setLocation('/profile')} className="cursor-pointer text-gray-200 hover:bg-gray-800">
                <User className="mr-2 h-5 w-5" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/sessions')} className="cursor-pointer text-gray-200 hover:bg-gray-800">
                <Activity className="mr-2 h-5 w-5" />
                Sessions
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <div
                onClick={handleThemeToggle}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-800 text-gray-200"
                role="menuitem"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="mr-2 h-4 w-4" />
                    Dark mode
                  </>
                ) : (
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    Light mode
                  </>
                )}
              </div>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-400 hover:bg-gray-800"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
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

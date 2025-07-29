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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useTheme } from "@/contexts/ThemeContext";

const getNavigation = (userRole?: string) => {
  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Company", href: "/company", icon: Building2 },
    { name: "Campaigns", href: "/campaigns", icon: Target },
    { name: "Shops", href: "/shops", icon: Store },
    { name: "Forms", href: "/forms", icon: ClipboardList },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Sessions", href: "/sessions", icon: Activity },
  ];

  // Add subscription menu only for Owner role
  if (userRole === "Owner") {
    baseNavigation.splice(3, 0, { name: "Subscription", href: "/subscribe", icon: CreditCard });
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
  const { user } = useReduxAuth();
  const { logout } = useReduxLogout();
  const { theme, toggleTheme, setUserTheme } = useTheme();
  const navigation = getNavigation(user?.role);
  const { updateProfile } = useReduxUpdateProfile();
  // Load initial menu state from localStorage or user preference
  const getInitialMenuState = () => {
    const localPref = localStorage.getItem("menuExpanded");
    if (localPref !== null) {
      return !JSON.parse(localPref); // inverted because isCollapsed is opposite of expanded
    }
    // Default to expanded (false for isCollapsed) if no preference is set
    return user?.menuExpanded !== undefined ? !user.menuExpanded : false;
  };

  const [isCollapsed, setIsCollapsed] = useState(getInitialMenuState);

  // Sync menu state when user data changes or localStorage changes
  useEffect(() => {
    const localPref = localStorage.getItem("menuExpanded");
    if (localPref !== null) {
      setIsCollapsed(!JSON.parse(localPref));
    } else if (user?.menuExpanded !== undefined) {
      setIsCollapsed(!user.menuExpanded);
    }
  }, [user?.menuExpanded]);

  // Sync theme when user data changes
  useEffect(() => {
    if (user?.theme) {
      setUserTheme(user.theme);
    }
  }, [user?.theme, setUserTheme]);

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
    toggleTheme();
    
    // If user is authenticated, sync with backend
    if (user) {
      try {
        await updateProfile({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          theme: newTheme,
        });
      } catch (error) {
        console.error('Failed to update theme preference on backend:', error);
      }
    }
  };

  if (!user) {
    return <>{children}</>;
  }

  const userInitials =
    user.firstName && user.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user.email[0].toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-200",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className={cn(
            "text-xl font-semibold text-gray-900 dark:text-white",
            isCollapsed && "text-center"
          )}>
            {isCollapsed ? "SA" : "SaaS Auth"}
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item, index) => {
            const isActive =
              location === item.href ||
              (item.href === "/dashboard" && location === "/");
            const Icon = item.icon;

            // Add separator before Profile
            const showSeparator = item.name === "Profile" && index > 0;

            const navButton = (
              <Button
                key={item.name}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start h-10",
                  isCollapsed && "px-2 justify-center",
                )}
                asChild
              >
                <Link href={item.href}>
                  <Icon className="h-5 w-5" />
                  {!isCollapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              </Button>
            );

            const buttonElement = isCollapsed ? (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                <TooltipContent side="right">{item.name}</TooltipContent>
              </Tooltip>
            ) : (
              navButton
            );

            return (
              <div key={`nav-${item.name}`}>
                {showSeparator && (
                  <div className="my-2 mx-2 border-t border-gray-200 dark:border-gray-700" />
                )}
                {buttonElement}
              </div>
            );
          })}
        </nav>

        {/* User Profile Menu */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-12",
                  isCollapsed && "px-2 justify-center",
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-5 w-5" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/sessions" className="cursor-pointer">
                  <Activity className="mr-2 h-5 w-5" />
                  Sessions
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleThemeToggle}
                className="cursor-pointer"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="mr-2 h-5 w-5" />
                    Dark mode
                  </>
                ) : (
                  <>
                    <Sun className="mr-2 h-5 w-5" />
                    Light mode
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 dark:text-red-400"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

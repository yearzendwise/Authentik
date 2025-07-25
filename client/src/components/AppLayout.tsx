import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  User, 
  Settings, 
  LogOut, 
  Shield,
  Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useAuth, useLogout, useUpdateMenuPreference } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Sessions", href: "/sessions", icon: Monitor },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const logout = useLogout();
  const updateMenuPreference = useUpdateMenuPreference();
  // Load initial menu state from localStorage or user preference
  const getInitialMenuState = () => {
    const localPref = localStorage.getItem('menuExpanded');
    if (localPref !== null) {
      return !JSON.parse(localPref); // inverted because isCollapsed is opposite of expanded
    }
    return !user?.menuExpanded; // default to collapsed if no preference
  };

  const [isCollapsed, setIsCollapsed] = useState(getInitialMenuState);

  // Sync menu state when user data changes or localStorage changes
  useEffect(() => {
    const localPref = localStorage.getItem('menuExpanded');
    if (localPref !== null) {
      setIsCollapsed(!JSON.parse(localPref));
    } else if (user?.menuExpanded !== undefined) {
      setIsCollapsed(!user.menuExpanded);
    }
  }, [user?.menuExpanded]);

  // Listen for localStorage changes from other tabs and immediate changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'menuExpanded' && e.newValue) {
        setIsCollapsed(!JSON.parse(e.newValue));
      }
    };

    const handleMenuPreferenceChange = (e: CustomEvent) => {
      setIsCollapsed(!e.detail.menuExpanded);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('menuPreferenceChanged', handleMenuPreferenceChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('menuPreferenceChanged', handleMenuPreferenceChange);
    };
  }, []);

  const handleLogout = () => {
    logout.mutate();
  };

  if (!user) {
    return <>{children}</>;
  }

  const userInitials = user.firstName && user.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={cn(
        "flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-200",
        isCollapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              SaaS Auth
            </h1>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
            const Icon = item.icon;
            
            const navButton = (
              <Button
                key={item.name}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start h-10",
                  isCollapsed && "px-2 justify-center"
                )}
                asChild
              >
                <Link href={item.href}>
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              </Button>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    {navButton}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return navButton;
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
                  isCollapsed && "px-2 justify-center"
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
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/sessions" className="cursor-pointer">
                  <Monitor className="mr-2 h-4 w-4" />
                  Sessions
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
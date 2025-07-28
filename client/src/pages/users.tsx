import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authManager } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users as UsersIcon, Plus, Search, Filter, Edit, Trash2, Shield, UserCheck, UserX, Calendar, Mail, MapPin, Eye, EyeOff } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, updateUserSchema, userRoles, type User, type CreateUserData, type UpdateUserData, type UserRole } from "@shared/schema";
import { useReduxAuth } from "@/hooks/useReduxAuth";
import { DataTable, DataTableColumnHeader, DataTableRowActions } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<string, number>;
}

interface UserLimits {
  canAddUser: boolean;
  currentUsers: number;
  maxUsers: number | null;
  planName: string;
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'Administrator':
      return 'destructive';
    case 'Manager':
      return 'default';
    case 'Employee':
      return 'secondary';
    default:
      return 'outline';
  }
}

function getUserInitials(firstName?: string, lastName?: string) {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
}

export default function UsersPage() {
  console.log("🔍 [UsersPage] Component rendered");
  const { user: currentUser, isLoading: authLoading } = useReduxAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "">("");
  const [showInactive, setShowInactive] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Store search params in a ref to use in query function without changing dependencies
  const searchParamsRef = useRef({
    search: "",
    role: "",
    status: "",
    showInactive: false
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Check authentication first
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if current user has permission to access this page
  if (!currentUser || (currentUser.role !== 'Owner' && currentUser.role !== 'Administrator' && currentUser.role !== 'Manager')) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You don't have permission to access the user management system.
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'Owner' || currentUser.role === 'Administrator';

  // Fetch users with stable query key - no search params in key
  const { data: usersData, isLoading: usersLoading, isFetching, refetch } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const params = new URLSearchParams();
      const currentParams = searchParamsRef.current;
      
      if (currentParams.search) params.append('search', currentParams.search);
      if (currentParams.role) params.append('role', currentParams.role);
      if (currentParams.status) params.append('status', currentParams.status);
      if (currentParams.showInactive) params.append('showInactive', 'true');

      const response = await authManager.makeAuthenticatedRequest('GET', `/api/users?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch users');
      }
      return response.json();
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Debounced search effect
  useEffect(() => {
    setIsSearching(true);
    
    const timer = setTimeout(() => {
      searchParamsRef.current = {
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        showInactive
      };
      refetch().then(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, roleFilter, statusFilter, showInactive, refetch]);

  // Fetch user statistics
  const { data: statsData } = useQuery({
    queryKey: ['/api/users/stats'],
    queryFn: async () => {
      const response = await authManager.makeAuthenticatedRequest('GET', '/api/users/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      return response.json();
    },
    enabled: !!currentUser,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  // Fetch user limits
  const { data: limitsData, refetch: refetchLimits } = useQuery({
    queryKey: ['/api/users/limits'],
    queryFn: async () => {
      const response = await authManager.makeAuthenticatedRequest('GET', '/api/users/limits');
      if (!response.ok) {
        throw new Error('Failed to fetch user limits');
      }
      return response.json();
    },
    enabled: !!currentUser,
    staleTime: 0, // Set to 0 to always fetch fresh data
    refetchOnWindowFocus: false,
  });

  const users = usersData?.users || [];
  const stats: UserStats = statsData || { totalUsers: 0, activeUsers: 0, usersByRole: {} };
  const limits: UserLimits = limitsData || { canAddUser: true, currentUsers: 0, maxUsers: null, planName: 'Unknown' };

  // Create user form
  const createForm = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "Employee",
      password: "",
      confirmPassword: "",
    },
  });

  // Edit user form
  const editForm = useForm<UpdateUserData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "Employee",
      isActive: true,
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await authManager.makeAuthenticatedRequest('POST', '/api/users', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/limits'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }) => {
      const response = await authManager.makeAuthenticatedRequest('PUT', `/api/users/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/limits'] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await authManager.makeAuthenticatedRequest('DELETE', `/api/users/${userId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/limits'] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await authManager.makeAuthenticatedRequest('PATCH', `/api/users/${userId}/status`, { isActive });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/limits'] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = (data: CreateUserData) => {
    createUserMutation.mutate(data);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email,
      role: user.role as UserRole,
      isActive: user.isActive ?? true,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = (data: UpdateUserData) => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, data });
    }
  };

  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
  };

  const handleToggleStatus = (userId: string, isActive: boolean) => {
    toggleStatusMutation.mutate({ userId, isActive });
  };

  // Define columns for the data table
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "user",
      header: "USER",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                  {getUserInitials(user.firstName || undefined, user.lastName || undefined)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'No name'}
              </div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "ROLE",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        const roleStyles = {
          'Owner': 'bg-purple-100 text-purple-700',
          'Administrator': 'bg-red-100 text-red-700',
          'Manager': 'bg-blue-100 text-blue-700',
          'Employee': 'bg-gray-100 text-gray-700'
        };
        return (
          <Badge variant="secondary" className={`${roleStyles[role as keyof typeof roleStyles] || 'bg-gray-100 text-gray-700'} hover:bg-opacity-80 font-normal border-0`}>
            {role}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "isActive",
      header: "STATUS",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive");
        return isActive ? (
          <div className="flex items-center space-x-1.5">
            <UserCheck className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">Active</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5">
            <UserX className="h-4 w-4 text-red-600" />
            <span className="text-red-600 font-medium">Inactive</span>
          </div>
        );
      },
    },
    {
      accessorKey: "location",
      header: "LOCATION",
      cell: ({ row }) => {
        // For now, we'll show a dash as location is not in our schema
        return <span className="text-gray-400">—</span>;
      },
    },
    {
      accessorKey: "lastLoginAt",
      header: "LAST LOGIN",
      cell: ({ row }) => {
        const lastLogin = row.getValue("lastLoginAt");
        if (!lastLogin) return (
          <div className="flex items-center space-x-1.5 text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Never</span>
          </div>
        );
        return (
          <div className="flex items-center space-x-1.5 text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(lastLogin as string), "MMM d, yyyy")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "JOINED",
      cell: ({ row }) => {
        const createdAt = row.getValue("createdAt");
        if (!createdAt) return null;
        return (
          <div className="flex items-center space-x-1.5 text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(createdAt as string), "MMM d, yyyy, h:mm a")}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "ACTIONS",
      cell: ({ row }) => {
        const user = row.original;
        if (!isAdmin || user.id === currentUser.id) return null;
        
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => handleEditUser(user)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
                  handleDeleteUser(user.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter((user: User) => {
      const matchesSearch = searchTerm === "" || 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === "" || user.role === roleFilter;
      const matchesStatus = statusFilter === "" || 
        (statusFilter === "active" ? user.isActive : !user.isActive);
      const matchesInactive = showInactive || user.isActive;
      
      return matchesSearch && matchesRole && matchesStatus && matchesInactive;
    });
  }, [users, searchTerm, roleFilter, statusFilter, showInactive]);

  if (usersLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <UsersIcon className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage user accounts and permissions
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <UsersIcon className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage user accounts and permissions
                </p>
              </div>
            </div>
          </div>
          {isAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button disabled={!limits.canAddUser}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add User
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system. The user will be automatically verified.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={createForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={createForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {userRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? "Creating..." : "Create User"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
                  </span>
                </TooltipTrigger>
                {!limits.canAddUser && (
                  <TooltipContent>
                    <p>
                      User limit reached ({limits.currentUsers}/{limits.maxUsers}). 
                      Please upgrade your {limits.planName} to add more users.
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalUsers}</p>
                </div>
                <UsersIcon className="text-blue-500 w-8 h-8" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Across all roles</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Active Users</p>
                  <p className="text-2xl font-bold text-green-900">{stats.activeUsers}</p>
                </div>
                <UserCheck className="text-green-500 w-8 h-8" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total users
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Roles</p>
                  <p className="text-2xl font-bold text-purple-900">{Object.keys(stats.usersByRole).length}</p>
                </div>
                <Shield className="text-purple-500 w-8 h-8" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Different user roles</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Plan Limits</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {limits.currentUsers}{limits.maxUsers ? `/${limits.maxUsers}` : ''}
                  </p>
                </div>
                <UsersIcon className="text-orange-500 w-8 h-8" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {limits.planName} {limits.maxUsers ? `(${limits.maxUsers - limits.currentUsers} remaining)` : '(Unlimited)'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value === "all" ? "" : value as UserRole)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {userRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value as "active" | "inactive")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <label htmlFor="show-inactive" className="text-sm font-medium">
              Show Inactive
            </label>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <DataTable
            columns={columns}
            data={filteredUsers}
            showPagination={true}
            pageSize={10}
            showColumnVisibility={false}
          />
        </div>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and permissions.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdateUser)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {userRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable or disable this user account
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? true}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending ? "Updating..." : "Update User"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
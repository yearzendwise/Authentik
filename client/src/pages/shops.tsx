import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Store, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Clock,
  User,
  MoreVertical,
  Edit,
  Eye,
  Trash,
  Power,
  Filter,
  Download,
  Building,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { ShopWithManager, ShopFilters } from "@shared/schema";

interface ShopStats {
  totalShops: number;
  activeShops: number;
  shopsByCategory: Record<string, number>;
}

interface ShopLimits {
  currentShops: number;
  maxShops: number | null;
  canAddShop: boolean;
  planName: string;
}

interface ShopsResponse {
  shops: ShopWithManager[];
  stats: ShopStats;
  limits: ShopLimits;
}

function getShopCategoryIcon(category?: string) {
  switch (category?.toLowerCase()) {
    case 'restaurant':
      return <Store className="h-4 w-4" />;
    case 'retail':
      return <Building className="h-4 w-4" />;
    case 'service':
      return <Globe className="h-4 w-4" />;
    default:
      return <Store className="h-4 w-4" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return (
        <div className="flex items-center space-x-1.5">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-600 font-medium">Active</span>
        </div>
      );
    case 'inactive':
      return (
        <div className="flex items-center space-x-1.5">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-600 font-medium">Inactive</span>
        </div>
      );
    case 'maintenance':
      return (
        <div className="flex items-center space-x-1.5">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <span className="text-orange-600 font-medium">Maintenance</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center space-x-1.5">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-600 font-medium">Active</span>
        </div>
      );
  }
}

export default function ShopsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'maintenance'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteShopId, setDeleteShopId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create a ref to hold the current search params
  const searchParamsRef = useRef({
    search: searchTerm,
    status: statusFilter,
    category: categoryFilter,
  });

  // Update the ref whenever search params change
  searchParamsRef.current = {
    search: searchTerm,
    status: statusFilter,
    category: categoryFilter,
  };

  // Fetch shops data with stable query key
  const { data, isLoading, error, isFetching, refetch } = useQuery<ShopsResponse>({
    queryKey: ['/api/shops'],
    queryFn: async () => {
      const params = new URLSearchParams();
      const currentParams = searchParamsRef.current;
      
      if (currentParams.search) params.append('search', currentParams.search);
      if (currentParams.status !== 'all') params.append('status', currentParams.status);
      if (currentParams.category !== 'all') params.append('category', currentParams.category);
      
      const response = await apiRequest('GET', `/api/shops?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch shops');
      }
      return response.json();
    },
  });

  // Debounce search and filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      refetch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, categoryFilter, refetch]);

  // Toggle shop status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ shopId, isActive }: { shopId: string; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/shops/${shopId}/toggle-status`, { isActive });
      if (!response.ok) {
        throw new Error('Failed to update shop status');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate all queries that start with '/api/shops'
      queryClient.invalidateQueries({ queryKey: ['/api/shops'] });
      toast({
        title: "Success",
        description: data.message || "Shop status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update shop status",
        variant: "destructive",
      });
    },
  });

  // Delete shop mutation
  const deleteShopMutation = useMutation({
    mutationFn: async (shopId: string) => {
      const response = await apiRequest('DELETE', `/api/shops/${shopId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shops'] });
      setDeleteShopId(null);
      toast({
        title: "Success",
        description: "Shop deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete shop",
        variant: "destructive",
      });
    },
  });

  // Define columns for the data table
  const columns: ColumnDef<ShopWithManager>[] = [
    {
      accessorKey: "shop",
      header: "SHOP",
      cell: ({ row }) => {
          const shop = row.original;
          return (
            <div className="flex items-center space-x-3">
               <div className="relative">
                 <Avatar className="h-10 w-10">
                    <AvatarImage src={shop.logoUrl ?? undefined} />
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                      {getShopCategoryIcon(shop.category || undefined)}
                    </AvatarFallback>
                  </Avatar>
               </div>
               <div>
                 <div className="font-medium text-gray-900">{shop.name}</div>
                 <div className="text-sm text-gray-500">{shop.category || 'Uncategorized'}</div>
               </div>
             </div>
          );
        },
    },
    {
      accessorKey: "status",
      header: "STATUS",
      cell: ({ row }) => {
        const status = row.getValue("status") as string || 'active';
        return getStatusBadge(status);
      },
    },
    {
      accessorKey: "manager",
      header: "MANAGER",
      cell: ({ row }) => {
        const shop = row.original;
        if (!shop.manager) {
          return <span className="text-gray-400">No manager assigned</span>;
        }
        return (
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900">
              {shop.manager.firstName || shop.manager.lastName 
                ? `${shop.manager.firstName || ''} ${shop.manager.lastName || ''}`.trim()
                : shop.manager.email}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "location",
      header: "LOCATION",
      cell: ({ row }) => {
        const shop = row.original;
        const location = [shop.city, shop.state, shop.country].filter(Boolean).join(', ');
        return (
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900">{location || 'No location'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "contact",
      header: "CONTACT",
      cell: ({ row }) => {
        const shop = row.original;
        return (
          <div className="space-y-1">
            {shop.phone && (
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-3 w-3 text-gray-400" />
                <span className="text-gray-600">{shop.phone}</span>
              </div>
            )}
            {shop.email && (
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-3 w-3 text-gray-400" />
                <span className="text-gray-600">{shop.email}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "CREATED",
      cell: ({ row }) => {
        const createdAt = row.getValue("createdAt");
        if (!createdAt) return null;
        return (
          <div className="flex items-center space-x-1.5 text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(createdAt as string), "MMM d, yyyy")}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "ACTIONS",
      cell: ({ row }) => {
        const shop = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/shops/${shop.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/shops/${shop.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Shop
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => toggleStatusMutation.mutate({ 
                  shopId: shop.id, 
                  isActive: shop.status !== 'active' 
                })}
              >
                <Power className="mr-2 h-4 w-4" />
                {shop.status === 'active' ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => setDeleteShopId(shop.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Filter shops based on search and filters
  const filteredShops = useMemo(() => {
    return (data?.shops || []).filter((shop: ShopWithManager) => {
      const matchesSearch = searchTerm === "" || 
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.phone?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || shop.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || shop.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [data?.shops, searchTerm, statusFilter, categoryFilter]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set((data?.shops || []).map(shop => shop.category).filter(Boolean));
    return Array.from(cats);
  }, [data?.shops]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Store className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shops</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your shop locations and details
                </p>
              </div>
            </div>
          </div>
          <Link href="/shops/new">
            <Button disabled={data?.limits && !data.limits.canAddShop}>
              <Plus className="mr-2 h-4 w-4" />
              Add Shop
            </Button>
          </Link>
        </div>

      {/* Stats Cards */}
      {data?.stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Shops</p>
                  <p className="text-2xl font-bold text-blue-900">{data.stats.totalShops}</p>
                </div>
                <Store className="text-blue-500 w-8 h-8" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Across all locations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Active Shops</p>
                  <p className="text-2xl font-bold text-green-900">{data.stats.activeShops}</p>
                </div>
                <CheckCircle className="text-green-500 w-8 h-8" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {data.stats.totalShops > 0 
                  ? `${Math.round((data.stats.activeShops / data.stats.totalShops) * 100)}% of total shops`
                  : '0% of total shops'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Categories</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {Object.keys(data.stats.shopsByCategory).length || 0}
                  </p>
                </div>
                <Building className="text-purple-500 w-8 h-8" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Different shop types</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Shop Slots</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {data.limits?.currentShops || 0}{data.limits?.maxShops ? `/${data.limits.maxShops}` : ''}
                  </p>
                </div>
                <Store className="text-orange-500 w-8 h-8" />
              </div>
              <div className="mt-2 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {data.limits?.planName} {data.limits?.maxShops ? `(${data.limits.maxShops - data.limits.currentShops} remaining)` : '(Unlimited)'}
                </p>
                {data.limits?.maxShops && (
                  <div className="mt-3">
                    <div className="grid grid-cols-10 gap-1">
                      {Array.from({ length: Math.min(data.limits.maxShops, 50) }).map((_, index) => (
                        <div
                          key={index}
                          className={cn(
                            "w-2 h-2 rounded-sm",
                            index < data.limits.currentShops
                              ? "bg-orange-600 dark:bg-orange-500"
                              : "bg-gray-200 dark:bg-gray-700"
                          )}
                          title={index < data.limits.currentShops ? "Used" : "Available"}
                        />
                      ))}
                    </div>
                    {data.limits.maxShops > 50 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Showing first 50 of {data.limits.maxShops} slots
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shop Limit Warning */}
      {data?.limits && !data.limits.canAddShop && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                  Shop limit reached
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Your {data.limits.planName} plan allows up to {data.limits.maxShops} shops. 
                  Please upgrade your plan to add more shops.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category || 'uncategorized'}>
                    {category || 'Uncategorized'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Shops Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading shops...</p>
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Failed to load shops. Please try again.</p>
          </CardContent>
        </Card>
      ) : (
        <div className={cn("relative transition-opacity duration-200", isFetching && "opacity-50")}>
          {isFetching && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          {filteredShops.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No shops found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                      ? "Try adjusting your filters" 
                      : "Get started by adding your first shop"}
                  </p>
                  {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && (
                    <Link href="/shops/new">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Shop
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <DataTable columns={columns} data={filteredShops} showColumnVisibility={false} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteShopId} onOpenChange={() => setDeleteShopId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the shop
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteShopId && deleteShopMutation.mutate(deleteShopId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
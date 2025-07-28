import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Building
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
import type { ShopWithManager, ShopFilters } from "@shared/schema";

interface ShopStats {
  totalShops: number;
  activeShops: number;
  shopsByCategory: Record<string, number>;
}

interface ShopsResponse {
  shops: ShopWithManager[];
  stats: ShopStats;
}

export default function ShopsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'maintenance'>('all');
  const [deleteShopId, setDeleteShopId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch shops data
  const { data, isLoading, error } = useQuery<ShopsResponse>({
    queryKey: ['/api/shops', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await apiRequest('GET', `/api/shops?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch shops');
      }
      return response.json();
    },
  });

  // Toggle shop status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ shopId, isActive }: { shopId: string; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/shops/${shopId}/toggle-status`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shops'] });
      toast({
        title: "Success",
        description: "Shop status updated successfully",
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
      toast({
        title: "Success",
        description: "Shop deleted successfully",
      });
      setDeleteShopId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete shop",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const },
      inactive: { label: 'Inactive', variant: 'secondary' as const },
      maintenance: { label: 'Maintenance', variant: 'outline' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getShopCategoryIcon = (category?: string) => {
    switch (category) {
      case 'retail':
        return <Store className="h-4 w-4" />;
      case 'restaurant':
        return <Building className="h-4 w-4" />;
      case 'service':
        return <Clock className="h-4 w-4" />;
      default:
        return <Store className="h-4 w-4" />;
    }
  };

  const formatOperatingHours = (hours?: string) => {
    if (!hours) return 'Not specified';
    try {
      const parsed = JSON.parse(hours);
      if (typeof parsed === 'string') return parsed;
      // Handle more complex operating hours format if needed
      return parsed.default || 'Not specified';
    } catch {
      return hours;
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shops</h1>
          <p className="text-muted-foreground">Manage your shop locations and details</p>
        </div>
        <Link href="/shops/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Shop
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {data?.stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalShops}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Shops</CardTitle>
              <Power className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.activeShops}</div>
              <p className="text-xs text-muted-foreground">
                {data.stats.totalShops > 0 
                  ? `${Math.round((data.stats.activeShops / data.stats.totalShops) * 100)}% of total`
                  : '0% of total'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(data.stats.shopsByCategory).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Unique categories</p>
            </CardContent>
          </Card>
        </div>
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
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Shops List */}
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
      ) : data?.shops.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No shops found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? "Try adjusting your filters" 
                  : "Get started by adding your first shop"}
              </p>
              {!searchTerm && statusFilter === 'all' && (
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.shops.map((shop) => (
            <Card key={shop.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {getShopCategoryIcon(shop.category)}
                      {shop.name}
                    </CardTitle>
                    <CardDescription>{shop.category || 'Uncategorized'}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(shop.status || 'active')}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Link href={`/shops/${shop.id}`}>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/shops/${shop.id}/edit`}>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Shop
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem 
                          onClick={() => toggleStatusMutation.mutate({ 
                            shopId: shop.id, 
                            isActive: !shop.isActive 
                          })}
                        >
                          <Power className="mr-2 h-4 w-4" />
                          {shop.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeleteShopId(shop.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete Shop
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {shop.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{shop.description}</p>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">
                      {shop.address}, {shop.city}{shop.state ? `, ${shop.state}` : ''} {shop.zipCode}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{shop.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{shop.email}</span>
                  </div>
                  
                  {shop.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a 
                        href={shop.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="truncate hover:text-primary"
                      >
                        {shop.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatOperatingHours(shop.operatingHours)}</span>
                  </div>
                  
                  {shop.manager && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>
                        {shop.manager.firstName} {shop.manager.lastName} ({shop.manager.role})
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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
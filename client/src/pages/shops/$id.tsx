import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Store, 
  ArrowLeft,
  Edit,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  User,
  Calendar,
  Tag,
  Building,
  Activity,
  Settings
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ShopWithManager } from "@shared/schema";

export default function ShopDetailsPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  // Fetch shop data
  const { data: shopData, isLoading } = useQuery<{ shop: ShopWithManager }>({
    queryKey: ['/api/shops', id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/shops/${id}`);
      return response.json();
    },
    enabled: !!id,
  });

  const shop = shopData?.shop;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const },
      inactive: { label: 'Inactive', variant: 'secondary' as const },
      maintenance: { label: 'Maintenance', variant: 'outline' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatOperatingHours = (hours?: string) => {
    if (!hours) return 'Not specified';
    try {
      const parsed = JSON.parse(hours);
      if (typeof parsed === 'string') return parsed;
      
      // Format complex operating hours
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      return (
        <div className="space-y-1">
          {days.map(day => {
            const dayHours = parsed[day];
            if (!dayHours) return null;
            if (dayHours.closed) {
              return (
                <div key={day} className="flex justify-between">
                  <span className="capitalize font-medium">{day}:</span>
                  <span className="text-muted-foreground">Closed</span>
                </div>
              );
            }
            return (
              <div key={day} className="flex justify-between">
                <span className="capitalize font-medium">{day}:</span>
                <span>{dayHours.open} - {dayHours.close}</span>
              </div>
            );
          })}
        </div>
      );
    } catch {
      return hours;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="text-center py-8">
          <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Shop not found</h2>
          <p className="text-muted-foreground mb-4">The shop you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/shops')}>
            Back to Shops
          </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/shops')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              {shop.category && (
                <Building className="h-8 w-8 text-muted-foreground" />
              )}
              {shop.name}
            </h1>
            <p className="text-muted-foreground">{shop.category || 'Uncategorized'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(shop.status || 'active')}
          <Link href={`/shops/${shop.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Shop
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Location Information</CardTitle>
                <CardDescription>Physical address and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {shop.address}<br />
                      {shop.city}{shop.state ? `, ${shop.state}` : ''} {shop.zipCode}<br />
                      {shop.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{shop.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{shop.email}</p>
                  </div>
                </div>

                {shop.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Website</p>
                      <a 
                        href={shop.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {shop.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operating Information</CardTitle>
                <CardDescription>Hours and management details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium mb-2">Operating Hours</p>
                    <div className="text-sm text-muted-foreground">
                      {formatOperatingHours(shop.operatingHours)}
                    </div>
                  </div>
                </div>

                {shop.manager && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Manager</p>
                      <p className="text-sm text-muted-foreground">
                        {shop.manager.firstName} {shop.manager.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{shop.manager.email}</p>
                      <Badge variant="outline" className="mt-1">{shop.manager.role}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {shop.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{shop.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {shop.tags && shop.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>Categories and labels for this shop</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {shop.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shop Details</CardTitle>
              <CardDescription>Additional information and metadata</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="font-medium text-muted-foreground">Shop ID</dt>
                  <dd className="font-mono text-sm">{shop.id}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Status</dt>
                  <dd className="flex items-center gap-2">
                    {getStatusBadge(shop.status || 'active')}
                    <span className="text-sm text-muted-foreground">
                      {shop.isActive ? 'Shop is active' : 'Shop is inactive'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Created</dt>
                  <dd className="text-sm">
                    {new Date(shop.createdAt).toLocaleDateString()} at{' '}
                    {new Date(shop.createdAt).toLocaleTimeString()}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Last Updated</dt>
                  <dd className="text-sm">
                    {new Date(shop.updatedAt).toLocaleDateString()} at{' '}
                    {new Date(shop.updatedAt).toLocaleTimeString()}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Shop activity and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Activity className="mr-2 h-4 w-4" />
                Activity tracking coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
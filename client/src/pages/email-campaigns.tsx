import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  BarChart3, 
  Users, 
  Calendar,
  Edit,
  Trash2,
  Play,
  Pause,
  Settings,
  Filter,
  Search,
  Eye,
  Download,
  TrendingUp,
  Activity
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  type: 'newsletter' | 'promotional' | 'transactional' | 'automated';
  recipients: number;
  sentCount: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
  template?: string;
  segmentId?: string;
}

// Mock campaign data for the template
const mockCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Summer Sale 2025',
    subject: 'Get 30% off all summer items!',
    status: 'sent',
    type: 'promotional',
    recipients: 15420,
    sentCount: 15420,
    openRate: 24.5,
    clickRate: 3.2,
    createdAt: '2025-08-01T10:00:00Z',
    sentAt: '2025-08-01T14:00:00Z',
    template: 'promotional-template',
  },
  {
    id: 'camp-2',
    name: 'Weekly Newsletter #32',
    subject: 'This week in tech: AI breakthroughs',
    status: 'scheduled',
    type: 'newsletter',
    recipients: 8520,
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
    createdAt: '2025-08-05T09:15:00Z',
    scheduledAt: '2025-08-10T08:00:00Z',
    template: 'newsletter-template',
  },
  {
    id: 'camp-3',
    name: 'Welcome Series - Step 1',
    subject: 'Welcome to our community!',
    status: 'sending',
    type: 'automated',
    recipients: 250,
    sentCount: 180,
    openRate: 45.2,
    clickRate: 8.1,
    createdAt: '2025-08-07T12:30:00Z',
    template: 'welcome-template',
  },
  {
    id: 'camp-4',
    name: 'Product Update Announcement',
    subject: 'New features just dropped!',
    status: 'draft',
    type: 'newsletter',
    recipients: 0,
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
    createdAt: '2025-08-07T15:45:00Z',
    template: 'announcement-template',
  },
];

export default function EmailCampaignsPage() {
  const { toast } = useToast();
  const [campaigns] = useState<Campaign[]>(mockCampaigns);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filter campaigns based on search term and filters
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesType = typeFilter === 'all' || campaign.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate overview statistics
  const totalCampaigns = campaigns.length;
  const sentCampaigns = campaigns.filter(c => c.status === 'sent').length;
  const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled').length;
  const draftCampaigns = campaigns.filter(c => c.status === 'draft').length;
  const totalRecipients = campaigns.reduce((sum, c) => sum + c.recipients, 0);
  const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
  const avgOpenRate = sentCampaigns > 0 
    ? campaigns.filter(c => c.status === 'sent').reduce((sum, c) => sum + c.openRate, 0) / sentCampaigns 
    : 0;
  const avgClickRate = sentCampaigns > 0 
    ? campaigns.filter(c => c.status === 'sent').reduce((sum, c) => sum + c.clickRate, 0) / sentCampaigns 
    : 0;

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'sending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'sent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'paused': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'draft': return <Edit className="h-3 w-3" />;
      case 'scheduled': return <Clock className="h-3 w-3" />;
      case 'sending': return <Send className="h-3 w-3" />;
      case 'sent': return <CheckCircle className="h-3 w-3" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      default: return <Mail className="h-3 w-3" />;
    }
  };

  const getTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'newsletter': return <Mail className="h-4 w-4" />;
      case 'promotional': return <TrendingUp className="h-4 w-4" />;
      case 'transactional': return <Activity className="h-4 w-4" />;
      case 'automated': return <Settings className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const handleCreateCampaign = () => {
    toast({
      title: "Create Campaign",
      description: "Campaign creation feature will be implemented here.",
    });
  };

  const handleCampaignAction = (action: string, campaignId: string) => {
    toast({
      title: `${action} Campaign`,
      description: `${action} action for campaign ${campaignId} will be implemented here.`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Email Campaigns
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage and monitor your email marketing campaigns
          </p>
        </div>
        <Button onClick={handleCreateCampaign} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold text-blue-600">{totalCampaigns}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Sent Campaigns</p>
                <p className="text-2xl font-bold text-green-600">{sentCampaigns}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Avg. Open Rate</p>
                <p className="text-2xl font-bold text-yellow-600">{avgOpenRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Eye className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Avg. Click Rate</p>
                <p className="text-2xl font-bold text-purple-600">{avgClickRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="search">Search Campaigns</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="sending">Sending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-filter">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                  <SelectItem value="automated">Automated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Campaigns ({filteredCampaigns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
                <Mail className="h-12 w-12 text-gray-400 mx-auto" />
              </div>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                No campaigns found
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? "Try adjusting your filters or search terms"
                  : "Create your first email campaign to get started"
                }
              </p>
              {(!searchTerm && statusFilter === 'all' && typeFilter === 'all') && (
                <Button onClick={handleCreateCampaign} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Campaign
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(campaign.type)}
                          <h3 className="text-lg font-semibold">{campaign.name}</h3>
                        </div>
                        <Badge className={`${getStatusColor(campaign.status)} gap-1 px-3 py-1`}>
                          {getStatusIcon(campaign.status)}
                          <span className="font-medium capitalize">{campaign.status}</span>
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {campaign.type}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Subject: <span className="text-foreground font-medium">{campaign.subject}</span>
                      </p>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">
                            <span className="font-semibold">{campaign.recipients.toLocaleString()}</span> recipients
                          </span>
                        </div>

                        {campaign.status === 'sending' && (
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm">
                              <span className="font-semibold">{campaign.sentCount.toLocaleString()}</span> sent
                            </span>
                            <Progress 
                              value={(campaign.sentCount / campaign.recipients) * 100} 
                              className="w-20 h-2"
                            />
                          </div>
                        )}

                        {campaign.status === 'sent' && (
                          <>
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-green-600" />
                              <span className="text-sm">
                                <span className="font-semibold">{campaign.openRate}%</span> open rate
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-purple-600" />
                              <span className="text-sm">
                                <span className="font-semibold">{campaign.clickRate}%</span> click rate
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                        {campaign.scheduledAt && (
                          <span>Scheduled: {new Date(campaign.scheduledAt).toLocaleString()}</span>
                        )}
                        {campaign.sentAt && (
                          <span>Sent: {new Date(campaign.sentAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCampaignAction('View', campaign.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {campaign.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCampaignAction('Edit', campaign.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}

                      {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCampaignAction('Send', campaign.id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}

                      {campaign.status === 'sending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCampaignAction('Pause', campaign.id)}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCampaignAction('Download', campaign.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      {(campaign.status === 'draft' || campaign.status === 'paused') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCampaignAction('Delete', campaign.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Mail, 
  Send, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Clock,
  Users,
  TrendingUp,
  Eye,
  BarChart3,
  Calendar,
  ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Campaign {
  id: string;
  name: string;
  status: "draft" | "scheduled" | "sent" | "sending";
  recipients: number;
  sentCount: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
  scheduledFor?: string;
  sentAt?: string;
}

const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Summer Sale Announcement",
    status: "sent",
    recipients: 5420,
    sentCount: 5420,
    openRate: 68.5,
    clickRate: 24.3,
    createdAt: "2025-07-20",
    sentAt: "2025-07-22",
  },
  {
    id: "2",
    name: "Q3 Product Updates",
    status: "scheduled",
    recipients: 3200,
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
    createdAt: "2025-07-25",
    scheduledFor: "2025-08-01T14:00:00Z",
  },
  {
    id: "3",
    name: "Customer Feedback Survey",
    status: "sending",
    recipients: 8900,
    sentCount: 4230,
    openRate: 45.2,
    clickRate: 12.8,
    createdAt: "2025-07-28",
  },
  {
    id: "4",
    name: "Welcome Series - Day 1",
    status: "draft",
    recipients: 1200,
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
    createdAt: "2025-07-29",
  },
];

export default function EmailCampaigns() {
  const [campaigns] = useState<Campaign[]>(mockCampaigns);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusBadge = (status: Campaign["status"]) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-700", label: "Draft" },
      scheduled: { color: "bg-blue-100 text-blue-700", label: "Scheduled" },
      sending: { color: "bg-yellow-100 text-yellow-700", label: "Sending" },
      sent: { color: "bg-green-100 text-green-700", label: "Sent" },
    };

    const config = statusConfig[status];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Campaigns</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and track your email marketing campaigns
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
              </div>
              <Mail className="text-blue-500 w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold text-gray-900">13,870</p>
              </div>
              <Send className="text-green-500 w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Open Rate</p>
                <p className="text-2xl font-bold text-gray-900">52.6%</p>
              </div>
              <Eye className="text-purple-500 w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Click Rate</p>
                <p className="text-2xl font-bold text-gray-900">18.5%</p>
              </div>
              <TrendingUp className="text-orange-500 w-8 h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="p-4 border rounded-lg hover:border-blue-200 dark:hover:border-blue-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {campaign.name}
                      </h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{campaign.recipients.toLocaleString()} recipients</span>
                      </div>
                      
                      {campaign.status === "sent" && (
                        <>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{campaign.openRate}% opened</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart3 className="w-4 h-4" />
                            <span>{campaign.clickRate}% clicked</span>
                          </div>
                        </>
                      )}
                      
                      {campaign.status === "scheduled" && campaign.scheduledFor && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Scheduled for {formatDate(campaign.scheduledFor)}</span>
                        </div>
                      )}
                      
                      {campaign.status === "sending" && (
                        <div className="flex items-center gap-1">
                          <Send className="w-4 h-4" />
                          <span>{campaign.sentCount.toLocaleString()} / {campaign.recipients.toLocaleString()} sent</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Created {formatDate(campaign.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm">
                      View Details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Campaign</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem>View Analytics</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Delete Campaign
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
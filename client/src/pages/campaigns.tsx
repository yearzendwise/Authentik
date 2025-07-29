import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Users, Target } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: "Active" | "Paused" | "Completed";
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: string;
  endDate: string;
}

const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Spring Sale 2024",
    type: "Email Marketing",
    status: "Active",
    budget: 5000,
    spent: 3245,
    impressions: 45200,
    clicks: 1890,
    conversions: 78,
    startDate: "2024-03-01",
    endDate: "2024-03-31"
  },
  {
    id: "2",
    name: "Product Launch Campaign",
    type: "Social Media",
    status: "Active",
    budget: 8000,
    spent: 6120,
    impressions: 89500,
    clicks: 4230,
    conversions: 156,
    startDate: "2024-03-10",
    endDate: "2024-04-10"
  },
  {
    id: "3",
    name: "Customer Retention Program",
    type: "Multi-channel",
    status: "Paused",
    budget: 3500,
    spent: 1890,
    impressions: 23100,
    clicks: 890,
    conversions: 34,
    startDate: "2024-02-15",
    endDate: "2024-05-15"
  },
  {
    id: "4",
    name: "Summer Collection Teaser",
    type: "Display Ads",
    status: "Active",
    budget: 4500,
    spent: 2100,
    impressions: 67800,
    clicks: 2345,
    conversions: 92,
    startDate: "2024-03-20",
    endDate: "2024-04-20"
  },
  {
    id: "5",
    name: "Holiday Special Offers",
    type: "Email Marketing",
    status: "Completed",
    budget: 6000,
    spent: 5980,
    impressions: 98000,
    clicks: 5600,
    conversions: 234,
    startDate: "2023-12-01",
    endDate: "2023-12-31"
  }
];

export function CampaignsPage() {
  const activeCampaigns = mockCampaigns.filter(c => c.status === "Active").length;
  const totalSpent = mockCampaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalConversions = mockCampaigns.reduce((sum, c) => sum + c.conversions, 0);
  const totalImpressions = mockCampaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = mockCampaigns.reduce((sum, c) => sum + c.clicks, 0);
  const averageConversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(1) : "0";
  const totalReach = Math.round(totalImpressions / 1000);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and monitor your marketing campaigns</p>
        </div>

        <div className="space-y-6">
        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCampaigns}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageConversionRate}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalSpent / 1000).toFixed(1)}K</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReach}K</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Campaigns Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Campaigns</h2>
          <div className="space-y-4">
            {mockCampaigns.map((campaign) => {
              const budgetUsage = (campaign.spent / campaign.budget) * 100;
              const formatNumber = (num: number) => {
                if (num >= 1000) {
                  return `${(num / 1000).toFixed(1)}K`;
                }
                return num.toString();
              };

              return (
                <Card key={campaign.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-gray-500">{campaign.type}</p>
                      </div>
                      <Badge 
                        variant={
                          campaign.status === "Active" ? "success" : 
                          campaign.status === "Paused" ? "warning" : 
                          "secondary"
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Budget</p>
                        <p className="font-semibold">${campaign.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Spent</p>
                        <p className="font-semibold">${campaign.spent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Impressions</p>
                        <p className="font-semibold">{formatNumber(campaign.impressions)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Clicks</p>
                        <p className="font-semibold">{campaign.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Conversions</p>
                        <p className="font-semibold text-green-600">{campaign.conversions}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Budget Usage</span>
                        <span className="font-medium">{budgetUsage.toFixed(0)}%</span>
                      </div>
                      <Progress value={budgetUsage} className="h-2" />
                    </div>

                    <div className="mt-4 flex justify-between text-sm text-gray-500">
                      <span>Period</span>
                      <span>{campaign.startDate} - {campaign.endDate}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
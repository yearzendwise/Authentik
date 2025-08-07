import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Send, Mail, Server, Clock, CheckCircle, XCircle, Zap, BarChart3 } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

interface EmailTrackingEntry {
  id: string;
  userId: string;
  tenantId: string;
  emailId: string;
  status: string;
  timestamp: string;
  temporalWorkflow?: string;
  metadata?: Record<string, any>;
}

interface EmailCampaignData {
  recipient: string;
  subject: string;
  content: string;
  templateType: string;
  priority: string;
}

export default function EmailCampaignsPage() {
  const { toast } = useToast();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [campaignData, setCampaignData] = useState<EmailCampaignData>({
    recipient: "test@example.com",
    subject: "Test Email Campaign",
    content: "This is a test email sent through the Go backend and Temporal workflow system.",
    templateType: "marketing",
    priority: "normal"
  });

  // Query to check Go server health
  const { data: serverHealth, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['/go-server-health'],
    queryFn: async () => {
      const response = await fetch('https://tengine.zendwise.work/health');
      if (!response.ok) throw new Error('Go server not available');
      return response.json();
    },
    refetchInterval: 10000, // Check health every 10 seconds
  });

  // Query to get email tracking entries from Go server
  const { data: trackingEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ['/go-server-tracking', accessToken],
    queryFn: async () => {
      if (!accessToken) {
        console.log('🔍 [Tracking] No access token available, skipping fetch');
        return { entries: [], count: 0 };
      }
      
      const response = await fetch('https://tengine.zendwise.work/api/email-tracking', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch tracking entries');
      return response.json();
    },
    enabled: !!accessToken, // Only run query if we have a token
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Mutation to send email campaign to Go server
  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignData: EmailCampaignData) => {
      // Use token from Redux state (passed from component)
      const token = accessToken;
      
      console.log('🔍 [Campaign] Token check:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'None'
      });
      
      if (!token) {
        console.error('❌ [Campaign] No authentication token available');
        console.error('🔍 [Campaign] Please check:');
        console.error('1. Are you logged in?');
        console.error('2. Try refreshing the page');
        console.error('3. Check if you have been logged out');
        throw new Error('No authentication token available. Please make sure you are logged in.');
      }
      
      const emailId = `campaign-${Date.now()}`;
      
      const payload = {
        emailId,
        status: "queued",
        temporalWorkflow: `email-workflow-${emailId}`,
        metadata: {
          recipient: campaignData.recipient,
          subject: campaignData.subject,
          content: campaignData.content,
          templateType: campaignData.templateType,
          priority: campaignData.priority,
          sentAt: new Date().toISOString(),
        }
      };

      console.log('🚀 [Campaign] Sending request to Go server:', {
        url: 'https://tengine.zendwise.work/api/email-tracking',
        tokenLength: token.length,
        emailId: emailId
      });

      const response = await fetch('https://tengine.zendwise.work/api/email-tracking', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 [Campaign] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ [Campaign] Request failed:', {
          status: response.status,
          error: error
        });
        throw new Error(`Failed to send campaign: ${error}`);
      }

      const result = await response.json();
      console.log('✅ [Campaign] Request successful:', result);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Campaign Sent Successfully",
        description: `Email campaign queued with ID: ${data.id}`,
      });
      // Refresh tracking entries
      queryClient.invalidateQueries({ queryKey: ['/go-server-tracking'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Campaign Failed",
        description: error.message,
      });
    },
  });

  const handleSendCampaign = () => {
    if (!campaignData.recipient || !campaignData.subject) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in recipient and subject fields.",
      });
      return;
    }
    sendCampaignMutation.mutate(campaignData);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'queued': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'sent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'delivered': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'bounced': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'queued': return <Clock className="h-3 w-3" />;
      case 'sent': return <Send className="h-3 w-3" />;
      case 'delivered': return <CheckCircle className="h-3 w-3" />;
      case 'failed': return <XCircle className="h-3 w-3" />;
      case 'bounced': return <XCircle className="h-3 w-3" />;
      default: return <Mail className="h-3 w-3" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Email Campaigns
          </h1>
          <p className="text-lg text-muted-foreground">
            Test email campaigns through Go backend and Temporal workflows
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-card rounded-lg border shadow-sm">
          <Server className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium">Go Server:</span>
          {healthLoading ? (
            <Badge variant="outline" className="gap-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
              Checking...
            </Badge>
          ) : healthError ? (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              Offline
            </Badge>
          ) : serverHealth ? (
            <Badge variant="default" className="bg-green-600 gap-1">
              <CheckCircle className="h-3 w-3" />
              Online
            </Badge>
          ) : (
            <Badge variant="outline">Unknown</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Campaign Composer - Larger card */}
        <Card className="xl:col-span-2 shadow-lg border-l-4 border-l-blue-500">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              Campaign Composer
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Create and send test email campaigns through the Go backend
            </p>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="recipient" className="text-sm font-semibold">Recipient Email</Label>
                <Input
                  id="recipient"
                  type="email"
                  value={campaignData.recipient}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, recipient: e.target.value }))}
                  placeholder="Enter recipient email"
                  className="h-11"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="subject" className="text-sm font-semibold">Subject Line</Label>
                <Input
                  id="subject"
                  value={campaignData.subject}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter email subject"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="content" className="text-sm font-semibold">Email Content</Label>
              <Textarea
                id="content"
                value={campaignData.content}
                onChange={(e) => setCampaignData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter email content"
                className="min-h-[140px] resize-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="template" className="text-sm font-semibold">Template Type</Label>
                <select
                  id="template"
                  value={campaignData.templateType}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, templateType: e.target.value }))}
                  className="w-full px-4 py-3 border border-input bg-background rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="marketing">📈 Marketing</option>
                  <option value="transactional">🔄 Transactional</option>
                  <option value="newsletter">📰 Newsletter</option>
                  <option value="notification">🔔 Notification</option>
                </select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="priority" className="text-sm font-semibold">Priority Level</Label>
                <select
                  id="priority"
                  value={campaignData.priority}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-4 py-3 border border-input bg-background rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">🔹 Low</option>
                  <option value="normal">🔸 Normal</option>
                  <option value="high">🔶 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <Button
                onClick={handleSendCampaign}
                disabled={sendCampaignMutation.isPending || !serverHealth}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                {sendCampaignMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                    Sending Campaign...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-3" />
                    Send Campaign to Temporal
                  </>
                )}
              </Button>

              {!serverHealth && (
                <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <XCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Go server must be online to send campaigns
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Server Status & Info */}
        <Card className="shadow-lg border-l-4 border-l-green-500">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Server className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              Backend Status
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Go server and Temporal connectivity
            </p>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            {healthLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
                <p className="text-sm text-muted-foreground">Checking server status...</p>
              </div>
            ) : healthError ? (
              <div className="text-center py-6">
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-full w-fit mx-auto mb-4">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto" />
                </div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                  Go server is offline or unreachable
                </p>
                <p className="text-xs text-muted-foreground">
                  Make sure the server is accessible at https://tengine.zendwise.work
                </p>
              </div>
            ) : serverHealth ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <span className="text-sm font-semibold">Server Status:</span>
                  <Badge variant="default" className="bg-green-600 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {serverHealth.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <span className="text-sm font-semibold">Temporal:</span>
                  <Badge variant={serverHealth.temporal?.includes("connected") ? "default" : "secondary"} className="gap-1">
                    {serverHealth.temporal?.includes("connected") ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {serverHealth.temporal}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <span className="text-sm font-semibold">Mode:</span>
                  <Badge variant="outline" className="gap-1">
                    <Server className="h-3 w-3" />
                    {serverHealth.mode || "production"}
                  </Badge>
                </div>
                <div className="text-xs text-center text-muted-foreground pt-2 border-t">
                  Last checked: {new Date(serverHealth.time).toLocaleTimeString()}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Email Tracking Entries */}
      <Card className="shadow-lg border-l-4 border-l-purple-500">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            Email Tracking Entries
            {entriesLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 ml-2" />
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Real-time tracking of email campaign status and workflow execution
          </p>
        </CardHeader>
        <CardContent className="p-6">
          {entriesLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4" />
              <p className="text-sm text-muted-foreground">Loading tracking entries...</p>
            </div>
          ) : trackingEntries?.entries?.length > 0 ? (
            <div className="space-y-4">
              {trackingEntries.entries.map((entry: EmailTrackingEntry) => (
                <div
                  key={entry.id}
                  className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className={`${getStatusColor(entry.status)} gap-1 px-3 py-1`}>
                          {getStatusIcon(entry.status)}
                          <span className="font-medium">{entry.status}</span>
                        </Badge>
                        <span className="text-sm font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                          {entry.emailId}
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {entry.metadata?.recipient && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">TO:</span>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {entry.metadata.recipient}
                            </p>
                          </div>
                        )}
                        {entry.metadata?.subject && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">SUBJECT:</span>
                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                              {entry.metadata.subject}
                            </p>
                          </div>
                        )}
                      </div>
                      {entry.temporalWorkflow && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-purple-500">WORKFLOW:</span>
                          <p className="text-xs font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 px-2 py-1 rounded">
                            {entry.temporalWorkflow}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
                <Mail className="h-12 w-12 text-gray-400 mx-auto" />
              </div>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                No email tracking entries found
              </p>
              <p className="text-sm text-muted-foreground">
                Send a campaign to see tracking entries appear here
              </p>
            </div>
          )}
          
          {trackingEntries && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  Total tracking entries: {trackingEntries.count || 0}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
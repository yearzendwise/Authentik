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
import { Send, Mail, Server, Clock, CheckCircle, XCircle, Zap } from "lucide-react";

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
      const response = await fetch('http://localhost:8083/health');
      if (!response.ok) throw new Error('Go server not available');
      return response.json();
    },
    refetchInterval: 10000, // Check health every 10 seconds
  });

  // Query to get email tracking entries from Go server
  const { data: trackingEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ['/go-server-tracking'],
    queryFn: async () => {
      // Get token from Redux store or localStorage
      const state = (window as any).__REDUX_STORE__?.getState();
      const token = state?.auth?.accessToken || localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      
      const response = await fetch('http://localhost:8083/api/email-tracking', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch tracking entries');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Mutation to send email campaign to Go server
  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignData: EmailCampaignData) => {
      // Get token from Redux store or localStorage
      const state = (window as any).__REDUX_STORE__?.getState();
      const token = state?.auth?.accessToken || localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      
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

      const response = await fetch('http://localhost:8083/api/email-tracking', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send campaign: ${error}`);
      }

      return response.json();
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
          <p className="text-muted-foreground">
            Test email campaigns through Go backend and Temporal workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4" />
          <span className="text-sm font-medium">Go Server Status:</span>
          {healthLoading ? (
            <Badge variant="outline">Checking...</Badge>
          ) : healthError ? (
            <Badge variant="destructive">Offline</Badge>
          ) : serverHealth ? (
            <Badge variant="default" className="bg-green-600">Online</Badge>
          ) : (
            <Badge variant="outline">Unknown</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Campaign Composer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Campaign Composer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Email</Label>
              <Input
                id="recipient"
                type="email"
                value={campaignData.recipient}
                onChange={(e) => setCampaignData(prev => ({ ...prev, recipient: e.target.value }))}
                placeholder="Enter recipient email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={campaignData.subject}
                onChange={(e) => setCampaignData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Email Content</Label>
              <Textarea
                id="content"
                value={campaignData.content}
                onChange={(e) => setCampaignData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter email content"
                className="min-h-[120px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template">Template Type</Label>
                <select
                  id="template"
                  value={campaignData.templateType}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, templateType: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="marketing">Marketing</option>
                  <option value="transactional">Transactional</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="notification">Notification</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={campaignData.priority}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <Separator />

            <Button
              onClick={handleSendCampaign}
              disabled={sendCampaignMutation.isPending || !serverHealth}
              className="w-full"
            >
              {sendCampaignMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending Campaign...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Send Campaign to Temporal
                </>
              )}
            </Button>

            {!serverHealth && (
              <p className="text-sm text-muted-foreground text-center">
                Go server must be online to send campaigns
              </p>
            )}
          </CardContent>
        </Card>

        {/* Server Status & Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Go Backend Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {healthLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : healthError ? (
              <div className="text-center py-4">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Go server is offline or unreachable
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Make sure the server is running on port 8083
                </p>
              </div>
            ) : serverHealth ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant="default" className="bg-green-600">
                    {serverHealth.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Temporal:</span>
                  <Badge variant={serverHealth.temporal === "connected" ? "default" : "secondary"}>
                    {serverHealth.temporal}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Mode:</span>
                  <Badge variant="outline">
                    {serverHealth.mode || "production"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Last checked: {new Date(serverHealth.time).toLocaleTimeString()}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Email Tracking Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Tracking Entries
            {entriesLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : trackingEntries?.entries?.length > 0 ? (
            <div className="space-y-3">
              {trackingEntries.entries.map((entry: EmailTrackingEntry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(entry.status)}>
                        {getStatusIcon(entry.status)}
                        <span className="ml-1">{entry.status}</span>
                      </Badge>
                      <span className="text-sm font-medium">ID: {entry.emailId}</span>
                    </div>
                    {entry.metadata?.recipient && (
                      <p className="text-sm text-muted-foreground">
                        To: {entry.metadata.recipient}
                      </p>
                    )}
                    {entry.metadata?.subject && (
                      <p className="text-sm text-muted-foreground">
                        Subject: {entry.metadata.subject}
                      </p>
                    )}
                    {entry.temporalWorkflow && (
                      <p className="text-xs text-muted-foreground">
                        Workflow: {entry.temporalWorkflow}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No email tracking entries found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Send a campaign to see tracking entries appear here
              </p>
            </div>
          )}
          
          {trackingEntries && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Total entries: {trackingEntries.count || 0}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
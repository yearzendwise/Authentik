import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { ArrowLeft, Save, Send, Eye, Users, Tag, User } from "lucide-react";
import { CustomerSegmentationModal } from "@/components/CustomerSegmentationModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { createNewsletterSchema, type CreateNewsletterData } from "@shared/schema";

export default function NewsletterCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSegmentationModalOpen, setIsSegmentationModalOpen] = useState(false);
  const [segmentationData, setSegmentationData] = useState({
    recipientType: 'all' as 'all' | 'selected' | 'tags',
    selectedContactIds: [] as string[],
    selectedTagIds: [] as string[],
  });

  const form = useForm<CreateNewsletterData>({
    resolver: zodResolver(createNewsletterSchema),
    defaultValues: {
      title: "",
      subject: "",
      content: "",
      status: "draft",
      recipientType: "all",
      selectedContactIds: [],
      selectedTagIds: [],
    },
  });

  // Create newsletter mutation
  const createNewsletterMutation = useMutation({
    mutationFn: (data: CreateNewsletterData) => 
      apiRequest('POST', '/api/newsletters', data).then(res => res.json()),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/newsletters'] });
      queryClient.invalidateQueries({ queryKey: ['/api/newsletter-stats'] });
      toast({
        title: "Success",
        description: "Newsletter created successfully",
      });
      setLocation('/newsletter');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create newsletter",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateNewsletterData) => {
    const newsletterData = {
      ...data,
      ...segmentationData,
    };
    createNewsletterMutation.mutate(newsletterData);
  };

  const handleSaveAsDraft = () => {
    const data = form.getValues();
    const newsletterData = {
      ...data,
      ...segmentationData,
      status: "draft" as const,
    };
    createNewsletterMutation.mutate(newsletterData);
  };

  const handleSchedule = () => {
    const data = form.getValues();
    const newsletterData = {
      ...data,
      ...segmentationData,
      status: "scheduled" as const,
    };
    createNewsletterMutation.mutate(newsletterData);
  };

  const handleSendNow = () => {
    const data = form.getValues();
    const newsletterData = {
      ...data,
      ...segmentationData,
      status: "sent" as const,
    };
    createNewsletterMutation.mutate(newsletterData);
  };

  const handleSegmentationSave = (data: {
    recipientType: 'all' | 'selected' | 'tags';
    selectedContactIds: string[];
    selectedTagIds: string[];
  }) => {
    setSegmentationData(data);
  };

  const getSegmentationSummary = () => {
    switch (segmentationData.recipientType) {
      case 'all':
        return { text: 'All customers', icon: Users };
      case 'selected':
        return { 
          text: `${segmentationData.selectedContactIds.length} selected customers`, 
          icon: User 
        };
      case 'tags':
        return { 
          text: `${segmentationData.selectedTagIds.length} selected tags`, 
          icon: Tag 
        };
      default:
        return { text: 'All customers', icon: Users };
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/newsletter')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Newsletters
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Newsletter
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Design and send your newsletter to engage with subscribers
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Newsletter Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Newsletter Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Newsletter Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter newsletter title..."
                    {...form.register("title")}
                    className="mt-1"
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="subject">Email Subject Line</Label>
                  <Input
                    id="subject"
                    placeholder="Enter email subject line..."
                    {...form.register("subject")}
                    className="mt-1"
                  />
                  {form.formState.errors.subject && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.subject.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Content Card */}
            <Card>
              <CardHeader>
                <CardTitle>Newsletter Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="content">Newsletter Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your newsletter content here..."
                    {...form.register("content")}
                    className="mt-1 min-h-[400px]"
                  />
                  {form.formState.errors.content && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.content.message}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    You can use HTML tags for formatting your newsletter content.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Subject: {form.watch("subject") || "Your subject line will appear here"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 max-h-32 overflow-y-auto">
                    {form.watch("content") || "Your newsletter content will appear here..."}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Segmentation Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Recipients
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Target Audience</Label>
                  <div 
                    className="mt-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsSegmentationModalOpen(true)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const summary = getSegmentationSummary();
                          const IconComponent = summary.icon;
                          return (
                            <>
                              <IconComponent className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {summary.text}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Click to modify
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Choose who will receive this newsletter
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value) => form.setValue("status", value as "draft" | "scheduled" | "sent")}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="scheduledAt">Schedule Date (Optional)</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    className="mt-1"
                    onChange={(e) => {
                      if (e.target.value) {
                        form.setValue("scheduledAt", new Date(e.target.value));
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="button"
                  onClick={handleSaveAsDraft}
                  variant="outline"
                  className="w-full"
                  disabled={createNewsletterMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>

                <Button
                  type="button"
                  onClick={handleSchedule}
                  variant="outline"
                  className="w-full"
                  disabled={createNewsletterMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Schedule for Later
                </Button>

                <Button
                  type="button"
                  onClick={handleSendNow}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={createNewsletterMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Now
                </Button>

                {createNewsletterMutation.isPending && (
                  <p className="text-sm text-gray-500 text-center">
                    Creating newsletter...
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Customer Segmentation Modal */}
      <CustomerSegmentationModal
        isOpen={isSegmentationModalOpen}
        onClose={() => setIsSegmentationModalOpen(false)}
        recipientType={segmentationData.recipientType}
        selectedContactIds={segmentationData.selectedContactIds}
        selectedTagIds={segmentationData.selectedTagIds}
        onSave={handleSegmentationSave}
      />
    </div>
  );
}
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

import {
  ArrowLeft,
  Save,
  Loader2,
  Target,
  DollarSign,
  TrendingUp,
  CalendarIcon,
  X,
} from "lucide-react";

import {
  createCampaignSchema,
  type CreateCampaignData,
  type Campaign,
  type User,
} from "@shared/schema";

export default function EditCampaignPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/email-campaigns/edit/:id");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [goals, setGoals] = useState<string[]>([]);
  const [currentGoal, setCurrentGoal] = useState("");

  if (!match || !params?.id) {
    setLocation("/email-campaigns");
    return null;
  }

  const campaignId = params.id;

  // Fetch existing campaign
  const { data: campaignData, isLoading: isCampaignLoading, error: campaignError } = useQuery({
    queryKey: ["/api/campaigns", campaignId],
    queryFn: async ({ queryKey }) => {
      const res = await apiRequest("GET", `${queryKey[0]}/${queryKey[1]}`);
      return res.json();
    },
  });

  // Fetch managers for reviewer dropdown
  const { data: managersData, isLoading: managersLoading } = useQuery({
    queryKey: ["/api/managers"],
    queryFn: async ({ queryKey }) => {
      const res = await apiRequest("GET", queryKey[0]);
      return res.json();
    },
    staleTime: 60_000,
  });

  const managers = (managersData as any)?.managers || [];

  const form = useForm<CreateCampaignData>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "email",
      status: "draft",
      budget: undefined,
      currency: "USD",
      startDate: undefined,
      endDate: undefined,
      targetAudience: "",
      goals: [],
      kpis: "",
      settings: "",
      requiresReviewerApproval: false,
      reviewerId: "",
    },
  });

  // Prefill form when campaign loads
  useEffect(() => {
    const loaded: Campaign | undefined = (campaignData as any)?.campaign;
    if (loaded) {
      form.reset({
        name: loaded.name || "",
        description: (loaded as any).description || "",
        type: (loaded as any).type || "email",
        status: (loaded as any).status || "draft",
        budget: loaded.budget ? parseFloat(String(loaded.budget)) : undefined,
        currency: (loaded as any).currency || "USD",
        startDate: loaded.startDate ? new Date(loaded.startDate as any) : undefined,
        endDate: loaded.endDate ? new Date(loaded.endDate as any) : undefined,
        targetAudience: (loaded as any).targetAudience || "",
        goals: (loaded as any).goals || [],
        kpis: (loaded as any).kpis || "",
        settings: (loaded as any).settings || "",
        requiresReviewerApproval: (loaded as any).requiresReviewerApproval || false,
        reviewerId: (loaded as any).reviewerId || "",
      });
      setGoals(((loaded as any).goals as string[]) || []);
    }
  }, [campaignData, form]);

  const updateCampaignMutation = useMutation({
    mutationFn: async (data: CreateCampaignData) => {
      // Use CreateCampaignData shape for convenience; server accepts subset via update schema
      return apiRequest("PUT", `/api/campaigns/${campaignId}`, data);
    },
    onSuccess: async () => {
      toast({ title: "Success", description: "Campaign updated successfully." });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaign-stats"] });
      setLocation("/email-campaigns");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update campaign.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateCampaignData) => {
    const payload: CreateCampaignData = {
      ...data,
      goals,
      // Ensure numeric types are correct
      budget: typeof data.budget === "number" ? data.budget : undefined,
    };
    updateCampaignMutation.mutate(payload);
  };

  const addGoal = () => {
    if (currentGoal.trim() && !goals.includes(currentGoal.trim())) {
      const newGoals = [...goals, currentGoal.trim()];
      setGoals(newGoals);
      form.setValue("goals", newGoals);
      setCurrentGoal("");
    }
  };

  const removeGoal = (goalToRemove: string) => {
    const newGoals = goals.filter((g) => g !== goalToRemove);
    setGoals(newGoals);
    form.setValue("goals", newGoals);
  };

  if (isCampaignLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (campaignError || !(campaignData as any)?.campaign) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Campaign not found</h3>
              <p className="text-muted-foreground mb-4">
                The campaign you're trying to edit doesn't exist or has been deleted.
              </p>
              <Button onClick={() => setLocation("/email-campaigns")}> 
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/email-campaigns")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Edit Campaign
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Update your marketing campaign details.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Edit core details of your marketing campaign.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter campaign name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your campaign objectives and strategy"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select campaign type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email Marketing</SelectItem>
                          <SelectItem value="sms">SMS Marketing</SelectItem>
                          <SelectItem value="push">Push Notifications</SelectItem>
                          <SelectItem value="social">Social Media</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Budget and Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget & Timeline
              </CardTitle>
              <CardDescription>
                Update your campaign budget and schedule.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CAD">CAD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a start date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick an end date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Goals and Targeting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Goals & Targeting
              </CardTitle>
              <CardDescription>
                Update your campaign goals and target audience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <FormLabel htmlFor="goals">Campaign Goals</FormLabel>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="goals"
                    placeholder="Enter a campaign goal"
                    value={currentGoal}
                    onChange={(e) => setCurrentGoal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addGoal();
                      }
                    }}
                  />
                  <Button type="button" onClick={addGoal} variant="outline">
                    Add
                  </Button>
                </div>
                {goals.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {goals.map((goal, index) => (
                      <Badge
                        key={`${goal}-${index}`}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeGoal(goal)}
                      >
                        {goal} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your target audience demographics, interests, and characteristics"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kpis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Performance Indicators (KPIs)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Define success metrics and KPIs for this campaign (e.g., conversion rate, ROI, engagement rate)"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Review & Approval */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Review & Approval
              </CardTitle>
              <CardDescription>
                Configure approval workflow for this campaign.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="requiresReviewerApproval"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      {/* Checkbox uses boolean; ensure it toggles correctly */}
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Requires Reviewer Approval</FormLabel>
                      <FormDescription>
                        This campaign will require approval from a manager before it can be activated.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("requiresReviewerApproval") && (
                <FormField
                  control={form.control}
                  name="reviewerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Reviewer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={managersLoading ? "Loading managers..." : "Select a manager"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {managersLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading managers...
                            </SelectItem>
                          ) : managers.length === 0 ? (
                            <SelectItem value="no-managers" disabled>
                              No managers available
                            </SelectItem>
                          ) : (
                            managers.map((manager: User) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.firstName} {manager.lastName} - {manager.email} ({manager.role})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/email-campaigns")}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateCampaignMutation.isPending}>
              {updateCampaignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}



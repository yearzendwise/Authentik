import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Edit, Save, X, Globe, Mail, Phone, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useReduxAuth } from "@/hooks/useReduxAuth";
import type { Company, CreateCompanyData, UpdateCompanyData } from "@shared/schema";
import { createCompanySchema, updateCompanySchema } from "@shared/schema";

interface CompanyWithOwner extends Company {
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function CompanyPage() {
  const { toast } = useToast();
  const { user } = useReduxAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Check if user can edit company information (Owner or Administrator)
  const canEdit = user?.role === "Owner" || user?.role === "Administrator";

  // Fetch user's company
  const { data: company, isLoading } = useQuery({
    queryKey: ["/api/company"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/company");
      const data = await response.json();
      return data.company as CompanyWithOwner | null;
    },
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (data: CreateCompanyData) => {
      const response = await apiRequest("POST", "/api/company", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Company information created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create company information.",
        variant: "destructive",
      });
    },
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: UpdateCompanyData) => {
      const response = await apiRequest("PATCH", "/api/company", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Company information updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update company information.",
        variant: "destructive",
      });
    },
  });

  // Form for create/update
  const form = useForm<CreateCompanyData | UpdateCompanyData>({
    resolver: zodResolver(company ? updateCompanySchema : createCompanySchema),
    defaultValues: {
      name: "",
      address: "",
      companyType: "",
      companyEmail: "",
      phone: "",
      website: "",
      description: "",
      ...(company && { isActive: true }),
    },
  });

  // Update form values when company data loads
  useEffect(() => {
    if (company && isEditing) {
      form.reset({
        name: company.name,
        address: company.address || "",
        companyType: company.industry || "",
        companyEmail: company.email || "",
        phone: company.phone || "",
        website: company.website || "",
        description: company.description || "",
        isActive: company.isActive ?? true,
      });
    }
  }, [company, isEditing, form]);

  const handleSubmit = (data: CreateCompanyData | UpdateCompanyData) => {
    if (company) {
      updateCompanyMutation.mutate(data as UpdateCompanyData);
    } else {
      createCompanyMutation.mutate(data as CreateCompanyData);
    }
  };

  const handleEdit = () => {
    if (!canEdit) return;
    setIsEditing(true);
    if (company) {
      form.reset({
        name: company.name,
        address: company.address || "",
        companyType: company.industry || "",
        companyEmail: company.email || "",
        phone: company.phone || "",
        website: company.website || "",
        description: company.description || "",
        isActive: company.isActive ?? true,
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.reset();
  };

  const companyTypes = [
    "Corporation",
    "LLC",
    "Partnership", 
    "Sole Proprietorship",
    "Non-Profit",
    "Government",
    "Other"
  ];

  if (isLoading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="mb-8">
              <div className="flex items-center space-x-4">
                <Building2 className="text-blue-600 dark:text-blue-500 w-8 h-8" />
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                    Company Information
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Loading company details
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!company && !isEditing) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <Building2 className="text-blue-600 dark:text-blue-500 w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                  Company Information
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Set up your company profile to get started
                </p>
              </div>
            </div>
          </div>

          <Card className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-blue-500 dark:text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">No company information found</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                {canEdit ? "Get started by adding your company details." : "Company information will be displayed here once it's added by an Owner or Administrator."}
              </p>
              {canEdit && (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Add Company Information
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <Building2 className="text-blue-600 dark:text-blue-500 w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                  {company ? "Edit Company Information" : "Add Company Information"}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {company ? "Update your company details" : "Set up your company profile"}
                </p>
              </div>
            </div>
          </div>
          
          <Card className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30">
            <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="companyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companyTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="company@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter company address" 
                          className="resize-none" 
                          rows={3}
                          {...field} 
                        />
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
                          placeholder="Enter company description" 
                          className="resize-none" 
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCompanyMutation.isPending || updateCompanyMutation.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {createCompanyMutation.isPending || updateCompanyMutation.isPending
                      ? "Saving..."
                      : "Save Company Information"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  // This should never happen due to the guards above, but TypeScript doesn't know that
  if (!company) {
    return null;
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Building2 className="text-blue-600 dark:text-blue-500 w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                  Company Information
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  View and manage your company details
                </p>
              </div>
            </div>
            {canEdit && (
              <Button 
                onClick={handleEdit}
                variant="outline" 
                className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700/50 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/40 dark:hover:to-blue-700/40 transition-all duration-300 text-blue-700 dark:text-blue-300"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Information
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6">
        {/* Company Overview Card */}
        <Card className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30 hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-500" />
                <div>
                  <CardTitle>{company.name}</CardTitle>
                  {company.industry && (
                    <CardDescription>
                      <Badge variant="outline" className="mt-1">
                        {company.industry}
                      </Badge>
                    </CardDescription>
                  )}
                </div>
              </div>
              <Badge variant={company.isActive ? "default" : "secondary"}>
                {company.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {company.description && (
              <p className="text-sm text-muted-foreground mb-6">
                {company.description}
              </p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Contact Information</h3>
                
                {company.email && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${company.email}`} className="hover:underline">
                      {company.email}
                    </a>
                  </div>
                )}
                
                {company.phone && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{company.phone}</span>
                  </div>
                )}
                
                {company.website && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>
                )}

                {!company.companyEmail && !company.phone && !company.website && (
                  <p className="text-sm text-muted-foreground">
                    No contact information available
                  </p>
                )}
              </div>

              {/* Location & Owner */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Details</h3>
                
                {company.address && (
                  <div className="flex items-start space-x-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="whitespace-pre-line">{company.address}</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Owner:</span>{" "}
                    {company.owner.firstName} {company.owner.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {company.owner.email}
                  </div>
                </div>

                {!company.address && (
                  <div className="text-sm text-muted-foreground">
                    No address specified
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information Card */}
        <Card className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30 hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-base text-gray-900 dark:text-gray-100">Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Created:</span>{" "}
                {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : "Unknown"}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{" "}
                {company.updatedAt ? new Date(company.updatedAt).toLocaleDateString() : "Unknown"}
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
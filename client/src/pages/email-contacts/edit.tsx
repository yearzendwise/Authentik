import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
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
import { ArrowLeft, Save, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Schema for the form
const editContactSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  status: z.enum(['active', 'unsubscribed', 'bounced', 'pending']),
  tags: z.array(z.string()).optional(),
  lists: z.array(z.string()).optional(),
});

type EditContactForm = z.infer<typeof editContactSchema>;

export default function EditEmailContact() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/email-contacts/edit/:id");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  if (!match || !params?.id) {
    setLocation("/email-contacts");
    return null;
  }

  const contactId = params.id;

  // Fetch contact data
  const { data: contactData, isLoading: isContactLoading, error: contactError } = useQuery({
    queryKey: ["/api/email-contacts", contactId],
    queryFn: async ({ queryKey }) => {
      const res = await apiRequest("GET", `${queryKey[0]}/${queryKey[1]}`);
      return res.json();
    },
  });

  // Fetch available tags
  const { data: tagsData } = useQuery({
    queryKey: ["/api/email-contacts/tags"],
    queryFn: async ({ queryKey }) => {
      const res = await apiRequest("GET", queryKey[0]);
      return res.json();
    },
  });

  // Fetch available lists
  const { data: listsData } = useQuery({
    queryKey: ["/api/email-lists"],
    queryFn: async ({ queryKey }) => {
      const res = await apiRequest("GET", queryKey[0]);
      return res.json();
    },
  });

  const form = useForm<EditContactForm>({
    resolver: zodResolver(editContactSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      status: "active",
      tags: [],
      lists: [],
    },
  });

  // Update form when contact data is loaded
  useEffect(() => {
    if ((contactData as any)?.contact) {
      const contact = (contactData as any).contact;
      form.reset({
        email: contact.email || "",
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        status: contact.status || "active",
        tags: contact.tags?.map((tag: any) => tag.id) || [],
        lists: contact.lists?.map((list: any) => list.id) || [],
      });
      setSelectedTags(contact.tags?.map((tag: any) => tag.id) || []);
      setSelectedLists(contact.lists?.map((list: any) => list.id) || []);
    }
  }, [contactData, form]);

  const updateContactMutation = useMutation({
    mutationFn: async (data: EditContactForm) => {
      const response = await fetch(`/api/email-contacts/${contactId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update contact");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contact updated",
        description: "Email contact has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/email-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email-contacts", contactId] });
      setLocation("/email-contacts");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditContactForm) => {
    const formData = {
      ...data,
      tags: selectedTags,
      lists: selectedLists,
    };
    updateContactMutation.mutate(formData);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const toggleList = (listId: string) => {
    setSelectedLists(prev => 
      prev.includes(listId) 
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    );
  };

  if (isContactLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (contactError || !(contactData as any)?.contact) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Contact not found</h3>
              <p className="text-muted-foreground mb-4">
                The contact you're looking for doesn't exist or has been deleted.
              </p>
              <Button onClick={() => setLocation("/email-contacts")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Contacts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contact = (contactData as any)?.contact;
  const availableTags = (tagsData as any)?.tags || [];
  const availableLists = (listsData as any)?.lists || [];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/email-contacts")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contacts
        </Button>
        <h1 className="text-3xl font-bold">Edit Contact</h1>
        <p className="text-muted-foreground">
          Update contact information and manage their subscription status.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Update the contact's details and subscription status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="contact@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Status */}
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
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                            <SelectItem value="bounced">Bounced</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tags */}
                  {availableTags.length > 0 && (
                    <div className="space-y-3">
                      <FormLabel>Tags</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {availableTags.map((tag: any) => (
                          <div key={tag.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`tag-${tag.id}`}
                              checked={selectedTags.includes(tag.id)}
                              onCheckedChange={() => toggleTag(tag.id)}
                            />
                            <label
                              htmlFor={`tag-${tag.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {tag.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTags.map(tagId => {
                            const tag = availableTags.find((t: any) => t.id === tagId);
                            return tag ? (
                              <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
                                {tag.name}
                                <X 
                                  className="h-3 w-3 cursor-pointer" 
                                  onClick={() => toggleTag(tagId)}
                                />
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lists */}
                  {availableLists.length > 0 && (
                    <div className="space-y-3">
                      <FormLabel>Email Lists</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {availableLists.map((list: any) => (
                          <div key={list.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`list-${list.id}`}
                              checked={selectedLists.includes(list.id)}
                              onCheckedChange={() => toggleList(list.id)}
                            />
                            <label
                              htmlFor={`list-${list.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {list.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      {selectedLists.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedLists.map(listId => {
                            const list = availableLists.find((l: any) => l.id === listId);
                            return list ? (
                              <Badge key={listId} variant="outline" className="flex items-center gap-1">
                                {list.name}
                                <X 
                                  className="h-3 w-3 cursor-pointer" 
                                  onClick={() => toggleList(listId)}
                                />
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex items-center gap-3 pt-6">
                    <Button 
                      type="submit" 
                      disabled={updateContactMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {updateContactMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {updateContactMutation.isPending ? "Updating..." : "Update Contact"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setLocation("/email-contacts")}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Contact Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </p>
              </div>
              {contact.updatedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="text-sm">
                    {new Date(contact.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {contact.consentDate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Consent Date</p>
                  <p className="text-sm">
                    {new Date(contact.consentDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {contact.consentMethod && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Consent Method</p>
                  <p className="text-sm capitalize">
                    {contact.consentMethod.replace('_', ' ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
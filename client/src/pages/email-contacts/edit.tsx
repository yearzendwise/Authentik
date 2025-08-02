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
import { ArrowLeft, Save, Loader2, X, Mail, CheckCircle2, UserCheck, Tag, Calendar } from "lucide-react";
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
    queryKey: ["/api/contact-tags"],
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/20">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/email-contacts")}
            className="mb-6 group hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-0.5" />
            Back to Contacts
          </Button>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
              Edit Contact
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Update contact information and manage their subscription status
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl shadow-slate-200/20 dark:shadow-slate-900/20">
              <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-white/50 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-900/50">
                <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">Contact Information</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Update the contact's details and subscription status
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
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
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/email-contacts")}
                      className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateContactMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
                    >
                      {updateContactMutation.isPending ? (
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
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Summary */}
            <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl shadow-slate-200/20 dark:shadow-slate-900/20">
              <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-white/50 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-900/50">
                <CardTitle className="text-lg text-slate-800 dark:text-slate-200">Contact Summary</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Current contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{contact?.email}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Email Address</p>
                    </div>
                  </div>
                  
                  {(contact?.firstName || contact?.lastName) && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {[contact?.firstName, contact?.lastName].filter(Boolean).join(' ')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Full Name</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <Badge 
                        variant={contact?.status === 'active' ? 'default' : 'secondary'}
                        className={
                          contact?.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          contact?.status === 'unsubscribed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' :
                          contact?.status === 'bounced' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          contact?.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : ''
                        }
                      >
                        {contact?.status}
                      </Badge>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Status</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags Section */}
            <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl shadow-slate-200/20 dark:shadow-slate-900/20">
              <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-white/50 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-900/50">
                <CardTitle className="text-lg text-slate-800 dark:text-slate-200">Current Tags</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Tags assigned to this contact
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {contact?.tags && contact.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag: any) => (
                      <Badge 
                        key={tag.id} 
                        variant="outline"
                        style={{ 
                          backgroundColor: `${tag.color}20`,
                          borderColor: tag.color,
                          color: tag.color 
                        }}
                        className="border-2"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No tags assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Lists Section */}
            <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl shadow-slate-200/20 dark:shadow-slate-900/20">
              <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-white/50 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-900/50">
                <CardTitle className="text-lg text-slate-800 dark:text-slate-200">Current Lists</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Email lists this contact belongs to
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {contact?.lists && contact.lists.length > 0 ? (
                  <div className="space-y-2">
                    {contact.lists.map((list: any) => (
                      <div key={list.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/30">
                          <Mail className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{list.name}</p>
                          {list.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{list.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Not subscribed to any lists</p>
                )}
              </CardContent>
            </Card>

            {/* Contact Details */}
            <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl shadow-slate-200/20 dark:shadow-slate-900/20">
              <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-white/50 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-900/50">
                <CardTitle className="text-lg text-slate-800 dark:text-slate-200">Contact Details</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Additional contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                      <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Date Added</p>
                    </div>
                  </div>
                  
                  {contact.consentDate && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {new Date(contact.consentDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Consent Date</p>
                      </div>
                    </div>
                  )}
                  
                  {contact.consentMethod && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                        <CheckCircle2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">
                          {contact.consentMethod.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Consent Method</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
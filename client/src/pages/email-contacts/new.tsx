import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  UserPlus,
  Mail,
  User,
  Tag,
  List,
  Loader2
} from "lucide-react";
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

// Schema for the form
const addContactSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  status: z.enum(['active', 'unsubscribed', 'bounced', 'pending']).default('active'),
  tags: z.array(z.string()).optional(),
  lists: z.array(z.string()).optional(),
});

type AddContactForm = z.infer<typeof addContactSchema>;

interface ContactTag {
  id: string;
  name: string;
  color: string;
}

interface EmailList {
  id: string;
  name: string;
  description?: string | null;
}

export default function NewEmailContact() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  const form = useForm<AddContactForm>({
    resolver: zodResolver(addContactSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      status: "active",
      tags: [],
      lists: [],
    },
  });

  // Fetch email lists
  const { data: listsData } = useQuery({
    queryKey: ['/api/email-lists'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/email-lists');
      return response.json();
    },
  });

  // Fetch contact tags
  const { data: tagsData } = useQuery({
    queryKey: ['/api/contact-tags'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/contact-tags');
      return response.json();
    },
  });

  const lists: EmailList[] = listsData?.lists || [];
  const tags: ContactTag[] = tagsData?.tags || [];

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: async (data: AddContactForm) => {
      const payload = {
        ...data,
        tags: selectedTags,
        lists: selectedLists,
      };
      const response = await apiRequest('POST', '/api/email-contacts', payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email contact created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-contacts'] });
      setLocation('/email-contacts');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create contact",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddContactForm) => {
    createContactMutation.mutate(data);
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

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/email-contacts')}
            className="p-0 h-auto"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Contact</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Add a new subscriber to your email lists
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="contact@example.com" 
                          {...field} 
                          className="bg-white dark:bg-gray-800"
                        />
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
                        <FormLabel className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          First Name
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John" 
                            {...field} 
                            className="bg-white dark:bg-gray-800"
                          />
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
                          <Input 
                            placeholder="Doe" 
                            {...field} 
                            className="bg-white dark:bg-gray-800"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Status Field */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white dark:bg-gray-800">
                            <SelectValue placeholder="Select contact status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                          <SelectItem value="bounced">Bounced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Lists */}
                {lists.length > 0 && (
                  <div>
                    <Label className="flex items-center gap-2 mb-3">
                      <List className="w-4 h-4" />
                      Email Lists
                    </Label>
                    <FormDescription className="mb-3">
                      Select which lists this contact should be added to
                    </FormDescription>
                    <div className="space-y-2">
                      {lists.map((list) => (
                        <div key={list.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`list-${list.id}`}
                            checked={selectedLists.includes(list.id)}
                            onCheckedChange={() => toggleList(list.id)}
                          />
                          <Label
                            htmlFor={`list-${list.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {list.name}
                            {list.description && (
                              <span className="text-gray-500 ml-2">- {list.description}</span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <div>
                    <Label className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4" />
                      Tags
                    </Label>
                    <FormDescription className="mb-3">
                      Add tags to organize and categorize this contact
                    </FormDescription>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          style={{
                            backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined,
                            borderColor: tag.color,
                            color: selectedTags.includes(tag.id) ? 'white' : tag.color,
                          }}
                          onClick={() => toggleTag(tag.id)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex items-center gap-3 pt-6">
                  <Button
                    type="submit"
                    disabled={createContactMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createContactMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Contact
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/email-contacts')}
                  >
                    Cancel
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
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Plus, 
  Mail, 
  Calendar, 
  Eye, 
  Edit, 
  Trash2, 
  Send,
  Clock,
  FileText,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { NewsletterWithUser } from "@shared/schema";

export default function NewsletterPage() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newsletterToDelete, setNewsletterToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  // Fetch newsletters
  const { data: newslettersData, isLoading } = useQuery({
    queryKey: ['/api/newsletters'],
  });

  // Fetch newsletter stats
  const { data: statsData } = useQuery({
    queryKey: ['/api/newsletter-stats'],
  });

  // Delete newsletter mutation
  const deleteNewsletterMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', `/api/newsletters/${id}`).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/newsletters'] });
      queryClient.invalidateQueries({ queryKey: ['/api/newsletter-stats'] });
      toast({
        title: "Success",
        description: "Newsletter deleted successfully",
      });
      setShowDeleteDialog(false);
      setNewsletterToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete newsletter",
        variant: "destructive",
      });
    },
  });

  const newsletters: NewsletterWithUser[] = (newslettersData as any)?.newsletters || [];
  const stats = (statsData as any) || {
    totalNewsletters: 0,
    draftNewsletters: 0,
    scheduledNewsletters: 0,
    sentNewsletters: 0,
  };

  const handleDeleteNewsletter = (id: string) => {
    setNewsletterToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (newsletterToDelete) {
      deleteNewsletterMutation.mutate(newsletterToDelete);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      case 'sent':
        return <Badge variant="default">Sent</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Newsletters
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage your email newsletters to engage with your subscribers
          </p>
        </div>
        <Button 
          onClick={() => setLocation('/newsletter/create')} 
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Newsletter
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Newsletters
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalNewsletters}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Draft
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.draftNewsletters}
                </p>
              </div>
              <Edit className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Scheduled
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.scheduledNewsletters}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Sent
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.sentNewsletters}
                </p>
              </div>
              <Send className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Newsletters List */}
      {newsletters.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No newsletters yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Get started by creating your first newsletter. You can design beautiful emails 
              to engage with your subscribers and grow your audience.
            </p>
            <Button 
              onClick={() => window.location.href = '/newsletter/create'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Newsletter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {newsletters.map((newsletter) => (
            <Card key={newsletter.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {newsletter.title}
                      </h3>
                      {getStatusBadge(newsletter.status)}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Subject: {newsletter.subject}
                    </p>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created {format(new Date(newsletter.createdAt || new Date()), 'MMM d, yyyy')}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {newsletter.openCount} opens
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {newsletter.recipientCount} recipients
                      </div>
                      
                      <div>
                        By {newsletter.user.firstName} {newsletter.user.lastName}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.location.href = `/newsletters/${newsletter.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = `/newsletters/${newsletter.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteNewsletter(newsletter.id)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Newsletter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this newsletter? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteNewsletterMutation.isPending}
            >
              {deleteNewsletterMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
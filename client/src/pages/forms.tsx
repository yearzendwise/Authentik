import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Calendar, User, MoreVertical, Eye, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

interface Form {
  id: string;
  title: string;
  description: string;
  formData: string;
  theme: string;
  isActive: boolean;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function Forms2() {
  const { isAuthenticated, isLoading: authLoading } = useReduxAuth();
  const { hasInitialized } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch forms data
  const { data: formsData, isLoading: formsLoading, error: formsError, refetch } = useQuery({
    queryKey: ['/api/forms'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/forms');
      return response.json();
    },
    enabled: isAuthenticated && hasInitialized,
    staleTime: 30000, // Cache for 30 seconds
  });

  const forms: Form[] = formsData?.forms || [];

  // Delete form mutation
  const deleteFormMutation = useMutation({
    mutationFn: async (formId: string) => {
      const response = await apiRequest('DELETE', `/api/forms/${formId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
      toast({
        title: "Success",
        description: "Form deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete form",
        variant: "destructive",
      });
    },
  });

  // Handle form actions
  const handleViewForm = (formId: string) => {
    // TODO: Navigate to form view page
    console.log('View form', formId);
    toast({
      title: "Not implemented",
      description: "Form viewing feature coming soon!",
    });
  };

  const handleEditForm = (formId: string) => {
    // TODO: Navigate to form edit page
    console.log('Edit form', formId);
    toast({
      title: "Not implemented",
      description: "Form editing feature coming soon!",
    });
  };

  const handleDeleteForm = (formId: string) => {
    deleteFormMutation.mutate(formId);
  };

  // Redirect unauthenticated users immediately
  if (hasInitialized && !isAuthenticated) {
    setLocation('/auth');
    return null;
  }

  // Show loading while authentication is being determined
  if (!hasInitialized || authLoading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-500" />
            <span className="ml-4 text-gray-600 dark:text-gray-400">Authenticating...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while forms are being fetched
  if (formsLoading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">Forms</h1>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => refetch()}
                disabled={formsLoading}
                className="flex items-center"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${formsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/forms/add">
                <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Form
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-500" />
            <span className="ml-4 text-gray-600 dark:text-gray-400">Loading forms...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if forms failed to load
  if (formsError) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">Forms</h1>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => refetch()}
                disabled={formsLoading}
                className="flex items-center"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${formsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/forms/add">
                <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Form
                </Button>
              </Link>
            </div>
          </div>
          <Card className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30">
            <CardContent className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">Failed to load forms</p>
              <Button onClick={() => refetch()} variant="outline">Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">Forms</h1>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              disabled={formsLoading}
              className="flex items-center"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${formsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/forms/add">
              <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                <Plus className="mr-2 h-4 w-4" />
                Add Form
              </Button>
            </Link>
          </div>
        </div>

        {forms.length === 0 ? (
          <Card className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30">
            <CardContent className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-300 mb-4">No forms created yet</p>
              <Link href="/forms/add">
                <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">Create your first form</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => {
              // Parse theme data to get theme name
              let themeName = 'Unknown';
              try {
                const themeData = JSON.parse(form.theme);
                themeName = themeData.name || themeData.id || 'Unknown';
              } catch (e) {
                themeName = form.theme || 'Unknown';
              }

              // Parse form data to get element count
              let elementCount = 0;
              try {
                const formData = JSON.parse(form.formData);
                elementCount = formData.elements?.length || 0;
              } catch (e) {
                elementCount = 0;
              }

              return (
                <Card key={form.id} className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30 hover:shadow-lg transition-all duration-300 group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-gray-900 dark:text-gray-100 text-lg font-semibold pr-2">
                        {form.title}
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewForm(form.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditForm(form.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()}
                                className="text-red-600 dark:text-red-400 cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the form "{form.title}" and all its responses.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteForm(form.id)}
                                  className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                                  disabled={deleteFormMutation.isPending}
                                >
                                  {deleteFormMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    'Delete Form'
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {form.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                        {form.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <User className="mr-1 h-3 w-3" />
                          {elementCount} field{elementCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(form.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          form.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {form.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {themeName}
                        </span>
                      </div>
                      
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {form.responseCount} response{form.responseCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
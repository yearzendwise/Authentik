import { Link } from "wouter";
import { Plus, FileText, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authManager } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Form {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  responseCount: number;
}

export default function FormsListPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's forms
  const { data: formsData, isLoading, error } = useQuery({
    queryKey: ['/api/forms'],
    queryFn: async () => {
      const response = await authManager.makeAuthenticatedRequest('GET', '/api/forms');
      if (!response.ok) {
        throw new Error('Failed to fetch forms');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Delete form mutation
  const deleteFormMutation = useMutation({
    mutationFn: async (formId: string) => {
      const response = await authManager.makeAuthenticatedRequest('DELETE', `/api/forms/${formId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete form');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
      toast({
        title: "Success",
        description: "Form deleted successfully",
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

  const forms: Form[] = formsData?.forms || [];

  const handleDeleteForm = (formId: string) => {
    if (confirm('Are you sure you want to delete this form?')) {
      deleteFormMutation.mutate(formId);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forms</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your forms and create new ones
              </p>
            </div>
            <Link href="/forms/add">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Form
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading forms...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forms</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your forms and create new ones
              </p>
            </div>
            <Link href="/forms/add">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Form
              </Button>
            </Link>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Failed to load forms. Please try again.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forms</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your forms and create new ones
            </p>
          </div>
          <Link href="/forms/add">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Form
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {forms.map((form) => (
          <Card key={form.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="flex items-center gap-2">
                  <Link href={`/forms/edit/${form.id}`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteForm(form.id)}
                    disabled={deleteFormMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg">{form.title}</CardTitle>
              <CardDescription>{form.description || 'No description'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Created: {new Date(form.createdAt).toLocaleDateString()}</span>
                <span>{form.responseCount} responses</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty state when no forms */}
        {forms.length === 0 && (
          <div className="col-span-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No forms yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Get started by creating your first form
              </p>
              <Link href="/forms/add">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Form
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from 'lucide-react';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import { useAuth } from '@/hooks/useAuth';

export default function Forms2() {
  const [forms, setForms] = useState<any[]>([]);
  const { isAuthenticated, isLoading: authLoading } = useReduxAuth();
  const { hasInitialized } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect unauthenticated users immediately
  if (hasInitialized && !isAuthenticated) {
    setLocation('/auth');
    return null;
  }

  // Show loading while authentication is being determined
  if (!hasInitialized || authLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-4">Authenticating...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Forms</h1>
        <Link href="/forms/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Form
          </Button>
        </Link>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">No forms created yet</p>
            <Link href="/forms/add">
              <Button>Create your first form</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{form.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{form.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
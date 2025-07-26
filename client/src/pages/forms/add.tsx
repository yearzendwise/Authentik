import { FormBuilder } from '@/components/form-builder/FormBuilder';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function AddFormPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    setLocation('/auth');
    return null;
  }

  const handleSave = (formData: any) => {
    console.log('Form saved:', formData);
    // TODO: Implement actual save functionality with API call
  };

  const handleExport = (formData: any) => {
    console.log('Form exported:', formData);
    // TODO: Implement export functionality
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="border-l border-gray-300 dark:border-gray-600 pl-4">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create New Form
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Build beautiful forms with drag and drop
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="min-h-[800px]">
          <CardContent className="p-0">
            <FormBuilder
              onSave={handleSave}
              onExport={handleExport}
              className="h-full"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
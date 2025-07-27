import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FormWizard } from "@/components/form-builder/form-wizard";

export default function FormsAddPage() {
  console.log('🎉 FormsAddPage loaded via lazy loading!');
  
  return (
    <div className="h-full w-full">
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Form</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Build beautiful forms with our drag-and-drop form builder
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/forms">
                <Button variant="outline">Back to Forms</Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Form Builder Integration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <p className="text-sm text-blue-700">
              🎉 Form Builder is now integrated! You can drag and drop components to build your forms.
            </p>
          </div>
          <FormWizard />
        </div>
      </div>
    </div>
  );
} 
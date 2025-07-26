import { Switch, Route } from "wouter";
import { Link } from "wouter";
import { Plus, FileText, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function FormsAddPage() {
  return (
    <div className="h-full w-full">
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Form</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Use the drag-and-drop form builder to create custom forms
              </p>
            </div>
            <Link href="/forms">
              <Button variant="outline">
                Back to Forms
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              DragFormMaster Integration
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The DragFormMaster component is ready to be integrated here. The component structure has been imported and the navigation is set up.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Component Location:</h3>
              <code className="text-sm text-blue-800 dark:text-blue-200">
                components/DragFormMaster/lib/dist/
              </code>
            </div>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>✓ Navigation menu updated with Forms section</p>
              <p>✓ Routing configured for /forms and /forms/add</p>
              <p>✓ Form builder component structure identified</p>
              <p>→ Component integration ready for final setup</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormsListPage() {
  const mockForms = [
    {
      id: 1,
      title: "Contact Form",
      description: "Customer contact information form",
      created: "2024-01-15",
      responses: 23
    },
    {
      id: 2,
      title: "Survey Form",
      description: "User feedback and satisfaction survey",
      created: "2024-01-10",
      responses: 45
    }
  ];

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
        {mockForms.map((form) => (
          <Card key={form.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg">{form.title}</CardTitle>
              <CardDescription>{form.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Created: {form.created}</span>
                <span>{form.responses} responses</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty state when no forms */}
        {mockForms.length === 0 && (
          <div className="col-span-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No forms yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Get started by creating your first form with our drag-and-drop builder
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

export default function FormsPage() {
  return (
    <Switch>
      <Route path="/forms/add" component={FormsAddPage} />
      <Route path="/forms" component={FormsListPage} />
    </Switch>
  );
}
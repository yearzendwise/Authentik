import { Switch, Route } from "wouter";
import { Link } from "wouter";
import { Plus, FileText, Edit, Trash2, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Temporarily using a simple placeholder until import issues are resolved
// import { FormBuilder } from "../../../components/DragFormMaster/lib/dist";
// import "../../../components/DragFormMaster/lib/dist/index.css";

function FormsAddPage() {
  const handleSave = (formData: any) => {
    console.log("Form saved:", formData);
    // TODO: Implement form saving logic
  };

  const handleExport = (formData: any) => {
    console.log("Form exported:", formData);
    // TODO: Implement form export logic
  };

  return (
    <div className="h-full w-full">
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Form</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Use the DragFormMaster component to create custom forms
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Form
              </Button>
              <Link href="/forms">
                <Button variant="outline">Back to Forms</Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">DragFormMaster Integration</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The DragFormMaster component is being integrated. Import path issues are being resolved.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Component location: /components/DragFormMaster/lib/dist/
            </p>
          </div>
          {/* <FormBuilder 
            onSave={handleSave}
            onExport={handleExport}
            className="h-full w-full"
          /> */}
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
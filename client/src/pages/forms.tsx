import { Switch, Route } from "wouter";
import { Link } from "wouter";
import { Plus, FileText, Edit, Trash2, Save, Eye, BarChart3, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormBuilder } from "../../../components/DragFormMaster/lib/dist";
import "../../../components/DragFormMaster/lib/dist/index.css";

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
              <Link href="/forms">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Forms
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-[calc(100vh-200px)]">
          <FormBuilder 
            onSave={handleSave}
            onExport={handleExport}
            className="h-full w-full"
          />
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
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forms</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your forms and create new ones
              </p>
            </div>
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
          <Card key={form.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-green-600">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg mt-3">{form.title}</CardTitle>
              <CardDescription>{form.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{form.created}</span>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  {form.responses} responses
                </Badge>
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
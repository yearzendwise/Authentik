import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Eye, Plus, Trash2 } from "lucide-react";

interface FormBuilderProps {
  onSave?: (formData: any) => void;
  onExport?: (formData: any) => void;
  className?: string;
}

export function FormBuilder({ onSave, onExport, className }: FormBuilderProps) {
  const [formElements, setFormElements] = React.useState<any[]>([]);

  const handleAddElement = (type: string) => {
    const newElement = {
      id: `element_${Date.now()}`,
      type,
      label: `New ${type}`,
      required: false,
    };
    setFormElements([...formElements, newElement]);
  };

  const handleSave = () => {
    const formData = {
      elements: formElements,
      title: "Custom Form",
      description: "Form created with FormBuilder",
    };
    onSave?.(formData);
  };

  const handlePreview = () => {
    const formData = {
      elements: formElements,
      title: "Custom Form",
      description: "Form created with FormBuilder",
    };
    onExport?.(formData);
  };

  const removeElement = (id: string) => {
    setFormElements(formElements.filter(el => el.id !== id));
  };

  return (
    <div className={`flex h-full ${className}`}>
      {/* Left Panel - Form Elements */}
      <div className="w-1/4 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Form Elements</h3>
        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => handleAddElement('text')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Text Input
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => handleAddElement('textarea')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Textarea
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => handleAddElement('select')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Select
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => handleAddElement('checkbox')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Checkbox
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => handleAddElement('radio')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Radio Group
          </Button>
        </div>
      </div>

      {/* Center Panel - Form Builder */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Form Builder</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Drag and drop elements to build your form
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Form
              </Button>
            </div>
          </div>

          <Card className="min-h-96">
            <CardHeader>
              <CardTitle>Form Preview</CardTitle>
              <CardDescription>
                {formElements.length === 0 
                  ? "Start building your form by adding elements from the left panel" 
                  : `${formElements.length} element(s) added`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formElements.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p>No form elements yet</p>
                  <p className="text-sm mt-2">Add elements from the left panel to get started</p>
                </div>
              ) : (
                formElements.map((element) => (
                  <div key={element.id} className="group relative p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {element.label}
                        {element.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeElement(element.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    
                    {element.type === 'text' && (
                      <input 
                        type="text" 
                        placeholder="Enter text..."
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        disabled
                      />
                    )}
                    
                    {element.type === 'textarea' && (
                      <textarea 
                        placeholder="Enter text..."
                        rows={3}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        disabled
                      />
                    )}
                    
                    {element.type === 'select' && (
                      <select 
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        disabled
                      >
                        <option>Select an option...</option>
                        <option>Option 1</option>
                        <option>Option 2</option>
                      </select>
                    )}
                    
                    {element.type === 'checkbox' && (
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" disabled />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Checkbox option</span>
                      </div>
                    )}
                    
                    {element.type === 'radio' && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input type="radio" name={`radio_${element.id}`} disabled />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Option 1</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" name={`radio_${element.id}`} disabled />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Option 2</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
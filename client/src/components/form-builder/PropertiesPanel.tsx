import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { FormElement, FormData } from '@/components/form-builder/FormBuilder';

interface PropertiesPanelProps {
  element: FormElement | undefined;
  onUpdateElement: (id: string, updates: Partial<FormElement>) => void;
  formData: FormData;
  onUpdateForm: (formData: FormData) => void;
}

export function PropertiesPanel({ 
  element, 
  onUpdateElement, 
  formData, 
  onUpdateForm 
}: PropertiesPanelProps) {
  if (!element) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Form Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="form-title" className="text-sm font-medium">
              Form Title
            </Label>
            <Input
              id="form-title"
              value={formData.title}
              onChange={(e) => onUpdateForm({ ...formData, title: e.target.value })}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="form-description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="form-description"
              value={formData.description}
              onChange={(e) => onUpdateForm({ ...formData, description: e.target.value })}
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            Select an element to edit its properties
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleAddOption = () => {
    const currentOptions = element.options || [];
    const newOption = `Option ${currentOptions.length + 1}`;
    onUpdateElement(element.id, {
      options: [...currentOptions, newOption]
    });
  };

  const handleUpdateOption = (index: number, value: string) => {
    const currentOptions = element.options || [];
    const newOptions = [...currentOptions];
    newOptions[index] = value;
    onUpdateElement(element.id, { options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    const currentOptions = element.options || [];
    const newOptions = currentOptions.filter((_, i) => i !== index);
    onUpdateElement(element.id, { options: newOptions });
  };

  const needsOptions = element.type === 'select' || element.type === 'radio';

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Element Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="element-label" className="text-sm font-medium">
            Label
          </Label>
          <Input
            id="element-label"
            value={element.label}
            onChange={(e) => onUpdateElement(element.id, { label: e.target.value })}
            className="mt-1"
          />
        </div>

        {element.type !== 'checkbox' && element.type !== 'radio' && (
          <div>
            <Label htmlFor="element-placeholder" className="text-sm font-medium">
              Placeholder
            </Label>
            <Input
              id="element-placeholder"
              value={element.placeholder || ''}
              onChange={(e) => onUpdateElement(element.id, { placeholder: e.target.value })}
              className="mt-1"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="element-required" className="text-sm font-medium">
            Required
          </Label>
          <Switch
            id="element-required"
            checked={element.required || false}
            onCheckedChange={(checked) => onUpdateElement(element.id, { required: checked })}
          />
        </div>

        {needsOptions && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Options</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddOption}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {(element.options || []).map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => handleUpdateOption(index, e.target.value)}
                    className="flex-1"
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {(!element.options || element.options.length === 0) && (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  No options added yet
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p><strong>Type:</strong> {element.type}</p>
            <p><strong>ID:</strong> {element.id}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
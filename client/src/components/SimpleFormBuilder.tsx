import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, Type, Mail, Phone, Calendar, MessageSquare, CheckSquare, ToggleLeft } from 'lucide-react';

interface FormElement {
  id: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormBuilderProps {
  onSave?: (formData: any) => void;
  onExport?: (formData: any) => void;
  className?: string;
}

const elementTypes = [
  { type: 'text', label: 'Text Input', icon: Type },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'textarea', label: 'Text Area', icon: MessageSquare },
  { type: 'select', label: 'Dropdown', icon: ToggleLeft },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
] as const;

export function FormBuilder({ onSave, onExport, className }: FormBuilderProps) {
  const [formTitle, setFormTitle] = useState('Untitled Form');
  const [elements, setElements] = useState<FormElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const addElement = (type: FormElement['type']) => {
    const newElement: FormElement = {
      id: Date.now().toString(),
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      placeholder: `Enter ${type}...`,
      required: false,
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<FormElement>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const removeElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const handleSave = () => {
    const formData = {
      title: formTitle,
      elements: elements,
      createdAt: new Date().toISOString(),
    };
    onSave?.(formData);
  };

  const handleExport = () => {
    const formData = {
      title: formTitle,
      elements: elements,
      createdAt: new Date().toISOString(),
    };
    onExport?.(formData);
  };

  const selectedElementData = elements.find(el => el.id === selectedElement);

  return (
    <div className={`flex h-full ${className || ''}`}>
      {/* Left Panel - Element Palette */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Form Elements</h3>
          <div className="space-y-2">
            {elementTypes.map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addElement(type)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="space-y-2">
          <Button onClick={handleSave} className="w-full">
            Save Form
          </Button>
          <Button onClick={handleExport} variant="outline" className="w-full">
            Export Form
          </Button>
        </div>
      </div>

      {/* Center Panel - Form Canvas */}
      <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="text-2xl font-bold border-none p-0 focus-visible:ring-0"
                placeholder="Form Title"
              />
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {elements.map((element) => (
              <Card
                key={element.id}
                className={`cursor-pointer transition-colors ${
                  selectedElement === element.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedElement(element.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <GripVertical className="w-4 h-4 mr-2 text-gray-400" />
                      <Label className="text-sm">{element.label}</Label>
                      {element.required && <span className="text-red-500 ml-1">*</span>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeElement(element.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Preview of the form element */}
                  {element.type === 'textarea' ? (
                    <Textarea placeholder={element.placeholder} disabled />
                  ) : element.type === 'select' ? (
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder={element.placeholder} />
                      </SelectTrigger>
                    </Select>
                  ) : element.type === 'checkbox' ? (
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" disabled />
                      <Label>{element.label}</Label>
                    </div>
                  ) : (
                    <Input
                      type={element.type}
                      placeholder={element.placeholder}
                      disabled
                    />
                  )}
                </CardContent>
              </Card>
            ))}

            {elements.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Your form is empty</p>
                <p>Add elements from the left panel to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Properties */}
      {selectedElementData && (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Properties</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="element-label">Label</Label>
              <Input
                id="element-label"
                value={selectedElementData.label}
                onChange={(e) => updateElement(selectedElementData.id, { label: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="element-placeholder">Placeholder</Label>
              <Input
                id="element-placeholder"
                value={selectedElementData.placeholder || ''}
                onChange={(e) => updateElement(selectedElementData.id, { placeholder: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="element-required"
                checked={selectedElementData.required}
                onChange={(e) => updateElement(selectedElementData.id, { required: e.target.checked })}
              />
              <Label htmlFor="element-required">Required field</Label>
            </div>

            {(selectedElementData.type === 'select' || selectedElementData.type === 'radio') && (
              <div>
                <Label>Options</Label>
                <div className="space-y-2">
                  {selectedElementData.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(selectedElementData.options || [])];
                          newOptions[index] = e.target.value;
                          updateElement(selectedElementData.id, { options: newOptions });
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newOptions = selectedElementData.options?.filter((_, i) => i !== index);
                          updateElement(selectedElementData.id, { options: newOptions });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOptions = [...(selectedElementData.options || []), `Option ${(selectedElementData.options?.length || 0) + 1}`];
                      updateElement(selectedElementData.id, { options: newOptions });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FormBuilder;
import { Switch, Route } from "wouter";
import { Link } from "wouter";
import { Plus, FileText, Edit, Trash2, Save, Eye, Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Form element types
interface FormElement {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

// Draggable form element component
function DraggableFormElement({ element, isSelected, onSelect, onDelete }: {
  element: FormElement;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const renderFormElement = () => {
    switch (element.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            type={element.type}
            placeholder={element.placeholder || `Enter ${element.label.toLowerCase()}`}
            disabled
          />
        );
      case 'textarea':
        return (
          <Textarea
            placeholder={element.placeholder || `Enter ${element.label.toLowerCase()}`}
            disabled
          />
        );
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
          </Select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input type="checkbox" disabled />
            <span>{element.label}</span>
          </div>
        );
      case 'date':
        return <Input type="date" disabled />;
      case 'file':
        return <Input type="file" disabled />;
      default:
        return <Input placeholder="Unknown field type" disabled />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 border rounded-md cursor-move ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
      } transition-colors`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-medium">
          {element.label}
          {element.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="h-6 w-6 p-0"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      {renderFormElement()}
    </div>
  );
}

function FormsAddPage() {
  const [formTitle, setFormTitle] = useState("Untitled Form");
  const [formElements, setFormElements] = useState<FormElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    })
  );

  const addElement = (type: string) => {
    const newElement: FormElement = {
      id: `element-${Date.now()}`,
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      required: false,
    };
    setFormElements([...formElements, newElement]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setFormElements((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const elementType = e.dataTransfer.getData('text/plain');
    addElement(elementType);
  };

  const deleteElement = (id: string) => {
    setFormElements(formElements.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const updateElement = (id: string, updates: Partial<FormElement>) => {
    setFormElements(formElements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const selectedElement = formElements.find(el => el.id === selectedElementId);

  return (
    <div className="h-full w-full">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Form</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Drag and drop form elements to build your custom form
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setPreview(!preview)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {preview ? 'Edit' : 'Preview'}
              </Button>
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
        
        {/* Form Builder Interface */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-[calc(100vh-200px)] flex">
          {/* Component Palette */}
          {!preview && (
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Form Elements</h3>
              <div className="space-y-2">
                {[
                  { type: 'text', label: 'Text Input', icon: '📝' },
                  { type: 'email', label: 'Email', icon: '📧' },
                  { type: 'number', label: 'Number', icon: '🔢' },
                  { type: 'textarea', label: 'Text Area', icon: '📄' },
                  { type: 'select', label: 'Dropdown', icon: '📋' },
                  { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
                  { type: 'date', label: 'Date Picker', icon: '📅' },
                  { type: 'file', label: 'File Upload', icon: '📎' },
                ].map((element) => (
                  <div
                    key={element.type}
                    className="p-3 border border-gray-200 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', element.type);
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{element.icon}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {element.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Canvas Area */}
          <div className="flex-1 p-6">
            <div className="h-full">
              {/* Form Title */}
              <div className="mb-6">
                {preview ? (
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{formTitle}</h2>
                ) : (
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="text-2xl font-bold border-none p-0 focus:ring-0"
                    placeholder="Form Title"
                  />
                )}
              </div>

              {/* Form Elements */}
              <div
                className="min-h-96 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                {formElements.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Start Building Your Form
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Drag form elements from the left panel to add them to your form
                    </p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={formElements} strategy={verticalListSortingStrategy}>
                      <div className="space-y-4">
                        {formElements.map((element) => (
                          <DraggableFormElement
                            key={element.id}
                            element={element}
                            isSelected={selectedElementId === element.id}
                            onSelect={() => setSelectedElementId(element.id)}
                            onDelete={() => deleteElement(element.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          {!preview && (
            <div className="w-64 border-l border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Properties</h3>
              {selectedElement ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="element-label">Label</Label>
                    <Input
                      id="element-label"
                      value={selectedElement.label}
                      onChange={(e) => updateElement(selectedElement.id, { label: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="element-placeholder">Placeholder</Label>
                    <Input
                      id="element-placeholder"
                      value={selectedElement.placeholder || ''}
                      onChange={(e) => updateElement(selectedElement.id, { placeholder: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="element-required"
                      checked={selectedElement.required || false}
                      onChange={(e) => updateElement(selectedElement.id, { required: e.target.checked })}
                    />
                    <Label htmlFor="element-required">Required field</Label>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  Select a form element to edit its properties
                </div>
              )}
            </div>
          )}
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
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Trash2, GripVertical } from 'lucide-react';
import { FormElement } from '@/components/form-builder/FormBuilder';

interface FormCanvasProps {
  elements: FormElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
}

interface SortableElementProps {
  element: FormElement;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SortableElement({ element, isSelected, onSelect, onDelete }: SortableElementProps) {
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
  };

  const renderFormElement = () => {
    switch (element.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            placeholder={element.placeholder}
            type={element.type}
            disabled
            className="pointer-events-none"
          />
        );
      case 'textarea':
        return (
          <Textarea
            placeholder={element.placeholder}
            disabled
            className="pointer-events-none resize-none"
          />
        );
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger className="pointer-events-none">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {element.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox disabled className="pointer-events-none" />
            <Label className="text-sm">Checkbox option</Label>
          </div>
        );
      case 'radio':
        return (
          <RadioGroup disabled className="pointer-events-none">
            {element.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${element.id}-${index}`} />
                <Label htmlFor={`${element.id}-${index}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'date':
        return (
          <Input
            type="date"
            disabled
            className="pointer-events-none"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group ${isDragging ? 'opacity-50' : ''}`}
    >
      <Card
        className={`cursor-pointer transition-all ${
          isSelected
            ? 'ring-2 ring-blue-500 border-blue-500'
            : 'hover:border-gray-300 dark:hover:border-gray-600'
        }`}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {element.label}
                  {element.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              {renderFormElement()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function FormCanvas({ elements, selectedElementId, onSelectElement, onDeleteElement }: FormCanvasProps) {
  if (elements.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No form elements yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add components from the palette to start building your form
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 min-h-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Form Preview</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Click on elements to edit their properties
        </p>
      </div>
      
      {elements.map((element) => (
        <SortableElement
          key={element.id}
          element={element}
          isSelected={selectedElementId === element.id}
          onSelect={() => onSelectElement(element.id)}
          onDelete={() => onDeleteElement(element.id)}
        />
      ))}
    </div>
  );
}

function FileText({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
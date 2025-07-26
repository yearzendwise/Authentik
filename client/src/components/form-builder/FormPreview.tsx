import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FormData } from '@/components/form-builder/FormBuilder';

interface FormPreviewProps {
  formData: FormData;
}

export function FormPreview({ formData }: FormPreviewProps) {
  const renderFormElement = (element: any) => {
    const commonProps = {
      key: element.id,
      required: element.required,
    };

    switch (element.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={element.id} className="text-sm font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={element.id}
              type={element.type}
              placeholder={element.placeholder}
              {...commonProps}
            />
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label htmlFor={element.id} className="text-sm font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={element.id}
              placeholder={element.placeholder}
              rows={4}
              {...commonProps}
            />
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={element.id} className="text-sm font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select {...commonProps}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {element.options?.map((option: string, index: number) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox id={element.id} {...commonProps} />
            <Label htmlFor={element.id} className="text-sm">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup {...commonProps}>
              {element.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${element.id}-${index}`} />
                  <Label htmlFor={`${element.id}-${index}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'date':
        return (
          <div className="space-y-2">
            <Label htmlFor={element.id} className="text-sm font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={element.id}
              type="date"
              {...commonProps}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{formData.title}</CardTitle>
          {formData.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formData.description}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {formData.elements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No form elements to preview. Add some components to see them here.
              </p>
            </div>
          ) : (
            <form className="space-y-6">
              {formData.elements.map(renderFormElement)}
              
              <div className="pt-4">
                <Button type="submit" className="w-full">
                  Submit Form
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Type, 
  Mail, 
  FileText, 
  ChevronDown, 
  CheckSquare, 
  Circle, 
  Hash, 
  Calendar 
} from 'lucide-react';
import { FormElement } from '@/components/form-builder/FormBuilder';

interface ComponentPaletteProps {
  onAddElement: (type: FormElement['type']) => void;
}

const components = [
  { type: 'text' as const, label: 'Text Input', icon: Type },
  { type: 'email' as const, label: 'Email', icon: Mail },
  { type: 'textarea' as const, label: 'Textarea', icon: FileText },
  { type: 'select' as const, label: 'Select', icon: ChevronDown },
  { type: 'checkbox' as const, label: 'Checkbox', icon: CheckSquare },
  { type: 'radio' as const, label: 'Radio', icon: Circle },
  { type: 'number' as const, label: 'Number', icon: Hash },
  { type: 'date' as const, label: 'Date', icon: Calendar },
];

export function ComponentPalette({ onAddElement }: ComponentPaletteProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Components</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {components.map((component) => {
          const Icon = component.icon;
          return (
            <Button
              key={component.type}
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => onAddElement(component.type)}
            >
              <Icon className="h-4 w-4 mr-2" />
              {component.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
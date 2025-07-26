import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { ComponentPalette } from '@/components/form-builder/ComponentPalette';
import { FormCanvas } from '@/components/form-builder/FormCanvas';
import { PropertiesPanel } from '@/components/form-builder/PropertiesPanel';
import { FormPreview } from '@/components/form-builder/FormPreview';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Eye, Download } from 'lucide-react';

export interface FormElement {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number' | 'date';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface FormData {
  id: string;
  title: string;
  description: string;
  elements: FormElement[];
}

interface FormBuilderProps {
  onSave?: (formData: FormData) => void;
  onExport?: (formData: FormData) => void;
  className?: string;
}

export function FormBuilder({ onSave, onExport, className }: FormBuilderProps) {
  const [activeTab, setActiveTab] = useState<'build' | 'preview'>('build');
  const [formData, setFormData] = useState<FormData>({
    id: '',
    title: 'New Form',
    description: 'Form description',
    elements: []
  });
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    if (active.id !== over.id) {
      setFormData(prev => {
        const oldIndex = prev.elements.findIndex(item => item.id === active.id);
        const newIndex = prev.elements.findIndex(item => item.id === over.id);
        
        return {
          ...prev,
          elements: arrayMove(prev.elements, oldIndex, newIndex)
        };
      });
    }
  };

  const addElement = (type: FormElement['type']) => {
    const newElement: FormElement = {
      id: `element-${Date.now()}`,
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      placeholder: `Enter ${type}...`,
      required: false
    };

    setFormData(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
  };

  const updateElement = (id: string, updates: Partial<FormElement>) => {
    setFormData(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      )
    }));
  };

  const deleteElement = (id: string) => {
    setFormData(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id)
    }));
    setSelectedElementId(null);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(formData);
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport(formData);
    }
  };

  const selectedElement = formData.elements.find(el => el.id === selectedElementId);

  return (
    <div className={`h-full flex flex-col ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Form Builder</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Drag and drop components to build your form
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Form
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="build" className="flex items-center space-x-2">
                <span>Build</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="build" className="flex-1 flex overflow-hidden mt-4">
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              {/* Component Palette */}
              <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
                <ComponentPalette onAddElement={addElement} />
              </div>

              {/* Form Canvas */}
              <div className="flex-1 p-4">
                <SortableContext items={formData.elements.map(el => el.id)} strategy={verticalListSortingStrategy}>
                  <FormCanvas
                    elements={formData.elements}
                    selectedElementId={selectedElementId}
                    onSelectElement={setSelectedElementId}
                    onDeleteElement={deleteElement}
                  />
                </SortableContext>
              </div>

              {/* Properties Panel */}
              <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-4">
                <PropertiesPanel
                  element={selectedElement}
                  onUpdateElement={updateElement}
                  formData={formData}
                  onUpdateForm={setFormData}
                />
              </div>

              <DragOverlay>
                {activeId ? (
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 p-4">
            <FormPreview formData={formData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default FormBuilder;
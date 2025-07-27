import { useState } from 'react';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible';

interface FormPropertiesProps {
  formTitle: string;
  onUpdateFormTitle: (title: string) => void;
  onUpdateSettings?: (settings: any) => void;
  settings?: {
    description?: string;
    showProgressBar?: boolean;
    allowSaveProgress?: boolean;
    showFormTitle?: boolean;
    compactMode?: boolean;
  };
  elements?: any[];
}

export function FormProperties({ 
  formTitle, 
  onUpdateFormTitle, 
  onUpdateSettings,
  settings = {},
  elements = []
}: FormPropertiesProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const {
    description = '',
    showProgressBar = false,
    allowSaveProgress = false,
    showFormTitle = true,
    compactMode = false,
  } = settings;

  const handleSettingChange = (key: string, value: any) => {
    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        [key]: value,
      });
    }
  };

  return (
    <Card className="w-80 border-l border-neutral-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-neutral-50 transition-colors">
            <CardTitle className="text-base flex items-center justify-between">
              Form Properties
              <svg 
                className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Form Title */}
            <div>
              <Label htmlFor="form-title" className="text-sm font-medium text-neutral-700 mb-2">
                Form Title
              </Label>
              <Input
                id="form-title"
                value={formTitle}
                onChange={(e) => onUpdateFormTitle(e.target.value)}
                placeholder="Enter form title..."
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Form Description */}
            <div>
              <Label htmlFor="form-description" className="text-sm font-medium text-neutral-700 mb-2">
                Form Description
              </Label>
              <Textarea
                id="form-description"
                value={description}
                onChange={(e) => handleSettingChange('description', e.target.value)}
                placeholder="Add a description to help users understand the form..."
                className="focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                rows={3}
              />
            </div>



            {/* Form Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-neutral-700">Form Options</h4>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="compact-mode"
                  checked={compactMode}
                  onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
                  className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="compact-mode" className="text-xs text-neutral-600">
                  Compact Mode (2 fields per row)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show-title"
                  checked={showFormTitle}
                  onChange={(e) => handleSettingChange('showFormTitle', e.target.checked)}
                  className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="show-title" className="text-xs text-neutral-600">
                  Show form title
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show-progress"
                  checked={showProgressBar}
                  onChange={(e) => handleSettingChange('showProgressBar', e.target.checked)}
                  className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="show-progress" className="text-xs text-neutral-600">
                  Show progress bar
                </Label>
              </div>

              
            </div>

            {/* Form Info */}
            <div className="pt-2 border-t border-neutral-200">
              <div className="text-xs text-neutral-500 space-y-1">
                <div className="flex justify-between">
                  <span>Fields:</span>
                  <span className="font-medium">{elements.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Required:</span>
                  <span className="font-medium">{elements.filter(el => el.required).length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
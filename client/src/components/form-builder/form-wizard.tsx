import { useFormWizard } from '../../hooks/use-form-wizard';
import { BuildStep } from './wizard-steps/build-step';
import { StyleStep } from './wizard-steps/style-step';
import { PreviewStep } from './wizard-steps/preview-step';
import { Button } from '../../components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authManager } from '../../lib/auth';
import { useToast } from '../../hooks/use-toast';
import { useLocation } from 'wouter';

export function FormWizard() {
  const {
    wizardState,
    themes,
    nextStep,
    previousStep,
    updateFormData,
    selectTheme,
    customizeThemeColors,
    resetThemeColors,
    completeWizard,
    resetWizard
  } = useFormWizard();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const canProceedToStyle = wizardState.formData.elements.length > 0;
  const canProceedToPreview = wizardState.selectedTheme !== null;

  // Save form mutation
  const saveFormMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await authManager.makeAuthenticatedRequest('POST', '/api/forms', {
        title: formData.title,
        description: formData.settings?.description || '',
        elements: formData.elements,
        theme: formData.theme,
        settings: formData.settings
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save form');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
      toast({
        title: "Success",
        description: "Form saved successfully!",
      });
      completeWizard();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save form",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const formData = {
      title: wizardState.formData.title,
      elements: wizardState.formData.elements,
      theme: wizardState.selectedTheme,
      settings: wizardState.formData.settings
    };
    
    saveFormMutation.mutate(formData);
  };

  const handleExport = () => {
    // Export form data as JSON
    const formData = {
      title: wizardState.formData.title,
      elements: wizardState.formData.elements,
      theme: wizardState.selectedTheme,
      settings: wizardState.formData.settings
    };
    
    const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wizardState.formData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: "Form exported successfully!",
    });
  };

  const getStepTitle = () => {
    switch (wizardState.currentStep) {
      case 'build':
        return 'Build Your Form';
      case 'style':
        return 'Choose Style';
      case 'preview':
        return 'Preview & Save';
      default:
        return 'Form Builder';
    }
  };

  const getStepNumber = () => {
    switch (wizardState.currentStep) {
      case 'build':
        return 1;
      case 'style':
        return 2;
      case 'preview':
        return 3;
      default:
        return 1;
    }
  };

  if (wizardState.isComplete) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Form Saved Successfully!</h2>
          <p className="text-slate-600 mb-6">Your form has been created and saved.</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setLocation('/forms')}>View All Forms</Button>
            <Button variant="outline" onClick={resetWizard}>Create Another Form</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {/* Header with Progress */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-slate-200/60 h-16 flex items-center justify-between px-6 shadow-sm pt-[40px] pb-[40px]">
        <div className="flex items-center space-x-6">
          {/* Progress Steps */}
          <div className="hidden lg:flex items-center space-x-4">
            {[
              { step: 1, title: 'Build', key: 'build' },
              { step: 2, title: 'Style', key: 'style' },
              { step: 3, title: 'Preview', key: 'preview' }
            ].map((item, index) => (
              <div key={item.key} className="flex items-center">
                {index > 0 && (
                  <div className="w-8 h-0.5 bg-slate-200 mr-4">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        getStepNumber() > item.step ? 'bg-blue-500 w-full' : 'bg-transparent w-0'
                      }`}
                    />
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    wizardState.currentStep === item.key
                      ? 'bg-blue-500 text-white'
                      : getStepNumber() > item.step
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {getStepNumber() > item.step ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      item.step
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    wizardState.currentStep === item.key
                      ? 'text-slate-800'
                      : getStepNumber() > item.step
                      ? 'text-green-600'
                      : 'text-slate-500'
                  }`}>
                    {item.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Title */}
        <div className="text-center lg:text-left">
          <h1 className="text-lg font-semibold text-slate-800">{getStepTitle()}</h1>
          <p className="text-sm text-slate-500 hidden lg:block">
            Step {getStepNumber()} of 3
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {wizardState.currentStep === 'preview' && (
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={saveFormMutation.isPending}
            >
              Export
            </Button>
          )}
          
          {wizardState.currentStep === 'preview' && (
            <Button
              onClick={handleSave}
              disabled={saveFormMutation.isPending}
            >
              {saveFormMutation.isPending ? 'Saving...' : 'Save Form'}
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {wizardState.currentStep === 'build' && (
          <BuildStep
            onDataChange={updateFormData}
            initialTitle={wizardState.formData.title}
            initialElements={wizardState.formData.elements}
            initialSettings={wizardState.formData.settings}
          />
        )}

                  {wizardState.currentStep === 'style' && (
            <StyleStep
              themes={themes}
              selectedTheme={wizardState.selectedTheme}
              onSelectTheme={selectTheme}
            />
          )}

        {wizardState.currentStep === 'preview' && (
          <PreviewStep
            formTitle={wizardState.formData.title}
            elements={wizardState.formData.elements}
            selectedTheme={wizardState.selectedTheme}
            formSettings={wizardState.formData.settings}
            onSave={handleSave}
            onExport={handleExport}
            onCustomizeColors={customizeThemeColors}
            onResetColors={resetThemeColors}
          />
        )}
      </div>

      {/* Footer Navigation */}
      <footer className="bg-white/95 backdrop-blur-lg border-t border-slate-200/60 px-6 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={previousStep}
            disabled={wizardState.currentStep === 'build'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center space-x-3">
            {wizardState.currentStep === 'build' && (
              <Button
                onClick={nextStep}
                disabled={!canProceedToStyle}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {wizardState.currentStep === 'style' && (
              <Button
                onClick={nextStep}
                disabled={!canProceedToPreview}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

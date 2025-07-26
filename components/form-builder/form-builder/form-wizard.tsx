import { useFormWizard } from '@/hooks/use-form-wizard';
import { BuildStep } from './wizard-steps/build-step';
import { StyleStep } from './wizard-steps/style-step';
import { PreviewStep } from './wizard-steps/preview-step';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

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

  const canProceedToStyle = wizardState.formData.elements.length > 0;
  const canProceedToPreview = wizardState.selectedTheme !== null;

  const handleSave = () => {
    // TODO: Implement actual save functionality
    console.log('Saving form:', {
      title: wizardState.formData.title,
      elements: wizardState.formData.elements,
      theme: wizardState.selectedTheme
    });
    completeWizard();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting form:', wizardState);
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
          <Button onClick={resetWizard}>Create Another Form</Button>
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
                      : 'text-slate-500'
                  }`}>
                    {item.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-sm text-slate-600">
          Step {getStepNumber()} of 3
        </div>
      </header>
      {/* Step Content */}
      <div className="flex-1 flex flex-col">
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
      {/* Navigation Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            {wizardState.currentStep !== 'build' && (
              <Button variant="outline" onClick={previousStep} className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {wizardState.currentStep === 'build' && (
              <div className="text-sm text-slate-600">
                {canProceedToStyle ? 
                  `${wizardState.formData.elements.length} element${wizardState.formData.elements.length !== 1 ? 's' : ''} added` :
                  'Add at least one form element to continue'
                }
              </div>
            )}
            
            {wizardState.currentStep === 'style' && (
              <div className="text-sm text-slate-600">
                {canProceedToPreview ? 
                  `${wizardState.selectedTheme?.name} theme selected` :
                  'Select a theme to continue'
                }
              </div>
            )}

            {wizardState.currentStep !== 'preview' && (
              <Button 
                onClick={nextStep}
                disabled={
                  (wizardState.currentStep === 'build' && !canProceedToStyle) ||
                  (wizardState.currentStep === 'style' && !canProceedToPreview)
                }
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
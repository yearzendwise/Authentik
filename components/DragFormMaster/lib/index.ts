// Main form builder components
export { default as FormBuilder } from './components/FormBuilder';
export { default as FormWizard } from '../client/src/components/form-builder/form-wizard';

// Individual wizard steps
export { default as BuildStep } from '../client/src/components/form-builder/wizard-steps/build-step';
export { default as StyleStep } from '../client/src/components/form-builder/wizard-steps/style-step';
export { default as PreviewStep } from '../client/src/components/form-builder/wizard-steps/preview-step';

// Form renderers
export { default as ThemedFormRenderer } from '../client/src/components/form-builder/themed-form-renderer';
export { default as CustomThemedForm } from '../client/src/components/form-builder/custom-themed-form';

// Hooks
export { default as useFormWizard } from '../client/src/hooks/use-form-wizard';
export { default as useFormBuilder } from '../client/src/hooks/use-form-builder';

// Types
export type {
  FormElement,
  FormTheme,
  FormSettings,
  CustomColors,
  WizardStep,
  FormElementType,
  ComponentPaletteItem,
  DragItem,
  FormBuilderState,
  ValidationRules,
  ElementStyling
} from '../client/src/types/form-builder';

// Utilities
export { getThemeStyles } from './utils/theme-styles';
export { getThemeGradientPresets } from '../client/src/utils/theme-gradient-presets';
export { extractThemeColors } from '../client/src/utils/theme-color-utils';

// Theme definitions
export { themes } from './data/themes';

// Component palette
export { default as ComponentPalette } from '../client/src/components/form-builder/component-palette';
export { default as PropertiesPanel } from '../client/src/components/form-builder/properties-panel';
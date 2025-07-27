import { FormTheme, FormElement } from '@/types/form-builder';
import { ThemedFormRenderer } from '@/components/form-builder/themed-form-renderer';
import { CSSProperties, useEffect } from 'react';

interface CustomThemedFormProps {
  theme: FormTheme;
  element: FormElement;
  onChange?: (fieldName: string, value: any) => void;
  onReset?: () => void;
}

export function CustomThemedForm({ theme, element, onChange, onReset }: CustomThemedFormProps) {
  // Check if theme has custom colors
  const customColors = theme.customColors;
  
  useEffect(() => {
    if (customColors) {
      // Inject custom CSS for color overrides
      const styleId = 'custom-theme-colors';
      let existingStyle = document.getElementById(styleId);
      
      if (!existingStyle) {
        existingStyle = document.createElement('style');
        existingStyle.id = styleId;
        document.head.appendChild(existingStyle);
      }
      
      existingStyle.textContent = `
        .custom-theme-wrapper button[type="submit"],
        .custom-theme-wrapper button[type="reset"] {
          ${customColors.primaryGradient 
            ? `background: ${customColors.primaryGradient} !important;` 
            : `background-color: ${customColors.primary} !important;`}
          border-color: ${customColors.primary} !important;
          color: white !important;
        }
        .custom-theme-wrapper button[type="submit"]:hover,
        .custom-theme-wrapper button[type="reset"]:hover {
          opacity: 0.9 !important;
          transform: translateY(-1px);
        }
        .custom-theme-wrapper input:focus,
        .custom-theme-wrapper select:focus,
        .custom-theme-wrapper textarea:focus,
        .custom-theme-wrapper .headlessui-listbox-button:focus {
          border-color: ${customColors.primary} !important;
          box-shadow: 0 0 0 2px ${customColors.primary}30 !important;
        }
        .custom-theme-wrapper label,
        .custom-theme-wrapper h1,
        .custom-theme-wrapper h2,
        .custom-theme-wrapper h3 {
          ${customColors.secondaryGradient 
            ? `background: ${customColors.secondaryGradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;` 
            : `color: ${customColors.secondary} !important;`}
        }
        .custom-theme-wrapper .bg-gradient-primary {
          ${customColors.primaryGradient 
            ? `background: ${customColors.primaryGradient} !important;` 
            : `background-color: ${customColors.primary} !important;`}
        }
        .custom-theme-wrapper input[type="checkbox"]:checked,
        .custom-theme-wrapper input[type="radio"]:checked {
          ${customColors.primaryGradient 
            ? `background: ${customColors.primaryGradient} !important;` 
            : `background-color: ${customColors.primary} !important;`}
          border-color: ${customColors.primary} !important;
        }
        .custom-theme-wrapper .custom-progress-fill {
          ${customColors.primaryGradient 
            ? `background: ${customColors.primaryGradient} !important;` 
            : `background-color: ${customColors.primary} !important;`}
        }
      `;
    }
  }, [customColors]);
  
  if (!customColors) {
    // No custom colors, use regular ThemedFormRenderer
    return (
      <ThemedFormRenderer
        element={element}
        themeStyles={theme.styles}
        onChange={onChange}
        onReset={onReset}
      />
    );
  }

  return (
    <div className="custom-theme-wrapper">
      <ThemedFormRenderer
        element={element}
        themeStyles={theme.styles}
        onChange={onChange}
        onReset={onReset}
      />
    </div>
  );
}
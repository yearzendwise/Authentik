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
      
      // Define font families
      const fontFamilies = {
        sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        serif: 'Georgia, "Times New Roman", Times, serif',
        mono: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace'
      };
      
      existingStyle.textContent = `
        .custom-theme-wrapper {
          font-family: ${fontFamilies[customColors.font]} !important;
        }
        .custom-theme-wrapper * {
          font-family: inherit !important;
        }
        .custom-theme-wrapper button[type="submit"],
        .custom-theme-wrapper button[type="reset"] {
          ${customColors.buttonGradient 
            ? `background: ${customColors.buttonGradient} !important;` 
            : `background-color: ${customColors.button} !important;`}
          border-color: ${customColors.button} !important;
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
          border-color: ${customColors.button} !important;
          box-shadow: 0 0 0 2px ${customColors.button}30 !important;
        }
        .custom-theme-wrapper label,
        .custom-theme-wrapper p,
        .custom-theme-wrapper span:not(.form-title) {
          ${customColors.textGradient 
            ? `background: ${customColors.textGradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;` 
            : `color: ${customColors.text} !important;`}
        }
        .custom-theme-wrapper .form-title,
        .custom-theme-wrapper h1:first-child {
          ${customColors.headerGradient 
            ? `background: ${customColors.headerGradient} !important; 
               -webkit-background-clip: text !important; 
               -webkit-text-fill-color: transparent !important; 
               background-clip: text !important;
               color: transparent !important;` 
            : `color: ${customColors.header} !important;
               background: none !important;
               -webkit-text-fill-color: ${customColors.header} !important;`}
        }
        .custom-theme-wrapper input,
        .custom-theme-wrapper select,
        .custom-theme-wrapper textarea {
          ${customColors.textGradient 
            ? `color: ${customColors.text} !important;` 
            : `color: ${customColors.text} !important;`}
        }
        .custom-theme-wrapper .bg-gradient-primary {
          ${customColors.buttonGradient 
            ? `background: ${customColors.buttonGradient} !important;` 
            : `background-color: ${customColors.button} !important;`}
        }
        .custom-theme-wrapper input[type="checkbox"]:checked,
        .custom-theme-wrapper input[type="radio"]:checked {
          ${customColors.buttonGradient 
            ? `background: ${customColors.buttonGradient} !important;` 
            : `background-color: ${customColors.button} !important;`}
          border-color: ${customColors.button} !important;
        }
        .custom-theme-wrapper .custom-progress-fill {
          ${customColors.buttonGradient 
            ? `background: ${customColors.buttonGradient} !important;` 
            : `background-color: ${customColors.button} !important;`}
        }
        /* Form container background is now handled by parent component */
        /* Rate scale emoji colors */
        .custom-theme-wrapper .rate-scale-emoji {
          filter: none !important;
        }
        /* Boolean switch active state */
        .custom-theme-wrapper [data-state="checked"] {
          ${customColors.buttonGradient 
            ? `background: ${customColors.buttonGradient} !important;` 
            : `background-color: ${customColors.button} !important;`}
        }
        /* Ensure placeholder text is visible */
        .custom-theme-wrapper input::placeholder,
        .custom-theme-wrapper textarea::placeholder {
          color: ${customColors.text}60 !important;
          opacity: 0.6 !important;
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
import { FormTheme, CustomColors } from '@/types/form-builder';

// Simple utility function to apply custom colors to theme styles
export function applyCustomColors(theme: FormTheme, customColors: CustomColors): FormTheme {
  // Clone the theme to avoid mutation
  const customizedTheme: FormTheme = {
    ...theme,
    customColors,
    styles: { ...theme.styles }
  };

  // For now, just store the custom colors with the theme
  // The actual styling will be handled in the component using CSS variables
  return customizedTheme;
}

// Helper function to extract dominant colors from a theme for defaults
export function extractThemeColors(theme: FormTheme): CustomColors {
  let primary = '#3B82F6'; // Default blue
  let secondary = '#6B7280'; // Default gray
  let background = '#F9FAFB'; // Default light gray

  // Extract colors based on theme ID patterns
  switch (theme.id) {
    case 'minimal':
      primary = '#1F2937'; // Dark gray for minimal
      secondary = '#6B7280';
      background = '#FFFFFF';
      break;
    case 'modern':
      primary = '#8B5CF6'; // Purple for modern
      secondary = '#374151';
      background = '#F8FAFC';
      break;
    case 'professional':
      primary = '#2563EB'; // Blue for professional
      secondary = '#4B5563';
      background = '#FFFFFF';
      break;
    case 'playful':
      primary = '#EC4899'; // Pink for playful
      secondary = '#7C3AED';
      background = '#FDF2F8';
      break;
    case 'elegant':
      primary = '#4F46E5'; // Indigo for elegant
      secondary = '#6B7280';
      background = '#FFFFFF';
      break;
    case 'neon':
      primary = '#00FF88'; // Neon green
      secondary = '#00D9FF';
      background = '#0A0A0A';
      break;
    case 'nature':
      primary = '#059669'; // Emerald green
      secondary = '#047857';
      background = '#F0FDF4';
      break;
    case 'luxury':
      primary = '#D97706'; // Amber/gold
      secondary = '#92400E';
      background = '#0F0A02';
      break;
    case 'retro':
      primary = '#F97316'; // Orange
      secondary = '#EA580C';
      background = '#FFF7ED';
      break;
    case 'cosmic':
      primary = '#8B5CF6'; // Purple
      secondary = '#A855F7';
      background = '#0F0F23';
      break;
    case 'brutalist':
      primary = '#000000'; // Black
      secondary = '#374151';
      background = '#FFFFFF';
      break;
    case 'pastel-dream':
      primary = '#EC4899'; // Pink
      secondary = '#8B5CF6';
      background = '#FDF2F8';
      break;
    case 'neo-modern':
      primary = '#00FF41'; // Matrix green
      secondary = '#10B981';
      background = '#0A0A0A';
      break;
    case 'modern-bold':
      primary = '#F97316'; // Orange
      secondary = '#DC2626';
      background = '#FFFFFF';
      break;
  }

  return { primary, secondary, background };
}
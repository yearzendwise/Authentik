import { FormTheme, CustomColors } from '../types/form-builder';

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
  let text = '#1F2937'; // Default dark gray for text
  let button = '#3B82F6'; // Default blue for buttons
  let background = '#FFFFFF'; // Default white background
  let header = '#1F2937'; // Default header color
  let font: 'sans' | 'serif' | 'mono' = 'sans'; // Default font

  // Extract colors based on theme ID patterns
  switch (theme.id) {
    case 'minimal':
      text = '#1F2937'; // Dark gray
      header = '#111827'; // Darker gray for headers
      button = '#1F2937'; // Dark gray for minimal
      background = '#FFFFFF';
      font = 'sans';
      break;
    case 'modern':
      text = '#374151'; // Gray
      header = '#8B5CF6'; // Purple for headers
      button = '#8B5CF6'; // Purple for modern
      background = '#F8FAFC';
      font = 'sans';
      break;
    case 'professional':
      text = '#1F2937'; // Dark gray
      header = '#2563EB'; // Blue for headers
      button = '#2563EB'; // Blue for professional
      background = '#FFFFFF';
      font = 'sans';
      break;
    case 'playful':
      text = '#7C3AED'; // Purple
      header = '#EC4899'; // Pink for headers
      button = '#EC4899'; // Pink for playful
      background = '#FDF2F8';
      font = 'sans';
      break;
    case 'elegant':
      text = '#1F2937'; // Dark gray
      header = '#4F46E5'; // Indigo for headers
      button = '#4F46E5'; // Indigo for elegant
      background = '#FFFFFF';
      font = 'serif';
      break;
    case 'neon':
      text = '#00D9FF'; // Neon cyan
      header = '#00FF88'; // Neon green for headers
      button = '#00FF88'; // Neon green
      background = '#0A0A0A';
      font = 'mono';
      break;
    case 'nature':
      text = '#047857'; // Dark emerald
      header = '#059669'; // Emerald for headers
      button = '#059669'; // Emerald green
      background = '#F0FDF4';
      font = 'sans';
      break;
    case 'luxury':
      text = '#FCD34D'; // Gold/yellow
      header = '#F59E0B'; // Amber for headers
      button = '#D97706'; // Amber/gold
      background = '#0F0A02';
      font = 'serif';
      break;
    case 'retro':
      text = '#DC2626'; // Red
      header = '#F97316'; // Orange for headers
      button = '#F97316'; // Orange
      background = '#FFF7ED';
      font = 'mono';
      break;
    case 'cosmic':
      text = '#E9D5FF'; // Light purple
      header = '#A855F7'; // Bright purple for headers
      button = '#8B5CF6'; // Purple
      background = '#0F0F23';
      font = 'sans';
      break;
    case 'brutalist':
      text = '#000000'; // Black
      header = '#000000'; // Black for headers
      button = '#000000'; // Black
      background = '#FFFFFF';
      font = 'mono';
      break;
    case 'pastel-dream':
      text = '#BE185D'; // Pink
      header = '#EC4899'; // Bright pink for headers
      button = '#EC4899'; // Pink
      background = '#FDF2F8';
      font = 'sans';
      break;
    case 'neo-modern':
      text = '#10B981'; // Green
      header = '#00FF41'; // Matrix green for headers
      button = '#00FF41'; // Matrix green
      background = '#0A0A0A';
      font = 'mono';
      break;
    case 'modern-bold':
      text = '#1F2937'; // Dark gray
      header = '#F97316'; // Orange for headers
      button = '#F97316'; // Orange
      background = '#FFFFFF';
      font = 'sans';
      break;
  }

  return { text, button, background, header, font };
}

// Helper function to lighten a color
export function lightenColor(color: string, percent: number = 20): string {
  // Handle gradients by returning a semi-transparent white overlay
  if (color.includes('gradient')) {
    return color;
  }
  
  // Convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  // If it's already an rgb/rgba color
  if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      const a = match[4] ? parseFloat(match[4]) : 1;
      
      // Lighten by mixing with white
      const newR = Math.min(255, r + (255 - r) * (percent / 100));
      const newG = Math.min(255, g + (255 - g) * (percent / 100));
      const newB = Math.min(255, b + (255 - b) * (percent / 100));
      
      return `rgba(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(newB)}, ${a})`;
    }
  }
  
  // Handle hex colors
  const rgb = hexToRgb(color);
  if (rgb) {
    // Lighten by mixing with white
    const newR = Math.min(255, rgb.r + (255 - rgb.r) * (percent / 100));
    const newG = Math.min(255, rgb.g + (255 - rgb.g) * (percent / 100));
    const newB = Math.min(255, rgb.b + (255 - rgb.b) * (percent / 100));
    
    // Convert back to hex
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
  }
  
  // Return original color if we can't parse it
  return color;
}
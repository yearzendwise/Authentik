# Form Builder Component Library

A comprehensive React form builder with drag-and-drop functionality, 14 beautiful themes, and advanced customization capabilities.

## Quick Start

1. **Copy this folder** to your React Vite project:
   ```bash
   cp -r ./dist ./your-project/src/components/form-builder
   ```

2. **Install dependencies**:
   ```bash
   npm install @dnd-kit/core @dnd-kit/sortable @headlessui/react @heroicons/react @radix-ui/react-dialog @radix-ui/react-label class-variance-authority clsx lucide-react react-hook-form zod framer-motion
   ```

3. **Configure Tailwind CSS** - Add to your `tailwind.config.js`:
   ```js
   content: [
     "./src/**/*.{js,ts,jsx,tsx}",
     "./src/components/form-builder/**/*.{js,ts,jsx,tsx}",
   ]
   ```

4. **Use in your app**:
   ```tsx
   import { FormBuilder } from './components/form-builder';
   
   function App() {
     return (
       <FormBuilder 
         onSave={(data) => console.log('Form saved:', data)}
         onExport={(data) => console.log('Form exported:', data)}
       />
     );
   }
   ```

## Features

- 🎨 **14 Beautiful Themes** - From minimal to cosmic designs
- 🖱️ **Drag & Drop Interface** - Intuitive form building
- 📱 **Mobile Responsive** - Works on all devices
- 🎯 **TypeScript Support** - Full type safety
- 🎨 **Color Customization** - Advanced gradient options
- 📋 **Rich Components** - 10+ form element types

## Components

- `FormBuilder` - Complete form builder with wizard
- `FormWizard` - Step-by-step creation process
- `ThemedFormRenderer` - Render forms with themes
- `ComponentPalette` - Draggable component library
- `PropertiesPanel` - Element configuration

## Hooks

- `useFormWizard` - Wizard state management
- `useFormBuilder` - Form building functionality

## Themes

Minimal, Modern, Professional, Playful, Elegant, Neon, Nature, Luxury, Retro, Cosmic, Brutalist, Pastel Dream, Neo Modern, Modern Bold

## Integration

See the parent INTEGRATION.md file for complete setup instructions including Tailwind configuration and CSS variables.

## Requirements

- React 18+
- Vite or compatible bundler
- Tailwind CSS 3+
- All peer dependencies from package.json
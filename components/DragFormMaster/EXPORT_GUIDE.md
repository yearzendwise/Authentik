# Form Builder Export Guide

## Making the Form Builder Importable

Your form builder project is now ready to be imported into other React Vite projects! Here's what has been set up:

### ✅ What's Ready

1. **Package Structure** - Created in `./lib/` directory
2. **Build System** - Simple Node.js build script that copies all necessary files
3. **Exported Components** - All major components are available for import
4. **Theme System** - All 14 themes are included
5. **Type Definitions** - Full TypeScript support
6. **Documentation** - Complete integration guide

### 📦 Package Contents

The built package (`./lib/dist/`) includes:

- **Main Components**: FormBuilder, FormWizard, ThemedFormRenderer
- **UI Components**: All form elements, palette, properties panel
- **Hooks**: useFormWizard, useFormBuilder
- **Themes**: All 14 themes with styling
- **Types**: Complete TypeScript definitions
- **Utilities**: Theme helpers and color utilities

### 🚀 Quick Start for Other Projects

1. **Copy the package**:
   ```bash
   cp -r ./lib/dist ./your-project/src/components/form-builder
   ```

2. **Install dependencies** in your target project:
   ```bash
   npm install @dnd-kit/core @dnd-kit/sortable @headlessui/react @heroicons/react @radix-ui/react-dialog @radix-ui/react-label class-variance-authority clsx lucide-react react-hook-form zod framer-motion
   ```

3. **Configure Tailwind CSS** - Add form builder paths to content array
4. **Add CSS variables** - Copy the CSS variables from the integration guide
5. **Import and use**:
   ```tsx
   import { FormBuilder } from './components/form-builder';
   
   function App() {
     return <FormBuilder onSave={handleSave} onExport={handleExport} />;
   }
   ```

### 📖 Integration Guide

Check `./lib/INTEGRATION.md` for complete step-by-step integration instructions including:

- Detailed dependency installation
- Tailwind CSS configuration
- CSS variable setup
- Component usage examples
- Troubleshooting tips

### 🎨 Available Components

**Main Components:**
- `FormBuilder` - Complete form builder with wizard
- `FormWizard` - Step-by-step creation wizard
- `ThemedFormRenderer` - Render forms with themes

**Specialized Components:**
- `ComponentPalette` - Draggable component library
- `PropertiesPanel` - Element configuration panel
- `BuildStep`, `StyleStep`, `PreviewStep` - Individual wizard steps

**Hooks:**
- `useFormWizard` - Wizard state management
- `useFormBuilder` - Form building functionality

### 🎭 Theme System

All 14 themes are included:
- Minimal, Modern, Professional, Playful, Elegant
- Neon, Nature, Luxury, Retro, Cosmic
- Brutalist, Pastel Dream, Neo Modern, Modern Bold

Each theme includes complete styling for all form elements.

### 🔧 Build Process

The build process (`npm run build` in ./lib/) does:

1. Copies all React components from `client/src/`
2. Includes hooks, types, and utilities
3. Bundles CSS styles
4. Creates proper export structure
5. Generates documentation

### 💡 Usage Examples

**Simple Integration:**
```tsx
import { FormBuilder } from './components/form-builder';

<FormBuilder 
  onSave={(data) => console.log('Saved:', data)}
  onExport={(data) => console.log('Exported:', data)}
/>
```

**Custom Implementation:**
```tsx
import { useFormWizard, ThemedFormRenderer, themes } from './components/form-builder';

const { formElements, selectedTheme } = useFormWizard();

<ThemedFormRenderer
  elements={formElements}
  theme={themes.find(t => t.id === 'modern')}
  onSubmit={handleSubmit}
/>
```

### 🛠 Development

To rebuild the package after making changes:

```bash
cd lib
npm run build
```

This will regenerate the `./lib/dist/` folder with updated components.

### 📋 Requirements for Target Projects

**Required:**
- React 18+
- Vite (or compatible bundler)
- Tailwind CSS 3+
- TypeScript (recommended)

**Dependencies:**
- All peer dependencies listed in `./lib/package.json`
- Radix UI components for accessibility
- Drag and drop functionality via @dnd-kit
- Form handling via react-hook-form + zod

Your form builder is now a fully portable React component library that can be easily integrated into any React Vite project! 🎉
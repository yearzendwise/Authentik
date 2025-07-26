# @replit/form-builder

A comprehensive React form builder with drag-and-drop functionality, multiple themes, and advanced customization capabilities.

## Features

- 🎨 **14 Beautiful Themes** - From minimal to cosmic, brutalist to pastel dream
- 🖱️ **Drag & Drop Interface** - Intuitive form building experience
- 📱 **Mobile Responsive** - Works seamlessly on all devices
- 🎯 **Type Safety** - Full TypeScript support
- 🎨 **Color Customization** - Advanced gradient and color options
- 📋 **Rich Components** - Text, email, select, checkboxes, rate scales, and more
- 🔧 **Flexible Integration** - Easy to integrate into existing React projects

## Installation

```bash
npm install @replit/form-builder
```

### Peer Dependencies

Make sure you have the required peer dependencies installed:

```bash
npm install react react-dom
```

### CSS Dependencies

You'll also need to install Tailwind CSS in your project, as the form builder uses Tailwind classes:

```bash
npm install -D tailwindcss postcss autoprefixer
```

## Quick Start

```tsx
import React from 'react';
import { FormBuilder } from '@replit/form-builder';
import '@replit/form-builder/dist/styles.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <FormBuilder />
    </div>
  );
}

export default App;
```

## Components

### FormBuilder

The main component that provides the complete form building experience:

```tsx
import { FormBuilder } from '@replit/form-builder';

<FormBuilder />
```

### FormWizard

A wizard component for step-by-step form creation:

```tsx
import { FormWizard } from '@replit/form-builder';

<FormWizard
  onSave={(formData) => console.log('Form saved:', formData)}
  onExport={(formData) => console.log('Form exported:', formData)}
/>
```

### ThemedFormRenderer

Render a form with theme styling:

```tsx
import { ThemedFormRenderer } from '@replit/form-builder';

<ThemedFormRenderer
  elements={formElements}
  theme={selectedTheme}
  settings={formSettings}
  onSubmit={(data) => console.log('Form submitted:', data)}
/>
```

## Hooks

### useFormWizard

Manage wizard state and navigation:

```tsx
import { useFormWizard } from '@replit/form-builder';

const {
  currentStep,
  setCurrentStep,
  formElements,
  selectedTheme,
  formSettings,
  // ... other wizard state
} = useFormWizard();
```

### useFormBuilder

Manage form building functionality:

```tsx
import { useFormBuilder } from '@replit/form-builder';

const {
  elements,
  addElement,
  updateElement,
  deleteElement,
  reorderElements,
} = useFormBuilder();
```

## Types

The package exports comprehensive TypeScript types:

```tsx
import type {
  FormElement,
  FormTheme,
  FormSettings,
  CustomColors,
  WizardStep,
  FormElementType,
} from '@replit/form-builder';
```

## Themes

The form builder includes 14 pre-built themes:

- **Minimal** - Clean and simple
- **Modern** - Contemporary design
- **Professional** - Business-ready
- **Playful** - Fun and colorful
- **Elegant** - Sophisticated styling
- **Neon** - Cyberpunk inspired
- **Nature** - Earth tones
- **Luxury** - Premium design
- **Retro** - Vintage 80s style
- **Cosmic** - Space-themed
- **Brutalist** - Raw industrial
- **Pastel Dream** - Soft and dreamy
- **Neo Modern** - Tech-inspired
- **Modern Bold** - Ultra-modern with gradients

## Custom Styling

The form builder uses Tailwind CSS classes. Make sure your Tailwind config includes the form builder's paths:

```js
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@replit/form-builder/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Advanced Usage

### Custom Theme

You can create custom themes by extending the base theme structure:

```tsx
import type { FormTheme } from '@replit/form-builder';

const customTheme: FormTheme = {
  id: 'custom',
  name: 'Custom Theme',
  preview: 'bg-gradient-to-r from-purple-500 to-pink-500',
  // ... theme configuration
};
```

### Form Validation

Integrate with your preferred validation library:

```tsx
import { ThemedFormRenderer } from '@replit/form-builder';
import { z } from 'zod';

const validationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

<ThemedFormRenderer
  elements={elements}
  theme={theme}
  onSubmit={(data) => {
    const result = validationSchema.safeParse(data);
    if (result.success) {
      // Handle valid data
    } else {
      // Handle validation errors
    }
  }}
/>
```

## Contributing

This package is part of the Replit ecosystem. For contributing guidelines and development setup, please refer to the main repository.

## License

MIT License - see LICENSE file for details.
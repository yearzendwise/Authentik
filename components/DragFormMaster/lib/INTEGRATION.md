# Form Builder Integration Guide

This guide shows you how to integrate the Form Builder into your existing React Vite project.

## Quick Integration

### Step 1: Copy the Package

1. Copy the entire `lib/dist` folder from this project to your project
2. Rename it to something like `form-builder` or place it in your `src/components` directory

```bash
cp -r ./lib/dist ./your-project/src/components/form-builder
```

### Step 2: Install Dependencies

Make sure your project has these dependencies installed:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @headlessui/react @heroicons/react @hookform/resolvers @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-checkbox @radix-ui/react-switch @radix-ui/react-select class-variance-authority clsx lucide-react react-hook-form zod framer-motion
```

### Step 3: Configure Tailwind CSS

Update your `tailwind.config.js` to include the form builder paths:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/form-builder/**/*.{js,ts,jsx,tsx}", // Add this line
  ],
  theme: {
    extend: {
      // Form builder requires these color extensions
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
```

### Step 4: Add CSS Variables

Add these CSS variables to your main CSS file (usually `src/index.css`):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}
```

### Step 5: Use the Form Builder

Now you can use the Form Builder in your React components:

```tsx
import React from 'react';
import { FormBuilder } from './components/form-builder';

function App() {
  const handleSave = (formData: any) => {
    console.log('Form saved:', formData);
    // Handle form save logic
  };

  const handleExport = (formData: any) => {
    console.log('Form exported:', formData);
    // Handle form export logic
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          My Form Builder App
        </h1>
        <FormBuilder 
          onSave={handleSave}
          onExport={handleExport}
        />
      </div>
    </div>
  );
}

export default App;
```

## Individual Components

You can also use individual components if you don't need the full wizard:

```tsx
import { ThemedFormRenderer, useFormBuilder, themes } from './components/form-builder';

function CustomFormRenderer() {
  const { elements } = useFormBuilder();
  const selectedTheme = themes[0]; // Use minimal theme

  return (
    <ThemedFormRenderer
      elements={elements}
      theme={selectedTheme}
      settings={{ actionUrl: '/submit', method: 'POST' }}
      onSubmit={(data) => console.log('Form submitted:', data)}
    />
  );
}
```

## Available Components

- `FormBuilder` - Complete form builder with wizard interface
- `FormWizard` - Step-by-step form creation wizard
- `ThemedFormRenderer` - Render forms with theme styling
- `ComponentPalette` - Draggable component palette
- `PropertiesPanel` - Element properties editor

## Available Hooks

- `useFormWizard` - Manage wizard state and navigation
- `useFormBuilder` - Manage form elements and properties

## Available Themes

The form builder includes 14 pre-built themes:
- Minimal, Modern, Professional, Playful, Elegant
- Neon, Nature, Luxury, Retro, Cosmic
- Brutalist, Pastel Dream, Neo Modern, Modern Bold

## Troubleshooting

### Common Issues

1. **Styles not applying**: Make sure Tailwind CSS is properly configured and includes the form builder paths
2. **Missing components**: Ensure all required dependencies are installed
3. **Import errors**: Check that the file paths match your project structure

### Getting Help

If you encounter issues:
1. Check that all dependencies are installed
2. Verify Tailwind CSS configuration
3. Ensure CSS variables are defined
4. Check browser console for any error messages

## Example Projects

Check the main project for working examples of how to implement various form builder features.
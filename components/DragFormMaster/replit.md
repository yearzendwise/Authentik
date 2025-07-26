# Form Builder Application

## Overview

This is a modern wizard-style form builder application built with React and Express. The application guides users through a three-step process to create, style, and preview custom forms with a comprehensive component library and multiple design themes.

## User Preferences

Preferred communication style: Simple, everyday language.
Mobile-first design: Ensure all interfaces work seamlessly on mobile devices.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Bundler**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: Custom React hooks with local state management
- **Drag & Drop**: @dnd-kit for form builder interactions
- **Routing**: Wouter for lightweight client-side routing
- **Data Fetching**: TanStack Query for server state management

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Session Storage**: PostgreSQL-based sessions (connect-pg-simple)
- **Development**: Hot reload with Vite integration

### Project Structure
```
├── client/          # Frontend React application
├── server/          # Backend Express server
├── shared/          # Shared types and schemas
├── components.json  # shadcn/ui configuration
└── migrations/      # Database migrations
```

## Key Components

### Wizard Flow
- **Step 1 - Build**: Drag-and-drop form creation with component palette and properties panel
- **Step 2 - Style**: Selection from 9 robust and modern form themes with enhanced styling
- **Step 3 - Preview**: Final form preview with accurate theme rendering and save functionality

### Form Builder Core
- **Component Palette**: Draggable form elements (text, email, textarea, select, image, etc.)
- **Form Canvas**: Drop zone with sortable elements and live preview
- **Properties Panel**: Element configuration and styling options
- **Theme Selector**: 12 robust visual themes including Minimal, Modern, Professional, Playful, Elegant, Neon, Nature, Luxury, Retro, Cosmic, Brutalist, and Pastel Dream
- **Final Preview**: Complete form preview with save functionality

### Database Schema
- **Users Table**: Authentication and user management
- **Forms Table**: Form storage with JSON-based element configuration
- **Elements Structure**: Flexible JSON schema for form components with validation rules

### UI Components
- Complete shadcn/ui component library integration
- Consistent design system with CSS variables
- Fully responsive design with mobile-first approach
- Accessibility-focused components with proper touch targets
- Mobile-optimized interactions and animations
- Floating action button for mobile component addition

## Data Flow

1. **Step 1 - Form Creation**: Users drag components from palette to canvas and configure properties
2. **Step 2 - Theme Selection**: Users choose from 10 comprehensive visual themes with modern styling
3. **Step 3 - Preview & Save**: Users preview the final styled form and save to database
4. **State Management**: Custom hooks manage wizard state, form data, and theme selection
5. **Persistence**: Complete forms with theme data saved to PostgreSQL via REST API endpoints

## External Dependencies

### Frontend Libraries
- **UI Framework**: Radix UI primitives with shadcn/ui styling
- **Form Handling**: React Hook Form with Zod validation
- **Utilities**: clsx for conditional classes, date-fns for date handling
- **Development**: Replit-specific tooling for cloud development

### Backend Services
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle with PostgreSQL dialect
- **Validation**: Zod schemas shared between client and server

## Deployment Strategy

### Development
- **Local Development**: Vite dev server with Express backend
- **Hot Reload**: Full-stack hot reload with Vite middleware
- **Database**: Drizzle migrations with push-based schema updates

### Production
- **Build Process**: Vite builds frontend assets, esbuild bundles server
- **Static Assets**: Served from Express with Vite-built client
- **Database**: Production PostgreSQL connection via DATABASE_URL
- **Session Management**: PostgreSQL-backed sessions for scalability

### Configuration
- **Environment Variables**: DATABASE_URL for database connection
- **Path Aliases**: TypeScript path mapping for clean imports
- **CSS Variables**: Customizable theme system with dark mode support

## Recent Changes (July 2025)

### Enhanced Themes System
- **Enhanced 5 Existing Themes**: Updated Minimal, Modern, Professional, Playful, and Elegant themes with more robust styling, better typography, improved color schemes, and modern design patterns
- **Added 4 New Themes**: 
  - **Neon**: Cyberpunk-inspired with glowing effects and dark backgrounds
  - **Nature**: Earth tones with organic shapes and natural textures
  - **Luxury**: Premium design with rich colors and serif typography
  - **Retro**: Vintage 80s style with bold colors and geometric patterns
- **Improved Theme Previews**: Enhanced preview cards with theme-specific styling demonstrations and better visual representation
- **Fixed Form Preview**: Created dedicated ThemedFormRenderer for accurate preview rendering with proper theme application

### Drag and Drop System Improvements
- **Fixed Desktop Drag and Drop**: Resolved drag and drop functionality issues with proper event handling and component structure
- **Enhanced Component Palette**: Improved sidebar positioning with proper z-index hierarchy and responsive layout
- **Optimized Drag Sensors**: Configured mouse and touch sensors with appropriate activation constraints for better user experience
- **Added Drag Compatibility Diagnostic**: Comprehensive diagnostic tool to test browser and device compatibility for drag operations

### Technical Improvements
- **Fixed Infinite Loop Issues**: Resolved useEffect dependency problems that caused maximum update depth exceeded errors
- **Enhanced ThemedFormRenderer**: Specialized component for proper theme application in preview mode using native HTML elements
- **Improved Type Safety**: Better TypeScript integration throughout the theme system
- **Drag Diagnostic System**: Real-time compatibility testing for touch support, mouse support, browser compatibility, performance, and event system functionality
- **Fixed Rate Scale Display Style Persistence**: Updated data comparison logic in BuildStep to use deep comparison (JSON.stringify) instead of shallow ID comparison, ensuring that property changes like `rateVariant` are properly detected and saved when navigating between wizard steps
- **Streamlined Form Builder Components**: Removed Submit and Reset buttons from the component palette and form builder tools, making them exclusively auto-generated in Step 3 Preview for a cleaner building experience
- **Enhanced Boolean Switch Component**: Completed implementation of Boolean Switch component with three display variants (Yes/No, True/False, On/Off), full integration with component palette, properties panel, and form renderers
- **Automatic Form Completion**: All forms now automatically include Submit and Reset buttons in the preview step, eliminating the need for manual button placement and ensuring consistent form completion
- **JSON Form Data Preview**: Added functionality to preview form submission data in JSON format when clicking Submit button in Step 3, showing users exactly how their form data will be structured for backend processing with copy-to-clipboard feature
- **Enhanced Rate Scale Data Handling**: Rate scales now show "NA" instead of null or 0 when no value is selected, providing clearer indication of unselected rating fields in form submissions
- **Email Client Preview**: Replaced raw JSON output with professional email client-style preview showing form submissions as they would appear in notification emails, with option to view technical JSON data separately
- **Improved Button Spacing**: Added dedicated spacer element (35px height) between form fields and submit/reset buttons in Step 3 preview for clean visual separation and improved user experience
- **Fixed Textarea Data Processing**: Resolved issue where textarea values were incorrectly processed as boolean false instead of text strings in form submissions, ensuring proper data type handling for all text-based inputs
- **Theme-Specific Boolean Switch Styling**: Implemented comprehensive theme-aware boolean switch styling for all 9 themes, with each theme having custom track colors, thumb styling, and label colors that match the theme's design aesthetic. Created ThemedBooleanSwitch component for proper theme integration in form previews
- **Removed Glassmorphism Theme**: Completely removed the glassmorphism theme from the application including all CSS styling and references to simplify the theme system
- **Comprehensive Themed Checkbox and Radio Components**: Implemented fully themed checkbox and radio button components that match all 9 form themes with custom styling including borders, colors, typography, and visual effects. Each theme has unique styling that integrates with its design language (July 2025)
- **Enhanced Rate Scale Emoji System**: Updated rate scale emojis with unique 1-10 mapping, removing repetitive emoji usage and creating better emotional progression from negative to positive with expressive hover/active states (July 2025)
- **Advanced Number Input Component**: Created comprehensive NumberInput component with three variants: Number (Default), Phone Number, and Currency. Features real-time input masking, automatic formatting as users type, and intelligent validation. Phone numbers format as (XXX) XXX-XXXX with 10-digit limitation, currency inputs format with $ prefix and decimal control, all with visual placeholder examples (July 2025)
- **Mandatory Field Name Formatting**: Implemented strict field name validation ensuring all component field names only contain lowercase letters (a-z) and hyphens (-) as separators. Fixed input filtering to allow hyphens during typing by removing aggressive normalization that stripped trailing hyphens. Added real-time validation in properties panel, uniqueness enforcement, and comprehensive formatting rules with visual feedback for invalid names (July 2025)
- **Full Name Component**: Created new Full Name form component with side-by-side First Name and Last Name input fields in a single row layout. Added to component palette with teal gradient styling, integrated with all form renderers including themed preview versions, and added proper form builder hooks support (July 2025)
- **Removed Button Label Customization**: Eliminated button text customization functionality from form properties panel as the system will handle language switching programmatically. Removed submitButtonText and resetButtonText properties from all form settings interfaces and hooks while maintaining Submit and Reset button functionality with default labels (July 2025)
- **Standardized Field Heights Across All Themes**: Implemented consistent h-12 (48px) height for all form input elements across all 9 themes (Minimal, Modern, Professional, Playful, Elegant, Neon, Nature, Luxury, Retro). Updated theme input styles, base UI components (Input, Select), and form renderers to ensure clean, uniform UI appearance. All text inputs, email inputs, selects, number inputs, and other form controls now maintain consistent vertical spacing and visual alignment (July 2025)
- **HeadlessUI Select Component Implementation**: Replaced basic HTML select dropdowns with comprehensive HeadlessUI Listbox component featuring theme-specific styling for all 9 themes. Each theme has custom dropdown appearance, option styling, and hover states that match the theme's design language. Includes proper accessibility features, keyboard navigation, smooth transitions, and visual feedback. Maintains shadcn Select component for form building (Step 1) while using HeadlessUI for themed previews (Step 3) (July 2025)
- **Comprehensive README Documentation**: Created detailed README.md file covering all project features, setup instructions, API reference, theme system documentation, security considerations, mobile support details, and contribution guidelines. Includes complete technology stack overview, project structure explanation, and deployment instructions for both development and production environments (July 2025)
- **Compact Mode Layout Feature**: Added compact mode option in form properties that creates a 2-column grid layout for form elements, automatically grouping compatible elements into rows of 2. Excludes components that already have multi-column layouts (Full Name, rate scales, images, buttons) from compact grouping. Now includes textarea and email input fields in compact mode. Maintains single-column layout for excluded elements while optimizing space usage for standard input fields (July 2025)
- **Expanded Theme Collection**: Added 3 new stunning themes bringing the total to 12 themes:
  - **Cosmic**: Space-themed design with dark backgrounds, cosmic gradients, starry effects, and glowing purple/pink accents
  - **Brutalist**: Raw, industrial design with bold black borders, harsh shadows, stark contrasts, and uppercase typography
  - **Pastel Dream**: Soft, dreamy design with gentle pastels, cloud-like elements, gradient overlays, and rounded edges
  All new themes include comprehensive styling for checkboxes, radio buttons, boolean switches, select dropdowns, and all form elements (July 2025)
- **Neo Modern Theme**: Added new tech-inspired theme with dark gradient backgrounds, monospace fonts, terminal-style elements, green accent colors, and Matrix-style aesthetics. Features sharp edges and cyberpunk design elements. Fixed theme preview visibility issues for Professional and Minimal themes (July 2025)
- **Modern Bold Theme**: Created new ultra-modern theme with bold gradients (orange-red-purple), striking typography, dynamic hover effects (scale, rotate), and enhanced visual impact. Features larger text sizes, thick borders, dramatic shadows, and uppercase tracking for maximum visual presence (July 2025)
- **Enhanced Compact Mode**: Updated compact form functionality to include textarea and email address field types in 2-column layout, providing better space utilization for all compatible form elements (July 2025)
- **Fixed Form Progress Counter Reset**: Resolved issue where Reset button wasn't clearing the form progress counter. Added proper onReset handler to ThemedFormRenderer component that clears liveFormData state, actualFormData state, and resets email preview. Form progress bar now correctly resets to 0% when clicking Reset button, providing accurate visual feedback of form completion state (July 2025)
- **Advanced Color Customization with Gradient Support**: Enhanced color modification system in Step 3 with comprehensive gradient support and theme-based color presets. Features include:
  - Toggle between solid colors and gradients for primary, secondary, and background colors
  - Theme-specific gradient presets (e.g., "Purple Dream" for Modern, "Cyber Green" for Neon, "Gold Shimmer" for Luxury)
  - Live preview showing real-time color and gradient changes
  - Support for CSS gradients with proper fallbacks for all form elements
  - Color picker, hex input, and preset color palettes for each color type
  - CustomThemedForm wrapper applying gradients to buttons, checkboxes, labels, and backgrounds
  - Gradient text effects for labels using CSS background-clip
  - Proper gradient application to all interactive elements with hover states (July 2025)
- **Importable Package Structure**: Created comprehensive package structure in `./lib/` directory to make the form builder importable into other React Vite projects. Features include:
  - Complete build system with Node.js build script copying all necessary components, hooks, types, and utilities
  - Package exports for FormBuilder, FormWizard, ThemedFormRenderer, and all specialized components
  - All 14 themes packaged with complete styling systems
  - TypeScript definitions and proper module exports
  - Comprehensive integration guide with step-by-step setup instructions for Tailwind CSS configuration and CSS variables
  - Peer dependency management for @dnd-kit, @radix-ui, @headlessui, react-hook-form, zod, and other required packages
  - Built package in `./lib/dist/` ready to copy into other projects with simple import syntax (July 2025)

The application now provides 14 comprehensive themes, fully functional drag and drop with compatibility testing, ranging from minimal to cosmic, brutalist, neo-modern, and modern bold designs, offering users extensive customization options while maintaining modern full-stack development practices with type safety throughout, efficient development workflows, and scalable deployment architecture. The form builder provides an intuitive interface for creating complex forms without requiring technical knowledge from end users.
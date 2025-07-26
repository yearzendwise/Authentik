# Form Builder Application

A modern, wizard-style form builder application that allows users to create, customize, and preview forms with comprehensive theming options and an intuitive drag-and-drop interface.

## 🚀 Features

### Wizard-Based Form Creation
- **Step 1 - Build**: Drag-and-drop form creation with component palette and properties panel
- **Step 2 - Style**: Choose from 9 robust and modern form themes
- **Step 3 - Preview**: Final form preview with theme rendering and save functionality

### Rich Component Library
- **Text Input**: Standard text fields with validation
- **Email Input**: Email-specific validation and formatting
- **Number Input**: Three variants (Number, Phone Number, Currency) with real-time formatting
- **Textarea**: Multi-line text input with configurable rows
- **Select Dropdown**: HeadlessUI-powered with theme-specific styling
- **Checkbox Groups**: Multi-select options with themed styling
- **Radio Groups**: Single-select options with custom theming
- **Rate Scale**: 1-10 rating with unique emoji progression
- **Boolean Switch**: Three variants (Yes/No, True/False, On/Off)
- **Full Name**: Side-by-side First Name and Last Name fields

### 9 Professional Themes
1. **Minimal**: Clean, simple design with subtle borders
2. **Modern**: Glassmorphism effects with backdrop blur
3. **Professional**: Corporate styling with bold typography
4. **Playful**: Colorful design with rounded corners
5. **Elegant**: Dark theme with sophisticated styling
6. **Neon**: Cyberpunk-inspired with glowing effects
7. **Nature**: Earth tones with organic shapes
8. **Luxury**: Premium design with rich colors and serif fonts
9. **Retro**: Vintage 80s style with bold geometric patterns

### Advanced Features
- **Drag & Drop**: Intuitive component placement with visual feedback
- **Real-time Preview**: Live form updates as you build
- **Theme-Aware Components**: All elements adapt to selected themes
- **Field Validation**: Required fields, min/max values, character limits
- **Responsive Design**: Mobile-first approach with touch-friendly interactions
- **Form Data Preview**: JSON output with email-style formatting
- **Progress Tracking**: Real-time form completion indicators

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with shadcn/ui component library
- **@dnd-kit** for drag-and-drop functionality
- **HeadlessUI** for accessible form components
- **TanStack Query** for server state management
- **Wouter** for lightweight routing

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **PostgreSQL** with Drizzle ORM
- **Neon Database** (serverless PostgreSQL)
- **Session Management** with PostgreSQL storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or Neon account)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd form-builder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with:
   ```
   DATABASE_URL=your_postgresql_connection_string
   ```

4. **Run database migrations**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5000`

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── form-builder/    # Form builder core components
│   │   │   └── ui/             # Reusable UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/               # Utility functions
│   │   ├── pages/             # Application pages
│   │   └── types/             # TypeScript type definitions
│   └── index.html
├── server/                # Backend Express server
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   └── storage.ts        # Database storage interface
├── shared/               # Shared types and schemas
│   └── schema.ts        # Database schema and validation
└── README.md
```

## 🎨 Theme System

The application features 9 comprehensive themes, each with unique styling:

- **Colors**: Custom color palettes for each theme
- **Typography**: Theme-specific fonts (sans-serif, serif, mono)
- **Borders**: Varied border styles and radii
- **Effects**: Glassmorphism, shadows, glows, and gradients
- **Animations**: Smooth transitions and hover effects

### Theme Architecture
- Base theme styles defined in TypeScript
- CSS-in-JS approach for dynamic theming
- Component-level theme application
- Consistent styling across all form elements

## 🔧 API Reference

### Forms API

#### Create Form
```http
POST /api/forms
Content-Type: application/json

{
  "title": "Contact Form",
  "elements": [...],
  "theme": "modern",
  "settings": {...}
}
```

#### Get Forms
```http
GET /api/forms
```

#### Get Form by ID
```http
GET /api/forms/:id
```

#### Update Form
```http
PUT /api/forms/:id
Content-Type: application/json

{
  "title": "Updated Form",
  "elements": [...],
  "theme": "professional"
}
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 5000)

## 🧪 Testing

The application includes comprehensive drag-and-drop compatibility testing:

- **Touch Support**: Mobile device compatibility
- **Mouse Support**: Desktop interaction testing
- **Browser Compatibility**: Cross-browser drag functionality
- **Performance Testing**: Drag operation efficiency
- **Event System**: Proper event handling validation

## 📱 Mobile Support

- **Touch-Friendly**: Large touch targets for mobile devices
- **Responsive Layout**: Adaptive design for all screen sizes
- **Mobile Gestures**: Touch-based drag and drop
- **Floating Action Button**: Easy component addition on mobile
- **Optimized Interactions**: Mobile-first design approach

## 🔒 Security

- **Input Validation**: Zod schema validation on client and server
- **SQL Injection Protection**: Parameterized queries with Drizzle ORM
- **Session Management**: Secure PostgreSQL-based sessions
- **CORS Configuration**: Proper cross-origin resource sharing
- **Environment Variables**: Sensitive data protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for the beautiful component library
- **HeadlessUI** for accessible form components
- **Tailwind CSS** for utility-first styling
- **Radix UI** for primitive components
- **Drizzle ORM** for type-safe database operations

## 📧 Support

For support, email support@formbuilder.com or create an issue in the repository.

---

**Built with ❤️ using React, TypeScript, and modern web technologies**
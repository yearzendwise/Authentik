# Form Frontend Server

A standalone React frontend server for serving forms to customers based on UUID. This server operates independently from the main application backend and only provides public access to forms.

## Features

- **Public Form Access**: Serves forms by UUID without authentication
- **Form Submission**: Handles form responses and stores them in the database
- **Isolated Environment**: Runs separately from main application
- **Security**: Only accesses active forms and stores responses with tracking
- **Responsive UI**: Modern, responsive design for all device types

## Architecture

```
/fserver/
├── index.ts              # Express server
├── routes/
│   └── forms.ts         # Form API routes
├── database.ts          # Database connection
├── schema.ts            # Database schema definitions
├── src/                 # React frontend
│   ├── components/
│   │   ├── FormView.tsx # Main form rendering component
│   │   ├── NotFound.tsx # 404 page
│   │   └── ui/          # UI components
│   ├── lib/
│   │   └── utils.ts     # Utility functions
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # React entry point
│   └── index.css        # Tailwind CSS
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── package.json         # Dependencies and scripts
```

## API Endpoints

- `GET /api/forms/:id` - Get form data by UUID
- `POST /api/forms/:id/submit` - Submit form response

## Development

```bash
cd fserver
npm install
npm run dev
```

The server runs on port 3001 by default.

## Usage

Forms are accessed via URLs like:
```
http://localhost:3001/form/[UUID]
```

Where `[UUID]` is the form ID from the database.

## Environment Variables

Inherits from parent `.env` file:
- `DATABASE_URL` - PostgreSQL connection string
- `FSERVER_PORT` - Port for the form server (default: 3001)

## Security Features

- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- IP address and user agent tracking for submissions
- Only serves active forms
- No access to user authentication or tenant management
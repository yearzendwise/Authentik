# Full-Stack Authentication Application

## Overview

This is a modern full-stack web application built with React, Express, and PostgreSQL. The application provides a complete authentication system with login, registration, and password recovery features. It uses a clean monorepo structure with shared types and schemas between frontend and backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a monorepo architecture with clear separation between client, server, and shared code:

- **Frontend**: React with TypeScript, using Vite for development and building
- **Backend**: Express.js with TypeScript for API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Authentication**: JWT-based authentication with access tokens and refresh tokens

## Key Components

### Frontend Architecture
- **React Router**: Using wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for API state, React Context for auth state

### Backend Architecture
- **Express Server**: RESTful API with middleware for authentication
- **Database Layer**: Drizzle ORM with Neon serverless PostgreSQL
- **Authentication**: JWT tokens with bcrypt for password hashing
- **Storage Interface**: Abstracted storage layer for database operations
- **Cookie Management**: HTTP-only cookies for refresh token storage

### Database Schema
- **Users Table**: Stores user credentials and profile information
- **Refresh Tokens Table**: Manages JWT refresh tokens with expiration
- **Schema Validation**: Zod schemas shared between frontend and backend

## Data Flow

1. **Authentication Flow**:
   - User submits login/registration form
   - Frontend validates data using Zod schemas
   - API endpoint processes request and generates JWT tokens
   - Access token stored in memory, refresh token in HTTP-only cookie
   - Protected routes verify access token on each request

2. **API Communication**:
   - Frontend uses TanStack Query for API calls
   - Custom query client handles token refresh automatically
   - Error handling with toast notifications for user feedback

3. **Database Operations**:
   - Drizzle ORM provides type-safe database queries
   - Storage interface abstracts database operations
   - Connection pooling with Neon serverless PostgreSQL

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token generation and verification
- **zod**: Runtime type validation

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

The application is designed for deployment on platforms like Replit:

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations in `migrations/` directory

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **JWT_SECRET**: Secret key for access token signing
- **REFRESH_TOKEN_SECRET**: Secret key for refresh token signing
- **NODE_ENV**: Environment mode (development/production)

### Production Setup
- Static files served from `dist/public`
- API routes prefixed with `/api`
- Database migrations applied via `db:push` script
- Server runs on configurable port with Express

The architecture supports both development and production environments with hot reloading in development and optimized builds for production deployment.
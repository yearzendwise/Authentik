# Full-Stack SaaS Authentication Application

## Overview

This is a modern full-stack SaaS authentication system built with React, Express, and PostgreSQL. The application provides a comprehensive authentication system with JWT token management, user registration, login, profile management, and security features. It uses a clean monorepo structure with shared types and schemas between frontend and backend.

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
- **Express Server**: RESTful API with comprehensive authentication middleware
- **Database Layer**: Drizzle ORM with PostgreSQL for data persistence
- **Authentication**: JWT access and refresh tokens with bcrypt password hashing
- **Storage Interface**: Abstracted storage layer for all database operations
- **Cookie Management**: HTTP-only cookies for secure refresh token storage
- **Profile Management**: Complete CRUD operations for user account management

### Database Schema
- **Users Table**: Stores user credentials and profile information
- **Refresh Tokens Table**: Manages JWT refresh tokens with expiration
- **Schema Validation**: Zod schemas shared between frontend and backend

## Data Flow

1. **Authentication Flow**:
   - User submits login/registration form
   - Frontend validates data using Zod schemas
   - API endpoint processes request and generates JWT tokens
   - Access token stored in localStorage, refresh token in HTTP-only cookie
   - Protected routes verify access token with automatic refresh handling

2. **Profile Management Flow**:
   - User updates profile information through secure forms
   - Password changes trigger token revocation across all devices
   - Account deletion marks user as inactive and clears all tokens
   - Real-time validation with password strength indicators

3. **API Communication**:
   - Frontend uses TanStack Query for API calls
   - Custom auth manager handles token refresh automatically
   - Comprehensive error handling with toast notifications

4. **Database Operations**:
   - Drizzle ORM provides type-safe database queries
   - Storage interface abstracts all database operations
   - Connection pooling with PostgreSQL database

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
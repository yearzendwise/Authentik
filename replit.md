# Full-Stack SaaS Authentication Application

## Overview

This is a modern full-stack SaaS authentication system built with React, Express, and PostgreSQL. The application provides a comprehensive authentication system with JWT token management, user registration, login, profile management, email verification with Resend, and security features. It uses a clean monorepo structure with shared types and schemas between frontend and backend.

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
- **Device Session Management**: Complete interface for viewing and managing active login sessions

### Backend Architecture
- **Express Server**: RESTful API with comprehensive authentication middleware
- **Database Layer**: Drizzle ORM with PostgreSQL for data persistence
- **Authentication**: JWT access and refresh tokens with bcrypt password hashing
- **Email Verification**: Fully functional Resend service integration for account verification emails
- **Two-Factor Authentication**: TOTP-based 2FA with QR code generation using otplib and qrcode
- **Multi-Device Tracking**: Device detection with browser/OS identification and IP tracking
- **Storage Interface**: Abstracted storage layer for all database operations
- **Cookie Management**: HTTP-only cookies for secure refresh token storage
- **Profile Management**: Complete CRUD operations for user account management
- **Development Tools**: Console URL logging and development endpoints for testing email verification

### Database Schema
- **Users Table**: Stores user credentials, profile information, 2FA settings, and email verification status
- **Refresh Tokens Table**: Enhanced with device tracking fields (device ID, name, user agent, IP address, location, last used)
- **Verification Tokens Table**: Manages email verification tokens with expiration
- **Schema Validation**: Zod schemas shared between frontend and backend

## Data Flow

1. **Authentication Flow**:
   - User submits registration form → system sends verification email via Resend
   - User clicks verification link → email is verified → welcome email sent
   - User submits login form with verified email
   - Frontend validates data using Zod schemas
   - API endpoint processes request and generates JWT tokens
   - If 2FA is enabled, user must provide TOTP code for verification
   - Access token stored in localStorage, refresh token in HTTP-only cookie
   - Protected routes verify access token with automatic refresh handling

2. **Two-Factor Authentication Flow**:
   - User initiates 2FA setup from profile page
   - Server generates TOTP secret and QR code using otplib
   - User scans QR code with authenticator app (Google Authenticator, Authy, etc.)
   - User verifies setup by entering 6-digit TOTP code
   - 2FA protection applies to all future login attempts

3. **Profile Management Flow**:
   - User updates profile information through secure forms
   - Password changes trigger token revocation across all devices
   - Account deletion marks user as inactive and clears all tokens
   - Real-time validation with password strength indicators
   - 2FA can be enabled/disabled with authenticator code verification

4. **Multi-Device Session Management Flow**:
   - System tracks each login with device detection (browser, OS, IP address)
   - Users can view all active sessions with device details and last used timestamps
   - Individual device logout functionality with confirmation dialogs
   - Bulk logout from all other devices except current session
   - Automatic device fingerprinting for unique session identification

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
- **RESEND_API_KEY**: API key for Resend email service (verified and functional)
- **NODE_ENV**: Environment mode (development/production)

### Production Setup
- Static files served from `dist/public`
- API routes prefixed with `/api`
- Database migrations applied via `db:push` script
- Server runs on configurable port with Express

The architecture supports both development and production environments with hot reloading in development and optimized builds for production deployment.

## Recent Changes (January 25, 2025)

✓ **Email Verification System Completed**: Fully implemented and tested Resend integration
✓ **API Key Configuration**: Successfully configured Resend API key (re_f27r7h2s_BYXi6aNpimSCfCLwMeec686Q)
✓ **Email Delivery**: Confirmed working email delivery to verified domains
✓ **Development Tools**: Added console URL logging and development verification endpoints
✓ **Registration Flow**: Updated to handle email verification requirements
✓ **Login Security**: Blocks unverified users from accessing the system
✓ **Automatic Verification Detection**: Added periodic checking and cache invalidation for email verification status
✓ **From Address Update**: Changed email from address to "dan@zendwise.work"

The email verification system is now production-ready with automatic verification detection. Users must verify their email addresses before they can log in. When unverified users login, they see a pending verification page that automatically redirects them after email verification. The system includes professional email templates and handles both successful deliveries and fallback scenarios during development.
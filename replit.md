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

## Recent Changes (July 26, 2025)

✓ **DragFormMaster Integration Completed**: Successfully integrated existing DragFormMaster component from /components/DragFormMaster folder
✓ **Forms Navigation Added**: Added Forms section to sidebar navigation with FileText icon
✓ **Forms Pages Created**: Created forms.tsx with routing for /forms and /forms/add routes
✓ **Import Path Fixes**: Fixed multiple broken import paths in DragFormMaster components
✓ **Missing UI Components**: Created rate-scale, number-input, themed-full-name, language-selector, boolean-switch, and full-name components
✓ **Form Builder Integration**: Replaced custom form builder with actual DragFormMaster FormBuilder component import
✓ **Multi-Tenant Row-Level Security**: Implemented comprehensive row-level multi-tenancy across all database tables
✓ **Tenant-Aware Authentication**: Updated login system to require tenant slug for multi-tenant authentication
✓ **Forms API Routes**: Added complete tenant-aware forms API endpoints for CRUD operations
✓ **Form Response Storage**: Implemented form submission and response tracking with tenant isolation
✓ **Database Schema Migration**: Successfully migrated all existing data to multi-tenant structure with default tenant
✓ **Input Sanitization Implemented**: Added comprehensive input sanitization and SQL injection protection
✓ **Rate Limiting Added**: Implemented rate limiting for login and registration endpoints
✓ **Authentication Security Enhanced**: Username/password trimming, IP-based rate limiting, and secure password validation
✓ **Deployment Dependency Fix**: Installed missing @headlessui/react and @heroicons/react packages for form builder components
✓ **Build Warnings Fixed**: Removed duplicate class methods in storage.ts eliminating all build warnings

## Previous Changes (January 25, 2025)

✓ **Email Verification System Completed**: Fully implemented and tested Resend integration
✓ **API Key Configuration**: Successfully configured Resend API key (re_f27r7h2s_BYXi6aNpimSCfCLwMeec686Q)
✓ **Email Delivery**: Confirmed working email delivery to verified domains
✓ **Development Tools**: Added console URL logging and development verification endpoints
✓ **Registration Flow**: Updated to handle email verification requirements
✓ **Login Security**: Blocks unverified users from accessing the system
✓ **Automatic Verification Detection**: Added periodic checking and cache invalidation for email verification status
✓ **From Address Update**: Changed email from address to "dan@zendwise.work"
✓ **Session Management Bug Fix**: Fixed "log out all devices" functionality that was incorrectly logging out current device
✓ **Menu Preferences System**: Added persistent menu state management with user preferences
✓ **Default Menu State**: Changed sidebar to be minimized by default with option to expand
✓ **Profile Settings**: Added preferences tab in profile page for menu toggle control
✓ **User Management System**: Comprehensive admin interface for managing users with full CRUD operations
✓ **Role-Based Access Control**: Administrator and Manager roles can access user management features
✓ **User Creation & Editing**: Admins can create new users with automatic verification and edit existing users
✓ **User Status Management**: Toggle user active/inactive status and delete users with confirmation
✓ **Advanced Filtering**: Search users by name/email, filter by role and status with real-time updates
✓ **User Statistics Dashboard**: Display total users, active users, and role distribution with visual cards
✓ **Authentication Enhancement**: Fixed backend to include user roles in all authentication responses
✓ **Subscription Management Interface**: Comprehensive subscription page for existing subscribers showing current plan details, billing info, and upgrade options
✓ **Subscription Upgrade System**: Backend API and frontend interface for users to upgrade/downgrade their subscription plans
✓ **Plan Comparison View**: Side-by-side comparison of all available plans with current plan highlighting and upgrade recommendations
✓ **Trial Status Display**: Clear indication of trial status with days remaining and billing information
✓ **Stripe Integration Enhancement**: Added subscription modification capabilities with prorated billing

The authentication system now includes comprehensive session management with proper device isolation for logout operations. The navigation menu defaults to a minimized state showing only icons, with users able to toggle their preference both via the sidebar button and the profile preferences page. Menu preferences are saved to the database and persist across sessions.

The user management system provides administrators with complete control over user accounts, including creation, editing, activation/deactivation, and deletion. The interface includes advanced filtering and search capabilities, plus real-time statistics about the user base. Role-based access ensures only authorized personnel can access these features.

The subscription system now allows existing subscribers to access the subscription page to view their current plan details, see trial status, and upgrade or downgrade their plans. The interface provides clear comparison between plans and handles billing cycle changes with prorated invoicing through Stripe.
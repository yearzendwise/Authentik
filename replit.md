# Full-Stack SaaS Authentication Application

## Overview

This project is a full-stack SaaS authentication system providing a comprehensive solution for user management. It features JWT token management, user registration, login, profile management, and email verification. The application supports a multi-tenant architecture with Owner-based organization management, allowing each organization its own tenant space and an Owner user to manage team members. The system aims to provide a secure and scalable authentication backbone for SaaS applications.

## User Preferences

Preferred communication style: Simple, everyday language.
UI/UX Design: Modern glass morphism design with enhanced dark mode support (July 31, 2025).

## Recent Changes (August 6, 2025)

### Go Backend Server Implementation ✅ COMPLETED
- **New Go Server**: Created `server-go/` directory with complete email tracking microservice
- **Temporal Integration**: Implemented robust connection to Temporal server at 10.100.0.2 with retry logic and graceful failure handling
- **JWT Authentication**: Full JWT validation compatible with existing Node.js authentication system using shared JWT_SECRET
- **Email Lifecycle API**: Complete RESTful endpoints for creating, reading, updating, deleting email tracking entries
- **Tenant Isolation**: Multi-tenant support with proper data separation enforced at middleware level
- **Health Monitoring**: Built-in health checks and Temporal connectivity verification
- **Testing Version**: Additional no-Temporal version for development/testing purposes
- **CORS Support**: Cross-origin resource sharing enabled for frontend integration
- **Error Handling**: Comprehensive error handling with detailed logging and proper HTTP status codes

## System Architecture

The application adopts a monorepo architecture, separating client, server, and shared code.

### Core Technologies
-   **Frontend**: React with TypeScript, using Vite.
-   **Backend**: Express.js with TypeScript.
-   **Database**: PostgreSQL with Drizzle ORM.
-   **Styling**: Tailwind CSS with shadcn/ui.
-   **State Management**: TanStack Query.
-   **Authentication**: JWT-based with access and refresh tokens, with token invalidation support for logout all devices.

### Key Architectural Decisions
-   **Monorepo Structure**: Facilitates shared types and schemas between frontend and backend.
-   **Multi-Tenant Architecture**: Supports owner-based organization management with row-level security and tenant isolation for data.
-   **JWT Authentication**: Implemented with secure HTTP-only cookies for refresh tokens and comprehensive device session tracking.
-   **Email Verification**: Integrated with Resend for account verification and welcome emails.
-   **Two-Factor Authentication (2FA)**: TOTP-based 2FA with QR code generation.
-   **Robust Data Flow**: Defined processes for owner registration, user login (including 2FA), profile management, and multi-device session handling.
-   **Abstraction Layers**: Storage interface for database operations and custom auth manager for token refresh.
-   **UI/UX**: Utilizes shadcn/ui and Tailwind CSS for a consistent and accessible design, including comprehensive dark mode support.
-   **Modern Design System**: Implemented glass morphism design with backdrop blur effects, gradient-based visual hierarchy, and enhanced dark mode parity (July 31, 2025).
-   **Form Management**: React Hook Form with Zod validation for robust form handling.
-   **User Management**: Provides administrators with full CRUD operations for users, including role-based access control (Owner, Administrator, Manager, Employee).
-   **Subscription Management**: Interface for managing subscription plans with upgrade/downgrade options and Stripe integration.

## Security Features

### Token Invalidation for "Logout All Devices"
-   **Implementation**: Uses `tokenValidAfter` timestamp in the users table to track when all tokens should be invalidated.
-   **How it works**: When a user clicks "Log Out All Other Devices", the system updates `tokenValidAfter` to the current timestamp. Any JWT token issued before this timestamp is immediately rejected by the authentication middleware.
-   **Security benefit**: Provides immediate token invalidation across all devices, eliminating the security vulnerability where tokens could remain valid for up to 15 minutes after logout.
-   **User experience**: Users can confidently secure their account by instantly revoking access from all other devices/browsers.

### Comprehensive Tenant Isolation (August 5, 2025)
-   **Strict Data Filtering**: All database operations now enforce tenant-specific filtering to prevent cross-tenant data exposure.
-   **Enhanced Security Methods**: Updated storage interface methods to require tenantId parameters:
    - `updateRefreshToken`: Now includes tenantId for secure token management
    - `refreshTokenExists`: Enhanced with tenant-specific validation
    - `getUserSubscription`: Tenant-scoped subscription retrieval
    - `updateUserStripeInfo`: Secure user Stripe information updates
    - `getSubscription` & `updateSubscription`: Optional tenant filtering for additional security
    - `getUserByEmailVerificationToken`: Optional tenant filtering for email verification
-   **Multi-Tenant Database Security**: All CRUD operations across users, subscriptions, forms, shops, email contacts, newsletters, and related entities now enforce strict tenant boundaries.
-   **Security Audit Completion**: Comprehensive review and hardening of all backend API endpoints to ensure proper tenant filtering and data isolation.

## External Dependencies

-   **@neondatabase/serverless**: PostgreSQL database connection.
-   **drizzle-orm**: Type-safe ORM.
-   **@tanstack/react-query**: Server state management.
-   **@radix-ui/***: Accessible UI component primitives.
-   **bcryptjs**: Password hashing.
-   **jsonwebtoken**: JWT token generation and verification.
-   **zod**: Runtime type validation.
-   **Resend**: Email service for verification and communication.
-   **otplib**: For TOTP-based 2FA.
-   **qrcode**: For QR code generation in 2FA.
-   **Stripe**: For subscription and billing management.
-   **wouter**: Lightweight client-side routing.
-   **@headlessui/react**: UI components for forms.
-   **@heroicons/react**: Icons for UI components.

## Database Migration Status

**Last Verified**: August 5, 2025

All database migrations are up-to-date and include current schema columns:

### Applied Migrations
- **001_make_location_fields_optional.sql**: Made address and city fields optional in shops table
- **002_add_shop_limits_to_subscriptions.sql**: Added max_shops column to subscription_plans table
- **003_add_avatar_url_column.sql**: Added avatar_url column to users table
- **004_add_newsletter_table.sql**: Added newsletters table with full CRUD functionality

### Schema Verification (12 tables)
- ✅ **users**: 28 columns including menu_expanded, theme, avatar_url, token_valid_after, stripe integration fields
- ✅ **refresh_tokens**: Complete device tracking (device_id, device_name, user_agent, ip_address, location, last_used, is_active)
- ✅ **subscription_plans**: All limit columns (max_users, max_projects, max_shops, storage_limit, features array)
- ✅ **shops**: Full location details with proper nullable constraints
- ✅ **newsletters**: Complete newsletter management (title, subject, content, status, scheduling, analytics)
- ✅ **tenants, stores, subscriptions, verification_tokens, companies, forms, form_responses**: All current columns present

## Newsletter System Implementation

**Completed**: August 5, 2025

### Features Implemented
- **Newsletter Management Page**: Complete CRUD interface with statistics dashboard
- **Newsletter Creation Form**: Multi-step form with validation and preview functionality
- **Database Schema**: Full newsletter table with proper relationships and RLS policies
- **API Routes**: Complete REST API for newsletter operations (GET, POST, PUT, DELETE)
- **Navigation Integration**: Newsletter functionality integrated into main application navigation

### Technical Details
- Newsletter creation supports Draft, Scheduled, and Send status options
- Live preview of newsletter content during creation
- Statistics tracking for opens, clicks, and recipient counts
- Multi-tenant data isolation with proper security policies
- Form validation with Zod schemas and React Hook Form integration

**Database Command**: Use `npm run db:push` for schema changes instead of manual SQL migrations.
# Full-Stack SaaS Authentication Application

## Overview

This project is a full-stack SaaS authentication system providing a comprehensive solution for user management. It features JWT token management, user registration, login, profile management, and email verification. The application supports a multi-tenant architecture with Owner-based organization management, allowing each organization its own tenant space and an Owner user to manage team members. The system aims to provide a secure and scalable authentication backbone for SaaS applications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application adopts a monorepo architecture, separating client, server, and shared code.

### Core Technologies
-   **Frontend**: React with TypeScript, using Vite.
-   **Backend**: Express.js with TypeScript.
-   **Database**: PostgreSQL with Drizzle ORM.
-   **Styling**: Tailwind CSS with shadcn/ui.
-   **State Management**: TanStack Query.
-   **Authentication**: JWT-based with access and refresh tokens.

### Key Architectural Decisions
-   **Monorepo Structure**: Facilitates shared types and schemas between frontend and backend.
-   **Multi-Tenant Architecture**: Supports owner-based organization management with row-level security and tenant isolation for data.
-   **JWT Authentication**: Implemented with secure HTTP-only cookies for refresh tokens and comprehensive device session tracking.
-   **Email Verification**: Integrated with Resend for account verification and welcome emails.
-   **Two-Factor Authentication (2FA)**: TOTP-based 2FA with QR code generation.
-   **Robust Data Flow**: Defined processes for owner registration, user login (including 2FA), profile management, and multi-device session handling.
-   **Abstraction Layers**: Storage interface for database operations and custom auth manager for token refresh.
-   **UI/UX**: Utilizes shadcn/ui and Tailwind CSS for a consistent and accessible design, including comprehensive dark mode support.
-   **Form Management**: React Hook Form with Zod validation for robust form handling.
-   **User Management**: Provides administrators with full CRUD operations for users, including role-based access control (Owner, Administrator, Manager, Employee).
-   **Subscription Management**: Interface for managing subscription plans with upgrade/downgrade options and Stripe integration.

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
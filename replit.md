# Full-Stack SaaS Authentication Application

## Overview
This project is a full-stack SaaS authentication system providing a comprehensive solution for user management. It features JWT token management, user registration, login, profile management, and email verification. The application supports a multi-tenant architecture with Owner-based organization management, allowing each organization its own tenant space and an Owner user to manage team members. The system aims to provide a secure and scalable authentication backbone for SaaS applications, including public form access and email tracking capabilities.

## User Preferences
Preferred communication style: Simple, everyday language.
UI/UX Design: Modern glass morphism design with enhanced dark mode support.

## System Architecture
The application adopts a monorepo architecture, separating client, server, and shared code.

### Core Technologies
-   **Frontend**: React with TypeScript, using Vite.
-   **Backend**: Express.js with TypeScript.
-   **Form Frontend**: Independent React application for public form access (`/fserver`).
-   **Database**: PostgreSQL with Drizzle ORM.
-   **Styling**: Tailwind CSS with shadcn/ui.
-   **State Management**: TanStack Query.
-   **Authentication**: JWT-based with access and refresh tokens, with token invalidation support for "logout all devices".
-   **Email Tracking Microservice**: Go-based server with Temporal integration for robust email tracking.
-   **Resend Webhook Integration**: Real-time email event tracking through webhooks in the form server.

### Key Architectural Decisions
-   **Monorepo Structure**: Facilitates shared types and schemas between frontend and backend.
-   **Multi-Tenant Architecture**: Supports owner-based organization management with row-level security and comprehensive tenant isolation for data across all entities (users, subscriptions, forms, shops, email contacts, newsletters).
-   **JWT Authentication**: Implemented with secure HTTP-only cookies for refresh tokens and comprehensive device session tracking. Token invalidation is handled via a `tokenValidAfter` timestamp for immediate revocation.
-   **Email Verification**: Integrated with Resend for account verification and welcome emails.
-   **Two-Factor Authentication (2FA)**: TOTP-based 2FA with QR code generation.
-   **Robust Data Flow**: Defined processes for owner registration, user login (including 2FA), profile management, and multi-device session handling.
-   **Abstraction Layers**: Storage interface for database operations and custom auth manager for token refresh.
-   **UI/UX**: Utilizes shadcn/ui and Tailwind CSS for a consistent and accessible design, including comprehensive dark mode support, glass morphism design, backdrop blur effects, and gradient-based visual hierarchy.
-   **Form Management**: React Hook Form with Zod validation for robust form handling.
-   **User Management**: Provides administrators with full CRUD operations for users, including role-based access control (Owner, Administrator, Manager, Employee).
-   **Subscription Management**: Interface for managing subscription plans with upgrade/downgrade options and Stripe integration.
-   **Form Server Architecture**: Single-server architecture for the public form frontend, serving both API routes and the React frontend from a single Express server to eliminate CORS issues and simplify deployment.
-   **Newsletter System**: Integrated CRUD interface for newsletter management with preview, statistics, and multi-tenant isolation.
-   **Theme System**: Comprehensive theme support with 16 predefined themes (modern, neon, nature, luxury, glassmorphism, professional, retro, minimal, aurora, cosmic, elegant, playful, brutalist, pastel-dream, neo-modern, modern-bold) ensuring consistent styling across all form displays.
-   **Email Event Tracking**: Real-time webhook integration with Resend for tracking email lifecycle events (sent, delivered, opened, clicked, bounced, failed, complained, delivery_delayed, scheduled) with comprehensive event storage and monitoring capabilities.

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
-   **Temporal**: For workflow orchestration in the Go email tracking microservice.
```
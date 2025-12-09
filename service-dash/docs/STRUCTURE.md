# Project Structure

## Overview

```
service-dash/
├── frontend/           # Next.js frontend application
├── backend/            # Node.js Express backend API
├── docs/              # Documentation
└── internal-reference/ # Internal reference materials (not in git)
```

## Frontend Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   │   └── auth/       # NextAuth.js endpoints
│   │   ├── dashboard/      # Dashboard pages
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   │   ├── dashboard/      # Dashboard-specific components
│   │   └── ui/            # shadcn/ui components
│   └── lib/               # Utility functions
│       ├── auth.ts        # NextAuth configuration
│       └── utils.ts       # Helper utilities
├── public/                # Static assets
│   ├── next-reason-logo.png
│   └── favicon.ico
├── .env.local.example     # Environment variables template
└── package.json
```

## Backend Structure

```
backend/
├── src/
│   ├── index.ts           # Express server entry point
│   ├── routes/            # API route handlers
│   │   ├── customers.ts   # Customer management
│   │   ├── users.ts       # User endpoints
│   │   └── invites.ts     # Invite management
│   ├── middleware/        # Express middleware
│   │   └── auth.ts        # Authentication middleware
│   └── utils/             # Utility functions
├── prisma/
│   └── schema.prisma      # Database schema
├── .env.example           # Environment variables template
├── tsconfig.json          # TypeScript configuration
└── package.json
```

## Database Schema

### User Model
- Stores user information from OIDC provider
- Linked to multiple customers via CustomerUser

### Customer Model
- Represents an organization/tenant
- Has a unique slug for identification

### CustomerUser Model
- Junction table linking Users to Customers
- Includes role (ADMIN/MEMBER) per customer

### Invite Model
- Stores pending invitations
- Can be accepted or declined by users

## Key Components

### Frontend

#### Dashboard Layout (`src/app/dashboard/layout.tsx`)
- Main layout wrapper for dashboard pages
- Handles authentication state
- Manages customer switching

#### Sidebar (`src/components/dashboard/sidebar.tsx`)
- Navigation menu
- Branding display

#### Header (`src/components/dashboard/header.tsx`)
- Customer switcher
- User profile menu
- Notifications

#### Customer Switcher (`src/components/dashboard/customer-switcher.tsx`)
- Dropdown for switching between customers
- Shows current customer and role

### Backend

#### Authentication Middleware (`src/middleware/auth.ts`)
- Validates OIDC tokens
- Extracts user information
- Checks permissions

#### API Routes
- `/api/customers` - Customer management
- `/api/users` - User information
- `/api/invites` - Invitation system

## Authentication Flow

1. User clicks "Sign In"
2. Redirected to OIDC provider
3. After authentication, redirected back with access token
4. Frontend stores token in session
5. All API requests include token in Authorization header
6. Backend validates token and checks permissions

## Multi-Tenant Architecture

### Customer Isolation
- Each customer has separate data
- Users can belong to multiple customers
- Role-based access control per customer

### Permission Checking
1. Frontend sends access token to backend
2. Backend validates token and extracts user ID
3. Backend checks CustomerUser table for permissions
4. Action is allowed or denied based on role

## Development Workflow

1. Start PostgreSQL database
2. Run backend migrations: `npm run prisma:migrate`
3. Start backend: `npm run dev` (in backend directory)
4. Start frontend: `npm run dev` (in frontend directory)
5. Access application at `http://localhost:3000`


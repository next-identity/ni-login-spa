# Next Reason Service Dash

A modern, multi-tenant dashboard application built with Next.js and Node.js.

![Next Reason Logo](./internal-reference/logos/Next%20Reason_Primary_Black.png)

## Features

- 🔐 **OIDC Authentication** - Secure authentication via any OIDC-compliant identity provider
- 👥 **Multi-Tenant Architecture** - Users can belong to multiple customers with different roles
- 🔑 **Role-Based Access Control** - Admin and Member roles per customer
- 🎨 **Modern UI** - Built with Next.js, shadcn/ui, and Tailwind CSS
- 🚀 **RESTful API** - Node.js/Express backend with PostgreSQL
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- OIDC-compliant identity provider (e.g., Auth0, Keycloak, Okta)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd service-dash
```

2. **Install dependencies**

```bash
npm run install:all
```

3. **Configure environment variables**

Create `.env` files in both `frontend` and `backend` directories. See `.env.example` files for required variables.

4. **Set up the database**

```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
```

5. **Start the application**

From the root directory:

```bash
npm run dev
```

This will start both frontend (http://localhost:3000) and backend (http://localhost:3001) servers.

## Documentation

Detailed documentation is available in the [docs](./docs) directory:

- [Setup Guide](./docs/SETUP.md) - Installation and configuration
- [Project Structure](./docs/STRUCTURE.md) - Architecture and code organization
- [API Documentation](./docs/README.md) - Overview and features

## Project Structure

```
service-dash/
├── frontend/           # Next.js frontend application
├── backend/            # Node.js Express backend API
├── docs/              # Documentation
└── package.json       # Root package with convenience scripts
```

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **Authentication**: NextAuth.js with OIDC
- **Language**: TypeScript

### Backend
- **Runtime**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: OIDC token validation with JWT
- **Language**: TypeScript

## Development

### Running Frontend Only

```bash
cd frontend
npm run dev
```

### Running Backend Only

```bash
cd backend
npm run dev
```

### Database Management

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Create and run migrations
npm run prisma:migrate

# Open Prisma Studio (GUI)
npm run prisma:studio
```

## User Flows

### First-Time User

1. Sign in with OIDC provider
2. Create a new customer (automatically assigned as Admin)
3. Access the dashboard

### Inviting Users

1. Navigate to Users page (as Admin)
2. Enter user email and role
3. User receives invite upon next sign-in
4. User can accept or decline invite

### Customer Switching

Users belonging to multiple customers can switch between them using the customer dropdown in the header. The selected customer determines data access and permissions.

## Roles

- **Admin**: Can invite users, manage customer settings, view users page, and access all features
- **Read-Only**: Can access and view dashboard features only (cannot invite users or manage settings)

## License

ISC

## Support

For issues and questions, please refer to the documentation in the `docs` directory.


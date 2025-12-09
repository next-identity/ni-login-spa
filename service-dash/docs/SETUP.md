# Setup Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- OIDC-compliant identity provider (e.g., Auth0, Keycloak, Okta)

## Installation

### 1. Clone the repository and install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

#### Backend Configuration

Create a `.env` file in the `backend` directory based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/servicedash?schema=public"

# Server
PORT=3001

# OIDC Configuration
OIDC_ISSUER_URL="https://your-idp.com"
OIDC_CLIENT_ID="your-client-id"
OIDC_CLIENT_SECRET="your-client-secret"
OIDC_AUDIENCE="your-api-audience"

# JWT
JWT_SECRET="your-jwt-secret-change-this-in-production"
```

#### Frontend Configuration

Create a `.env.local` file in the `frontend` directory based on `.env.local.example`:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production

# OIDC Provider Configuration
OIDC_ISSUER_URL=https://your-idp.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Set up the Database

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view/edit data
npm run prisma:studio
```

### 4. Configure your OIDC Provider

1. Create an application in your OIDC provider
2. Set the redirect URL to: `http://localhost:3000/api/auth/callback/oidc`
3. Configure the allowed scopes: `openid`, `email`, `profile`
4. Note down your Client ID and Client Secret

## Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

The backend API will be available at `http://localhost:3001`

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`

## First Time User Flow

1. Navigate to `http://localhost:3000`
2. Click "Sign In" and authenticate with your OIDC provider
3. After authentication, you'll be prompted to create a new customer
4. Enter a customer name and slug
5. You'll be assigned as an Admin of that customer

## User Management

### Inviting Users

As an Admin, you can invite users to your customer:

1. Navigate to the Users page
2. Click "Invite User"
3. Enter the user's email address
4. Select their role (Admin or Member)
5. The invite will be created and the user can accept it upon sign-in

### Accepting Invites

When a user signs in and has pending invites:

1. They'll see a notification about pending invites
2. They can accept or decline each invite
3. Upon acceptance, they'll be added to the customer with the specified role

## Multi-Tenant Features

### Customer Switching

Users who belong to multiple customers can switch between them using the customer dropdown in the header. The selected customer determines:

- What data they can access
- What actions they can perform
- Their role and permissions

### Roles

- **Admin**: Can invite users, manage customer settings, and perform all actions
- **Member**: Can view and use the dashboard features

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check the DATABASE_URL in your `.env` file
- Verify the database exists and migrations have been run

### Authentication Issues

- Verify OIDC provider configuration
- Check that redirect URLs are correctly configured
- Ensure Client ID and Secret are correct

### API Connection Issues

- Verify the backend is running on port 3001
- Check NEXT_PUBLIC_API_URL in `.env.local`
- Ensure CORS is properly configured

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [shadcn/ui Documentation](https://ui.shadcn.com)


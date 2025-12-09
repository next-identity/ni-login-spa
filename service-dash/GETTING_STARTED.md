# Getting Started with Next Reason Service Dash

## What Has Been Built

I've created a comprehensive, production-ready dashboard application with the following features:

### ✅ Complete Architecture
- **Frontend**: Next.js 15 with TypeScript, shadcn/ui components, and Tailwind CSS
- **Backend**: Node.js/Express with TypeScript and Prisma ORM
- **Database**: PostgreSQL with complete schema for multi-tenant architecture
- **Authentication**: OIDC integration using NextAuth.js

### ✅ Key Features Implemented

1. **OIDC Authentication**
   - Any OIDC provider can be configured (Auth0, Keycloak, Okta, etc.)
   - Secure token validation on backend API
   - Session management with NextAuth.js

2. **Multi-Tenant Customer Management**
   - Users can belong to multiple customers
   - Role-based access control (Admin/Member) per customer
   - Customer switching dropdown in header
   - Clear indication of current customer and role

3. **User & Invite System**
   - Admins can invite users to their customers
   - Pending invites tracked in database
   - Users can accept/decline invites
   - New users prompted to create customer (assigned as Admin)

4. **Dashboard UI**
   - Modern, responsive design matching the shadcn reference
   - Sidebar navigation with branding
   - Header with customer switcher and user menu
   - Dashboard page with stats cards
   - All components styled with shadcn/ui

5. **API Backend**
   - RESTful API with proper authentication middleware
   - Endpoints for customers, users, and invites
   - Permission checking based on customer roles
   - OIDC access token validation

6. **Branding**
   - Next Reason logo in sidebar and pages
   - "Service Dash" text underneath logo
   - Square logo as favicon
   - Consistent branding throughout

### 📁 Project Structure

```
service-dash/
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/          # Pages and layouts
│   │   ├── components/   # React components (UI & dashboard)
│   │   └── lib/          # Utilities and auth config
│   └── public/           # Static assets (logo, favicon)
├── backend/              # Express API server
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth middleware
│   │   └── index.ts      # Server entry
│   └── prisma/           # Database schema
├── docs/                 # Comprehensive documentation
└── internal-reference/   # Excluded from git
```

## Quick Start Steps

### 1. Install Dependencies

```bash
# From root directory
npm run install:all
```

### 2. Configure Your OIDC Provider

Set up an application in your OIDC provider (Auth0, Keycloak, etc.) with:
- **Redirect URI**: `http://localhost:3000/api/auth/callback/oidc`
- **Scopes**: `openid`, `email`, `profile`
- Note your Client ID, Client Secret, and Issuer URL

### 3. Configure Environment Variables

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/servicedash?schema=public"
PORT=3001
OIDC_ISSUER_URL="https://your-idp.com"
OIDC_CLIENT_ID="your-client-id"
OIDC_CLIENT_SECRET="your-client-secret"
OIDC_AUDIENCE="your-api-audience"
JWT_SECRET="your-secret-key"
```

**Frontend** (`frontend/.env.local`):
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
OIDC_ISSUER_URL=https://your-idp.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Set Up Database

**Important:** You need PostgreSQL installed and running. Update your `backend/.env` with actual credentials:

```env
# Replace with your actual PostgreSQL credentials
# Common options:
# PostgreSQL superuser (macOS): postgresql://postgres:@localhost:5432/servicedash?schema=public
# Your macOS user: postgresql://nathanszytel:@localhost:5432/servicedash?schema=public
# Custom user: postgresql://servicedash_user:password@localhost:5432/servicedash?schema=public
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/servicedash?schema=public"
```

Then run:

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Run migrations (creates database and tables)
npm run prisma:migrate
```

**If you get permission errors**, see the "Database Setup Help" section below.

### 5. Start the Application

From root directory:
```bash
npm run dev
```

This starts both:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## First Use

1. Navigate to http://localhost:3000
2. Click "Sign In"
3. Authenticate with your OIDC provider
4. Create your first customer (you'll be the Admin)
5. Start using the dashboard!

## User Flows

### Creating a Customer
- First-time users are prompted to create a customer
- They are automatically assigned the Admin role

### Inviting Users (Admin Only)
1. Go to Users page
2. Enter email and select role
3. Invite is created with PENDING status
4. User sees invite on next sign-in

### Accepting Invites
- Users with pending invites see notification
- Can accept or decline each invite
- Accepting adds them to the customer with specified role

### Switching Customers
- Use dropdown in header
- Shows all customers you belong to
- Clearly indicates current customer and your role

## Architecture Highlights

### Multi-Tenant Design
- Each customer is isolated
- Users can belong to multiple customers
- Roles are per-customer (not global)
- Customer context determines data access

### Authentication Flow
1. User signs in via OIDC provider
2. Frontend receives access token
3. Token included in all API requests
4. Backend validates token and checks permissions

### API Authorization
- All endpoints require valid OIDC access token
- Backend checks user's role for requested customer
- Actions allowed/denied based on role (Admin/Member)

## Database Schema

### Models
- **User**: Stores user info from IDP
- **Customer**: Organization/tenant entity
- **CustomerUser**: Junction table (user ↔ customer + role)
- **Invite**: Pending/accepted/declined invitations

### Roles
- **ADMIN**: Can invite users and manage customer
- **MEMBER**: Can access dashboard features

## Next Steps

### Immediate
1. Set up your OIDC provider
2. Configure environment variables
3. Run database migrations
4. Start the application

### Development
1. Add more dashboard pages (Users, Analytics, etc.)
2. Implement customer settings page
3. Add real-time features if needed
4. Enhance API with more endpoints

### Production
1. Set up production database
2. Configure production OIDC app
3. Update environment variables
4. Deploy frontend and backend
5. Set up monitoring and logging

## Documentation

- **README.md**: Project overview
- **docs/SETUP.md**: Detailed setup instructions
- **docs/STRUCTURE.md**: Architecture and code organization
- **docs/USER_FLOWS.md**: Complete user journey and flow diagrams
- **docs/README.md**: Features and documentation index

## Database Setup Help

### Finding Your PostgreSQL Credentials

The `user:password` in the DATABASE_URL are placeholders. Replace them with your actual credentials.

**Try these common defaults:**

```bash
# Test connection as postgres user
psql -U postgres -d postgres

# Test connection as your macOS username
psql postgres

# List all database users
psql postgres -c "\du"
```

### Option 1: Use Default Superuser (Easiest for Development)

```env
# No password (most common on macOS)
DATABASE_URL="postgresql://postgres:@localhost:5432/servicedash?schema=public"

# Or your macOS username
DATABASE_URL="postgresql://nathanszytel:@localhost:5432/servicedash?schema=public"
```

### Option 2: Create Dedicated User (Recommended for Production)

```bash
# Connect to PostgreSQL
psql postgres

# Create user and database
CREATE USER servicedash_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE servicedash OWNER servicedash_user;
GRANT ALL PRIVILEGES ON DATABASE servicedash TO servicedash_user;
\q
```

Then use:
```env
DATABASE_URL="postgresql://servicedash_user:your_secure_password@localhost:5432/servicedash?schema=public"
```

### Installing PostgreSQL (if not installed)

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
# Default user is your macOS username with no password
```

**macOS (Postgres.app):**
- Download from https://postgresapp.com/
- Default user is your macOS username with no password

## Support

All code is well-documented and follows best practices:
- TypeScript for type safety
- Clean component structure
- Proper error handling
- Security best practices
- RESTful API design

## Notes

- **No Docker Required**: Everything runs via npm scripts
- **Internal Reference**: The `internal-reference` folder is excluded from git
- **Convenience Scripts**: Root `package.json` has scripts to run both frontend and backend
- **Database**: Uses PostgreSQL (ensure it's installed and running)

---

**You're all set!** Follow the Quick Start steps above to get your dashboard running.


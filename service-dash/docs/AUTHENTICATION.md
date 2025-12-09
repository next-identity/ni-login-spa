# Authentication Guide

## Overview

Next Reason Service Dash uses **NextAuth.js v5** (Auth.js) with OIDC (OpenID Connect) for authentication. This allows integration with any OIDC-compliant identity provider.

## Supported OIDC Providers

- Auth0
- Keycloak
- Okta
- Azure AD / Entra ID
- Google
- GitHub
- GitLab
- Any custom OIDC provider

## Configuration

### Frontend Configuration

In `frontend/.env.local`:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-in-production

# OIDC Provider
OIDC_ISSUER_URL=https://your-idp.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend Configuration

In `backend/.env`:

```env
# OIDC Configuration
OIDC_ISSUER_URL=https://your-idp.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_AUDIENCE=your-api-audience

# JWT Secret
JWT_SECRET=your-jwt-secret
```

## Provider-Specific Setup

### Auth0

1. Create an application in Auth0 Dashboard
2. Set Application Type to "Regular Web Application"
3. Configure:
   - **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback/oidc`
   - **Allowed Logout URLs**: `http://localhost:3000`
4. Get credentials:
   - OIDC_ISSUER_URL: `https://YOUR_DOMAIN.auth0.com`
   - OIDC_CLIENT_ID: Your Client ID
   - OIDC_CLIENT_SECRET: Your Client Secret
   - OIDC_AUDIENCE: Your API Identifier

### Keycloak

1. Create a client in your Keycloak realm
2. Configure:
   - **Client Protocol**: openid-connect
   - **Access Type**: confidential
   - **Valid Redirect URIs**: `http://localhost:3000/api/auth/callback/oidc`
3. Get credentials:
   - OIDC_ISSUER_URL: `https://YOUR_DOMAIN/realms/YOUR_REALM`
   - OIDC_CLIENT_ID: Your Client ID
   - OIDC_CLIENT_SECRET: From Credentials tab
   - OIDC_AUDIENCE: Your Client ID

### Okta

1. Create an application in Okta
2. Set Application type to "Web"
3. Configure:
   - **Sign-in redirect URIs**: `http://localhost:3000/api/auth/callback/oidc`
   - **Sign-out redirect URIs**: `http://localhost:3000`
4. Get credentials:
   - OIDC_ISSUER_URL: `https://YOUR_DOMAIN.okta.com/oauth2/default`
   - OIDC_CLIENT_ID: Your Client ID
   - OIDC_CLIENT_SECRET: Your Client Secret
   - OIDC_AUDIENCE: `api://default`

## How It Works

### Frontend Flow

1. **User clicks "Sign In"**
   - Redirects to `/api/auth/signin/oidc`
   - NextAuth redirects to OIDC provider

2. **User authenticates with IDP**
   - User logs in at their identity provider
   - IDP redirects back with authorization code

3. **NextAuth processes callback**
   - Exchanges code for tokens (access_token, id_token)
   - Creates session with user info
   - Stores access token for API calls

4. **User is redirected to callback page**
   - `/auth/callback` checks user status
   - Routes to appropriate page (invites/onboarding/dashboard)

### Backend Flow

1. **API receives request with Authorization header**
   ```
   Authorization: Bearer <access_token>
   ```

2. **Middleware validates token**
   - Fetches JWKS from IDP
   - Verifies token signature
   - Checks issuer and audience
   - Extracts user claims (sub, email, name)

3. **User lookup/creation**
   - Uses `sub` (subject) as unique identifier
   - Creates user if doesn't exist
   - Returns user data

4. **Permission checking**
   - Looks up user's CustomerUser records
   - Verifies user has access to requested customer
   - Checks role for authorization

## Token Flow

```
┌─────────┐         ┌──────────┐         ┌──────────┐
│ Browser │         │ Frontend │         │  Backend │
│         │         │ NextAuth │         │   API    │
└────┬────┘         └────┬─────┘         └────┬─────┘
     │                   │                     │
     │  1. Sign In       │                     │
     ├──────────────────>│                     │
     │                   │                     │
     │  2. Redirect to   │                     │
     │     IDP           │                     │
     │<──────────────────┤                     │
     │                   │                     │
     │  3. Authenticate  │                     │
     │  at IDP           │                     │
     │                   │                     │
     │  4. Callback with │                     │
     │     auth code     │                     │
     ├──────────────────>│                     │
     │                   │                     │
     │                   │  5. Exchange code   │
     │                   │     for tokens      │
     │                   │     (with IDP)      │
     │                   │                     │
     │  6. Session with  │                     │
     │     access_token  │                     │
     │<──────────────────┤                     │
     │                   │                     │
     │  7. API Request   │                     │
     │  with token       │                     │
     ├─────────────────────────────────────────>│
     │                   │                     │
     │                   │  8. Validate token  │
     │                   │     with JWKS       │
     │                   │     (from IDP)      │
     │                   │                     │
     │  9. Response      │                     │
     │<─────────────────────────────────────────┤
     │                   │                     │
```

## Session Management

### Session Structure

```typescript
{
  user: {
    id: string;      // IDP subject ID
    name: string;
    email: string;
    image?: string;
  },
  accessToken: string;  // For backend API calls
  idToken: string;      // OpenID Connect ID token
  expires: string;
}
```

### Accessing Session

```typescript
// In client components
import { useSession } from "next-auth/react";

function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return <div>Not signed in</div>;
  
  return <div>Hello {session?.user?.name}</div>;
}
```

```typescript
// In server components
import { auth } from "@/lib/auth";

async function MyServerComponent() {
  const session = await auth();
  
  if (!session) return <div>Not signed in</div>;
  
  return <div>Hello {session.user?.name}</div>;
}
```

### Making Authenticated API Calls

```typescript
import { useSession } from "next-auth/react";

function MyComponent() {
  const { data: session } = useSession();
  
  const fetchData = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/endpoint`,
      {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      }
    );
    
    return response.json();
  };
}
```

## Security Features

### Token Validation

The backend validates every request:

1. **Signature verification**: Uses JWKS from IDP
2. **Issuer check**: Ensures token from correct IDP
3. **Audience check**: Verifies token intended for this API
4. **Expiration check**: Rejects expired tokens

### Rate Limiting

JWKS endpoint has caching and rate limiting:
- **Cache**: 10 minutes
- **Rate limit**: 100 requests/minute (development)
- **Cache entries**: 5 maximum

For production, adjust in `backend/src/middleware/auth.ts`:

```typescript
jwksRequestsPerMinute: 10,  // Lower for production
cacheMaxAge: 3600000,        // 1 hour cache
```

### CORS Configuration

Backend allows requests from frontend origin. Update for production:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
```

## Troubleshooting

### "Too many requests to JWKS endpoint"

**Fixed!** The rate limit has been increased to 100 requests/minute and caching improved.

If you still see this error:
1. Restart the backend server
2. Check OIDC_ISSUER_URL is correct
3. Verify JWKS endpoint exists: `{ISSUER}/.well-known/jwks.json`

### "Invalid token" or "Unauthorized"

1. Check token in browser DevTools Network tab
2. Verify OIDC_AUDIENCE matches your IDP configuration
3. Ensure OIDC_ISSUER_URL is exact (no trailing slash)
4. Check IDP allows the redirect URI

### "User not found" after authentication

The backend automatically creates users, but if you see this:
1. Check database connection
2. Verify Prisma migrations ran successfully
3. Check backend logs for errors

### Session not persisting

1. Verify NEXTAUTH_SECRET is set
2. Check cookies are enabled in browser
3. Ensure NEXTAUTH_URL matches your domain

## Development vs Production

### Development Settings

```env
# Frontend
NEXTAUTH_URL=http://localhost:3000

# Backend
OIDC_ISSUER_URL=https://dev-idp.com
```

### Production Settings

```env
# Frontend
NEXTAUTH_URL=https://yourdomain.com

# Backend  
OIDC_ISSUER_URL=https://prod-idp.com
```

**Important:** Always use HTTPS in production!

## Testing Authentication Locally

### 1. Set up a test OIDC provider

Use Auth0 free tier for testing:
1. Sign up at https://auth0.com
2. Create a new application
3. Get your credentials
4. Configure redirect URLs

### 2. Update environment variables

Copy credentials to your `.env` files

### 3. Test the flow

1. Start backend: `npm run dev` (in backend/)
2. Start frontend: `npm run dev` (in frontend/)
3. Navigate to http://localhost:3000
4. Click "Sign In"
5. Complete OIDC flow

### 4. Verify

- Check user created in database
- Check session in DevTools
- Verify API calls include token
- Test customer creation

## Advanced Configuration

### Custom Claims

To add custom claims from your IDP:

```typescript
// In frontend/src/lib/auth.ts
async jwt({ token, account, profile }) {
  if (profile) {
    token.customClaim = profile.customClaim;
  }
  return token;
}
```

### Token Refresh

NextAuth v5 handles token refresh automatically if your IDP provides refresh tokens. Enable in provider config:

```typescript
authorization: {
  params: {
    scope: "openid email profile offline_access"
  }
}
```

### Custom Redirect Logic

Modify redirect callback in `frontend/src/lib/auth.ts`:

```typescript
async redirect({ url, baseUrl }) {
  // Custom logic here
  return `${baseUrl}/your-page`;
}
```

## API Endpoints

### Frontend (NextAuth)

- `GET/POST /api/auth/signin/oidc` - Initiate sign in
- `GET /api/auth/callback/oidc` - Handle IDP callback
- `GET /api/auth/session` - Get current session
- `GET /api/auth/signout` - Sign out
- `GET /api/auth/csrf` - CSRF token

### Backend

All API endpoints require `Authorization: Bearer <access_token>` header.

- `GET /api/users/me` - Get/create current user
- `GET /api/customers/my-customers` - List user's customers
- `POST /api/customers` - Create customer
- `GET /api/invites/pending` - Get pending invites
- `POST /api/invites` - Create invite (admin only)
- `POST /api/invites/:id/accept` - Accept invite
- `POST /api/invites/:id/decline` - Decline invite


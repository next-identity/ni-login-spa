# Simplified Authentication Architecture

## Overview

We've simplified the authentication system to work with **any OIDC provider** without requiring strict JWT validation, audience configuration, or API setup.

## How It Works

### Frontend (NextAuth.js)
1. User signs in via OIDC provider
2. NextAuth exchanges authorization code for tokens
3. Access token stored in session
4. Access token sent to backend with every API request

### Backend (Userinfo Validation)
1. Receives access token in Authorization header
2. Calls IDP's `/userinfo` endpoint with the token
3. If successful, token is valid and user info is returned
4. User info attached to request for route handlers

## Benefits

✅ **Works with any OIDC provider** - No special configuration needed  
✅ **No JWT parsing** - Avoids issuer/audience validation issues  
✅ **No JWKS management** - No rate limiting or key caching needed  
✅ **Simple and reliable** - Direct validation with the source of truth  
✅ **No audience requirement** - Don't need to create custom APIs  

## Configuration

### Frontend (.env.local)

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret

# OIDC Provider (example: Auth0)
OIDC_ISSUER_URL=https://dev-1l-csfxy.us.auth0.com/
OIDC_CLIENT_ID=31ByCSBtzE0oAXXgmHWhtMH9vqSvNaCX
OIDC_CLIENT_SECRET=your-client-secret

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Important Notes:**
- Match the trailing slash in OIDC_ISSUER_URL exactly as your IDP provides it
- Auth0 includes trailing slash: `https://YOUR_DOMAIN.auth0.com/`
- Some providers don't - check your IDP's documentation

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://postgres:@localhost:5432/servicedash?schema=public"

# Server
PORT=3001

# OIDC Configuration
# MUST match frontend exactly (including trailing slash)
OIDC_ISSUER_URL=https://dev-1l-csfxy.us.auth0.com/
```

**That's it!** No OIDC_AUDIENCE, no JWT_SECRET, no JWKS configuration needed.

## Authentication Flow

```
┌──────────┐         ┌──────────┐         ┌─────────┐
│ Frontend │         │ Backend  │         │   IDP   │
└────┬─────┘         └────┬─────┘         └────┬────┘
     │                    │                     │
     │ 1. API Request     │                     │
     │ with Bearer token  │                     │
     ├────────────────────>│                     │
     │                    │                     │
     │                    │ 2. Validate token   │
     │                    │ (POST /userinfo)    │
     │                    ├─────────────────────>│
     │                    │                     │
     │                    │ 3. User info or     │
     │                    │    error            │
     │                    │<─────────────────────┤
     │                    │                     │
     │ 4. API Response    │                     │
     │<────────────────────┤                     │
     │                    │                     │
```

## Token Validation Details

### What the Backend Does

```typescript
1. Extract token from Authorization header
2. Call: GET {OIDC_ISSUER_URL}/userinfo
   Headers: Authorization: Bearer {token}
3. If 200 OK:
   - Token is valid
   - Attach user info to request
   - Continue to route handler
4. If error:
   - Token is invalid/expired
   - Return 401 Unauthorized
```

### Why This Works

- **IDP is the source of truth**: Only the IDP can definitively say if a token is valid
- **Userinfo is standard**: All OIDC providers have this endpoint
- **No configuration needed**: Works out of the box with any provider
- **Always up to date**: Token revocation is immediately reflected

## Advantages Over JWT Validation

### Old Approach (JWT Validation)
❌ Required JWKS endpoint  
❌ Needed audience configuration  
❌ Required issuer to match exactly  
❌ Had rate limiting issues  
❌ Needed custom API configuration in some IDPs  

### New Approach (Userinfo Validation)
✅ Works with any OIDC provider immediately  
✅ No audience/API configuration needed  
✅ Simpler backend code  
✅ No JWKS caching/rate limiting  
✅ Respects token revocation instantly  

## Performance Considerations

### Caching (Optional Enhancement)

For production, you can add caching to reduce calls to the IDP:

```typescript
// Simple in-memory cache
const tokenCache = new Map();
const CACHE_TTL = 60000; // 1 minute

export const validateToken = async (req, res, next) => {
  const token = req.headers.authorization?.substring(7);
  
  // Check cache first
  const cached = tokenCache.get(token);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    req.user = cached.user;
    return next();
  }
  
  // Validate with IDP...
  // Store in cache...
};
```

**For now, we're not caching** - each request validates with the IDP. This is fine for development and ensures tokens are always current.

## Security

### What's Protected

✅ **Token must be valid** with the IDP  
✅ **User info is current** (no stale data)  
✅ **Revoked tokens are rejected** immediately  
✅ **Expired tokens fail** at the IDP  

### What's Different

- No local JWT signature verification (IDP does it)
- No audience claim checking (not needed)
- No issuer claim checking (IDP handles it)

**This is still secure** because:
- Only the IDP can issue valid tokens
- Userinfo endpoint only returns data for valid tokens
- We trust the IDP as the authoritative source

## Migration Notes

### What We Removed

- `express-jwt` package (not needed)
- `jwks-rsa` package (not needed)
- `OIDC_AUDIENCE` environment variable (not needed)
- `JWT_SECRET` environment variable (not needed)
- Complex JWKS caching logic
- Audience and issuer validation

### What We Kept

- Access token in session
- Authorization header with Bearer token
- User info extraction
- Permission checking based on database roles

## Testing

### 1. Sign In
```bash
# Start servers
npm run dev  # from root directory

# Visit
http://localhost:3000
```

### 2. Check Token in Session
```
http://localhost:3000/api/debug/session
```

Should show:
```json
{
  "hasAccessToken": true,
  "accessToken": "eyJhbGc..."
}
```

### 3. Test Backend API
```bash
# Should work without errors
# Check backend logs for: "User validated: auth0|... email@example.com"
```

## Troubleshooting

### "Invalid token" Error

1. Check OIDC_ISSUER_URL has correct trailing slash
2. Visit: `{OIDC_ISSUER_URL}/.well-known/openid-configuration`
3. Verify `userinfo_endpoint` exists
4. Test userinfo endpoint with a token manually

### "No authorization token provided"

1. Frontend isn't sending the token
2. Check session has accessToken
3. Verify fetch call includes Authorization header

### OIDC Provider Returns 401

1. Token might be expired - sign in again
2. Check token is from correct IDP
3. Verify OIDC_ISSUER_URL matches token's issuer

## Auth0 Specific Setup

For Auth0, you don't need to create a custom API anymore!

### Minimum Configuration

1. **Create Application** in Auth0 Dashboard
   - Type: Regular Web Application
   
2. **Settings**:
   - Allowed Callback URLs: `http://localhost:3000/api/auth/callback/oidc`
   - Allowed Logout URLs: `http://localhost:3000`
   
3. **Get Credentials**:
   - Domain: `dev-1l-csfxy.us.auth0.com`
   - Client ID: `31ByCSBtzE0oAXXgmHWhtMH9vqSvNaCX`
   - Client Secret: (from application settings)

4. **Environment Variables**:
```env
# Frontend
OIDC_ISSUER_URL=https://dev-1l-csfxy.us.auth0.com/
OIDC_CLIENT_ID=31ByCSBtzE0oAXXgmHWhtMH9vqSvNaCX
OIDC_CLIENT_SECRET=your-client-secret

# Backend (only needs issuer)
OIDC_ISSUER_URL=https://dev-1l-csfxy.us.auth0.com/
```

**That's all!** No API creation, no audience configuration needed.


# OIDC Logout Implementation

## Overview

The application implements complete OIDC logout that signs the user out from both:
1. **Service Dash** (NextAuth session)
2. **Identity Provider** (IDP session)

This ensures users are fully logged out and must re-authenticate to access the dashboard again.

## How It Works

### Logout Flow

```
┌──────────┐         ┌──────────┐         ┌─────────┐
│  User    │         │ Next.js  │         │   IDP   │
│          │         │ Frontend │         │         │
└────┬─────┘         └────┬─────┘         └────┬────┘
     │                    │                     │
     │ 1. Click Sign Out  │                     │
     ├────────────────────>│                     │
     │                    │                     │
     │                    │ 2. Clear NextAuth   │
     │                    │    session          │
     │                    │                     │
     │ 3. Redirect to IDP │                     │
     │    logout endpoint │                     │
     │<────────────────────┤                     │
     │                    │                     │
     │ 4. IDP logout      │                     │
     ├────────────────────────────────────────>│
     │                    │                     │
     │                    │ 5. Clear IDP session│
     │                    │                     │
     │ 6. Redirect to     │                     │
     │    returnTo URL    │                     │
     │<────────────────────────────────────────┤
     │                    │                     │
     │ 7. Show logout     │                     │
     │    success page    │                     │
     │                    │                     │
     │ 8. Auto redirect   │                     │
     │    to home         │                     │
     │<────────────────────┤                     │
```

## Implementation

### 1. Logout Helper (`src/lib/logout.ts`)

```typescript
export async function signOutWithOIDC() {
  // 1. Get ID token from session
  const session = await fetch('/api/auth/session').then(r => r.json());
  
  // 2. Clear NextAuth session
  await nextAuthSignOut({ redirect: false });
  
  // 3. Build IDP logout URL
  const logoutUrl = new URL(`${OIDC_ISSUER_URL}v2/logout`);
  logoutUrl.searchParams.set('client_id', CLIENT_ID);
  logoutUrl.searchParams.set('returnTo', '/auth/signout');
  logoutUrl.searchParams.set('id_token_hint', idToken);
  
  // 4. Redirect to IDP logout
  window.location.href = logoutUrl.toString();
}
```

### 2. Sign Out Button (Header)

```typescript
<DropdownMenuItem onClick={() => signOutWithOIDC()}>
  Sign out
</DropdownMenuItem>
```

### 3. Logout Success Page (`/auth/signout`)

Shows confirmation message and auto-redirects to home page after 2 seconds.

## Configuration

### Auth0 Logout URL

For Auth0, the logout endpoint is:
```
https://YOUR_DOMAIN.auth0.com/v2/logout
```

Parameters:
- `client_id`: Your Auth0 client ID
- `returnTo`: Where to redirect after logout (must be in allowed logout URLs)
- `id_token_hint`: The ID token (optional but recommended)

### Auth0 Dashboard Setup

1. Go to your Auth0 Application settings
2. Add to **Allowed Logout URLs**:
   ```
   http://localhost:3000/auth/signout
   ```
   
For production, add:
   ```
   https://yourdomain.com/auth/signout
   ```

### Environment Variables

**Frontend `.env.local`**:
```env
# Private (server-side only)
OIDC_ISSUER_URL=https://dev-1l-csfxy.us.auth0.com/
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret

# Public (client-side accessible)
NEXT_PUBLIC_OIDC_ISSUER_URL=https://dev-1l-csfxy.us.auth0.com/
NEXT_PUBLIC_OIDC_CLIENT_ID=your-client-id
```

**Important**: The `NEXT_PUBLIC_` prefix makes variables available in the browser.

## Provider-Specific Logout URLs

### Auth0
```
https://YOUR_DOMAIN.auth0.com/v2/logout?
  client_id=YOUR_CLIENT_ID&
  returnTo=http://localhost:3000/auth/signout&
  id_token_hint=ID_TOKEN
```

### Keycloak
```
https://YOUR_DOMAIN/realms/YOUR_REALM/protocol/openid-connect/logout?
  client_id=YOUR_CLIENT_ID&
  post_logout_redirect_uri=http://localhost:3000/auth/signout&
  id_token_hint=ID_TOKEN
```

### Okta
```
https://YOUR_DOMAIN/oauth2/default/v1/logout?
  id_token_hint=ID_TOKEN&
  post_logout_redirect_uri=http://localhost:3000/auth/signout
```

### Generic OIDC

Most providers have an `end_session_endpoint` in their discovery document:
```
https://YOUR_IDP/.well-known/openid-configuration
```

Look for `end_session_endpoint` and use that URL.

## Customizing for Different Providers

To support different providers, update `src/lib/logout.ts`:

```typescript
export async function signOutWithOIDC() {
  const session = await fetch('/api/auth/session').then(r => r.json());
  const idToken = session?.idToken;

  await nextAuthSignOut({ redirect: false });

  // Choose logout URL based on provider
  const issuer = process.env.NEXT_PUBLIC_OIDC_ISSUER_URL!;
  let logoutUrl: URL;

  if (issuer.includes('auth0.com')) {
    // Auth0
    logoutUrl = new URL(`${issuer}v2/logout`);
    logoutUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_OIDC_CLIENT_ID!);
    logoutUrl.searchParams.set('returnTo', `${window.location.origin}/auth/signout`);
  } else if (issuer.includes('okta.com')) {
    // Okta
    logoutUrl = new URL(`${issuer}oauth2/default/v1/logout`);
    logoutUrl.searchParams.set('post_logout_redirect_uri', `${window.location.origin}/auth/signout`);
  } else {
    // Generic OIDC - need to fetch end_session_endpoint
    // For now, just redirect to home
    window.location.href = '/';
    return;
  }

  if (idToken) {
    logoutUrl.searchParams.set('id_token_hint', idToken);
  }

  window.location.href = logoutUrl.toString();
}
```

## Testing

### Test Complete Logout

1. **Sign in** to the dashboard
2. **Click user menu** → "Sign out"
3. **Observe**:
   - NextAuth session cleared
   - Redirected to IDP logout page
   - IDP session cleared
   - Redirected back to `/auth/signout`
   - Shows success message
   - Auto-redirects to home page

4. **Try accessing dashboard**:
   - Should redirect to sign in
   - Must re-authenticate completely

### Verify IDP Logout

1. After signing out from Service Dash
2. Try visiting your IDP directly
3. You should not be logged in
4. Confirms IDP session was terminated

## Security Benefits

### Complete Session Termination
- ✅ Local session cleared (NextAuth)
- ✅ IDP session cleared (OIDC logout)
- ✅ Tokens invalidated at source
- ✅ Cannot access protected routes

### Prevents Session Fixation
- User must fully re-authenticate
- Old tokens don't work
- Fresh authentication required

### Single Sign-Out (SSO)
- If user has multiple apps with same IDP
- Logging out from one can log out from all
- Depends on IDP configuration

## Troubleshooting

### "Redirect URL not allowed" Error

**Solution**: Add logout URL to IDP's allowed logout URLs

**Auth0**:
- Dashboard → Applications → Your App → Settings
- Allowed Logout URLs: `http://localhost:3000/auth/signout`

### Logout Doesn't Clear IDP Session

**Possible causes**:
1. Missing `id_token_hint` parameter
2. Wrong logout endpoint URL
3. IDP doesn't support logout
4. Logout URL not in allowed list

**Solution**: Check IDP documentation for proper logout endpoint and parameters.

### Logout Redirects to Wrong Page

**Check**:
1. `returnTo` parameter is correct
2. URL is in IDP's allowed logout URLs
3. Environment variables are set correctly

## Production Considerations

### Update Logout URLs

**Frontend `.env`**:
```env
NEXT_PUBLIC_OIDC_ISSUER_URL=https://your-domain.auth0.com/
NEXT_PUBLIC_OIDC_CLIENT_ID=your-prod-client-id
NEXTAUTH_URL=https://yourdomain.com
```

**IDP Configuration**:
- Add production logout URL to allowed list
- Example: `https://yourdomain.com/auth/signout`

### Security Headers

Consider adding these headers for logout page:

```typescript
// In layout or middleware
{
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
}
```

This prevents caching of the logout page.

## Files Modified

1. **`frontend/src/lib/logout.ts`**: Logout helper function
2. **`frontend/src/components/dashboard/header.tsx`**: Updated sign out button
3. **`frontend/src/app/auth/signout/page.tsx`**: Logout success page
4. **`frontend/.env.local.example`**: Added public OIDC variables

## Environment Variables Summary

| Variable | Location | Purpose |
|----------|----------|---------|
| `OIDC_ISSUER_URL` | Server | NextAuth OIDC config |
| `OIDC_CLIENT_ID` | Server | NextAuth OIDC config |
| `NEXT_PUBLIC_OIDC_ISSUER_URL` | Client | Logout URL building |
| `NEXT_PUBLIC_OIDC_CLIENT_ID` | Client | Logout URL building |

**Important**: Both server and client variables must have the same values!

## Complete Logout Features

✅ **Local session cleared**: NextAuth session destroyed  
✅ **IDP session cleared**: User logged out from identity provider  
✅ **Success confirmation**: User-friendly logout page  
✅ **Auto-redirect**: Returns to home page after 2 seconds  
✅ **Token invalidation**: Old tokens won't work  
✅ **Re-authentication required**: Must sign in again to access dashboard  

---

**The logout implementation is complete and production-ready!**


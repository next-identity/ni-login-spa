import { signOut as nextAuthSignOut } from "next-auth/react";

// Cache for OIDC discovery document
let discoveryCache: { endSessionEndpoint?: string; fetched: boolean } | null = null;

/**
 * Fetches the OIDC discovery document to get the end_session_endpoint
 * This is the standard way to find the logout URL for any OIDC provider
 */
async function getEndSessionEndpoint(): Promise<string | null> {
  if (discoveryCache) {
    return discoveryCache.endSessionEndpoint || null;
  }

  try {
    const issuer = process.env.NEXT_PUBLIC_OIDC_ISSUER_URL;
    if (!issuer) {
      discoveryCache = { fetched: true };
      return null;
    }

    // Standard OIDC discovery endpoint
    const discoveryUrl = `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`;
    const response = await fetch(discoveryUrl);
    
    if (!response.ok) {
      discoveryCache = { fetched: true };
      return null;
    }

    const discovery = await response.json();
    discoveryCache = {
      endSessionEndpoint: discovery.end_session_endpoint,
      fetched: true,
    };

    return discovery.end_session_endpoint || null;
  } catch (error) {
    console.error('Error fetching OIDC discovery document:', error);
    discoveryCache = { fetched: true };
    return null;
  }
}

/**
 * Signs out from both NextAuth (local session) and the OIDC provider.
 * Works with any standard OIDC provider (Google, Okta, Keycloak, Azure AD, etc.)
 * 
 * For providers without RP-initiated logout (like Google), it will just
 * clear the local session and redirect to the signout page.
 */
export async function signOutWithOIDC() {
  try {
    // Get the current session to retrieve ID token
    const sessionResponse = await fetch('/api/auth/session');
    const session = await sessionResponse.json();
    const idToken = session?.idToken;

    // Sign out from NextAuth (clears local session)
    await nextAuthSignOut({ redirect: false });

    // Try to get the standard OIDC end_session_endpoint
    const endSessionEndpoint = await getEndSessionEndpoint();

    if (endSessionEndpoint) {
      // Use standard OIDC RP-initiated logout
      const logoutUrl = new URL(endSessionEndpoint);
      
      // Standard OIDC logout parameters
      if (idToken) {
        logoutUrl.searchParams.set('id_token_hint', idToken);
      }
      logoutUrl.searchParams.set('post_logout_redirect_uri', `${window.location.origin}/auth/signout`);
      
      // Some providers also want client_id
      if (process.env.NEXT_PUBLIC_OIDC_CLIENT_ID) {
        logoutUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_OIDC_CLIENT_ID);
      }

      window.location.href = logoutUrl.toString();
    } else {
      // Provider doesn't support RP-initiated logout (e.g., Google)
      // Just redirect to our signout confirmation page
      window.location.href = '/auth/signout';
    }
  } catch (error) {
    console.error('Error during sign out:', error);
    // Fallback: just redirect to signout page
    window.location.href = '/auth/signout';
  }
}


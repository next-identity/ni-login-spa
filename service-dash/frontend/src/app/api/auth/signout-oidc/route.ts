import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Fetches the OIDC discovery document to get the end_session_endpoint
 * This is the standard way to find the logout URL for any OIDC provider
 */
async function getEndSessionEndpoint(): Promise<string | null> {
  try {
    const issuer = process.env.OIDC_ISSUER_URL;
    if (!issuer) {
      return null;
    }

    // Standard OIDC discovery endpoint
    const discoveryUrl = `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`;
    const response = await fetch(discoveryUrl);
    
    if (!response.ok) {
      return null;
    }

    const discovery = await response.json();
    return discovery.end_session_endpoint || null;
  } catch (error) {
    console.error('Error fetching OIDC discovery document:', error);
    return null;
  }
}

export async function GET() {
  const session = await auth();
  const idToken = (session as any)?.idToken;

  // Try to get the standard OIDC end_session_endpoint from discovery
  const endSessionEndpoint = await getEndSessionEndpoint();

  if (endSessionEndpoint) {
    // Use standard OIDC RP-initiated logout
    const logoutUrl = new URL(endSessionEndpoint);
    
    // Standard OIDC logout parameters
    if (idToken) {
      logoutUrl.searchParams.set('id_token_hint', idToken);
    }
    logoutUrl.searchParams.set('post_logout_redirect_uri', process.env.NEXTAUTH_URL!);
    
    // Some providers also want client_id
    if (process.env.OIDC_CLIENT_ID) {
      logoutUrl.searchParams.set('client_id', process.env.OIDC_CLIENT_ID);
    }

    redirect(logoutUrl.toString());
  } else {
    // Provider doesn't support RP-initiated logout (e.g., Google)
    // Just redirect to our signout page
    redirect('/auth/signout');
  }
}


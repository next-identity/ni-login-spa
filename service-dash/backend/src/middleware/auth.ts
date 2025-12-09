import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email: string;
        name?: string;
        [key: string]: any;
      };
    }
  }
}

// Cache for OIDC discovery document
interface OIDCDiscovery {
  userinfo_endpoint?: string;
  issuer?: string;
}

let discoveryCache: { data: OIDCDiscovery | null; fetchedAt: number } | null = null;
const DISCOVERY_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetches the OIDC discovery document to get the userinfo_endpoint
 * This ensures compatibility with any OIDC provider (Google, Auth0, Okta, etc.)
 */
async function getOIDCDiscovery(): Promise<OIDCDiscovery | null> {
  // Return cached discovery if still valid
  if (discoveryCache && Date.now() - discoveryCache.fetchedAt < DISCOVERY_CACHE_TTL) {
    return discoveryCache.data;
  }

  try {
    const issuer = process.env.OIDC_ISSUER_URL;
    if (!issuer) {
      console.error('OIDC_ISSUER_URL is not configured');
      return null;
    }

    // Standard OIDC discovery endpoint
    const discoveryUrl = `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`;
    const response = await fetch(discoveryUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch OIDC discovery: ${response.status}`);
      discoveryCache = { data: null, fetchedAt: Date.now() };
      return null;
    }

    const discovery = await response.json() as OIDCDiscovery;
    discoveryCache = { data: discovery, fetchedAt: Date.now() };
    console.log('OIDC discovery fetched, userinfo_endpoint:', discovery.userinfo_endpoint);
    
    return discovery;
  } catch (error) {
    console.error('Error fetching OIDC discovery document:', error);
    discoveryCache = { data: null, fetchedAt: Date.now() };
    return null;
  }
}

// Simple token validation using IDP's userinfo endpoint
export const validateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Get the userinfo endpoint from OIDC discovery
    const discovery = await getOIDCDiscovery();
    if (!discovery?.userinfo_endpoint) {
      console.error('Could not determine userinfo endpoint from OIDC discovery');
      return res.status(500).json({ error: 'OIDC configuration error' });
    }

    // Validate token by calling IDP's userinfo endpoint
    const response = await fetch(discovery.userinfo_endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userInfo = await response.json() as any;
    
    // Attach user info to request
    req.user = {
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      ...userInfo,
    };

    next();
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(401).json({ error: 'Token validation failed' });
  }
};

// Middleware to ensure user exists (kept for compatibility)
export const extractUser = async (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Check if user has admin role for a specific customer
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const customerId = req.params.customerId || req.body.customerId;
  
  if (!customerId) {
    return res.status(400).json({ error: 'Customer ID required' });
  }

  // This will be implemented with database check
  // For now, just pass through
  next();
};


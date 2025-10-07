import type { Express, Request, Response, NextFunction } from "express";
import { setupAuth as originalSetupAuth, isAuthenticated as originalIsAuthenticated, checkSessionTimeouts as originalCheckSessionTimeouts } from "../auth";

// Re-export authentication middleware functions for modular use
export const setupAuth = originalSetupAuth;
export const isAuthenticated = originalIsAuthenticated;
export const checkSessionTimeouts = originalCheckSessionTimeouts;

// Enhanced authentication middleware with better error handling
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  originalIsAuthenticated(req, res, (err: any) => {
    if (err) {
      console.error('🔒 [AUTH-MIDDLEWARE] Authentication error:', err);
      return res.status(401).json({ 
        message: "Unauthorized",
        error: "Authentication failed" 
      });
    }
    next();
  });
}

// Session validation middleware
export function validateSession(req: Request, res: Response, next: NextFunction) {
  const session = (req as any).session;
  
  if (!session) {
    return res.status(401).json({ 
      message: "No session found",
      error: "Session required" 
    });
  }
  
  // Check if session is expired or invalid
  if (session.user && session.user.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (session.user.expires_at < now) {
      return res.status(401).json({ 
        message: "Session expired",
        error: "Please login again" 
      });
    }
  }
  
  next();
}

// Role-based access control middleware
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).session?.user || (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
        error: "User not found"
      });
    }

    if (user.role !== role && user.role !== 'superadmin') {
      return res.status(403).json({
        message: "Forbidden",
        error: `Role '${role}' required`
      });
    }

    next();
  };
}

// Convenience middleware for admin role
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole('admin')(req, res, next);
}

// Convenience middleware for superadmin role
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole('superadmin')(req, res, next);
}

// Initialize authentication middleware on Express app
export async function initializeAuth(app: Express) {
  console.log('🔧 [AUTH-MIDDLEWARE] Initializing authentication...');

  try {
    // Setup lightweight session-based authentication
    await setupAuth(app);
    
    // Add session timeout middleware to all API routes
    app.use('/api', checkSessionTimeouts);
    
    console.log('✅ [AUTH-MIDDLEWARE] Authentication initialized successfully');
  } catch (error) {
    console.error('❌ [AUTH-MIDDLEWARE] Failed to initialize authentication:', error);
    throw error;
  }
}
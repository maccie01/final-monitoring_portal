import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { ConnectionPoolManager } from "./connection-pool";

/**
 * Lightweight session-based authentication
 * Uses connection pool for session storage in PostgreSQL
 */

export async function getSession() {
  const sessionTtl = 24 * 60 * 60 * 1000; // 24 hours (milliseconds)
  const sessionTtlSeconds = 24 * 60 * 60; // 24 hours (seconds for PostgreSQL store)
  const pgStore = connectPg(session);

  // Get pool from connection manager
  const pool = ConnectionPoolManager.getInstance().getPool();

  console.log('🔍 [SESSION] Using connection pool for session storage');

  const sessionStore = new pgStore({
    pool: pool,
    tableName: "sessions",
    createTableIfMissing: false,
  });

  // Add error handling for session store
  sessionStore.on('error', (err) => {
    console.error('❌ Session store error:', err);
  });

  console.log('✅ [SESSION] PostgreSQL Session Store initialized with connection pool');

  return session({
    secret: process.env.SESSION_SECRET || 'development-secret-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false, // Don't create session until login
    rolling: true, // Reset expiration on activity
    cookie: {
      httpOnly: true,
      secure: false, // Set true in production with HTTPS
      maxAge: sessionTtl,
      sameSite: 'lax'
    }
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  // Initialize session middleware
  app.use(await getSession());

  console.log('✅ [AUTH] Lightweight session authentication initialized');
}

/**
 * Check if request has valid authenticated session
 */
export const isAuthenticated: RequestHandler = (req, res, next) => {
  const sessionUser = (req.session as any)?.user;

  // Debug logging
  console.log('🔍 [AUTH] Checking authentication for:', req.path);

  if (!sessionUser) {
    console.log('❌ [AUTH] No authenticated user found');
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check session timeouts
  const now = Date.now();
  const inactivityTimeout = 2 * 60 * 60 * 1000; // 2 hours
  const absoluteTimeout = 24 * 60 * 60 * 1000; // 24 hours

  // Initialize timestamps if missing
  if (!sessionUser.sessionStart) {
    sessionUser.sessionStart = now;
  }
  if (!sessionUser.lastActivity) {
    sessionUser.lastActivity = now;
  }

  // Check absolute timeout (24 hours from login)
  if (now - sessionUser.sessionStart > absoluteTimeout) {
    console.log('🔴 [SESSION] Absolute timeout reached (24h), destroying session');
    req.session.destroy((err) => {
      if (err) console.error('Session destroy error:', err);
    });
    return res.status(401).json({
      message: "Session expired",
      reason: "absolute_timeout"
    });
  }

  // Check inactivity timeout (2 hours from last activity)
  if (now - sessionUser.lastActivity > inactivityTimeout) {
    console.log('🔴 [SESSION] Inactivity timeout reached (2h), destroying session');
    req.session.destroy((err) => {
      if (err) console.error('Session destroy error:', err);
    });
    return res.status(401).json({
      message: "Session expired",
      reason: "inactivity_timeout"
    });
  }

  // Update last activity
  sessionUser.lastActivity = now;

  console.log('✅ [AUTH] Session valid, user authenticated');
  next();
};

/**
 * Check session timeouts middleware (for API routes)
 */
export const checkSessionTimeouts: RequestHandler = (req, res, next) => {
  const sessionUser = (req.session as any)?.user;

  if (sessionUser) {
    const now = Date.now();
    const inactivityTimeout = 2 * 60 * 60 * 1000; // 2 hours
    const absoluteTimeout = 24 * 60 * 60 * 1000; // 24 hours

    // Initialize timestamps
    if (!sessionUser.sessionStart) {
      sessionUser.sessionStart = now;
    }
    if (!sessionUser.lastActivity) {
      sessionUser.lastActivity = now;
    }

    // Check timeouts
    if (now - sessionUser.sessionStart > absoluteTimeout) {
      req.session.destroy((err) => {
        if (err) console.error('Session destroy error:', err);
      });
      return res.status(401).json({
        message: "Session expired",
        reason: "absolute_timeout"
      });
    }

    if (now - sessionUser.lastActivity > inactivityTimeout) {
      req.session.destroy((err) => {
        if (err) console.error('Session destroy error:', err);
      });
      return res.status(401).json({
        message: "Session expired",
        reason: "inactivity_timeout"
      });
    }

    // Update last activity
    sessionUser.lastActivity = now;
  }

  next();
};

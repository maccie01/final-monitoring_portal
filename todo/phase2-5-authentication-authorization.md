# PHASE 2.5: Authentication & Authorization Analysis

Created: 2025-10-07
Timestamp: 14:02:00

## Authentication Architecture Overview

### Session-Based Authentication System

**Primary Mechanism**: Express-session with PostgreSQL storage
**Library**: `express-session` + `connect-pg-simple`
**Password Hashing**: bcryptjs (partial implementation)

---

## Core Authentication Files

### 1. `/server/auth.ts` (162 lines)

**Purpose**: Core session management and authentication middleware
**Dependencies**:
- express-session (external)
- connect-pg-simple (external)
- ConnectionPoolManager (internal)

---

## Session Configuration

### Session Store Setup (Lines 11-47)

```typescript
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
```

**Configuration**:
- **Storage**: PostgreSQL table named "sessions"
- **Secret**: From environment variable or default (INSECURE)
- **TTL**: 24 hours
- **Rolling**: Yes (extends session on activity)
- **Cookie**: httpOnly, not secure (HTTPS disabled)
- **Same Site**: lax

**SECURITY ISSUES**:
1. **Default secret**: 'development-secret-change-in-production' (line 35)
2. **Secure cookie disabled**: `secure: false` in production (line 42)
3. **Session table pre-existence**: `createTableIfMissing: false` assumes table exists

---

## Session Timeout Management

### Dual Timeout System

**1. Absolute Timeout**: 24 hours from login
**2. Inactivity Timeout**: 2 hours from last activity

### isAuthenticated Middleware (Lines 61-114)

```typescript
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
```

**Behavior**:
- Checks both timeout types
- Updates lastActivity on each request
- Destroys session on timeout
- Returns reason for expiration

### checkSessionTimeouts Middleware (Lines 119-161)

**Purpose**: Lightweight timeout check for all API routes
**Difference from isAuthenticated**: Doesn't require session to exist

```typescript
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
```

**Usage**: Applied globally to /api routes (middleware/auth.ts:80)

---

## Authentication Middleware Layer

### 2. `/server/middleware/auth.ts` (87 lines)

**Purpose**: Enhanced middleware wrapper with additional auth patterns
**Pattern**: Re-exports from auth.ts + adds new middleware

### Exported Middleware

#### 1. setupAuth (Line 5)
**Source**: Re-export from auth.ts
**Purpose**: Initialize session middleware

#### 2. isAuthenticated (Line 6)
**Source**: Re-export from auth.ts
**Purpose**: Session validation with timeout checks

#### 3. checkSessionTimeouts (Line 7)
**Source**: Re-export from auth.ts
**Purpose**: Lightweight timeout middleware for API routes

#### 4. requireAuth (Lines 10-21)
**New Implementation**: Enhanced wrapper around isAuthenticated

```typescript
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
```

**Difference**: Adds error callback handling and structured error response

#### 5. validateSession (Lines 24-46)
**New Implementation**: Manual session validation

```typescript
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
```

**Note**: expires_at check appears unused (not set during login)

#### 6. requireRole (Lines 49-69)
**New Implementation**: Role-Based Access Control (RBAC)

```typescript
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
```

**Features**:
- Checks `req.session.user` OR `req.user` (dual pattern)
- Superadmin always bypasses role check
- Returns 403 Forbidden for insufficient role

#### 7. initializeAuth (Lines 72-87)
**New Implementation**: Setup function for Express app

```typescript
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
```

**Global Middleware**: Applies checkSessionTimeouts to all /api routes

---

## Password Management

### Password Hashing Implementation

**Library**: bcryptjs
**Rounds**: 10
**Usage**: 3 locations

#### 1. User Password Change (userController.ts:166-174)

```typescript
const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

if (!isCurrentPasswordValid) {
  return res.status(400).json({ message: 'Aktuelles Passwort ist falsch' });
}

// Hash new password
const hashedPassword = await bcrypt.hash(newPassword, 10);
```

**Pattern**: Compare old → hash new

#### 2. User Creation (userController.ts:221)

```typescript
if (userData.password) {
  userData.password = await bcrypt.hash(userData.password, 10);
}
```

**Pattern**: Hash password before insert

#### 3. Credential Validation (storage.ts:3342-3369)

```typescript
async validateUserCredentials(username: string, password: string): Promise<User | null> {
  try {
    // Find user by username or email
    const [user] = await getDb()
      .select()
      .from(users)
      .where(or(
        eq(users.username, username),
        eq(users.email, username)
      ))
      .limit(1);

    if (!user || !user.password) {
      return null;
    }

    // For now, simple password comparison
    // In production, use bcrypt or similar hashing
    if (user.password === password) {
      return user;
    }

    return null;
  } catch (error) {
    console.error('Error validating user credentials:', error);
    return null;
  }
}
```

**CRITICAL SECURITY ISSUE**: Plaintext password comparison (line 3360)
**Comment at line 3359**: "In production, use bcrypt or similar hashing"
**Evidence**: No bcrypt.compare() in login validation

---

## Login Flow Analysis

### 3. `/server/controllers/authController.ts` (423 lines)

**Exports**: Object with 5 async methods
**Pattern**: asyncHandler wrapper for error handling

### Method 1: superadminLogin (Lines 16-94)

**Route**: POST /api/auth/superadmin-login
**Auth Required**: No
**Purpose**: System superadmin authentication

```typescript
superadminLogin: asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw createValidationError("Benutzername und Passwort erforderlich");
  }

  console.log(`🔍 SUPERADMIN LOGIN ATTEMPT: ${username} with password: ${password.substring(0,3)}***`);

  let isValidSuperadmin = false;

  // Check setup-app.json for Superadmin credentials first
  try {
    const configPath = join(process.cwd(), 'server', 'setup-app.json');
    const configData = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    if (config['Login-user']?.enabled && config['Login-user']?.check_superadmin && config.Superadmin) {
      console.log('🔧 Prüfe Superadmin-Einträge aus setup-app.json');

      // Check each Superadmin entry
      for (const adminEntry of config.Superadmin) {
        const adminUsername = Object.keys(adminEntry)[0];
        const adminPassword = adminEntry[adminUsername];

        if (username === adminUsername && password === adminPassword) {
          console.log(`✅ Superadmin-Authentifizierung erfolgreich für: ${adminUsername}`);
          isValidSuperadmin = true;
          break;
        }
      }
    }
  } catch (configError) {
    console.error('❌ Error reading setup-app.json for Superadmin check:', configError);
  }

  // Check environment variables for superadmin credentials (SECURE)
  if (!isValidSuperadmin) {
    const envSuperadminUser = process.env.SUPERADMIN_USERNAME;
    const envSuperadminPass = process.env.SUPERADMIN_PASSWORD;

    if (envSuperadminUser && envSuperadminPass) {
      if (username === envSuperadminUser && password === envSuperadminPass) {
        isValidSuperadmin = true;
        console.log('✅ Umgebungsvariablen Superadmin-Authentifizierung erfolgreich');
      }
    }
  }

  if (!isValidSuperadmin) {
    throw createAuthError("Ungültige Superadmin-Anmeldedaten");
  }

  // Create superadmin session
  (req.session as any).user = {
    id: 'superadmin',
    email: 'superadmin@system.local',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'superadmin',
    userProfileId: null,
    mandantId: null,
    mandantRole: 'superadmin'
  };

  // Log activity
  console.log(`💯 Superadmin ${username} erfolgreich angemeldet um ${new Date().toLocaleString()}`);

  res.json({
    message: "Superadmin erfolgreich angemeldet",
    user: {
      id: 'superadmin',
      email: 'superadmin@system.local',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin'
    }
  });
}),
```

**Authentication Sources**:
1. setup-app.json file (JSON config)
2. Environment variables (SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD)

**SECURITY ISSUES**:
1. **Plaintext passwords** in setup-app.json
2. **No rate limiting** on failed attempts
3. **Logs partial password**: `password.substring(0,3)***` (line 23)

### Method 2: userLogin (Lines 104-271)

**Route**: POST /api/auth/login
**Auth Required**: No
**Purpose**: Regular user authentication

**Special Cases**:

#### Case 1: Hardcoded Admin (Lines 114-153)
```typescript
// ✅ SPECIAL CASE: Always allow admin / admin123 combination - load real data from DB
if (username.toLowerCase() === 'admin' && password === 'admin123') {
  console.log(`✅ [LOGIN] Admin hardcoded login detected (admin/admin123), loading real user data from DB`);

  // Load actual admin user from database
  const adminUser = await storage.getUser('100');

  if (!adminUser) {
    throw createAuthError("Admin-Benutzer nicht in der Datenbank gefunden");
  }

  // Create admin session with real data from database
  (req.session as any).user = {
    id: adminUser.id,
    email: adminUser.email,
    firstName: adminUser.firstName,
    lastName: adminUser.lastName,
    role: adminUser.role,
    userProfileId: adminUser.userProfileId,
    mandantId: adminUser.mandantId,
    mandantAccess: adminUser.mandantAccess || [1, 6, 8],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sessionStart: Date.now(),
    lastActivity: Date.now()
  };

  return res.json({
    message: 'Admin-Anmeldung erfolgreich',
    user: { /* admin user data */ }
  });
}
```

**CRITICAL SECURITY ISSUE**:
- **Hardcoded bypass**: admin/admin123 works without DB validation
- **Always succeeds**: Even if DB password is different
- **User ID hardcoded**: '100' assumed to be admin

#### Case 2: Superadmin via User Login (Lines 156-228)
**Pattern**: Checks setup-app.json AND environment variables
**Session**: Same as superadminLogin endpoint

#### Case 3: Regular User (Lines 230-271)
```typescript
// Regular user authentication
const user = await storage.validateUserCredentials(username, password);

if (!user) {
  throw createAuthError("Ungültige Anmeldedaten");
}

// Create user session
(req.session as any).user = {
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  userProfileId: user.userProfileId,
  mandantId: user.mandantId,
  mandantAccess: user.mandantAccess,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  sessionStart: Date.now(),
  lastActivity: Date.now()
};

res.json({
  message: 'Anmeldung erfolgreich',
  user: {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    userProfileId: user.userProfileId,
    mandantId: user.mandantId,
    mandantAccess: user.mandantAccess,
    userProfile: user.userProfile
  }
});
```

**SECURITY ISSUE**: Calls validateUserCredentials() which uses plaintext comparison

### Method 3: logout (Lines 274-288)

**Route**: POST /api/auth/logout
**Auth Required**: No (but checks session)

```typescript
logout: asyncHandler(async (req: Request, res: Response) => {
  const session = req.session as any;

  if (session.user) {
    const username = session.user.firstName || 'Unknown';
    console.log(`👋 User ${username} logged out at ${new Date().toLocaleString()}`);
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      throw createDatabaseError("Fehler beim Abmelden");
    }
    res.json({ message: "Erfolgreich abgemeldet" });
  });
}),
```

**Pattern**: Destroys session in PostgreSQL

### Method 4: getCurrentUser (Lines 290-333)

**Route**: GET /api/auth/user
**Auth Required**: Yes (via requireAuth middleware)

```typescript
getCurrentUser: asyncHandler(async (req: Request, res: Response) => {
  const session = req.session as any;

  if (!session.user) {
    throw createAuthError("Nicht authentifiziert");
  }

  // Superadmin special handling
  if (session.user.role === 'superadmin') {
    return res.json({
      user: {
        id: 'superadmin',
        email: 'superadmin@system.local',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        userProfile: {
          id: null,
          name: 'Superadmin',
          startPage: '/system-setup',
          sidebar: { /* ... */ }
        }
      }
    });
  }

  // Admin special handling
  if (session.user.role === 'admin') {
    return res.json({
      user: {
        ...session.user,
        userProfile: {
          id: session.user.userProfileId,
          name: 'Administrator',
          startPage: '/dashboard',
          sidebar: { /* ... */ }
        }
      }
    });
  }

  // Regular user - load from database with profile
  const fullUser = await storage.getUser(session.user.id);

  if (!fullUser) {
    throw createAuthError("Benutzer nicht gefunden");
  }

  res.json({
    user: {
      id: fullUser.id,
      email: fullUser.email,
      firstName: fullUser.firstName,
      lastName: fullUser.lastName,
      role: fullUser.role,
      userProfileId: fullUser.userProfileId,
      mandantId: fullUser.mandantId,
      mandantAccess: fullUser.mandantAccess,
      userProfile: fullUser.userProfile
    }
  });
}),
```

**Pattern**: Returns different data based on role

### Method 5: testAuth (Lines 336-349)

**Route**: GET /api/auth/test
**Auth Required**: No
**Purpose**: Debug endpoint for session inspection

```typescript
testAuth: asyncHandler(async (req: Request, res: Response) => {
  const session = req.session as any;

  res.json({
    hasSession: !!session,
    hasUser: !!session?.user,
    user: session?.user || null,
    sessionID: req.sessionID,
    timestamp: new Date().toISOString()
  });
}),
```

**SECURITY ISSUE**: Exposes session data without authentication

---

## Authentication Middleware Usage in Routes

### Route Protection Patterns

| Route Module | Pattern | Middleware | Lines |
|-------------|---------|------------|-------|
| auth.ts | Per-route | requireAuth | 13 |
| users.ts | Router-level | requireAuth | 12 |
| energy.ts | Router-level | isAuthenticated | 12 |
| temperature.ts | Router-level | isAuthenticated | 8 |
| efficiency.ts | Router-level | isAuthenticated | 12 |
| weather.ts | Per-route | requireAuth | 13-18 |
| object.ts | Router-level | requireAuth | 12 |
| db.ts | Router-level | requireAuth | 8 |
| portal.ts | Router-level | requireAuth | 12 |
| kiReport.ts | Router-level | requireAuth | 8 |
| monitoring.ts | Per-route | requireRole('admin') | 13, 18, 23 |
| index.ts | Per-route | isAuthenticated | 72, 131 |

### Pattern Analysis

**Pattern 1: Router-Level Protection** (9 modules)
```typescript
import { requireAuth } from "../middleware/auth";
router.use(requireAuth);
```

**Effect**: All routes in module require authentication

**Pattern 2: Per-Route Protection** (3 modules)
```typescript
router.get('/:id', requireAuth, controller.method);
```

**Effect**: Individual routes specify auth requirement

**Pattern 3: Role-Based Protection** (1 module)
```typescript
import { requireRole } from '../middleware/auth';
router.get('/pool/stats', requireRole('admin'), controller.method);
```

**Effect**: Requires specific role (admin or superadmin)

**Pattern 4: Mixed isAuthenticated + requireAuth** (4 modules)
**Issue**: Two different middleware for same purpose

---

## Authorization Patterns

### Role Hierarchy

```
superadmin (unrestricted)
  ├─> Bypasses all role checks
  ├─> Access to all mandants
  └─> Special userProfile with system-setup access

admin (multi-tenant)
  ├─> Access to specific mandantId
  ├─> Access to mandantAccess array
  ├─> Can view all objects in assigned mandants
  └─> Dashboard and management features

user (single-tenant)
  ├─> Restricted to mandantId
  ├─> Limited by mandantAccess array
  ├─> Cannot access admin features
  └─> userProfile defines permissions
```

### Permission Checking Patterns

#### Pattern 1: Role Check
```typescript
if (user.role !== 'admin' && user.role !== 'superadmin') {
  return res.status(403).json({ message: "Forbidden" });
}
```

**Used in**: Admin-only features

#### Pattern 2: Mandant Ownership
```typescript
if (user.role !== 'admin' && object.mandantId !== user.mandantId) {
  return res.status(403).json({ message: "Keine Berechtigung für dieses Objekt" });
}
```

**Used in**: Object access control

#### Pattern 3: Mandant Access Array
```typescript
if (user.role !== 'admin' && object.mandantId !== user.mandantId) {
  const hasAccess = user.mandantAccess && user.mandantAccess.includes(object.mandantId);
  if (!hasAccess) {
    return res.status(403).json({ message: "Keine Berechtigung für dieses Objekt" });
  }
}
```

**Used in**: Multi-tenant access control
**Evidence**: kiReportController.ts:45-52, energyController.ts:88-91

#### Pattern 4: Database-Level Filtering
```typescript
const systems = await storage.getObjects(user.mandantId, user.role !== 'admin');
```

**Used in**: Data retrieval with auto-filtering
**Evidence**: energyController.ts:24

---

## Error Handling Architecture

### 4. `/server/middleware/error.ts` (157 lines)

**Purpose**: Centralized error handling middleware
**Exports**: 6 functions + 1 class

### AppError Class (Lines 12-25)

```typescript
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}
```

**Pattern**: Operational vs Programming errors

### errorHandler Middleware (Lines 28-115)

```typescript
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('🚨 [ERROR-MIDDLEWARE] Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: (req as any).session?.user?.id || 'anonymous'
  });

  // Default error response
  let errorResponse: ErrorResponse = {
    message: "Internal Server Error",
    status: 500
  };

  // Handle AppError (operational errors)
  if (err instanceof AppError) {
    errorResponse = {
      message: err.message,
      status: err.statusCode,
      details: err.details
    };
  }
  // Handle known error types
  else if (err.name === 'ValidationError') {
    errorResponse = { message: "Validation Error", error: err.message, status: 400 };
  }
  else if (err.name === 'CastError') {
    errorResponse = { message: "Invalid data format", error: err.message, status: 400 };
  }
  else if (err.name === 'JsonWebTokenError') {
    errorResponse = { message: "Invalid token", error: err.message, status: 401 };
  }
  else if (err.name === 'TokenExpiredError') {
    errorResponse = { message: "Token expired", error: err.message, status: 401 };
  }
  else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    errorResponse = { message: "Database error", status: 500 };
  }
  else if (err.message.includes('ECONNREFUSED')) {
    errorResponse = { message: "Database connection failed", status: 503 };
  }
  // Handle unexpected errors in production
  else if (process.env.NODE_ENV === 'production') {
    errorResponse = { message: "Something went wrong", status: 500 };
  }
  // Include full error in development
  else {
    errorResponse = { message: err.message, error: err.stack, status: 500 };
  }

  res.status(errorResponse.status).json(errorResponse);
}
```

**Features**:
- Logs all errors with context
- Different handling for dev vs production
- Recognizes MongoDB errors (not used in this project)
- Recognizes JWT errors (not used in this project)

### Helper Functions

#### asyncHandler (Lines 133-137)
```typescript
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

**Purpose**: Wrap async route handlers to catch errors
**Usage**: authController, databaseController

#### Error Creators (Lines 140-157)
```typescript
export function createValidationError(message: string, details?: any) {
  return new AppError(message, 400, details);
}

export function createDatabaseError(message: string, details?: any) {
  return new AppError(message, 500, details);
}

export function createAuthError(message: string) {
  return new AppError(message, 401);
}

export function createForbiddenError(message: string) {
  return new AppError(message, 403);
}
```

**Usage**: Controllers throw these for consistent error responses

---

## Session Object Structure

### User Session Properties

```typescript
interface SessionUser {
  // Core identity
  id: string | 'superadmin';
  email: string;
  firstName: string;
  lastName: string;
  role: 'superadmin' | 'admin' | 'user';

  // Multi-tenancy
  mandantId: number | null;
  mandantAccess?: number[];

  // Profile
  userProfileId: number | null;
  userProfile?: UserProfile;

  // Session tracking
  sessionStart: number;        // timestamp
  lastActivity: number;        // timestamp
  createdAt?: string;
  updatedAt?: string;
}
```

---

## Security Issues Summary

### Critical Issues

1. **Plaintext Password Storage** (storage.ts:3360)
   - validateUserCredentials() uses direct comparison
   - Comment acknowledges: "In production, use bcrypt"
   - **Risk**: Passwords stored/compared in plaintext

2. **Hardcoded Admin Bypass** (authController.ts:114)
   - admin/admin123 always succeeds
   - Loads user ID '100' from database
   - **Risk**: Backdoor access if ID '100' exists

3. **Default Session Secret** (auth.ts:35)
   - Fallback: 'development-secret-change-in-production'
   - **Risk**: Session forgery if default used

4. **Superadmin Config File** (authController.ts:28-47)
   - Plaintext passwords in setup-app.json
   - **Risk**: Filesystem access = superadmin access

5. **Insecure Cookies** (auth.ts:42)
   - `secure: false` in all environments
   - **Risk**: Session hijacking over HTTP

6. **No Rate Limiting**
   - No protection on login endpoints
   - **Risk**: Brute force attacks

7. **Test Endpoint Exposed** (authController.ts:336-349)
   - /api/auth/test returns session without auth
   - **Risk**: Session enumeration

### Medium Issues

8. **Inconsistent Middleware**
   - Some routes use isAuthenticated
   - Some routes use requireAuth
   - **Risk**: Confusion, potential bypass

9. **Logs Partial Passwords** (authController.ts:23)
   - Logs first 3 characters of password
   - **Risk**: Information leak

10. **No CSRF Protection**
    - SameSite: lax not strict
    - No CSRF tokens
    - **Risk**: Cross-site request forgery

11. **Session Table Manual Creation**
    - `createTableIfMissing: false`
    - **Risk**: Startup failure if missing

12. **Error Messages Leak Info**
    - "Admin-Benutzer nicht in der Datenbank gefunden"
    - **Risk**: Enumeration

---

## Authentication Flow Diagram

```
User Login Request
  ↓
authController.userLogin()
  ├─> Check: admin/admin123? → YES → Load user '100' from DB → Create session
  ├─> Check: Superadmin credentials? → YES → Create superadmin session
  └─> Regular user → storage.validateUserCredentials()
                      ├─> Query user by username/email
                      ├─> Compare password (PLAINTEXT!)
                      └─> Return user or null
                          ↓
                      Create session in PostgreSQL
                          ↓
                      Return user data + session cookie
                          ↓
Subsequent Requests
  ↓
Middleware: checkSessionTimeouts (all /api routes)
  ├─> Check absolute timeout (24h)
  ├─> Check inactivity timeout (2h)
  └─> Update lastActivity
      ↓
Protected Route Middleware
  ├─> isAuthenticated() → Check session exists + timeouts
  ├─> requireAuth() → Wrapper around isAuthenticated
  └─> requireRole(role) → Check user.role === role OR 'superadmin'
      ↓
Controller Method
  ├─> Check permissions (mandantId, mandantAccess)
  ├─> Query database with user context
  └─> Return data
```

---

## Recommendations

### Immediate Security Fixes

1. **Implement bcrypt in validateUserCredentials**
   ```typescript
   const isValid = await bcrypt.compare(password, user.password);
   if (!isValid) return null;
   ```

2. **Remove admin/admin123 hardcoded bypass**
   - Validate all users through database
   - Hash existing admin password

3. **Enforce SESSION_SECRET in production**
   ```typescript
   if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
     throw new Error('SESSION_SECRET required in production');
   }
   ```

4. **Enable secure cookies in production**
   ```typescript
   secure: process.env.NODE_ENV === 'production'
   ```

5. **Remove /api/auth/test endpoint**
   - Or require authentication

6. **Migrate superadmin to environment variables**
   - Remove setup-app.json plaintext passwords
   - Use only SUPERADMIN_USERNAME/PASSWORD env vars
   - Hash superadmin password

### Architecture Improvements

7. **Standardize Middleware**
   - Use only requireAuth everywhere
   - Remove isAuthenticated from routes
   - Consistent error responses

8. **Implement Rate Limiting**
   - express-rate-limit on /api/auth/login
   - 5 attempts per 15 minutes per IP

9. **Add CSRF Protection**
   - csurf middleware for state-changing operations
   - SameSite: strict for cookies

10. **Session Table Management**
    - Auto-create sessions table on startup
    - Or validate existence and error clearly

11. **Improve Error Messages**
    - Generic: "Invalid credentials" for all auth failures
    - Don't reveal user existence

12. **Add Audit Logging**
    - Log all login attempts (success/failure)
    - Use userActivityLogs table

---

## Dependencies Summary

### External Libraries
- **express-session** (v1.18.1) - Session management
- **connect-pg-simple** (v10.0.0) - PostgreSQL session store
- **bcryptjs** (v2.4.3) - Password hashing (partially used)

### Internal Dependencies
- **./db** - Database connection
- **./connection-pool** - Connection pool manager
- **./storage** - Data access layer
- **@shared/schema** - Type definitions

---

## PHASE 2.5 COMPLETE ✅

**Files Analyzed**: 4 core auth files
**Total Lines**: 829 lines
**Security Issues Found**: 12 (7 critical, 5 medium)
**Middleware Types**: 7 functions
**Authentication Methods**: 3 (session-based, superadmin, hardcoded)

**Critical Finding**: Plaintext password validation in production code

**Status**: Ready for PHASE 2.6 External Integrations Analysis

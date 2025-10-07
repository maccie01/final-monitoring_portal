# PHASE 2.1: Backend Framework & Entry Point Analysis

Created: 2025-10-07
Timestamp: 13:53:00

## Backend Framework Identification

**File**: `/server/index.ts`
**Lines**: 156
**Size**: 4,370 bytes

### Framework Detected: **Express.js**

**Evidence**: Line 1
```typescript
import express, { type Request, Response, NextFunction } from "express";
```

**Version**: 4.21.2 (from package.json:73)

---

## Entry Point Analysis

### File Location
**Path**: `/Users/janschubert/code-projects/monitoring_firma/app-version-4_netzwächter/server/index.ts`

### Imports (Lines 1-4)

```typescript
import express, { type Request, Response, NextFunction } from "express";  // Line 1
import { setupRoutes } from "./routes/index";                             // Line 2
import { setupVite, serveStatic, log } from "./vite";                    // Line 3
import { emailService } from "./email-service";                           // Line 4
```

**Dependencies**:
1. **express** - Web framework (external package)
2. **./routes/index** - Route setup module (internal)
3. **./vite** - Vite dev server integration (internal)
4. **./email-service** - Email service module (internal)

---

## Server Initialization

### Express App Creation (Lines 6-8)

```typescript
const app = express();                              // Line 6
app.use(express.json());                            // Line 7
app.use(express.urlencoded({ extended: false }));   // Line 8
```

**Middleware Registered**:
1. `express.json()` - Parse JSON request bodies
2. `express.urlencoded()` - Parse URL-encoded bodies (extended: false)

---

## Middleware Stack Analysis

### 1. Request Logging Middleware (Lines 10-38)

**Type**: Custom middleware
**Purpose**: Log API requests with timing and response data

```typescript
app.use((req, res, next) => {
  const start = Date.now();                          // Line 11
  const path = req.path;                             // Line 12
  let capturedJsonResponse: Record<string, any> | undefined = undefined;  // Line 13
```

**Implementation**:
- **Start Timer**: Captures request start time (line 11)
- **Path Capture**: Stores request path (line 12)
- **Response Interception**: Overrides res.json() to capture response body (lines 15-19)

**Response Hook** (Lines 21-35):
```typescript
res.on("finish", () => {
  const duration = Date.now() - start;               // Line 22
  if (path.startsWith("/api")) {                     // Line 23
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;  // Line 24
    if (capturedJsonResponse) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;  // Line 26
    }

    if (logLine.length > 80) {
      logLine = logLine.slice(0, 79) + "…";         // Line 30
    }

    log(logLine);                                    // Line 33
  }
});
```

**Logging Logic**:
- Only logs API routes (path starts with "/api")
- Captures: HTTP method, path, status code, duration
- Includes response JSON if present
- Truncates logs longer than 80 characters
- Uses custom log() function from ./vite

**Evidence**: Lines 10-38

---

## Async Initialization (Lines 40-155)

### IIFE Pattern

```typescript
(async () => {
  try {
    // ... initialization code
  } catch (error) {
    console.error('Failed to start server:', error);  // Line 152
    process.exit(1);                                   // Line 153
  }
})();
```

**Pattern**: Immediately Invoked Async Function Expression
**Purpose**: Allow await at top level

---

### Step 1: Database Initialization (Lines 42-44)

```typescript
// Initialize database connection after dotenv is loaded
const { initializeDatabase } = await import("./db");   // Line 43
await initializeDatabase();                            // Line 44
```

**Process**:
1. Dynamic import of database module
2. Awaits database connection initialization
3. Blocks server startup until DB is ready

**Evidence**: Comment at line 42 mentions "after dotenv is loaded"
**Note**: Environment variables loaded via tsx --env-file=.env (package.json:7)

---

### Step 2: Special Route - /startki (Lines 46-100)

**Route**: `GET /startki`
**Purpose**: Iframe wrapper for embedded application
**Added**: Before main routes (line 46 comment)

```typescript
app.get("/startki", (req, res) => {                   // Line 47
  const iframeHtml = `...`;                            // Line 48-98
  res.status(200).set({ "Content-Type": "text/html" }).end(iframeHtml);  // Line 99
});
```

**HTML Response** (Lines 48-98):
- Complete HTML document with embedded iframe
- **Title**: "Heatcare KI-System" (German)
- **Iframe Source**: "/" (root path)
- **JavaScript Logic**:
  - Locks URL to /startki (prevents navigation away)
  - Uses history.replaceState() to maintain URL
  - Polls every 500ms to reset URL (line 85)
  - Prevents popstate events (lines 89-92)
  - Hides mobile address bar (line 95)

**Purpose**: Embedded mode for Grafana or external integration
**Security Note**: URL locking prevents users from navigating away

**Evidence**: Lines 46-100

---

### Step 3: Route Setup (Line 102)

```typescript
const server = await setupRoutes(app);                 // Line 102
```

**Function**: `setupRoutes()` from `./routes/index`
**Returns**: HTTP server instance
**Purpose**: Register all API routes

**Evidence**: Will be analyzed in PHASE 2.2

---

### Step 4: Global Error Handler (Lines 104-111)

```typescript
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;  // Line 105
  const message = err.message || "Internal Server Error";  // Line 106

  console.error('Application error:', err);            // Line 108
  res.status(status).json({ message });                // Line 109
  // Don't rethrow error to prevent crash                Line 110
});
```

**Error Handling**:
- Catches all unhandled route errors
- Extracts status code (defaults to 500)
- Extracts error message
- Logs error to console
- Returns JSON error response
- Does NOT rethrow (prevents server crash)

**Evidence**: Lines 104-111

---

### Step 5: Development vs Production Setup (Lines 113-120)

```typescript
// importantly only setup vite in development and after
// setting up all the other routes so the catch-all route
// doesn't interfere with the other routes
if (app.get("env") === "development") {                // Line 116
  await setupVite(app, server);                        // Line 117
} else {
  serveStatic(app);                                    // Line 119
}
```

**Environment Detection**: `app.get("env")` checks NODE_ENV

**Development Mode** (Line 117):
- Calls `setupVite(app, server)`
- Enables Vite dev server with HMR
- Serves frontend from client/ directory

**Production Mode** (Line 119):
- Calls `serveStatic(app)`
- Serves built frontend from dist/public/
- No dev server, just static file serving

**Critical Comment** (Lines 113-115):
- Vite must be set up AFTER API routes
- Prevents Vite's catch-all from interfering with API

**Evidence**: Lines 113-120, matches package.json dev/start scripts

---

### Step 6: Server Listen (Lines 122-140)

#### Port Configuration (Lines 122-126)

```typescript
// ALWAYS serve the app on the port specified in the environment variable PORT
// Other ports are firewalled. Default to 5000 if not specified.
// this serves both the API and the client.
// It is the only port that is not firewalled.
const port = parseInt(process.env.PORT || '5000', 10);  // Line 126
```

**Port Logic**:
- Reads from `process.env.PORT`
- Defaults to 5000 if not set
- Parses as integer
- **Comment Note**: Only this port is not firewalled (Replit constraint?)

**Evidence**: .env:9 sets PORT=4004

#### Listen Configuration (Lines 127-140)

```typescript
server.listen({
  port,                                                 // Line 128
  host: "0.0.0.0",                                      // Line 129
  reusePort: true,                                      // Line 130
}, async () => {
  log(`serving on port ${port}`);                       // Line 132

  // Initialize email service to ensure Portal-DB entry exists
  try {
    await emailService.initialize();                    // Line 136
  } catch (error) {
    log('E-Mail-Service Initialisierung fehlgeschlagen:', error instanceof Error ? error.message : String(error));  // Line 138
  }
});
```

**Listen Options**:
- **port**: From environment or 5000
- **host**: "0.0.0.0" (bind to all interfaces)
- **reusePort**: true (allow multiple processes on same port)

**Callback Actions**:
1. Log server start message (line 132)
2. Initialize email service (line 136)
3. Catch and log email service errors (lines 137-139)

**Email Service Init**:
- Asynchronous initialization
- Ensures Portal-DB entry exists (comment line 134)
- Non-fatal if fails (catches error, logs, continues)

**Evidence**: Lines 127-140

---

### Step 7: Graceful Shutdown (Lines 142-149)

```typescript
// Handle graceful shutdown
process.on('SIGINT', () => {                           // Line 143
  log('Received SIGINT, shutting down gracefully');    // Line 144
  server.close(() => {                                 // Line 145
    log('Server closed');                              // Line 146
    process.exit(0);                                   // Line 147
  });
});
```

**Signal Handler**: SIGINT (Ctrl+C)

**Shutdown Process**:
1. Log shutdown message
2. Close HTTP server (stops accepting connections)
3. Wait for existing connections to finish
4. Log completion
5. Exit process with code 0

**Evidence**: Lines 142-149

---

## Server Startup Sequence

### Order of Operations

```
1. Load environment variables (via tsx --env-file=.env)
   └─> Before server code runs

2. Create Express app (line 6)
   └─> Add JSON parser (line 7)
   └─> Add URL-encoded parser (line 8)
   └─> Add request logging middleware (lines 10-38)

3. Initialize database connection (lines 43-44)
   └─> Blocks until connected
   └─> Exits if fails

4. Register /startki route (lines 47-100)
   └─> Must be before main routes

5. Setup all API routes (line 102)
   └─> Returns HTTP server
   └─> Analyzed in PHASE 2.2

6. Add global error handler (lines 104-111)
   └─> Catches unhandled route errors

7. Setup frontend serving (lines 116-120)
   ├─> Development: Vite dev server (line 117)
   └─> Production: Static files (line 119)

8. Start HTTP server (lines 127-130)
   └─> Bind to 0.0.0.0:PORT

9. Initialize email service (line 136)
   └─> Non-blocking
   └─> Logs error if fails

10. Register SIGINT handler (line 143)
    └─> Graceful shutdown on Ctrl+C
```

---

## Port Configuration

| Source | Port | Evidence |
|--------|------|----------|
| Environment Variable | 4004 | .env:9 |
| Default Fallback | 5000 | server/index.ts:126 |
| Production (expected) | 4004 | .env value used |
| Development (expected) | 4004 | .env value used |

**Comment Evidence**: Lines 122-125 indicate port restrictions (firewall)

---

## Environment Variables Used

| Variable | Line | Purpose | Default |
|----------|------|---------|---------|
| `process.env.PORT` | 126 | Server port | 5000 |
| `app.get("env")` | 116 | Node environment | "development" |

**NODE_ENV**: Set via package.json scripts (lines 7, 9)

---

## Middleware Registration Order

1. **express.json()** - Parse JSON bodies
2. **express.urlencoded()** - Parse URL-encoded bodies
3. **Custom logging middleware** - Request/response logging
4. **GET /startki** - Special iframe route
5. **setupRoutes()** - All API routes
6. **Global error handler** - Catch-all error handling
7. **Vite/Static serving** - Frontend serving (catch-all)

**Critical**: Order matters! API routes must be before Vite (line 113-115)

---

## Database Connection Initialization

**File**: `./db` (analyzed separately)
**Function**: `initializeDatabase()`
**Timing**: Before routes setup (line 44)
**Behavior**: Blocks server startup if fails

**Evidence**: Lines 43-44, error caught at line 151-153

---

## Error Handling Strategy

### 1. Try-Catch Wrapper (Lines 40, 151-154)

```typescript
try {
  // ... all initialization
} catch (error) {
  console.error('Failed to start server:', error);    // Line 152
  process.exit(1);                                     // Line 153
}
```

**Catches**: All initialization errors
**Action**: Log and exit with code 1

### 2. Global Error Middleware (Lines 104-111)

**Catches**: All route handler errors
**Action**: Return JSON error response, don't crash

### 3. Email Service Error (Lines 137-139)

**Catches**: Email initialization errors
**Action**: Log error, continue server startup

**Strategy**: Fail fast for critical errors, graceful degradation for optional services

---

## Logging Implementation

**Function**: `log()` from `./vite`
**Usage**:
- Line 33: Request logging
- Line 132: Server start
- Line 138: Email service errors
- Line 144: Shutdown message
- Line 146: Server closed

**Evidence**: Will analyze ./vite.ts for log() implementation

---

## Special Routes

### /startki Route

**Purpose**: Embedded iframe wrapper
**Method**: GET
**Response**: HTML document with iframe
**Features**:
- Embeds root route (/)
- Locks URL to /startki
- Prevents navigation
- Mobile address bar hiding

**Use Case**: Integration with external systems (Grafana, dashboards)

---

## Development vs Production Differences

| Aspect | Development | Production | Evidence |
|--------|-------------|------------|----------|
| Frontend Serving | Vite dev server | Static files | Lines 117, 119 |
| Hot Module Replacement | Enabled | Disabled | Line 117 |
| Source Maps | Yes | No | Vite defaults |
| Build Process | None (on-demand) | Pre-built | package.json:8 |
| Entry Point | server/index.ts | dist/index.js | package.json:7, 9 |

---

## Key Observations

### 1. **Monolithic Server**
- Single Express app serves both API and frontend
- No separate frontend server
- Port 4004 handles everything

### 2. **Initialization Order Critical**
- Database must connect before routes
- Routes must register before Vite
- Email service initialized after server starts

### 3. **Error Handling Layers**
- Initialization errors: exit process
- Route errors: return JSON error
- Optional services: log and continue

### 4. **Special Integration**
- /startki route for embedded mode
- URL locking prevents navigation
- Suggests iframe integration requirement

### 5. **Environment Awareness**
- Different serving strategy based on NODE_ENV
- Port from environment variable
- Graceful defaults

### 6. **Production Considerations**
- Graceful shutdown on SIGINT
- Global error handler prevents crashes
- Non-blocking optional services

---

## Dependencies to Analyze Next

1. **./routes/index** - Route setup (PHASE 2.2)
2. **./db** - Database initialization (PHASE 2.3)
3. **./vite** - Vite integration (PHASE 2.1 continuation)
4. **./email-service** - Email service (PHASE 2.6)
5. **./middleware/auth** - Authentication (PHASE 2.5)
6. **./middleware/error** - Error handling (PHASE 2.5)

---

## Security Observations

### 1. **Host Binding**
- `0.0.0.0` - Binds to all interfaces
- Accepts connections from any IP
- **Risk**: Exposed to network if no firewall

### 2. **Error Messages**
- Returns error.message to client (line 109)
- **Risk**: May leak sensitive information
- **Mitigation**: Should sanitize error messages in production

### 3. **Logging**
- Logs full response JSON (line 26)
- **Risk**: May log sensitive data
- **Consideration**: Review what's being logged

### 4. **CORS**
- Not visible in entry point
- **Need to check**: Routes setup or middleware

---

## Next Analysis Required

**PHASE 2.2: API Route Discovery & Mapping**
- Analyze ./routes/index.ts
- Document all API endpoints
- Map routes to controllers
- Identify middleware chains

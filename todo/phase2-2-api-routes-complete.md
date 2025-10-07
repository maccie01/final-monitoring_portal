# PHASE 2.2: API Route Discovery & Mapping - Complete Inventory

Created: 2025-10-07
Timestamp: 14:00:00

## Route Aggregator Analysis

**File**: `/server/routes/index.ts`
**Lines**: 536
**Function**: `setupRoutes(app: Express): Promise<Server>`

---

## Route Module Imports (Lines 6-19)

```typescript
import authRoutes from "./auth";                          // Line 7
import dbRoutes from "./db";                              // Line 8
import weatherRoutes from "./weather";                    // Line 9
import portalRoutes from "./portal";                      // Line 10
import userRoutes from "./users";                         // Line 11
import energyRoutes from "./energy";                      // Line 12
import efficiencyRoutes from "./efficiency";              // Line 13
import objectRoutes from "./object";                      // Line 14
import kiRoutes from "./kiReport";                        // Line 15
import monitoringRoutes from "./monitoring";              // Line 16
import { temperatureRoutes } from "./temperature";        // Line 17
import { weatherController } from "../controllers/weatherController";    // Line 18
import { authController } from "../controllers/authController";          // Line 19
```

**Route Modules**: 11 modules
**Controller Imports**: 2 direct imports (weather, auth)

---

## Complete API Endpoint Inventory

### Authentication Initialization (Line 31)

```typescript
await initializeAuth(app);  // Line 31
```

**Purpose**: Initialize session middleware and authentication system
**Evidence**: Will analyze in PHASE 2.5

---

### 1. Health Check Endpoint (Lines 34-40)

| Method | Path | Auth | Handler | Line |
|--------|------|------|---------|------|
| GET | `/api/health` | ❌ No | Inline | 34 |

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-07T14:00:00.000Z",
  "version": "1.0.0"
}
```

**Purpose**: Health check for monitoring/load balancers
**Evidence**: Lines 34-40

---

### 2. Public Temperature Endpoints (Lines 43-46)

| Method | Path | Auth | Handler | Line |
|--------|------|------|---------|------|
| GET | `/api/outdoor-temperatures/postal-code/:postalCode/latest` | ❌ No | weatherController.getLatestTemperatureByPostalCode | 43 |
| GET | `/api/outdoor-temperatures/postal-code/:postalCode` | ❌ No | weatherController.getTemperaturesByPostalCode | 44 |
| POST | `/api/outdoor-temperatures/restore-climate-data` | ❌ No | weatherController.restoreClimateData | 45 |
| POST | `/api/outdoor-temperatures/import-2023-climate` | ❌ No | weatherController.import2023Climate | 46 |

**Comment**: Line 42 - "BEFORE auth init to avoid global auth"
**Purpose**: Public weather/temperature data access
**Evidence**: Lines 43-46

---

### 3. Public Energy Endpoints (Lines 49-56)

| Method | Path | Auth | Handler | Line |
|--------|------|------|---------|------|
| GET | `/api/public-daily-consumption/:objectId` | ❌ No | energyController.getPublicDailyConsumption | 50 |
| GET | `/api/public-monthly-consumption/:objectId` | ❌ No | energyController.getPublicMonthlyConsumption | 51 |
| GET | `/api/monthly-netz/:objectId` | ❌ No | energyController.getMonthlyNetz | 52 |
| GET | `/api/monthly-consumption/:objectId` | ❌ No | energyController.getPublicMonthlyConsumption | 55 |

**Comment**: Lines 48, 54 - "Public energy endpoints for real database testing", "Backup-compatible endpoints"
**Purpose**: Public energy data access
**Dynamic Import**: energyController imported on line 49
**Evidence**: Lines 49-56

---

### 4. Public Efficiency Endpoints (Lines 58-59)

| Method | Path | Auth | Handler | Line |
|--------|------|------|---------|------|
| GET | `/api/test-efficiency-analysis/:objectId` | ❌ No | efficiencyController.getEfficiencyAnalysis | 59 |

**Comment**: Line 57 - "Public efficiency endpoints for testing"
**Purpose**: Testing efficiency analysis
**Dynamic Import**: efficiencyController imported on line 58
**Evidence**: Lines 58-59

---

### 5. Legacy Login Route (Lines 62)

| Method | Path | Auth | Handler | Line |
|--------|------|------|---------|------|
| POST | `/api/user-login` | ❌ No | authController.userLogin | 62 |

**Comment**: Line 61 - "Direct login route for compatibility (legacy support)"
**Purpose**: Backward compatibility for old login endpoint
**Evidence**: Line 62

---

### 6. Mounted Route Modules (Lines 65-75)

| Prefix | Module | Mounted Line |
|--------|--------|--------------|
| `/api/auth` | authRoutes | 65 |
| `/api` | dbRoutes | 66 |
| `/api/outdoor-temperatures` | weatherRoutes | 67 |
| `/api/portal` | portalRoutes | 68 |
| `/api/users` | userRoutes | 69 |
| `/api` | energyRoutes | 70 |
| `/api` | efficiencyRoutes | 71 |
| `/api` | objectRoutes | 72 |
| `/api` | kiRoutes | 73 |
| `/api` | temperatureRoutes | 74 |
| `/api/monitoring` | monitoringRoutes | 75 |

**Note**: Multiple modules mounted at `/api` prefix (db, energy, efficiency, object, ki, temperature)
**Evidence**: Lines 65-75
**Analysis**: Will examine each module individually

---

### 7. PDF Export Email Route (Lines 78-134)

| Method | Path | Auth | Handler | Line |
|--------|------|------|---------|------|
| POST | `/api/export/send-email` | ✅ Yes (isAuthenticated) | Inline + Multer | 78 |

**Request**:
- Multipart form data
- Fields: `email`, `subject`
- File: PDF attachment

**Process** (Lines 78-134):
1. Import emailService dynamically (line 80)
2. Import multer dynamically (line 81)
3. Configure multer for memory storage (line 84)
4. Handle file upload (line 87)
5. Validate email and file (lines 105-108)
6. Initialize transporter if needed (lines 111-114)
7. Send email with PDF attachment (lines 117-126)
8. Return success response (line 128)

**Response**:
```json
{
  "success": true,
  "message": "E-Mail erfolgreich versendet"
}
```

**Error Handling**: Lines 88-91, 105-108, 130-133
**Logging**: Lines 96-103
**Evidence**: Lines 78-134

---

### 8. Legacy Temperature-Efficiency Chart Route (Lines 137-166)

| Method | Path | Auth | Handler | Line |
|--------|------|------|---------|------|
| GET | `/api/temperature-efficiency-chart/:objectId` | ✅ Yes (isAuthenticated) | Inline redirect | 137 |

**Comment**: Line 136 - "Legacy compatibility route for TemperatureEfficiencyChart"

**Process**:
1. Extract objectId and timeRange (lines 140-141)
2. Map old timeRange format to new (lines 144-153)
   - '2024' → 'last-year'
   - '2023' → 'last-2year'
   - '365days' → 'last-365-days'
   - default → 'last-year'
3. Log redirect (line 155)
4. Forward to energyController.getTemperatureEfficiencyChart (lines 158-160)

**Evidence**: Lines 137-166

---

### 9. Database Status Endpoint (Lines 169-193)

| Method | Path | Auth | Handler | Line |
|--------|------|------|---------|------|
| GET | `/api/database/status` | ❌ No | Inline | 169 |

**Comment**: Line 168 - "Database status endpoint - reports main PostgreSQL connection pool status"

**Process**:
1. Import ConnectionPoolManager (line 171)
2. Get singleton instance (line 172)
3. Perform health check (line 173)
4. Return status (lines 175-185)

**Response**:
```json
{
  "settingdbOnline": true,
  "usingFallback": false,
  "activeDatabase": "PostgreSQL Connection Pool",
  "poolStatus": {
    "healthy": true,
    "activeConnections": 45,
    "errorRate": 0.02
  },
  "timestamp": "2025-10-07T14:00:00.000Z"
}
```

**Evidence**: Lines 169-193

---

### 10. User Profiles Endpoints (Lines 200-261)

| Method | Path | Auth | Handler | Line |
|--------|------|------|---------|------|
| GET | `/api/user-profiles` | ❌ No | Inline via storage | 200 |
| POST | `/api/user-profiles` | ❌ No | Inline via storage | 213 |
| PUT | `/api/user-profiles/:id` | ❌ No | Inline via storage | 230 |
| DELETE | `/api/user-profiles/:id` | ❌ No | Inline via storage | 247 |

**Comment**: Line 199 - "Add direct routes for UserManagement.tsx expected APIs with proper validation"

**GET /api/user-profiles** (Lines 200-212):
- Calls storage.getUserProfiles()
- Returns user profile list

**POST /api/user-profiles** (Lines 213-229):
- Validates req.body.name (line 216)
- Calls storage.createUserProfile()
- Returns 201 Created

**PUT /api/user-profiles/:id** (Lines 230-246):
- Validates ID is integer (line 232-234)
- Calls storage.updateUserProfile()
- Returns updated profile

**DELETE /api/user-profiles/:id** (Lines 247-261):
- Validates ID is integer (line 249-251)
- Calls storage.deleteUserProfile()
- Returns success: true

**Evidence**: Lines 200-261

---

### 11. Mandants Endpoints (Lines 263-312)

| Method | Path | Auth | Handler | Line |
|--------|------|------|---------|------|
| GET | `/api/mandants` | ❌ No | databaseController.getMandants | 263 |
| POST | `/api/mandants` | ❌ No | Inline via storage | 264 |
| PATCH | `/api/mandants/:id` | ❌ No | Inline via storage | 281 |
| DELETE | `/api/mandants/:id` | ❌ No | Inline via storage | 298 |

**GET /api/mandants** (Line 263):
- Direct controller call

**POST /api/mandants** (Lines 264-280):
- Validates req.body.name (line 267)
- Calls storage.createMandant()
- Returns 201 Created

**PATCH /api/mandants/:id** (Lines 281-297):
- Validates ID is integer (line 283-285)
- Calls storage.updateMandant()
- Returns updated mandant

**DELETE /api/mandants/:id** (Lines 298-312):
- Validates ID is integer (line 300-302)
- Calls storage.deleteMandant()
- Returns success: true

**Evidence**: Lines 263-312

---

### 12. Object Groups Endpoints (Lines 315-376)

| Method | Path | Auth | Handler | Line |
|--------|------|------|---------|------|
| GET | `/api/object-groups` | ❌ No | Inline via storage | 315 |
| POST | `/api/object-groups` | ❌ No | Inline via storage | 328 |
| PATCH | `/api/object-groups/:id` | ❌ No | Inline via storage | 345 |
| DELETE | `/api/object-groups/:id` | ❌ No | Inline via storage | 362 |

**Comment**: Line 314 - "Object groups API with proper validation and error handling"

**GET /api/object-groups** (Lines 315-327):
- Calls storage.getObjectGroups()
- Returns object groups list

**POST /api/object-groups** (Lines 328-344):
- Validates req.body.name (line 331)
- Calls storage.createObjectGroup()
- Returns 201 Created

**PATCH /api/object-groups/:id** (Lines 345-361):
- Validates ID is integer (line 347-349)
- Calls storage.updateObjectGroup()
- Returns updated group

**DELETE /api/object-groups/:id** (Lines 362-376):
- Validates ID is integer (line 364-366)
- Calls storage.deleteObjectGroup()
- Returns success: true

**Evidence**: Lines 315-376

---

### 13. Setup Config Endpoint (Lines 379-405)

| Method | Path | Auth | Handler | Line |
|--------|------|------|---------|------|
| GET | `/api/setup-config` | ❌ No | Inline static response | 379 |

**Comment**: Line 378 - "Setup config API"

**Response** (Lines 382-400):
```json
{
  "config": {
    "Mandantenrollen": ["besitzer", "verwalter", "handwerker"],
    "sidebarPermissions": [
      { "key": "showMaps", "label": "Objekt-Karte", "icon": "Building" },
      { "key": "showDashboard", "label": "KPI Dashboard", "icon": "BarChart3" },
      { "key": "showEnergyData", "label": "Energiedaten", "icon": "Zap" },
      { "key": "showNetworkMonitor", "label": "Netzwächter", "icon": "Activity" },
      { "key": "showGrafanaDashboards", "label": "Objekt-Monitoring", "icon": "Database" },
      { "key": "showEfficiencyStrategy", "label": "Klassifizierung", "icon": "BookOpen" },
      { "key": "showSystemSetup", "label": "System-Setup", "icon": "Settings" },
      { "key": "showUserManagement", "label": "Benutzerverwaltung", "icon": "Users" },
      { "key": "showObjectManagement", "label": "Objektverwaltung", "icon": "Building" },
      { "key": "showDeviceManagement", "label": "Geräteverwaltung", "icon": "Settings" },
      { "key": "showLogbook", "label": "Logbuch", "icon": "BookOpen" },
      { "key": "showUser", "label": "Meine Benutzer", "icon": "UserCheck" }
    ]
  }
}
```

**Purpose**: Static configuration for frontend UserManagement component
**Evidence**: Lines 379-405

---

### 14. User Logs Endpoint (Lines 408-437)

| Method | Path | Auth | Handler | Line |
|--------|------|------|---------|------|
| GET | `/api/user-logs` | ⚠️ Session | Inline via DB query | 408 |

**Comment**: Line 407 - "User logs API - load real data from database"

**Process**:
1. Check session user (lines 410-413)
2. Query userActivityLogs table (lines 416-419)
   - Filter by user ID
   - Order by timestamp DESC
   - Limit 50
3. Transform logs (lines 422-430)
4. Return JSON array

**Auth Check**: Line 410 - `(req as any).session?.user`
**Database Query**: Lines 416-419 using Drizzle ORM
**Evidence**: Lines 408-437

---

### 15. User Activity Logs with Time Range (Lines 440-482)

| Method | Path | Auth | Handler | Line |
|--------|------|------|---------|------|
| GET | `/api/user-activity-logs/:timeRange?` | ⚠️ Session | Inline via storage | 440 |

**Comment**: Line 439 - "User activity logs API with timeRange support (for UserManagement frontend)"

**Time Ranges**:
- `1d` - Last 24 hours (lines 453-455)
- `7d` - Last 7 days (lines 456-458) [DEFAULT]
- `30d` - Last 30 days (lines 459-461)

**Process**:
1. Check session user (lines 442-445)
2. Get time range parameter (line 447)
3. Calculate start date (lines 450-464)
4. Call storage.getUserActivityLogsWithTimeRange() (lines 469-474)
   - No userId filter (shows ALL users)
   - Date filter applied
   - Limit 50, offset 0
5. Log result count (line 476)
6. Return logs array

**Evidence**: Lines 440-482

---

### 16. Create User Activity Log (Lines 485-515)

| Method | Path | Auth | Handler | Line |
|--------|------|------|---------|------|
| POST | `/api/user-activity-logs` | ⚠️ Session | Inline DB insert | 485 |

**Request Body**:
```json
{
  "action": "string",
  "resourceType": "string",
  "resourceId": "number|null",
  "details": "object"
}
```

**Process**:
1. Check session user (lines 487-490)
2. Extract request body (line 492)
3. Validate action and resourceType (lines 495-497)
4. Insert into userActivityLogs table (lines 500-506)
5. Log insertion (line 508)
6. Return 201 Created (line 510)

**Evidence**: Lines 485-515

---

### 17. Database Route Aliases (Lines 517-518)

| Prefix | Module | Line |
|--------|--------|------|
| `/api/database` | dbRoutes | 517 |
| `/api/db` | dbRoutes | 518 |

**Comment**: Lines indicate these are aliases for the same module
**Evidence**: Lines 517-518

---

### 18. Error Handlers (Lines 521, 524)

| Handler | Path | Line |
|---------|------|------|
| notFoundHandler | `/api/*` | 521 |
| errorHandler | All routes | 524 |

**404 Handler**: Line 521 - Catches unmatched API routes
**Global Error Handler**: Line 524 - Must be last
**Evidence**: Lines 521, 524

---

## Route Module Endpoints Summary

Need to analyze individual route files:

1. **authRoutes** (`./auth.ts`) - Line 7, mounted at `/api/auth`
2. **dbRoutes** (`./db.ts`) - Line 8, mounted at `/api`
3. **weatherRoutes** (`./weather.ts`) - Line 9, mounted at `/api/outdoor-temperatures`
4. **portalRoutes** (`./portal.ts`) - Line 10, mounted at `/api/portal`
5. **userRoutes** (`./users.ts`) - Line 11, mounted at `/api/users`
6. **energyRoutes** (`./energy.ts`) - Line 12, mounted at `/api`
7. **efficiencyRoutes** (`./efficiency.ts`) - Line 13, mounted at `/api`
8. **objectRoutes** (`./object.ts`) - Line 14, mounted at `/api`
9. **kiRoutes** (`./kiReport.ts`) - Line 15, mounted at `/api`
10. **temperatureRoutes** (`./temperature.ts`) - Line 17, mounted at `/api`
11. **monitoringRoutes** (`./monitoring.ts`) - Line 16, mounted at `/api/monitoring`

---

## Main Router Endpoints Count

**Direct Endpoints in index.ts**: 34 endpoints

| Category | Count |
|----------|-------|
| Health Check | 1 |
| Public Temperature | 4 |
| Public Energy | 4 |
| Public Efficiency | 1 |
| Legacy Login | 1 |
| PDF Export | 1 |
| Legacy Chart | 1 |
| Database Status | 1 |
| User Profiles | 4 |
| Mandants | 4 |
| Object Groups | 4 |
| Setup Config | 1 |
| User Logs | 3 |
| Database Aliases | 2 |
| Error Handlers | 2 |

**Mounted Modules**: 11 modules (endpoints analyzed separately)

---

## Authentication Patterns

### No Auth (Public)
- `/api/health`
- `/api/outdoor-temperatures/*` (4 endpoints)
- `/api/public-*` (4 energy endpoints)
- `/api/monthly-*` (2 endpoints)
- `/api/test-efficiency-analysis/:objectId`
- `/api/user-login` (legacy)
- `/api/database/status`
- `/api/user-profiles*` (4 endpoints) ⚠️ Should be protected
- `/api/mandants*` (4 endpoints) ⚠️ Should be protected
- `/api/object-groups*` (4 endpoints) ⚠️ Should be protected
- `/api/setup-config` ⚠️ Should be protected

**Security Issue**: Many management endpoints lack authentication

### Explicit Auth (isAuthenticated middleware)
- `/api/export/send-email` (line 78)
- `/api/temperature-efficiency-chart/:objectId` (line 137)

### Session-Based Auth
- `/api/user-logs` (checks req.session.user)
- `/api/user-activity-logs/*` (checks req.session.user)

### Module-Mounted (Auth checked in module)
- All 11 mounted route modules

---

## Storage Module Usage

**Lines where storage is imported dynamically**:
- Line 202, 219, 236, 253 (user-profiles)
- Line 270, 287, 304 (mandants)
- Line 317, 334, 351, 368 (object-groups)
- Line 467 (user-activity-logs)

**Pattern**: Dynamic import for lazy loading
```typescript
const { storage } = await import("../storage");
```

**Evidence**: storage.ts is 146KB - dynamic imports may help reduce initial load

---

## Dynamic Imports Analysis

| Module | Line | Purpose |
|--------|------|---------|
| energyController | 49 | Public energy endpoints |
| efficiencyController | 58 | Public efficiency endpoints |
| emailService | 80 | PDF export |
| multer | 81 | File upload |
| energyController (again) | 158 | Legacy chart redirect |
| ConnectionPoolManager | 171 | Database status |
| databaseController | 196 | UserManagement APIs |
| userController | 197 | UserManagement APIs |
| storage | 202, 219, 236, 253, 270, 287, 304, 317, 334, 351, 368, 467 | CRUD operations |

**Pattern**: Heavy use of dynamic imports for optional/conditional functionality

---

## Key Observations

### 1. **Mixed Authentication**
- Some endpoints explicitly protected (isAuthenticated)
- Some check session manually
- Many management endpoints unprotected ⚠️

### 2. **Legacy Support**
- Multiple "legacy" or "backup-compatible" routes
- Old timeRange format conversion (line 144-153)
- Direct login route (line 62)

### 3. **Public APIs**
- Intentionally public endpoints for testing/external access
- Comment confirms "BEFORE auth init" (lines 42, 48, 57)

### 4. **Storage Abstraction**
- Heavy reliance on storage module (146KB file)
- Dynamic imports used throughout
- Consistent error handling pattern

### 5. **Inline Route Handlers**
- Many complex handlers inline (not in controllers)
- Lines 78-134 (PDF export - 56 lines inline)
- Lines 200-515 (CRUD operations - 315 lines inline)

### 6. **German Language**
- Error messages in German (lines 121, 128, 138, etc.)
- Config labels in German (lines 384-398)
- Suggests German target market

### 7. **Validation Patterns**
- Consistent ID validation (parseInt, isNaN check)
- Basic required field checks
- No schema validation library used

---

## Security Concerns

### 🔴 Critical
1. **Unprotected Management Endpoints**
   - `/api/user-profiles*` - Anyone can CRUD user profiles
   - `/api/mandants*` - Anyone can CRUD tenants
   - `/api/object-groups*` - Anyone can CRUD object groups
   - `/api/setup-config` - Exposes system configuration

2. **No Rate Limiting**
   - No evidence of rate limiting middleware
   - Public endpoints vulnerable to abuse

### ⚠️ Medium
1. **Mixed Auth Patterns**
   - Inconsistent auth approach (middleware vs manual checks)
   - Easy to forget auth on new endpoints

2. **Error Message Exposure**
   - Stack traces may leak in error responses
   - Database errors returned to client

### ✓ Good Practices
1. **Health Check Endpoint** - Standard monitoring
2. **Graceful Error Handling** - Try-catch blocks
3. **Input Validation** - ID and required field checks
4. **Dynamic Imports** - Code splitting for performance

---

## Next Analysis Required

**Analyze each route module**:
1. `/server/routes/auth.ts` - Authentication routes
2. `/server/routes/db.ts` - Database routes
3. `/server/routes/weather.ts` - Weather routes
4. `/server/routes/portal.ts` - Portal config routes
5. `/server/routes/users.ts` - User management routes
6. `/server/routes/energy.ts` - Energy data routes
7. `/server/routes/efficiency.ts` - Efficiency routes
8. `/server/routes/object.ts` - Object routes
9. `/server/routes/kiReport.ts` - AI report routes
10. `/server/routes/temperature.ts` - Temperature routes
11. `/server/routes/monitoring.ts` - Monitoring routes

**Total Route Files**: 790 lines across all modules

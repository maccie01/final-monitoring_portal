# PHASE 2.2: Complete API Endpoint Inventory

Created: 2025-10-07
Timestamp: 14:10:00

## Total API Endpoints: 85+

---

## Complete Endpoint Table

| # | Method | Path | Auth | Module | Handler | Line Ref |
|---|--------|------|------|--------|---------|----------|
| 1 | GET | `/api/health` | ❌ | index.ts | Inline | index:34 |
| 2 | GET | `/api/outdoor-temperatures/postal-code/:postalCode/latest` | ❌ | index.ts | weatherController | index:43 |
| 3 | GET | `/api/outdoor-temperatures/postal-code/:postalCode` | ❌ | index.ts | weatherController | index:44 |
| 4 | POST | `/api/outdoor-temperatures/restore-climate-data` | ❌ | index.ts | weatherController | index:45 |
| 5 | POST | `/api/outdoor-temperatures/import-2023-climate` | ❌ | index.ts | weatherController | index:46 |
| 6 | GET | `/api/public-daily-consumption/:objectId` | ❌ | index.ts | energyController | index:50 |
| 7 | GET | `/api/public-monthly-consumption/:objectId` | ❌ | index.ts | energyController | index:51 |
| 8 | GET | `/api/monthly-netz/:objectId` | ❌ | index.ts | energyController | index:52 |
| 9 | GET | `/api/monthly-consumption/:objectId` | ❌ | index.ts | energyController | index:55 |
| 10 | GET | `/api/test-efficiency-analysis/:objectId` | ❌ | index.ts | efficiencyController | index:59 |
| 11 | POST | `/api/user-login` | ❌ | index.ts | authController | index:62 |
| 12 | POST | `/api/export/send-email` | ✅ | index.ts | Inline + Multer | index:78 |
| 13 | GET | `/api/temperature-efficiency-chart/:objectId` | ✅ | index.ts | Inline redirect | index:137 |
| 14 | GET | `/api/database/status` | ❌ | index.ts | Inline | index:169 |
| 15 | GET | `/api/user-profiles` | ❌ | index.ts | storage | index:200 |
| 16 | POST | `/api/user-profiles` | ❌ | index.ts | storage | index:213 |
| 17 | PUT | `/api/user-profiles/:id` | ❌ | index.ts | storage | index:230 |
| 18 | DELETE | `/api/user-profiles/:id` | ❌ | index.ts | storage | index:247 |
| 19 | GET | `/api/mandants` | ❌ | index.ts | databaseController | index:263 |
| 20 | POST | `/api/mandants` | ❌ | index.ts | storage | index:264 |
| 21 | PATCH | `/api/mandants/:id` | ❌ | index.ts | storage | index:281 |
| 22 | DELETE | `/api/mandants/:id` | ❌ | index.ts | storage | index:298 |
| 23 | GET | `/api/object-groups` | ❌ | index.ts | storage | index:315 |
| 24 | POST | `/api/object-groups` | ❌ | index.ts | storage | index:328 |
| 25 | PATCH | `/api/object-groups/:id` | ❌ | index.ts | storage | index:345 |
| 26 | DELETE | `/api/object-groups/:id` | ❌ | index.ts | storage | index:362 |
| 27 | GET | `/api/setup-config` | ❌ | index.ts | Inline static | index:379 |
| 28 | GET | `/api/user-logs` | ⚠️ Session | index.ts | DB query | index:408 |
| 29 | GET | `/api/user-activity-logs/:timeRange?` | ⚠️ Session | index.ts | storage | index:440 |
| 30 | POST | `/api/user-activity-logs` | ⚠️ Session | index.ts | DB insert | index:485 |
| 31 | POST | `/api/auth/superadmin-login` | ❌ | auth.ts | authController | auth:8 |
| 32 | POST | `/api/auth/user-login` | ❌ | auth.ts | authController | auth:9 |
| 33 | POST | `/api/auth/logout` | ❌ | auth.ts | authController | auth:10 |
| 34 | GET | `/api/auth/user` | ✅ | auth.ts | authController | auth:13 |
| 35 | POST | `/api/auth/heartbeat` | ✅ | auth.ts | authController | auth:14 |
| 36 | GET | `/api/heating-systems` | ✅ | energy.ts | energyController | energy:15 |
| 37 | GET | `/api/energy-data` | ✅ | energy.ts | energyController | energy:18 |
| 38 | POST | `/api/energy-data` | ✅ | energy.ts | energyController | energy:19 |
| 39 | GET | `/api/energy-data/:objectId` | ✅ | energy.ts | energyController | energy:22 |
| 40 | GET | `/api/daily-consumption/:objectId` | ✅ | energy.ts | energyController | energy:25 |
| 41 | GET | `/api/monthly-consumption/:objectId` | ✅ | energy.ts | energyController | energy:26 |
| 42 | GET | `/api/energy-data-meters/:objectId` | ✅ | energy.ts | energyController | energy:27 |
| 43 | GET | `/api/energy-data/temperature-efficiency-chart/:objectId` | ✅ | energy.ts | energyController | energy:30 |
| 44 | GET | `/api/yearly-summary/:objectId` | ✅ | energy.ts | energyController | energy:31 |
| 45 | GET | `/api/users/profiles/list` | ✅ | users.ts | userController | users:15 |
| 46 | POST | `/api/users/profiles` | ✅ | users.ts | userController | users:16 |
| 47 | PUT | `/api/users/profiles/:id` | ✅ | users.ts | userController | users:17 |
| 48 | DELETE | `/api/users/profiles/:id` | ✅ | users.ts | userController | users:18 |
| 49 | POST | `/api/users/:id/change-password` | ✅ | users.ts | userController | users:21 |
| 50 | GET | `/api/users/` | ✅ | users.ts | userController | users:24 |
| 51 | POST | `/api/users/` | ✅ | users.ts | userController | users:25 |
| 52 | PATCH | `/api/users/:id` | ✅ | users.ts | userController | users:26 |
| 53 | DELETE | `/api/users/:id` | ✅ | users.ts | userController | users:27 |
| 54 | GET | `/api/users/:id` | ✅ | users.ts | userController | users:28 |
| 55 | GET | `/api/objects` | ✅ | object.ts | objectController | object:15 |
| 56 | GET | `/api/objects/:id` | ✅ | object.ts | objectController | object:16 |
| 57 | POST | `/api/objects` | ✅ | object.ts | objectController | object:17 |
| 58 | PUT | `/api/objects/:id` | ✅ | object.ts | objectController | object:18 |
| 59 | DELETE | `/api/objects/:id` | ✅ | object.ts | objectController | object:19 |
| 60 | GET | `/api/objects/by-objectid/:objectId` | ✅ | object.ts | objectController | object:22 |
| 61 | GET | `/api/objects/:id/children` | ✅ | object.ts | objectController | object:23 |
| 62 | GET | `/api/objects/hierarchy/:mandantId` | ✅ | object.ts | objectController | object:24 |
| 63 | GET | `/api/portal/config` | ✅ | portal.ts | databaseController | portal:15 |
| 64 | GET | `/api/portal/fallback-config` | ✅ | portal.ts | databaseController | portal:18 |
| 65 | POST | `/api/portal/save-fallback-config` | ✅ | portal.ts | databaseController | portal:19 |
| 66 | POST | `/api/portal/test-connection` | ✅ | portal.ts | databaseController | portal:20 |
| 67 | GET | `/api/portal/load-config/:configType` | ✅ | portal.ts | databaseController | portal:23 |
| 68 | POST | `/api/portal/test-config/:configType` | ✅ | portal.ts | databaseController | portal:24 |
| 69 | POST | `/api/portal/save-config/:configType` | ✅ | portal.ts | databaseController | portal:25 |
| 70 | POST | `/api/portal/activate-config` | ✅ | portal.ts | databaseController | portal:26 |
| 71 | GET | `/api/portal/active-config` | ✅ | portal.ts | databaseController | portal:29 |
| 72 | GET | `/api/monitoring/pool/stats` | 🔐 Admin | monitoring.ts | monitoringController | monitoring:13 |
| 73 | GET | `/api/monitoring/pool/health` | 🔐 Admin | monitoring.ts | monitoringController | monitoring:18 |
| 74 | GET | `/api/monitoring/dashboard` | 🔐 Admin | monitoring.ts | monitoringController | monitoring:23 |
| 75 | POST | `/api/energy-balance/:objectId` | ✅ | kiReport.ts | kiReportController | kiReport:11 |
| 76 | GET | `/api/yearly-summary/:objectId` | ✅ | kiReport.ts | kiReportController | kiReport:14 |
| 77 | GET | `/api/monthly-consumption-multi-year/:objectId` | ✅ | kiReport.ts | kiReportController | kiReport:17 |
| 78 | GET | `/api/status` | ✅ | db.ts | databaseController | db:11 |
| 79 | GET | `/api/objects` | ✅ | db.ts | databaseController | db:14 |
| 80 | GET | `/api/mandants` | ✅ | db.ts | databaseController | db:17 |
| 81 | GET | `/api/settings` | ✅ | db.ts | databaseController | db:20 |
| 82 | POST | `/api/settings` | ✅ | db.ts | databaseController | db:21 |
| 83 | DELETE | `/api/settings/:category/:keyName` | ✅ | db.ts | databaseController | db:22 |
| 84 | GET | `/api/dashboard/kpis` | ✅ | db.ts | databaseController | db:25 |
| 85 | GET | `/api/outdoor-temperatures/objects` | ✅ | weather.ts | weatherController | weather:13 |
| 86 | GET | `/api/outdoor-temperatures/:id` | ✅ | weather.ts | weatherController | weather:14 |
| 87 | GET | `/api/outdoor-temperatures/` | ✅ | weather.ts | weatherController | weather:15 |
| 88 | POST | `/api/outdoor-temperatures/` | ✅ | weather.ts | weatherController | weather:16 |
| 89 | PUT | `/api/outdoor-temperatures/:id` | ✅ | weather.ts | weatherController | weather:17 |
| 90 | DELETE | `/api/outdoor-temperatures/:id` | ✅ | weather.ts | weatherController | weather:18 |
| 91 | GET | `/api/efficiency-analysis/:objectId` | ⚠️ Disabled | efficiency.ts | efficiencyController | efficiency:15 |
| 92 | GET | `/api/settings/thresholds` | ✅ | temperature.ts | temperatureController | temperature:11 |
| 93 | GET | `/api/temperature-analysis/:objectId` | ✅ | temperature.ts | temperatureController | temperature:14 |
| 94 | GET | `/api/temperature-analysis` | ✅ | temperature.ts | temperatureController | temperature:17 |

**Total Endpoints**: 94

---

## Authentication Summary

### No Auth (Public) - 29 endpoints
- Health check (1)
- Public temperature endpoints (4)
- Public energy endpoints (4)
- Public efficiency test (1)
- Legacy login (1)
- Database status (1)
- User profiles CRUD (4) ⚠️
- Mandants CRUD (4) ⚠️
- Object groups CRUD (4) ⚠️
- Setup config (1)
- Auth routes - login/logout (3)

### Authenticated (requireAuth / isAuthenticated) - 62 endpoints
- Auth protected (2)
- Energy routes (9)
- User routes (10)
- Object routes (8)
- Portal routes (9)
- KI Report routes (3)
- DB routes (7)
- Weather authenticated routes (6)
- Temperature routes (3)
- Efficiency (1 - auth disabled)

### Session-Based (manual check) - 3 endpoints
- User logs (3)

### Role-Based (Admin only) - 3 endpoints
- Monitoring routes (3)

---

## Critical Security Issues

### 🔴 CRITICAL: Unprotected Management Endpoints

**User Profiles** (4 endpoints - Lines index:200-261):
```
GET    /api/user-profiles        - Anyone can list profiles
POST   /api/user-profiles        - Anyone can create profiles
PUT    /api/user-profiles/:id    - Anyone can update profiles
DELETE /api/user-profiles/:id    - Anyone can delete profiles
```

**Mandants** (4 endpoints - Lines index:263-312):
```
GET    /api/mandants             - Anyone can list tenants
POST   /api/mandants             - Anyone can create tenants
PATCH  /api/mandants/:id         - Anyone can update tenants
DELETE /api/mandants/:id         - Anyone can delete tenants
```

**Object Groups** (4 endpoints - Lines index:315-376):
```
GET    /api/object-groups        - Anyone can list groups
POST   /api/object-groups        - Anyone can create groups
PATCH  /api/object-groups/:id    - Anyone can update groups
DELETE /api/object-groups/:id    - Anyone can delete groups
```

**Setup Config** (1 endpoint - Line index:379):
```
GET    /api/setup-config         - Anyone can read system configuration
```

**Impact**: Complete system compromise possible
**Fix Required**: Add authentication middleware

### ⚠️ Medium: Disabled Authentication

**Efficiency Analysis** (Line efficiency:12):
```typescript
// router.use(isAuthenticated); // Temporarily disabled for testing
```

Comment indicates auth temporarily disabled - should be re-enabled for production

---

## Route Module Analysis

### 1. auth.ts (16 lines)
**Endpoints**: 5
**Auth Pattern**: Mixed (3 public, 2 protected)

| Endpoint | Auth | Purpose |
|----------|------|---------|
| POST /superadmin-login | ❌ | Superadmin login |
| POST /user-login | ❌ | User login |
| POST /logout | ❌ | Logout |
| GET /user | ✅ requireAuth | Get current user |
| POST /heartbeat | ✅ requireAuth | Session keepalive |

---

### 2. energy.ts (33 lines)
**Endpoints**: 9
**Auth Pattern**: Global middleware (line 12)

```typescript
router.use(isAuthenticated); // Line 12
```

**Endpoints**:
- GET /heating-systems
- GET /energy-data
- POST /energy-data
- GET /energy-data/:objectId
- GET /daily-consumption/:objectId
- GET /monthly-consumption/:objectId
- GET /energy-data-meters/:objectId
- GET /energy-data/temperature-efficiency-chart/:objectId
- GET /yearly-summary/:objectId

**German Comments**: "Energiedaten-Verwaltung" (line 8)

---

### 3. users.ts (30 lines)
**Endpoints**: 10
**Auth Pattern**: Global middleware (line 12)

```typescript
router.use(requireAuth); // Line 12
```

**Endpoints**:
- GET /profiles/list
- POST /profiles
- PUT /profiles/:id
- DELETE /profiles/:id
- POST /:id/change-password
- GET /
- POST /
- PATCH /:id
- DELETE /:id
- GET /:id

**Route Order Note**: Line 14 comment warns "MUST be before /:id routes"

---

### 4. object.ts (26 lines)
**Endpoints**: 8
**Auth Pattern**: Global middleware (line 12)

```typescript
router.use(requireAuth); // Line 12
```

**Endpoints**:
- GET /objects
- GET /objects/:id
- POST /objects
- PUT /objects/:id
- DELETE /objects/:id
- GET /objects/by-objectid/:objectId
- GET /objects/:id/children
- GET /objects/hierarchy/:mandantId

**German Comments**: "Objektverwaltung" (line 8)

---

### 5. portal.ts (31 lines)
**Endpoints**: 9
**Auth Pattern**: Global middleware (line 12)

```typescript
router.use(requireAuth); // Line 12
```

**Endpoints**:
- GET /config
- GET /fallback-config
- POST /save-fallback-config
- POST /test-connection
- GET /load-config/:configType
- POST /test-config/:configType
- POST /save-config/:configType
- POST /activate-config
- GET /active-config

**German Comments**: "Portal-Konfiguration" (line 8)

---

### 6. monitoring.ts (28 lines)
**Endpoints**: 3
**Auth Pattern**: Role-based (requireRole('admin'))

**Special**: All routes require admin role

**Endpoints**:
- GET /pool/stats (line 13)
- GET /pool/health (line 18)
- GET /dashboard (line 23)

**Comments**: JSDoc style (lines 7-10)

---

### 7. kiReport.ts (19 lines)
**Endpoints**: 3
**Auth Pattern**: Global middleware (line 8)

```typescript
router.use(requireAuth); // Line 8
```

**Endpoints**:
- POST /energy-balance/:objectId
- GET /yearly-summary/:objectId
- GET /monthly-consumption-multi-year/:objectId

**German Comments**: "KI Report Routes - alle erfordern Authentifizierung" (line 7)

---

### 8. db.ts (27 lines)
**Endpoints**: 7
**Auth Pattern**: Global middleware (line 8)

```typescript
router.use(requireAuth); // Line 8
```

**Endpoints**:
- GET /status
- GET /objects
- GET /mandants
- GET /settings
- POST /settings
- DELETE /settings/:category/:keyName
- GET /dashboard/kpis

---

### 9. weather.ts (20 lines)
**Endpoints**: 6
**Auth Pattern**: Per-route middleware

**Note**: Line 12 comment explains public endpoints registered in index.ts

**Endpoints** (all require auth):
- GET /objects
- GET /:id
- GET /
- POST /
- PUT /:id
- DELETE /:id

**German Comments**: "Tages-Außentemperaturen" (line 8)

---

### 10. efficiency.ts (17 lines)
**Endpoints**: 1
**Auth Pattern**: ⚠️ DISABLED (line 12)

```typescript
// router.use(isAuthenticated); // Temporarily disabled for testing
```

**Endpoint**:
- GET /efficiency-analysis/:objectId

**German Comments**: "Effizienz-Analyse", "nur echte DB-Daten, keine Mock-Daten" (line 8, 14)

---

### 11. temperature.ts (19 lines)
**Endpoints**: 3
**Auth Pattern**: Global middleware (line 8)

```typescript
router.use(isAuthenticated); // Line 8
```

**Endpoints**:
- GET /settings/thresholds
- GET /temperature-analysis/:objectId
- GET /temperature-analysis

**German Comments**: "Alle Temperatur-Routen erfordern Authentifizierung" (line 7)

---

## Middleware Usage Analysis

### Three Auth Middleware Types

1. **requireAuth** (used in 7 modules)
   - users.ts
   - object.ts
   - portal.ts
   - kiReport.ts
   - db.ts
   - auth.ts (selective)
   - weather.ts (per-route)

2. **isAuthenticated** (used in 3 modules)
   - energy.ts
   - efficiency.ts (commented out)
   - temperature.ts

3. **requireRole('admin')** (used in 1 module)
   - monitoring.ts

**Inconsistency**: Two different auth middleware names used (`requireAuth` vs `isAuthenticated`)
**Evidence**: Will analyze middleware implementations in PHASE 2.5

---

## API Versioning

**Result**: NO API versioning detected

**Evidence**: All routes use `/api/*` prefix without version numbers
**Recommendation**: Add versioning for future API changes (e.g., `/api/v1/*`)

---

## REST vs GraphQL vs WebSocket

**Result**: Pure REST API

- **REST**: All 94 endpoints ✅
- **GraphQL**: Not detected ❌
- **WebSocket**: ws package installed but routes not visible in HTTP routes ⚠️

**WebSocket Evidence**: package.json:106 (`"ws": "^8.18.0"`)
**Analysis Required**: Check server/index.ts or separate WebSocket server

---

## Response Patterns

### Success Responses
- JSON objects
- JSON arrays
- Status codes: 200, 201

### Error Responses
- JSON format: `{ error: "message" }` or `{ message: "message" }`
- Status codes: 400, 401, 404, 500

### Consistency Issues
- Some use `error` property
- Some use `message` property
- Some use `success: true/false`

---

## German Language Usage

**Routes with German comments**: 8 out of 11

Examples:
- "Energiedaten-Verwaltung" (energy.ts)
- "Benutzerverwaltung" (users.ts)
- "Objektverwaltung" (object.ts)
- "Portal-Konfiguration" (portal.ts)
- "Effizienz-Analyse" (efficiency.ts)
- "Tages-Außentemperaturen" (weather.ts)

**Target Market**: German-speaking users confirmed

---

## Next Steps

**PHASE 2.3: Data Layer Architecture**
- Analyze server/db.ts
- Analyze server/connection-pool.ts
- Analyze shared/schema.ts
- Document database tables
- Analyze ORM usage (Drizzle)
- Map entity relationships

**Files to Analyze**:
1. server/db.ts (1,618 bytes)
2. server/connection-pool.ts (12,290 bytes)
3. shared/schema.ts (37,150 bytes - LARGE)
4. server/storage.ts (146,432 bytes - VERY LARGE)

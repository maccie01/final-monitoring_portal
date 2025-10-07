# PHASE 2.4: Business Logic & Service Layer Analysis

Created: 2025-10-07
Timestamp: 13:58:00

## Service Layer Architecture

### Primary Service: DatabaseStorage Class

**File**: `/server/storage.ts`
**Lines**: 3,961 (CRITICAL SIZE - Largest file in codebase)
**Pattern**: Singleton export with class-based implementation
**Export**: `export const storage = new DatabaseStorage();` (line 3961)

---

## Storage Service Analysis

### Interface Definition (Lines 45-198)

**Interface**: `IStorage`
**Purpose**: Contract for all data access operations
**Method Count**: 93 async methods

#### Method Categories:

1. **User Operations** (9 methods, lines 47-55)
   ```typescript
   getUser(id: string): Promise<User | undefined>
   getUserByUsername(username: string): Promise<User | undefined>
   getUserByEmail(email: string): Promise<User | undefined>
   getUsers(): Promise<User[]>
   getUsersByMandant(mandantId: number): Promise<User[]>
   getUsersByMandants(mandantIds: number[]): Promise<User[]>
   upsertUser(user: UpsertUser): Promise<User>
   updateUser(id: string, user: Partial<UpsertUser>): Promise<User>
   deleteUser(id: string): Promise<void>
   ```

2. **Authentication** (1 method, line 58)
   ```typescript
   validateUserCredentials(username: string, password: string): Promise<User | null>
   ```

3. **User Profile Management** (5 methods, lines 61-65)
   ```typescript
   getUserProfiles(): Promise<UserProfile[]>
   getUserProfile(id: number): Promise<UserProfile | undefined>
   createUserProfile(profile: InsertUserProfile): Promise<UserProfile>
   updateUserProfile(id: number, profile: Partial<InsertUserProfile>): Promise<UserProfile>
   deleteUserProfile(id: number): Promise<void>
   ```

4. **Mandant (Tenant) Management** (4 methods, lines 69-72)
   ```typescript
   getMandants(): Promise<Mandant[]>
   createMandant(mandant: InsertMandant): Promise<Mandant>
   updateMandant(id: number, mandant: Partial<InsertMandant>): Promise<Mandant>
   deleteMandant(id: number): Promise<void>
   ```

5. **Object Management** (8 methods, lines 75-86)
   ```typescript
   getObjects(mandantIds?: number | number[], isAdmin?: boolean): Promise<ObjectType[]>
   getObject(id: number): Promise<ObjectType | undefined>
   createObject(object: InsertObject): Promise<ObjectType>
   updateObject(id: number, object: Partial<InsertObject>): Promise<ObjectType>
   deleteObject(id: number): Promise<void>
   getObjectChildren(parentId: number): Promise<ObjectType[]>
   getObjectHierarchy(mandantId: number): Promise<ObjectType[]>
   ```

6. **Energy Data Operations** (11 methods, lines 81-106)
   ```typescript
   getDailyConsumptionData(objectId: number, timeRange: string): Promise<any>
   getMonthlyConsumptionData(objectId: number, timeRange: string): Promise<any>
   getEnergyDataExternal(objectId: number, limit?: number): Promise<any[]>
   getEnergyDataForAllMeters(objectId: number, meterData: Record<string, any>, timeRange?: string): Promise<any>
   getEnergyDataForSpecificMeter(meterId: number, objectId: number, fromDate?: Date | null, toDate?: Date | null): Promise<any[]>
   getDayMeterData(objectId: number, startDate?: Date, endDate?: Date): Promise<DayComp[]>
   createDayMeterData(data: InsertDayComp): Promise<DayComp>
   getLatestDayMeterData(objectId: number): Promise<DayComp | undefined>
   getDailyConsumption(objectId: number, startDate?: Date, endDate?: Date): Promise<{...}>
   getEnergyDataForObject(objectId: number, startDate?: string, endDate?: string, timeRange?: string): Promise<any[]>
   getYearlySummary(objectId: number, year: number): Promise<any>
   ```

7. **Settings Management** (6 methods, lines 122-131)
   ```typescript
   getSettings(filters: {...}): Promise<Settings[]>
   getSetting(category: string, keyName: string, userId?: string, mandantId?: number): Promise<Settings | undefined>
   getSettingById(id: number): Promise<Settings | undefined>
   createSetting(setting: InsertSettings): Promise<Settings>
   updateSetting(id: number, setting: Partial<InsertSettings>): Promise<Settings>
   deleteSetting(id: number): Promise<void>
   clearAllSettings(): Promise<void>
   ```

8. **Logbook Management** (5 methods, lines 134-143)
   ```typescript
   getLogbookEntries(filters?: {...}): Promise<LogbookEntry[]>
   getLogbookEntry(id: number): Promise<LogbookEntry | undefined>
   createLogbookEntry(entry: InsertLogbookEntry): Promise<LogbookEntry>
   updateLogbookEntry(id: number, entry: Partial<InsertLogbookEntry>): Promise<LogbookEntry>
   deleteLogbookEntry(id: number): Promise<void>
   ```

9. **Todo Tasks Management** (5 methods, lines 146-155)
   ```typescript
   getTodoTasks(filters?: {...}): Promise<TodoTask[]>
   getTodoTask(id: number): Promise<TodoTask | undefined>
   createTodoTask(task: InsertTodoTask): Promise<TodoTask>
   updateTodoTask(id: number, task: Partial<InsertTodoTask>): Promise<TodoTask>
   deleteTodoTask(id: number): Promise<void>
   ```

10. **Object Groups** (4 methods, lines 158-161)
    ```typescript
    getObjectGroups(): Promise<ObjectGroup[]>
    createObjectGroup(group: InsertObjectGroup): Promise<ObjectGroup>
    updateObjectGroup(id: number, group: Partial<InsertObjectGroup>): Promise<ObjectGroup>
    deleteObjectGroup(id: number): Promise<void>
    ```

11. **Temperature Management** (8 methods, lines 164-171)
    ```typescript
    getDailyOutdoorTemperatures(postalCode?: string, startDate?: Date, endDate?: Date): Promise<DailyOutdoorTemperature[]>
    getDailyOutdoorTemperature(id: number): Promise<DailyOutdoorTemperature | undefined>
    createDailyOutdoorTemperature(temperature: InsertDailyOutdoorTemperature): Promise<DailyOutdoorTemperature>
    updateDailyOutdoorTemperature(id: number, temperature: Partial<InsertDailyOutdoorTemperature>): Promise<DailyOutdoorTemperature>
    deleteDailyOutdoorTemperature(id: number): Promise<void>
    getTemperaturesByPostalCode(postalCode: string, startDate?: Date, endDate?: Date): Promise<DailyOutdoorTemperature[]>
    getLatestTemperatureForPostalCode(postalCode: string): Promise<DailyOutdoorTemperature | undefined>
    getTemperaturesForObjectPostalCodes(objectIds?: number[]): Promise<DailyOutdoorTemperature[]>
    ```

12. **Monitoring & Alerts** (5 methods, lines 174-178)
    ```typescript
    getCriticalSystems(): Promise<any[]>
    getSystemsByEnergyClass(): Promise<any[]>
    getSystemAlerts(systemId?: number, unresolved?: boolean): Promise<any[]>
    createSystemAlert(alert: any): Promise<any>
    resolveAlert(id: number, userId: string): Promise<any>
    ```

13. **User Activity Logging** (1 method, lines 189-197)
    ```typescript
    logUserActivity(activity: {...}): Promise<void>
    ```

---

## DatabaseStorage Implementation

### Class Structure (Lines 200-3959)

```typescript
export class DatabaseStorage implements IStorage {
  // 93 async methods implementing IStorage interface
}
```

### Database Access Patterns

#### Pattern 1: Drizzle ORM (Primary)
**Usage**: 47 methods
**Evidence**: Lines using `getDb().select().from(...)`

**Example** (lines 202-225):
```typescript
async getUser(id: string): Promise<User | undefined> {
  const [result] = await getDb()
    .select()
    .from(users)
    .where(eq(users.id, id));

  if (!result) return undefined;

  // Separate profile loading to avoid Drizzle join errors
  let userProfile = null;
  if (result.userProfileId) {
    const [profile] = await getDb()
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, result.userProfileId));
    userProfile = profile || null;
  }

  return {
    ...result,
    userProfile,
  } as any;
}
```

**Key Observation**: Avoids JOIN operations due to Drizzle errors (comments at lines 203, 228, 254, 278)

#### Pattern 2: Direct Pool Queries (Fallback)
**Usage**: 46 methods
**Evidence**: `ConnectionPoolManager.getInstance().getPool()`

**Example** (lines 448-455):
```typescript
async deleteUser(id: string): Promise<void> {
  try {
    const pool = await ConnectionPoolManager.getInstance().getPool();
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  } catch (error) {
    console.error('Error deleting user from Portal-DB:', error);
    // Fallback to development DB
    await getDb().delete(users).where(eq(users.id, id));
  }
}
```

**Pattern**: Try Portal-DB first, fallback to local DB

#### Pattern 3: Raw SQL Queries (Complex Operations)
**Usage**: 48 instances
**Evidence**: `pool.query(...)` with SQL strings

**Example** (lines 461-476):
```typescript
async getUserProfiles(): Promise<UserProfile[]> {
  try {
    const pool = await ConnectionPoolManager.getInstance().getPool();
    const result = await pool.query(
      'SELECT id, name, start_page, sidebar, created_at, updated_at FROM user_profiles ORDER BY name'
    );
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      startPage: row.start_page,
      sidebar: row.sidebar,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching user profiles from Portal-DB:', error);
    // Fallback to development DB
    return await getDb().select().from(userProfiles).orderBy(userProfiles.name);
  }
}
```

---

## Error Handling Strategy

### Try-Catch Blocks: 63 instances

**Pattern**: Portal-DB → Fallback → Local DB

**Example Structure**:
```typescript
try {
  // Attempt Portal-DB operation
  const pool = ConnectionPoolManager.getInstance().getPool();
  const result = await pool.query('...');
  return result.rows;
} catch (error) {
  console.error('Error from Portal-DB:', error);
  // Fallback to local development DB
  return await getDb().select().from(table);
}
```

**Evidence**: Lines 459-476, 495-523, 579-602

---

## Special Implementation Patterns

### 1. User ID Sequence (Lines 371-402)

**Purpose**: Auto-incrementing user IDs starting from 100

```typescript
async upsertUser(userData: UpsertUser): Promise<User> {
  if (!userData.id) {
    // Create sequence if not exists
    try {
      await getDb().execute(sql`CREATE SEQUENCE IF NOT EXISTS user_id_seq START 100 INCREMENT 1`);
    } catch (e) {
      console.log("SEQUENCE bereits vorhanden oder erstellt");
    }

    // Get next ID from sequence
    const result = await getDb().execute(sql`SELECT nextval('user_id_seq') as next_id`);
    const nextId = Number(result.rows[0].next_id);

    const [user] = await getDb()
      .insert(users)
      .values({ ...userData, id: nextId.toString() })
      .returning();
    return user;
  }

  // Update existing user
  const [user] = await getDb()
    .update(users)
    .set({
      ...userData,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userData.id))
    .returning();
  return user;
}
```

### 2. MandantAccess Array Handling (Lines 411-433)

**Purpose**: Parse and validate multi-tenant access arrays

```typescript
async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
  const cleanUserData = { ...userData } as any;
  delete cleanUserData.groupIds;
  delete cleanUserData.autoId;

  // Convert mandantAccess to proper array
  if (cleanUserData.mandantAccess !== undefined) {
    // Empty object {} → empty array []
    if (typeof cleanUserData.mandantAccess === 'object' &&
        !Array.isArray(cleanUserData.mandantAccess) &&
        Object.keys(cleanUserData.mandantAccess).length === 0) {
      cleanUserData.mandantAccess = [];
    }
    // String → parse JSON
    else if (typeof cleanUserData.mandantAccess === 'string') {
      try {
        const parsed = JSON.parse(cleanUserData.mandantAccess);
        cleanUserData.mandantAccess = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Error parsing mandantAccess:', e);
        cleanUserData.mandantAccess = [];
      }
    }
    // Ensure all values are numbers
    if (Array.isArray(cleanUserData.mandantAccess)) {
      cleanUserData.mandantAccess = cleanUserData.mandantAccess.map(Number).filter((n: number) => !isNaN(n));
    }
  }

  const [user] = await getDb()
    .update(users)
    .set({
      ...cleanUserData,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();
  return user;
}
```

### 3. Energy Data External Integration (Lines 2126-2270)

**Purpose**: Query external PostgreSQL database for energy data

**Evidence**:
- External database connection via ConnectionPoolManager
- Complex meter data queries
- Monthly consumption aggregation

---

## Dependencies

### Internal Dependencies (Lines 1-43)

```typescript
import {
  users, userProfiles, userActivityLogs, mandants, objects,
  dayComp, settings, logbookEntries, todoTasks,
  dailyOutdoorTemperatures, systemAlerts,
  objectGroups, objectMandant,
  type User, type UserProfile, type Mandant, type ObjectType,
  // ... 20+ type imports
} from "@shared/schema";

import { getDb, db } from "./db";
import { eq, desc, and, gte, lte, count, sql, arrayContains, asc, inArray, or, SQL } from "drizzle-orm";
import { ConnectionPoolManager } from "./connection-pool";
```

### External Dependencies
- **drizzle-orm**: 10 query operators imported
- **@shared/schema**: 40+ types and table definitions
- **./db**: Database connection singleton
- **./connection-pool**: Connection pool manager singleton

---

## Critical Observations

### 1. File Size Issue
- **3,961 lines** - Largest file in codebase
- **93 methods** - Violates Single Responsibility Principle
- **Recommendation**: Split into domain-specific services

### 2. Dual Database Architecture
- **Portal-DB**: Production database (external)
- **Local DB**: Development fallback
- **Pattern**: Try Portal-DB → catch → fallback to Local

### 3. Drizzle ORM Limitations
- **JOIN errors**: Documented in comments (lines 203, 228, 254, 278)
- **Workaround**: Separate queries for related data
- **Impact**: N+1 query problem for user profiles

### 4. Error Handling Consistency
- **63 try-catch blocks** - Good error coverage
- **All errors logged** - Comprehensive logging
- **Non-fatal failures** - Graceful degradation to fallback DB

### 5. Type Safety Concerns
- **10 instances of `as any`** type assertions
- **Evidence**: Lines 224, 249, 274, 303, 333, 365
- **Risk**: Bypasses TypeScript type checking

---

## Controller Layer Analysis

### Controllers Overview

| Controller | Lines | Pattern | Methods | Export |
|------------|-------|---------|---------|--------|
| authController.ts | 423 | Object | 5 | `export const authController = {...}` |
| databaseController.ts | 636 | Object | 16 | `export const databaseController = {...}` |
| efficiencyController.ts | 383 | Class | 1 | `export const efficiencyController = new EfficiencyController()` |
| energyController.ts | 1,088 | Class | 12 | `export const energyController = new EnergyController()` |
| kiReportController.ts | 367 | Class | 3 | `export const kiReportController = new KIReportController(storage)` |
| monitoringController.ts | 101 | Class | 3 | `export const monitoringController = new MonitoringController()` |
| objectController.ts | 387 | Class | 10 | `export const objectController = new ObjectController(storage)` |
| temperatureController.ts | 304 | Class | 9 | `export const temperatureController = new TemperatureController(storage)` |
| userController.ts | 377 | Class | 10 | `export const userController = new UserController()` |
| weatherController.ts | 443 | Class | 9 | `export const weatherController = new WeatherController()` |

**Total**: 4,509 lines across 10 controllers
**Pattern Mix**: 2 object-based, 8 class-based
**Total Methods**: 78 async methods

---

## Controller Pattern Analysis

### Pattern 1: Object-Based (authController, databaseController)

**Example** (authController.ts lines 7-94):
```typescript
export const authController = {
  superadminLogin: asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      throw createValidationError("Benutzername und Passwort erforderlich");
    }

    // Check setup-app.json for Superadmin credentials
    try {
      const configPath = join(process.cwd(), 'server', 'setup-app.json');
      const configData = readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);

      if (config['Login-user']?.enabled && config['Login-user']?.check_superadmin && config.Superadmin) {
        for (const adminEntry of config.Superadmin) {
          const adminUsername = Object.keys(adminEntry)[0];
          const adminPassword = adminEntry[adminUsername];

          if (username === adminUsername && password === adminPassword) {
            isValidSuperadmin = true;
            break;
          }
        }
      }
    } catch (configError) {
      console.error('❌ Error reading setup-app.json for Superadmin check:', configError);
    }

    // Check environment variables
    if (!isValidSuperadmin) {
      const envSuperadminUser = process.env.SUPERADMIN_USERNAME;
      const envSuperadminPass = process.env.SUPERADMIN_PASSWORD;

      if (envSuperadminUser && envSuperadminPass) {
        if (username === envSuperadminUser && password === envSuperadminPass) {
          isValidSuperadmin = true;
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
  // ... more methods
}
```

**Characteristics**:
- Methods wrapped in `asyncHandler()` middleware
- Direct use of `throw createAuthError()` / `createValidationError()`
- No constructor, no instance variables
- Stateless functional approach

### Pattern 2: Class-Based (8 controllers)

**Example** (energyController.ts lines 5-42):
```typescript
class EnergyController {
  /**
   * API: GET /api/energy/heating-systems
   * Parameter: Keine URL-Parameter, Session-basierte Authentifizierung
   * Zweck: Lädt alle Heizsysteme (Objekte) für den authentifizierten Benutzer
   * Auth: Erfordert Session mit user.mandantId und user.role
   * Rückgabe: Array von Heizsystemen
   * DB-Zugriff: storage.getObjects() mit Mandanten-Filterung
   */
  async getHeatingSystems(req: Request, res: Response) {
    try {
      const user = (req as any).session?.user;

      // Check if user is authenticated
      if (!user) {
        return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
      }

      // Get objects that represent heating systems
      const systems = await storage.getObjects(user.mandantId, user.role !== 'admin');

      // Transform to heating systems format
      const heatingSystems = systems.map(system => ({
        id: system.id,
        name: system.name,
        systemId: system.id.toString(),
        location: system.description || 'Nicht spezifiziert',
        type: 'Wärmesystem',
        status: 'active',
        mandantId: system.mandantId
      }));

      res.json(heatingSystems);
    } catch (error) {
      console.error('Error fetching heating systems:', error);
      res.status(500).json({ message: "Fehler beim Laden der Heizsysteme" });
    }
  }
  // ... more methods
}

export const energyController = new EnergyController();
```

**Characteristics**:
- Manual try-catch in each method
- Manual status code and error message handling
- Constructor with optional storage injection
- Export as singleton instance

---

## Authentication Patterns in Controllers

### Pattern 1: Session-Based Auth (Most common)
```typescript
const user = (req as any).session?.user;

if (!user) {
  return res.status(401).json({ message: "Benutzer nicht authentifiziert" });
}
```

**Evidence**: energyController.ts:16-21, kiReportController.ts:14-19

### Pattern 2: Request User Property
```typescript
const user = (req as any).user || (req.session as any)?.user;
```

**Evidence**: kiReportController.ts:14

### Pattern 3: No Authentication
**Evidence**: weatherController (all methods), temperatureController (some methods)

---

## Permission Checking Patterns

### Pattern 1: Mandant-Based Access Control
```typescript
// Check permissions
if (user.role !== 'admin' && system.mandantId !== user.mandantId) {
  return res.status(403).json({ message: "Keine Berechtigung für dieses System" });
}
```

**Evidence**: energyController.ts:88-91

### Pattern 2: MandantAccess Array Check
```typescript
// Check permissions (mit mandantAccess)
if (user.role !== 'admin' && object.mandantId !== user.mandantId) {
  const hasAccess = user.mandantAccess && user.mandantAccess.includes(object.mandantId);
  if (!hasAccess) {
    res.status(403).json({ message: "Keine Berechtigung für dieses Objekt" });
    return;
  }
}
```

**Evidence**: kiReportController.ts:45-52

### Pattern 3: Database-Level Filtering
```typescript
const systems = await storage.getObjects(user.mandantId, user.role !== 'admin');
```

**Evidence**: energyController.ts:24

---

## External Integrations

### 1. Weather Data API
**File**: weatherController.ts:174
**Type**: HTTP fetch to localhost
**Purpose**: Test Portal-DB connection status

```typescript
const dbStatus = await fetch('http://localhost:5000/api/database/status');
const status = await dbStatus.json();

if (!status.settingdbOnline) {
  // Handle offline status
}
```

**Note**: Self-referential API call (internal health check)

### 2. External Database Connections
**Usage**: 46 instances via ConnectionPoolManager
**Pattern**: Query external PostgreSQL database for production data
**Evidence**: storage.ts uses `ConnectionPoolManager.getInstance().getPool()`

---

## Business Logic Observations

### 1. German Language
**Evidence**: Throughout all files
- Error messages: "Benutzer nicht authentifiziert", "Keine Berechtigung"
- Comments: "Zweck:", "Rückgabe:", "DB-Zugriff:"
- Variable names: mandantId, heizsysteme, außentemperaturen

### 2. Comprehensive JSDoc Comments
**Pattern**: Every controller method documented
```typescript
/**
 * API: GET /api/energy/heating-systems
 * Parameter: Keine URL-Parameter, Session-basierte Authentifizierung
 * Zweck: Lädt alle Heizsysteme (Objekte) für den authentifizierten Benutzer
 * Auth: Erfordert Session mit user.mandantId und user.role
 * Rückgabe: Array von Heizsystemen
 * DB-Zugriff: storage.getObjects() mit Mandanten-Filterung
 */
```

**Evidence**: All controllers have this pattern

### 3. Superadmin Special Role
**Implementation**: authController.ts:16-94
**Features**:
- Reads credentials from setup-app.json
- Fallback to environment variables
- Creates special session with id 'superadmin'
- No mandantId restriction
- Full system access

### 4. Multi-Database Architecture
**Primary DB**: Portal-DB (production, external)
**Fallback DB**: Local development database
**Strategy**: Try Portal-DB → catch → use Local DB

**Evidence**: 46 instances in storage.ts

---

## Code Quality Issues

### 1. Inconsistent Error Handling
- **authController, databaseController**: Use `asyncHandler()` wrapper
- **8 class-based controllers**: Manual try-catch blocks
- **Impact**: Inconsistent error response format

### 2. Type Safety Concerns
- **10 `as any` assertions** in storage.ts
- **Request type casting**: `(req as any).session?.user`
- **Impact**: Bypasses TypeScript type checking

### 3. Mixed Authentication Patterns
- Some routes check `req.session.user`
- Some check `req.user`
- Some check both with fallback
- **Impact**: Potential security inconsistencies

### 4. Large Controller Methods
- kiReportController: Single method with 300+ lines (lines 10-368)
- energyController: Methods with 100+ lines
- **Impact**: Hard to test, maintain, refactor

### 5. Hardcoded Values
- Port: `http://localhost:5000` (weatherController.ts:174)
- User ID sequence start: 100 (storage.ts:376)
- **Impact**: Not configurable via environment

---

## Service Dependencies

### Storage → Database
```
storage.ts (3,961 lines)
  ├─> db.ts (getDb())
  ├─> connection-pool.ts (ConnectionPoolManager)
  └─> @shared/schema (40+ types)
```

### Controllers → Storage
```
10 Controllers (4,509 lines)
  └─> storage.ts (import { storage })
      └─> DatabaseStorage class instance
```

### Controllers → Connection Pool (Direct)
**Usage**: 3 controllers bypass storage layer
- energyController.ts:68
- kiReportController.ts:24
- Additional instances in other controllers

**Pattern**: Direct pool queries for complex operations
```typescript
const pool = ConnectionPoolManager.getInstance().getPool();
const objectQuery = `SELECT o.*, COALESCE(om.mandant_id, o.mandant_id) as mandantId ...`;
const objectResult = await pool.query(objectQuery, [parseInt(systemId as string)]);
```

---

## Recommendations

### 1. Split Storage Service
**Current**: 3,961 lines, 93 methods in single file
**Proposed**: Split by domain
- userStorage.ts (user + profile operations)
- mandantStorage.ts (tenant operations)
- objectStorage.ts (object + hierarchy operations)
- energyStorage.ts (energy data operations)
- settingsStorage.ts (settings + logs + todos)
- monitoringStorage.ts (alerts + KPIs)

### 2. Standardize Error Handling
**Option 1**: Use asyncHandler() everywhere
**Option 2**: Implement Express error middleware
**Goal**: Consistent error response format

### 3. Centralize Authentication
**Create**: auth middleware for all protected routes
**Standardize**: Single pattern for user extraction
**Implement**: Consistent permission checking

### 4. Type Safety Improvements
- Remove all `as any` assertions
- Create proper type guards
- Use discriminated unions for user roles
- Type session object properly

### 5. Extract Complex Methods
- Break down 300+ line methods into smaller functions
- Extract business logic from controllers
- Create domain services layer

### 6. Configuration Management
- Move all hardcoded values to environment variables
- Create config service
- Validate configuration at startup

---

## External API Summary

**Total External Calls**: 1 (self-referential health check)
**External Databases**: 1 (Portal-DB via ConnectionPoolManager)
**Third-Party APIs**: None detected

**Note**: kiReportController name suggests AI integration, but no OpenAI API calls found in current implementation. The kianalyse JSONB fields in database schema suggest AI features are database-stored, not API-driven.

---

## Next Phase

**PHASE 2.5: Authentication & Authorization Analysis**
- Analyze middleware/auth.ts
- Document session management
- Review auth.ts implementation
- Map authentication flows
- Identify authorization patterns

---

## Summary Statistics

| Metric | Count | Evidence |
|--------|-------|----------|
| **Service Methods** | 93 | IStorage interface (lines 45-198) |
| **Service Lines** | 3,961 | storage.ts total |
| **Controllers** | 10 | Controllers directory |
| **Controller Lines** | 4,509 | Combined total |
| **Controller Methods** | 78 | Async methods across controllers |
| **Try-Catch Blocks** | 63+ | Storage service error handling |
| **Direct Pool Queries** | 46 | ConnectionPoolManager usage |
| **Type Assertions** | 10+ | `as any` instances |
| **External API Calls** | 1 | Self-referential health check |
| **Database Connections** | 2 | Portal-DB + Local DB |

---

## Critical Files for Modularization

1. **storage.ts** (3,961 lines) - MUST split into domain services
2. **energyController.ts** (1,088 lines) - Largest controller, needs refactoring
3. **databaseController.ts** (636 lines) - Database management logic
4. **authController.ts** (423 lines) - Authentication logic
5. **weatherController.ts** (443 lines) - External integration patterns

---

## PHASE 2.4 COMPLETE ✅

**Files Analyzed**: 11 (1 service + 10 controllers)
**Total Lines Analyzed**: 8,470 lines
**Methods Documented**: 171 methods
**Patterns Identified**: 6 major patterns
**Issues Found**: 6 categories

**Status**: Ready for PHASE 2.5 Authentication Analysis

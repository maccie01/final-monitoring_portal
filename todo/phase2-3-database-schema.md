# PHASE 2.3: Data Layer Architecture - Database Schema

Created: 2025-10-07
Timestamp: 14:15:00

## Database Configuration

**File**: `/server/db.ts`
**Lines**: 53
**Size**: 1,618 bytes

### Database Type: **PostgreSQL**

**ORM**: Drizzle ORM (drizzle-orm/node-postgres)
**Connection**: Connection pooling via ConnectionPoolManager

---

## Database Initialization (server/db.ts)

### Imports (Lines 1-4)

```typescript
import { Pool as PgPool } from 'pg';                    // Line 1 - PostgreSQL client
import { drizzle } from 'drizzle-orm/node-postgres';    // Line 2 - Drizzle adapter
import * as schema from "@shared/schema";               // Line 3 - Schema definitions
import { ConnectionPoolManager } from './connection-pool'; // Line 4 - Pool manager
```

### Module State (Lines 6-9)

```typescript
let poolManager: ConnectionPoolManager | null = null;   // Line 7
let pool: PgPool | null = null;                         // Line 8
let db: ReturnType<typeof drizzle> | null = null;      // Line 9
```

**Pattern**: Singleton instances, null until initialized

### Initialization Function (Lines 12-23)

```typescript
export async function initializeDatabase(): Promise<void> {
  if (poolManager) {
    return; // Already initialized                      // Line 14
  }

  console.log('🔄 Initializing database connection...');  // Line 17
  poolManager = ConnectionPoolManager.getInstance();     // Line 18
  await poolManager.initialize();                        // Line 19
  pool = poolManager.getPool();                          // Line 20
  db = drizzle(pool, { schema });                        // Line 21
  console.log('✅ Database connection pool ready');      // Line 22
}
```

**Process**:
1. Check if already initialized (singleton guard)
2. Get ConnectionPoolManager singleton
3. Initialize pool manager
4. Get PostgreSQL pool
5. Create Drizzle instance with schema
6. Log success

**Evidence**: Called from server/index.ts:44

---

### Export Functions (Lines 26-46)

**getPool()** (Lines 26-31):
```typescript
export function getPool(): PgPool {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}
```
**Returns**: PostgreSQL Pool instance
**Throws**: If not initialized

**getDb()** (Lines 33-38):
```typescript
export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}
```
**Returns**: Drizzle ORM instance
**Throws**: If not initialized

**getPoolManager()** (Lines 41-46):
```typescript
export function getPoolManager(): ConnectionPoolManager {
  if (!poolManager) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return poolManager;
}
```
**Returns**: ConnectionPoolManager instance
**Throws**: If not initialized

---

## Database Schema Overview

**File**: `/shared/schema.ts`
**Lines**: 965
**Size**: 37,150 bytes

### Schema Structure

**Total Tables**: 20
**Total Relations**: 7
**Total Validation Schemas**: 3

---

## Complete Table Inventory

| # | Table Name | Line | Rows Est. | Purpose |
|---|------------|------|-----------|---------|
| 1 | `sessions` | 22 | Variable | Session storage (express-session) |
| 2 | `user_profiles` | 34 | < 100 | User profile templates with permissions |
| 3 | `users` | 57 | < 1000 | User accounts and authentication |
| 4 | `mandants` | 77 | < 100 | Tenants/organizations |
| 5 | `objects` | 102 | 1000+ | Buildings/monitoring objects |
| 6 | `object_mandant` | 159 | 1000+ | Object-mandant associations (legacy) |
| 7 | `system_alerts` | 176 | Variable | System alerts and warnings |
| 8 | `day_comp` | 189 | 100,000+ | Daily energy consumption data |
| 9 | `view_mon_comp` | 227 | 10,000+ | Monthly consumption view |
| 10 | `settings` | 243 | < 1000 | System settings key-value store |
| 11 | `logbook_entries` | 260 | 10,000+ | System logbook |
| 12 | `todo_tasks` | 305 | Variable | Task management |
| 13 | `object_groups` | 325 | < 100 | Object grouping |
| 14 | `collaboration_annotations` | 335 | Variable | Collaboration annotations |
| 15 | `annotation_reactions` | 380 | Variable | Reactions to annotations |
| 16 | `annotation_subscriptions` | 392 | Variable | Annotation subscriptions |
| 17 | `agents` | 474 | < 100 | AI agents configuration |
| 18 | `agent_logs` | 505 | 10,000+ | AI agent activity logs |
| 19 | `daily_outdoor_temperatures` | 534 | 100,000+ | Weather/temperature data |
| 20 | `user_activity_logs` | 757 | 100,000+ | User activity tracking |

---

## Detailed Table Analysis

### 1. sessions (Lines 22-30)

**Purpose**: Express session storage
**Storage Engine**: connect-pg-simple

```typescript
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),         // Session ID
    sess: jsonb("sess").notNull(),            // Session data
    expire: timestamp("expire").notNull(),    // Expiration time
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);
```

**Indexes**:
- Primary key on `sid`
- Index on `expire` (for cleanup queries)

**Evidence**: Used by express-session middleware (package.json:74, connect-pg-simple:67)

---

### 2. user_profiles (Lines 34-54)

**Purpose**: Profile templates with sidebar permissions
**German Comment**: Line 33 - "Profilnamen und Sidebar-Zugriffsberechtigungen"

```typescript
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  startPage: varchar("start_page", { length: 100 }).default("/maps"),
  sidebar: jsonb("sidebar").$type<{
    showDashboard?: boolean;
    showMaps?: boolean;
    showNetworkMonitor?: boolean;
    showEfficiencyStrategy?: boolean;
    showObjectManagement?: boolean;
    showLogbook?: boolean;
    showGrafanaDashboards?: boolean;
    showEnergyData?: boolean;
    showSystemSetup?: boolean;
    showUserManagement?: boolean;
    showUser?: boolean;
    showEfficiencyModule?: boolean;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Fields**:
- `id` - Serial primary key
- `name` - Unique profile name
- `startPage` - Default landing page (default: "/maps")
- `sidebar` - JSONB permissions object (12 permission flags)
- `createdAt`, `updatedAt` - Timestamps

**Sidebar Permissions** (12 flags):
1. showDashboard
2. showMaps
3. showNetworkMonitor
4. showEfficiencyStrategy
5. showObjectManagement
6. showLogbook
7. showGrafanaDashboards
8. showEnergyData
9. showSystemSetup
10. showUserManagement
11. showUser
12. showEfficiencyModule

**Evidence**: Used in routes/index.ts:200-261

---

### 3. users (Lines 57-72)

**Purpose**: User accounts and authentication
**German Comment**: Line 56 - "Zentrale Benutzerverwaltung (Schema exakt nach Dokumentation)"

```typescript
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),                    // VARCHAR Primary Key
  username: varchar("username", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
  password: varchar("password", { length: 255 }),
  role: varchar("role", { length: 50 }).default("user"),
  mandantId: integer("mandant_id").default(1),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url"),
  userProfileId: integer("user_profile_id"),
  address: jsonb("address"),
  mandantAccess: jsonb("mandant_access").default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Key Fields**:
- `id` - VARCHAR primary key (not serial)
- `username`, `email` - Unique identifiers
- `password` - Hashed password (bcryptjs)
- `role` - VARCHAR role (not enum): "user", "admin", "superadmin"
- `mandantId` - Default mandant (default: 1)
- `userProfileId` - Foreign key to user_profiles
- `mandantAccess` - JSONB array for multi-tenant access
- `address` - JSONB address object

**Authentication**: Password hashed with bcryptjs (package.json:62)
**Evidence**: Used by authController, userController

---

### 4. mandants (Lines 77-98)

**Purpose**: Tenants/organizations (German: Mandanten)

```typescript
export const mandants = pgTable("mandants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  info: jsonb("info").$type<{
    adresse?: {
      strasse?: string;
      hausnummer?: string;
      plz?: string;
      ort?: string;
      land?: string;
    };
    kontakt?: {
      email?: string;
      telefon?: string;
      mobil?: string;
      website?: string;
    };
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**JSONB Structure**:
- `adresse` - Address (street, number, postal code, city, country)
- `kontakt` - Contact info (email, phone, mobile, website)

**Evidence**: Multi-tenant system design

---

### 5. objects (Lines 102-156)

**Purpose**: Monitoring objects (buildings, facilities)
**German Comment**: Line 101 - "Zentrale Objekt-Verwaltung (Schema exakt nach Dokumentation)"

```typescript
export const objects = pgTable("objects", {
  id: serial("id").primaryKey(),
  objectid: bigint("objectid", { mode: "bigint" }).unique().notNull(),
  name: varchar("name", { length: 255 }),
  objectType: varchar("object_type", { length: 50 }),
  status: varchar("status", { length: 50 }).default("active"),

  // Address and location
  postalCode: varchar("postal_code", { length: 10 }),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Deutschland"),

  // Geographic coordinates
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),

  description: text("description"),

  // JSONB data fields (15 fields!)
  objdata: jsonb("objdata"),
  objanlage: jsonb("objanlage"),
  portdata: jsonb("portdata"),
  meter: jsonb("meter"),
  dashboard: jsonb("dashboard"),
  alarm: jsonb("alarm"),
  kianalyse: jsonb("kianalyse"),
  statusdata: jsonb("statusdata"),
  auswertung: jsonb("auswertung"),
  report: jsonb("report"),
  diagramm: jsonb("diagramm"),
  fltemp: jsonb("fltemp"),          // Flow temperature
  rttemp: jsonb("rttemp"),          // Return temperature
  energy: jsonb("energy"),

  temperaturGrenzwert: varchar("temperatur_grenzwert", { length: 50 }),
  mandantAccess: jsonb("mandant_access").default("[]"),
  mandantId: integer("mandant_id"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_objects_objectid").on(table.objectid),
  index("idx_objects_mandant_id").on(table.mandantId),
  index("idx_objects_type").on(table.objectType),
  index("idx_objects_status").on(table.status),
  index("idx_objects_city").on(table.city),
  index("idx_objects_postal_code").on(table.postalCode),
]);
```

**Key Design Decisions**:
- **objectid** (bigint) - Unique business ID, separate from serial `id`
- **15 JSONB fields** - Extreme flexibility for various data types
- **Geographic data** - lat/long for mapping
- **Multi-tenant** - mandantAccess JSONB array

**Indexes**: 6 indexes for performance
1. objectid (unique business ID)
2. mandantId (tenant filtering)
3. objectType (type filtering)
4. status (active/inactive)
5. city (location queries)
6. postalCode (weather correlation)

**JSONB Fields** (German names):
- objdata - Object data
- objanlage - System/installation data
- portdata - Port/interface data
- meter - Meter readings
- dashboard - Dashboard config
- alarm - Alarm data
- kianalyse - AI analysis data
- statusdata - Status information
- auswertung - Evaluation data
- report - Report data
- diagramm - Diagram/chart config
- fltemp - Flow temperature (heating)
- rttemp - Return temperature (heating)
- energy - Energy data

**Evidence**: Central to entire monitoring system

---

### 6. object_mandant (Lines 159-169)

**Purpose**: Object-mandant associations (DEPRECATED)
**Comment**: Line 158 - "ÜBERFLÜSSIG - ersetzt durch objects.mandant_access"
**Translation**: "OBSOLETE - replaced by objects.mandant_access"

```typescript
export const objectMandant = pgTable("object_mandant", {
  id: serial("id").primaryKey(),
  objectId: bigint("objectid", { mode: "bigint" }).notNull().unique(),
  mandantId: integer("mandant_id").notNull(),
  mandantRole: varchar("mandant_role", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_object_mandant_objectid").on(table.objectId),
  index("idx_object_mandant_mandant_id").on(table.mandantId),
]);
```

**Status**: Legacy table, replaced by JSONB mandantAccess in objects table
**Evidence**: Still defined but marked as obsolete

---

### 7. system_alerts (Lines 176-185)

**Purpose**: System alerts and warnings

```typescript
export const systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  alertType: varchar("alert_type", { length: 255 }),
  message: text("message").notNull(),
  objectId: bigint("object_id", { mode: "bigint" }),
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Alert Lifecycle**:
- Created with isResolved=false
- Can be resolved (sets resolvedAt, resolvedBy)
- Links to objects via objectId

---

### 8. day_comp (Lines 189-226)

**Purpose**: Daily energy consumption data
**German Comment**: Line 188 - "Tagesverbrauchsdaten (Schema exakt nach Dokumentation)"

```typescript
export const dayComp = pgTable("day_comp", {
  counter: serial("counter").primaryKey(),
  time: timestamp("_time").notNull(),
  id: bigint("id", { mode: "bigint" }).notNull(),
  log: bigint("log", { mode: "bigint" }).notNull(),  // Object ID
  tpl: text("tpl"),

  // Energy meter data
  enFirst: doublePrecision("en_first"),
  enLast: doublePrecision("en_last"),
  en2First: doublePrecision("en2_first"),
  en2Last: doublePrecision("en2_last"),

  // Volume meter data (20+ fields)
  // ... (full listing in schema)

  // Temperature data
  flFirst: doublePrecision("fl_first"),      // Flow temp first
  flLast: doublePrecision("fl_last"),        // Flow temp last
  rtFirst: doublePrecision("rt_first"),      // Return temp first
  rtLast: doublePrecision("rt_last"),        // Return temp last

  // Calculated values
  calc1: doublePrecision("calc1"),
  calc2: doublePrecision("calc2"),
  calc3: doublePrecision("calc3"),
  calc4: doublePrecision("calc4"),
});
```

**Data Points** (30+ fields):
- Energy meters (4 fields: first/last for 2 meters)
- Volume meters (20+ fields)
- Temperature readings (4 fields: flow/return, first/last)
- Calculated values (4 fields)

**Estimated Size**: 100,000+ rows (daily records for all objects over years)

---

### 9. view_mon_comp (Lines 227-242)

**Purpose**: Monthly consumption view/aggregate

```typescript
export const viewMonComp = pgTable("view_mon_comp", {
  counter: serial("counter").primaryKey(),
  time: timestamp("_time").notNull(),
  id: bigint("id", { mode: "bigint" }).notNull(),
  log: bigint("log", { mode: "bigint" }).notNull(),
  tpl: text("tpl"),
  enFirst: doublePrecision("en_first"),
  enLast: doublePrecision("en_last"),
  en2First: doublePrecision("en2_first"),
  en2Last: doublePrecision("en2_last"),
  vlFirst: doublePrecision("vl_first"),
  vlLast: doublePrecision("vl_last"),
  fl: doublePrecision("fl"),
  rt: doublePrecision("rt"),
});
```

**Pattern**: Similar to day_comp but monthly aggregates
**Estimated Size**: 10,000+ rows

---

### 10. settings (Lines 243-259)

**Purpose**: System settings key-value store

```typescript
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  keyName: varchar("key_name", { length: 100 }).notNull(),
  value: text("value"),
  label: text("label"),
  description: text("description"),
  dataType: varchar("data_type", { length: 50 }).default("string"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_settings_category_key").on(table.category, table.keyName),
]);
```

**Structure**: Category + Key + Value pattern
**Index**: Composite index on (category, keyName)
**Evidence**: Used by databaseController (db.ts:20-22)

---

### 11. logbook_entries (Lines 260-304)

**Purpose**: System logbook with rich data

```typescript
export const logbookEntries = pgTable("logbook_entries", {
  id: serial("id").primaryKey(),
  objectId: bigint("object_id", { mode: "bigint" }),
  mandantId: integer("mandant_id"),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: varchar("created_by"),
  assignedTo: varchar("assigned_to"),
  status: varchar("status", { length: 50 }).default("open"),
  priority: varchar("priority", { length: 20 }).default("normal"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  tags: text("tags"),
  attachments: text("attachments"),
  metadata: jsonb("metadata"),
  relatedEntryId: integer("related_entry_id"),
  visibility: varchar("visibility", { length: 20 }).default("private"),
  notifyUsers: text("notify_users"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_logbook_object_id").on(table.objectId),
  index("idx_logbook_mandant_id").on(table.mandantId),
  index("idx_logbook_status").on(table.status),
  index("idx_logbook_created_at").on(table.createdAt),
]);
```

**Features**:
- Task management (status, priority, dueDate)
- Assignment (createdBy, assignedTo)
- Rich content (attachments, metadata JSONB)
- Relationships (relatedEntryId)
- Visibility control
- 4 indexes for performance

**Estimated Size**: 10,000+ rows

---

### 12. todo_tasks (Lines 305-324)

**Purpose**: Task management

```typescript
export const todoTasks = pgTable("todo_tasks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("pending"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Status Values**: pending, in_progress, completed
**Priority Values**: low, medium, high

---

### 13-20. Additional Tables (Summary)

| Table | Lines | Purpose |
|-------|-------|---------|
| object_groups | 325-334 | Grouping objects |
| collaboration_annotations | 335-379 | Annotations on data |
| annotation_reactions | 380-391 | Reactions to annotations |
| annotation_subscriptions | 392-403 | Subscribe to annotations |
| agents | 474-504 | AI agent configurations |
| agent_logs | 505-533 | AI agent activity logs |
| daily_outdoor_temperatures | 534-756 | Weather/temperature data |
| user_activity_logs | 757+ | User activity tracking |

---

## Database Relationships

**Relations defined**: 7 relation sets (Lines found via grep)

### Key Relationships

1. **users → user_profiles**: userProfileId foreign key
2. **users → mandants**: mandantId foreign key
3. **objects → mandants**: mandantId foreign key
4. **system_alerts → objects**: objectId foreign key
5. **day_comp → objects**: log field (objectId)
6. **agents → agent_logs**: One-to-many
7. **logbook_entries**: Self-referential (relatedEntryId)

---

## Query Patterns Analysis

### Raw SQL Queries
**Evidence**: Limited, mainly uses Drizzle ORM query builder

### ORM Query Builder Usage
**Pattern**: Drizzle ORM throughout

**Example from routes/index.ts:416-419**:
```typescript
const realLogs = await getDb().select().from(userActivityLogs)
  .where(eq(userActivityLogs.userId, user.id))
  .orderBy(desc(userActivityLogs.timestamp))
  .limit(50);
```

**Pattern**: Fluent API with type safety

---

## Transaction Handling

**Pattern**: Not explicitly visible in routes
**Evidence**: ConnectionPoolManager likely handles transactions
**Analysis Required**: Check connection-pool.ts implementation

---

## Caching Layers

**Evidence**:
1. **memoizee** package (package.json:84) - Function-level caching
2. **memorystore** package (package.json:85) - Session caching
3. **React Query** (frontend) - API response caching

**No Redis/Memcached** detected

---

## Key Observations

### 1. **JSONB Heavy Design**
- Objects table has 15 JSONB fields
- Extreme flexibility but harder to query
- May impact performance for complex queries

### 2. **Multi-Tenant Architecture**
- mandants table (tenants)
- mandantAccess JSONB arrays
- mandantId foreign keys throughout

### 3. **Time-Series Data**
- day_comp: Daily energy readings (100K+ rows)
- view_mon_comp: Monthly aggregates
- daily_outdoor_temperatures: Weather data
- High-volume tables

### 4. **German Language**
- Table names in English
- Comments in German
- Field names mix (e.g., "temperaturGrenzwert")

### 5. **Deprecated Tables**
- object_mandant marked as obsolete
- Still defined in schema (technical debt)

### 6. **AI Integration**
- agents table
- agent_logs table
- kianalyse JSONB field in objects

### 7. **Collaboration Features**
- collaboration_annotations
- annotation_reactions
- annotation_subscriptions

### 8. **Comprehensive Indexing**
- objects: 6 indexes
- logbook_entries: 4 indexes
- Optimized for common queries

---

## Database Size Estimation

| Category | Tables | Est. Rows | Storage Impact |
|----------|--------|-----------|----------------|
| Time-series | 3 | 200,000+ | High |
| Monitoring | 5 | 10,000+ | Medium |
| Configuration | 7 | < 1,000 | Low |
| Collaboration | 4 | Variable | Low-Medium |
| Session/Activity | 3 | Variable | Medium |

**Total Estimated**: 220,000+ rows across 20 tables

---

## Validation Schemas (Drizzle-Zod)

**Found**: 3 validation schemas (Lines via grep)

```typescript
export const insertMandantSchema = createInsertSchema(mandants).omit({
  id: true,
  createdAt: true
}).extend({ ... });

export const insertObjectSchema = createInsertSchema(objects).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSystemAlertSchema = createInsertSchema(systemAlerts).omit({
  id: true,
  createdAt: true
});
```

**Pattern**: Auto-generated from Drizzle schema using drizzle-zod
**Evidence**: package.json:71 (drizzle-zod@0.7.0)

---

## Migration Strategy

**File**: drizzle.config.ts:8
```typescript
out: "./migrations",
schema: "./shared/schema.ts",
```

**Migrations Directory**: `./migrations/`
**Evidence**: Should exist but not visible in root listing
**Analysis Required**: Check if migrations directory exists

---

## Next Analysis Required

**PHASE 2.4: Business Logic & Service Layer**
- Analyze server/storage.ts (146KB)
- Analyze server/connection-pool.ts (12KB)
- Map controller dependencies
- Document service functions

**Files to Analyze**:
1. server/storage.ts (146,432 bytes - CRITICAL)
2. server/connection-pool.ts (12,290 bytes)
3. server/controllers/* (10 files)

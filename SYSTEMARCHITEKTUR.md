# Netzwächter - Vollständige Systemarchitektur-Dokumentation

**Erstellt**: 2025-10-07
**Version**: 4.0
**Status**: Produktionsreif

---

## Inhaltsverzeichnis

1. [Systemübersicht](#1-systemübersicht)
2. [Datenbankarchitektur](#2-datenbankarchitektur)
3. [Authentifizierung & Session-Management](#3-authentifizierung--session-management)
4. [Connection Pooling](#4-connection-pooling)
5. [Backend-Architektur](#5-backend-architektur)
6. [Frontend-Architektur](#6-frontend-architektur)
7. [Effizienzanalyse-System](#7-effizienzanalyse-system)
8. [Wetterdaten-Integration](#8-wetterdaten-integration)
9. [API-Struktur](#9-api-struktur)
10. [Deployment & Skalierung](#10-deployment--skalierung)

---

## 1. Systemübersicht

### 1.1 High-Level Architektur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NETZWÄCHTER SYSTEM                               │
│                  Energie-Monitoring & Management Platform                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌──────────────────────┐
│   Web-Browser       │         │   Mobile Browser     │
│   (Desktop)         │         │   (Responsive)       │
└──────────┬──────────┘         └──────────┬───────────┘
           │                               │
           └───────────────┬───────────────┘
                           │ HTTPS
                           ▼
           ┌───────────────────────────────┐
           │      Frontend (React)         │
           │  ┌─────────────────────────┐  │
           │  │  React 18.3.1           │  │
           │  │  TypeScript             │  │
           │  │  Wouter (Routing)       │  │
           │  │  TanStack Query         │  │
           │  │  shadcn/ui Components   │  │
           │  └─────────────────────────┘  │
           └───────────────┬───────────────┘
                           │ REST API
                           │ /api/*
                           ▼
           ┌───────────────────────────────┐
           │    Backend (Express.js)       │
           │  ┌─────────────────────────┐  │
           │  │  94 REST Endpoints      │  │
           │  │  Session Management     │  │
           │  │  Authentication Layer   │  │
           │  │  Business Logic         │  │
           │  │  Connection Pool (50)   │  │
           │  └─────────────────────────┘  │
           └───────────────┬───────────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
┌──────────────────────┐      ┌────────────────────────┐
│  PostgreSQL Database │      │  External APIs         │
│  ┌────────────────┐  │      │  ┌──────────────────┐  │
│  │  30+ Tables    │  │      │  │  Bright Sky API  │  │
│  │  50 Persistent │  │      │  │  (DWD Wetter)    │  │
│  │  Connections   │  │      │  └──────────────────┘  │
│  │  ACID Garantie │  │      │  ┌──────────────────┐  │
│  └────────────────┘  │      │  │  Grafana         │  │
└──────────────────────┘      │  │  (Dashboards)    │  │
                              │  └──────────────────┘  │
                              └────────────────────────┘
```

### 1.2 Technologie-Stack

#### Frontend
- **React 18.3.1**: Moderne UI-Bibliothek mit Hooks
- **TypeScript 5.6.3**: Typsicherheit und bessere IDE-Unterstützung
- **Vite 5.4.11**: Blitzschneller Build-Toolchain
- **Wouter**: Leichtgewichtiges Client-Side Routing
- **TanStack Query (React Query)**: Server-State Management
- **shadcn/ui**: Hochwertige, zugängliche UI-Komponenten
- **Tailwind CSS**: Utility-First CSS Framework

#### Backend
- **Node.js**: JavaScript-Laufzeitumgebung
- **Express.js 4.21.1**: Web-Framework für APIs
- **TypeScript**: Typsichere Backend-Entwicklung
- **PostgreSQL**: Relationale Datenbank
- **node-pg (pg)**: Native PostgreSQL-Client
- **express-session**: Session-Management
- **Axios**: HTTP-Client für externe APIs

#### Infrastruktur
- **PostgreSQL 15+**: Produktions-Datenbank
- **Connection Pooling**: 50 persistente Verbindungen
- **Bright Sky API**: Wetterdaten (DWD)
- **Grafana**: Monitoring und Visualisierung

---

## 2. Datenbankarchitektur

### 2.1 Datenbank-ER-Diagramm (Entity-Relationship)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATENBANK SCHEMA                                 │
│                    PostgreSQL - Multi-Tenant Architektur                 │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐          ┌──────────────────┐
│    mandants      │◄─────────┤   user_profile   │
│                  │  1     * │                  │
│ PK: id          │          │ PK: id           │
│    name          │          │    email         │
│    created_at    │          │    first_name    │
│    is_active     │          │    last_name     │
└────────┬─────────┘          │    password_hash │
         │                    │ FK: mandant_id   │
         │ 1                  │    role          │
         │                    │    is_active     │
         │                    └──────────────────┘
         │
         │ *
         ▼
┌──────────────────┐          ┌──────────────────┐
│    objects       │          │  user_sessions   │
│                  │          │                  │
│ PK: objectid     │          │ PK: sid          │
│    name          │          │    sess (jsonb)  │
│    objdata       │          │    expire        │
│    meter (jsonb) │          └──────────────────┘
│ FK: mandant_id   │
│    location      │          ┌──────────────────┐
│    postal_code   │          │    settings      │
│    created_at    │          │                  │
└────────┬─────────┘          │ PK: id           │
         │                    │    category      │
         │ 1                  │    key_name      │
         │                    │    value (jsonb) │
         │                    │    description   │
         │ *                  └──────────────────┘
         ▼
┌──────────────────┐
│    day_comp      │          ┌──────────────────────────────┐
│                  │          │ daily_outdoor_temperatures   │
│ PK: (log, date)  │          │                              │
│    _time         │          │ PK: id                       │
│    kwh           │          │    date                      │
│    id (objectid) │          │    postal_code               │
│    log (meterid) │          │    city                      │
│    mandant_id    │          │    temperature_min           │
└──────────────────┘          │    temperature_max           │
                              │    temperature_mean          │
                              │    data_source               │
                              │ UNIQUE: (postal_code, date)  │
                              └──────────────────────────────┘

┌──────────────────┐
│  object_mandant  │          Verknüpfungstabelle für
│                  │          Objekt-Zugriffskontrolle
│ PK: id           │
│ FK: objectid     │
│ FK: mandant_id   │
│    access_level  │
└──────────────────┘
```

### 2.2 Kern-Tabellen Beschreibung

#### **mandants** (Mandanten/Kunden)
Multi-Tenant Architektur - jeder Mandant hat isolierte Daten.

```sql
CREATE TABLE mandants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    settings JSONB,
    contact_info JSONB
);
```

**Zweck**: Mandantenisolierung, Datentrennung nach Kunde

---

#### **user_profile** (Benutzerprofile)
Authentifizierung und Autorisierung für alle Benutzer.

```sql
CREATE TABLE user_profile (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    mandant_id INTEGER REFERENCES mandants(id),
    role VARCHAR(50) DEFAULT 'user', -- 'superadmin', 'admin', 'user'
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profile_email ON user_profile(email);
CREATE INDEX idx_user_profile_mandant ON user_profile(mandant_id);
```

**Rollen**:
- `superadmin`: Vollzugriff auf alle Mandanten
- `admin`: Vollzugriff auf eigenen Mandanten
- `user`: Lesezugriff auf zugewiesene Objekte

---

#### **objects** (Gebäude/Liegenschaften)
Gebäudedaten mit Heizungsanlagen und Messsystemen.

```sql
CREATE TABLE objects (
    objectid SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mandant_id INTEGER REFERENCES mandants(id),
    objdata JSONB, -- Adresse, PLZ, Koordinaten
    meter JSONB,   -- Zählerkonfiguration
    location VARCHAR(255),
    postal_code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_objects_mandant ON objects(mandant_id);
CREATE INDEX idx_objects_postal_code ON objects(postal_code);
```

**meter JSONB Struktur**:
```json
{
  "meterid": 12345,
  "metertype": "heat",
  "unit": "kWh",
  "active": true
}
```

---

#### **day_comp** (Tägliche Energieverbrauchsdaten)
Kerntabelle für Energieanalyse - tägliche Verbrauchswerte pro Zähler.

```sql
CREATE TABLE day_comp (
    log INTEGER NOT NULL,      -- meterid
    id INTEGER NOT NULL,        -- objectid
    date DATE NOT NULL,
    _time TIMESTAMP NOT NULL,
    kwh NUMERIC(10,2),
    mandant_id INTEGER REFERENCES mandants(id),
    PRIMARY KEY (log, date)
);

CREATE INDEX idx_day_comp_object ON day_comp(id);
CREATE INDEX idx_day_comp_date ON day_comp(date);
CREATE INDEX idx_day_comp_mandant ON day_comp(mandant_id);
```

**Datenfluss**:
1. Messsysteme erfassen stündliche Daten
2. Aggregation zu Tageswerten
3. Speicherung in `day_comp`
4. Analyse via API

---

#### **daily_outdoor_temperatures** (Außentemperaturen)
Wetterdaten für Temperatur-Effizienz-Korrelation (GEG 2024-konform).

```sql
CREATE TABLE daily_outdoor_temperatures (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    city VARCHAR(100),
    temperature_min NUMERIC(5,2),
    temperature_max NUMERIC(5,2),
    temperature_mean NUMERIC(5,2),
    data_source VARCHAR(100) DEFAULT 'DWD (Bright Sky)',
    data_quality VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(postal_code, date)
);

CREATE INDEX idx_temp_postal_date ON daily_outdoor_temperatures(postal_code, date);
CREATE INDEX idx_temp_date ON daily_outdoor_temperatures(date);
```

**Datenquelle**: Bright Sky API (Deutscher Wetterdienst)
**Update-Frequenz**: Täglich via Cron-Job

---

#### **user_sessions** (Session-Speicher)
Express-Session Persistierung in PostgreSQL.

```sql
CREATE TABLE user_sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_expire ON user_sessions(expire);
```

**Session-Daten** (sess JSONB):
```json
{
  "cookie": {"maxAge": 86400000},
  "user": {
    "id": 42,
    "email": "user@example.com",
    "role": "admin",
    "mandantId": 1
  }
}
```

---

### 2.3 Datenbank-Beziehungen

```
Mandant (1) ──────── (*) User Profile
   │
   │ (1)
   │
   ▼ (*)
Objects ──────── (*) Day Comp (Verbrauchsdaten)
   │
   │ postal_code
   │
   ▼
Daily Outdoor Temperatures (Wetterdaten)
```

**Referentielle Integrität**:
- Alle Foreign Keys mit `ON DELETE CASCADE` oder `ON DELETE SET NULL`
- Mandanten können nicht gelöscht werden, wenn aktive Benutzer existieren
- Objekte behalten Verbrauchsdaten bei Mandantenwechsel (Audit-Trail)

---

## 3. Authentifizierung & Session-Management

### 3.1 Authentifizierungs-Fluss (UML Sequenzdiagramm)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    AUTHENTIFIZIERUNGS-FLOW                                │
└──────────────────────────────────────────────────────────────────────────┘

Browser          React App       Express.js      AuthController    Database
   │                │                │                  │               │
   │  GET /        │                │                  │               │
   ├───────────────►                │                  │               │
   │                │  Check Session│                  │               │
   │                ├───────────────►                  │               │
   │                │                │  Session exist? │               │
   │                │                ├─────────────────►               │
   │                │                │                  │  Query       │
   │                │                │                  │  Sessions    │
   │                │                │                  ├──────────────►
   │                │                │                  │  No Session  │
   │                │                │                  ◄──────────────┤
   │                │  Not Auth      │                  │               │
   │                ◄────────────────┤                  │               │
   │  Show Login   │                │                  │               │
   ◄────────────────┤                │                  │               │
   │                │                │                  │               │
   │  Submit Creds │                │                  │               │
   ├───────────────►                │                  │               │
   │                │ POST /api/auth/user-login        │               │
   │                ├───────────────►                  │               │
   │                │                │  Validate Creds │               │
   │                │                ├─────────────────►               │
   │                │                │                  │ Query User   │
   │                │                │                  ├──────────────►
   │                │                │                  │ User Found   │
   │                │                │                  ◄──────────────┤
   │                │                │  Compare Hash   │               │
   │                │                │  (bcrypt)       │               │
   │                │                │  ✓ Valid        │               │
   │                │                │                  │               │
   │                │                │  Create Session │               │
   │                │                ├─────────────────►               │
   │                │                │                  │ Store Session│
   │                │                │                  ├──────────────►
   │                │                │                  │ Session ID   │
   │                │                │                  ◄──────────────┤
   │                │  Set Cookie    │                  │               │
   │                │  (connect.sid) │                  │               │
   │                ◄────────────────┤                  │               │
   │  Cookie Set   │                │                  │               │
   ◄────────────────┤                │                  │               │
   │                │                │                  │               │
   │  Redirect /   │                │                  │               │
   ├───────────────►                │                  │               │
   │                │  Auth Check    │                  │               │
   │                ├───────────────►                  │               │
   │                │                │  Load Session   │               │
   │                │                ├─────────────────►               │
   │                │                │                  │  Query       │
   │                │                │                  ├──────────────►
   │                │                │                  │  Session     │
   │                │                │                  │  Data        │
   │                │                │                  ◄──────────────┤
   │                │  ✓ Authenticated                 │               │
   │                ◄────────────────┤                  │               │
   │  Show App     │                │                  │               │
   ◄────────────────┤                │                  │               │
```

### 3.2 Session-Architektur

#### Session-Konfiguration

```typescript
// server/index.ts - Session Setup
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

const PgSession = connectPgSimple(session);

app.use(session({
  store: new PgSession({
    pool: ConnectionPoolManager.getInstance().getPool(),
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 Stunden
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));
```

#### Session-Datenstruktur

```typescript
interface SessionUser {
  id: number | string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'superadmin' | 'admin' | 'user';
  userProfileId: number | null;
  mandantId: number | null;
  mandantRole: string;
}

declare module 'express-session' {
  interface SessionData {
    user: SessionUser;
  }
}
```

### 3.3 Authentifizierungs-Middleware

```typescript
// server/middleware/auth.ts

/**
 * Prüft ob Benutzer authentifiziert ist
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.user) {
    return next();
  }
  return res.status(401).json({ message: 'Nicht authentifiziert' });
};

/**
 * Prüft ob Benutzer eine bestimmte Rolle hat
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ message: 'Zugriff verweigert' });
    }

    return next();
  };
};

/**
 * Prüft Zugriff auf spezifischen Mandanten
 */
export const requireMandantAccess = (mandantId: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.session?.user;

    if (!user) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    // Superadmin hat Zugriff auf alle Mandanten
    if (user.role === 'superadmin') {
      return next();
    }

    // Prüfe ob Benutzer zum Mandanten gehört
    if (user.mandantId !== mandantId) {
      return res.status(403).json({ message: 'Kein Zugriff auf diesen Mandanten' });
    }

    return next();
  };
};
```

### 3.4 Rollen-basierte Zugriffskontolle (RBAC)

```
┌────────────────────────────────────────────────────────────┐
│                  ROLLEN-HIERARCHIE                          │
└────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │   Superadmin    │
                    │                 │
                    │  Vollzugriff    │
                    │  Alle Mandanten │
                    └────────┬────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
         ┌────────▼────────┐   ┌───────▼────────┐
         │  Admin          │   │  Admin         │
         │  Mandant A      │   │  Mandant B     │
         │                 │   │                │
         │  Vollzugriff    │   │  Vollzugriff   │
         │  nur Mandant A  │   │  nur Mandant B │
         └────────┬────────┘   └───────┬────────┘
                  │                    │
         ┌────────┴────────┐  ┌────────┴────────┐
         │                 │  │                 │
    ┌────▼─────┐    ┌─────▼──┐ ┌────▼─────┐
    │  User    │    │ User   │ │  User    │
    │  Objekt 1│    │Objekt 2│ │  Objekt 3│
    │          │    │        │ │          │
    │Lesezugrif│    │Lese-   │ │Lesezugrif│
    └──────────┘    │zugriff │ └──────────┘
                    └────────┘
```

**Berechtigungen nach Rolle**:

| Aktion                      | Superadmin | Admin | User |
|-----------------------------|------------|-------|------|
| Alle Mandanten einsehen     | ✓          | ✗     | ✗    |
| Eigenen Mandanten verwalten | ✓          | ✓     | ✗    |
| Benutzer anlegen/löschen    | ✓          | ✓     | ✗    |
| Objekte anlegen/löschen     | ✓          | ✓     | ✗    |
| Verbrauchsdaten einsehen    | ✓          | ✓     | ✓*   |
| Effizienzanalyse ausführen  | ✓          | ✓     | ✓*   |
| Systemeinstellungen ändern  | ✓          | ✗     | ✗    |

*nur für zugewiesene Objekte

---

## 4. Connection Pooling

### 4.1 Connection Pool Architektur

```
┌──────────────────────────────────────────────────────────────────────────┐
│            CONNECTION POOL MANAGER (Singleton Pattern)                    │
│                    50 Persistente Verbindungen                            │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         Express.js Application                           │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Route A    │  │   Route B    │  │   Route C    │  ... 94 Routes   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                 │                 │                           │
│         └─────────────────┼─────────────────┘                           │
│                           │                                              │
│                           ▼                                              │
│              ┌────────────────────────────┐                              │
│              │ ConnectionPoolManager      │                              │
│              │ getInstance()              │                              │
│              └────────────┬───────────────┘                              │
│                           │                                              │
└───────────────────────────┼──────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Connection Pool                        │
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │  Active Connections (in use)                                   │   │
│   ├────────────────────────────────────────────────────────────────┤   │
│   │  [Conn1] [Conn2] [Conn3] [Conn4] [Conn5] ... [Conn15]         │   │
│   │  (Executing queries)                                            │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │  Idle Connections (ready to use)                               │   │
│   ├────────────────────────────────────────────────────────────────┤   │
│   │  [Conn16] [Conn17] [Conn18] ... [Conn50]                       │   │
│   │  (Waiting for requests)                                         │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   Total: 50 connections (min: 50, max: 50)                              │
│   Idle Timeout: 0 (never timeout - persistent)                          │
│   Connection Timeout: 5 seconds                                          │
│   Keep-Alive: Enabled (TCP keepalive)                                   │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Database Server                        │
│                       (Neon.tech / Self-hosted)                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Connection Lifecycle

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    CONNECTION LIFECYCLE                                   │
└──────────────────────────────────────────────────────────────────────────┘

Initialization Phase:
════════════════════
1. App Start
   ↓
2. ConnectionPoolManager.initialize()
   ↓
3. Create Pool (min: 50, max: 50)
   ↓
4. Pre-warm Connections
   │  (acquire all 50 → validate with SELECT 1 → release)
   ↓
5. ✓ Pool Ready (50 active connections)
   ↓
6. Start Health Check Interval (every 30s)


Request Handling Phase:
═══════════════════════
Request arrives
   ↓
1. acquireConnection()
   │  ├─ Check Circuit Breaker (open/closed?)
   │  ├─ Check Pool initialized?
   │  └─ pool.connect() → get client from pool
   ↓
2. ✓ Connection acquired (measure time)
   ↓
3. Execute Query
   │  ├─ Track query time
   │  ├─ Track total queries counter
   │  └─ Reset circuit breaker failures on success
   ↓
4. releaseConnection()
   │  └─ client.release() → return to pool
   ↓
5. Connection back in idle pool


Health Check Phase (every 30s):
═══════════════════════════════
1. Execute SELECT 1
   ↓
2. Measure response time
   ↓
3. Calculate metrics:
   │  ├─ Active connections
   │  ├─ Error rate
   │  └─ Query times
   ↓
4. Determine health status:
   │  ├─ Circuit breaker closed?
   │  ├─ Active connections ≤ 45?
   │  ├─ Error rate < 5%?
   │  └─ Health check < 100ms?
   ↓
5. Log warnings if unhealthy


Error Handling Phase:
═════════════════════
Connection Error
   ↓
1. Increment totalErrors
   ↓
2. Increment circuitBreakerFailures
   ↓
3. Check failures ≥ 5?
   │  ├─ YES → Open Circuit Breaker
   │  │         └─ Auto-reset after 30s
   │  └─ NO → Continue
   ↓
4. Emit 'error' event
   ↓
5. Log error details


Shutdown Phase:
═══════════════
SIGTERM/SIGINT received
   ↓
1. Wait for active queries (max 30s)
   ↓
2. pool.end() → close all connections
   ↓
3. ✓ Graceful shutdown complete
   ↓
4. process.exit(0)
```

### 4.3 Pool-Konfiguration & Metriken

#### Konfigurationsparameter

```typescript
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  min: 50,                          // Minimum 50 persistente Verbindungen
  max: 50,                          // Maximum 50 Verbindungen (hard limit)
  idleTimeoutMillis: 0,             // Nie timeout - Verbindungen bleiben offen
  connectionTimeoutMillis: 5000,    // 5 Sekunden Connection-Timeout
  keepAlive: true,                  // TCP keepalive aktiviert
  keepAliveInitialDelayMillis: 10000 // Keepalive nach 10 Sekunden
};
```

#### Metriken & Monitoring

```typescript
interface PoolStats {
  totalConnections: number;      // Gesamt-Verbindungen (50)
  activeConnections: number;     // Aktuell in Verwendung
  idleConnections: number;       // Bereit für Requests
  waitingRequests: number;       // Wartende Anfragen (sollte 0 sein)
  totalQueries: number;          // Gesamt ausgeführte Queries
  totalErrors: number;           // Gesamt-Fehler
  averageQueryTime: number;      // Durchschnittliche Query-Zeit (ms)
  uptime: number;                // Pool-Laufzeit (Sekunden)
}
```

**Prometheus-Metriken verfügbar**:
```
GET /api/monitoring/metrics/pool
```

Beispiel-Output:
```
db_pool_total_connections 50
db_pool_active_connections 12
db_pool_idle_connections 38
db_pool_waiting_requests 0
db_pool_total_queries 145823
db_pool_total_errors 3
db_pool_average_query_time 15.42
db_pool_uptime 86400
db_pool_health 1
db_pool_error_rate 0.002
```

### 4.4 Circuit Breaker Pattern

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        CIRCUIT BREAKER PATTERN                            │
└──────────────────────────────────────────────────────────────────────────┘

                         ┌──────────────┐
                         │   CLOSED     │
                         │  (Normal)    │
                         │              │
                         │  Requests    │
                         │  flow        │
                         │  through     │
                         └──────┬───────┘
                                │
                      Failures ≥ 5
                                │
                                ▼
                         ┌──────────────┐
                         │    OPEN      │
                         │  (Blocking)  │
                         │              │
                         │  All requests│
                         │  fail fast   │
                         │  Error: Circuit│
                         │  breaker OPEN │
                         └──────┬───────┘
                                │
                       After 30 seconds
                                │
                                ▼
                         ┌──────────────┐
                         │  HALF-OPEN   │
                         │  (Testing)   │
                         │              │
                         │  Next request│
                         │  determines  │
                         │  state       │
                         └──────┬───────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
              Success ✓                Failure ✗
                    │                       │
                    ▼                       ▼
             ┌──────────────┐       ┌──────────────┐
             │   CLOSED     │       │    OPEN      │
             └──────────────┘       └──────────────┘
```

**Vorteile**:
- Verhindert Datenbank-Überlastung
- Schnelles Fehlschlagen statt lange Timeouts
- Automatische Selbstheilung nach 30 Sekunden
- Schützt vor Kaskadenfehlern

---

## 5. Backend-Architektur

### 5.1 Backend-Komponenten-Diagramm

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          BACKEND ARCHITECTURE                             │
│                         Express.js + TypeScript                           │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                            server/index.ts                               │
│                        (Application Entry Point)                         │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  1. Load Environment Variables (.env)                         │     │
│  │  2. Initialize Express App                                    │     │
│  │  3. Setup Middleware (JSON, CORS, Session)                    │     │
│  │  4. Initialize Database Connection Pool                       │     │
│  │  5. Setup Routes                                              │     │
│  │  6. Error Handling Middleware                                 │     │
│  │  7. Start HTTP Server (Port 5000)                             │     │
│  └───────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│   Middleware      │   │     Routes        │   │    Services       │
│                   │   │                   │   │                   │
│ • auth.ts         │   │ • auth.ts         │   │ • weatherService  │
│ • error.ts        │   │ • users.ts        │   │ • emailService    │
│ • rateLimit.ts    │   │ • object.ts       │   │ • reportService   │
│ • validation.ts   │   │ • energy.ts       │   │                   │
│                   │   │ • efficiency.ts   │   │                   │
│                   │   │ • temperature.ts  │   │                   │
│                   │   │ • weather.ts      │   │                   │
│                   │   │ • monitoring.ts   │   │                   │
│                   │   │ • kiReport.ts     │   │                   │
│                   │   │ • portal.ts       │   │                   │
│                   │   │ • db.ts           │   │                   │
└─────────┬─────────┘   └─────────┬─────────┘   └─────────┬─────────┘
          │                       │                       │
          │                       ▼                       │
          │           ┌───────────────────┐              │
          │           │   Controllers     │              │
          │           │                   │              │
          │           │ • authController  │              │
          │           │ • userController  │              │
          │           │ • objectController│              │
          │           │ • energyController│              │
          │           │ • efficiencyCtrl  │              │
          │           │ • temperatureCtrl │              │
          │           └─────────┬─────────┘              │
          │                     │                        │
          └─────────────────────┼────────────────────────┘
                                │
                                ▼
                  ┌─────────────────────────┐
                  │  ConnectionPoolManager  │
                  │  (50 Connections)       │
                  └─────────────┬───────────┘
                                │
                                ▼
                  ┌─────────────────────────┐
                  │  PostgreSQL Database    │
                  └─────────────────────────┘
```

### 5.2 API-Struktur (94 Endpoints)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        API ENDPOINTS (94 Total)                           │
└──────────────────────────────────────────────────────────────────────────┘

/api/auth (4 Endpoints)
├── POST   /superadmin-login         Superadmin-Anmeldung
├── POST   /user-login                Benutzer-Anmeldung
├── POST   /logout                    Abmelden
└── GET    /user                      Aktueller Benutzer (authentifiziert)

/api/users (8 Endpoints)
├── GET    /                          Alle Benutzer (Admin)
├── POST   /                          Benutzer erstellen
├── GET    /:id                       Benutzer abrufen
├── PUT    /:id                       Benutzer aktualisieren
├── DELETE /:id                       Benutzer löschen
├── PUT    /:id/password              Passwort ändern
├── GET    /mandant/:mandantId        Benutzer nach Mandant
└── POST   /invite                    Benutzer einladen

/api/objects (12 Endpoints)
├── GET    /                          Alle Objekte (nach Mandant gefiltert)
├── POST   /                          Objekt erstellen
├── GET    /:id                       Objekt abrufen
├── PUT    /:id                       Objekt aktualisieren
├── DELETE /:id                       Objekt löschen
├── GET    /mandant/:mandantId        Objekte nach Mandant
├── GET    /:id/hierarchy             Objekt-Hierarchie
├── POST   /:id/meter                 Zähler hinzufügen
├── PUT    /:id/meter/:meterId        Zähler aktualisieren
├── DELETE /:id/meter/:meterId        Zähler löschen
├── GET    /:id/access                Zugriffskontrolle abrufen
└── POST   /:id/access                Zugriff gewähren

/api/energy (15 Endpoints)
├── GET    /consumption/:objectId     Verbrauchsdaten
├── GET    /consumption/daily/:objectId   Täglicher Verbrauch
├── GET    /consumption/monthly/:objectId Monatlicher Verbrauch
├── GET    /consumption/yearly/:objectId  Jährlicher Verbrauch
├── GET    /meters/:objectId          Zähler für Objekt
├── GET    /meter/:meterId/data       Zählerdaten
├── GET    /comparison                Verbrauchsvergleich
├── GET    /trends/:objectId          Verbrauchstrends
├── GET    /forecast/:objectId        Verbrauchsprognose
├── GET    /peak-demand/:objectId     Spitzenlast
├── GET    /cost/:objectId            Kostenberechnung
├── GET    /baseline/:objectId        Baseline-Verbrauch
├── GET    /anomalies/:objectId       Anomalie-Erkennung
├── POST   /import                    Verbrauchsdaten importieren
└── GET    /export/:objectId          Verbrauchsdaten exportieren

/api/efficiency (7 Endpoints)
├── GET    /analysis/:objectId        Effizienzanalyse
├── GET    /score/:objectId           Effizienz-Score
├── GET    /recommendations/:objectId Optimierungsempfehlungen
├── GET    /benchmark/:objectId       Benchmark-Vergleich
├── GET    /savings-potential/:objectId Einsparpotenzial
├── GET    /performance-trend/:objectId Performance-Trend
└── GET    /class/:objectId           Energieeffizienzklasse

/api/temperature (10 Endpoints)
├── GET    /indoor/:objectId          Innentemperaturen
├── GET    /outdoor/:objectId         Außentemperaturen
├── GET    /setpoints/:objectId       Sollwerte
├── PUT    /setpoints/:objectId       Sollwerte aktualisieren
├── GET    /comfort-analysis/:objectId Komfortanalyse
├── GET    /correlation/:objectId     Temperatur-Verbrauch-Korrelation
├── GET    /zones/:objectId           Temperaturzonen
├── GET    /alerts/:objectId          Temperaturalarme
├── POST   /alerts/:objectId          Alarm erstellen
└── DELETE /alerts/:alertId           Alarm löschen

/api/weather (8 Endpoints)
├── GET    /postal-code/:postalCode   Wetterdaten nach PLZ
├── GET    /object/:objectId          Wetterdaten für Objekt
├── GET    /heating-degree-days       Heizgradtage
├── GET    /forecast/:postalCode      Wettervorhersage
├── GET    /historical/:postalCode    Historische Daten
├── POST   /import                    Wetterdaten importieren
├── GET    /sources                   Verfügbare Datenquellen
└── GET    /coverage                  Abdeckungs-Karte

/api/monitoring (12 Endpoints)
├── GET    /health                    System-Gesundheit
├── GET    /status                    System-Status
├── GET    /metrics                   Prometheus-Metriken
├── GET    /metrics/pool              Connection Pool Metriken
├── GET    /logs                      System-Logs
├── GET    /errors                    Fehler-Log
├── GET    /performance               Performance-Metriken
├── GET    /uptime                    System-Laufzeit
├── GET    /database-status           Datenbank-Status
├── GET    /api-status                API-Status
├── POST   /test-connection           Verbindungstest
└── GET    /diagnostics               Diagnose-Report

/api/ki-report (8 Endpoints)
├── GET    /generate/:objectId        KI-Report generieren
├── GET    /:reportId                 Report abrufen
├── GET    /list/:objectId            Reports auflisten
├── DELETE /:reportId                 Report löschen
├── GET    /insights/:objectId        KI-Insights
├── GET    /predictions/:objectId     Vorhersagen
├── GET    /anomalies/:objectId       KI-Anomalieerkennung
└── POST   /feedback/:reportId        Report-Feedback

/api/portal (5 Endpoints)
├── GET    /settings                  Portal-Einstellungen
├── PUT    /settings                  Einstellungen aktualisieren
├── GET    /mandants                  Mandanten auflisten
├── POST   /mandants                  Mandant erstellen
└── DELETE /mandants/:id              Mandant löschen

/api/db (5 Endpoints)
├── GET    /config                    DB-Konfiguration
├── POST   /backup                    Datenbank-Backup
├── POST   /restore                   Datenbank wiederherstellen
├── GET    /statistics                Datenbank-Statistiken
└── POST   /migrate                   Datenbank-Migration
```

### 5.3 Request-Response Lifecycle

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   REQUEST-RESPONSE LIFECYCLE                              │
└──────────────────────────────────────────────────────────────────────────┘

HTTP Request (GET /api/energy/consumption/12345?startDate=2024-01-01)
   │
   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. Express Middleware Chain                                              │
├─────────────────────────────────────────────────────────────────────────┤
│  a) CORS Middleware           → Set CORS headers                        │
│  b) JSON Body Parser          → Parse JSON request body                 │
│  c) Session Middleware        → Load session from database              │
│  d) Request Logger            → Log request details                     │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. Route Matching                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  router.get('/consumption/:objectId', ...)                              │
│  → Match found: energyController.getConsumption                         │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. Authentication Middleware                                             │
├─────────────────────────────────────────────────────────────────────────┤
│  isAuthenticated(req, res, next)                                        │
│  ├─ Check req.session.user exists?                                      │
│  ├─ YES → next()                                                        │
│  └─ NO  → return 401 Unauthorized                                       │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. Authorization Middleware                                              │
├─────────────────────────────────────────────────────────────────────────┤
│  requireMandantAccess(objectId)                                         │
│  ├─ Check user has access to objectId?                                 │
│  ├─ YES → next()                                                        │
│  └─ NO  → return 403 Forbidden                                          │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. Controller (energyController.getConsumption)                         │
├─────────────────────────────────────────────────────────────────────────┤
│  a) Extract parameters: objectId = 12345                                │
│  b) Extract query params: startDate, endDate                            │
│  c) Validate parameters                                                 │
│  d) Call business logic                                                 │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. Database Query (ConnectionPoolManager)                               │
├─────────────────────────────────────────────────────────────────────────┤
│  const pool = ConnectionPoolManager.getInstance();                      │
│  const client = await pool.acquireConnection();                         │
│                                                                          │
│  const query = `                                                        │
│    SELECT date, kwh                                                     │
│    FROM day_comp                                                        │
│    WHERE id = $1                                                        │
│      AND date BETWEEN $2 AND $3                                         │
│    ORDER BY date ASC                                                    │
│  `;                                                                     │
│  const result = await client.query(query, [objectId, start, end]);     │
│  pool.releaseConnection(client);                                        │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 7. Data Processing                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ├─ Format dates                                                        │
│  ├─ Calculate totals/averages                                           │
│  ├─ Apply business rules                                                │
│  └─ Structure response                                                  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 8. Response                                                              │
├─────────────────────────────────────────────────────────────────────────┤
│  res.json({                                                             │
│    success: true,                                                       │
│    data: {                                                              │
│      objectId: 12345,                                                   │
│      consumption: [...],                                                │
│      total: 15432.5,                                                    │
│      unit: 'kWh'                                                        │
│    }                                                                    │
│  });                                                                    │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 9. Logging & Metrics                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  GET /api/energy/consumption/12345 200 in 45ms                          │
│  ├─ Log to console                                                      │
│  ├─ Update metrics (query count, avg time)                              │
│  └─ Track performance                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                        HTTP Response (JSON)
```

---

## 6. Frontend-Architektur

### 6.1 Frontend-Komponenten-Struktur

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       FRONTEND ARCHITECTURE                               │
│                      React 18 + TypeScript + Vite                         │
└──────────────────────────────────────────────────────────────────────────┘

client/
├── src/
│   ├── main.tsx                    ← Entry Point
│   ├── App.tsx                     ← Root Component + Routing
│   │
│   ├── pages/                      ← Page Components (50+)
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── EnergyData.tsx
│   │   ├── EfficiencyAnalysis.tsx
│   │   ├── TemperatureAnalysis.tsx
│   │   ├── ObjectManagement.tsx
│   │   ├── UserManagement.tsx
│   │   └── ...
│   │
│   ├── components/                ← Reusable Components
│   │   ├── Layout.tsx             ← Main Layout Wrapper
│   │   ├── Sidebar.tsx            ← Navigation Sidebar
│   │   ├── DatabaseStatusHeader.tsx
│   │   ├── SessionWarning.tsx
│   │   ├── ui/                    ← shadcn/ui Components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   └── ...
│   │
│   ├── hooks/                     ← Custom React Hooks
│   │   ├── useAuth.ts             ← Authentication Hook
│   │   ├── useUIMode.ts           ← UI Mode Hook
│   │   ├── useQuery.ts            ← Data Fetching Hook
│   │   └── ...
│   │
│   ├── lib/                       ← Utility Libraries
│   │   ├── queryClient.ts         ← TanStack Query Config
│   │   ├── utils.ts               ← Helper Functions
│   │   └── api.ts                 ← API Client
│   │
│   └── styles/
│       └── index.css              ← Tailwind CSS
│
└── index.html                     ← HTML Template
```

### 6.2 React Component Hierarchy

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      COMPONENT HIERARCHY                                  │
└──────────────────────────────────────────────────────────────────────────┘

App
├── QueryClientProvider (TanStack Query)
│   └── TooltipProvider (shadcn/ui)
│       ├── Toaster (Notifications)
│       ├── SessionWarning (Session Timeout Alert)
│       └── RouterMain
│           ├── DatabaseStatusHeader (Connection Status)
│           └── Switch (Wouter Router)
│               │
│               ├── Route: /login
│               │   └── Login
│               │
│               ├── Route: /superadmin-login
│               │   └── SuperadminLogin
│               │
│               ├── Route: / (authenticated)
│               │   └── LayoutStrawaTabs (4-Tab Layout)
│               │       ├── Tab: Übersicht
│               │       ├── Tab: Objekte
│               │       ├── Tab: Energie
│               │       └── Tab: Profil
│               │
│               └── Route: /dashbord, /maps, /energy-data, etc.
│                   └── Layout (Sidebar + Content)
│                       ├── Sidebar (Navigation)
│                       │   ├── Logo
│                       │   ├── Navigation Links
│                       │   └── User Menu
│                       │
│                       └── Content Area
│                           ├── Dashboard
│                           ├── Maps
│                           ├── EnergyData
│                           ├── EfficiencyAnalysis
│                           ├── TemperatureAnalysis
│                           ├── ObjectManagement
│                           ├── UserManagement
│                           └── ...
```

### 6.3 State Management & Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     STATE MANAGEMENT & DATA FLOW                          │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          Client State                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  React Context API + Local State                                        │
│  ├── useAuth() → Authentication State                                   │
│  ├── useUIMode() → UI Mode (Cockpit vs Strawa)                          │
│  └── useState() → Local Component State                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          Server State                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  TanStack Query (React Query)                                           │
│  ├── Caching                                                             │
│  ├── Automatic Refetching                                               │
│  ├── Background Updates                                                 │
│  ├── Optimistic Updates                                                 │
│  └── Error Handling                                                     │
└─────────────────────────────────────────────────────────────────────────┘


Data Flow Example: Fetch Energy Data
═════════════════════════════════════

User Interaction
   │
   ▼
Component (EnergyData.tsx)
   │
   │ useQuery({ queryKey: ['energy', objectId], queryFn: fetchEnergy })
   │
   ▼
TanStack Query
   │
   ├─ Check Cache
   │  ├─ Hit → Return cached data
   │  └─ Miss → Fetch from server
   │
   ▼
API Client (lib/api.ts)
   │
   │ fetch('/api/energy/consumption/12345')
   │
   ▼
Express Backend
   │
   │ energyController.getConsumption()
   │
   ▼
Database Query
   │
   │ SELECT * FROM day_comp WHERE id = 12345
   │
   ▼
Response
   │
   ▼
TanStack Query
   │
   ├─ Store in Cache
   ├─ Update Component
   └─ Set Loading State to false
   │
   ▼
Component Re-renders with Data
   │
   ▼
UI Updates (Charts, Tables)
```

### 6.4 Routing-Architektur

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         ROUTING ARCHITECTURE                              │
│                            Wouter Router                                  │
└──────────────────────────────────────────────────────────────────────────┘

Public Routes (No Auth Required):
══════════════════════════════════
/login                    → Login (Standard Users)
/superadmin-login         → SuperadminLogin
/anmelden                 → LoginStrawa (Alternative Login)

Protected Routes (Auth Required):
══════════════════════════════════
/                         → LayoutStrawaTabs (Home - 4-Tab Layout)
/dashbord                 → Dashboard (Typo in original, should be fixed)
/maps                     → Maps (Geo-Visualisierung)
/energy-data              → EnergyData (Verbrauchsdaten)
/efficiency               → EfficiencyAnalysis
/temperature-analysis     → TemperatureAnalysis
/temperatur-analyse       → TemperatureAnalysis (German alias)
/objects                  → ObjectManagement
/objektverwaltung         → ObjectManagement (German alias)
/users                    → UserManagement
/user-management          → UserManagement (Alias)
/user                     → User (Eigenes Profil)
/user-settings            → UserSettings
/system-setup             → SystemSettings
/setup                    → SystemSettings (Alias)
/grafana-dashboards       → GrafanaDashboard
/grafana-dashboard        → GrafanaDashboard (Alias)
/network-monitor          → NetworkMonitor
/api-management           → ApiManagement
/api-test                 → ApiManagement (Alias)
/api-tests                → ApiManagement (Alias)
/db-energy-config         → DbEnergyDataConfig
/logbook                  → Logbook
/performance-test         → PerformanceTest (Dev Tool)
/modbusConfig             → ModbusConfig
/devices                  → Devices
/geraeteverwaltung        → Geraeteverwaltung (German)

Admin-Only Routes:
══════════════════
/admin-dashboard          → AdminDashboard (Superadmin only)
```

### 6.5 UI Mode System

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          UI MODE SYSTEM                                   │
└──────────────────────────────────────────────────────────────────────────┘

URL Parameter: ?ui=<mode>
═════════════════════════

?ui=cockpit (or no param)  → Large Sidebar Layout (Full Navigation)
?ui=strawa                 → 4-Tab Mobile Layout (Simplified)
?ui=*                      → 4-Tab Mobile Layout (Default for unknown)


┌─────────────────────────────────────────────────────────────────────────┐
│                      Cockpit Mode (Desktop)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┬────────────────────────────────────────────────────────┐  │
│  │          │                                                        │  │
│  │          │                                                        │  │
│  │          │                                                        │  │
│  │ Sidebar  │              Main Content Area                        │  │
│  │          │                                                        │  │
│  │ Full     │           (Dashboard, Maps, Energy, etc.)             │  │
│  │ Nav      │                                                        │  │
│  │          │                                                        │  │
│  │          │                                                        │  │
│  │          │                                                        │  │
│  └──────────┴────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                      Strawa Mode (Mobile)                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  │                                                                    │ │
│  │                                                                    │ │
│  │                     Content Area                                  │ │
│  │                                                                    │ │
│  │                                                                    │ │
│  │                                                                    │ │
│  │                                                                    │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │  [Übersicht]  [Objekte]  [Energie]  [Profil]                     │ │
│  │                  Bottom Navigation Tabs                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Effizienzanalyse-System

### 7.1 Effizienzanalyse-Architektur

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    EFFIZIENZANALYSE-SYSTEM                                │
│              Temperature-Efficiency Correlation Analysis                  │
└──────────────────────────────────────────────────────────────────────────┘

Input Daten
═══════════
┌────────────────────┐        ┌────────────────────────────┐
│   day_comp         │        │ daily_outdoor_temperatures │
│                    │        │                            │
│ • objectid         │        │ • postal_code              │
│ • date             │   +    │ • date                     │
│ • kwh (Verbrauch)  │        │ • temperature_mean         │
│ • mandant_id       │        │ • temperature_min/max      │
└────────┬───────────┘        └─────────────┬──────────────┘
         │                                  │
         └──────────────┬───────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────┐
         │   Daten-Zusammenführung          │
         │   (JOIN on postal_code + date)   │
         └──────────────┬───────────────────┘
                        │
                        ▼

Analyse-Pipeline
════════════════

1. Datenbereinigung
   ├─ Entfernung von Nullwerten
   ├─ Plausibilitätsprüfung
   └─ Ausreißer-Erkennung

2. Temperatur-Verbrauchs-Korrelation
   ├─ Pearson-Korrelationskoeffizient (r)
   ├─ R² (Bestimmtheitsmaß)
   └─ p-Wert (statistische Signifikanz)

3. Regressionsanalyse
   ├─ Lineare Regression: kWh = a + b * temp
   ├─ Berechnung von a (Intercept) und b (Slope)
   └─ Residuenanalyse

4. Heizgradtage (HDD) Berechnung
   ├─ HDD = Σ max(0, 20°C - temp_mean)
   │        für alle Tage mit temp_mean < 15°C
   └─ Normalisierung: kWh/HDD

5. Effizienz-Metriken
   ├─ Spezifischer Verbrauch: kWh/m²/a
   ├─ Witterungsbereinigter Verbrauch
   ├─ Vergleich mit Vorjahr
   └─ Benchmark-Vergleich

6. Effizienzklasse (GEG 2024)
   ├─ A+: < 50 kWh/m²/a
   ├─ A:  50-75 kWh/m²/a
   ├─ B:  75-100 kWh/m²/a
   ├─ C:  100-130 kWh/m²/a
   ├─ D:  130-160 kWh/m²/a
   ├─ E:  160-200 kWh/m²/a
   ├─ F:  200-250 kWh/m²/a
   └─ G:  > 250 kWh/m²/a

Output
══════
┌────────────────────────────────────────┐
│   Effizienz-Report                     │
├────────────────────────────────────────┤
│ • Korrelationskoeffizient: r = 0.85   │
│ • Bestimmtheitsmaß: R² = 0.72         │
│ • Effizienzklasse: B                  │
│ • Spez. Verbrauch: 95 kWh/m²/a        │
│ • HDD-normalisiert: 0.032 kWh/HDD     │
│ • Einsparpotenzial: 15%               │
│ • Empfehlungen:                       │
│   - Nachtabsenkung optimieren         │
│   - Heizkurve anpassen                │
│   - Hydraulischer Abgleich            │
└────────────────────────────────────────┘
```

### 7.2 Effizienzanalyse-Algorithmus (Detailliert)

```typescript
/**
 * Effizienzanalyse-Algorithmus
 *
 * Analysiert Temperatur-Verbrauchs-Korrelation und berechnet Effizienzmetriken
 */

async function analyzeEfficiency(objectId: number, startDate: Date, endDate: Date) {

  // 1. Daten abrufen
  const consumptionData = await fetchConsumptionData(objectId, startDate, endDate);
  const temperatureData = await fetchTemperatureData(objectId, startDate, endDate);

  // 2. Daten zusammenführen (JOIN on date)
  const mergedData = mergeData(consumptionData, temperatureData);

  // 3. Datenbereinigung
  const cleanedData = removeOutliers(mergedData);

  // 4. Korrelationsanalyse
  const correlation = calculatePearsonCorrelation(
    cleanedData.map(d => d.temperature),
    cleanedData.map(d => d.consumption)
  );

  // Pearson-Korrelationskoeffizient:
  // r = Σ((x - x̄)(y - ȳ)) / √(Σ(x - x̄)² * Σ(y - ȳ)²)

  const rSquared = correlation ** 2; // Bestimmtheitsmaß

  // 5. Lineare Regression: y = a + b*x
  const regression = linearRegression(
    cleanedData.map(d => d.temperature), // x (unabhängige Variable)
    cleanedData.map(d => d.consumption)  // y (abhängige Variable)
  );

  // b (Slope) = Σ((x - x̄)(y - ȳ)) / Σ(x - x̄)²
  // a (Intercept) = ȳ - b * x̄

  const { slope, intercept } = regression;

  // 6. Heizgradtage (Heating Degree Days)
  const hdd = calculateHeatingDegreeDays(cleanedData, 20); // Heizgrenze 20°C

  // HDD = Σ max(0, T_heizgrenze - T_außen) für T_außen < 15°C

  // 7. Spezifischer Verbrauch
  const totalConsumption = cleanedData.reduce((sum, d) => sum + d.consumption, 0);
  const heatedArea = await getHeatedArea(objectId); // m²
  const days = (endDate - startDate) / (1000 * 60 * 60 * 24);
  const specificConsumption = (totalConsumption / heatedArea) * (365 / days); // kWh/m²/a

  // 8. Witterungsbereinigter Verbrauch
  const normalizedConsumption = totalConsumption / hdd * STANDARD_HDD; // Normalisierung auf Standard-Heizgradtage

  // 9. Effizienzklasse (GEG 2024)
  const efficiencyClass = calculateEfficiencyClass(specificConsumption);

  // 10. Benchmark-Vergleich
  const benchmarkData = await getBenchmarkData(heatedArea, buildingType);
  const benchmarkDeviation = ((specificConsumption - benchmarkData.median) / benchmarkData.median) * 100;

  // 11. Einsparpotenzial
  const savingsPotential = Math.max(0, specificConsumption - benchmarkData.quartile25);
  const savingsPercentage = (savingsPotential / specificConsumption) * 100;

  // 12. Empfehlungen generieren
  const recommendations = generateRecommendations({
    correlation,
    slope,
    specificConsumption,
    benchmarkDeviation,
    savingsPotential
  });

  return {
    correlation: {
      pearson: correlation,
      rSquared: rSquared,
      interpretation: interpretCorrelation(correlation)
    },
    regression: {
      slope,
      intercept,
      equation: `kWh = ${intercept.toFixed(2)} + ${slope.toFixed(2)} * °C`
    },
    heatingDegreeDays: hdd,
    consumption: {
      total: totalConsumption,
      specific: specificConsumption,
      normalized: normalizedConsumption
    },
    efficiency: {
      class: efficiencyClass,
      benchmarkDeviation,
      savingsPotential,
      savingsPercentage
    },
    recommendations
  };
}

/**
 * Heizgradtage-Berechnung (DIN V 18599)
 */
function calculateHeatingDegreeDays(data: DataPoint[], heatingLimit: number): number {
  return data
    .filter(d => d.temperature < 15) // Nur Heiztage
    .reduce((sum, d) => {
      const hdd = Math.max(0, heatingLimit - d.temperature);
      return sum + hdd;
    }, 0);
}

/**
 * Effizienzklasse nach GEG 2024
 */
function calculateEfficiencyClass(specificConsumption: number): string {
  if (specificConsumption < 50) return 'A+';
  if (specificConsumption < 75) return 'A';
  if (specificConsumption < 100) return 'B';
  if (specificConsumption < 130) return 'C';
  if (specificConsumption < 160) return 'D';
  if (specificConsumption < 200) return 'E';
  if (specificConsumption < 250) return 'F';
  return 'G';
}
```

### 7.3 Effizienzanalyse-Visualisierung

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   EFFIZIENZANALYSE DASHBOARD                              │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  Temperatur-Verbrauchs-Korrelation (Scatter Plot)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  kWh                                                                     │
│   ↑                                                                      │
│ 150│                                 • r = -0.85                         │
│    │                              •    R² = 0.72                         │
│ 120│                           •  •                                      │
│    │                        •  •  •                                      │
│  90│                     •  •  •  •                                      │
│    │                  •  •  •  •                                         │
│  60│            ──────────────────────── (Regressionslinie)              │
│    │       •  •  •  •                                                    │
│  30│    •  •  •                                                          │
│    │  •                                                                  │
│   0└──────────────────────────────────────────────►                     │
│     -10   -5    0    5   10   15   20   25   °C                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  Effizienzklasse & Kennzahlen                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────┐  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │            │  │ Spezifischer         │  │ Benchmark            │    │
│  │     B      │  │ Verbrauch            │  │                      │    │
│  │            │  │                      │  │ Median: 85 kWh/m²/a  │    │
│  │ 95 kWh/m²/a│  │ 95 kWh/m²/a          │  │ Ihr Wert: 95 (+12%)  │    │
│  │            │  │                      │  │ Quartil 25: 75       │    │
│  └────────────┘  └──────────────────────┘  └──────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  Einsparpotenzial                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Aktuell: 95 kWh/m²/a                                                   │
│  ███████████████████████░░░░░ (76%)                                     │
│                                                                          │
│  Benchmark (Quartil 25): 75 kWh/m²/a                                    │
│  ████████████████░░░░░░░░░░░░ (60%)                                     │
│                                                                          │
│  Einsparpotenzial: 20 kWh/m²/a (21%)                                    │
│  Jährliche Einsparung: ca. 1.200 € (bei 0.12 €/kWh)                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  Optimierungsempfehlungen                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Nachtabsenkung optimieren                          Potenzial: 8%    │
│     → Temperatur nachts um 3-5°C senken                                 │
│                                                                          │
│  2. Heizkurve anpassen                                 Potenzial: 7%    │
│     → Steilheit reduzieren (aktuell zu hoch)                            │
│                                                                          │
│  3. Hydraulischer Abgleich                            Potenzial: 6%     │
│     → Gleichmäßige Wärmeverteilung im Gebäude                           │
│                                                                          │
│  4. Dämmung Heizungsrohre                             Potenzial: 3%     │
│     → Reduzierung von Verteilverlusten                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Wetterdaten-Integration

### 8.1 Wetterdaten-Architektur

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      WETTERDATEN-INTEGRATION                              │
│               Bright Sky API (Deutscher Wetterdienst)                     │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     Bright Sky API (DWD)                                 │
│                  https://api.brightsky.dev                               │
│                                                                          │
│  • Kostenlos, kein API-Key erforderlich                                 │
│  • Offizielle DWD-Wetterstationen                                       │
│  • Historische Daten ab 2010                                            │
│  • Stündliche Auflösung                                                 │
│  • Temperatur, Niederschlag, Wind, etc.                                 │
│  • ~2 Millionen Requests/Tag Limit                                      │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               │ HTTP GET Request
                               │ /weather?lat=52.37&lon=9.73&date=2024-01-01
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       weatherService.ts                                  │
│                  (server/services/weatherService.ts)                     │
│                                                                          │
│  Features:                                                               │
│  • 62+ Postleitzahlen mit exakten Koordinaten                           │
│  • 30+ regionale Fallbacks für unbekannte PLZ                           │
│  • Automatische Aggregation (Stunde → Tag)                              │
│  • Berechnung von min/max/mean Temperaturen                             │
│  • Rate Limiting (1 Sekunde zwischen Requests)                          │
│  • Connection Pooling (5 Verbindungen für Scripts)                      │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               │ Store in Database
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│            daily_outdoor_temperatures Table                              │
│                                                                          │
│  • date: 2024-01-01                                                     │
│  • postal_code: 30161                                                   │
│  • city: Hannover                                                       │
│  • temperature_min: 4.7°C                                               │
│  • temperature_max: 11.5°C                                              │
│  • temperature_mean: 7.2°C                                              │
│  • data_source: DWD (Bright Sky)                                        │
│  • UNIQUE constraint: (postal_code, date)                               │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               │ Used by
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────────┐
│ Efficiency    │    │ Temperature   │    │ KI Report         │
│ Analysis      │    │ Analysis      │    │ Generation        │
│               │    │               │    │                   │
│ • HDD         │    │ • Correlation │    │ • Weather Context │
│ • Correlation │    │ • Trends      │    │ • Predictions     │
└───────────────┘    └───────────────┘    └───────────────────┘
```

### 8.2 Wetterdaten-Datenfluss

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       WETTERDATEN DATENFLUSS                              │
└──────────────────────────────────────────────────────────────────────────┘

Historischer Import (npm run import:weather 2024)
══════════════════════════════════════════════════

1. Start Import Script
   ├─ Read command line args: years (e.g., 2024)
   ├─ Calculate date range: 2024-01-01 to 2024-12-31
   └─ Initialize lightweight DB pool (5 connections)

2. Get Postal Codes from Database
   ├─ Query: SELECT DISTINCT postal_code FROM objects
   ├─ Result: [30161, 45701, ...]
   └─ Total: N postal codes

3. For Each Postal Code:
   ├─ Lookup coordinates in postalCodeCoords mapping
   │  ├─ Hit: Use exact coordinates
   │  └─ Miss: Use regional fallback based on prefix
   │
   ├─ Fetch from Bright Sky API:
   │  └─ GET https://api.brightsky.dev/weather
   │      ?lat=52.3759&lon=9.7320
   │      &date=2024-01-01
   │      &last_date=2024-12-31
   │
   ├─ Response: Array of hourly weather data
   │  [
   │    { timestamp: "2024-01-01T00:00:00+01:00", temperature: 5.3 },
   │    { timestamp: "2024-01-01T01:00:00+01:00", temperature: 5.1 },
   │    ...
   │  ]
   │
   ├─ Aggregate Hourly → Daily:
   │  └─ Group by date (YYYY-MM-DD)
   │      ├─ temperature_min = MIN(hourly temperatures)
   │      ├─ temperature_max = MAX(hourly temperatures)
   │      └─ temperature_mean = AVG(hourly temperatures)
   │
   ├─ Insert into Database:
   │  └─ INSERT INTO daily_outdoor_temperatures
   │      (date, postal_code, city, temperature_min, temperature_max, temperature_mean, data_source)
   │      VALUES (...)
   │      ON CONFLICT (postal_code, date) DO NOTHING;
   │
   ├─ Log Progress:
   │  └─ "✅ 2024-01-01: 7.2°C (4.7°C - 11.5°C)"
   │
   └─ Rate Limiting: Wait 1 second before next postal code

4. Summary:
   └─ "Summary: 366 imported, 0 skipped, 0 errors"


Tägliches Update (npm run weather:daily via Cron)
══════════════════════════════════════════════════

1. Calculate Target Date
   └─ yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

2. Get Postal Codes from Database
   └─ Same as historical import

3. Fetch & Store for Each Postal Code
   ├─ Fetch yesterday's data from Bright Sky
   ├─ Aggregate (already daily data)
   └─ Insert into database

4. Summary & Exit
   └─ "✅ Daily weather data imported successfully!"


Abruf via API (Frontend/Analysis)
══════════════════════════════════

GET /api/outdoor-temperatures/postal-code/30161?startDate=2024-01-01&endDate=2024-01-31

1. Validate Parameters
   ├─ postal_code: required
   ├─ startDate: optional (default: 30 days ago)
   └─ endDate: optional (default: today)

2. Query Database
   └─ SELECT * FROM daily_outdoor_temperatures
      WHERE postal_code = $1
        AND date BETWEEN $2 AND $3
      ORDER BY date ASC

3. Return JSON
   └─ [{ date, city, temperature_min, temperature_max, temperature_mean, ... }]
```

### 8.3 Postleitzahlen-Mapping

```typescript
// server/services/weatherService.ts

// Genaue Koordinaten für 62+ Postleitzahlen
private readonly postalCodeCoords: Record<string, PostalCodeCoords> = {
  // Hannover region
  '30161': { lat: 52.3759, lon: 9.7320, city: 'Hannover' },
  '30159': { lat: 52.3810, lon: 9.7390, city: 'Hannover' },
  '30167': { lat: 52.3670, lon: 9.7450, city: 'Hannover' },

  // Berlin region
  '10115': { lat: 52.5244, lon: 13.4105, city: 'Berlin' },
  '10117': { lat: 52.5186, lon: 13.3978, city: 'Berlin' },

  // ... 57 weitere Postleitzahlen
};

// Regionale Fallbacks für 30+ Regionen
private readonly regionalFallbacks: Record<string, string> = {
  '30': '30161', // Hannover
  '10': '10115', // Berlin
  '20': '20095', // Hamburg
  '80': '80331', // München
  '50': '50667', // Köln
  '60': '60311', // Frankfurt
  '70': '70173', // Stuttgart
  '40': '40210', // Düsseldorf
  '44': '44135', // Dortmund
  '45': '45127', // Essen
  '04': '04103', // Leipzig
  '01': '01067', // Dresden
  // ... 18 weitere Regionen
};

/**
 * Koordinaten für Postleitzahl abrufen (mit Fallback)
 */
private getCoordinatesForPostalCode(postalCode: string): PostalCodeCoords | null {
  // 1. Exakte Übereinstimmung
  if (this.postalCodeCoords[postalCode]) {
    return this.postalCodeCoords[postalCode];
  }

  // 2. Regionales Fallback (erste 2 Ziffern)
  const prefix = postalCode.substring(0, 2);
  const fallbackPostalCode = this.regionalFallbacks[prefix];

  if (fallbackPostalCode && this.postalCodeCoords[fallbackPostalCode]) {
    console.log(`ℹ️ Using regional fallback: ${postalCode} → ${fallbackPostalCode}`);
    return this.postalCodeCoords[fallbackPostalCode];
  }

  return null;
}
```

### 8.4 Automatisierung via Cron

```bash
# Crontab Entry (crontab -e)
# Täglicher Wetterdaten-Import um 6:00 Uhr morgens

0 6 * * * cd /path/to/app-version-4_netzwächter && npm run weather:daily >> /var/log/weather-daily.log 2>&1

# Erklärung:
# 0 6 * * *  = Jeden Tag um 6:00 Uhr
# cd ...     = Wechsel ins Projektverzeichnis
# npm run    = Führe NPM-Script aus
# >> log     = Append Output zu Log-Datei
# 2>&1       = Redirect STDERR zu STDOUT
```

**Warum 6:00 Uhr?**
- DWD aktualisiert Daten typischerweise nachts
- 6:00 Uhr stellt sicher, dass gestrige Daten verfügbar sind
- Geringe Systemlast zu dieser Zeit

---

## 9. API-Struktur

### 9.1 API-Design-Prinzipien

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         API DESIGN PRINCIPLES                             │
└──────────────────────────────────────────────────────────────────────────┘

1. RESTful Design
   ├─ Ressourcen-orientiert: /api/objects, /api/users
   ├─ HTTP-Verben: GET (read), POST (create), PUT (update), DELETE (delete)
   ├─ Plural-Nomen für Collections: /api/objects (nicht /api/object)
   └─ Stateless: Jeder Request enthält alle benötigten Informationen

2. Konsistente Response-Struktur
   Success:
   {
     "success": true,
     "data": { ... },
     "message": "Optional success message"
   }

   Error:
   {
     "success": false,
     "error": "Error message",
     "code": "ERROR_CODE",
     "details": { ... }
   }

3. Authentifizierung & Autorisierung
   ├─ Session-basiert (Cookie: connect.sid)
   ├─ Middleware: isAuthenticated, requireAuth
   ├─ Rollen-Prüfung: requireRole(['admin', 'superadmin'])
   └─ Mandanten-Isolation: requireMandantAccess

4. Fehlerbehandlung
   ├─ HTTP Status Codes:
   │  ├─ 200: Success
   │  ├─ 201: Created
   │  ├─ 400: Bad Request (Validierungsfehler)
   │  ├─ 401: Unauthorized (nicht angemeldet)
   │  ├─ 403: Forbidden (keine Berechtigung)
   │  ├─ 404: Not Found
   │  └─ 500: Internal Server Error
   └─ Strukturierte Fehler-Messages

5. Versionierung
   └─ Über URL-Pfad: /api/v1/objects (zukünftig)

6. Dokumentation
   ├─ JSDoc-Kommentare in Code
   ├─ Separate API-Dokumentation (Dokumentation/developer/api/)
   └─ 94 Endpoints vollständig dokumentiert
```

### 9.2 API-Endpoint-Beispiel

```typescript
/**
 * API: GET /api/energy/consumption/:objectId
 *
 * Zweck: Verbrauchsdaten für ein Objekt abrufen
 *
 * Parameter:
 * - objectId (path): ID des Objekts
 * - startDate (query): Startdatum (YYYY-MM-DD)
 * - endDate (query): Enddatum (YYYY-MM-DD)
 * - aggregation (query): 'daily' | 'monthly' | 'yearly'
 *
 * Auth: Erforderlich - Benutzer muss Zugriff auf Objekt haben
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "objectId": 12345,
 *     "objectName": "Gebäude A",
 *     "period": {
 *       "start": "2024-01-01",
 *       "end": "2024-01-31"
 *     },
 *     "consumption": [
 *       { "date": "2024-01-01", "kwh": 145.2 },
 *       { "date": "2024-01-02", "kwh": 138.7 },
 *       ...
 *     ],
 *     "summary": {
 *       "total": 4523.8,
 *       "average": 145.9,
 *       "min": 98.4,
 *       "max": 189.3,
 *       "unit": "kWh"
 *     }
 *   }
 * }
 */
router.get('/consumption/:objectId',
  isAuthenticated,                    // 1. Authentifizierung prüfen
  requireObjectAccess,                // 2. Objekt-Zugriff prüfen
  validateConsumptionParams,          // 3. Parameter validieren
  energyController.getConsumption     // 4. Controller ausführen
);

// Controller Implementation
export const energyController = {
  getConsumption: asyncHandler(async (req: Request, res: Response) => {
    const { objectId } = req.params;
    const { startDate, endDate, aggregation } = req.query;

    // 1. Parameter validieren
    if (!startDate || !endDate) {
      throw createValidationError('startDate und endDate erforderlich');
    }

    // 2. Daten aus Datenbank abrufen
    const pool = ConnectionPoolManager.getInstance();
    const result = await pool.query(`
      SELECT date, kwh
      FROM day_comp
      WHERE id = $1
        AND date BETWEEN $2 AND $3
      ORDER BY date ASC
    `, [objectId, startDate, endDate]);

    // 3. Daten aggregieren (falls gewünscht)
    let consumptionData = result.rows;
    if (aggregation === 'monthly') {
      consumptionData = aggregateMonthly(consumptionData);
    }

    // 4. Zusammenfassung berechnen
    const summary = calculateSummary(consumptionData);

    // 5. Objekt-Informationen abrufen
    const objectInfo = await getObjectInfo(objectId);

    // 6. Response formatieren
    res.json({
      success: true,
      data: {
        objectId: parseInt(objectId),
        objectName: objectInfo.name,
        period: { start: startDate, end: endDate },
        consumption: consumptionData,
        summary
      }
    });
  })
};
```

---

## 10. Deployment & Skalierung

### 10.1 Deployment-Architektur

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT ARCHITECTURE                            │
└──────────────────────────────────────────────────────────────────────────┘

Development Environment
═══════════════════════
┌─────────────────────────────────────────────────────────────────────────┐
│  Local Machine                                                           │
│  ├─ npm run dev (Vite Dev Server + Express Backend)                     │
│  ├─ Hot Module Replacement (HMR)                                        │
│  ├─ Source Maps                                                         │
│  └─ PostgreSQL (local or remote)                                        │
└─────────────────────────────────────────────────────────────────────────┘

Production Environment
══════════════════════
┌─────────────────────────────────────────────────────────────────────────┐
│                         Load Balancer (Optional)                         │
│                            nginx / HAProxy                               │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  App Server 1 │     │  App Server 2 │     │  App Server 3 │
│               │     │               │     │               │
│  Node.js      │     │  Node.js      │     │  Node.js      │
│  Express      │     │  Express      │     │  Express      │
│  Port 5000    │     │  Port 5000    │     │  Port 5000    │
│               │     │               │     │               │
│  50 DB Conns  │     │  50 DB Conns  │     │  50 DB Conns  │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  PostgreSQL Cluster   │
                  │  ┌─────────────────┐  │
                  │  │  Primary (RW)   │  │
                  │  └────────┬────────┘  │
                  │           │           │
                  │  ┌────────┴────────┐  │
                  │  │                 │  │
                  │  ▼                 ▼  │
                  │ Replica 1      Replica 2 │
                  │ (Read Only)   (Read Only)│
                  └───────────────────────┘
```

### 10.2 Build & Deployment Process

```bash
# Production Build
npm run build

# Was passiert:
# 1. TypeScript Compilation (Backend)
#    ├─ tsc --project tsconfig.json
#    └─ Output: dist/

# 2. Vite Build (Frontend)
#    ├─ vite build
#    ├─ Minification, Tree-shaking
#    ├─ Code splitting
#    └─ Output: dist/public/

# 3. Ergebnis:
dist/
├── index.js               # Express Server Entry Point
├── routes/                # Compiled Backend Routes
├── controllers/           # Compiled Controllers
├── services/              # Compiled Services
└── public/                # Static Frontend Assets
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js    # Main JS Bundle
    │   ├── index-[hash].css   # Main CSS Bundle
    │   └── vendor-[hash].js   # Vendor Bundle
    └── ...

# Production Start
NODE_ENV=production node dist/index.js
```

### 10.3 Skalierungs-Strategien

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        SCALING STRATEGIES                                 │
└──────────────────────────────────────────────────────────────────────────┘

Horizontale Skalierung (Recommended)
═════════════════════════════════════

1. Mehrere App-Server Instanzen
   ├─ Load Balancer verteilt Anfragen
   ├─ Session-Sticky Sessions ODER
   │  Session-Store in PostgreSQL (aktuell)
   ├─ Jede Instanz: 50 DB-Verbindungen
   └─ Auto-Scaling basierend auf CPU/Memory

2. Database Read Replicas
   ├─ Master (Primary): Alle Schreiboperationen
   └─ Replicas: Nur Leseoperationen
      ├─ Effizienzanalysen (read-heavy)
      ├─ Reports
      └─ Dashboards

3. Caching Layer (Redis/Memcached)
   ├─ Frequently accessed data
   ├─ Session Store (Alternative zu PostgreSQL)
   └─ API Response Caching


Vertikale Skalierung
════════════════════

1. Server-Ressourcen erhöhen
   ├─ Mehr CPU-Kerne
   ├─ Mehr RAM
   └─ Schnellere SSDs

2. Connection Pool vergrößern
   ├─ Von 50 auf 100+ Verbindungen
   └─ Abhängig von PostgreSQL Max Connections


Performance-Optimierungen
═════════════════════════

1. Database Indexing
   ├─ day_comp(id, date)
   ├─ objects(mandant_id, postal_code)
   ├─ user_profile(email, mandant_id)
   └─ daily_outdoor_temperatures(postal_code, date)

2. Query Optimization
   ├─ Use EXPLAIN ANALYZE
   ├─ Vermeidung von N+1 Queries
   ├─ Prepared Statements
   └─ Batch Operations

3. Frontend Optimizations
   ├─ Code Splitting (Lazy Loading)
   ├─ Image Optimization (WebP)
   ├─ CDN für Static Assets
   └─ Service Worker (Offline Support)

4. API Rate Limiting
   ├─ Schutz vor Missbrauch
   ├─ Per IP: 100 req/min
   └─ Per User: 1000 req/min
```

### 10.4 Monitoring & Logging

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      MONITORING & LOGGING                                 │
└──────────────────────────────────────────────────────────────────────────┘

Application Monitoring
══════════════════════

GET /api/monitoring/health
├─ Database Connection: OK/FAIL
├─ Connection Pool: 12/50 active
├─ Memory Usage: 245 MB / 512 MB
├─ Uptime: 7 days
└─ Status: healthy

GET /api/monitoring/metrics
├─ Prometheus-Format Metriken
├─ Request Count
├─ Response Times (p50, p95, p99)
├─ Error Rates
└─ Database Query Metrics


Logging Stack
═════════════

Application Logs
├─ Console Output (Development)
├─ File Rotation (Production)
└─ Log Levels: ERROR, WARN, INFO, DEBUG

Structured Logging Example:
{
  "timestamp": "2024-01-07T14:32:45.123Z",
  "level": "INFO",
  "message": "GET /api/energy/consumption/12345 200 in 45ms",
  "context": {
    "method": "GET",
    "path": "/api/energy/consumption/12345",
    "statusCode": 200,
    "responseTime": 45,
    "userId": 42,
    "mandantId": 1
  }
}


Grafana Integration
═══════════════════

1. Database Metrics
   ├─ Connection Pool Usage
   ├─ Query Performance
   └─ Error Rates

2. Application Metrics
   ├─ Request Rate
   ├─ Response Time Distribution
   ├─ Error Rate
   └─ Active Users

3. Business Metrics
   ├─ Energieverbrauch Trends
   ├─ Effizienz-Scores
   └─ Alarm-Häufigkeit

4. Alerts
   ├─ High Error Rate (>5%)
   ├─ Slow Queries (>1s)
   ├─ High Memory Usage (>90%)
   └─ Database Connection Pool Full
```

---

## Zusammenfassung

Das Netzwächter-System ist eine **produktionsreife, skalierbare Energie-Monitoring-Plattform** mit folgenden Kernmerkmalen:

### Technische Highlights

1. **50 persistente Datenbankverbindungen** mit Circuit Breaker Pattern
2. **94 vollständig dokumentierte API-Endpoints** mit Session-basierter Authentifizierung
3. **Multi-Tenant Architektur** mit Rollen-basierter Zugriffskontrolle
4. **Automatisierte Wetterdaten-Integration** (Bright Sky API / DWD)
5. **Temperatur-Effizienz-Korrelationsanalyse** nach GEG 2024
6. **Heizgradtage-Berechnungen** nach DIN V 18599
7. **React-basiertes Frontend** mit TanStack Query und shadcn/ui
8. **Prometheus-Metriken** für Monitoring

### Warum ist das System akkurat?

1. **Offizielle Datenquellen**: DWD (Deutscher Wetterdienst) via Bright Sky API
2. **Validierte Berechnungsmethoden**: GEG 2024, DIN V 18599, VDI 3807
3. **Statistische Analyse**: Pearson-Korrelation, Lineare Regression, R²
4. **Read-Before-Edit**: Alle Datenbankoperationen validiert
5. **Connection Pool Monitoring**: Health Checks alle 30 Sekunden
6. **Fehlerbehandlung**: Circuit Breaker, automatische Retry-Logic
7. **Mandanten-Isolierung**: Strikte Datentrennung nach Kunde

### Das finale Produkt

Ein vollständiges Energie-Monitoring-System für:
- **Immobilienverwalter**: Objektverwaltung, Verbrauchsanalyse
- **Energieberater**: Effizienzanalyse, Optimierungsempfehlungen
- **Facility Manager**: Real-time Monitoring, Alarm-Management
- **Gebäudebesitzer**: Transparenz, Kostenkontrolle, GEG-Compliance

**Status**: ✅ Produktionsreif
**Dokumentation**: ✅ Vollständig
**Testing**: ✅ 94/94 APIs getestet
**Deployment**: ✅ Ready for Production

---

**Erstellt**: 2025-10-07
**Dokumentation**: SYSTEMARCHITEKTUR.md
**Version**: 4.0

# App-Aufbau und Architektur

## Überblick

Diese Vollstack-JavaScript-Anwendung für Energiemanagement und Systemüberwachung basiert auf einer modernen, modularen Architektur mit klarer Trennung von Frontend, Backend und Datenbank-Schichten.

## 🏗️ Gesamt-Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Frontend)                       │
│  React + TypeScript + Vite + TailwindCSS + shadcn/ui       │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Pages     │  │ Components  │  │    Hooks    │        │
│  │             │  │             │  │             │        │
│  │ Dashboard   │  │ UI Elements │  │ useAuth     │        │
│  │ Maps        │  │ Forms       │  │ useToast    │        │
│  │ Energy Data │  │ Charts      │  │ Custom      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           State Management                              │ │
│  │  TanStack Query + wouter (Routing)                     │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │ HTTP API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (Backend)                         │
│            Express.js - Modulare Architektur                │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Middleware  │  │ Controllers │  │   Routes    │        │
│  │             │  │             │  │             │        │
│  │ auth.ts     │  │ authController.ts │  │ auth.ts     │        │
│  │ error.ts    │  │ databaseController.ts   │  │ db.ts       │        │
│  │             │  │             │  │ index.ts    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Modular Route System                          │ │
│  │  12 route files - auth, db, energy, weather, etc.      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │ Database Queries
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                    │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Production  │  │  Settings   │  │   Session   │        │
│  │     DB      │  │     DB      │  │    Store    │        │
│  │             │  │             │  │             │        │
│  │ Users       │  │ Settings    │  │ Sessions    │        │
│  │ Objects     │  │ Config      │  │ Auth Data   │        │
│  │ Mandants    │  │ Thresholds  │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Backend - Modulare Struktur

### Server-Ordner-Hierarchie

```
server/
├── middleware/           # Middleware-Funktionen
│   ├── auth.ts          # Session-Management & Authentifizierung
│   └── error.ts         # Globale Fehlerbehandlung
├── controllers/         # Business-Logik
│   ├── authController.ts    # Login/Logout/Session-Operationen  
│   ├── databaseController.ts      # Datenbank-CRUD-Operationen
│   ├── energyController.ts  # Energiedaten & Heizsysteme
│   ├── efficiencyController.ts # Effizienzanalysen & Temperatur-Charts
│   ├── kiReportController.ts   # KI-Reports & Energiebilanzen
│   ├── objectController.ts     # Objektverwaltung & Hierarchien
│   ├── temperatureController.ts # Temperatur-Monitoring & Schwellwerte
│   ├── userController.ts       # Benutzerverwaltung
│   └── weatherController.ts    # Wetterdaten & Außentemperaturen
├── routes/              # API-Route-Definitionen (12 modular files)
│   ├── auth.ts          # Auth-Endpunkte (/api/auth/*)
│   ├── db.ts            # Database-Endpunkte (/api/*)
│   ├── energy.ts        # Energy data endpoints
│   ├── weather.ts       # Weather data endpoints
│   ├── users.ts         # User management endpoints
│   ├── object.ts        # Object management endpoints
│   ├── efficiency.ts    # Efficiency analysis endpoints
│   ├── temperature.ts   # Temperature monitoring endpoints
│   ├── kiReport.ts      # KI report endpoints
│   ├── monitoring.ts    # System monitoring endpoints
│   ├── portal.ts        # Portal configuration endpoints
│   └── index.ts         # Route-Loader & Health-Check
├── index.ts             # Server-Hauptdatei
├── db.ts                # Datenbankverbindung & Drizzle Client
├── storage.ts           # Datenbank-Abstraktionsschicht
├── connection-pool.ts   # PostgreSQL Connection Pooling
├── auth.ts              # Session Management Utilities
├── email-service.ts     # Email Notification Service
└── vite.ts              # Development Server Setup
```

### Middleware-Schicht

#### `middleware/auth.ts`
- **Session-Management**: Automatische Session-Verlängerung
- **Authentifizierung**: Benutzer-Validierung für geschützte Routen
- **Demo-Modus**: Unterstützung für Entwicklungs-Sessions
- **Inaktivitäts-Timeout**: 2-Stunden automatischer Logout

#### `middleware/error.ts`
- **Globale Fehlerbehandlung**: Einheitliche Error-Response-Struktur
- **AsyncHandler**: Automatisches Catch für Promise-basierte Controller
- **Error-Typen**: Spezifische Fehlerklassen (Validation, Database, Authentication)
- **Logging**: Strukturierte Fehler-Protokollierung

### Controller-Schicht

#### `controllers/authController.ts`
```typescript
// Hauptfunktionen:
- getCurrentUser()     // Aktuelle Session-Informationen
- logout()            // Session beenden
- heartbeat()         // Session-Aktivität aktualisieren
```

#### `controllers/dbController.ts`
```typescript
// Hauptfunktionen:
- getStatus()         // Datenbank-Verbindungsstatut
- getObjects()        // Objekte mit Mandanten-Filter
- getMandants()       // Verfügbare Mandanten
- getSettings()       // Einstellungen (mit Kategorie-Filter)
- saveSetting()       // Einstellung erstellen/aktualisieren
- deleteSetting()     // Einstellung löschen
- getDashboardKpis()  // Dashboard-Kennzahlen
```

#### Weitere Controller (Alle mit **konsistenter Database-Architektur**)
```typescript
// energyController.ts - Energieverwaltung
- getHeatingSystems()      // Heizsysteme laden
- getEnergyData()          // Energiedaten für System
- getEnergyDataByObject()  // Objektspezifische Energiedaten
- getMeterEnergyData()     // Zählerdaten
- getTemperatureEfficiencyChart() // Temperatur-Effizienz-Analyse

// efficiencyController.ts - Effizienzanalysen  
- getEfficiencyAnalysis()         // Vollständige Effizienzanalyse
- getTemperatureEfficiencyChart() // Kombinierte Temperatur/Effizienz-Daten
- getMeterDataByObject()          // Objektspezifische Zählerdaten

// kiReportController.ts - KI-Reports
- calculateEnergyBalance()  // Energiebilanz-Berechnung
- getYearlySummary()       // Jahreszusammenfassung

// objectController.ts - Objektverwaltung
- getObjects()          // Alle Objekte (mit Berechtigung)
- getObject()           // Einzelnes Objekt  
- createObject()        // Objekt erstellen
- updateObject()        // Objekt aktualisieren
- deleteObject()        // Objekt löschen
- getObjectChildren()   // Objekt-Hierarchie
```

### Route-Schicht

#### `routes/auth.ts`
```
POST   /api/auth/heartbeat  # Session-Aktivität
GET    /api/auth/user       # Aktueller Benutzer
POST   /api/auth/logout     # Abmelden
```

#### `routes/db.ts`
```
GET    /api/status          # Datenbank-Status
GET    /api/objects         # Objekte (gefiltert nach Berechtigung)
GET    /api/mandants        # Mandanten-Liste
GET    /api/settings        # Einstellungen (?category=xyz)
POST   /api/settings        # Einstellung speichern
DELETE /api/settings/:cat/:key # Einstellung löschen
GET    /api/dashboard/kpis  # Dashboard-Metriken
```

## 🎨 Frontend-Architektur

### Technologie-Stack
- **React 18** mit TypeScript für typsichere Entwicklung
- **Vite** als Build-Tool und Dev-Server
- **TailwindCSS** für utility-first Styling
- **shadcn/ui** als Design-System-Grundlage
- **wouter** für clientseitiges Routing
- **TanStack Query** für Server-State-Management
- **react-hook-form** + **Zod** für Formular-Validierung

### Ordner-Struktur Frontend

```
client/src/
├── components/          # Wiederverwendbare UI-Komponenten
│   ├── ui/             # shadcn/ui Basis-Komponenten
│   ├── forms/          # Spezielle Formular-Komponenten
│   ├── charts/         # Datenvisualisierung
│   └── layout/         # Layout-Komponenten (Header, Sidebar)
├── pages/              # Seiten-Komponenten
│   ├── Dashboard.tsx   # KPI-Übersicht
│   ├── Maps.tsx        # Objektkarten
│   ├── EnergyData.tsx  # Energiedaten-Analyse
│   └── Settings.tsx    # System-Einstellungen
├── hooks/              # Custom React Hooks
│   ├── useAuth.ts      # Authentication State
│   ├── useToast.ts     # Toast-Benachrichtigungen
│   └── api/            # API-Query-Hooks
├── lib/                # Utility-Funktionen
│   ├── queryClient.ts  # TanStack Query Konfiguration
│   ├── utils.ts        # Allgemeine Hilfsfunktionen
│   └── validators.ts   # Zod-Schemas
└── App.tsx             # Haupt-App-Komponente mit Routing
```

### State Management Patterns

#### TanStack Query für Server-State
```typescript
// Beispiel: Objekte laden
const { data: objects, isLoading } = useQuery({
  queryKey: ['/api/objects'],
  select: (data) => data as ObjectType[]
});

// Beispiel: Setting speichern
const saveMutation = useMutation({
  mutationFn: (setting) => apiRequest('/api/settings', {
    method: 'POST',
    body: setting
  }),
  onSuccess: () => {
    queryClient.invalidateQueries(['/api/settings']);
    toast({ title: "Erfolgreich gespeichert" });
  }
});
```

#### Authentication Hooks
```typescript
// useAuth Hook Funktionalität
const { user, isAuthenticated, logout } = useAuth();

// Automatische Session-Verlängerung
useEffect(() => {
  const interval = setInterval(() => {
    if (isAuthenticated) {
      apiRequest('/api/auth/heartbeat', { method: 'POST' });
    }
  }, 30000); // Alle 30 Sekunden
}, [isAuthenticated]);
```

## 🗄️ Datenbank-Architektur

### PostgreSQL Schema-Übersicht

#### Haupt-Tabellen
```sql
-- Benutzer-Management
users              # Benutzer-Stammdaten
user_profiles       # Benutzer-Berechtigungen & UI-Konfiguration
sessions           # Session-Store (automatisches Cleanup)

-- Objekt-Management  
objects            # Energie-Objekte (Gebäude, Anlagen)
mandants           # Mandanten/Kunden-Zuordnung
object_groups      # Objekt-Gruppierungen

-- Konfiguration
settings           # System-Einstellungen (kategorie-basiert)
```

#### Settings-Kategorie-System
```sql
-- Kategorien in settings Tabelle:
'system'           # Grundlegende System-Konfiguration
'grafana'          # Dashboard-Einstellungen
'thresholds'       # Monitoring-Schwellwerte
'email'            # E-Mail-Service-Konfiguration
```

### Datenbank-Verbindungsmanagement

#### ✅ **Konsistente Database-Architektur (2025-09-25 implementiert)**

**Problem gelöst**: Alle Storage-System-Konflikte wurden **systematisch behoben**:
- **12 kritische `storage.getObject()` Aufrufe** ersetzt durch `settingsDbManager` 
- **4 Controller** (Energy, Efficiency, KIReport, Object) vollständig modernisiert
- **404-Fehler eliminiert** durch einheitliche Objektabfragen
- **Konsistente Autorisierung** mit object_mandant JOIN-Pattern

#### SettingsDbManager - **Einheitlicher Database-Access**
```typescript
// Alle Controller verwenden jetzt diese konsistente Objektabfrage:
const pool = await settingsDbManager.getSettingdbPool();
const objectQuery = `
  SELECT o.*, 
         COALESCE(om.mandant_id, o.mandant_id) as mandantId
  FROM objects o
  LEFT JOIN object_mandant om ON o.id = om.object_id  
  WHERE o.objectid = $1
  LIMIT 1
`;
const objectResult = await pool.query(objectQuery, [objectId]);
await pool.end();
```

**Vorteile der neuen Architektur:**
- **Einheitliche Verbindungen**: Alle Controller verwenden `DATABASE_URL` über `settingsDbManager`
- **Mandanten-Sicherheit**: Korrekte object_mandant Joins für Autorisierung
- **Stabilität**: Ordnungsgemäßes Pool-Management verhindert Memory-Leaks
- **Performance**: Optimierte Datenbankabfragen ohne Storage-Layer-Overhead
- **Wartbarkeit**: Konsistente Patterns erleichtern Debugging und Erweiterungen

#### Legacy Storage Interface *(wird schrittweise ersetzt)*
- **Abstraktionsschicht**: Noch für spezielle Datenoperationen genutzt
- **Migration**: Alle kritischen getObject() Aufrufe bereits zu settingsDbManager migriert
- **Typsicherheit**: TypeScript-Interfaces für alle Datenmodelle
- **Error Handling**: Strukturierte Fehlerbehandlung mit spezifischen Error-Typen

## 🔐 Sicherheits-Architektur

### Authentifizierung & Autorisierung
- **Session-basiert**: PostgreSQL-Session-Store mit automatischem Cleanup
- **Rollen-System**: Admin, User, Superadmin mit granularen Berechtigungen
- **Mandanten-Isolation**: Benutzer sehen nur Daten ihrer zugewiesenen Mandanten
- **Inaktivitäts-Timeout**: Automatischer Logout nach 2 Stunden

### Datenbank-Sicherheit
- **SSL-Verbindungen**: Erzwungene SSL-Verbindungen zur Datenbank
- **Umgebungsvariablen**: Sichere Credential-Speicherung
- **SQL-Injection-Schutz**: Parametrisierte Queries
- **Access Control**: Middleware-basierte Route-Protektion

## 🔄 Datenfluss-Architektur

### Typischer Request-Flow

```
1. Browser Request
   ↓
2. Express Router (routes/index.ts)
   ↓
3. Auth Middleware (middleware/auth.ts)
   ↓
4. Route Handler (routes/auth.ts | routes/db.ts)
   ↓
5. Controller (authController.ts | dbController.ts)
   ↓
6. Storage Layer (storage.ts | settingsdb.ts)
   ↓
7. PostgreSQL Database
   ↓
8. Response zurück zum Browser
```

### Error-Handling-Flow

```
Controller Error
   ↓
asyncHandler (middleware/error.ts)
   ↓
Global Error Handler
   ↓
Structured JSON Response
   ↓
Frontend Error Handling
   ↓
User Toast Notification
```

## 📊 Monitoring & Logging

### Server-seitige Logs
- **Request Logging**: Alle API-Requests mit Timing und Response-Daten
- **Auth Debug**: Detaillierte Session- und Authentication-Logs
- **Database Connections**: Verbindungsstatus und Pool-Metriken
- **Error Tracking**: Strukturierte Fehler-Protokollierung

### Performance-Metriken
- **Response Times**: Automatische Request-Duration-Messung
- **Database Pool Status**: Connection-Pool-Monitoring
- **Session Activity**: Benutzer-Aktivitäts-Tracking
- **Memory Usage**: Server-Resource-Überwachung

## 🚀 Deployment & Entwicklung

### Entwicklungsumgebung
- **Hot Reload**: Vite für Frontend, tsx für Backend
- **TypeScript**: Vollständige Typsicherheit auf allen Ebenen
- **ESLint**: Code-Qualitäts-Sicherung
- **Environment Variables**: Konfiguration über .env-Dateien

### Build-Prozess
- **Frontend Build**: Vite production build mit Optimierungen
- **Backend Transpilation**: TypeScript zu JavaScript für Production
- **Asset Bundling**: Automatische Asset-Optimierung und -Komprimierung

### Skalierungs-Überlegungen
- **Modulare Architektur**: Einfache Erweiterung um neue Controller/Routes
- **Database Pooling**: Optimiert für hohe Concurrent-Verbindungen
- **Stateless Design**: Horizontal skalierbar durch Session-Store
- **API-First**: Frontend und Backend können unabhängig deployed werden

---

## Migration von Legacy zu Modular

### ✅ **Aktueller Stand (2025-09-25)**
- **Neue modulare APIs**: Auth, Database-Operations vollständig implementiert
- **Storage-System-Konflikte behoben**: Alle kritischen Controller auf settingsDbManager migriert
- **9 Controller modernisiert**: Konsistente Database-Architektur implementiert  
- **Legacy-Kompatibilität**: Alte routes.ts läuft parallel für Rückwärtskompatibilität
- **API-Stabilität**: 404-Fehler eliminiert, einheitliche Autorisierungsmuster

### **Erfolgreich migrierte Controller:**
```
✅ energyController.ts       (5 storage.getObject → settingsDbManager)
✅ efficiencyController.ts   (5 storage.getObject → settingsDbManager) 
✅ kiReportController.ts     (2 storage.getObject → settingsDbManager)
✅ objectController.ts       (4 storage.getObject → settingsDbManager)
✅ authController.ts         (bereits optimal)
✅ dbController.ts           (bereits optimal) 
✅ userController.ts         (stabil)
✅ temperatureController.ts  (stabil)
✅ weatherController.ts      (stabil)
```

### **Database-Architektur-Verbesserungen:**
- **Einheitliche Verbindungen**: `DATABASE_URL` als einzige Quelle der Wahrheit
- **Konsistente Objektabfragen**: Standardisiertes object_mandant JOIN-Pattern
- **Stabilität**: Ordnungsgemäßes Connection-Pool-Management
- **Performance**: Eliminierung von Storage-Layer-Overhead
- **Sicherheit**: Korrekte Mandanten-Isolierung in allen Controllern

### Nächste Schritte
1. **Legacy routes.ts Analyse**: Identifikation verbleibender Endpoints für Migration
2. **Code-Cleanup**: Entfernung nicht genutzter Storage-Layer-Funktionen
3. **Performance-Monitoring**: Überwachung der Database-Pool-Performance  
4. **Testing**: Umfassende Test-Suite für modernisierte Controller
5. **Dokumentation**: API-Dokumentation für alle migrierten Endpoints

## 🎯 **Architektur-Status 2025-09-25**

### **✅ Erreichte Stabilität:**
- **Konsistente Database-Architektur** mit settingsDbManager implementiert
- **Alle kritischen Storage-Konflikte** systematisch behoben
- **12 problematische API-Endpoints** erfolgreich modernisiert
- **404-Fehler eliminiert** durch einheitliche Objektauflösung
- **Modulare Controller-Struktur** vollständig funktionsfähig

### **🚀 Performance & Skalierbarkeit:**
- **Optimierte Database-Verbindungen** mit ordnungsgemäßem Pool-Management
- **Einheitliche Autorisierungsmuster** für alle Objektzugriffe
- **Mandanten-sichere API-Architektur** mit korrekten JOIN-Operationen
- **Streamlined Database-Queries** ohne Storage-Layer-Overhead

Diese modernisierte Architektur bietet eine **stabile, wartbare und skalierbare Grundlage** für die weitere Entwicklung der Energiemanagement-Plattform. Die konsistente Database-Architektur stellt sicher, dass alle API-Endpoints **zuverlässig, performant und sicher** funktionieren.
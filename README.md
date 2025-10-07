# Netzwächter - Energie-Monitoring-System

Eine umfassende Full-Stack-Anwendung für Energiemanagement, Gebäudeüberwachung und Effizienzanalyse mit KI-gestützten Berichtsfunktionen.

Letzte Aktualisierung: 2025-10-07

## Überblick

Netzwächter ist eine professionelle Energie-Monitoring- und Management-Plattform, die Echtzeit-Überwachung, Datenvisualisierung und KI-gestützte Analyse für Gebäudeenergiesysteme bereitstellt. Die Anwendung integriert:

- **Bright Sky API** (DWD) für deutsche Wetterdaten und Temperaturkorrelation
- **Grafana** für erweiterte Visualisierungs-Dashboards
- **OpenAI API** für KI-gestützte Energieanalyse und Berichterstattung
- **Multi-Mandanten-Architektur** mit Unterstützung für mehrere Gebäudeportfolios

### Hauptfunktionen

- Echtzeit-Energieverbrauchsüberwachung
- Temperatur-Effizienz-Korrelationsanalyse (GEG 2024-konform)
- Heizgradtage-Berechnungen (DIN V 18599)
- Witterungsbereinigte Benchmarks (VDI 3807)
- KI-gestützte Einblicke und natürlichsprachliche Berichte
- Interaktive Karten mit Gebäudestatus-Visualisierung
- Rollenbasierte Zugriffskontrolle mit Superadmin-Funktionen

## Technologie-Stack

### Backend
- **Laufzeit**: Node.js 18+ mit Express.js
- **Sprache**: TypeScript (Strict-Modus)
- **Datenbank**: PostgreSQL (Neon DB) mit Connection Pooling
- **Authentifizierung**: JWT-basierte Sessions mit bcrypt-Passwort-Hashing
- **E-Mail-Service**: Nodemailer mit SendGrid-Integration
- **Echtzeit**: WebSocket (ws) für Live-Updates
- **API-Stil**: RESTful mit umfassender Validierung
- **ORM**: Drizzle ORM mit typsicheren Abfragen
- **Wetter-API**: Bright Sky (DWD - Deutscher Wetterdienst)
- **HTTP-Client**: Axios für externe API-Aufrufe

### Frontend
- **Framework**: React 18.3.1
- **Sprache**: TypeScript
- **Routing**: Wouter (leichtgewichtiger React Router)
- **State Management**: React Query (@tanstack/react-query) + Context API
- **UI-Bibliothek**: Radix UI-Komponenten (shadcn/ui)
- **Styling**: Tailwind CSS
- **Diagramme**: Recharts
- **Karten**: Leaflet mit React-Leaflet
- **Formulare**: React Hook Form mit Zod-Validierung
- **Datei-Upload**: Uppy
- **KI-Integration**: OpenAI API

### Build-Tools
- **Build**: Vite
- **Paketmanager**: npm
- **Entwicklung**: tsx (TypeScript-Ausführung)
- **Produktions-Build**: esbuild

## Architektur

### High-Level-Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React SPA)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   UI-Ebene   │  │  Komponenten │  │   Seiten & Routing   │  │
│  │  (Radix UI)  │  │   (Custom)   │  │     (Wouter)         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         State Management (React Query + Context)          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API Client (Fetch + React Query)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER (Express.js + TypeScript)              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Middleware-Ebene                       │  │
│  │  • Authentifizierung (JWT)  • Fehlerbehandlung  • Logging│  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Routen-Ebene                           │  │
│  │  /api/auth  /api/energy  /api/objects  /api/users       │  │
│  │  /api/weather  /api/monitoring  /api/efficiency          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Controller-Ebene                         │  │
│  │  Geschäftslogik • Datenverarbeitung • KI-Integration     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Services-Ebene                         │  │
│  │  • E-Mail-Service  • Speicher  • Connection Pool         │  │
│  │  • Weather Service (Bright Sky API Integration)          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SQL-Abfragen
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATENBANK (PostgreSQL)                        │
│  • Energiedaten  • Objekte  • Benutzer  • Monitoring-Daten     │
│  • Wetterdaten  • Logs  • Konfiguration                        │
└─────────────────────────────────────────────────────────────────┘

                    Externe Integrationen
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Grafana    │  │  OpenAI API  │  │ Bright Sky   │
│  Dashboards  │  │ (KI-Berichte)│  │ (DWD-Wetter) │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Projektstruktur

```
app-version-4_netzwächter/
│
├── server/                      # Backend Express.js-Anwendung
│   ├── index.ts                # Haupt-Server-Einstiegspunkt
│   ├── db.ts                   # Datenbankverbindung & Initialisierung
│   ├── auth.ts                 # Authentifizierungs-Utilities
│   ├── connection-pool.ts      # PostgreSQL Connection Pooling
│   ├── storage.ts              # Datenspeicher-Utilities (142KB)
│   ├── email-service.ts        # E-Mail-Versand-Service
│   ├── sync-object-mandant.ts  # Multi-Mandanten-Synchronisierung
│   ├── vite.ts                 # Vite Dev-Server-Setup
│   │
│   ├── controllers/            # Route-Handler & Geschäftslogik
│   │   ├── authController.ts
│   │   ├── energyController.ts     # (43KB - größter Controller)
│   │   ├── objectController.ts
│   │   ├── userController.ts
│   │   ├── monitoringController.ts
│   │   ├── efficiencyController.ts
│   │   ├── weatherController.ts
│   │   ├── temperatureController.ts
│   │   ├── kiReportController.ts   # KI-Berichtsgenerierung
│   │   └── databaseController.ts
│   │
│   ├── routes/                 # API-Routendefinitionen
│   │   ├── index.ts           # Routen-Aggregator
│   │   ├── auth.ts
│   │   ├── energy.ts
│   │   ├── object.ts
│   │   ├── users.ts
│   │   ├── monitoring.ts
│   │   ├── efficiency.ts
│   │   ├── weather.ts
│   │   ├── temperature.ts
│   │   ├── kiReport.ts
│   │   ├── portal.ts
│   │   └── db.ts
│   │
│   ├── services/               # Service-Ebene
│   │   └── weatherService.ts   # Bright Sky API-Integration (390 Zeilen)
│   │
│   ├── scripts/                # Utility-Skripte
│   │   ├── importWeatherData.ts   # Historischer Wetterdaten-Import
│   │   └── dailyWeatherUpdate.ts  # Tägliches automatisches Wetter-Update
│   │
│   └── middleware/             # Express-Middleware
│       ├── auth.ts            # Authentifizierungs-Middleware
│       └── error.ts           # Fehlerbehandlungs-Middleware
│
├── client/                     # Frontend React-Anwendung
│   ├── public/                # Statische Assets
│   └── src/
│       ├── main.tsx           # React-App-Einstiegspunkt
│       ├── App.tsx            # Haupt-App-Komponente mit Routing
│       │
│       ├── pages/             # Seitenkomponenten (24 Seiten)
│       │   ├── Login.tsx
│       │   ├── LoginStrawa.tsx
│       │   ├── LayoutStrawa.tsx        # 4-Tab-Layout
│       │   ├── Dashboard.tsx
│       │   ├── AdminDashboard.tsx
│       │   ├── EnergyData.tsx
│       │   ├── EfficiencyAnalysis.tsx
│       │   ├── TemperatureAnalysis.tsx
│       │   ├── GrafanaDashboard.tsx
│       │   ├── ObjectManagement.tsx
│       │   ├── UserManagement.tsx
│       │   ├── NetworkMonitor.tsx
│       │   ├── SystemSettings.tsx
│       │   ├── ApiManagement.tsx
│       │   ├── DbEnergyDataConfig.tsx
│       │   ├── Maps.tsx
│       │   ├── Logbook.tsx
│       │   ├── User.tsx
│       │   ├── UserSettings.tsx
│       │   ├── Devices.tsx
│       │   ├── Geraeteverwaltung.tsx
│       │   ├── ModbusConfig.tsx
│       │   ├── PerformanceTest.tsx
│       │   └── SuperadminLogin.tsx
│       │
│       ├── components/         # Wiederverwendbare Komponenten (55+ Komponenten)
│       │   ├── Layout.tsx                      # Haupt-Sidebar-Layout
│       │   ├── DatabaseStatusHeader.tsx
│       │   ├── SessionWarning.tsx
│       │   ├── GrafanaDiagramme.tsx
│       │   ├── GrafanaLogic.tsx
│       │   ├── GrafanaReport.tsx
│       │   ├── KI_energy.tsx                   # KI-Komponenten
│       │   ├── KI_energy_jahr.tsx
│       │   ├── KI_energy_jahr_wrapper.tsx
│       │   ├── KI_energy_netz.tsx
│       │   ├── LoginModal.tsx
│       │   ├── UserSettingsModal.tsx
│       │   ├── ObjectListLayout.tsx
│       │   ├── SystemPortalSetup.tsx
│       │   ├── ExportDialog.tsx
│       │   ├── NetzView.tsx
│       │   ├── TemperatureEfficiencyChart.tsx
│       │   │
│       │   ├── ui/                             # shadcn/ui-Komponenten (30+ Dateien)
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── input.tsx
│       │   │   ├── table.tsx
│       │   │   └── ... (weitere UI-Komponenten)
│       │   │
│       │   ├── netzstrawa/                     # Netzstrawa-spezifische UI
│       │   │   ├── sidebar.tsx
│       │   │   └── slide-network-monitor.tsx
│       │   │
│       │   └── shared/
│       │       └── energy-utils.tsx
│       │
│       ├── hooks/              # Custom React Hooks
│       │   ├── useAuth.ts
│       │   ├── useUIMode.ts
│       │   ├── use-toast.ts
│       │   └── use-mobile.tsx
│       │
│       ├── lib/                # Utility-Bibliotheken
│       │   ├── utils.ts
│       │   ├── authUtils.ts
│       │   ├── api-utils.ts
│       │   ├── queryClient.ts
│       │   └── userActivityLogger.ts
│       │
│       ├── contexts/           # React-Contexts
│       │   └── CockpitContext.tsx
│       │
│       └── utils/
│           └── grafanaConfig.ts
│
├── shared/                     # Gemeinsame TypeScript-Typen
│   └── schema.ts              # Gemeinsame Typen & Schemas
│
├── Dokumentation/              # Projektdokumentation
│   ├── api/
│   ├── analysis/
│   ├── Cursor/
│   ├── Grafana_Cursor/
│   └── replit/
│
├── archive/                    # Archivierter/Legacy-Code
│   ├── client/
│   ├── server/
│   └── root/
│
├── test/                       # Test-Skripte
│   ├── api-cleanup-tests.sh
│   ├── functional-api-tests.sh
│   ├── quick-validation.sh
│   ├── test_apis.sh
│   ├── test_apis_comprehensive.sh
│   ├── TEST_VALIDATION_REPORT.md
│   └── TESTING_COMPLETE.md
│
├── todo/                       # Todo-Tracking
│
├── dist/                       # Produktions-Build-Ausgabe
│
├── Konfigurationsdateien
├── package.json               # Abhängigkeiten & Skripte
├── tsconfig.json              # TypeScript-Konfiguration
├── vite.config.ts             # Vite-Build-Konfiguration
├── tailwind.config.ts         # Tailwind-CSS-Konfiguration
├── drizzle.config.ts          # Drizzle-ORM-Konfiguration
├── .env                       # Umgebungsvariablen
├── .gitignore
├── FILE_STRUCTURE.md          # Detaillierte Dateidokumentation
├── WEATHER_DATA_SETUP.md      # Wetterdaten-Integrationsleitfaden
└── ARCHIVE_CLEANUP_2025-10-07.md  # Archiv-Bereinigungsbericht
```

## Kernfunktionen

### Basisfunktionalität
- Echtzeit-Energieüberwachung und Visualisierung
- Multi-Mandanten-Gebäude-/Objektverwaltung
- Benutzerauthentifizierung und rollenbasierte Zugriffskontrolle
- Interaktive Grafana-Dashboard-Integration
- Temperatur- und Wetterdatenkorrelation
- Energieeffizienzanalyse und Berichterstattung
- KI-gestützte Einblicke und Berichte (OpenAI-Integration)
- Netzwerkgeräte-Überwachung
- Modbus-Protokoll-Gerätekonfiguration
- Leistungstests und Benchmarking

### Benutzeroberfläche
- **Cockpit-Modus**: Vollständige Sidebar-Navigation mit allen Funktionen
- **Strawa-Modus**: Vereinfachtes 4-Tab-Layout für spezifische Anwendungsfälle
- Responsives Design mit Mobil-Unterstützung
- Dark/Light-Theme-Unterstützung
- Echtzeit-Datenbankverbindungsstatus
- Session-Timeout-Warnungen
- Interaktive Karten für Objektvisualisierung

### Administrative Funktionen
- Benutzerverwaltung mit rollenbasierten Berechtigungen
- Superadmin-Zugriff mit speziellem Login
- Systemkonfiguration und Portal-Setup
- Datenbankverwaltung
- API-Endpunkt-Test-Interface
- Aktivitätsprotokollierung und Logbuch
- E-Mail-Benachrichtigungssystem

## API-Endpunkte

### Authentifizierung
- `POST /api/login` - Benutzer-Login
- `POST /api/logout` - Benutzer-Logout
- `GET /api/auth/user` - Aktuellen Benutzer abrufen

### Energiedaten
- `GET /api/energy-data` - Energieverbrauchsdaten abrufen
- `GET /api/energy` - Energiemetriken und Statistiken

### Objekte (Gebäude)
- `GET /api/objects` - Alle Objekte auflisten
- `POST /api/objects` - Neues Objekt erstellen
- `PUT /api/objects/:id` - Objekt aktualisieren
- `DELETE /api/objects/:id` - Objekt löschen

### Benutzer
- `GET /api/users` - Benutzer auflisten (nur Admin)
- `POST /api/users` - Benutzer erstellen
- `PUT /api/users/:id` - Benutzer aktualisieren
- `DELETE /api/users/:id` - Benutzer löschen

### Überwachung
- `GET /api/monitoring` - System-Monitoring-Daten
- `GET /api/network-monitor` - Netzwerkstatus

### Effizienz & Analyse
- `GET /api/efficiency-analysis` - Energieeffizienz-Metriken
- `GET /api/temperature` - Temperaturdaten
- `GET /api/weather` - Wetterinformationen
- `GET /api/outdoor-temperatures` - Historische Temperaturdaten
- `GET /api/outdoor-temperatures/postal-code/:postalCode` - Temperatur nach PLZ

### KI & Berichte
- `POST /api/ki-report` - KI-gestützten Energiebericht generieren

### Datenbank
- `GET /api/db/status` - Datenbankverbindungsstatus
- `GET /api/test-db-connection` - Datenbankkonnektivität testen

### Portal-Konfiguration
- `GET /api/portal/config` - Portal-Konfiguration abrufen
- `POST /api/portal/setup` - Portal-Setup aktualisieren

## Datenbankschema

Die Anwendung verwendet PostgreSQL mit folgenden Haupttabellen:

- **Users**: Benutzerkonten und Authentifizierung
- **Objects**: Gebäude/Standorte, die überwacht werden
- **Energy Data** (day_comp): Energieverbrauchsmessungen
- **Daily Outdoor Temperatures**: Temperaturdaten von Bright Sky API (DWD)
  - Unique Index auf (postal_code, date)
  - Felder: temperature_min, temperature_max, temperature_mean
  - Datenquelle: DWD via Bright Sky API
  - 62+ Postleitzahlen mit exakten Koordinaten
  - 30+ regionale Fallbacks für automatische Abdeckung
- **Monitoring Data**: Geräte- und Netzwerkstatus
- **Logs**: Systemaktivitätsprotokolle
- **Portal Configuration** (Settings): Multi-Mandanten-Einstellungen
- **Session Store**: Express-Session-Management

## Entwicklung

### Voraussetzungen
- Node.js (v18+)
- PostgreSQL-Datenbank
- npm-Paketmanager

### Umgebungsvariablen

Erstellen Sie eine `.env`-Datei im Root-Verzeichnis:

```env
# Datenbank
DATABASE_URL=postgresql://user:password@host:port/database

# Server
PORT=4004
NODE_ENV=development

# Authentifizierung
SESSION_SECRET=ihr-session-secret-hier

# E-Mail (optional)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAILSERVER_PASSWORD=ihr-passwort

# Datenbank-Connection-Pool
DB_POOL_MIN=50
DB_POOL_MAX=50
DB_POOL_IDLE_TIMEOUT=0
DB_CONNECTION_TIMEOUT=5000

# Superadmin
SUPERADMIN_ROLE=superadmin
```

### Installation

```bash
# Abhängigkeiten installieren
npm install

# Datenbankschema pushen
npm run db:push

# Entwicklungsserver starten
npm run dev
```

Die Anwendung ist unter `http://localhost:4004` verfügbar.

### Produktions-Build

```bash
# Client und Server bauen
npm run build

# Produktionsserver starten
npm start
```

### Skripte

- `npm run dev` - Entwicklungsserver mit Hot Reload starten
- `npm run build` - Für Produktion bauen
- `npm start` - Produktionsserver starten
- `npm run check` - TypeScript-Typüberprüfung
- `npm run db:push` - Datenbankschema-Änderungen pushen
- `npm run import:weather [Jahre...]` - Historische Wetterdaten von Bright Sky API importieren
- `npm run weather:daily` - Gestrige Wetterdaten abrufen (für Cron-Automatisierung)

### Wetterdaten-Integration

Siehe `WEATHER_DATA_SETUP.md` für detaillierte Dokumentation zu:
- Bright Sky API-Integration (DWD - Deutscher Wetterdienst)
- Historischer Datenimport (2023-2024)
- Tägliche automatische Updates via Cron
- 62+ unterstützte Postleitzahlen
- Deutsche Standards-Compliance (GEG 2024, DIN V 18599, VDI 3807)

**Schnellstart Wetterdaten**:
```bash
# 2024-Daten importieren
npm run import:weather 2024

# Mehrere Jahre importieren
npm run import:weather 2023 2024

# Tägliches Update (für Cron)
npm run weather:daily
```

## UI-Modi

Die Anwendung unterstützt zwei UI-Modi:

### Cockpit-Modus (`ui=cockpit`)
- Vollständige Sidebar-Navigation
- Zugriff auf alle administrativen Funktionen
- Erweiterte Konfigurationsoptionen
- Aktiviert durch URL-Parameter: `?ui=cockpit`

### Strawa-Modus (Standard)
- Vereinfachtes 4-Tab-Layout
- Fokus auf Kern-Monitoring-Funktionen
- Optimierte Benutzererfahrung
- Standardmodus ohne URL-Parameter

## Authentifizierung

### Benutzerrollen
- **User**: Standardzugriff auf Monitoring-Funktionen
- **Admin**: Zugriff auf Benutzerverwaltung und Konfiguration
- **Superadmin**: Vollständiger Systemzugriff inkl. Datenbankverwaltung

### Login-Routen
- `/login` - Standard-Login
- `/anmelden` - Strawa-Style-Login
- `/superadmin-login` - Superadmin-Login

## Integrationspunkte

### Grafana
- Eingebettete Grafana-Dashboards
- Custom-Iframe-Wrapper unter `/startki`
- Konfiguration via `grafanaConfig.ts`

### OpenAI
- KI-gestützte Energieberichte
- Natürlichsprachliche Einblicke
- Trendanalyse und Empfehlungen

### Bright Sky API (Wetterdaten)
- Kostenlose deutsche Wetterdaten vom DWD (Deutscher Wetterdienst)
- Nur-Temperatur-Integration (GEG 2024, DIN V 18599, VDI 3807-konform)
- 62+ Postleitzahlen mit exakten Koordinaten
- 30+ regionale Fallbacks für automatische Abdeckung
- Historischer Datenimport für 2023-2024
- Tägliche automatische Updates via Cron
- Siehe `WEATHER_DATA_SETUP.md` für detaillierte Dokumentation

### Modbus-Geräte
- Gerätekonfigurations-Interface
- Kommunikation auf Protokollebene
- Echtzeit-Geräteüberwachung

## Dateistatistik

### Aktive Dateien
- Server: 33 Dateien (inkl. weatherService.ts + 2 Skripte)
- Client: 147 Dateien (Seiten + Komponenten + Hooks + Libs + Utils + Contexts)
- Shared: 1 Datei
- Test: 5 Skripte + 2 Berichte
- **Total: 181 aktive Code-Dateien + 7 Test-/Dokumentationsdateien**

### Archivierte Dateien
- 8 Dateien in `/archive` während Bereinigung verschoben
- Mit ursprünglicher Verzeichnisstruktur erhalten
- Keine permanenten Löschungen

### Dokumentationsdateien
- README.md (Haupt-Projektdokumentation)
- WEATHER_DATA_SETUP.md (Wetterdaten-Integrationsleitfaden)
- FILE_STRUCTURE.md (Detailliertes Dateiinventar)
- ARCHIVE_CLEANUP_2025-10-07.md (Archiv-Bereinigungsbericht)
- /Dokumentation (Umfassende technische Dokumentation)

## Leistungsüberlegungen

### Datenbank-Connection-Pooling
- Konfigurierte Pool-Größe: 50 min/max Verbindungen
- Verbindungs-Timeout: 5 Sekunden
- Idle-Timeout: deaktiviert (persistente Verbindungen)
- Leichtgewichtiger Pool für Skripte: 5 Verbindungen

### Große Dateien
- `server/storage.ts` (142KB) - Haupt-Speicher-Utility, könnte Refactoring benötigen
- `server/controllers/energyController.ts` (43KB) - Größter Controller
- `server/services/weatherService.ts` (390 Zeilen) - Bright Sky API-Integration

## Bekannte Probleme & Empfehlungen

### Hohe Priorität
1. **storage.ts überprüfen (142KB)** - In Module aufteilen erwägen
2. **energyController.ts überprüfen (43KB)** - Nach Funktionalität aufteilen erwägen
3. **Routing-Tippfehler beheben** - `/dashbord` sollte `/dashboard` sein (App.tsx:99)

### Mittlere Priorität
1. **Geräteverwaltung konsolidieren** - `Devices.tsx` und `Geraeteverwaltung.tsx` existieren beide
2. **PerformanceTest.tsx überprüfen** - In Dev-Only-Route verschieben erwägen
3. **Routennamen standardisieren** - Mehrere Routen für UserManagement

### Niedrige Priorität
1. **JSDoc-Kommentare hinzufügen** - Alle exportierten Funktionen dokumentieren
2. **Typsicherheit** - `any`-Typen überprüfen und ersetzen
3. **API-Response-Typisierung** - Sicherstellen, dass alle Responses korrekt typisiert sind

## Sicherheit

- JWT-basierte Authentifizierung
- bcrypt-Passwort-Hashing
- Session-Management mit express-session
- Datenbank-Credentials in Umgebungsvariablen
- SQL-Injection-Schutz via parametrisierte Abfragen
- XSS-Schutz via React's eingebautes Escaping

## Lizenz

MIT

## Support

Für Probleme und Feature-Requests konsultieren Sie bitte die Projektdokumentation im `/Dokumentation`-Verzeichnis.

## Mitwirkende

Entwicklungsteam und Mitwirkende werden in der Projektdokumentation erfasst.

---

Letzte Aktualisierung: 2025-10-07

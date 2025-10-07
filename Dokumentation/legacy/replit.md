# Heizungsanlagen-Management-Anwendung

## Overview

This application is a comprehensive heating system management solution designed to optimize energy usage and operational efficiency. It provides real-time KPI dashboards, critical system monitoring, alarm management, and energy optimization recommendations. Key features include comprehensive management of objects and heating units, energy consumption tracking, renewable energy reporting, role-based access control, user management, and seamless Grafana integration. The application targets property managers, facility management companies, and energy service providers, aiming to be a leading solution in the field.

## User Preferences

Preferred communication style: Simple, everyday language.
Database configuration: External PostgreSQL at portal.monitoring.direct:51880/portal
Code organization: Gemeinsame API-Komponenten sollen immer unter `/client/src/components` zur weiteren gemeinsamen Nutzung erstellt werden
App URL preference: User wants to rename app URL from "temperature-analysis" to "outtemp-energy-analysis" to better reflect the outdoor temperature and energy analysis functionality. Domain preference: app.cockpit365.info instead of cockpit365.info

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript.
- **UI Components**: shadcn/ui (based on Radix UI Primitives).
- **Styling**: TailwindCSS with custom design tokens and CSS variables.
- **State Management**: TanStack Query.
- **Routing**: Wouter.
- **Build Tool**: Vite.
- **UI/UX Decisions**: Modern compact design without rounded corners, 0.5px borders, consistent compact header, unified table design with alternating row backgrounds and blue hover effects, collapsible object lists, tab-based interfaces, responsive design, integrated icons, and color-coded status badges. German terminology is used. Tab design employs grey for active and white for inactive tabs, with blue underlining for active states. Features include a functional split-view layout, dynamic "Back" button navigation, optimized object list, and dynamic object header. "Grafana Dashboards" renamed to "Objekt-Monitoring".

### Backend Architecture
- **Framework**: Express.js with TypeScript.
- **Database**: PostgreSQL Portal-DB (`heimkehr_db2025`) with Drizzle ORM.
- **Authentication**: Replit Auth with OpenID Connect.
- **Session Management**: Express-Sessions with PostgreSQL store.
- **Connection-Pooling**: Portal-DB Connection-Pooling via settingsDbManager.
- **API Design**: RESTful API endpoints prefixed with `/api`.
- **Data Validation**: Zod schemas shared between client and server.

### Core Components & Features
- **Database Architecture**: Unified database architecture with `heimkehr_db2025` serving as the central repository for all application data (sessions, users, objects, settings, energy data, climate data). Drizzle ORM for `db.*` access. `settingsDbManager` for Portal-DB pool configuration.
- **Authentication System**: Replit Auth integration, session-based authentication, route protection middleware, user profile management with roles (viewer, user, admin).
- **Core Functions**: KPI Dashboard, Network Monitor for critical system monitoring and alarm management, Efficiency Strategy for energy optimization, Object Management with CRUD operations, Energy Data tracking and reporting, User Management, Temperature Analysis with dynamic thresholding and resolution buttons, and seamless Grafana Integration for embedded dashboards.
- **KI-Analyse Component**: Integrated energy analysis component with a table structure, compact bar charts, evaluation logic, and performance-optimized API-based energy balance calculation with intelligent caching.
- **Layout3 Triple-Panel System**: Functional 3-iframe layout with dynamic content regeneration, supporting `objects.portdata` and `objects.report` data sources.
- **Data Handling**: Includes `defaultGrafana` fallback logic and `ZLOGID` fallback for Grafana integration, and enhanced empty object detection for JSONB fields. Centralized `GrafanaLogic` component for consistent panel and tab generation. Structured JSONB object data editing implemented with Zod schema and React Hook Form. Mobile-responsive sidebar navigation.
- **Klimadaten-Integration**: `daily_outdoor_temperatures` table integrated into Portal-DB.
- **Grafana iframe Optimization**: Stable iframe keys and a URL-caching system implemented to prevent multiple reloads.
- **Performance Optimization**: Intelligent caching and prefetching for time range switching in KI-Analysis component using React Query.
- **Energy Balance Integration**: Automatic energy balance calculation (Erzeuger - Verbraucher = Anlagenverlust) with a three-tier evaluation system.
- **Configuration & Management**: Standardized kWh displays to whole numbers. Automatic Portal-DB setup functionality in System Settings. Robust server restart with database configuration switching. Enhanced JSON Configuration Editor with dual-mode interface, real-time JSON editor, and bidirectional synchronization. Restructured configuration selection with automatic database loading.
- **Erweiterte Mandanten-Verwaltung**: Comprehensive tenant management with structured JSONB info-fields for address and contact data. UserManagement Modal extended with professional input masks and category-based tenant assignment.
- **Zentrale GrafanaDiagramme-Komponente**: Reusable component for consistent Grafana iframe integration, including tab navigation and time range selection.
- **Erweiterte Effizienz-API Integration**: `/api/efficiency-analysis/:objectId` API with LAG-based difference calculations for period-to-period consumption values. Calculates consumption/m² for Netz-Zähler Z20541 based on object area. Supports four time ranges (daily, weekly, monthly, annually) with separate kWh calculations. `ComposedChart` displays temperature lines and efficiency bars with dual Y-axis. Toggle buttons for separate display. Structured summary statistics.
- **Zentrale TemperatureEfficiencyChart-Komponente**: Reusable component (`/client/src/components/TemperatureEfficiencyChart.tsx`) for `objectId` and `timeRange` props. Uses monthly resolution, combines temperature and efficiency data in a `ComposedChart` with dual Y-axis. Implements GEG 2024 efficiency classes with color coding.
- **Split-View Effizienz-Analyse**: New main component (`/efficiency`) with 3 collapsible tables on the left (Critical Systems D-F, Warnings C, Optimized A-B) and object details on the right. Implements 2-column table layout, color-coded categories, search function, and direct link to temperature analysis. Right panel shows object name in title and `TemperatureEfficiencyChart` with dynamic height.
- **Performance-Optimierung Effizienz-Seite**: UI blocking addressed by removing loading screens. Immediate display of empty object lists, parallel background loading of efficiency data, compact loading indicator.
- **Y-Achsen-Optimierung**: Dynamic Y-axis scaling based on GEG 2024 efficiency classes. Temperature Y-axis corrected with compact font.

### System Design Choices
- Consistent visual design elements for a cohesive user experience.
- Clear separation of concerns between frontend and backend.
- Robust data validation and authentication for system integrity.
- Scalable architecture leveraging modern frameworks and tools.

## External Dependencies

### Core Technologies
- **Database**: PostgreSQL Portal-DB (`heimkehr_db2025`) for all application data, settings, energy data, and climate data.
- **Authentication**: Replit Auth Service.
- **UI Library**: Radix UI Primitive via shadcn/ui.
- **Styling**: TailwindCSS.
- **Data Visualization**: Grafana (embedded via iframes).

### Development Tools
- **TypeScript**: Full-stack type safety.
- **Validation**: Zod schemas.
- **Forms**: React Hook Form.
- **Build Tools**: Vite (frontend), esbuild (backend).

## Recent Changes (September 2025)

### Icon-Synchronisation und Benutzerverwaltung (September 9, 2025)
- **Vollständige Icon-Synchronisation**: Alle Icons in setup-app.json wurden mit der echten Sidebar synchronisiert (MapPin für Objekt-Karte, Network für Netzwächter, Leaf für Klassifizierung, Grid3x3 für Objektverwaltung, Monitor für Objekt-Monitoring, Zap für Energiedaten)
- **Benutzerliste-Fix**: Mandanten-Anzeige in der Benutzerliste korrigiert - zeigt jetzt alle berechtigten Mandanten (Haupt-Mandant + mandantAccess Array) statt nur Haupt-Mandant
- **Benutzer-Modal Optimierung**: Permissions-Modal verwendet echte sidebarPermissions aus setup-app.json mit dynamischen Icons und Labels
- **Backend-Route /api/users/mandant**: Optimiert für benutzer-spezifische Mandanten-Berechtigungen (currentUser.mandantId + currentUser.mandantAccess) statt hardcodierte Mandanten-IDs
- **Dynamische Mandanten-Logik**: Ersetzt hardcodierte Arrays [1,2,3] durch benutzerbasierte Berechtigungsprüfung für sichere Multi-Mandanten-Architektur

### System-Setup Erweiterungen (September 2025)
- **Energiedaten-Bereich Neustrukturierung**: Komplett überarbeiteter "Energiedaten" Bereich im System-Setup mit sauberer Trennung zwischen Tabellen und Views. Entfernung redundanter alter Bereiche für verbesserte Übersichtlichkeit.
- **Day Comp (Tagesverbrauchsdaten) Management**: Optimierte UI-Komponente mit zentralisiertem Button für `day_comp` Tabellenerstellung. Korrekte Schema-Definition mit `log BIGINT NOT NULL` als Objekt-ID-Feld statt `objectid`.
- **PostgreSQL View Management**: Streamlined `view_mon_comp` (Monatliche Aggregation) UI mit fokussiertem Erstellen-Button. Automatische Aggregation von Tagesverbrauchsdaten zu monatlichen Zusammenfassungen mit korrekter `log AS object_id` Konvertierung.
- **Schema-Korrekturen**: Vollständige Bereinigung aller `objectid` Referenzen zugunsten des korrekten `log`-Feldes in allen API-Endpunkten, SQL-Queries und Indizes. Korrekte CTE-Struktur mit LAG-Funktionen für monatliche Differenz-Berechnungen.
- **API-Endpunkte Finalized**: Production-ready Backend-Endpunkte `/api/portal/create-day-comp` und `/api/portal/create-view-mon-comp` mit korrekter Portal-DB Integration und Schema-Validierung.
- **Code-Konsolidierung**: Systematische Bereinigung von doppeltem Code, Entfernung veralteter Tabellenverwaltungs-Bereiche, Implementierung von `api-utils.ts` für wiederverwendbare HTTP-Helpers.

### Grafana Integration Optimierungen
- **Debug-Code Bereinigung**: Comprehensive debug-code cleanup across GrafanaDashboard.tsx, GrafanaLogic.tsx, and GrafanaReport.tsx (reduced LSP diagnostics from 12 to 3).
- **Dashboard-Typ-System Erweitert**: Implemented new dashboard type "report" separate from "auswertung" for typ=report URL parameter.
- **Enhanced Report Validation**: Extended hasValidReport function to properly handle empty report objects {} and prevent tab display.
- **Tab-Sichtbarkeits-Logik**: 
  - Dashboards tab only visible when typ=dashbord (not for other URL parameters)
  - GrafanaReport tab activated for typ=report
  - Modified tab visibility logic with proper dashboard type assignment and auto-navigation
- **URL-Parameter-Handling Erweitert**: Added typ=dashbord and typ=report with proper dashboard type assignment and automatic tab navigation.
- **Maps Navigation Integration**: /maps "Auswertung" buttons use typ=report&from=maps to navigate to GrafanaReport tab.
- **Cache-System Optimierung**: Separate cache keys for different dashboard types ("auswertung", "eigenes-board", "report").
- **BigInt JSON Serialization Fix**: Critical fix implemented for BigInt values in JSON serialization using proper conversion methods.
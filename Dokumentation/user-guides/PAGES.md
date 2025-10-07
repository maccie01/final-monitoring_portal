# Seiten-Dokumentation (Pages)

Diese Dokumentation beschreibt alle verfügbaren Seiten der Heizungsanlagen-Management-Anwendung.

## Routing-Struktur

Die Anwendung nutzt `wouter` für Client-Side-Routing mit rollenbasierten Zugriffskontrollen.

### Benutzer-Rollen

- **Nicht authentifiziert**: Zugriff auf Login-Seiten (`/login`, `/anmelden`, `/superadmin-login`)
- **Superadmin**: Vollzugriff auf alle Systemfunktionen
- **Authentifizierte Benutzer**: Profil-basierter Zugriff auf Dashboard und Module

## Hauptseiten (Authentifizierte Benutzer)

### 🏠 Dashboard
- **Route**: `/` (Startseite via LayoutStrawa), `/dashbord` (direkter Dashboard-Zugriff)
- **Komponente**: `Dashboard.tsx`
- **Beschreibung**: Hauptübersicht mit KPI-Dashboard, kritischen Systemen und System-Alarmen
- **Features**:
  - Echtzeit-KPI-Anzeige
  - Kritische Systeme Monitor
  - System-Alarme Übersicht
  - Schnellzugriff auf wichtige Funktionen

### 🔌 Netzwächter
- **Route**: `/network-monitor`
- **Komponente**: `NetworkMonitor.tsx`
- **Beschreibung**: Kritische Systemüberwachung und Alarm-Management
- **Features**:
  - Netzwächter-Konfiguration
  - Schwellenwert-Management
  - Alarm-Zuordnung
  - Echtzeit-Monitoring

### 📊 Effizienz-Analyse
- **Route**: `/efficiency`
- **Komponente**: `EfficiencyAnalysis.tsx`
- **Beschreibung**: Split-View Effizienz-Monitoring mit GEG 2024-Klassen
- **Features**:
  - 3 kategorisierte Objektlisten (Kritisch D-F, Warnungen C, Optimiert A-B)
  - Suchfunktion und Filter
  - Temperatur-Effizienz-Diagramme
  - Performance-optimiertes Laden

### 🏢 Objektverwaltung
- **Route**: `/objects`, `/objektverwaltung`
- **Komponente**: `ObjectManagement.tsx`
- **Beschreibung**: Umfassende Verwaltung von Objekten und Heizungsanlagen
- **Features**:
  - Portfolio-Objektliste mit Such- und Filterfunktionen
  - Objektdetails mit Tabs (Objektinfo, Konfiguration, Setup, Zuordnung)
  - Mandanten-Zuordnung (Verwalter, Handwerker, Betreuer, Besitzer)
  - Objekt-Gruppen-Management
  - Meter-Konfiguration
  - JSONB-Datenstrukturen für flexible Objektdaten
  - Rollenbasierte Berechtigungen

### 📈 Grafana Dashboards
- **Route**: `/grafana-dashboards`, `/grafana`, `/grafana-dashboard`
- **Komponente**: `GrafanaDashboard.tsx`
- **Beschreibung**: Eingebettete Grafana-Dashboards mit dynamischer Panel-Auswahl
- **Features**:
  - Iframe-Integration mit URL-Parameter-Steuerung
  - Objekt-spezifische Dashboard-Auswahl
  - Tab-Navigation zwischen verschiedenen Diagrammtypen
  - Zeitbereich-Steuerung
  - Netzwächter-spezifische Darstellungen

### ⚡ Energiedaten
- **Route**: `/energy-data`
- **Komponente**: `EnergyData.tsx`
- **Beschreibung**: Energiedaten-Management und -Analyse
- **Features**:
  - Energieverbrauch-Tracking
  - Datenimport/-export
  - Visualisierungen

### 👥 Benutzerverwaltung
- **Route**: `/users`
- **Komponente**: `UserManagement.tsx`
- **Beschreibung**: Verwaltung von Benutzern und Berechtigungen
- **Features**:
  - Benutzer-CRUD-Operationen
  - Rollenzuweisungen
  - User-Profile-Management

### ⚙️ Benutzereinstellungen
- **Route**: `/user-settings`
- **Komponente**: `UserSettings.tsx`
- **Beschreibung**: Persönliche Benutzereinstellungen
- **Features**:
  - Profil-Konfiguration
  - Sidebar-Einstellungen
  - Startseiten-Auswahl

### 🌡️ Temperatur-Analyse
- **Route**: `/temperature-analysis`, `/temperatur-analyse`
- **Komponente**: `TemperatureAnalysis.tsx`
- **Beschreibung**: Temperaturanalyse mit dynamischen Schwellenwerten
- **Features**:
  - Außentemperatur-Trends
  - Resolution-Buttons (täglich/wöchentlich/monatlich)
  - Dynamische Thresholding
  - 2023/365-Tage-Auswahl

### 📋 Logbook
- **Route**: `/logbook`
- **Komponente**: `Logbook.tsx`
- **Beschreibung**: System- und Aktivitätsprotokolle
- **Features**:
  - Aktivitäts-Tracking
  - System-Events
  - Änderungshistorie

## System-Administration

### 🔧 System-Setup
- **Route**: `/system-setup`
- **Komponente**: `SystemSettings.tsx`
- **Beschreibung**: System-Konfiguration und Einstellungen
- **Features**:
  - Datenbank-Konfiguration
  - Portal-DB-Setup
  - Konfigurations-Editor (Form/JSON)
  - Server-Restart-Funktionalität
  - System-Titel-Management
  - **Zugriff**: Alle Rollen (Admin, Superadmin)

### 🗄️ DB-Energie-Konfiguration
- **Route**: `/db-energy-config`
- **Komponente**: `DbEnergyDataConfig.tsx`
- **Beschreibung**: Datenbank-Konfiguration für Energiedaten
- **Features**:
  - Datenbankverbindungen verwalten
  - Datenquellen konfigurieren

## Entwickler-Tools

### 🧪 API-Tests
- **Route**: `/api-test`, `/api-tests`
- **Komponenten**: `ApiTest.tsx`, `ApiTests.tsx`
- **Beschreibung**: API-Testing-Tools für Entwicklung und Debugging
- **Features**:
  - Endpoint-Testing
  - API-Response-Validation
  - **Zugriff**: Admin und Superadmin

### ⚡ Performance-Tests
- **Route**: `/performance-test`
- **Komponente**: `PerformanceTest.tsx`
- **Beschreibung**: Performance-Benchmarking-Tools
- **Features**:
  - System-Performance-Messung
  - Latenz-Tests
  - **Zugriff**: Admin und Superadmin

## Authentifizierung

### 🔐 Login
- **Route**: `/login`, `/anmelden`
- **Komponente**: `Login.tsx`, `LoginStrawa.tsx`
- **Beschreibung**: Standard-Benutzeranmeldung
- **Features**:
  - Session-basierte Authentifizierung
  - PostgreSQL Session-Storage
  - Rollenbasierte Weiterleitung

### 👑 Superadmin Login
- **Route**: `/superadmin-login`
- **Komponente**: `SuperadminLogin.tsx`
- **Beschreibung**: System-Administrator-Anmeldung
- **Features**:
  - Setup-Datei oder ENV-Variable Authentifizierung
  - Systemweite Admin-Berechtigung

### 🗺️ Karten-Übersicht
- **Route**: `/maps`
- **Komponente**: `Maps.tsx`
- **Beschreibung**: Geografische Objektübersicht
- **Features**:
  - Interaktive Karten-Darstellung
  - Objekt-Standort-Visualisierung
  - Filter- und Suchfunktionen

### 🌡️ Temperatur-Analyse
- **Route**: `/temperature-analysis`, `/temperatur-analyse`
- **Komponente**: `TemperatureAnalysis.tsx`
- **Beschreibung**: Temperatur-Monitoring und -Analyse
- **Features**:
  - Temperaturverlauf-Diagramme
  - Schwellenwert-Überwachung
  - Alarm-Management

### ⚙️ System-Einstellungen
- **Route**: `/system-setup`, `/setup`
- **Komponente**: `SystemSettings.tsx`
- **Beschreibung**: Systemkonfiguration und -einstellungen
- **Features**:
  - Portal-Konfiguration
  - Datenbank-Einstellungen
  - Systemparameter-Verwaltung
  - **Zugriff**: Superadmin only

### 📋 Logbuch
- **Route**: `/logbook`
- **Komponente**: `Logbook.tsx`
- **Beschreibung**: Wartungs- und Ereignisprotokoll
- **Features**:
  - Wartungseinträge
  - Systemereignisse
  - Historische Aufzeichnungen

### 👤 Benutzerprofil
- **Route**: `/user`
- **Komponente**: `User.tsx`
- **Beschreibung**: Persönliches Benutzerprofil
- **Features**:
  - Profilinformationen
  - Einstellungen
  - Account-Management

### 🔧 Benutzer-Einstellungen
- **Route**: `/user-settings`
- **Komponente**: `UserSettings.tsx`
- **Beschreibung**: Benutzerspezifische Einstellungen
- **Features**:
  - UI-Präferenzen
  - Benachrichtigungseinstellungen
  - Profilkonfiguration

### 🔧 Modbus-Konfiguration
- **Route**: `/modbusConfig`
- **Komponente**: `ModbusConfig.tsx`
- **Beschreibung**: Modbus-Geräte-Konfiguration
- **Features**:
  - Modbus-Parameter-Einstellungen
  - Geräte-Kommunikation
  - **Zugriff**: Admin only

### 📱 Geräteverwaltung
- **Route**: `/devices`, `/geraeteverwaltung`
- **Komponente**: `Devices.tsx`, `Geraeteverwaltung.tsx`
- **Beschreibung**: Netzwächter-Geräte-Management
- **Features**:
  - Geräte-Registrierung
  - Konfigurationsmanagement
  - Statusüberwachung

### 🗂️ DB-Energy-Konfiguration
- **Route**: `/db-energy-config`
- **Komponente**: `DbEnergyDataConfig.tsx`
- **Beschreibung**: Energiedaten-Konfiguration
- **Features**:
  - Datenbank-Energy-Settings
  - Konfigurationsmanagement
  - **Zugriff**: Admin only

## Sicherheit & Berechtigungen

### Rollenbasierte Navigation
- **UserProfileRedirect**: Automatische Weiterleitung basierend auf User-Profile
- **Sidebar-Steuerung**: Sichtbarkeit von Menüpunkten basierend auf Benutzerrechten
- **Route Guards**: Schutz sensibler Bereiche

### Authentifizierung-Flow
1. **Nicht authentifiziert** → Landing Page
2. **Standard-Login** → Dashboard (mit User-Profile-Redirect)
3. **Superadmin** → Beschränkter Zugriff nur auf System-Setup

## Technische Details

### Framework & Libraries
- **Routing**: `wouter` für Client-Side-Routing
- **State Management**: `@tanstack/react-query` für Server-State
- **UI Framework**: React mit TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Forms**: React Hook Form mit Zod-Validation

### Code-Konventionen
- Alle Seiten als funktionale React-Komponenten
- TypeScript für vollständige Type-Safety
- Einheitliche Error-Handling-Patterns
- Responsive Design für alle Bildschirmgrößen

### Performance-Optimierungen
- React Query für intelligentes Caching
- Parallel Loading für unabhängige Daten
- Optimierte Grafana-iframe-Integration
- Lazy Loading für große Datensätze
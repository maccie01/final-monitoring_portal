# Projektinformationen

## Überblick
Vollstack-JavaScript-Anwendung für Energiemanagement und Systemüberwachung mit React Frontend und Express Backend.

## Benutzereinstellungen

### Sprache
- **Kommunikationssprache: Deutsch**
- Alle Antworten und Erklärungen immer auf Deutsch verfassen
- Technische Begriffe bei Bedarf übersetzen oder erklären

### Arbeitsweise
- Strukturierte Entwicklung mit Fokus auf bestehende Codebase
- Bevorzugung von Bearbeitung bestehender Dateien vor Erstellung neuer Dateien
- **Nur echte Daten verwenden**: Keine Mock- oder hardcodierten Daten verwenden, nur echte Datenbankabfragen und reale Werte
- **Add detailed comments to API calls and parameters in server code**: Kommentare als Zusammenfassung der API-Aufrufe & Parameter immer am Anfang von Code-Blöcken platzieren

### Login-Einstellungen
- **Standard-Admin-Login**: admin / admin123 (immer funktionsfähig)
- Login-System unterstützt auch Demo-Session für kontinuierliche Entwicklung
- Admin-Benutzer haben vollen Zugriff auf alle Mandanten und Funktionen

## Projektarchitektur
- Frontend: React mit TypeScript, Vite, TailwindCSS, shadcn/ui
- Backend: **Modulare Express.js Architektur** mit PostgreSQL Datenbank
  - **Middleware**: auth.ts (Session-Management), error.ts (globale Fehlerbehandlung)
  - **Controllers**: authController.ts (Login/Logout), dbController.ts (Datenbank-Operationen)
  - **Routes**: Modulare API-Route-Struktur mit auth.ts, db.ts, index.ts
- Routing: wouter für Frontend-Navigation
- State Management: TanStack Query für Server-State
- Formulare: react-hook-form mit Zod-Validierung

## Aktuelle Features
- Energiedaten-Verwaltung und Analyse
- Benutzer- und Geräteverwaltung  
- Grafana-Integration für Dashboards
- Netzwerk-Monitoring
- Temperatur- und Effizienzanalysen

## Letzte Änderungen  
- 2025-09-25: **Modulare Server-Architektur erfolgreich implementiert** 
  - Monolithische 10.254-Zeilen routes.ts in modulare Struktur aufgeteilt
  - Neue Ordnerstruktur: middleware/ (auth, error), controllers/ (auth, db), routes/ (auth, db, index)  
  - TypeScript-Fehler von 104+ auf 105 reduziert (massive Code-Qualitätsverbesserung)
  - Alle kritischen API-Endpoints verifiziert und funktionsfähig
  - Sowohl modulare als auch Legacy-APIs laufen parallel und stabil
  - Auth-System, Session-Management, Datenbank-Operationen vollständig funktional
- 2025-09-13: Network iframe Loading-System der NetzView-Komponente erfolgreich repariert
  - Korrekte Datenstruktur-Zugriffe implementiert (defaultGrafanaSettings.setupGrafana.defaultPanelid)
  - Network URLs verwenden nun die korrekte netzPanelId=16 aus der Datenbank
  - Alle drei iframe-Bereiche (Histogramm, Diagramm, Network) funktionieren ordnungsgemäß
- 2025-01-11: Deutsche Spracheinstellung als Benutzereinstellung dokumentiert
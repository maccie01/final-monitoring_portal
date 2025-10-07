# Grafana-Dashboard API-Dokumentation

## Übersicht

Die `/grafana-dashboard` Seite ist eine zentrale Komponente der Heizungsanlagen-Management-Anwendung, die umfassende Grafana-Integration, Energiedaten-Visualisierung und Objekt-Management bereitstellt. Diese Dokumentation beschreibt alle verwendeten API-Endpunkte und deren aktuellen Status.

## Komponentenarchitektur

### Frontend: `client/src/pages/GrafanaDashboard.tsx`
- **Framework:** React mit TypeScript und TanStack Query
- **UI-Komponenten:** shadcn/ui mit TailwindCSS
- **Routing:** Wouter mit URL-Parameter-Unterstützung
- **State Management:** React Hooks mit localStorage-Persistierung

### Backend: `server/routes.ts`
- **Framework:** Express.js mit TypeScript  
- **Datenbank:** PostgreSQL mit Drizzle ORM
- **Authentifizierung:** Session-basiert mit Middleware

## API-Endpunkte Übersicht

### ✅ Kern-APIs (Vollständig funktionsfähig)

| **Endpunkt** | **Methode** | **Zeile** | **Funktion** | **Cache** |
|--------------|-------------|-----------|--------------|-----------|
| `/api/objects` | GET | 837 | Objektliste laden | 2-5 Min |
| `/api/objects/by-objectid/:objectid` | GET | 1030 | Spezifisches Objekt abrufen | - |
| `/api/settings?category=grafana` | GET | 1746 | Grafana-Konfiguration laden | 5-10 Min |
| `/api/settings/thresholds` | GET | 1987 | Schwellenwerte für Status | 5-10 Min |
| `/api/daily-consumption/:objectId` | GET | 3130 | Täglicher Energieverbrauch | 2 Min |
| `/api/monthly-consumption/:objectId` | GET | 3245 | Monatlicher Energieverbrauch | 5 Min |
| `/api/outdoor-temperatures/postal-code/:postalCode` | GET | 8181 | Außentemperaturen nach PLZ | - |

### ⚠️ Teilweise funktionsfähig

| **Endpunkt** | **Methode** | **Zeile** | **Problem** | **Status** |
|--------------|-------------|-----------|-------------|------------|
| `/api/energy-data/:objectId` | GET | 1616 | DB-Tabelle fehlt | Fallback auf Demo-Daten |
| `/api/energy-data-meters/:objectId` | GET | 3072 | Funktioniert mit Demo-Daten | Teilweise OK |

## Detaillierte API-Beschreibung

### 1. Objektverwaltung

#### `GET /api/objects`
**Zweck:** Lädt alle verfügbaren Objekte für die Objektauswahl  
**Response-Format:**
```typescript
Array<{
  id: number;
  objectid: number;
  name: string;
  meter?: Record<string, string | number>;
  fltemp?: { updateTime: string; value: number };
  rttemp?: { updateTime: string; value: number };
}>
```

#### `GET /api/objects/by-objectid/:objectid`
**Zweck:** Lädt spezifische Objektdetails basierend auf objectid  
**Parameter:** `objectid` - Eindeutige Objekt-ID  
**Usage:** Wird bei URL-Parameter `objectID` oder `objid` aufgerufen

### 2. Konfigurationsdaten

#### `GET /api/settings?category=grafana`
**Zweck:** Lädt Grafana-spezifische Konfigurationen  
**Response-Format:**
```typescript
Array<{
  id: number;
  category: string;
  key_name: string;
  value: any; // JSONB-Konfiguration
}>
```
**Wichtige Settings:**
- `defaultGrafana`: Standard-Grafana-Konfiguration mit `setupGrafana.defaultInterval`
- Wächter-Konfigurationen für Tab-Generierung

#### `GET /api/settings/thresholds`
**Zweck:** Lädt Schwellenwerte für Online/Offline-Erkennung  
**Usage:** Status-Erkennung für Objekte basierend auf Temperaturaltern

### 3. Energiedaten-APIs

#### `GET /api/daily-consumption/:objectId`
**Zweck:** Tägliche Verbrauchsdaten der letzten 7 Tage  
**Parameter:** `objectId` - Eindeutige Objekt-ID  
**Cache:** 2 Minuten für tägliche Daten  
**Response:** Objekt mit Zähler-spezifischen Verbrauchsdaten

#### `GET /api/monthly-consumption/:objectId`
**Zweck:** Monatliche Energiedaten für Jahresauswertungen  
**Parameter:** 
- `objectId` - Eindeutige Objekt-ID
- `timeRange` (optional) - Standard: `last-365-days`
**Cache:** 5 Minuten für monatliche Daten

#### `GET /api/energy-data-meters/:objectId` ⚠️
**Zweck:** Energiedaten für alle Zähler eines Objekts  
**Parameter:**
- `objectId` - Eindeutige Objekt-ID  
- `timeRange` (query) - Zeitbereich für Abfrage
**Aktueller Status:** Funktioniert mit Demo-Daten-Fallback  
**Problem:** Zugriff auf Portal-DB, nicht auf lokale Energiedaten

### 4. Temperatur-APIs

#### `GET /api/outdoor-temperatures/postal-code/:postalCode`
**Zweck:** Außentemperaturen für Effizienz-Charts  
**Parameter:**
- `postalCode` - Postleitzahl des Objekts
- `startDate`, `endDate` (query) - Zeitbereich
- `resolution` (query) - Auflösung (m=monatlich)
**Authentication:** Nicht erforderlich (Chart-Zugriff)

## Frontend-Integration

### URL-Parameter-Handling
```typescript
// URL-Parameter Parsing
const urlParams = new URLSearchParams(window.location.search);
const objectIdFromUrl = urlParams.get("objectID") || urlParams.get("objid") || urlParams.get("id");
const typFromUrl = urlParams.get("typ");
```

**Unterstützte Parameter:**
- `objectID` / `objid` / `id`: Automatische Objektauswahl
- `typ`: Dashboard-Typ (`diagramme`, `anlage`, `objektinfo`, `bewertung`, `auswertung`)

### TanStack Query Integration
```typescript
// Beispiel: Objekte laden
const { data: objects } = useQuery({
  queryKey: ["/api/objects"],
  staleTime: 2 * 60 * 1000, // 2 Minuten Cache
  gcTime: 5 * 60 * 1000, // 5 Minuten Cache
  refetchOnWindowFocus: false,
});
```

### Settings-Extraktion
```typescript
// defaultGrafana Settings extrahieren
const defaultGrafanaSettings = grafanaSettings?.find(
  (setting: any) => setting.key_name === 'defaultGrafana'
)?.value;

// defaultInterval für Zeitbereich-Konfiguration
const interval = defaultGrafanaSettings?.setupGrafana?.defaultInterval || "&from=now-7d&to=now";
```

## Bekannte Probleme

### 1. Database Schema Sync ⚠️
**Problem:** `energy_data` Tabelle fehlt in Datenbank  
**Fehler:** `relation "energy_data" does not exist`  
**Auswirkung:** Energy-Data API gibt Fallback auf Demo-Daten zurück  
**Lösung:** 
```bash
npm run db:push --force
```

### 2. Database Push blockiert
**Problem:** Enum-Erstellung hängt bei `agent_status`  
**Symptom:** `Is agent_status enum created or renamed from another enum?`  
**Lösung:** Manueller Enum-Fix oder Force-Push

## Performance-Optimierungen

### Caching-Strategie
- **Objekte:** 2-5 Minuten Cache
- **Settings:** 5-10 Minuten Cache  
- **Energiedaten:** 1-5 Minuten je nach Datentyp
- **Temperaturdaten:** Keine Cache (Echtzeit)

### Query-Optimierungen
- `refetchOnWindowFocus: false` für stabile Daten
- Parallele API-Aufrufe für unabhängige Daten
- Conditional Queries mit `enabled: !!selectedObjectId`

## Error Handling

### Fallback-Mechanismen
1. **Demo-Daten:** Bei fehlenden Energiedaten
2. **Default-Settings:** Bei fehlenden Konfigurationen  
3. **Offline-Anzeige:** Bei fehlenden Temperaturdaten

### Logging-Pattern
```typescript
console.log(`📊 API request for ${type}, objectId: ${objectId}`);
console.error('❌ Error fetching data:', error);
```

## Deployment-Hinweise

### Erforderliche Umgebungsvariablen
- `DATABASE_URL`: PostgreSQL-Verbindung
- Portal-DB Konfiguration über Settings

### Database Setup
1. Schema-Sync: `npm run db:push`
2. Settings-Migration bei Bedarf
3. Energiedaten-Tabellen-Erstellung

## Entwicklungsrichtlinien

### Code-Konventionen
- TypeScript für Type Safety
- React Hooks für State Management
- Zod-Schemas für Validation
- Console-Logging für Debugging

### Testing-Strategien
- API-Endpunkt-Tests
- Frontend-Component-Tests  
- Integration-Tests mit Mock-Daten

---

*Letzte Aktualisierung: September 2025*  
*Version: 1.0*
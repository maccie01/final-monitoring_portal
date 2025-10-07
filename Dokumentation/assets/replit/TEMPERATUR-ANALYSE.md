# Temperatur-Analyse Implementation Guide

## Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Architektur](#architektur)
   - [Datenmodell](#datenmodell)
   - [Datenbank-Integration](#datenbank-integration)
3. [Threshold-Konfiguration](#threshold-konfiguration)
   - [Datenstruktur](#datenstruktur)
   - [API Endpoints](#api-endpoints)
4. [Frontend-Komponenten](#frontend-komponenten)
   - [NetworkMonitor Split-View](#networkmonitor-split-view)
   - [TemperatureSettings](#temperaturesettings)
5. [Algorithmus-Implementierung](#algorithmus-implementierung)
   - [Temperatur-Status-Bestimmung](#temperatur-status-bestimmung)
   - [Kategorisierung](#kategorisierung)
6. [Update-Zeit und Offline-Status](#update-zeit-und-offline-status)
   - [Update-Zeit Bestimmung](#update-zeit-bestimmung)
   - [Offline-Kriterien (24h Regel)](#offline-kriterien-24h-regel)
7. [UI Spezifikation](#ui-spezifikation)
   - [Split-View Layout](#split-view-layout)
   - [Kritische Systeme Tabelle](#kritische-systeme-tabelle)
8. [Testing und Debugging](#testing-und-debugging)
9. [Roadmap](#roadmap)

## Übersicht

Die Temperaturanalyse ist ein zentraler Bestandteil des Heizungsmanagement-Systems, der es ermöglicht, Vorlauf- und Rücklauftemperaturen von Heizungsanlagen in Echtzeit zu überwachen und zu analysieren. Das System nutzt JSONB-Datenstrukturen für flexible Temperatur-Datenspeicherung und bietet umfassende Monitoring-Funktionen.

## Architektur

### Datenmodell

#### JSONB Felder in der `objects` Tabelle:
```sql
-- Vorlauftemperatur-Daten (Flow Temperature)
fltemp JSONB DEFAULT '{}'::jsonb

-- Rücklauftemperatur-Daten (Return Temperature) 
rttemp JSONB DEFAULT '{}'::jsonb
```

#### Beispiel Datenstruktur:
```json
{
  "fltemp": {
    "20541": 58.5,
    "20542": 61.2,
    "updateTime": "2025-01-26T04:30:00Z"
  },
  "rttemp": {
    "20541": 48.3,
    "20542": 51.7,
    "updateTime": "2025-01-26T04:30:00Z"
  }
}
```

### Datenbank-Integration

#### GIN Indizes für Performance:
```sql
CREATE INDEX CONCURRENTLY idx_objects_fltemp_gin ON objects USING gin (fltemp);
CREATE INDEX CONCURRENTLY idx_objects_rttemp_gin ON objects USING gin (rttemp);
```

#### Abfrage-Beispiele:
```sql
-- Objekte mit Temperatur-Sensoren finden
SELECT objectid, name, 
       jsonb_object_keys(fltemp) as flow_sensors,
       jsonb_object_keys(rttemp) as return_sensors
FROM objects 
WHERE fltemp IS NOT NULL 
  AND fltemp != '{}'::jsonb;

-- Temperatur-Schwellwerte prüfen
SELECT objectid, name,
       (fltemp->>'20541')::numeric as flow_temp,
       (rttemp->>'20541')::numeric as return_temp
FROM objects
WHERE (fltemp->>'20541')::numeric > 60  -- Kritische Vorlauftemperatur
   OR (rttemp->>'20541')::numeric < 40; -- Kritische Rücklauftemperatur
```

## API-Endpunkte

### Temperatur-Schwellwerte

#### GET `/api/settings/thresholds`
```typescript
interface ThresholdSettings {
  id: number;
  category: 'thresholds';
  key_name: string;
  value: {
    flow_critical: number;    // Kritische Vorlauftemperatur
    flow_warning: number;     // Warnung Vorlauftemperatur
    return_critical: number;  // Kritische Rücklauftemperatur
    return_warning: number;   // Warnung Rücklauftemperatur
  };
}
```

#### POST `/api/settings/thresholds`
```typescript
// Beispiel Request Body
{
  "category": "thresholds",
  "key_name": "temperature_limits",
  "value": {
    "flow_critical": 65,
    "flow_warning": 60,
    "return_critical": 35,
    "return_warning": 40
  }
}
```

### Temperatur-Daten Abruf

#### GET `/api/objects/temperature-analysis`
```typescript
interface TemperatureAnalysis {
  objectId: number;
  name: string;
  city: string;
  sensors: {
    sensorId: string;
    flowTemp: number | null;
    returnTemp: number | null;
    status: 'critical' | 'warning' | 'normal' | 'offline';
    lastUpdate: string;
  }[];
  systemType: string;
  overallStatus: 'critical' | 'warning' | 'normal' | 'offline';
}
```

## Frontend-Komponenten

### NetworkMonitor Splitview-Layout

#### Linkes Panel - Kategorisierte Systeme:
```typescript
interface SystemCategory {
  critical: TemperatureAnalysis[];    // Kritische Systeme
  warning: TemperatureAnalysis[];     // Warnung-Systeme  
  offline: TemperatureAnalysis[];     // Offline-Systeme
  energy: TemperatureAnalysis[];      // Energie-optimiert
  optimized: TemperatureAnalysis[];   // Optimiert laufend
}
```

#### Tabellendarstellung Kritische Anlagen:
Die kritischen Anlagen werden in einer erweiterbaren Tabelle mit folgender Struktur dargestellt:

```
┌─ ▼ 🔴 Kritische Anlagen    [6]     Nur Critical-Objekte mit heutigem Update-Datum ─┐
├─────────────────────────────────────────────────────────────────────────────────────┤
│ OBJEKT                  │ TEMPERATUR-KI-ANALYSE              │ UPDATE-ZEIT        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Ahornstraße 10         │ Netz1 VL: CRITICAL (46°C > 49°C)   │ 25.7.2025         │
│ 207315038              │ Netz1 RL: NORMAL (41°C > 39°C)     │ 13:34:01          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Ahornstraße 18         │ Netz1 VL: CRITICAL (46°C > 49°C)   │ 25.7.2025         │
│ 207315076              │ Netz1 RL: NORMAL (37°C > 39°C)     │ 13:34:01          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Heinrich-Heine-Str. 22 │ Netz1 VL: NORMAL (61°C > 55°C)     │ 25.7.2025         │
│ 296748003              │ Netz1 RL: CRITICAL (51°C > 44°C)   │ 13:34:01          │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**UI-Features:**
- Expand/Collapse-Funktionalität für jede Kategorie
- Rote Badge mit Anzahl kritischer Systeme
- Dreispaltige Tabelle: OBJEKT | TEMPERATUR-KI-ANALYSE | UPDATE-ZEIT
- Farbkodierung: CRITICAL (rot), WARNING (orange), NORMAL (grün)
- Temperaturwerte mit Schwellwert-Vergleich (aktuell > Grenzwert)
- Zeitstempel für letzte Datenaktualisierung

#### Rechtes Panel - Detaillierte Temperaturanalyse:
- Vorlauf-/Rücklauftemperatur-Diagramme
- Echtzeit-Temperaturwerte
- Historische Trends
- Alarm-Status und Schwellwerte

### Komponenten-Struktur:
```
client/src/pages/NetworkMonitor.tsx
├── SystemCategoryPanel (Links)
│   ├── CategoryFilter
│   ├── ExpandableCriticalTable
│   │   ├── TableHeader (Kritische Anlagen Badge + Count)
│   │   ├── ObjectColumn (Name + ObjectID)
│   │   ├── TemperatureAnalysisColumn (VL/RL Status + Values)
│   │   └── UpdateTimeColumn (Timestamp)
│   ├── SystemList
│   └── StatusBadges
└── TemperatureAnalysisPanel (Rechts)
    ├── TemperatureChart
    ├── RealTimeValues
    ├── ThresholdIndicators
    └── AlarmStatus
```

### Tabellenkomponente Implementation:
```typescript
interface CriticalSystemsTableProps {
  systems: TemperatureAnalysis[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const CriticalSystemsTable: React.FC<CriticalSystemsTableProps> = ({
  systems,
  isExpanded,
  onToggleExpand
}) => {
  return (
    <div className="border rounded-lg bg-red-50 border-red-200">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer bg-red-100"
        onClick={onToggleExpand}
      >
        <div className="flex items-center space-x-2">
          <ChevronDownIcon className={`h-4 w-4 transition-transform ${!isExpanded && '-rotate-90'}`} />
          <AlertTriangleIcon className="h-4 w-4 text-red-600" />
          <span className="font-medium text-red-800">Kritische Anlagen</span>
          <Badge variant="destructive" className="ml-2">{systems.length}</Badge>
        </div>
        <span className="text-sm text-red-600 italic">
          Nur Critical-Objekte mit heutigem Update-Datum
        </span>
      </div>
      
      {/* Table */}
      {isExpanded && (
        <Table>
          <TableHeader>
            <TableRow className="bg-red-50">
              <TableHead className="text-red-800 font-semibold">OBJEKT</TableHead>
              <TableHead className="text-red-800 font-semibold">TEMPERATUR-KI-ANALYSE</TableHead>
              <TableHead className="text-red-800 font-semibold">UPDATE-ZEIT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {systems.map((system) => (
              <TableRow key={system.objectId} className="border-red-100">
                <TableCell>
                  <div>
                    <span className="text-blue-600 font-medium">{system.name}</span>
                    <br />
                    <span className="text-gray-600 text-sm">{system.objectId}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {system.sensors.map((sensor) => (
                    <div key={sensor.sensorId} className="mb-1">
                      <span className="text-sm">
                        Netz1 VL: 
                        <Badge 
                          variant={sensor.flowTemp && sensor.flowTemp > 49 ? "destructive" : "secondary"}
                          className="ml-1"
                        >
                          {sensor.flowTemp && sensor.flowTemp > 49 ? "CRITICAL" : "NORMAL"}
                        </Badge>
                        <span className="ml-1">({sensor.flowTemp}°C &gt; 49°C)</span>
                      </span>
                      <br />
                      <span className="text-sm">
                        Netz1 RL: 
                        <Badge 
                          variant={sensor.returnTemp && sensor.returnTemp > 44 ? "destructive" : "secondary"}
                          className="ml-1"
                        >
                          {sensor.returnTemp && sensor.returnTemp > 44 ? "CRITICAL" : "NORMAL"}
                        </Badge>
                        <span className="ml-1">({sensor.returnTemp}°C &gt; 44°C)</span>
                      </span>
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>25.7.2025</div>
                    <div className="text-gray-600">13:34:01</div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
```

## Temperatur-Analyse Algorithmus

### Status-Kategorisierung:
```typescript
function categorizeSystemStatus(
  flowTemp: number, 
  returnTemp: number, 
  thresholds: ThresholdSettings
): SystemStatus {
  
  // Kritisch: Überschreitung kritischer Schwellwerte
  if (flowTemp > thresholds.flow_critical || 
      returnTemp < thresholds.return_critical) {
    return 'critical';
  }
  
  // Warnung: Überschreitung Warn-Schwellwerte
  if (flowTemp > thresholds.flow_warning || 
      returnTemp < thresholds.return_warning) {
    return 'warning';
  }
  
  // Offline: Keine aktuellen Daten
  if (!flowTemp || !returnTemp || isDataStale(lastUpdate)) {
    return 'offline';
  }
  
  // Optimiert: Ideale Temperaturdifferenz
  const tempDiff = flowTemp - returnTemp;
  if (tempDiff >= 15 && tempDiff <= 25) {
    return 'optimized';
  }
  
  return 'normal';
}
```

### Effizienz-Berechnung:
```typescript
function calculateEfficiency(flowTemp: number, returnTemp: number): number {
  const tempDiff = flowTemp - returnTemp;
  const idealDiff = 20; // Ideal: 20K Temperaturdifferenz
  
  // Effizienz basierend auf Temperaturdifferenz
  const efficiency = Math.max(0, Math.min(100, 
    100 - Math.abs(tempDiff - idealDiff) * 2
  ));
  
  return efficiency;
}
```

## Daten-Import und Management

### JSON-Import aus objects.json:
```javascript
// Import-Script Beispiel
const objects = JSON.parse(fs.readFileSync('objects.json'));

for (const obj of objects) {
  await pool.query(`
    INSERT INTO objects (objectid, name, fltemp, rttemp, ...)
    VALUES ($1, $2, $3, $4, ...)
  `, [
    obj.objectid,
    obj.title,
    JSON.stringify(obj.fltemp || {}),
    JSON.stringify(obj.rttemp || {}),
    // ... weitere Felder
  ]);
}
```

### Datenvalidierung:
```typescript
const temperatureSchema = z.object({
  fltemp: z.record(z.string(), z.number()).optional(),
  rttemp: z.record(z.string(), z.number()).optional(),
  updateTime: z.string().datetime().optional()
});
```

## Echtzeit-Updates

### WebSocket-Integration (geplant):
```typescript
// WebSocket für Live-Temperatur-Updates
interface TemperatureUpdate {
  objectId: number;
  sensorId: string;
  flowTemp: number;
  returnTemp: number;
  timestamp: string;
}

// Client-seitige Subscription
useEffect(() => {
  const ws = new WebSocket('/api/ws/temperature');
  
  ws.onmessage = (event) => {
    const update: TemperatureUpdate = JSON.parse(event.data);
    updateTemperatureData(update);
  };
}, []);
```

## Testing und Debugging

### Temperatur-Daten Simulation:
```sql
-- Test-Daten für Entwicklung
UPDATE objects 
SET fltemp = jsonb_build_object(
  '20541', 62.5,
  '20542', 58.3,
  'updateTime', NOW()::text
),
rttemp = jsonb_build_object(
  '20541', 45.2,
  '20542', 48.7,
  'updateTime', NOW()::text
)
WHERE objectid = 272605182;
```

### Debug-Queries:
```sql
-- Temperatur-Status Übersicht
SELECT 
  o.objectid,
  o.name,
  jsonb_object_keys(o.fltemp) as sensors,
  (o.fltemp->>'updateTime') as last_update,
  CASE 
    WHEN (o.fltemp->>'20541')::numeric > 60 THEN 'CRITICAL'
    WHEN (o.fltemp->>'20541')::numeric > 55 THEN 'WARNING'  
    ELSE 'NORMAL'
  END as status
FROM objects o
WHERE o.fltemp IS NOT NULL 
  AND o.fltemp != '{}'::jsonb
ORDER BY (o.fltemp->>'20541')::numeric DESC;
```

## Performance-Optimierung

### Indizierung-Strategie:
```sql
-- Composite Index für häufige Abfragen
CREATE INDEX idx_objects_temp_status ON objects 
USING btree (mandate_id, object_type) 
WHERE fltemp IS NOT NULL;

-- Partial Index für aktive Temperatur-Sensoren
CREATE INDEX idx_objects_active_sensors ON objects 
USING gin (fltemp)
WHERE fltemp != '{}'::jsonb;
```

### Caching-Strategien:
- React Query für Frontend-Caching (5 Minuten TTL)
- Server-seitiges Caching für Schwellwert-Konfigurationen
- Debounced Updates für Live-Temperatur-Anzeige

## Deployment und Monitoring

### Produktions-Konfiguration:
```env
# Temperatur-Analyse Settings
TEMP_UPDATE_INTERVAL=30000  # 30 Sekunden
TEMP_CACHE_TTL=300000      # 5 Minuten
TEMP_ALERT_THRESHOLD=65    # Kritische Temperatur
```

### Monitoring-Metriken:
- Anzahl aktiver Temperatur-Sensoren
- Kritische Temperatur-Ereignisse pro Stunde
- System-Response-Time für Temperatur-Abfragen
- Datenqualität (fehlende/veraltete Messwerte)

## Zukünftige Erweiterungen

### Geplante Features:
1. **Predictive Analytics**: Machine Learning für Temperatur-Vorhersagen
2. **Mobile Alerts**: Push-Benachrichtigungen bei kritischen Temperaturen
3. **Grafana Integration**: Erweiterte Dashboard-Visualisierungen
4. **Historical Analytics**: Langzeit-Temperatur-Trends und Berichte
5. **Auto-Adjustments**: Automatische Heizungsregelung basierend auf Temperaturdaten

### API-Erweiterungen:
```typescript
// Geplante Endpunkte
GET /api/temperature/predictions/{objectId}
POST /api/temperature/alerts/subscribe
GET /api/temperature/history/{objectId}?days=30
PUT /api/temperature/auto-adjust/{objectId}
```

## Dokumentation Updates

### Letzte Änderungen:
- **26.07.2025**: Vollständige Temperatur-Analyse Implementation
- **26.07.2025**: JSONB-basierte Temperatur-Datenspeicherung
- **26.07.2025**: Netzwächter Splitview-Layout mit Temperatur-Kategorisierung
- **26.07.2025**: Import von 25 Objekten mit Temperatur-Monitoring-Daten

### Weitere Dokumentation:
- `DATABASE_OVERVIEW.md` - Vollständige Datenbankstruktur
- `GRAFANA_INTEGRATION.md` - Dashboard-Integration Details  
- `replit.md` - Projekt-Architektur und aktuelle Entwicklungen

---

## Threshold-Zuordnung für Objekte

### Übersicht Threshold-Zuordnung

Die Zuordnung von Temperatur-Threshold-Konfigurationen zu Objekten erfolgt über das `objanlage.thresholds` JSONB-Feld basierend auf dem Heizungsanlagentyp, mit automatischem Fallback zu `netzwaechter_0`.

## Prioritäts-Reihenfolge

### 1. objanlage.thresholds (Höchste Priorität)
```json
{
  "objanlage": {
    "Typ": "WP+Kessel",
    "thresholds": "netzwaechter_2"
  }
}
```
- Anlagentyp-basierte Konfiguration
- Logische Zuordnung nach Heizungstyp
- **Empfohlener Ansatz für Standard-Zuordnungen**

### 2. netzwaechter_0 (Fallback)
- Automatischer Fallback wenn keine spezifische Konfiguration gefunden wird
- Globale Standard-Konfiguration
- Immer verfügbar

## Implementierung

### Datenbank-Struktur
```sql
-- Objekte mit objanlage JSONB-Feld
UPDATE objects SET objanlage = '{"Typ":"WP+Kessel","thresholds":"netzwaechter_1"}' WHERE objectid = 269517140;
UPDATE objects SET objanlage = '{"Typ":"Niedertemperatur","thresholds":"netzwaechter_2"}' WHERE name LIKE '%Niedertemperatur%';
```

### Code-Logik (NetworkMonitor.tsx)
```typescript
// Anlagentyp-basierte Threshold-Zuordnung
let configSource = 'netzwaechter_0'; // Default fallback

if (obj.objanlage?.thresholds) {
  // Anlagentyp-basierte Konfiguration
  configSource = obj.objanlage.thresholds;
}
```

## Anlagentyp-Zuordnungen

| Anlagentyp | Threshold-Config | Beschreibung |
|------------|------------------|--------------|
| Standard | netzwaechter_0 | Globale Standard-Konfiguration (Fallback) | 
| WP+Kessel | netzwaechter_1 | Wärmepumpe + Kessel-Kombinationen |
| Niedertemperatur | netzwaechter_2 | Niedertemperatur-Heizsysteme |

### Heizungsanlagentypen nach objanlage.Typ

Die Zuordnung erfolgt über das `Typ`-Feld im `objanlage` JSONB:

```json
// Wärmepumpe + Kessel → netzwaechter_1 
{"Typ": "WP+Kessel", "thresholds": "netzwaechter_1"}

// Niedertemperatur-System → netzwaechter_2
{"Typ": "Niedertemperatur", "thresholds": "netzwaechter_2"}

// Standard/Andere → netzwaechter_0 (automatisch)
{"Typ": "Standard", "thresholds": "netzwaechter_0"}
```

## Threshold-Konfigurationen

### netzwaechter_0 (Global)
- VL Normal: 55°C, Warning: 53°C, Critical: 49°C
- RL Normal: 39°C, Warning: 43°C, Critical: 44°C

### netzwaechter_1 (Niedertemperatur 1)
- VL Normal: 60°C, Warning: 52°C, Critical: 49°C  
- RL Normal: 35°C, Warning: 42°C, Critical: 44°C

### netzwaechter_2 (Niedertemperatur 2)
- VL Normal: 45°C, Warning: 42°C, Critical: 39°C
- RL Normal: 28°C, Warning: 32°C, Critical: 34°C

## Vorteile des JSONB-Ansatzes

### ✅ Vorteile
1. **Flexibilität**: Keine feste Tabellenstruktur erforderlich
2. **Erweiterbarkeit**: Einfache Hinzufügung neuer Felder
3. **Performance**: GIN-Indizes für schnelle JSONB-Abfragen
4. **Einfachheit**: Keine zusätzlichen Tabellen oder Joins

### ❌ Nachteile einer separaten Tabelle (nicht implementiert)
1. **Komplexität**: Zusätzliche JOINs erforderlich
2. **Wartung**: Mehr Tabellen zu verwalten  
3. **Overhead**: Separate Foreign Keys und Constraints
4. **Unflexibilität**: Schwieriger erweiterbar für neue Anlagentypen

## Beispiel-Daten
```sql
-- Aktuelle Zuordnungen
SELECT objectid, name, objanlage->>'Typ' as typ, objanlage->>'thresholds' as config 
FROM objects 
WHERE objanlage->>'thresholds' IS NOT NULL;
```

## UI-Integration

Die Debug-Tabelle im Netzwächter zeigt:
- Verwendete Threshold-Konfiguration pro Sensor
- Prioritäts-basierte Auswahl ist transparent sichtbar
- Fallback-Verhalten wird deutlich angezeigt
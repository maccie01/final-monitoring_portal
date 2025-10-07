# Technische Dokumentation - Temperaturanalyse und Grafana-Einbindung

## Inhaltsverzeichnis
1. [Temperaturanalyse-Methoden](#temperaturanalyse-methoden)
2. [Grafana-Integration](#grafana-integration)
3. [Datenarchitektur](#datenarchitektur)
4. [Implementierungsdetails](#implementierungsdetails)
5. [Performance und Optimierung](#performance-und-optimierung)
6. [Konfiguration und Setup](#konfiguration-und-setup)
7. [Troubleshooting](#troubleshooting)

---

## Temperaturanalyse-Methoden

### Übersicht
Die Temperaturanalyse ist das Kernstück des KI-geführten Netzwächters. Sie analysiert Vorlauf- (VL) und Rücklauftemperaturen (RL) von Heizungsanlagen in Echtzeit und kategorisiert diese nach konfigurierbaren Schwellwerten.

### Datenmodell

#### JSONB-basierte Temperaturspeicherung
```sql
-- Vorlauftemperatur-Daten (Flow Temperature)
fltemp JSONB DEFAULT '{}'::jsonb

-- Rücklauftemperatur-Daten (Return Temperature) 
rttemp JSONB DEFAULT '{}'::jsonb
```

#### Beispiel-Datenstruktur
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

### Algorithmus zur Status-Kategorisierung

#### Core-Funktion: `analyzeObjectTemperature`
```typescript
function analyzeObjectTemperature(
  obj: any, 
  thresholds: ThresholdSettings[]
): TemperatureAnalysisResult {
  
  // 1. Threshold-Konfiguration bestimmen
  let objectThresholds = null;
  let configSource = 'netzwaechter_0'; // Fallback
  
  // Priorität: objanlage.thresholds > netzwaechter_0
  if (obj.objanlage?.thresholds) {
    const found = thresholds.find(t => 
      (t.keyName || t.key_name) === obj.objanlage.thresholds
    );
    if (found) {
      objectThresholds = found.value?.thresholds;
      configSource = obj.objanlage.thresholds;
    }
  }
  
  // Fallback auf Standard-Konfiguration
  if (!objectThresholds) {
    const defaultConfig = thresholds.find(t => 
      (t.keyName || t.key_name) === 'netzwaechter_0'
    );
    if (defaultConfig) {
      objectThresholds = defaultConfig.value?.thresholds;
    }
  }
  
  // 2. Offline-Status prüfen
  const hasFltemp = obj.fltemp && obj.fltemp.updateTime;
  const hasRttemp = obj.rttemp && obj.rttemp.updateTime;
  
  if (!hasFltemp && !hasRttemp) {
    return { 
      offline: true, 
      reason: 'Keine Temperatur-Daten',
      lastUpdate: null 
    };
  }
  
  // Datenaktualität prüfen (24h-Regel)
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const flIsOld = hasFltemp && 
    new Date(obj.fltemp.updateTime) < twentyFourHoursAgo;
  const rtIsOld = hasRttemp && 
    new Date(obj.rttemp.updateTime) < twentyFourHoursAgo;
  
  if ((!hasFltemp || flIsOld) && (!hasRttemp || rtIsOld)) {
    return { 
      offline: true, 
      reason: 'Daten älter als 24h',
      lastUpdate: hasFltemp ? obj.fltemp.updateTime : obj.rttemp.updateTime
    };
  }
  
  // 3. Temperaturanalyse pro Sensor
  let critical = false;
  let warning = false;
  const sensors: SensorAnalysis[] = [];
  
  Object.keys(obj.fltemp).forEach(sensorId => {
    if (sensorId === 'updateTime') return;
    
    const vlTemp = obj.fltemp[sensorId];
    const rlTemp = obj.rttemp[sensorId];
    
    if (vlTemp !== undefined && rlTemp !== undefined) {
      const vlStatus = getTemperatureStatus(vlTemp, objectThresholds, 'vl');
      const rlStatus = getTemperatureStatus(rlTemp, objectThresholds, 'rl');
      
      const sensorStatus = 
        vlStatus === 'critical' || rlStatus === 'critical' ? 'critical' :
        vlStatus === 'warning' || rlStatus === 'warning' ? 'warning' : 'normal';
      
      if (sensorStatus === 'critical') critical = true;
      if (sensorStatus === 'warning') warning = true;
      
      sensors.push({
        id: sensorId,
        name: getSensorName(sensorId),
        vl: { value: vlTemp, status: vlStatus },
        rl: { value: rlTemp, status: rlStatus },
        overallStatus: sensorStatus,
        thresholdConfig: configSource
      });
    }
  });
  
  // 4. Gesamtstatus ermitteln
  const overallStatus = critical ? 'critical' : 
                       warning ? 'warning' : 'normal';
  
  return {
    offline: false,
    critical,
    warning,
    overallStatus,
    sensors,
    thresholdConfig: configSource,
    lastUpdate: obj.fltemp.updateTime || obj.rttemp.updateTime
  };
}
```

#### Hilfsfunktion: `getTemperatureStatus`
```typescript
function getTemperatureStatus(
  temperature: number,
  thresholds: any,
  type: 'vl' | 'rl'
): 'critical' | 'warning' | 'normal' {
  
  if (!thresholds) return 'normal';
  
  if (type === 'vl') {
    // Vorlauftemperatur: Überschreitung ist kritisch
    if (temperature > thresholds.critical?.vlValue) return 'critical';
    if (temperature > thresholds.warning?.vlValue) return 'warning';
  } else {
    // Rücklauftemperatur: Unterschreitung ist kritisch
    if (temperature < thresholds.critical?.rlValue) return 'critical';
    if (temperature < thresholds.warning?.rlValue) return 'warning';
  }
  
  return 'normal';
}
```

### Threshold-Konfigurationen

#### Standard-Konfigurationen
```typescript
// netzwaechter_0 (Global/Standard)
{
  "critical": { "vlValue": 49, "rlValue": 44 },
  "warning": { "vlValue": 53, "rlValue": 43 },
  "normal": { "vlValue": 55, "rlValue": 39 }
}

// netzwaechter_1 (Niedertemperatur 1)
{
  "critical": { "vlValue": 49, "rlValue": 44 },
  "warning": { "vlValue": 52, "rlValue": 42 },
  "normal": { "vlValue": 60, "rlValue": 35 }
}

// netzwaechter_2 (Niedertemperatur 2)
{
  "critical": { "vlValue": 39, "rlValue": 34 },
  "warning": { "vlValue": 42, "rlValue": 32 },
  "normal": { "vlValue": 45, "rlValue": 28 }
}
```

#### Anlagentypbasierte Zuordnung
```typescript
// Automatische Zuordnung über objanlage.thresholds
{
  "objanlage": {
    "Typ": "Niedertemperatur",
    "thresholds": "netzwaechter_2"  // Verweist auf Konfiguration
  }
}
```

### Performance-Optimierungen

#### Datenbank-Indizes
```sql
-- GIN-Indizes für effiziente JSONB-Abfragen
CREATE INDEX CONCURRENTLY idx_objects_fltemp_gin 
ON objects USING gin (fltemp);

CREATE INDEX CONCURRENTLY idx_objects_rttemp_gin 
ON objects USING gin (rttemp);

-- Composite Index für Temperatur-Queries
CREATE INDEX CONCURRENTLY idx_objects_temp_analysis 
ON objects (id, objectid) 
INCLUDE (fltemp, rttemp, objanlage);
```

#### Caching-Strategien
```typescript
// React Query für Frontend-Caching
const { data: thresholds } = useQuery({
  queryKey: ["/api/settings/thresholds"],
  staleTime: 5 * 60 * 1000, // 5 Minuten
  cacheTime: 10 * 60 * 1000  // 10 Minuten
});

// Memoization für teure Berechnungen
const memoizedAnalysis = useMemo(() => {
  return objects?.map(obj => analyzeObjectTemperature(obj, thresholds));
}, [objects, thresholds]);
```

---

## Grafana-Integration

### Architektur-Überblick
Die Grafana-Integration ermöglicht die nahtlose Einbindung von Grafana-Dashboards in die Heizungsanlagen-Management-Anwendung durch dynamische Panel-Generierung und Tab-Navigation.

### Komponenten-Struktur

#### Frontend-Komponenten
```
GrafanaDashboard.tsx
├── URL-Parameter-Parsing
├── Objekt-Auswahl-System
└── GrafanaContent.tsx
    ├── Tab-Generation (Database/Fallback)
    ├── Panel-Management
    ├── Histogramm-System
    └── Debug-Interface
```

#### State Management
```typescript
interface GrafanaState {
  selectedObjectId: number;        // Aktuelle Objekt-ID
  activeTab: number;              // Aktiver Tab-Index
  timeRange: string;              // Gewählter Zeitbereich
  openAccordions: Set<string>;    // Geöffnete Panel-States
  selectedCounters: Record<string, string>; // Ausgewählte Zähler pro Panel
  debugMode: boolean;             // Debug-Modus aktiv
}
```

### Dashboard-Typen

#### 1. Wächter-Modus (`typ=waechter`)
Spezieller Modus für Temperatur-Monitoring mit automatischer Tab-Generierung basierend auf verfügbaren Zählern.

```typescript
// Automatische Tab-Generierung im Wächter-Modus
const generateWaechterTabs = (portdata: any[], meter: any) => {
  const meterKeys = Object.keys(meter || {});
  const tabs: GrafanaTab[] = [];
  
  // Netz-Tabs (Z2054x)
  const netzZaehler = meterKeys.filter(key => key.match(/^Z205[4][1-3]$/));
  if (netzZaehler.length > 0) {
    tabs.push({
      id: 'netzwaechter',
      label: 'Netzwächter',
      icon: <Network className="h-4 w-4" />,
      panels: generateNetzPanels(netzZaehler, portdata)
    });
  }
  
  // Kessel-Tabs (Z2014x)
  const kesselZaehler = meterKeys.filter(key => key.match(/^Z201[4][1-3]$/));
  if (kesselZaehler.length > 0) {
    tabs.push({
      id: 'kesselwaechter',
      label: 'Kesselwächter',
      icon: <Flame className="h-4 w-4" />,
      panels: generateKesselPanels(kesselZaehler, portdata)
    });
  }
  
  // Wärmepumpen-Tabs (Z2024x)
  const wpZaehler = meterKeys.filter(key => key.match(/^Z202[4][1-3]$/));
  if (wpZaehler.length > 0) {
    tabs.push({
      id: 'waermepumpenwaechter',
      label: 'Wärmepumpenwächter',
      icon: <Snowflake className="h-4 w-4" />,
      panels: generateWaermepumpenPanels(wpZaehler, portdata)
    });
  }
  
  return tabs;
};
```

#### 2. Auswertung-Modus (`typ=auswertung`)
Umfassende Datenanalyse mit konfigurierbaren Panels und Zeitbereichen.

```typescript
// Standard Auswertungs-Tabs aus Database
const generateDatabaseTabs = (portdata: any[], hasReport: boolean) => {
  return [
    {
      id: 'uebersicht',
      label: 'Übersicht',
      panels: generateUebersichtPanels(portdata)
    },
    {
      id: 'temperatur',
      label: 'Temperatur',
      panels: generateTemperaturPanels(portdata)
    },
    hasReport && {
      id: 'report',
      label: 'Report',
      panels: generateReportPanels(portdata)
    }
  ].filter(Boolean);
};
```

#### 3. Eigenes Board (`typ=eigenesboard`)
Benutzerdefinierte Dashboard-Konfigurationen.

### URL-Generierung für Grafana-Panels

#### Core-Funktion: `generateGrafanaUrl`
```typescript
function generateGrafanaUrl(
  panel: GrafanaPanel,
  objectId: number,
  timeRange: string,
  selectedCounter?: string
): string {
  
  const baseUrl = 'https://your-grafana-instance.com';
  const dashboard = panel.dashboard || 'd-solo/default/dashboard';
  
  // Basis-Parameter
  const params = new URLSearchParams({
    'orgId': '1',
    'refresh': '30s',
    'theme': 'light',
    'kiosk': 'tv',
    'from': convertTimeRange(timeRange).from,
    'to': convertTimeRange(timeRange).to
  });
  
  // Panel-spezifische Parameter
  if (panel.panelId) {
    params.set('panelId', panel.panelId.toString());
  }
  
  // Objekt-ID als Variable
  params.set('var-objectid', objectId.toString());
  
  // Zähler-spezifische Variable
  if (selectedCounter && panel.meterVariable) {
    params.set(`var-${panel.meterVariable}`, selectedCounter);
  }
  
  // Layout-spezifische Parameter
  if (panel.width) params.set('width', panel.width.toString());
  if (panel.height) params.set('height', panel.height.toString());
  
  return `${baseUrl}/${dashboard}?${params.toString()}`;
}
```

#### Zeitbereich-Konvertierung
```typescript
function convertTimeRange(range: string): { from: string; to: string } {
  const timeRanges = {
    'now-1h': { from: 'now-1h', to: 'now' },
    'now-6h': { from: 'now-6h', to: 'now' },
    'now-12h': { from: 'now-12h', to: 'now' },
    'now-24h': { from: 'now-24h', to: 'now' },
    'now-7d': { from: 'now-7d', to: 'now' },
    'now-30d': { from: 'now-30d', to: 'now' },
    'now-1y': { from: 'now-1y', to: 'now' }
  };
  
  return timeRanges[range] || timeRanges['now-24h'];
}
```

### Panel-Layout-System

#### Single-Panel-Layout
```typescript
interface SinglePanelLayout {
  type: 'single';
  panel: {
    dashboard: string;
    panelId: number;
    height: string;
    title: string;
  };
}
```

#### Dual-Panel-Layout (Split-View)
```typescript
interface DualPanelLayout {
  type: 'dual';
  leftPanel: {
    dashboard: string;
    panelId: number;
    width: string;     // z.B. "180px"
    title: string;
  };
  rightPanel: {
    dashboard: string;
    panelId: number;
    title: string;
  };
  height: string;      // z.B. "250px"
}
```

#### Implementierung: `GrafanaSplitLayout`
```typescript
const GrafanaSplitLayout: React.FC<DualPanelLayoutProps> = ({
  leftSrc,
  rightSrc,
  leftTitle,
  rightTitle,
  leftWidth = "180px",
  height = "250px"
}) => {
  return (
    <div className="grafana-split-container border rounded-lg overflow-hidden">
      <div className="flex" style={{ height }}>
        {/* Linkes Panel */}
        <div className="grafana-panel-left border-r" style={{ width: leftWidth }}>
          <div className="bg-gray-50 px-3 py-2 border-b text-sm font-medium">
            {leftTitle}
          </div>
          <iframe
            src={leftSrc}
            width="100%"
            height={`calc(${height} - 40px)`}
            frameBorder="0"
            title={leftTitle}
          />
        </div>
        
        {/* Rechtes Panel */}
        <div className="grafana-panel-right flex-1">
          <div className="bg-gray-50 px-3 py-2 border-b text-sm font-medium">
            {rightTitle}
          </div>
          <iframe
            src={rightSrc}
            width="100%"
            height={`calc(${height} - 40px)`}
            frameBorder="0"
            title={rightTitle}
          />
        </div>
      </div>
    </div>
  );
};
```

### Interaktive Features

#### Histogramm-Toggle
```typescript
const HistogrammSystem: React.FC<{ panel: GrafanaPanel }> = ({ panel }) => {
  const [showHistogramm, setShowHistogramm] = useState(false);
  
  return (
    <div className="space-y-2">
      {/* Haupt-Panel */}
      <GrafanaIframeContainer
        src={generateGrafanaUrl(panel, objectId, timeRange)}
        title={panel.title}
        height={panel.height}
      />
      
      {/* Histogramm-Toggle */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistogramm(!showHistogramm)}
          className="text-xs"
        >
          <BarChart3 className="h-3 w-3 mr-1" />
          {showHistogramm ? 'Histogramm ausblenden' : 'Histogramm anzeigen'}
        </Button>
      </div>
      
      {/* Histogramm-Panel */}
      {showHistogramm && panel.histogramm && (
        <GrafanaIframeContainer
          src={generateGrafanaUrl(panel.histogramm, objectId, timeRange)}
          title={`${panel.title} - Histogramm`}
          height="200px"
        />
      )}
    </div>
  );
};
```

### Debug-Interface

#### Debug-Modal Implementation
```typescript
const DebugInterface: React.FC<{ objectData: any }> = ({ objectData }) => {
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugView, setDebugView] = useState<'portdata' | 'meter' | 'full'>('portdata');
  
  const debugData = {
    portdata: objectData.portdata,
    meter: objectData.meter,
    full: objectData
  };
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDebugOpen(true)}
        className="ml-2"
      >
        <Settings className="h-4 w-4" />
        Debug
      </Button>
      
      <Dialog open={debugOpen} onOpenChange={setDebugOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Debug-Informationen</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Debug-View-Switcher */}
            <div className="flex space-x-2">
              {Object.keys(debugData).map(view => (
                <Button
                  key={view}
                  variant={debugView === view ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDebugView(view as any)}
                >
                  {view}
                </Button>
              ))}
            </div>
            
            {/* JSON-Anzeige */}
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-sm">
              {JSON.stringify(debugData[debugView], null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
```

---

## Datenarchitektur

### Backend-API-Endpunkte

#### Objekt-Daten
```typescript
// GET /api/objects
// Gibt alle Objekte mit Temperatur- und Konfigurationsdaten zurück
interface ObjectResponse {
  id: number;
  objectid: number;
  name: string;
  city?: string;
  fltemp?: Record<string, number | string>;    // JSONB
  rttemp?: Record<string, number | string>;    // JSONB
  portdata?: any[];                            // JSONB
  meter?: Record<string, string>;              // JSONB
  dashboard?: any;                             // JSONB
  objanlage?: {
    Typ?: string;
    thresholds?: string;
  };
}
```

#### Threshold-Konfiguration
```typescript
// GET /api/settings/thresholds
interface ThresholdResponse {
  id: number;
  keyName: string;
  value: {
    thresholds: {
      critical: { vlValue: number; rlValue: number };
      warning: { vlValue: number; rlValue: number };
      normal: { vlValue: number; rlValue: number };
    };
  };
}
```

### Frontend-Datenmodelle

#### GrafanaObject Interface
```typescript
interface GrafanaObject {
  id: number;                    // Datenbank-ID
  objectid: number;              // Externe Objekt-ID
  name: string;                  // Objektname
  city?: string;                 // Stadt/Ort
  portdata?: PortdataPanel[];    // Layout-Konfiguration
  meter?: Record<string, string | number>; // Zähler-Zuordnungen
  dashboard?: DashboardConfig;   // Dashboard-Konfiguration
}
```

#### GrafanaTab Interface
```typescript
interface GrafanaTab {
  id: string;                    // Eindeutige Tab-ID
  label: string;                 // Anzeigename
  icon?: React.ReactNode;        // Icon-Komponente
  panels: GrafanaPanel[];        // Panel-Konfigurationen
  isActive?: boolean;            // Aktiv-Status
}
```

#### GrafanaPanel Interface
```typescript
interface GrafanaPanel {
  id: string;                    // Eindeutige Panel-ID
  title: string;                 // Panel-Titel
  dashboard: string;             // Grafana-Dashboard-URL
  panelId?: number;              // Grafana-Panel-ID
  height?: string;               // Panel-Höhe
  width?: string;                // Panel-Breite
  type: 'single' | 'dual';       // Layout-Typ
  meterVariable?: string;        // Variable für Zähler-Auswahl
  counterSelections?: CounterSelection[]; // Counter-Optionen
  histogramm?: GrafanaPanel;     // Histogramm-Panel
}
```

---

## Performance und Optimierung

### Datenbank-Optimierungen

#### JSONB-Indizes
```sql
-- Temperatur-Daten-Indizes
CREATE INDEX CONCURRENTLY idx_objects_fltemp_updatetime 
ON objects USING gin ((fltemp->'updateTime'));

CREATE INDEX CONCURRENTLY idx_objects_rttemp_updatetime 
ON objects USING gin ((rttemp->'updateTime'));

-- Anlagen-Konfiguration-Index
CREATE INDEX CONCURRENTLY idx_objects_objanlage_thresholds 
ON objects USING gin ((objanlage->'thresholds'));
```

#### Optimierte Queries
```sql
-- Effiziente Abfrage für kritische Anlagen
SELECT id, objectid, name, fltemp, rttemp, objanlage
FROM objects 
WHERE fltemp ? 'updateTime' 
  AND rttemp ? 'updateTime'
  AND (fltemp->>'updateTime')::timestamp > NOW() - INTERVAL '24 hours'
ORDER BY id;
```

### Frontend-Performance

#### React Query Konfiguration
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 Minuten
      cacheTime: 10 * 60 * 1000,     // 10 Minuten
      refetchOnWindowFocus: false,
      retry: 2
    }
  }
});
```

#### Memoization-Strategien
```typescript
// Tab-Generierung optimiert
const memoizedTabs = useMemo(() => {
  if (!objectData?.portdata || !objectData?.meter) return [];
  
  return generateTabsFromDatabase(
    objectData.portdata,
    objectData.meter,
    objectData.dashboard?.hasReport || false
  );
}, [objectData?.portdata, objectData?.meter, objectData?.dashboard?.hasReport]);

// URL-Generierung mit Cache
const urlCache = new Map<string, string>();

const getCachedUrl = (cacheKey: string, urlGenerator: () => string) => {
  if (!urlCache.has(cacheKey)) {
    urlCache.set(cacheKey, urlGenerator());
  }
  return urlCache.get(cacheKey)!;
};
```

### Grafana-Performance

#### Panel-Optimierungen
```typescript
// Lazy Loading für Grafana-Panels
const LazyGrafanaPanel: React.FC<{ src: string }> = ({ src }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, inView] = useInView({ threshold: 0.1 });
  
  useEffect(() => {
    if (inView && !isVisible) {
      setIsVisible(true);
    }
  }, [inView, isVisible]);
  
  return (
    <div ref={ref}>
      {isVisible ? (
        <iframe src={src} width="100%" height="300px" />
      ) : (
        <div className="h-[300px] bg-gray-100 animate-pulse" />
      )}
    </div>
  );
};
```

---

## Konfiguration und Setup

### Threshold-Konfiguration

#### Neue Threshold-Konfiguration hinzufügen
```sql
-- Beispiel: Neue Wärmepumpen-Konfiguration
INSERT INTO settings (category, key_name, value, created_at)
VALUES (
  'thresholds',
  'waermepumpe_spezial',
  '{
    "thresholds": {
      "critical": {"vlValue": 45, "rlValue": 35},
      "warning": {"vlValue": 42, "rlValue": 32},
      "normal": {"vlValue": 40, "rlValue": 30}
    }
  }'::jsonb,
  NOW()
);
```

#### Objekt-Zuordnung
```sql
-- Objekt einer spezifischen Threshold-Konfiguration zuordnen
UPDATE objects 
SET objanlage = jsonb_set(
  COALESCE(objanlage, '{}'::jsonb),
  '{thresholds}',
  '"waermepumpe_spezial"'
)
WHERE objectid = 207315076;
```

### Grafana-Dashboard-Setup

#### Dashboard-Konfiguration in portdata
```json
{
  "portdata": [
    {
      "containerId": "panel-1",
      "type": "single",
      "dashboard": "d-solo/abc123/heating-overview",
      "panelId": 2,
      "title": "Temperaturübersicht",
      "height": "300px",
      "meterVariable": "zaehler"
    },
    {
      "containerId": "panel-2", 
      "type": "dual",
      "leftPanel": {
        "dashboard": "d-solo/def456/statistics",
        "panelId": 5,
        "width": "180px"
      },
      "rightPanel": {
        "dashboard": "d-solo/def456/trends", 
        "panelId": 6
      },
      "height": "250px"
    }
  ]
}
```

### Umgebungsvariablen
```bash
# Grafana-Integration
GRAFANA_BASE_URL=https://your-grafana-instance.com
GRAFANA_API_KEY=your-api-key

# Temperatur-Monitoring
TEMP_ANALYSIS_INTERVAL=300  # 5 Minuten
TEMP_DATA_RETENTION=24      # 24 Stunden

# Performance
CACHE_TTL=300              # 5 Minuten
MAX_OBJECTS_PER_QUERY=100
```

---

## Troubleshooting

### Häufige Probleme

#### 1. Temperatur-Daten werden nicht angezeigt
```typescript
// Debug-Schritte:
// 1. Datenstruktur prüfen
console.log('fltemp:', object.fltemp);
console.log('rttemp:', object.rttemp);

// 2. Update-Zeit validieren
const updateTime = object.fltemp?.updateTime;
const isRecent = updateTime && 
  new Date(updateTime) > new Date(Date.now() - 24*60*60*1000);
console.log('Update recent:', isRecent);

// 3. Threshold-Konfiguration überprüfen
console.log('Available configs:', thresholds?.map(t => t.keyName));
```

#### 2. Grafana-Panels laden nicht
```typescript
// URL-Validierung
const validateGrafanaUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    console.log('Dashboard:', urlObj.pathname);
    console.log('Parameters:', Object.fromEntries(urlObj.searchParams));
    return true;
  } catch (error) {
    console.error('Invalid URL:', error);
    return false;
  }
};
```

#### 3. Performance-Probleme
```sql
-- Slow Query Analysis
EXPLAIN ANALYZE 
SELECT id, objectid, name, fltemp, rttemp 
FROM objects 
WHERE fltemp ? 'updateTime';

-- Index-Nutzung prüfen
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'objects';
```

### Debug-Tools

#### Frontend-Debug-Konsole
```typescript
// Global Debug-Objekt
window.heatcareDebug = {
  analyzeObject: (objectId: number) => {
    const obj = objects?.find(o => o.id === objectId);
    if (obj) {
      console.log('Analysis:', analyzeObjectTemperature(obj, thresholds));
    }
  },
  
  testThresholds: (temp: number, type: 'vl' | 'rl') => {
    thresholds?.forEach(config => {
      console.log(`${config.keyName}:`, getTemperatureStatus(temp, config.value?.thresholds, type));
    });
  },
  
  generateUrl: (panelId: number, objectId: number) => {
    console.log(generateGrafanaUrl({ panelId, dashboard: 'test' }, objectId, 'now-24h'));
  }
};
```

#### API-Endpoints für Debugging
```typescript
// GET /api/debug/temperature-analysis/:objectId
// Vollständige Temperatur-Analyse für ein Objekt

// GET /api/debug/threshold-configs
// Alle verfügbaren Threshold-Konfigurationen

// POST /api/debug/test-grafana-url
// Validiert Grafana-URL-Generierung
```

### Monitoring und Logs

#### Temperature Analysis Metrics
```typescript
const metrics = {
  totalObjects: objects.length,
  criticalObjects: analysisResults.filter(r => r.critical).length,
  warningObjects: analysisResults.filter(r => r.warning).length,
  offlineObjects: analysisResults.filter(r => r.offline).length,
  configurationErrors: analysisResults.filter(r => !r.thresholdConfig).length
};

console.log('Temperature Analysis Metrics:', metrics);
```

#### Grafana Integration Health
```typescript
const healthCheck = {
  totalPanels: tabs.reduce((sum, tab) => sum + tab.panels.length, 0),
  urlGenerationErrors: 0,
  loadingPanels: activeIframes.length,
  cachedUrls: urlCache.size
};

console.log('Grafana Integration Health:', healthCheck);
```

---

**Version**: 3.0  
**Letzte Aktualisierung**: 19. August 2025  
**Gültig für**: Heizsystemmanagement-Anwendung v3.0+

**Dokumentation erstellt von**: KI-System  
**Review erforderlich**: Ja (Technische Validierung)
# Grafana-Integration Dokumentation

## Inhaltsverzeichnis
1. [Systemübersicht](#systemübersicht)
2. [Technische Architektur](#technische-architektur)
3. [Datenstrukturen](#datenstrukturen)
4. [Konfigurationsparameter](#konfigurationsparameter)
5. [UI-Komponenten](#ui-komponenten)
6. [URL-Generierung](#url-generierung)
7. [Layout-System](#layout-system)
8. [Implementierungsdetails](#implementierungsdetails)
9. [Beispielkonfigurationen](#beispielkonfigurationen)
10. [Troubleshooting](#troubleshooting)

---


## Systemübersicht

Die Grafana-Integration ermöglicht die nahtlose Einbindung von Grafana-Dashboards in die Heizungsanlagen-Management-Anwendung. Das System unterstützt:

- **Multi-Object-Support**: Dynamische Auswahl verschiedener Heizungsobjekte
- **Flexible Layouts**: Single-Panel und Dual-Panel-Darstellungen
- **Zeitbereich-Steuerung**: Konfigurierbare Zeiträume für Datenanalyse
- **Hierarchische Tab-Struktur**: Kategorisierte Ansichten (Netzwächter, Kesselwächter, Wärmepumpenwächter)
- **Interactive Histogramme**: Zusätzliche Detail-Ansichten
- **Responsive Design**: Anpassbar an verschiedene Bildschirmgrößen

---

## Technische Architektur

### Frontend-Komponenten
```
GrafanaContent.tsx
├── Objekt-Auswahl-System
├── Tab-Navigation
├── Panel-Management
├── Histogramm-System
└── Debug-Interface
```

### State Management
- **React Hooks**: useState für lokalen State
- **TanStack Query**: Server-seitige Datenabfrage
- **Zustandsvariablen**:
  - `selectedObjectId`: Aktuelle Objekt-ID
  - `activeTab`: Aktiver Tab-Index
  - `timeRange`: Gewählter Zeitbereich
  - `openAccordions`: Geöffnete Panel-States
  - `selectedCounters`: Ausgewählte Zähler pro Panel

---

## Datenstrukturen

### GrafanaObject Interface
```typescript
interface GrafanaObject {
  id: number;                    // Datenbankspezifische ID
  objectid: number;              // Externe Objekt-ID (z.B. 274609033)
  name: string;                  // Objektname (z.B. "Ahornstr. 15")
  city?: string;                 // Stadt/Ort
  portdata?: any[];              // Layout-Konfiguration
  meter?: Record<string, string | number>; // Zähler-Zuordnungen
  dashboard?: any;               // Dashboard-Konfiguration
}
```

### GrafanaTab Interface
```typescript
interface GrafanaTab {
  id: string;                    // Eindeutige Tab-ID
  label: string;                 // Anzeigename des Tabs
  icon?: React.ReactNode;        // Icon-Komponente
  panels: GrafanaPanel[];        // Array von Panels
}
```

### GrafanaPanel Interface
```typescript
interface GrafanaPanel {
  id: string;                    // Panel-ID
  label: string;                 // Panel-Beschreibung
  panelId: string;               // Grafana Panel-ID (Haupt-Panel)
  panelId2?: string;             // Zweites Panel-ID für Dual-Layout
  histogram?: number[];          // Array von Histogramm-Panel-IDs
  panelIdWidth?: string;         // Layout-Breite ("180px" oder undefined)
  height?: string;               // Iframe-Höhe für Haupt-Panels (Standard: "250px")
  histogramHeight?: string;      // Iframe-Höhe für Histogramme (Standard: "250px")
  auswahl?: Array<{              // Zähler-Auswahloptionen
    id: string;                  // Zähler-ID
    idlabel: string;             // Anzeigename
  }>;
}
```

### Portdata-Struktur
```typescript
interface PortdataItem {
  sitelabel: string;             // Tab-Name
  site: Array<{
    id: string;                  // Panel-ID
    label: string;               // Panel-Beschreibung
    panelId: string;             // Grafana Panel-ID
    panelId2?: string;           // Zweites Panel (optional)
    panelIdWidth?: string;       // Layout-Breite
    height?: string;             // Iframe-Höhe für Haupt-Panels (Standard: "250px")
    histogramHeight?: string;    // Iframe-Höhe für Histogramme (Standard: "250px")
    histogram?: number[];        // Histogramm-Panel-IDs
    auswahl?: Array<{
      id: string;                // Zähler-ID (z.B. "Z20541")
      idlabel: string;           // Anzeigename (z.B. "Netz 1")
    }>;
  }>;
}
```

---

## Konfigurationsparameter

### Zeitbereiche (TIME_RANGES)
```javascript
const TIME_RANGES = [
  { value: "now-1d&to=now", label: "letzte 24h" },
  { value: "now-3d&to=now", label: "letzte 3 Tage" },
  { value: "now-7d&to=now", label: "letzte 7 Tage" },
  { value: "now-1y/1y&to=now-1y/1y", label: "letztes Jahr" }
];
```

### Zähler-Kategorien
```javascript
// Netzwächter (Wärmezähler) - Exakte Regex: ^Z205[4][1-3]$
const networkMeters = ["Z20541", "Z20542", "Z20543"];

// Kesselwächter - Exakte Regex: ^Z201[4][1-3]$
const boilerMeters = ["Z20141", "Z20142", "Z20143"];

// Wärmepumpenwächter - Exakte Regex: ^Z202[4][1-3]$
const heatPumpMeters = ["Z20241", "Z20242", "Z20243"];
```

### Grafana-Konfiguration
```javascript
const GRAFANA_CONFIG = {
  baseUrl: "https://graf.heatcare.one",
  dashboard: "d-solo/eelav0ybil2wwd/ws-heatcare",
  orgId: 1,
  features: ["dashboardSceneSolo"]
};
```

---

## UI-Komponenten

### Objekt-Auswahl-System

```

### Tab-Navigation
```tsx
<div className="flex space-x-0 border-b border-gray-200">
  {tabs.map((tab, index) => (
    <Button
      key={tab.id}
      variant="ghost"
      onClick={() => setActiveTab(index)}
      className={`flex items-center space-x-2 px-4 py-2 border-b-2 ${
        activeTab === index 
          ? "bg-gray-100 border-blue-500 text-blue-700 font-medium" 
          : "bg-gray-50 border-transparent text-gray-600"
      }`}
    >
      {tab.icon}
      <span>{tab.label}</span>
    </Button>
  ))}
</div>
```

### Panel-Akkordeon
```tsx
<Collapsible open={isOpen} onOpenChange={() => toggleAccordion(panel.id)}>
  <CollapsibleTrigger asChild>
    <CardHeader className="hover:bg-gray-50 cursor-pointer p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isOpen ? <ChevronDown /> : <ChevronRight />}
          <CardTitle>{panel.label}</CardTitle>
        </div>
      </div>
    </CardHeader>
  </CollapsibleTrigger>
</Collapsible>
```

---

## URL-Generierung

### generateGrafanaUrl Funktion
```typescript
const generateGrafanaUrl = (
  panelId: string,           // Grafana Panel-ID
  counterId?: string,        // Zähler-ID (optional)
  dashboard = "d-solo/eelav0ybil2wwd/ws-heatcare",
  grafanaBase = "https://graf.heatcare.one"
): string => {
  const resolvedId = counterId && selectedObject ? 
    resolveMeterId(counterId, selectedObject.meter) : '';
  
  let url = `${grafanaBase}/${dashboard}?orgId=1&from=${timeRange}&panelId=${panelId}`;
  
  if (resolvedId) {
    url += `&var-id=${resolvedId}`;
  }
  
  url += "&__feature.dashboardSceneSolo";
  return url;
};
```

### URL-Struktur
```
https://graf.heatcare.one/d-solo/eelav0ybil2wwd/ws-heatcare
  ?orgId=1
  &from=now-7d&to=now
  &panelId=16
  &var-id=1234567890
  &__feature.dashboardSceneSolo
```

### Zähler-Auflösung
```typescript
const resolveMeterId = (id: string, meter?: Record<string, string | number>): string => {
  if (!id || !meter) return id;
  
  // Z-Referenzen auflösen (z.B. Z20541 → tatsächliche Zähler-ID)
  if (id.match(/^[Zz]/)) {
    const meterId = meter[id.toUpperCase()];
    if (meterId) {
      return meterId.toString();
    }
    console.warn(`⚠️ Zähler-Referenz ${id} nicht gefunden`);
  }
  
  return id;
};
```

---

## Layout-System

### Single-Panel Layout
```tsx
<div className="grafana-container" style={{ height: panel.height || "250px" }}>
  <iframe
    src={generateGrafanaUrl(panel.panelId, selectedCounter)}
    className="grafana-iframe"
    title={`${panel.label} - Hauptdiagramm`}
    loading="lazy"
  />
</div>
```

### Dual-Panel Layout
```tsx
<div className="grafana-split-container" style={{ height: panel.height || "250px" }}>
  {/* Linkes Panel */}
  <div 
    className="grafana-panel-left"
    style={{ 
      width: panel.panelIdWidth === "180px" ? "180px" : "50%"
    }}
  >
    <iframe src={generateGrafanaUrl(panel.panelId, selectedCounter)} />
  </div>
  
  {/* Rechtes Panel */}
  <div className="grafana-panel-right">
    <iframe src={generateGrafanaUrl(panel.panelId2, selectedCounter)} />
  </div>
</div>
```

### Histogramm-Grid
```tsx
<div className="grafana-histogram-grid">
  {panel.histogram.map((histoPanelId, index) => (
    <div 
      key={histoPanelId}
      className="grafana-histogram-panel"
      style={{ height: panel.histogramHeight || "250px" }}
    >
      <iframe
        src={generateGrafanaUrl(histoPanelId.toString(), selectedCounter)}
        title={`${panel.label} - Histogramm ${index + 1}`}
      />
    </div>
  ))}
</div>
```

---

## URL-Parameter Funktionalität

### Aufruf-Modi

**1. Standard-Aufruf mit Objekt-ID:**
```url
/grafana-content?objectID=274609033
```

**2. Wächter-Modus:**
```url
/grafana-content?objectID=274609033&typ=waechter
```

### URL-Parameter-Verarbeitung
```typescript
// URL-Parameter Hilfsfunktionen
function getUrlParameter(name: string): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function isWaechterMode(): boolean {
  const typParam = getUrlParameter('typ');
  return typParam === 'waechter';
}
```

### Wächter-Modus Verhalten
- **Portdata wird ignoriert**: object.portdata komplett übersprungen
- **Meter-basierte Tab-Generierung**: Automatische Erstellung basierend auf Zähler-IDs
- **Automatische Kategorisierung**:
  - `Z205*` → **Netzwächter** Tab (Activity Icon)
  - `Z201*` → **Kesselwächter** Tab (Thermometer Icon) 
  - `Z202*` → **Wärmepumpenwächter** Tab (Zap Icon)

### Automatische Tab-Generierung (generateFallbackTabs)
```typescript
const generateFallbackTabs = (meter: Record<string, string | number> = {}): GrafanaTab[] => {
  const tabs: GrafanaTab[] = [];
  const meterKeys = Object.keys(meter);
  
  // Netzwächter Tab - Netz-Zähler (Z20541, Z20542, Z20543)
  // WICHTIG: Exakte Regex verwenden um Fehlklassifikationen zu vermeiden
  const netzZaehler = meterKeys.filter(key => key.match(/^Z205[4][1-3]$/));
  if (netzZaehler.length > 0) {
    tabs.push({
      id: "netzwaechter",
      label: "Netzwächter", 
      icon: <Activity className="h-4 w-4" />,
      panels: [{
        id: "netz-panel",
        label: "Wärmezähler Netz - Übersicht",
        panelId: "16",
        panelId2: "3", 
        panelIdWidth: "180px",
        height: "250px",
        histogramHeight: "250px",
        histogram: [4, 5, 7],
        auswahl: netzZaehler.map(key => ({
          id: key,
          idlabel: key === "Z20541" ? "Netz 1" : 
                   key === "Z20542" ? "Netz 2" : 
                   key === "Z20543" ? "Netz 3" :
                   `Netz ${key.slice(-1)}`
        }))
      }]
    });
  }
  
  // Kesselwächter Tab - Kessel-Zähler (Z20141, Z20142, Z20143)
  // WICHTIG: Exakte Regex verwenden: ^Z201[4][1-3]$
  const kesselZaehler = meterKeys.filter(key => key.match(/^Z201[4][1-3]$/));
  
  // Wärmepumpenwächter Tab - Wärmepumpen-Zähler (Z20241, Z20242, Z20243)
  // WICHTIG: Exakte Regex verwenden: ^Z202[4][1-3]$
  const waermepumpenZaehler = meterKeys.filter(key => key.match(/^Z202[4][1-3]$/));
  // ...weitere Implementierung
};
```

---

## Implementierungsdetails

### Tab-Generierung aus Daten
```typescript
const generateTabs = (object: GrafanaObject): GrafanaTab[] => {
  if (!object) return [];

  const tabs: GrafanaTab[] = [];
  
  // Wächter-Modus: portdata ignorieren und meter-Daten verwenden
  if (isWaechterMode()) {
    return generateFallbackTabs(object.meter);
  }
  
  // Standard-Modus: portdata bevorzugen
  if (object.portdata && Array.isArray(object.portdata)) {
    object.portdata.forEach((portItem, index) => {
      if (portItem.site && Array.isArray(portItem.site)) {
        const panels: GrafanaPanel[] = portItem.site.map((site: any) => ({
          id: site.id || `panel-${index}`,
          label: site.label || "Diagramm",
          panelId: site.panelId || "16",
          panelId2: site.panelId2,
          histogram: site.histogram,
          panelIdWidth: site.panelIdWidth,
          height: site.height,
          auswahl: site.auswahl,
        }));

        tabs.push({
          id: `tab-${index}`,
          label: portItem.sitelabel || `Tab ${index + 1}`,
          icon: getTabIcon(index),
          panels,
        });
      }
    });
  } else {
    // Fallback: Aus meter-Daten generieren
    tabs.push(...generateFallbackTabs(object.meter));
  }

  return tabs;
};
```

### State Management
```typescript
// Accordion-Status verwalten
const toggleAccordion = (panelId: string) => {
  const newOpenAccordions = new Set(openAccordions);
  if (newOpenAccordions.has(panelId)) {
    newOpenAccordions.delete(panelId);
  } else {
    newOpenAccordions.add(panelId);
  }
  setOpenAccordions(newOpenAccordions);
};

// Zähler-Auswahl verwalten
const handleCounterSelect = (panelId: string, counterId: string) => {
  setSelectedCounters(prev => ({
    ...prev,
    [panelId]: counterId,
  }));
};

// Histogramm-Anzeige umschalten
const toggleHistogram = (panelId: string) => {
  setShowHistograms(prev => ({
    ...prev,
    [panelId]: !prev[panelId],
  }));
};
```

---

## Beispielkonfigurationen

### Vollständige Portdata-Konfiguration
```json
{
  "portdata": [
    {
      "sitelabel": "Netzwächter",
      "site": [
        {
          "id": "netz-panel-1",
          "label": "Wärmezähler Netz - Übersicht",
          "panelId": "16",
          "panelId2": "3",
          "panelIdWidth": "180px",
          "height": "500px",
          "histogramHeight": "250px",
          "histogram": [4, 5, 7],
          "auswahl": [
            { "id": "Z20541", "idlabel": "Netz 1" },
            { "id": "Z20542", "idlabel": "Netz 2" }
          ]
        }
      ]
    },
    {
      "sitelabel": "Kesselwächter",
      "site": [
        {
          "id": "kessel-panel-1",
          "label": "Kesselüberwachung",
          "panelId": "12",
          "height": "350px",
          "histogramHeight": "250px",
          "auswahl": [
            { "id": "Z20141", "idlabel": "Kessel 1" },
            { "id": "Z20142", "idlabel": "Kessel 2" },
            { "id": "Z20143", "idlabel": "Kessel 3" }
          ]
        }
      ]
    }
  ]
}
```

### Höhen-Parameter Erklärung

**Standard-Höhen:**
- **Single & Dual Panel**: `250px` (Standard)
- **Histogramm-Panels**: `250px` (Standard)

**Konfigurierbare Höhen:**
```json
{
  "height": "300px",    // Niedrigere Panels für kompakte Ansicht
  "height": "600px",    // Höhere Panels für detaillierte Ansicht
  "height": "auto"      // Automatische Höhenanpassung
}
```

**Anwendungsbeispiele:**
- `"300px"` - Kompakte Dashboard-Ansicht
- `"500px"` - Erweiterte Datenvisualisierung
- `"700px"` - Vollständige Detailansicht für komplexe Diagramme

### Meter-Konfiguration
```json
{
  "meter": {
    "Z20541": "1234567890",
    "Z20542": "1234567891",
    "Z20141": "2345678901",
    "Z20142": "2345678902",
    "Z20241": "3456789012"
  }
}
```

---

## CSS-Styling

### Hauptklassen
```css
/* Container-Klassen */
.grafana-container {
  @apply bg-white border border-gray-200 rounded-lg shadow-sm;
}

.grafana-split-container {
  @apply flex gap-[1px] bg-gray-100;
  border-radius: 8px;
  overflow: hidden;
}

.grafana-histogram-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-2;
}

/* Panel-Klassen */
.grafana-panel-left {
  @apply bg-white overflow-hidden;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.grafana-panel-right {
  @apply bg-white overflow-hidden flex-1;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

/* Tab-Styling */
.tab-content-seamless {
  margin-top: -1px !important;
  border-top: 0 !important;
}

.tab-container-seamless {
  margin-bottom: 0 !important;
  border-bottom: 0 !important;
}
```

---

## API-Endpunkte

### Objekt-Abfrage
```javascript
// Alle Objekte abrufen
GET /api/objects
Response: Array<GrafanaObject>

// Objekt nach ObjectID abrufen
GET /api/objects/by-objectid/{objectid}
Response: GrafanaObject
```

### TanStack Query Integration
```typescript
// Objekte abfragen
const { data: objects } = useQuery({
  queryKey: ["/api/objects"],
});

// Spezifisches Objekt abfragen
const { data: selectedObject } = useQuery<GrafanaObject>({
  queryKey: ["/api/objects/by-objectid", selectedObjectId],
  enabled: !!selectedObjectId,
});
```

---

## Debug-System

### Debug-Modal Implementierung
```typescript
const openDebugModal = () => {
  if (selectedObject) {
    setDebugData({
      portdata: selectedObject?.portdata || [],
      meter: selectedObject?.meter || {},
      dashboard: selectedObject?.dashboard || {},
      fullData: selectedObject,
    });
    setDebugDialogOpen(true);
  }
};
```

### Debug-Informationen
Das Debug-Modal zeigt:
- **Portdata**: Vollständige Layout-Konfiguration mit farbkodierter Anzeige:
  - **PanelId2** (grün): Zweites Panel bei Dual-Layout
  - **Layout2** (blau): Layout-Information (180px + Flex / 50% + 50%)
  - **Panel-Info** (lila): Panel1: 16 | Panel2: 3 Format
  - **Width** (orange): panelIdWidth-Wert
  - **Height** (türkis): Konfigurierte iframe-Höhe
- **Meter**: Zähler-Zuordnungen und Referenzen  
- **Dashboard**: Dashboard-spezifische Einstellungen
- **Objekt-Metadaten**: ID, Name, Tab-Anzahl, aktiver Tab

### UI-Design-Prinzip
Layout-Details wurden aus der Hauptansicht in das Debug-Modal verschoben für:
- **Saubere UI**: Weniger visuelle Unordnung in der Hauptansicht
- **Detaillierte Debug-Info**: Erweiterte Informationen für Entwickler
- **Farbkodierung**: Einfachere Identifikation verschiedener Parameter

---

## Kürzlich Behobene Probleme

### Problem: Doppelte Wärmepumpen-Einträge durch falsche Regex-Filter (Behoben: Januar 2025)

**Problembeschreibung:**
- Objekt Heinrich-Heine-Str. 1 (ID: 296748099) zeigte doppelte Wärmepumpen-Tabs
- Ursache: Unspezifische Regex-Pattern `^Z202` erfasste fälschlicherweise Z20221 als Wärmepumpen-Zähler
- Z20221 ist kein gültiger Wärmepumpen-Zähler (nur Z20241, Z20242, Z20243)

**Technische Details:**
```javascript
// FEHLERHAFT (alte Version):
const waermepumpenZaehler = meterKeys.filter(key => key.match(/^Z202/));
// Problem: Erfasst Z20221, Z20241, Z20242, Z20243, etc.

// KORREKT (neue Version):
const waermepumpenZaehler = meterKeys.filter(key => key.match(/^Z202[4][1-3]$/));
// Erfasst nur: Z20241, Z20242, Z20243
```

**Durchgeführte Korrekturen:**
1. **GrafanaDashboard.tsx**: Alle drei Regex-Filter präzisiert
2. **GrafanaContent.tsx**: Database-Tabs und Fallback-Tabs korrigiert
3. **Regex-Patterns aktualisiert:**
   - Netz: `^Z205[4][1-3]$` (Z20541, Z20542, Z20543)
   - Kessel: `^Z201[4][1-3]$` (Z20141, Z20142, Z20143)  
   - Wärmepumpe: `^Z202[4][1-3]$` (Z20241, Z20242, Z20243)

**Ergebnis:**
- Heinrich-Heine-Str. 1 zeigt jetzt korrekt nur eine Wärmepumpe (Z20241)
- Keine doppelten Tab-Einträge mehr
- Präzise Klassifikation aller Zählertypen

---

## Troubleshooting

### Häufige Probleme

**1. Objekt lädt nicht:**
- Prüfen ob Objekt-ID existiert
- Datenbankverbindung kontrollieren
- API-Endpunkt testen

**2. Grafana-Panel zeigt nicht:**
- URL-Generierung prüfen
- Zähler-Auflösung kontrollieren
- Grafana-Server-Erreichbarkeit testen

**3. Tabs werden nicht angezeigt:**
- Portdata-Struktur validieren
- Fallback-Tab-Generierung prüfen
- Meter-Daten kontrollieren

**4. Layout-Probleme:**
- CSS-Klassen überprüfen
- panelIdWidth-Parameter validieren
- Responsive-Breakpoints testen

### Debugging-Tipps
```javascript
// Console-Logging aktivieren
console.log("Selected Object:", selectedObject);
console.log("Generated Tabs:", tabs);
console.log("Current Panel:", currentTab?.panels);

// URL-Generierung testen
console.log("Generated URL:", generateGrafanaUrl(panelId, counterId));

// Zähler-Auflösung debuggen
console.log("Resolved Meter ID:", resolveMeterId(counterId, meter));
```

---

## Performance-Optimierungen

### Lazy Loading
```tsx
<iframe
  src={generateGrafanaUrl(panel.panelId, selectedCounter)}
  loading="lazy"  // Lazy Loading aktiviert
  title={`${panel.label} - Panel`}
/>
```

### Memoization
```typescript
// URL-Generierung cachen
const memoizedUrl = useMemo(() => 
  generateGrafanaUrl(panel.panelId, selectedCounter),
  [panel.panelId, selectedCounter, timeRange]
);

// Tab-Generierung optimieren
const memoizedTabs = useMemo(() => 
  generateTabs(selectedObject),
  [selectedObject]
);
```

### State-Optimierung
```typescript
// Accordion-State effizient verwalten
const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());

// Batch-Updates für Multiple-State-Changes
const handleObjectChange = useCallback((objectId: number) => {
  setSelectedObjectId(objectId);
  setActiveTab(0);
  setSelectedCounters({});
  setShowHistograms({});
}, []);
```

---

## Erweiterungsmöglichkeiten

### Zukünftige Features
1. **Dashboard-Templates**: Vordefinierte Layout-Templates
2. **Export-Funktionen**: PDF/PNG-Export von Dashboards
3. **Alarm-Integration**: Grafana-Alerts in der Anwendung
4. **Annotation-System**: Kommentare und Markierungen
5. **Multi-Tenant-Support**: Mandanten-spezifische Dashboards

### Plugin-Architektur
```typescript
interface GrafanaPlugin {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  config: Record<string, any>;
}

// Plugin-Registry
const plugins: GrafanaPlugin[] = [
  {
    id: "alarm-panel",
    name: "Alarm Panel",
    component: AlarmPanelComponent,
    config: { refreshInterval: 30000 }
  }
];
```

---

## Wartung und Updates

### Versionskompatibilität
- **Grafana**: Version 9.x+ erforderlich
- **Dashboard-Schema**: v1.0 kompatibel
- **API-Endpunkte**: v1 stabil

### Update-Prozedur
1. Backup der Konfigurationsdaten
2. Schema-Migration bei Bedarf
3. Frontend-Build aktualisieren
4. Grafana-Dashboard-Templates aktualisieren
5. Testing aller Objekt-Konfigurationen

---

*Letzte Aktualisierung: 25.07.2025*
*Version: 1.0*
*Autor: Heating System Management Team*
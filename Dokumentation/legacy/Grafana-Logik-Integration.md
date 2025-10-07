# Grafana-Integration - Vollständige Dokumentation (React-basiert)

## Inhaltsverzeichnis

1. [Grafana-Logik & Meter-basierte Erkennung](#1-grafana-logik--meter-basierte-erkennung)
2. [Basis-URL-Struktur](#2-basis-url-struktur)
3. [Übersicht](#3-übersicht)
4. [React-Architektur & Komponenten](#4-react-architektur--komponenten)
5. [TempID-Logik & Erkennung](#5-tempid-logik--erkennung)
6. [Netzwächter-Modus & Automatische Erkennung](#6-netzwächter-modus--automatische-erkennung)
7. [Tab-Generierung & Meter-Zuordnung](#7-tab-generierung--meter-zuordnung)
8. [URL-Generierung & Iframe-Verwaltung](#8-url-generierung--iframe-verwaltung)
9. [Zeitraum-Management & Navigation](#9-zeitraum-management--navigation)
10. [Settings-Integration & Konfiguration](#10-settings-integration--konfiguration)
11. [Layout-Modi & Rendering](#11-layout-modi--rendering)
12. [Performance-Optimierungen](#12-performance-optimierungen)
13. [Code-Umsetzung](#13-code-umsetzung)
14. [Debugging & Console-Logging](#14-debugging--console-logging)
15. [API-Integration & Datenquellen](#15-api-integration--datenquellen)
16. [State-Management & Navigation](#16-state-management--navigation)
17. [Verwendungsbeispiele](#17-verwendungsbeispiele)
18. [Troubleshooting & Häufige Probleme](#18-troubleshooting--häufige-probleme)

---

## 1. Grafana-Logik & Meter-basierte Erkennung


### Meter-Erkennungsmuster Übersicht

Die Grafana-Integration analysiert automatisch die Object-Meter-Daten und aktiviert entsprechende Layouts:

#### **Komplette Erkennungsmuster-Tabelle**

| **Meter-Muster** | **Kriterium** | **Beispiel** | **Tab/Layout** | **Priorität** |
|-------------------|---------------|---------------|----------------|---------------|
| **Explizite TempID** | `meter.TempID` Feld vorhanden | `{"TempID": "12345678"}` | **"Temperatur"** | **Höchste** |
| **Z20451 + TempID** | Z20451 + TempID Kombination | `{"Z20451": "xyz", "TempID": "abc"}` | **"Temperatur" und "Netz" (2x3 Grid)** | **Sehr Hoch** |
| **Z20541-Only** | Nur Z20541 Meter vorhanden | `{"Z20541": "123"}` | **"Netz" (2x3 Grid)** | **Hoch** |
| **Netz-Standard** | Mehrere Z2054x Meter | `{"Z20541": "123", "Z20542": "456", "Z20543": "789"}` | **"Netz"** | **Normal** |
| **Kessel** | Z2014x Meter gefunden | `{"Z20141": "789", "Z20142": "012"}` | **"Kessel"** | **Normal** |
| **Wärmepumpe** | Z2024x Meter gefunden | `{"Z20241": "345", "Z20242": "678"}` | **"Wärmepumpe"** | **Normal** |

#### **Spezielle Layout-Modi**

- **2x3 Grid Layout:** Nur bei Z20541-Only Modus (Overview + Main + 3 Histogramme)
- **Enhanced Tab-Generierung:** Bei Enhanced Mode (erweiterte Meter-Erkennung)
- **Standard Layout:** Bei allen anderen Meter-Kombinationen

#### **Automatische Aktivierung**

Die Grafana-Integration wird automatisch basierend auf Object-Meter-Daten aktiviert und konfiguriert:

## 2. Basis-URL-Struktur

**1. Minimale URL (nur Objekt-ID):**
```
/grafana-dashboards?objectID=207125085
```

**2. Erweiterte URL mit Diagramm-Modus und Tab-Vorauswahl:**
```
/grafana-dashboards?objectID=207125085&typ=diagramme&from=maps&tap=netzwaechter
```

**Parameter-Bedeutung:**
- `objectID` - Objekt-ID für die Datenabfrage und Meter-Analyse
- `typ=diagramme` - Aktiviert Diagramm-Modus mit 7-Tage-Zeitbereich
- `from=maps` - Referrer-Information für Navigation
- `tap=netzwaechter` - Direkte Tab-Vorauswahl (netzwaechter/kessel/waermepumpe)

**Automatische Erkennung:**
- Meter-basierte Tab-Generierung mit optionalen URL-Parameter-Ergänzungen

#### URL-Parameter für Diagramm-Modus

**URL-Parameter `typ=diagramme`**
```typescript
// Aktiviert speziellen Diagramm-Modus mit Settings-basiertem Zeitbereich
// Beispiel: /grafana-dashboards?objectID=207125085&typ=diagramme
const isWaechterMode = typFromUrl === "diagramme";

if (typParam === "diagramme") {
  // Verwende defaultInterval aus Settings oder Fallback
  const diagrammeInterval = defaultGrafanaSettings?.setupGrafana?.defaultInterval || "&from=now-7d&to=now";
  const timeRangeValue = diagrammeInterval.includes("&from=") 
    ? diagrammeInterval.replace("&from=", "").replace("&to=now", "") 
    : "now-7d";
  setTimeRange(timeRangeValue);     // Settings-basierter Zeitbereich
  setDashboardType("auswertung");   // Tab-Generierung
  setCurrentMainTab("diagramme");   // Automatischer Tab-Switch
}
```

**URL-Parameter `tap=` für Tab-Vorauswahl**
```typescript
// Ermöglicht direkten Tab-Zugriff
// Beispiel: /grafana-dashboards?objectID=207125085&typ=diagramme&tap=netzwaechter
const tapParam = params.get('tap');

// Unterstützte tap-Werte:
// - netzwaechter: Netz-Tab vorauswählen
// - kessel: Kessel-Tab vorauswählen  
// - waermepumpe: Wärmepumpe-Tab vorauswählen
```

#### Tab-Navigation via Meter-Erkennung

```
Z20541 Meter erkannt      => Tab "Netz" (2x3 Grid)
Z2054x Meter Netze erkannt      => Tab "Netz" (Enhanced)
Z2014x Meter Kessel erkannt     => Tab "Kessel" (Enhanced)
Z2024x Meter Wärmepumpe erkannt     => Tab "Wärmepumpe" (Enhanced)
TempID erkannt           => Tab "Temperatur"
```

#### Automatische Layout-Erkennung

**Meter-basierte Erkennung (ohne URL-Parameter):**

**Z20541-Only Modus:**
```
Nur Z20541 Meter vorhanden => Aktiviert Netzwächter-Spezial-Layout (2x3 Grid)
```


**Erkennungslogik:**
1. **Meter-Analyse:** Prüfung der verfügbaren Object-Meter-Daten
2. **Automatische Aktivierung:** Layout-Modus basierend auf Meter-Mustern
3. **Fallback:** Standard-Layout für alle anderen Kombinationen

### Code-Implementierung

```typescript
// Meter-basierte Erkennung
const isNetzwaechterMode = useMemo(() => {
  // Z20541-Only Modus
  const isZ20541Only = selectedObject?.meter ? (() => {
    const meterKeys = Object.keys(selectedObject.meter);
    const netzMeters = meterKeys.filter(key => key?.startsWith('Z2054'));
    return netzMeters.length === 1 && netzMeters[0] === 'Z20541';
  })() : false;
  
  // Enhanced Modus (mehrere Meter erkannt)
  const isEnhancedMode = selectedObject?.meter ? (() => {
    const meterKeys = Object.keys(selectedObject.meter);
    const netzMeters = meterKeys.filter(key => key?.startsWith('Z2054'));
    return netzMeters.length > 1;
  })() : false;
  
  return isZ20541Only || isEnhancedMode;
}, [selectedObject]);

// TempID-Erkennung
const hasTempID = useMemo(() => {
  const tempIDFromObject = selectedObject?.meter?.TempID;
  const z20451ID = selectedObject?.meter?.Z20451;
  const hasZ20451TempCombo = z20451ID && tempIDFromObject;
  const hasTempIDValue = !!tempIDFromObject || hasZ20451TempCombo;
  
  console.log('🔧 [TEMP-ID] Explizite TempID:', tempIDFromObject);
  console.log('🔧 [TEMP-ID] Z20451-Spezial:', hasZ20451TempCombo);
  
  if (hasTempIDValue) {
    console.log('🎯 [TEMP-ID-DETECTED] TempID pattern found:', tempIDFromObject || 'Z20451-Spezial');
  }
  
  return hasTempIDValue;
}, [selectedObject]);
```

---

## 3. Übersicht

Die Grafana-Integration der Monitoring-App ermöglicht die dynamische, tab- und objektbasierte Anzeige von Grafana-Dashboards und Diagrammen. Sie ist als React-Komponente (`GrafanaDiagramme.tsx`) implementiert und bietet eine flexible Lösung für die Darstellung von IoT-Daten in Echtzeit mit Tab-Navigation, speziellen Layouts und erweiterten Debug-Funktionen.

### Hauptmerkmale
- ✅ **React-Komponente** mit TypeScript und TanStack Query
- ✅ **Dynamische Tab-Generierung** basierend auf Meter-Daten
- ✅ **TempID-Logik-Erkennung** für spezielle Temperatur-Überwachung
- ✅ **Netzwächter-Spezial-Layout** (2x3 Grid: Overview + Main + 3 Histogramme)
- ✅ **Optimierte Iframe-Verwaltung** mit stabilen Referenzen
- ✅ **Zeitraum-Auswahl** mit dynamischen Updates ohne Reload
- ✅ **Meter-basierte Auto-Erkennung** für intelligente Layout-Aktivierung

---

## 4. React-Architektur & Komponenten

### Hauptkomponente: `GrafanaDiagramme.tsx`

```typescript
interface GrafanaDiagrammeProps {
  objectId: number;
  className?: string;
  dashboard?: string;
}

export const GrafanaDiagramme: React.FC<GrafanaDiagrammeProps>
```

### Interface-Strukturen

#### StandardMeter
```typescript
interface StandardMeter {
  key: string;        // Z20541, Z20141, TempID
  id: string;         // Meter-ID (numerisch)
  name: string;       // Display-Name (Netz1, Kessel1, etc.)
}
```

#### SpecialMeter (für Netzwächter-Layout)
```typescript
interface SpecialMeter extends StandardMeter {
  panelId: number;    // Grafana Panel-ID
  panelType: 'overview' | 'main' | 'histogram';
  title: string;      // Panel-Titel
  height: number;     // Panel-Höhe in Pixel
}
```

#### Tab-Interfaces
```typescript
interface Tab {
  id: string;         // temperatur, netzwaechter, kesselwaechter
  label: string;      // Display-Label für Tab
  icon: React.ReactElement;  // Lucide-Icon
  meters: StandardMeter[];
  panelId: number;
  isSpecialLayout?: boolean;
}

interface SpecialTab extends Tab {
  isSpecialLayout: true;
  meters: SpecialMeter[];  // Erweiterte Meter mit Panel-Types
}
```

---

## 5. TempID-Logik & Erkennung

### Mustererkennung für Temperatur-Objekte

Die **TempID-Erkennung** arbeitet mit **mehreren Erkennungsmustern** um Temperatur-Überwachungsobjekte automatisch zu identifizieren und spezielle UI-Elemente zu aktivieren:

#### **Erkennungsmuster Übersicht**

| **Muster** | **Kriterium** | **Beispiel** | **Priorität** |
|------------|---------------|---------------|---------------|
| **Explizite TempID** | `meter.TempID` Feld vorhanden | `meter: { "TempID": "12345678" }` | **Hoch** |
| **Z20451 Spezial** | Kombination Z20451 + TempID | `"Z20451": "xyz", "TempID": "abc"` | **Sehr Hoch** |

#### **Enhanced TempID-Erkennungslogik**

```typescript
const hasTempID = useMemo(() => {
  // 1. EXPLIZITE TEMPID-WERTE (Object Meter)
  const tempIDFromObject = selectedObject?.meter?.TempID;
  
  // 2. Z20451 SPEZIAL-MODUS (Erweiterte Temperatur-Überwachung)
  const z20451ID = selectedObject?.meter?.Z20451;
  const hasZ20451TempCombo = z20451ID && tempIDFromObject;
  
  // FINAL DETECTION
  const hasTempIDValue = !!tempIDFromObject || hasZ20451TempCombo;
  
  // DEBUG LOGGING
  console.log('🔧 [TEMP-ID] Checking TempID - Object:', tempIDFromObject);
  console.log('🔧 [TEMP-ID] Enhanced checks - Z20451Special:', hasZ20451TempCombo);
  console.log('🔧 [TEMP-ID] Z20451 ID:', z20451ID);
  
  if (hasTempIDValue) {
    console.log('🎯 [TEMP-ID-DETECTED] TempID system activated for object:', selectedObject?.objectid);
    console.log('🎯 [TEMP-ID-PATTERN] Detection method:', {
      explicitTempID: !!tempIDFromObject,
      z20451Special: hasZ20451TempCombo
    });
  }
  
  return hasTempIDValue;
}, [selectedObject]);
```

#### **Praktische Beispiele**

**Beispiel 1: Explizite TempID in Object-Meter**
```json
// Meter Data: { "TempID": "123456789", "Z20241": "555" }
// Ergebnis: ✅ TempID erkannt via explizites TempID-Feld
```

**Beispiel 2: Z20451 Spezial-Kombinationen**
```json
// Meter Data: { "Z20451": "999888", "TempID": "123456" }
// Ergebnis: ✅ TempID erkannt mit Z20451-Spezial-Modus
```

### TempID-spezifische Panel-Optionen

```typescript
// Panel-Optionen für TempID-Objekte
const panelOptions = useMemo(() => {
  // Check for TempID-specific configuration first
  if (hasTempID && defaultGrafanaSettings) {
    // Try direct access first (new structure)
    let tempPanelId = defaultGrafanaSettings?.setupGrafana?.TempDiagrammPanelId;
    let tempLabel = defaultGrafanaSettings?.setupGrafana?.TempDiagrammPanelIdLabel;
    
    // Fehler bei fehlender Konfiguration  
    if (!tempPanelId || !tempLabel) {
      // Zeige Fehler-iframe mit statischer Nachricht
      return [{
        value: 0,
        label: "Fehler: TempID-spezifische Panel",
        errorMessage: true
      }];
    }
    
    if (tempPanelId && tempLabel) {
      const tempOption = { value: tempPanelId, label: tempLabel };
      return [tempOption]; // Only show temperature option for TempID objects
    }
  }
  
  // Standard panel options for non-TempID objects
  return generateStandardPanelOptions();
}, [hasTempID, defaultGrafanaSettings, histogramSettings]);
```

---

## 6. Netzwächter-Modus & Automatische Erkennung

### **Netzwächter-Erkennungsmuster**

Der **Netzwächter-Modus** aktiviert automatisch das **Spezial-Layout (2x3 Grid)** basierend auf verschiedenen Erkennungsmustern:

#### **Erkennungsmuster Übersicht**

| **Trigger** | **Kriterium** | **Beispiel** | **Layout** |
|-------------|---------------|---------------|------------|
| **Z20541-Only Modus** | Nur Z20541 Meter vorhanden | `meter: {"Z20541": "123"}` | **2x3 Grid** |

#### **Enhanced Netzwächter-Erkennungslogik**

```typescript
const isNetzwaechterMode = useMemo(() => {
  // 1. AUTOMATISCHE Z20541-ONLY ERKENNUNG
  const isZ20541Only = selectedObject?.meter ? (() => {
    const meterKeys = Object.keys(selectedObject.meter);
    const netzMeters = meterKeys.filter(key => key?.startsWith('Z2054'));
    return netzMeters.length === 1 && netzMeters[0] === 'Z20541';
  })() : false;
  
  // 2. ENHANCED-MODUS (mehrere Z2054x Meter)
  const isEnhancedMode = selectedObject?.meter ? (() => {
    const meterKeys = Object.keys(selectedObject.meter);
    const netzMeters = meterKeys.filter(key => key?.startsWith('Z2054'));
    return netzMeters.length > 1; // Mehr als ein Netz-Meter
  })() : false;
  
  const isActive = isZ20541Only || isEnhancedMode;
  
  // DEBUG LOGGING
  console.log('🔧 [NETZWÄCHTER-DETECTION] Z20541-Only:', isZ20541Only, 'Enhanced:', isEnhancedMode);
  console.log('🔧 [NETZWÄCHTER-DETECTION] Final:', isActive);
  
  if (isActive) {
    console.log('🎯 [NETZWÄCHTER-MODE] Netzwächter-Spezial-Layout aktiviert!');
  }
  
  return isActive;
}, [selectedObject, hasTempID]);
```

#### **Aktivierungsbeispiele**

**Z20541-Only Modus:**
```typescript
// Meter: { "Z20541": "12345" }  // Nur ein Netz-Meter
// Ergebnis: ✅ Netzwächter-Layout aktiviert
```



### Netzwächter-Spezial-Layout

**2x3 Grid-Layout:**
- **Oben Links:** Overview Panel (16) - feste Breite
- **Oben Rechts:** Main Panel (dynamisch) - flexible Breite
- **Unten:** 3 Histogram-Panels in Grid-Layout

```typescript
// Netzwächter Special Layout Struktur
if (isNetzwaechterMode && netzwaechterSettings) {
  const netzwaechterPanels: SpecialMeter[] = [];
  
  // Overview Panel (links oben)
  const overviewPanelId = netzwaechterSettings.panelId || 16;
  netzwaechterPanels.push({
    ...primaryMeter,
    panelId: overviewPanelId,
    panelType: 'overview',
    title: 'Übersicht',
    height: parseInt(netzwaechterSettings.height) || 200
  });

  // Main Panel (rechts oben - dynamisch wählbar)
  const mainPanelId = selectedPanelId;
  netzwaechterPanels.push({
    ...primaryMeter,
    panelId: mainPanelId,
    panelType: 'main',
    title: panelOptions.find(opt => opt.value === selectedPanelId)?.label || 'Diagramm',
    height: parseInt(netzwaechterSettings.height) || 200
  });

  // Histogram Panels (unten)
  if (netzwaechterSettings.histogram && Array.isArray(netzwaechterSettings.histogram)) {
    netzwaechterSettings.histogram.forEach((panelId: number, index: number) => {
      const histogramTitles = ['Häufigkeit Temperaturen', 'Häufigkeit Leistung', 'Häufigkeit Durchfluss'];
      netzwaechterPanels.push({
        ...primaryMeter,
        panelId: panelId,
        panelType: 'histogram',
        title: histogramTitles[index] || `Histogramm ${index + 1}`,
        height: parseInt(netzwaechterSettings.histogramHeight) || 280
      });
    });
  }
}
```

---

## 7. Tab-Generierung & Meter-Zuordnung

### **Meter-Mustererkennung & Automatische Tab-Generierung**

Das System erkennt **automatisch Meter-Muster** und generiert entsprechende **Tabs mit spezialisierten Layouts**:

#### **Meter-Kategorien & Zuordnungsmuster**

| **Kategorie** | **Meter-Pattern** | **Tab-Name** | **Icon** | **Panel-ID** | **Layout** |
|---------------|------------------|--------------|----------|--------------|------------|
| **Netz-Meter** | `Z2054x` (Z20541, Z20542, Z20543) | "Netzwächter" | `⚡ Zap` | `16` | **Special 2x3** |
| **Kessel-Meter** | `Z2014x` (Z20141, Z20142, Z20143) | "Kesselwächter" | `🔥 Flame` | `19` | **Standard** |
| **Wärmepumpe** | `Z2024x` (Z20241, Z20242, Z20243) | "Wärmepumpenwächter" | `🌡️ Thermometer` | `20` | **Standard** |
| **TempID** | `TempID` oder ObjectId-Pattern | "Temperatur-Verlauf" | `📊 LineChart` | `25` | **TempID-Special** |

#### **Panel-ID Settings & Konfiguration**

**TempID-Spezial-Diagramme:**
```json
// Setting: defaultGrafana.TempDiagrammPanelId
"defaultGrafana": {
  "TempDiagrammPanelId": 25,  // Für TempID-basierte Temperatur-Verlaufskurven
  "defaultInterval": "7d"
}
```

**Netz-Spezial Layout (2x3 Grid):**
```json
// Setting: netzwaechter
"netzwaechter": {
  "panelId": 16,           // Overview Panel (links oben)
  "height": 200,           // Panel-Höhe
  "histogram": [4, 5, 7],  // Histogramm-Panels (unten)
  "histogramHeight": 280   // Histogramm-Höhe
}
```

**Standard-Diagramme (Netz/Kessel/Wärmepumpe):**
```json
// Setting: defaultGrafana.diagrammPanelId
"defaultGrafana": {
  "diagrammPanelId": 18,   // Für normale Tab-Diagramme
  "defaultInterval": "7d"
}
```

**Button SelectID (Histogramm-Auswahl):**
```json
// Setting: histogram (Array von Panel-IDs)
"histogram": [4, 5, 7, 8, 9, 10]
// Wird als Dropdown-Button zur Auswahl verschiedener Histogramm-Typen verwendet:
// - Panel 4: Häufigkeit Temperaturen
// - Panel 5: Häufigkeit Leistung  
// - Panel 7: Häufigkeit Durchfluss
// - Panel 8: Weitere Auswertungen...
```

#### **Enhanced Tab-Generierung mit Meter-Erkennung**

```typescript
const tabs = useMemo(() => {
  if (!selectedObject?.meter) return [];
  
  const meterData = selectedObject.meter;
  const generatedTabs: (Tab | SpecialTab)[] = [];
  const meterKeys = Object.keys(meterData);
  
  console.log('🔧 [TAB-GENERATION] Available meter keys:', meterKeys);
  console.log('🔧 [TAB-GENERATION] TempID detected:', hasTempID);

  // === 1. TEMPID TAB (HÖCHSTE PRIORITÄT) ===
  if (hasTempID) {
    const tempIDValue = meterData.TempID || String(selectedObject.objectid);
    const tempMeters = [{
      key: 'TempID',
      id: tempIDValue,
      name: 'Temperatur-Sensor'
    }];
    
    const tempPanelId = defaultGrafanaSettings?.setupGrafana?.TempDiagrammPanelId || 25;
    const tempLabel = defaultGrafanaSettings?.setupGrafana?.TempDiagrammPanelIdLabel || 'Temperatur-Verlauf';
    
    console.log('🔧 [TAB-GENERATION] TempID tab using panelId:', tempPanelId, 'label:', tempLabel);
    
    generatedTabs.push({
      id: "temperatur",
      label: tempLabel,
      icon: <LineChart className="h-4 w-4" />,
      meters: tempMeters,
      panelId: tempPanelId,
      isSpecialLayout: true  // TempID verwendet Special Layout
    });
  }

  // === 2. NETZWÄCHTER TAB (Z2054x Pattern) ===
  const netzMeters = Object.entries(meterData)
    .filter(([key]) => key?.startsWith('Z2054'))
    .map(([key, value]) => ({
      key,
      id: String(typeof value === 'object' && value ? value.ID : value),
      name: key === 'Z20541' ? 'Netz1' : 
           key === 'Z20542' ? 'Netz2' : 
           key === 'Z20543' ? 'Netz3' : 
           `Netz-${key.slice(-1)}`
    }));

  if (netzMeters.length > 0) {
    console.log('🔧 [TAB-GENERATION] Netz meters found:', netzMeters.length);
    
    generatedTabs.push({
      id: "netzwaechter",
      label: "Netzwächter",
      icon: <Zap className="h-4 w-4" />,
      meters: netzMeters,
      panelId: 16,
      isSpecialLayout: isNetzwaechterMode  // Special Layout wenn aktiviert
    });
  }

  // === 3. KESSELWÄCHTER TAB (Z2014x Pattern) ===
  const kesselMeters = Object.entries(meterData)
    .filter(([key]) => key?.startsWith('Z2014'))
    .map(([key, value]) => ({
      key,
      id: String(typeof value === 'object' && value ? value.ID : value),
      name: key === 'Z20141' ? 'Kessel1' : 
           key === 'Z20142' ? 'Kessel2' : 
           key === 'Z20143' ? 'Kessel3' : 
           `Kessel-${key.slice(-1)}`
    }));

  if (kesselMeters.length > 0) {
    console.log('🔧 [TAB-GENERATION] Kessel meters found:', kesselMeters.length);
    
    generatedTabs.push({
      id: "kesselwaechter",
      label: "Kesselwächter",
      icon: <Flame className="h-4 w-4" />,
      meters: kesselMeters,
      panelId: 19
    });
  }

  // === 4. WÄRMEPUMPENWÄCHTER TAB (Z2024x Pattern) ===
  const waermepumpeMeters = Object.entries(meterData)
    .filter(([key]) => key?.startsWith('Z2024'))
    .map(([key, value]) => ({
      key,
      id: String(typeof value === 'object' && value ? value.ID : value),
      name: key === 'Z20241' ? 'Wärmepumpe1' : 
           key === 'Z20242' ? 'Wärmepumpe2' : 
           key === 'Z20243' ? 'Wärmepumpe3' : 
           `WP-${key.slice(-1)}`
    }));

  if (waermepumpeMeters.length > 0) {
    console.log('🔧 [TAB-GENERATION] Wärmepumpe meters found:', waermepumpeMeters.length);
    
    generatedTabs.push({
      id: "waermepumpenwaechter",
      label: "Wärmepumpenwächter",
      icon: <Thermometer className="h-4 w-4" />,
      meters: waermepumpeMeters,
      panelId: 20
    });
  }

  // === 5. Z20451-SPEZIAL TAB (Wenn vorhanden) ===
  if (meterKeys.includes('Z20451')) {
    const z20451Meters = [{
      key: 'Z20451',
      id: String(meterData.Z20451),
      name: 'Spezial-Sensor'
    }];
    
    console.log('🔧 [TAB-GENERATION] Z20451 Special meter found');
    
    generatedTabs.push({
      id: "enhanced",
      label: "Enhanced",
      icon: <Target className="h-4 w-4" />,
      meters: enhancedMeters,
      panelId: selectedPanelId,  // Dynamisch wählbar
      isSpecialLayout: true
    });
  }

  console.log('🔧 [TAB-GENERATION] Generated tabs:', generatedTabs.length, 'tabs');
  
  return generatedTabs;
}, [selectedObject, selectedPanelId, isNetzwaechterMode, netzwaechterSettings, hasTempID, defaultGrafanaSettings]);
```

#### **Meter-Pattern Erkennungsbeispiele**

**Beispiel 1: TempID-Objekt (Höchste Priorität)**
```json
// Meter: { "TempID": "359404231032203", "Z20241": "123" }
// Ergebnis: ✅ "Temperatur-Verlauf" Tab mit Panel-ID 25
```

**Beispiel 2: Multi-Meter-Objekt**
```json
// Meter: { 
//   "Z20541": "111", "Z20542": "222",  // Netz-Meter → Netzwächter Tab
//   "Z20141": "333",                    // Kessel-Meter → Kesselwächter Tab  
//   "Z20241": "444"                     // WP-Meter → Wärmepumpenwächter Tab
// }
// Ergebnis: ✅ 3 Tabs generiert mit entsprechenden Panel-IDs
```

**Beispiel 3: Z20451-Spezial-Kombination**
```json
// Meter: { "Z20451": "111", "Z20452": "222" }
// Ergebnis: ✅ "Enhanced" Tabs (separate Tabs für jeden Meter)
```

#### **Button SelectID - Histogramm-Auswahl**

Der **Button SelectID** ist ein **Dropdown-Button** zur dynamischen Auswahl verschiedener **Histogramm-Panel-IDs**:

**Funktion:**
- **Dropdown-Liste** mit verfügbaren Histogramm-Panels
- **Dynamische Panel-Umschaltung** ohne Neuladen
- **Benutzerfreundliche Labels** statt Panel-Nummern

**Konfiguration:**
```json
"histogram": [4, 5, 7, 8, 9, 10]
```

**Button-Labels:**
```typescript
const histogramLabels = {
  4: "Häufigkeit Temperaturen",
  5: "Häufigkeit Leistung", 
  7: "Häufigkeit Durchfluss",
  8: "Energieverteilung",
  9: "Lastganganalyse",
  10: "Effizienzklassen"
};
```

**Verwendung:**
- **Einzelklick** → Sofortige Panel-Umschaltung
- **Aktuelle Auswahl** → Visuell hervorgehoben
- **Dynamische URLs** → Panel-ID wird in Grafana-URL eingesetzt

#### **Tab-Prioritäten & Reihenfolge**

1. **TempID-Tab** (wenn TempID erkannt) - **Höchste Priorität**
2. **Netzwächter-Tab** (Z2054x Meter)
3. **Kesselwächter-Tab** (Z2014x Meter) 
4. **Wärmepumpenwächter-Tab** (Z2024x Meter)
5. **Spezial-Tab** (Z20451 Meter) - **Zusätzlich**

---

## 8. URL-Generierung & Iframe-Verwaltung

### Grafana-URL-Generation

```typescript
// Base URL ohne Zeit-Parameter
const getBaseGrafanaUrl = useCallback((meterId: string, panelId: number) => {
  const defaultDashboard = 'https://graf.heatcare.one/d-solo/eelav0ybil2wwd/ws-heatcare';
  const dashboardUrl = dashboard ? `https://graf.heatcare.one/${dashboard}` : defaultDashboard;
  
  // Vereinfachtes Format für TempID-Objekte
  if (meterId === String(objectId)) {
    return `${dashboardUrl}?var-id=${objectId}&panelId=${panelId}`;
  }
  
  // Standard-Format für andere Meter
  const stableIframeKey = `diagramme_${objectId}_${panelId}_${meterId}`;
  return `${dashboardUrl}?orgId=1&panelId=${panelId}&var-id=${meterId}&__feature.dashboardSceneSolo&refresh=${stableSessionTimestamp}&iframe=${stableIframeKey}&kiosk=1&t=${stableSessionTimestamp}`;
}, [objectId, dashboard, stableSessionTimestamp]);

// Dynamische URL mit aktueller Zeitspanne
const getCurrentGrafanaUrl = useCallback((meterId: string, panelId: number) => {
  const baseUrl = getBaseGrafanaUrl(meterId, panelId);
  const timeRange = allTimeRanges.find(option => option.value === selectedTimeRange);
  const finalCacheKey = `cache_${selectedTimeRange}_${meterId}`;
  
  return `${baseUrl}&from=${timeRange?.from || 'now-24h'}&to=${timeRange?.to || 'now'}&cache=${finalCacheKey}`;
}, [getBaseGrafanaUrl, selectedTimeRange, allTimeRanges]);
```

### Iframe-Optimierung & Performance

```typescript
// Stabile Iframe-Referenzen für sanfte Zeitraum-Updates
const [iframeRefs] = useState(() => new Map<string, HTMLIFrameElement>());

// Sanfte Zeitraum-Updates ohne Iframe-Reload
const updateIframeTimeRange = useCallback((meterId: string, panelId: number) => {
  const iframeKey = `${meterId}_${panelId}`;
  const iframe = iframeRefs.get(iframeKey);
  
  if (iframe) {
    const newUrl = getCurrentGrafanaUrl(meterId, panelId);
    if (iframe.src !== newUrl) {
      iframe.src = newUrl;
      console.log(`🔄 [SMOOTH UPDATE] Updated time range for ${meterId}`);
    }
  }
}, [getCurrentGrafanaUrl, iframeRefs]);
```

---

## 9. Zeitraum-Management & Navigation

### Zeitraum-Optionen

```typescript
// Kurzzeiträume
const shortTermRanges = [
  { value: '24h', label: 'Letzte 24h', from: 'now-24h', to: 'now' },
  { value: '3d', label: '3 Tage', from: 'now-3d', to: 'now' },
  { value: '7d', label: '7 Tage', from: 'now-7d', to: 'now' },
  { value: '30d', label: '30 Tage', from: 'now-30d', to: 'now' },
  { value: '90d', label: '3 Monate', from: 'now-90d', to: 'now' },
  { value: '6M', label: '6 Monate', from: 'now-6M', to: 'now' },
  { value: '1y', label: '12 Monate', from: 'now-1y', to: 'now' }
];

// Jahresansichten
const yearlyRanges = [
  { value: '2024', label: '2024', from: 'now-1y/y', to: 'now-1y/y' },
  { value: '2023', label: '2023', from: 'now-2y/y', to: 'now-2y/y' }
];
```

### URL-Parameter-Synchronisation

```typescript
// Tab-Update in URL
const updateTabInUrl = useCallback((tabId: string) => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    params.set('tap', tabId);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }
}, []);

// URL-Parameter-Parsing
const urlParams = useMemo(() => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return {
      objectID: params.get('objectID'),
      typ: params.get('typ'),
      tap: params.get('tap'),
      from: params.get('from')
    };
  }
  return { objectID: null, typ: null, tap: null, from: null };
}, []);
```

---

## 10. Settings-Integration & Konfiguration

### Settings-Abfragen

```typescript
// Histogram-Settings für Panel-Optionen
const { data: histogramSettings } = useQuery<any[]>({
  queryKey: ["/api/settings"],
  select: (data: any[]) => {
    const setting = data?.find(setting => setting.key_name === 'histogram')?.value;
    return setting;
  },
});

// DefaultGrafana-Settings für TempID-Konfiguration
const { data: defaultGrafanaSettings } = useQuery<any[]>({
  queryKey: ["/api/settings"],
  select: (data: any[]) => {
    const setting = data?.find(setting => setting.key_name === 'defaultGrafana')?.value;
    return setting;
  },
});

// Netzwächter-Settings für Spezial-Layout
const { data: netzwaechterSettings } = useQuery<any>({
  queryKey: ["/api/settings"],
  enabled: Boolean(isNetzwaechterMode),
  select: (data: any[]) => {
    const setting = data?.find(setting => setting.key_name === 'netzwaechter')?.value;
    return setting;
  },
});
```

### Settings-Strukturen

#### Histogram-Settings (neue Struktur)
```json
{
  "panelID": [4, 5, 7],
  "label": ["Temperatur", "Leistung", "Durchfluss"]
}
```

#### DefaultGrafana-Settings für TempID
```json
{
  "defaultGrafana": {
    "TempDiagrammPanelId": 25,
    "diagrammPanelId": 18,
    "defaultInterval": "7d"
  }
}
```

#### Netzwächter-Settings
```json
{
  "panelId": 16,
  "height": "200",
  "histogramHeight": "280", 
  "panelIdWidth": "180px",
  "histogram": [4, 5, 7]
}
```

---

## 11. Layout-Modi & Rendering

### Standard-Layout (StandardMeter[])

```jsx
// Standard Layout für normale Tabs
<div className="space-y-6">
  {tab.meters.map((meter: StandardMeter) => (
    <div key={`${tab.id}-${meter.id}-${tab.panelId}`} className="w-full">
      <div className={`${tab.id === "temperatur" ? "overflow-hidden" : "border border-gray-200 rounded-md overflow-hidden"}`}>
        <iframe
          src={getCurrentGrafanaUrl(meter.id, tab.panelId)}
          width="100%"
          height="240"
          frameBorder="0"
          title={`${meter.name} Grafana Panel`}
        />
      </div>
    </div>
  ))}
</div>
```

### Spezial-Layout (SpecialMeter[])

#### Z20541-Only Modus: 2x3 Grid Layout
```jsx
// Netzwächter Special Layout: 2x3 Grid für einzelnen Z20541
<div className="space-y-0.5">
  {/* Top Row: Overview + Main */}
  <div className="flex gap-0.5">
    {/* Overview Panel */}
    <div style={{ width: netzwaechterSettings.panelIdWidth || '140px' }}>
      <iframe src={getCurrentGrafanaUrl(meter.id, meter.panelId)} height={meter.height || 200} />
    </div>
    
    {/* Main Panel */}
    <div className="flex-1">
      <iframe src={getCurrentGrafanaUrl(meter.id, meter.panelId)} height={meter.height || 200} />
    </div>
  </div>

  {/* Bottom Row: 3 Histogram Panels */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5">
    {histogramMeters.map((meter: SpecialMeter) => (
      <div key={`histogram-${meter.panelId}`}>
        <iframe src={getCurrentGrafanaUrl(meter.id, meter.panelId)} height={meter.height || 280} />
      </div>
    ))}
  </div>
</div>
```

#### Enhanced Tab-Generierung
```jsx
// Enhanced Layout für mehrere Meter: Separate Tabs pro Meter
{netzMeters.length > 1 ? (
  // Erstelle separaten Tab für jeden Netz-Meter
  netzMeters.map(meter => (
    <TabContent key={`netzwaechter-${meter.key}`} className="space-y-0.5">
      {/* Individuelles 2x3 Grid pro Meter */}
      <div className="flex gap-0.5">
        <div style={{ width: '140px' }}>
          <iframe src={getGrafanaUrl(meter.id, 16)} height="200" />
        </div>
        <div className="flex-1">
          <iframe src={getGrafanaUrl(meter.id, selectedPanelId)} height="200" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-0.5">
        {histogramPanels.map(panelId => (
          <iframe key={panelId} src={getGrafanaUrl(meter.id, panelId)} height="280" />
        ))}
      </div>
    </TabContent>
  ))
) : (
  // Standard 2x3 Grid für einzelnen Meter
  <SingleMeterLayout />
)}
```

#### Button SelectID: Dynamische Panel-Auswahl
```jsx
// Histogramm-Panel-Auswahl via Dropdown
<Select value={selectedPanelId} onValueChange={setSelectedPanelId}>
  <SelectTrigger className="w-48">
    <SelectValue placeholder="Panel auswählen" />
  </SelectTrigger>
  <SelectContent>
    {panelOptions.map(option => (
      <SelectItem key={option.value} value={option.value}>
        {option.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

## 12. Performance-Optimierungen

### Iframe-Caching & Stability

```typescript
// Stabile Session-Timestamp - verhindert unnötige Reloads
const stableSessionTimestamp = useMemo(() => Date.now(), []);

// Iframe-Referenz-Map für sanfte Updates
const [iframeRefs] = useState(() => new Map<string, HTMLIFrameElement>());

// Lazy Loading für inaktive Tabs
loading={tabIndex === activeTab ? "eager" : "lazy"}
```

### URL-Parameter Management

**Automatische URL-Updates bei Tab-Wechsel:**
```typescript
// Tab-Wechsel setzt entsprechende URL-Parameter
if (newTab === "diagramme") {
  currentUrl.searchParams.set("typ", "diagramme");
  setTimeRange("now-7d");
} else if (newTab === "auswertung") {
  currentUrl.searchParams.set("typ", "KI-Auswertung");
  currentUrl.searchParams.delete("tap"); // tap Parameter entfernen
}
```

**Verwendung in Navigation:**
```typescript
// Maps.tsx: Links mit typ=diagramme
href={`/grafana-dashboards?objectID=${obj.objectid}&typ=diagramme&from=maps`}

// NetworkMonitor: Mit tap-Parameter für Tab-Vorauswahl
href={`/grafana-dashboards?objectID=${obj.objectid}&typ=diagramme&from=maps&tap=netzwaechter`}
```

### URL-Caching-System

```typescript
// Cache-Key für Zeitraum-Updates
const finalCacheKey = `cache_${selectedTimeRange}_${meterId}`;

// URL-Update ohne Iframe-Neuladung
const updateIframeTimeRange = useCallback((meterId: string, panelId: number) => {
  const iframe = iframeRefs.get(`${meterId}_${panelId}`);
  if (iframe && iframe.src !== newUrl) {
    iframe.src = newUrl; // Nur bei tatsächlicher Änderung
  }
}, [getCurrentGrafanaUrl, iframeRefs]);
```

---

## 13. Code-Umsetzung

### **defaultInterval Settings-Integration**

Die Zeitbereich-Konfiguration erfolgt über das `defaultInterval` Setting, das das Format `&from=now-7d&to=now` verwendet:

#### **Settings-Konfiguration:**
```json
{
  "setupGrafana": {
    "defaultInterval": "&from=now-7d&to=now",
    "TempDiagrammPanelId": 25,
    "TempDiagrammPanelIdLabel": "Temperatur-Verlauf"
  }
}
```

#### **Code-Implementierung in GrafanaDashboard.tsx:**

**Übersicht der Code-Stellen:**
- **Zeilen 1247-1270:** Grafana-Settings-Query und defaultGrafanaSettings-Extraktion
- **Zeilen 727-733:** `typ=diagramme` Parameter-Behandlung
- **Zeilen 765-770:** `typ=anlage` Parameter-Behandlung  
- **Zeilen 778-783:** `typ=objektinfo` Parameter-Behandlung
- **Zeilen 791-796:** `typ=bewertung` Parameter-Behandlung
- **Zeilen 805-809:** Standard-Behandlung ohne typ-Parameter

**1. Grafana-Settings laden und defaultGrafanaSettings extrahieren (Zeilen 1247-1270):**
```typescript
// Fetch Grafana settings for wächter configurations
const { data: grafanaSettings, isLoading: isLoadingGrafanaSettings } = useQuery({
  queryKey: ["/api/settings", "grafana"],
  queryFn: async () => {
    const response = await fetch("/api/settings?category=grafana");
    if (!response.ok) throw new Error("Failed to fetch Grafana settings");
    const data = await response.json();
    return data;
  },
  staleTime: 5 * 60 * 1000, // 5 Minuten Cache
  gcTime: 10 * 60 * 1000, // 10 Minuten Cache
  refetchOnWindowFocus: false,
});

// Extract defaultGrafana settings from grafanaSettings
const defaultGrafanaSettings = grafanaSettings?.find((setting: any) => setting.key_name === 'defaultGrafana')?.value;
```

**2. URL-Parameter typ=diagramme Behandlung (Zeilen 727-733):**
```typescript
// Handle dashboard type from URL parameter
if (typParam === "diagramme") {
  // Verwende defaultInterval aus Settings oder Fallback
  const diagrammeInterval = defaultGrafanaSettings?.setupGrafana?.defaultInterval || "&from=now-7d&to=now";
  const timeRangeValue = diagrammeInterval.includes("&from=") 
    ? diagrammeInterval.replace("&from=", "").replace("&to=now", "") 
    : "now-7d";
  setTimeRange(timeRangeValue);
  setDashboardType("auswertung"); // Wichtig für Tab-Generierung!
}
```

**Weitere typ-Parameter Behandlung:**
```typescript
// anlage, objektinfo, bewertung verwenden dieselbe Logik
} else if (typParam === "anlage") {
  const anlageInterval = defaultGrafanaSettings?.setupGrafana?.defaultInterval || "&from=now-7d&to=now";
  const timeRangeValue = anlageInterval.includes("&from=") 
    ? anlageInterval.replace("&from=", "").replace("&to=now", "") 
    : "now-7d";
  setTimeRange(timeRangeValue);
  setDashboardType("auswertung");
}
```

**Standard-Behandlung ohne typ-Parameter:**
```typescript
} else {
  // Kein typ-Parameter: Standard-Einstellungen für /grafana-dashboards
  const standardInterval = defaultGrafanaSettings?.setupGrafana?.defaultInterval || "&from=now-7d&to=now";
  const timeRangeValue = standardInterval.includes("&from=") 
    ? standardInterval.replace("&from=", "").replace("&to=now", "") 
    : "now-7d";
  setTimeRange(timeRangeValue);
  setDashboardType("auswertung"); // Standard Dashboard-Typ
}
```

#### **Parsing-Logik:**

**defaultInterval Format:** `"&from=now-7d&to=now"`

**Extraktion der Zeitbereich-Werte:**
```typescript
const parseDefaultInterval = (interval: string) => {
  if (interval.includes("&from=")) {
    // Extrahiert "now-7d" aus "&from=now-7d&to=now"
    return interval.replace("&from=", "").replace("&to=now", "");
  }
  // Fallback für andere Formate
  return "now-7d";
};
```

#### **Settings-Extraktion & Datenfluss:**

**1. Settings-Query:** Lädt alle Grafana-Settings aus `/api/settings?category=grafana`  
**2. Extraktion:** `defaultGrafanaSettings` filtert Setting mit `key_name === 'defaultGrafana'`  
**3. Zugriff:** `defaultGrafanaSettings?.setupGrafana?.defaultInterval` für Zeitbereich-Werte  
**4. Parsing:** Extrahiert `"now-7d"` aus `"&from=now-7d&to=now"` Format  
**5. Anwendung:** `setTimeRange(timeRangeValue)` setzt den konfigurierten Zeitbereich  

#### **Vorteile der Settings-basierten Konfiguration:**

1. **Zentrale Konfiguration:** Zeitbereiche können über Settings verwaltet werden
2. **Flexible Anpassung:** Verschiedene Zeitbereiche für verschiedene Objekt-Typen
3. **Fallback-Sicherheit:** Standard-Werte wenn Settings nicht verfügbar
4. **URL-Kompatibilität:** Direkter Einsatz in Grafana-URLs möglich
5. **Runtime-Loading:** Settings werden dynamisch zur Laufzeit geladen

---

## 14. Debugging & Console-Logging

### 🐛 **Admin-Debug-Modal**

**Zugang:** Nur für Admin/SuperAdmin-Rollen verfügbar

**Aktivierung:** Fixed Debug-Button (unten rechts) mit Bug-Icon

#### **Debug-Modal Funktionen:**

1. **Tab-Informationen:**
   - Tab-IDs und Labels
   - Panel-IDs pro Tab
   - Meter-Zuordnungen und IDs
   - Anzahl verfügbarer Meter

2. **Grafana-URLs:**
   - Generierte iframe-URLs pro Meter
   - URL-Generierungsstatus
   - Panel-URL-Zuordnung

3. **Live iframe-URLs:**
   - Aktuelle URL-Generierung in Echtzeit
   - Panel-Lookup-Debug-Informationen
   - URL-Generierungsfehler-Erkennung
   - Meter-ID zu Panel-ID Mapping

4. **Diagramme-URLs:**
   - Network-Monitor zu Grafana-Dashboard Links
   - URL-Parameter-Mapping
   - Tab-spezifische Routing-Parameter

5. **Konfigurationsdaten:**
   - Object-ID und aktive Tab-Information
   - Zeitraum-Einstellungen
   - URL-Parameter-Debug
   - Netzwächter-Modus und TempID-Status

#### **Debug-Modal Code:**
```jsx
{/* Debug Modal - nur für Admin-Rolle */}
{isAdmin && (
  <Dialog>
    <DialogTrigger asChild>
      <Button 
        variant="outline" 
        size="sm" 
        className="fixed bottom-4 right-4 z-50 bg-white shadow-lg"
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      {/* Umfangreiche Debug-Informationen */}
    </DialogContent>
  </Dialog>
)}
```

### Debug-Pattern für Entwicklung

```typescript
// TempID-Debugging
console.log('🎯 [TEMP-ID-DETECTED] TempID pattern found:', tempID);
console.log('🔧 [TEMP-ID] Explizite TempID:', tempIDFromObject);
console.log('🔧 [TEMP-ID] Z20451-Spezial:', hasZ20451TempCombo);

// Netzwächter-Mode-Debugging
console.log('🔧 [NETZWÄCHTER-MODE] Z20541-only:', isZ20541Only, '| Enhanced:', isEnhancedMode);
console.log('🔧 [NETZWÄCHTER-MODE] FINAL MODE:', isActive);
console.log('🎯 [NETZWÄCHTER-MODE] Netzwächter-Spezial-Layout aktiviert!');

// Enhanced Tab-Generierung
console.log('🎯 [ENHANCED-TAB-GENERATION] Enhanced-Modus erkannt! Generiere separate Tabs für', netzMeters.length, 'Netz-Meter');
console.log('🎯 [ENHANCED-TAB] Added', meter.name, 'tab with', netzwaechterPanels.length, 'panels');

// URL & Navigation-Debugging
console.log('🔄 [SMOOTH UPDATE] Updated time range for', meterId);
console.log('🎯 [ULTRA-STABLE] Panel loaded for', meter?.name, '(', meter?.id, ')');
```

### Debugging-Hierarchie
- `🎯 [TEMP-ID-DETECTED]` - TempID-Pattern erfolgreich erkannt
- `🔧 [TEMP-ID]` - TempID-Erkennung und -Verarbeitung
- `🔧 [NETZWÄCHTER-MODE]` - Netzwächter-Layout-Aktivierung (meter-basiert)
- `🎯 [ENHANCED-TAB-GENERATION]` - Enhanced Tab-Generierung
- `🎯 [ENHANCED-TAB]` - Einzelner Enhanced Tab erstellt
- `🔄 [SMOOTH UPDATE]` - Zeitraum-Updates ohne Reload
- `🎯 [ULTRA-STABLE]` - Iframe-Loading-Events


---

## 15. API-Integration & Datenquellen

### TanStack Query Integration

```typescript
// Objekt-Daten-Abfrage
const { data: selectedObject } = useQuery<any>({
  queryKey: ["/api/objects/by-objectid", objectId],
  enabled: !!objectId,
});

// Settings-Abfragen mit spezifischen Selektoren
const { data: histogramSettings } = useQuery<any[]>({
  queryKey: ["/api/settings"],
  staleTime: 0,
  select: (data: any[]) => data?.find(setting => setting.key_name === 'histogram')?.value,
});
```

### Meter-Datenstruktur

```json
// Beispiel: Objekt mit verschiedenen Meter-Typen
{
  "meter": {
    "Z20541": "55369880",     // Netz-Meter 1
    "Z20542": "55369881",     // Netz-Meter 2  
    "Z20141": "55280140",     // Kessel-Meter 1
    "Z20142": "55263805",     // Kessel-Meter 2
    "Z20241": "55270564",     // Wärmepumpe-Meter 1
    "Z20242": "55270563",     // Wärmepumpe-Meter 2
    "TempID": "123456789123456"  // Temperatur-ID
  }
}
```

---

## 16. State-Management & Navigation

### React-State-Hooks

```typescript
const [activeTab, setActiveTab] = useState(0);
const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
const [selectedPanelId, setSelectedPanelId] = useState(3);
const [userClickedTab, setUserClickedTab] = useState(false);
```

### URL-State-Synchronisation

```typescript
// Initial Tab-Sync basierend auf URL-Parameter
useEffect(() => {
  if (!tabs.length || userClickedTab) return;
  
  const tapParam = new URL(window.location.href).searchParams.get('tap');
  
  if (tapParam) {
    const tabIndex = tabs.findIndex(tab => tab.id === tapParam);
    if (tabIndex !== -1 && tabIndex !== activeTab) {
      setActiveTab(tabIndex);
    }
  } else if (!isDashboardNavigation && tabs.length > 0) {
    updateTabInUrl(tabs[0].id);
  }
}, [tabs, isDashboardNavigation, userClickedTab]);
```

---

## 17. Verwendungsbeispiele

### Standard-Verwendung
```jsx
<GrafanaDiagramme 
  objectId={269517140}
  className="w-full"
  dashboard="d-solo/eelav0ybil2wwd/ws-heatcare"
/>
```

### TempID-Objekt
```jsx
// Objekt mit TempID 
// Aktiviert automatisch:
// - TempID-spezifische Panel-Optionen
// - Vereinfachte URL-Generierung
// - Spezielle Temperatur-Tab-Konfiguration

<GrafanaDiagramme 
  objectId={123456789}  // Mit TempID in meter-Daten
/>
```

### Netzwächter-Modus
```jsx
// URL: /object-monitoring?objectID=207315076&typ=netzwaechter
// Aktiviert automatisch:
// - Netzwächter-Spezial-Layout (2x3 Grid)
// - Overview + Main Panel oben
// - 3 Histogram-Panels unten
// - Dynamische Panel-Auswahl für Main-Panel

<GrafanaDiagramme 
  objectId={207315076}
/>
```

---

## 18. Dashboard-Tab-Generierung (objects.report & setting.defaultAuswertung)

### **Zentrale Grafana-Integration für "Dashboards" Tab**

Die **Dashboard-Tab-Generierung** in der `GrafanaDashboard.tsx` verwendet ein **Prioritätssystem** zur automatischen Erstellung von Grafana-Tabs basierend auf verfügbaren Datenquellen:

#### **Prioritätssystem für Dashboard-Generierung**

| **Priorität** | **Datenquelle** | **Verwendung** | **Fallback** |
|---------------|-----------------|----------------|--------------|
| **1 (Höchste)** | `objects.report` | Report-basierte Auswertung | - |
| **2 (Fallback)** | `setting.defaultAuswertung` | Standard-Auswertung wenn kein Report | Meter-basierte Tabs |

#### **Report-basierte Auswertung (Priorität 1)**

```typescript
// Report-basierte Auswertung in GrafanaLogic.tsx (Zeile 363-372)
if (dashboardType === "auswertung" && hasValidReport) {
  if (Array.isArray(object.report)) {
    return this.generateReportTabs(object.report);
  } else if (typeof object.report === "object") {
    console.log('🏗️ Dashboard type "auswertung": Using report object for tabs');
    // Handle single report object
    return this.generateReportTabs([object.report]);
  }
}
```

**Verwendung:** Wenn `objects.report` Daten verfügbar sind, werden diese für die Tab-Generierung verwendet.

#### **DefaultAuswertung Fallback (Priorität 2)**

```typescript
// DefaultAuswertung Fallback in GrafanaLogic.tsx (Zeile 374-408)
if (dashboardType === "auswertung" && !hasValidReport) {
  const isTypDiagramme = originalTypParam === "diagramme";
  const fallbackType = isTypDiagramme ? "defaultGrafana" : "defaultAuswertung";
  
  const defaultGrafanaSetting = grafanaSettings?.find(
    (setting: any) => (setting.keyName === fallbackType || setting.key_name === fallbackType) && setting.category === "grafana"
  );
  
  if (defaultGrafanaSetting?.value) {
    try {
      const defaultConfig = typeof defaultGrafanaSetting.value === 'string' 
        ? JSON.parse(defaultGrafanaSetting.value) 
        : defaultGrafanaSetting.value;
      
      const defaultTabs = this.generateDefaultAuswertungTabs(defaultConfig);
      console.log('🔍 [DEFAULT] Generated default tabs:', defaultTabs.length);
      return defaultTabs;
    } catch (error) {
      console.warn(`⚠️ Error parsing ${fallbackType} setting:`, error);
    }
  }
}
```

**Verwendung:** Wenn keine `objects.report` Daten vorhanden sind, wird `setting.defaultAuswertung` als Fallback verwendet.

#### **Zentrale Tab-Generierung in GrafanaDashboard.tsx**

```typescript
// Hauptfunktion in GrafanaDashboard.tsx (Zeile 1470-1485)
if (dashboardType === "auswertung" || dashboardType === "eigenes-board") {
  console.log("🔧 [GRAFANA-TABS] Using GrafanaLogic for dashboard type:", dashboardType);
  
  const grafanaLogicTabs = GrafanaLogic.generateTabs(
    object,
    dashboardType,
    grafanaSettings || [],
    typFromUrl || undefined
  );
  
  console.log("🔧 [GRAFANA-TABS] GrafanaLogic returned tabs:", grafanaLogicTabs.length);
  
  if (grafanaLogicTabs.length > 0) {
    generatedTabs = grafanaLogicTabs;
  }
}
```

#### **Datenquellen-Validierung**

```typescript
// Validierung in GrafanaLogic.tsx (Zeile 349-355)
const hasValidPortdata = this.hasValidPortdata(object.portdata);
const hasValidReport = this.hasValidReport(object.report);

console.log("🔍 Data validation:", {
  portdata: { hasValidPortdata },
  report: { hasValidReport },
});
```

#### **Fallback-Hierarchie**

1. **objects.report** → `generateReportTabs(object.report)`
2. **setting.defaultAuswertung** → `generateDefaultAuswertungTabs(defaultConfig)`
3. **Meter-basierte Fallback** → `meter-based tab generation`

#### **Praktische Verwendung**

**Dashboard-Type "auswertung":**
- Verwendet `objects.report` wenn verfügbar
- Falls nicht verfügbar: `setting.defaultAuswertung` Fallback
- Letzte Option: Automatische Meter-basierte Tab-Generierung

**Dashboard-Type "eigenes-board":**
- Verwendet `objects.portdata` für eigene Dashboard-Konfigurationen
- Falls nicht verfügbar: Fallback zu Standard-Methoden

#### **Console-Logging für Debugging**

```typescript
console.log('🏗️ Dashboard type "auswertung": Using report object for tabs');
console.log('🔧 [GRAFANA-TABS] Using GrafanaLogic for dashboard type:', dashboardType);
console.log('🔍 [DEFAULT] Generated default tabs:', defaultTabs.length);
```

---

## 19. Troubleshooting & Häufige Probleme

### Console-Logging zur Fehlerdiagnose

1. **TempID nicht erkannt:**
   ```
   🔧 [TEMP-ID] Checking TempID: undefined Match: false
   🔧 [TEMP-ID] Available meter keys: ["Z20541", "Z20141"]
   ```
   → Prüfen ob `meter.TempID` in Objekt-Daten vorhanden

2. **TempID-Logik nicht ausgelöst:**
   ```
   🔧 [TEMP-ID] TempID detected: undefined Match: false
   ```
   → Prüfen ob TempID in den Meter-Daten vorhanden ist

3. **Netzwächter-Mode nicht aktiv:**
   ```
   🔧 [NETZWÄCHTER-MODE] Netzwächter mode detected!
   ⚠️ [NETZWÄCHTER-MODE] No settings found, using defaults
   ```
   → Settings-Abfrage für `key_name = 'netzwaechter'` prüfen

### Häufige Ursachen
- **Missing Settings:** `defaultGrafana` oder `netzwaechter` Settings nicht vorhanden
- **Meter-Daten-Format:** Meter-IDs als String vs. Object-Format  
- **Panel-ID-Konflikte:** Nicht verfügbare Panel-IDs in Grafana-Dashboard
- **URL-Parameter-Fehler:** Unbekannte `typ` oder `tap` Parameter-Werte


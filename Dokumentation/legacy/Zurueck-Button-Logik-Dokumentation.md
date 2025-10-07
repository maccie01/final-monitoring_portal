# Zurück-Button-Logik und iframe-Optimierung

## Übersicht

Diese Dokumentation beschreibt die Logik für die Anzeige des "Zurück"-Buttons und die Optimierung der iframe-Ladezeiten im Grafana-Dashboard-System.

## Zurück-Button-Logik

### Funktionsweise

Der "Zurück"-Button wird **nur dann angezeigt**, wenn der URL-Parameter `&from=maps` vorhanden ist.

### Code-Implementation

```typescript
// GrafanaDashboard.tsx - Zeile ~800
const fromParam = urlParams.get("from");

// Show back button only when from=maps
setShowBackButton(fromParam === "maps");
```

### URL-Beispiele

#### ✅ Button wird angezeigt:
```
/grafana-dashboards?objectID=274609033&typ=KI-Auswertung&from=maps
```

#### ❌ Button wird NICHT angezeigt:
```
/grafana-dashboards?objectID=274609033&typ=KI-Auswertung
/grafana-dashboards?objectID=274609033&typ=KI-Auswertung&from=dashboard
```

### Verhalten des Zurück-Buttons

Wenn geklickt, navigiert der Button zurück zur `/maps` Seite:

```typescript
onClick={() => {
  console.log("🔙 Zurück button clicked");
  const urlParams = new URLSearchParams(window.location.search);
  const fromParam = urlParams.get('from');
  
  if (fromParam === "maps") {
    router.navigate("/maps");
  } else {
    window.history.back();
  }
}}
```

## iframe-Optimierung (Maps Modal)

### Problem vorher

- Bei jedem Re-render wurden neue Timestamps generiert
- iframes luden mehrfach die gleichen Inhalte
- Schlechte Performance bei Maps-Modal mit Netz-Temperaturen

### Lösung implementiert

```typescript
// SystemSchemaView.tsx
const stableTimestamp = useRef<number>(Date.now());

// Stable timestamp prevents iframe reloads
const grafanaUrl = `...&t=${stableTimestamp.current}`;

// useMemo prevents unnecessary re-generations
const systemComponents = useMemo(() => {
  // Component generation logic
}, [meterData, objectId, grafanaConfig]);
```

### Verbesserungen

1. **Stabiler Timestamp pro Session**: Verhindert unnötige iframe-Reloads
2. **useMemo für Komponenten**: Reduziert Re-Berechnungen
3. **Controlled iframe Loading**: iframes laden nur einmal

## URL-Parameter-System

### Unterstützte Parameter

| Parameter | Funktion | Beispiel |
|-----------|----------|----------|
| `objectID` | Wählt das Objekt aus | `?objectID=274609033` |
| `typ` | Bestimmt den Tab | `?typ=KI-Auswertung` |
| `from` | Bestimmt Zurück-Verhalten | `&from=maps` |

### Tab-Mapping

```typescript
const typToTabMap: Record<string, string> = {
  "auswertung": "auswertung",      // Dashboards Tab
  "KI-Auswertung": "KI-analyse",   // KI-Auswertung Tab
  "anlage": "anlage",              // Anlage Tab
  "objektinfo": "objektinfo",      // Objektinfo Tab
  "diagramme": "diagramme",        // Diagramme Tab
  "bewertung": "bewertung"         // Bewertung Tab
};
```

## Performance-Optimierungen

### iframe Cache-System

```typescript
// Controlled iframe loading - only load when iframe is empty
useEffect(() => {
  systemComponents.forEach((component) => {
    const iframe = iframeRefs.current.get(component.id);
    if (iframe && !iframe.src) { // Load only if not already loaded
      iframe.src = component.grafanaUrl;
    }
  });
}, [systemComponents]);
```

### Vorteile

1. **Einmaliges Laden**: iframes laden nur beim ersten Mal
2. **Stabile URLs**: Keine URL-Änderungen durch Timestamps
3. **Bessere UX**: Schnellere Modal-Öffnung ohne Flackern

## Debugging

### Console-Logs

```typescript
console.log("🔙 Zurück button clicked");
console.log("🔧 Using stable timestamp:", stableTimestamp.current);
```

### Wichtige Log-Nachrichten

- `🔙 Zurück button clicked` - Button wurde gedrückt
- `🔧 [GRAFANA] iframe key updated` - iframe-Update bei Objekt-Wechsel

## Wartung und Updates

### Bei Änderungen beachten:

1. **URL-Parameter**: Neue Parameter im URL-Parsing berücksichtigen
2. **Tab-Mapping**: Neue Tabs in `typToTabMap` eintragen
3. **Button-Logik**: `from`-Parameter für neue Navigations-Quellen erweitern

### Beispiel für neue Quelle:

```typescript
// Für Navigation von /efficiency-strategy
setShowBackButton(fromParam === "maps" || fromParam === "efficiency");
```

## Technische Details

### Abhängigkeiten

- React Hooks: `useState`, `useEffect`, `useMemo`, `useRef`
- Router: Wouter (`useLocation`)
- URL-Parameter: `URLSearchParams`

### Dateien betroffen

- `client/src/pages/GrafanaDashboard.tsx` - Haupt-Button-Logik
- `client/src/components/SystemSchemaView.tsx` - iframe-Optimierung
- `client/src/pages/Maps.tsx` - Navigation zur Dashboard-Seite
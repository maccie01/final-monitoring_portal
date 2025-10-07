# Tab Layout System - Wiederverwendbare Komponenten

## Überblick

Das Tab Layout System bietet konsistente, wiederverwendbare Komponenten für alle Grafana Dashboard Interfaces in der Heizungsanlagen-Management-Anwendung.

## Komponenten

### 1. TabNavigation
Einheitliche Tab-Navigation mit Zeitbereich-Auswahl.

```tsx
import { TabNavigation, STANDARD_TIME_RANGES } from '@/components/TabLayout';

<TabNavigation
  tabs={tabs}
  activeTabIndex={activeTab}
  onTabChange={setActiveTab}
  timeRanges={STANDARD_TIME_RANGES}
  selectedTimeRange={timeRange}
  onTimeRangeChange={setTimeRange}
/>
```

### 2. CounterSelectionGroup
Graue Container mit Counter-Auswahl-Buttons (Netz 1, Kessel 1, etc.).

```tsx
import { CounterSelectionGroup } from '@/components/TabLayout';

<CounterSelectionGroup 
  selections={counterSelections}
/>
```

### 3. GrafanaIframeContainer
Einzelne Grafana-Panel-Einbindung.

```tsx
import { GrafanaIframeContainer } from '@/components/TabLayout';

<GrafanaIframeContainer
  src={grafanaUrl}
  title="Dashboard Title"
  height="400px"
/>
```

### 4. GrafanaSplitLayout
Zwei Grafana-Panels nebeneinander (z.B. 180px + Flex).

```tsx
import { GrafanaSplitLayout } from '@/components/TabLayout';

<GrafanaSplitLayout
  leftSrc={leftPanelUrl}
  rightSrc={rightPanelUrl}
  leftTitle="Links Panel"
  rightTitle="Rechts Panel"
  leftWidth="180px"
  height="250px"
/>
```

## CSS-Klassen

### Tab Navigation
- `.tab-navigation-container` - Container für gesamte Tab-Navigation
- `.tab-button-active` - Aktiver Tab (grauer Hintergrund)
- `.tab-button-inactive` - Inaktiver Tab (weißer Hintergrund)

### Counter Selection
- `.counter-selection-container` - Grauer Container für Counter-Buttons
- `.counter-button-active` - Ausgewählter Counter (blau)
- `.counter-button-inactive` - Nicht ausgewählter Counter (weiß)

### Grafana iframes
- `.grafana-iframe-container` - Einzelner iframe-Container
- `.grafana-split-container` - Split-Layout für zwei Panels
- `.grafana-panel-left` / `.grafana-panel-right` - Linke/rechte Panel-Bereiche

## Interfaces

### TabLayoutItem
```tsx
interface TabLayoutItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  isActive?: boolean;
}
```

### CounterSelection
```tsx
interface CounterSelection {
  id: string;
  label: string;
  title?: string;
  options: Array<{
    id: string;
    label: string;
  }>;
  selectedValue?: string;
  onSelect: (value: string) => void;
}
```

### TimeRange
```tsx
interface TimeRange {
  value: string;
  label: string;
}
```

## Verwendung in bestehenden Komponenten

### Migration von GrafanaDashboard.tsx

**Vorher:**
```tsx
<div className="flex items-center justify-between border-b border-gray-200">
  <div className="flex space-x-0">
    {tabs.map((tab, index) => (
      <Button className={`${activeTab === index ? "bg-gray-100" : "bg-white"}`}>
        {tab.label}
      </Button>
    ))}
  </div>
</div>
```

**Nachher:**
```tsx
<TabNavigation
  tabs={tabs}
  activeTabIndex={activeTab}
  onTabChange={setActiveTab}
  timeRanges={STANDARD_TIME_RANGES}
  selectedTimeRange={timeRange}
  onTimeRangeChange={setTimeRange}
/>
```

### Migration von Counter-Buttons

**Vorher:**
```tsx
<div className="flex flex-wrap gap-2 mb-4">
  {panel.auswahl.map((auswahl) => (
    <Button className={selectedCounter === auswahl.id ? 'bg-blue-600' : 'bg-white'}>
      {auswahl.idlabel}
    </Button>
  ))}
</div>
```

**Nachher:**
```tsx
<CounterSelectionGroup 
  selections={[{
    id: panel.id,
    label: panel.label,
    options: panel.auswahl.map(a => ({ id: a.id, label: a.idlabel })),
    selectedValue: selectedCounter,
    onSelect: (value) => setSelectedCounters(prev => ({ ...prev, [panel.id]: value }))
  }]}
/>
```

## Standard Time Ranges

```tsx
export const STANDARD_TIME_RANGES: TimeRange[] = [
  { value: "now-1h", label: "Letzte Stunde" },
  { value: "now-6h", label: "Letzte 6 Stunden" },
  { value: "now-12h", label: "Letzte 12 Stunden" },
  { value: "now-24h", label: "Letzte 24 Stunden" },
  { value: "now-3d", label: "Letzte 3 Tage" },
  { value: "now-7d", label: "Letzte 7 Tage" },
  { value: "now-30d", label: "Letzte 30 Tage" },
];
```

## Responsive Design

Das System beinhaltet automatische responsive Anpassungen:
- Mobile: Tabs wickeln um, Counter-Buttons werden full-width
- Desktop: Normale horizontale Anordnung

## Vorteile

1. **Konsistenz** - Einheitliches Design in allen Grafana-Views
2. **Wartbarkeit** - Zentrale Stelle für Tab-Layout-Änderungen  
3. **Wiederverwendbarkeit** - Drop-in Replacement für bestehende Tab-Implementierungen
4. **Typsicherheit** - TypeScript Interfaces für alle Komponenten
5. **Performance** - Optimierte CSS-Klassen mit Tailwind
6. **Accessibility** - Standardkonforme Button- und Navigation-Implementierung

## Integration

Das System ist automatisch verfügbar durch:
```css
/* Import Tab Layout System */
@import './components/TabLayout.css';
```

Alle Komponenten können direkt importiert werden:
```tsx
import { TabNavigation, CounterSelectionGroup, ... } from '@/components/TabLayout';
```
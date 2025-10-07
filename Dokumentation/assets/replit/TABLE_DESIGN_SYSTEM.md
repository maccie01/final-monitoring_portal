# Table Design System

## Übersicht

Das Table Design System definiert einheitliche Styling-Standards für alle Tabellen in der Heizungsmanagement-Anwendung. Es gewährleistet konsistente Benutzerfreundlichkeit, responsive Verhalten und optimale Lesbarkeit.

## Design-Prinzipien

### Visuelle Hierarchie
- **Alternierend gefärbte Zeilen**: Weiß (#ffffff) und hellgrau (#f9fafb) für bessere Zeilenunterscheidung
- **Hover-Effekte**: Blaue Hintergrundfarbe (#dbeafe) beim Überfahren von Zeilen
- **Kompakte Zeilenhöhe**: 40px für optimale Platzbelegung
- **Konsistente Typografie**: Standard-Schriftarten mit angemessenen Größen

### Responsive Verhalten
- **Mobile-First**: Optimiert für kleine Bildschirme
- **Adaptive Spaltenbreiten**: Flexibles Layout basierend auf Inhaltstyp
- **Scrolling**: Horizontales und vertikales Scrolling bei Bedarf
- **Touch-Optimierung**: Größere Klickbereiche für mobile Geräte

## Farbschema

### Grundfarben
```css
/* Tabellenheader */
background: #f3f4f6 (grau-100)
color: #374151 (grau-700)

/* Zeilen - alternierend */
background: #ffffff (weiß)
background: #f9fafb (grau-50)

/* Hover-Zustand */
background: #dbeafe (blau-100)

/* Rahmen */
border: #e5e7eb (grau-200)
```

### Spezielle Tabellen-Typen

#### Temperatur-Analyse Tabellen
```css
/* Kritische Anlagen */
background: #fef2f2 (rot-50)
border: #fecaca (rot-200)
header: #fee2e2 (rot-100)

/* Warnung Anlagen */
background: #fff7ed (orange-50)
border: #fed7aa (orange-200)
header: #ffedd5 (orange-100)
```

## StandardTable Komponente

### Verwendung
```typescript
import { StandardTable } from '@/components/StandardTable';

const columns = [
  { header: 'Name', key: 'name', width: '30%' },
  { header: 'Status', key: 'status', width: '20%' },
  { header: 'Datum', key: 'date', width: '25%' },
  { header: 'Aktionen', key: 'actions', width: '25%' }
];

<StandardTable 
  data={tableData} 
  columns={columns}
  maxHeight="400px"
  showPagination={true}
/>
```

### Eigenschaften
- **data**: Array von Objekten mit Tabellendaten
- **columns**: Spaltendefinitionen mit Header, Key und Breite
- **maxHeight**: Maximale Tabellenhöhe mit Scrolling
- **showPagination**: Optional - Paginierung aktivieren
- **responsive**: Automatisches responsive Verhalten

## Mobile Optimierungen

### Responsive Breakpoints
```css
/* Mobile (< 768px) */
@media (max-width: 767px) {
  .table-container {
    overflow-x: auto;
  }
  
  .table-cell {
    padding: 8px 4px;
    font-size: 12px;
  }
}

/* Tablet (768px - 1024px) */
@media (min-width: 768px) and (max-width: 1024px) {
  .table-cell {
    padding: 10px 8px;
    font-size: 13px;
  }
}

/* Desktop (> 1024px) */
@media (min-width: 1025px) {
  .table-cell {
    padding: 12px 16px;
    font-size: 14px;
  }
}
```

### Split-View Mobile Layout
```css
/* Desktop: Nebeneinander */
@media (min-width: 1024px) {
  .split-view {
    display: flex;
    flex-direction: row;
    gap: 16px;
  }
  
  .left-panel { flex: 1; }
  .right-panel { flex: 1; }
}

/* Mobile: Untereinander */
@media (max-width: 1023px) {
  .split-view {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .left-panel,
  .right-panel { 
    width: 100%; 
  }
}
```

## Temperatur-Analyse Tabellen

### CSS-Klassen
```css
.temp-analysis-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #f0ad4e;
  border-radius: 4px;
}

.temp-analysis-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
  background: #fff3cd;
}

/* Spaltenbreiten */
.temp-analysis-table th:nth-child(1),
.temp-analysis-table td:nth-child(1) {
  width: 25%; /* OBJEKT */
}

.temp-analysis-table th:nth-child(2),
.temp-analysis-table td:nth-child(2) {
  width: calc(100% - 25% - 120px); /* TEMPERATUR-KI-ANALYSE */
}

.temp-analysis-table th:nth-child(3),
.temp-analysis-table td:nth-child(3) {
  width: 120px; /* UPDATE-ZEIT (fest) */
  min-width: 120px;
  max-width: 120px;
}
```

### Scrollbar-Styling
```css
.temp-analysis-container::-webkit-scrollbar {
  width: 8px;
}

.temp-analysis-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.temp-analysis-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.temp-analysis-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
```

## Navigation Sidebar Mobile

### Kollapsible Navigation
```typescript
const [sidebarOpen, setSidebarOpen] = useState(false);

useEffect(() => {
  // Mobile: Sidebar standardmäßig geschlossen
  if (window.innerWidth < 768) {
    setSidebarOpen(false);
  }
}, []);
```

### Mobile CSS
```css
/* Mobile Navigation */
@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    left: -100%;
    top: 0;
    width: 280px;
    height: 100vh;
    background: #1e293b;
    transition: left 0.3s ease;
    z-index: 1000;
  }
  
  .sidebar.open {
    left: 0;
  }
  
  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
  
  .main-content {
    margin-left: 0;
    padding: 16px;
  }
}
```

## Netzwächter als Start-Seite

### Route-Konfiguration
```typescript
// In App.tsx
import { useEffect } from 'react';
import { useLocation } from 'wouter';

function App() {
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Mobile: Netzwächter als Startseite
    if (window.innerWidth < 768 && location === '/') {
      setLocation('/network-monitor');
    }
  }, [location, setLocation]);
}
```

## Best Practices

### Performance
- **Virtualisierung**: Für große Datensätze (>100 Zeilen)
- **Lazy Loading**: Daten nachladen bei Bedarf
- **Memoization**: React.memo für Tabellenzeilen
- **Batch Updates**: Mehrere Änderungen zusammenfassen

### Accessibility
- **ARIA Labels**: Für Screenreader-Unterstützung
- **Keyboard Navigation**: Tab-Navigation durch Tabelle
- **Focus Management**: Sichtbare Focus-Indikatoren
- **Alt-Texte**: Für Icon-basierte Aktionen

### Testing
- **Unit Tests**: Komponenten-Tests mit Jest
- **Integration Tests**: Tabellen-Interaktionen
- **Visual Regression**: Screenshot-Vergleiche
- **Performance Tests**: Rendering-Geschwindigkeit

## Technische Implementation

### Dateien
- `client/src/components/StandardTable.tsx` - Basis-Tabellenkomponente
- `client/src/components/TempAnalysisTable.css` - Temperatur-Analyse Styles
- `client/src/styles/tables.css` - Globale Tabellen-Styles
- `client/src/hooks/useTablePagination.ts` - Paginierung-Hook
- `client/src/hooks/useTableSort.ts` - Sortierung-Hook

### Dependencies
- **React**: Basis-Framework
- **Tailwind CSS**: Utility-first CSS
- **Radix UI**: Accessible UI Primitives
- **React Hook Form**: Formular-Validierung
- **TanStack Query**: Daten-Fetching

## Roadmap

### Kurzfristig (1-2 Wochen)
- [ ] StandardTable Komponente vollständig implementieren
- [ ] Mobile Navigation Sidebar fertigstellen
- [ ] Split-View responsive Layout
- [ ] Touch-Gesten für mobile Interaktion

### Mittelfristig (1-2 Monate)
- [ ] Tabellen-Virtualisierung für Performance
- [ ] Advanced Filtering und Sorting
- [ ] Export-Funktionen (CSV, PDF)
- [ ] Bulk-Actions für Zeilen-Auswahl

### Langfristig (3-6 Monate)
- [ ] Real-time Updates via WebSockets
- [ ] Drag & Drop für Spalten-Anordnung
- [ ] Benutzerdefinierte Spalten-Konfiguration
- [ ] Advanced Analytics und Reporting
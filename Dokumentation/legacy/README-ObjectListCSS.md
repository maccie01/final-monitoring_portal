# Objektlisten CSS-Vorlage

## Übersicht

Diese Vorlage bietet ein konsistentes Design für alle Objektlisten in der Heizungsanlagen-Management-Anwendung. Sie basiert auf dem bewährten Design aus `ObjectManagement.tsx` und kann systemweit wiederverwendet werden.

## Dateien

- `object-list.css` - CSS-Klassen für Objektlisten-Styling
- `ObjectListTemplate.tsx` - React-Komponente als wiederverwendbare Vorlage

## Design-Spezifikationen

### Farbschema
- **Tabellenkopf**: `bg-blue-50` (rgb(239 246 255))
- **Kopftext**: `text-blue-900` (rgb(30 58 138))
- **Gerade Zeilen**: `rgba(255, 255, 255, 0.65)` - 65% Weißtransparenz
- **Ungerade Zeilen**: `rgba(255, 255, 255, 0.8)` - 80% Weißtransparenz
- **Hover-Effekt**: `rgb(147 197 253)` - Tailwind blue-300
- **Markierte Zeile**: `bg-blue-100` (rgb(219 234 254))
- **Markierungsrand**: 6px blauer Rand rechts (`border-r-blue-500`)

### Layout
- **Spaltenaufteilung**: 60% Name, 40% Stadt
- **Textgrößen**: 14px primär, 12px sekundär
- **Abstände**: 5px vertikal, 10px horizontal
- **Transparenter Hintergrund**: Vollständige Integration in Seitenlayout

### Interaktion
- **Hover-Effekte**: JavaScript-gesteuert für inline-CSS-Kompatibilität
- **Markierung**: 6px blauer Rand rechts bei ausgewählten Objekten
- **Responsive**: Angepasste Abstände auf mobilen Geräten

## Verwendung

### CSS-Klassen

```css
/* Basis-Container */
.object-list-container

/* Kopfbereich */
.object-list-header
.object-list-header-row
.object-list-header-cell

/* Zeilen */
.object-list-row
.object-list-row--even
.object-list-row--odd
.object-list-row--selected

/* Zelleninhalte */
.object-list-cell
.object-list-text--primary
.object-list-text--secondary
```

### React-Komponente

```tsx
import { ObjectListTemplate } from '@/components/ObjectListTemplate';

<ObjectListTemplate
  objects={objects}
  selectedObject={selectedObject}
  onObjectSelect={setSelectedObject}
  isLoading={isLoading}
  emptyMessage="Keine Objekte gefunden"
  emptySubMessage="Keine Daten verfügbar"
/>
```

## Implementierung in bestehende Komponenten

1. **Import der CSS-Datei**:
   ```tsx
   import '../styles/object-list.css';
   ```

2. **Verwendung der CSS-Klassen** anstelle von Tailwind-Klassen

3. **Anpassung der Hover-Logik** für JavaScript-gesteuerte Effekte

## Konsistenz

Diese Vorlage gewährleistet:
- ✅ Einheitliches Design across alle Objektlisten
- ✅ Konsistente Farbgebung und Abstände
- ✅ Responsive Verhalten auf allen Geräten
- ✅ Barrierefreiheit durch semantische Struktur
- ✅ Wiederverwendbarkeit ohne Code-Duplikation

## Anpassungen

Für projektspezifische Anpassungen:
1. Farbwerte in `object-list.css` ändern
2. Spaltenbreiten über CSS-Variablen anpassen
3. Responsive Breakpoints erweitern
4. Neue Zustände in `ObjectListTemplate.tsx` hinzufügen

## Browser-Kompatibilität

- ✅ Chrome/Edge (moderne Versionen)
- ✅ Firefox (moderne Versionen)
- ✅ Safari (moderne Versionen)
- ✅ Mobile Browser (iOS/Android)
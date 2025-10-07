# KI-Energie-Analyse Dokumentation

## Übersicht
Die KI-Energie-Analyse ist ein Bewertungssystem für Heizungsanlagen, das Anlagenverluste berechnet und bewertet. Das System analysiert die Energiebilanz zwischen Erzeugern und Verbrauchern.

## Energiebilanz-Berechnung

### Formel
```
Anlagenverlust = Verbraucher - Erzeuger
Verluste (%) = |Anlagenverlust| / Erzeuger × 100
```

### Komponenten-Klassifizierung
- **Erzeuger**: Kessel (Z2014x), Wärmepumpen (Z2024x)
- **Verbraucher**: Netz-Komponenten (Z2054x)

## Bewertungssystem

### Drei-Stufen-Bewertung

| Verluste (%) | Farbe | Bewertung | Beschreibung |
|--------------|-------|-----------|--------------|
| < 10% | 🟢 Grün | (kaum Verluste) | Optimaler Zustand |
| 10% - 20% | 🟠 Orange | (Anlage prüfen! Optimierung empfohlen) | Verbesserungspotential |
| > 20% | 🔴 Rot | (zu hoch! Optimierung dringend) | Kritischer Zustand |

### CSS-Klassen
```css
.text-green-800  /* < 10% */
.text-orange-600 /* 10-20% */
.text-red-800    /* > 20% */
```

## Implementierung

### Berechnung (KI_energy_jahr.tsx)
```javascript
// Anlagenverlust: Verbraucher - Erzeuger = Verluste (negative Werte sind normal)
const verluste = netzVerbrauch - gesamtErzeugung;
const verlusteAbs = Math.abs(verluste);
const verlusteInProzent = gesamtErzeugung > 0 ? (verlusteAbs / gesamtErzeugung * 100) : 0;

// Erweiterte Bewertungslogik mit drei Stufen
let farbKlasse, bewertungsText;

if (verlusteInProzent < 10) {
  farbKlasse = 'text-green-800';
  bewertungsText = '(kaum Verluste)';
} else if (verlusteInProzent >= 10 && verlusteInProzent <= 20) {
  farbKlasse = 'text-orange-600';
  bewertungsText = '(Anlage prüfen! Optimierung empfohlen)';
} else {
  farbKlasse = 'text-red-800';
  bewertungsText = '(zu hoch! Optimierung dringend)';
}
```

### Anzeige-Format
```
Anlagenverlust: -7.906 kWh (2.2%)
                (kaum Verluste)
```

## Beispiel-Bewertungen

### Optimale Anlage (< 10%)
```
Anlagenverlust: -7.906 kWh (2.2%)
                (kaum Verluste)
Farbe: Grün
```

### Verbesserungsbedarf (10-20%)
```
Anlagenverlust: -45.123 kWh (15.5%)
                (Anlage prüfen! Optimierung empfohlen)
Farbe: Orange
```

### Kritischer Zustand (> 20%)
```
Anlagenverlust: -89.456 kWh (25.8%)
                (zu hoch! Optimierung dringend)
Farbe: Rot
```

## Datenquellen
- **Monatsdaten**: view_mon_comp Tabelle
- **Zähler-Mapping**: objects.meter JSONB-Feld
- **Berechnung**: Math.abs() auf alle diffEn-Werte für konsistente Ergebnisse

## API-Endpunkte
- `/api/monthly-consumption/{objectId}` - Monatliche Verbrauchsdaten
- `/api/energy-data-meters/{objectId}` - Zähler-Informationen

## Performance-Optimierung

### API-basierte Berechnung
Die Energiebilanz wird erst beim Klick auf "Erstelle Zusammenfassung" über eine dedizierte API-Route berechnet:

```
POST /api/energy-balance/{objectId}
```

### Vorteile
- ✅ **Reduzierte Ladezeiten**: Keine automatische Berechnung beim Seitenaufruf
- ✅ **On-Demand Berechnung**: Nur wenn benötigt
- ✅ **Loading States**: Benutzerfreundliche Rückmeldung
- ✅ **Server-seitige Validierung**: Konsistente Berechnungen

### UI-Verhalten
1. **Button-Klick**: "Erstelle Zusammenfassung" 
2. **Loading State**: "KI-Analyse ... durchforste Ihre Daten" mit animiertem Brain-Icon
3. **Ergebnis**: Energetische Zusammenfassung + Energiebilanz mit Zeitbereich

## Status
✅ Implementiert: Drei-Stufen-Bewertung  
✅ Implementiert: Farbkodierung  
✅ Implementiert: Bewertungstexte  
✅ Implementiert: Konsistente Bilanzberechnung  
✅ Implementiert: Performance-Optimierung (API-basiert)  
✅ Implementiert: Loading States und UX-Verbesserungen  

**Letzte Aktualisierung**: 16. August 2025
**Version**: 2.0
# Heatcare Development Plan - Fehlende Funktionen für Effizienzmanagement

## 1. Projekt-Analyse - Aktueller Status

### Vorhandene Funktionen
- ✅ KPI Dashboard mit Basis-Metriken
- ✅ Netzwächter mit Temperaturanalyse
- ✅ Objektverwaltung mit JSONB-Datenstrukturen
- ✅ Grundlegende Energieklassen (A-D)
- ✅ Grafana-Integration für Echtzeitdaten
- ✅ Threshold-basierte Alarmsysteme

### Fehlende Kernfunktionen

## 2. Logbuch-System für Handwerker & Verwalter

### 2.1 Anlagen-Logbuch
**Zweck**: Dokumentation aller Wartungen, Reparaturen und Änderungen

**Datenmodell**:
```sql
CREATE TABLE logbook_entries (
  id SERIAL PRIMARY KEY,
  object_id INTEGER REFERENCES objects(id),
  entry_type VARCHAR(50), -- 'wartung', 'störung', 'umbau', 'inspektion'
  category VARCHAR(50), -- 'heizung', 'sanitär', 'elektro', 'sonstiges'
  priority VARCHAR(20), -- 'niedrig', 'mittel', 'hoch', 'kritisch'
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(50), -- 'offen', 'in_bearbeitung', 'erledigt', 'verschoben'
  
  -- Handwerker/Techniker Info
  technician_name VARCHAR(100),
  technician_company VARCHAR(100),
  technician_contact VARCHAR(100),
  
  -- Zeiterfassung
  scheduled_date DATE,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  work_hours DECIMAL(4,2),
  
  -- Kosten
  material_cost DECIMAL(10,2),
  labor_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  
  -- Dateien & Bilder
  attachments JSONB, -- [{filename, url, type, size}]
  
  -- Verknüpfungen
  related_alarm_id INTEGER,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ToDo-Liste für Handwerker
CREATE TABLE todo_tasks (
  id SERIAL PRIMARY KEY,
  object_id INTEGER REFERENCES objects(id),
  logbook_entry_id INTEGER REFERENCES logbook_entries(id),
  title VARCHAR(255),
  description TEXT,
  due_date DATE,
  priority VARCHAR(20),
  assigned_to VARCHAR(100),
  status VARCHAR(50) DEFAULT 'offen',
  completed_at TIMESTAMP,
  completed_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Logbuch-UI Komponenten
- Kalenderansicht für geplante Wartungen
- Listenansicht mit Filteroptionen
- Mobile App für Handwerker vor Ort
- Foto-Upload direkt vom Smartphone
- QR-Code Scanner für Anlagenidentifikation
- Offline-Synchronisation

## 3. Reporting & Berichtswesen

### 3.1 Effizienzreport
**Monatlicher/Jährlicher Effizienzreport mit**:
- Verbrauchsentwicklung (kWh, m³, Kosten)
- CO2-Bilanz und Emissionstrends
- Benchmarking gegen ähnliche Objekte
- Einsparpotenziale und Empfehlungen
- ROI-Berechnung für Modernisierungen

### 3.2 GEG 2024 Energieeffizienzklassen

**Erweiterte Energieklassen A++ bis H**:
```javascript
const GEG_2024_CLASSES = {
  'A++': { min: 0, max: 30, color: '#0F9D58', label: 'Passivhaus' },
  'A+':  { min: 30, max: 50, color: '#4CAF50', label: 'KfW 55' },
  'A':   { min: 50, max: 75, color: '#8BC34A', label: 'Sehr gut' },
  'B':   { min: 75, max: 100, color: '#CDDC39', label: 'Gut' },
  'C':   { min: 100, max: 130, color: '#FFEB3B', label: 'Durchschnitt' },
  'D':   { min: 130, max: 160, color: '#FFC107', label: 'Mäßig' },
  'E':   { min: 160, max: 200, color: '#FF9800', label: 'Schlecht' },
  'F':   { min: 200, max: 250, color: '#FF5722', label: 'Sehr schlecht' },
  'G':   { min: 250, max: 300, color: '#F44336', label: 'Mangelhaft' },
  'H':   { min: 300, max: 999, color: '#B71C1C', label: 'Ungenügend' }
};
```

**Berechnung Energieverbrauch kWh/m²/a**:
- Heizenergieverbrauch + Warmwasser
- Witterungsbereinigung nach DIN
- Flächenberechnung nach Wohnfläche
- Vergleich mit EnEV/GEG-Referenzwerten

### 3.3 Verwalter-Reports
1. **Monatsreport** (automatisch per E-Mail)
   - Objektübersicht mit Status
   - Kritische Ereignisse
   - Verbrauchszusammenfassung
   - Kostenentwicklung
   - Anstehende Wartungen

2. **Quartalsreport**
   - Effizienzvergleich zwischen Objekten
   - Trend-Analysen
   - Budget vs. Ist-Kosten
   - Handlungsempfehlungen

3. **Jahresbericht**
   - Vollständige Energiebilanz
   - CO2-Footprint
   - Investitionsplanung
   - Compliance-Status (GEG, ESG)

## 4. Benachrichtigungssystem

### 4.1 Sofort-Benachrichtigungen
```javascript
const ALERT_TRIGGERS = {
  temperature_critical: {
    condition: 'VL > 90°C oder RL < 20°C',
    channels: ['email', 'sms', 'push'],
    recipients: ['techniker', 'verwalter']
  },
  system_failure: {
    condition: 'Keine Daten > 2h',
    channels: ['email', 'sms'],
    recipients: ['techniker']
  },
  efficiency_drop: {
    condition: 'Effizienz < 60%',
    channels: ['email'],
    recipients: ['verwalter']
  }
};
```

### 4.2 Tagesberichte
- Zusammenfassung aller Ereignisse
- Priorisierte Handlungsempfehlungen
- Verbrauchsabweichungen > 20%
- Offene Wartungsaufgaben

### 4.3 Monatsberichte
- Vollständige Objektliste mit Status
- Effizienzklassen-Verteilung
- Top 10 Verbraucher
- Einsparungspotenziale

## 5. Verwalter-Dashboard

### 5.1 Übersichts-Dashboard
```typescript
interface VerwalterDashboard {
  // Portfolioübersicht
  totalObjects: number;
  totalArea: number; // m²
  averageEfficiencyClass: string;
  
  // Effizienzverteilung
  efficiencyDistribution: {
    class: string;
    count: number;
    percentage: number;
    totalConsumption: number;
    totalCost: number;
  }[];
  
  // Kritische Anlagen
  criticalSystems: {
    objectId: number;
    name: string;
    issue: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    lastUpdate: Date;
  }[];
  
  // Verbrauchstrends
  consumptionTrends: {
    period: string;
    heating: number;
    hotWater: number;
    electricity: number;
    totalCost: number;
    co2Emissions: number;
  }[];
}
```

### 5.2 Interaktive Features
- Drill-Down von Portfolio zu einzelnen Objekten
- Vergleichsansichten (Jahr/Vorjahr, Objekt/Durchschnitt)
- Export-Funktionen (PDF, Excel)
- Customizable Widgets
- Rollenbasierte Ansichten

## 6. Implementierungs-Roadmap

### Phase 1 - Q1 2025 (Basis-Features)
1. **Logbuch-System**
   - Datenbank-Schema
   - CRUD-API
   - Basis-UI

2. **GEG 2024 Energieklassen**
   - Erweiterte Klassifizierung A++ bis H
   - Verbrauchsberechnung kWh/m²/a
   - Integration in Objektverwaltung

### Phase 2 - Q2 2025 (Reporting)
1. **Report-Engine**
   - Template-System
   - PDF-Generation
   - E-Mail-Versand

2. **Benachrichtigungen**
   - Event-System
   - Multi-Channel-Delivery
   - Eskalationslogik

### Phase 3 - Q3 2025 (Advanced Features)
1. **Verwalter-Dashboard**
   - Portfolio-Ansichten
   - Benchmark-System
   - Prognose-Modelle

2. **Mobile Apps**
   - Handwerker-App
   - Verwalter-App
   - Push-Notifications

### Phase 4 - Q4 2025 (KI & Optimierung)
1. **KI-gestützte Analysen**
   - Anomalie-Erkennung
   - Verbrauchsprognosen
   - Optimierungsvorschläge

2. **Integration externe Systeme**
   - Abrechnungssysteme
   - Facility Management
   - Smart Building APIs

## 7. Technische Anforderungen

### Backend-Erweiterungen
- Report-Generator Service (Node.js + Puppeteer)
- Notification Service (Redis + Bull Queue)
- File Storage Service (S3-kompatibel)
- Scheduled Jobs (Cron + Node-Schedule)

### Frontend-Komponenten
- Logbuch-Modul (React)
- Report-Viewer (PDF.js)
- Dashboard-Builder (Recharts + D3.js)
- Notification-Center

### Datenbank-Erweiterungen
- Historisierung für Auditing
- Partitionierung für Performance
- Materialized Views für Reports
- Full-Text-Search für Logbuch

## 8. Erwarteter Nutzen

### Für Verwalter
- 📊 Vollständige Transparenz über Portfolio
- 💰 Kostenoptimierung durch Früherkennung
- 📈 Nachweisbare Effizienzsteigerungen
- 📋 Compliance mit GEG 2024

### Für Handwerker
- 📱 Mobile Dokumentation vor Ort
- 🔧 Strukturierte Arbeitsabläufe
- 📷 Foto-Dokumentation
- ⏰ Zeiterfassung

### Für Eigentümer
- 💡 Transparente Betriebskosten
- 🌱 CO2-Reduktion nachweisbar
- 🏆 Wertsteigerung der Immobilie
- 📉 Reduzierte Energiekosten

## 9. Zusammenfassung

Die vorgeschlagenen Erweiterungen transformieren Heatcare von einem reinen Monitoring-System zu einer umfassenden Facility-Management-Plattform mit:

1. **Lückenlose Dokumentation** durch Logbuch-System
2. **Proaktives Management** durch intelligente Benachrichtigungen
3. **Datengetriebene Entscheidungen** durch umfassende Reports
4. **GEG 2024 Compliance** durch erweiterte Energieklassen
5. **Mobile Workforce** durch Handwerker-Apps
6. **Portfolio-Optimierung** durch Verwalter-Dashboard

Diese Funktionen positionieren Heatcare als führende Lösung für nachhaltiges und effizientes Heizungsanlagen-Management in der Wohnungswirtschaft.
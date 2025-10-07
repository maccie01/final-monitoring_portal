# Technisches Datenblatt - Logger-System
## Heizungsanlagen-Management-Anwendung

---

## **System-Übersicht**

**Anwendung:** Heizungsanlagen-Management-System  
**Version:** 1.0.0  
**Datum:** 01. September 2025  
**Logger-Framework:** Native Console-Logging (Node.js/Browser)  

---

## **1. API Request Logger**

### **Spezifikationen**
- **Datei:** `server/index.ts` (Zeilen 9-37)
- **Typ:** Express.js Middleware
- **Funktion:** Automatische Protokollierung aller HTTP-Requests

### **Technische Details**
```javascript
Logging-Format: {METHOD} {PATH} {STATUS} in {DURATION}ms :: {JSON_RESPONSE}
Beispiel: GET /api/objects 200 in 487ms :: [{"id":21,"name":"Aegidi..."}]
```

### **Features**
- ✅ Performance-Monitoring (Antwortzeiten)
- ✅ JSON-Response-Erfassung  
- ✅ Automatische Kürzung bei >80 Zeichen
- ✅ Filter: Nur API-Endpunkte (`/api/*`)
- ✅ Real-time Streaming in Workflow-Console

### **Ausgabe-Kanäle**
- Console Output (Workflow-Logs)
- Replit-Dashboard Integration

---

## **2. SettingsDB Manager Logger**

### **Spezifikationen**
- **Datei:** `server/settingsdb.ts`
- **Typ:** Singleton Database Manager
- **Zweck:** Datenbankverbindungs- und Konfigurationsprotokollierung

### **Log-Kategorien**

#### **🔄 Konfiguration**
- API-Fallback-Konfiguration Updates
- Cache-Invalidierung
- Dynamische Konfiguration Neuladen

#### **✅ Erfolgreiche Operationen**
- Datenbankverbindungen
- Settings-Abfragen
- Portal-DB-Pool-Erstellung

#### **📋 Datenbank-Operationen**
- Settings-Abfragen mit Filtern
- Verbindungspool-Management
- Fallback-Mechanismen

#### **❌ Fehlerbehandlung**
- Connection-Errors
- Query-Failures
- Pool-Management-Probleme

### **Ausgabe-Beispiele**
```
📋 SettingsDbManager nutzt Portal-Hauptdatenbank (alle 18 Settings)
✅ SettingsDB Pool verbunden: j3yy.your-database.de/heimkehr_db2025
🔍 TOTAL SETTINGS in DATABASE: 19
❌ Error fetching settings from active settingdb: [error details]
```

---

## **3. Anwendungs-spezifische Logger**

### **3.1 Effizienz-Analyse Logger**
- **Datei:** `server/storage.ts`
- **Funktionen:**
  - Performance-Tracking (⚡ PERFORMANCE: Query executed in XXXms)
  - Datenverifikation (📊 Berechnung: X - Y = Z kWh)
  - Sample-Data-Ausgabe (🔢 Sample month: 2024-01 = 56657 kWh)

### **3.2 Objekt-Management Logger**
- **Funktionen:**
  - Mandanten-Synchronisation (🔄 Synchronizing mandant selections)
  - Debug-Ausgaben (🔍 Found mandants: {...})
  - Status-Updates (🧹 Resetting all mandant selections)

### **3.3 Grafana-Integration Logger**
- **Datei:** `client/src/components/GrafanaDiagramme.tsx`
- **Funktionen:**
  - URL-Generierung Debug (🔧 [MODE-DEBUG])
  - Netzwächter-Mode (🔧 [NETZ-DEBUG])
  - Meter-Datenverarbeitung

---

## **4. Error Handling System**

### **Globale Fehlerbehandlung**
- **Datei:** `server/index.ts`
- **Typ:** Unhandled Exception Handler
- **Ausgabe:** `Application error: [error details]`

### **Database Error Logging**
- **PostgreSQL-spezifisch:** Tabellen-Existenz-Prüfung
- **Beispiel:** `error: relation "facilities" does not exist`
- **Kategorisierung:** Error Codes (42P01, etc.)

---

## **5. Frontend Debug Logger**

### **Browser Console Logging**
**Aktive Komponenten:**
- `KI_energy.tsx` - Energiedaten-Verarbeitung
- `GrafanaDiagramme.tsx` - Diagramm-Generierung  
- `TemperatureAnalysis.tsx` - Temperatur-Auswertungen
- `ObjectManagement.tsx` - Objekt-CRUD-Operationen

### **Log-Typen**
- Data Loading Debug
- Component State Changes
- API Response Validation
- Performance Monitoring

---

## **6. System-Performance Monitoring**

### **Metriken**
- **API Response Times:** Automatisch erfasst
- **Database Query Times:** Performance-Logger aktiv
- **Memory Usage:** Implizit über Console-Output
- **Error Rates:** Vollständige Fehlerprotokollierung

### **Monitoring-Ausgaben**
```
⚡ PERFORMANCE: Query executed in 544ms. Rows returned: 12
📊 Total period consumption: 327701 kWh over 351 days
🔍 Verifikation: Monatssumme 327701 kWh = Total Period 327701 kWh? ✅ MATCH
```

---

## **7. Konfiguration und Einstellungen**

### **Logger-Konfiguration**
- **Logging-Level:** Debug (Vollständige Ausgabe)
- **Output-Format:** Emoji-kategorisiert + Zeitstempel
- **Persistence:** Nur Console (keine Datei-Speicherung)
- **Rotation:** Nicht implementiert

### **Environment Settings**
- **Development:** Vollständiges Debug-Logging aktiv
- **Production:** Gleiches Logging-Level (Console-basiert)

---

## **8. Wartung und Monitoring**

### **Log-Überwachung**
- **Real-time:** Workflow-Console in Replit
- **Historical:** Nicht verfügbar (keine Persistence)
- **Alerts:** Automatische Error-Erkennung in Console

### **Wartungsaufgaben**
- ✅ Regelmäßige Console-Überprüfung
- ❌ Log-Rotation nicht erforderlich (Memory-based)
- ❌ Log-Archivierung nicht implementiert

---

## **9. Bekannte Limitierungen**

### **Aktuelle Einschränkungen**
- ❌ Keine zentrale Logger-Bibliothek (Winston, Pino)
- ❌ Keine Log-Persistence in Dateien/Database
- ❌ Keine strukturierte Log-Formate (JSON)
- ❌ Keine Log-Level-Konfiguration
- ❌ Keine Log-Rotation

### **Verbesserungsmöglichkeiten**
- Implementierung Winston/Pino Logger
- Strukturierte JSON-Logs
- Database-Log-Persistence
- Konfigurierbare Log-Level
- Error-Alerting-System

---

## **10. System-Status**

### **Aktuelle Funktionalität**
✅ **API Request Logging:** Vollständig funktional  
✅ **Database Operation Logging:** Aktiv  
✅ **Error Logging:** Umfassend implementiert  
✅ **Debug Output:** In allen kritischen Komponenten  
✅ **Performance Monitoring:** Grundlegende Metriken  

### **System-Gesundheit**
🟢 **Logger-System:** Stabil und funktional  
🟢 **Console Output:** Real-time verfügbar  
🟢 **Error Detection:** Automatisch  
🟡 **Log Persistence:** Nicht vorhanden  
🟡 **Structured Logging:** Nicht implementiert  

---

**Erstellt:** 01. September 2025  
**System:** Heizungsanlagen-Management v1.0.0  
**Logger-Framework:** Native Console-Logging
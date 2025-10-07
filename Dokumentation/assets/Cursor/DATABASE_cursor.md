# Monitoring-App – Datenbank-Übersicht

## 1. Architektur & Prinzipien

- **Datenbank:** PostgreSQL (13+)
- **Multi-Tenancy:** Logische Trennung über `mandantid` (Shared Database, Shared Schema)
- **Flexibilität:** JSONB-Felder für dynamische, mandantenspezifische und IoT-bezogene Daten
- **Performance:** GIN-Indizes auf JSONB, Partitionierung für Zeitreihen, gezielte Composite-Indizes
- **Referentielle Integrität:** Foreign Keys, CASCADE-Strategien, Validierungs- und Reparatur-Logik
- **Sicherheit:** Row-Level-Security, Mandanten-Policies, rollenbasierte Rechte

---

## 2. Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        integer id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        varchar role
        integer_array mandants
        boolean active
        timestamp last_login
        timestamp created_at
        timestamp updated_at
    }
    MANDANTS {
        integer id PK
        varchar name
        varchar code UK
        text description
        jsonb settings
        jsonb contact_info
        boolean active
        timestamp created_at
    }
    OBJECTS {
        integer id PK
        bigint objectid UK
        varchar title
        varchar ort
        varchar plz
        jsonb objdata
        jsonb objanlage
        jsonb portdata
        jsonb meter
        jsonb dashboard
        jsonb alarm
        jsonb kianalyse
        jsonb status
        jsonb analyse
        jsonb auswertung
        jsonb report
        jsonb diagramm
        timestamp created_at
        timestamp updated_at
    }
    MAP {
        integer mapid PK
        bigint objectid FK
        integer mandantid FK
        timestamp created_at
    }
    DAY_METER_COMP {
        bigserial counter PK
        timestamp _time
        text id
        bigint objectid FK
        text tpl
        ...
    }
    SETTINGS {
        integer id PK
        varchar category
        varchar key_name
        jsonb value
        integer user_id
        integer mandant_id
        timestamp created_at
        timestamp updated_at
    }
    OBJECT_ACTIVITY_LOG {
        integer id PK
        integer object_id FK
        integer user_id FK
        varchar username
        varchar user_role
        integer mandant_id
        varchar activity_type
        jsonb activity_details
        ...
        timestamp created_at
        timestamp updated_at
    }
    WAERME_OBJEKTE {
        integer objekt_id PK
        integer mandant_id FK
        ...
    }
    WAERME_MESSREIHEN {
        integer messreihe_id PK
        integer objekt_id FK
        ...
    }
    ENERGIEVERBRAUCH_TAGESWERTE {
        integer verbrauch_id PK
        integer objekt_id FK
        ...
    }
    WETTERDIENST_DATEN {
        integer wetter_id PK
        ...
    }
    WAERME_PROGNOSEN {
        integer prognose_id PK
        integer objekt_id FK
        ...
    }
    USERS ||--o{ MANDANTS : "hat Zugriff auf"
    MANDANTS ||--o{ MAP : "besitzt Objekte"
    OBJECTS ||--o{ MAP : "ist zugeordnet zu Mandant"
    OBJECTS ||--o{ DAY_METER_COMP : "liefert Messwerte"
    OBJECTS ||--o{ OBJECT_ACTIVITY_LOG : "Aktivitäten"
    OBJECTS ||--o{ SETTINGS : "Einstellungen"
    WAERME_OBJEKTE ||--o{ WAERME_MESSREIHEN : "Messreihen"
    WAERME_OBJEKTE ||--o{ ENERGIEVERBRAUCH_TAGESWERTE : "Tageswerte"
    WAERME_OBJEKTE ||--o{ WAERME_PROGNOSEN : "Prognosen"
```

---

## 3. Tabellendefinitionen (Kern & Erweiterungen)

### USERS
- Benutzerverwaltung, Rollen, Mandanten-Zuordnung (ARRAY)
- Zeitstempel für Auditing

### MANDANTS
- Mandantenstammdaten, Einstellungen, Kontakte (JSONB)

### OBJECTS
- Zentrale Objekttabelle mit:
  - Basisdaten (title, ort, plz)
  - Flexible Felder: objdata, portdata, meter, dashboard, alarm, kianalyse, status, auswertung, report, diagramm (alle JSONB)
  - Zeitstempel für Auditing

### MAP
- N:N-Zuordnung zwischen Objekten und Mandanten
- Foreign Keys, CASCADE, Composite-Index

### DAY_METER_COMP
- Zeitreihen für Zählerdaten (tägliche Aggregation)
- Partitionierung nach Jahr
- Foreign Key zu object
- Indizes für Zeit, objectid, id, tpl

### SETTINGS
- Systemweite, mandanten- und benutzerspezifische Einstellungen
- Kategorie, Schlüssel, Wert, User/Mandant-IDs

### OBJECT_ACTIVITY_LOG
- Protokolliert alle Objekt-Aktivitäten (view, edit, save, export, tab_switch, search, refresh)
- Referenzen zu Objekt, User, Mandant
- Details als JSONB

### WAERME_OBJEKTE, WAERME_MESSREIHEN, ENERGIEVERBRAUCH_TAGESWERTE, WETTERDIENST_DATEN, WAERME_PROGNOSEN
- Erweiterte Tabellen für Wärmeplanung, Energieverbrauch, Wetterdaten und Prognosen
- Siehe `sql/waermeplanung_schema.sql` für Details

---

## 3a. Tabellarische Übersicht aller Tabellen

### Tabelle: objects

| Feld         | Typ         | Besonderheit/Beschreibung                       |
|--------------|-------------|------------------------------------------------|
| id           | INTEGER     | Primärschlüssel, auto-increment                |
| objectid     | BIGINT      | Eindeutig, Pflichtfeld (globale Objekt-ID)     |
| title        | STRING(255) | Objektname                                     |
| ort          | STRING(255) | Standort/Stadt                                 |
| plz          | STRING(10)  | Postleitzahl                                   |
| objdata      | JSONB       | Sensordaten & Konfiguration                    |
| objanlage    | JSONB       | Anlagen-/Installationsinfo                     |
| portdata     | JSONB       | Port-/Verbindungsdaten                         |
| meter        | JSONB       | Zählerstände & Energiedaten                    |
| dashboard    | JSONB       | Dashboard-Konfiguration                        |
| alarm        | JSONB       | Alarm-Konfiguration                            |
| kianalyse    | JSONB       | KI-Analyse-Daten                               |
| status       | JSONB       | Status-Informationen                           |
| analyse      | JSONB       | Analyse-Daten                                  |
| auswertung   | JSONB       | Auswertungsdaten                               |
| report       | JSONB       | Report-Daten                                   |
| diagramm     | JSONB       | Diagramm-Konfiguration                         |
| fltemp       | JSONB       | Vorlauftemperatur (optional)                   |
| rttemp       | JSONB       | Rücklauftemperatur (optional)                  |
| created_at   | DATE        | Erstellungszeitpunkt                           |
| updated_at   | DATE        | Letzte Aktualisierung                          |

### Tabelle: settings

| Feld         | Typ         | Besonderheit/Beschreibung                                 |
|--------------|-------------|----------------------------------------------------------|
| id           | INTEGER     | Primärschlüssel, auto-increment                          |
| category     | VARCHAR(50) | Kategorie der Einstellung (z.B. meter_labels, system)    |
| key_name     | VARCHAR(100)| Schlüssel der Einstellung                                |
| value        | TEXT        | Wert der Einstellung (meist als JSON-String)             |
| user_id      | INTEGER     | Benutzer-ID (NULL für global)                            |
| mandant_id   | INTEGER     | Mandant-ID (NULL für global)                             |
| created_at   | TIMESTAMP   | Erstellungszeitpunkt                                     |
| updated_at   | TIMESTAMP   | Letzte Aktualisierung                                    |

### Tabelle: waerme_objekte

| Feld                  | Typ             | Besonderheit/Beschreibung                                 |
|-----------------------|-----------------|----------------------------------------------------------|
| objekt_id             | SERIAL          | Primärschlüssel                                          |
| mandant_id            | INTEGER         | Fremdschlüssel zu mandants(id)                           |
| bezeichnung           | VARCHAR(255)    | Name/Bezeichnung des Objekts                             |
| adresse               | TEXT            | Adresse                                                  |
| plz                   | VARCHAR(10)     | Postleitzahl                                             |
| ort                   | VARCHAR(100)    | Ort                                                      |
| latitude              | DECIMAL(10,8)   | Breitengrad                                              |
| longitude             | DECIMAL(11,8)   | Längengrad                                               |
| dwd_station_id        | VARCHAR(50)     | Wetterdienst-Station-ID                                  |
| wetterdienst_quelle   | VARCHAR(50)     | Quelle (z.B. dwd)                                        |
| baujahr               | INTEGER         | Baujahr                                                  |
| nutzungsart           | VARCHAR(100)    | Nutzungstyp (Wohnung, Gewerbe, etc.)                     |
| heizungstyp           | VARCHAR(100)    | Heizungstyp (Gas, WP, etc.)                              |
| waermebedarf_kwh_m2   | DECIMAL(8,2)    | Wärmebedarf (kWh/m²)                                     |
| flaeche_m2            | DECIMAL(10,2)   | Fläche in m²                                             |
| anzahl_wohnungen      | INTEGER         | Anzahl Wohnungen                                         |
| anzahl_geschosse      | INTEGER         | Anzahl Geschosse                                         |
| dachform              | VARCHAR(50)     | Dachform                                                 |
| dammung_qualitaet     | VARCHAR(50)     | Dämmqualität                                             |
| fenster_qualitaet     | VARCHAR(50)     | Fensterqualität                                          |
| jahresverbrauch_kwh   | DECIMAL(12,2)   | Jahresverbrauch                                          |
| jahreskosten_euro     | DECIMAL(10,2)   | Jahreskosten                                             |
| effizienz_kwh_m2      | DECIMAL(8,2)    | Heizungseffizienz (kWh/m²)                               |
| effizienz_klasse      | VARCHAR(10)     | Effizienzklasse (A++ bis G)                              |
| benchmark_kategorie   | VARCHAR(50)     | Benchmark-Kategorie                                      |
| co2_faktor_kg_kwh     | DECIMAL(8,4)    | CO₂-Faktor je kWh                                        |
| co2_emissionen_jahr_kg| DECIMAL(10,2)   | Jährliche CO₂-Emissionen                                 |
| letztes_wartungsdatum | DATE            | Letztes Wartungsdatum                                    |
| naechstes_wartungsdatum| DATE           | Nächstes Wartungsdatum                                   |
| investitionsbudget_euro| DECIMAL(10,2)  | Investitionsbudget                                       |
| created_at            | TIMESTAMP       | Erstellungszeitpunkt                                     |
| updated_at            | TIMESTAMP       | Letzte Aktualisierung                                    |

---

## 4. JSONB-Felder – Standards & Beispiele

### objdata (Sensordaten & Konfiguration)
```json
{
  "sensors": [
    { "id": "temp_01", "type": "temperature", "value": 22.5, "unit": "°C", "timestamp": "2025-06-28T15:30:00Z" }
  ],
  "config": { "sampling_rate": 60, "data_retention": 365 }
}
```

### dashboard (Dashboard-Konfiguration)
```json
{
  "layout": "grid",
  "widgets": [
    { "type": "chart", "position": {"x": 0, "y": 0, "w": 6, "h": 4}, "data_source": "temperature", "chart_type": "line" }
  ],
  "refresh_interval": 30
}
```

### alarm (Alarm-Einstellungen)
```json
{
  "rules": [
    { "id": "temp_high", "condition": "temperature > 25", "severity": "warning", "enabled": true, "notifications": ["email", "sms"] }
  ],
  "escalation": { "levels": [ {"after": 300, "action": "email"}, {"after": 900, "action": "sms"} ] }
}
```

### status (Status-Informationen)
```json
{
  "online": true,
  "last_seen": "2025-06-28T15:30:00Z",
  "battery_level": 85,
  "signal_strength": -65,
  "error_count": 0,
  "color": "green"
}
```

---

## 5. Multi-Tenancy & Sicherheit

- **Mandanten-Zuordnung:** Über MAP-Tabelle (objectid, mandantid)
- **User-Mandant-Zuordnung:** Über users.mandants (ARRAY)
- **Row-Level-Security:** Mandanten-Policy auf object/map
- **Rollen:** Admin, User, Viewer
- **API:** JWT-Auth, Mandantenprüfung in allen Endpunkten
- **Passwort-Hashing:** bcrypt, 12 Runden
- **SQL-Injection-Schutz:** Sequelize ORM, Validierung, Sanitization

---

## 6. Performance & Skalierung

- **Indizes:** Composite- und GIN-Indizes auf allen Query-relevanten Feldern
- **Partitionierung:** Für große Zeitreihen-Tabellen
- **Connection Pooling:** Für API/Backend
- **Query-Patterns:** Standardisierte, mandantensichere Abfragen

---

## 7. Backup, Monitoring & Wartung

- **Automatisierte Backups** (z.B. täglich, mit Retention)
- **Monitoring:** pg_stat_statements, Tabellen-Größen, Foreign Key Checks
- **Regelmäßige Aufgaben:** ANALYZE, VACUUM, REINDEX

---

## 8. Migration & Zukunft

- **Schema-Evolution:** Neue JSONB-Felder, neue Zeitreihen-Tabellen, ML/Realtime-Integration
- **Audit-Trail:** Änderungs-Historie für alle Kern-Tabellen
- **API-Integration:** RESTful, versioniert, mandantensicher

---

## 9. Beispiel-Queries

```sql
-- Mandanten-spezifische Objektsuche
SELECT oe.*, m.mandantid 
FROM object oe
JOIN map m ON oe.objectid = m.objectid
WHERE m.mandantid = :mandantId;

-- Dashboard-Widgets nach Typ
SELECT objectid, dashboard->'widgets' 
FROM object 
WHERE dashboard @> '{"widgets": [{"type": "chart"}]}'::jsonb;

-- Aktive Alerts finden
SELECT objectid, analyse->'alerts' 
FROM object 
WHERE analyse -> 'alerts' @> '[{"enabled": true}]'::jsonb;

-- Zeitreihen-Daten für Zähler abrufen
SELECT dmc._time, dmc.en_last - dmc.en_first as daily_consumption,
       dmc.flt_mean, dmc.ret_mean, dmc.pow_mean,
       o.title, o.ort
FROM day_meter_comp dmc
JOIN object o ON dmc.objectid = o.objectid
WHERE dmc.objectid = 123456789
  AND dmc._time >= '2024-06-01'
  AND dmc._time < '2024-07-01'
ORDER BY dmc._time;
```

---

## 10. Best Practices

- **Alle Foreign Keys validieren und regelmäßig prüfen**
- **Keine verwaisten Einträge**
- **Alle Mandanten-Operationen immer mit mandantid absichern**
- **JSONB-Schemas dokumentieren und versionieren**
- **Partitionierung und Indizes regelmäßig überwachen und anpassen**

---

**Stand:** 2025-07-24

> Diese Übersicht ersetzt die bisherigen Dokumente `DATABASE_CONCEPT.md` und `DATABASE_SCHEMA.md`. Bitte nur noch diese Datei referenzieren. 
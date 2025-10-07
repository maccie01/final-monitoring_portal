# Benutzerhandbuch - Heizsystemmanagement-Anwendung

## Inhaltsverzeichnis
1. [Überblick](#überblick)
2. [Erste Schritte](#erste-schritte)
3. [Navigation und Aufbau](#navigation-und-aufbau)
4. [Hauptfunktionen](#hauptfunktionen)
5. [Benutzerrollen und Berechtigungen](#benutzerrollen-und-berechtigungen)
6. [Häufige Aufgaben](#häufige-aufgaben)
7. [Tipps und Best Practices](#tipps-und-best-practices)

---

## Überblick

Die Heizsystemmanagement-Anwendung ist ein KI-geführter Netzwächter zur intelligenten Überwachung und Optimierung von Heizungsanlagen. Das System bietet Echtzeit-Monitoring, Temperaturanalyse und umfassende Verwaltungsfunktionen für Heizungsportfolios.

### Kernfunktionen
- **KI-geführte Temperaturanalyse** mit automatischer Statuserkennung
- **Dashboard mit KPIs** für Portfolioübersicht
- **Grafana-Integration** für detaillierte Datenvisualisierung
- **Objektverwaltung** für Anlagen und Standorte
- **Netzwächter** mit Echtzeit-Temperaturmonitoring
- **Effizienzstrategie** mit Optimierungsempfehlungen
- **Logbuch-System** für Wartung und Dokumentation

---

## Erste Schritte

### 1. Anmeldung
1. Öffnen Sie die Anwendung im Browser
2. Klicken Sie auf "Jetzt starten - Login"
3. Geben Sie Ihre Zugangsdaten ein:
   - **Benutzername**: Ihr zugeteilter Benutzername
   - **Passwort**: Ihr persönliches Passwort
4. Klicken Sie "Anmelden"

**Test-Zugang verfügbar**: Für Demonstrationszwecke steht ein Test-Login zur Verfügung.

### 2. Erstes Login
Nach der ersten Anmeldung werden Sie automatisch zur Startseite Ihres Benutzerprofils weitergeleitet. Je nach Berechtigung haben Sie Zugriff auf verschiedene Module.

---

## Navigation und Aufbau

### Hauptnavigation
Die Anwendung verfügt über eine seitliche Navigation mit folgenden Bereichen:

#### 📊 **Dashboard**
- Portfolioübersicht mit KPIs
- Objektliste mit Filterfunktionen
- Kritische Anlagen-Übersicht

#### 🌡️ **Netzwächter**
- Temperatur-Echtzeit-Monitoring
- Kritische, Warn- und Offline-Anlagen
- Detaillierte Sensoranalyse

#### 📈 **Effizienzstrategie**
- Systematische Effizienzanalyse
- Optimierungsempfehlungen
- Portfolioauswertung nach Effizienzklassen

#### 🏢 **Objektverwaltung**
- Anlagenverwaltung
- Objektdaten bearbeiten
- Standortverwaltung

#### ⚡ **Energiedaten**
- Energieverbrauch eingeben
- Historische Datenansicht
- Verbrauchstrends

#### 📊 **Grafana-Dashboards**
- Interaktive Datenvisualisierung
- Verschiedene Dashboard-Typen
- Zeitbereich-Auswahl

#### 👥 **Benutzerverwaltung** *(nur für Administratoren)*
- Benutzer anlegen und verwalten
- Rollen und Berechtigungen
- Gruppenverwaltung

#### 📖 **Logbuch**
- Wartungseinträge dokumentieren
- ToDo-Aufgaben verwalten
- Filterfunktionen

---

## Hauptfunktionen

### 🏠 Dashboard
Das Dashboard ist der zentrale Startpunkt der Anwendung.

#### KPI-Übersicht
- **Gesamtanzahl Objekte**: Übersicht aller verwalteten Anlagen
- **Kritische Anlagen**: Anzahl der Anlagen mit kritischen Temperaturen
- **Offline-Anlagen**: Anlagen ohne aktuelle Datenübertragung
- **Durchschnittseffizienz**: Portfolio-Effizienz im Überblick

#### Objektliste
- **Filteroptionen**: Nach Gebäudetyp, Effizienz und Suchbegriff
- **Sortierfunktionen**: Nach Name, Standort, Effizienz, Temperaturstatus
- **Direktzugriff**: Klick auf Objekt öffnet Grafana-Dashboard
- **Temperaturstatus**: Farbcodierte Statusanzeige (kritisch/normal/offline)

### 🌡️ Netzwächter
Der Netzwächter ist das Herzstück der Temperaturüberwachung.

#### Funktionen
- **Echtzeit-Monitoring**: Aktuelle Vorlauf- und Rücklauftemperaturen
- **Automatische Kategorisierung**: 
  - 🔴 **Kritische Anlagen**: Überschreitung kritischer Grenzwerte
  - 🟠 **Warnung**: Überschreitung von Warngrenzwerten
  - ⚫ **Offline**: Keine aktuellen Daten verfügbar
  - 🟢 **Optimiert**: Ideale Betriebsbedingungen

#### Temperaturanalyse
- **Schwellwerte**: Konfigurierbare Grenzwerte pro Anlagentyp
- **Sensorübersicht**: Detaillierte Analyse einzelner Sensoren
- **Historische Daten**: Temperaturverlauf und Trends
- **Alarmierung**: Visuelle Hervorhebung kritischer Zustände

### 📈 Effizienzstrategie
Systematische Analyse und Optimierung der Portfolio-Effizienz.

#### Kategorien
- **Ineffizient** (< 70% Effizienz): Dringende Optimierung erforderlich
- **Optimierbar** (70-85% Effizienz): Verbesserungspotential vorhanden
- **Optimiert** (> 85% Effizienz): Bereits optimaler Betrieb

#### Funktionen
- **Potentialanalyse**: Berechnung möglicher Effizienzsteigerungen
- **Optimierungsempfehlungen**: Konkrete Handlungsvorschläge
- **Priorisierung**: Nach Optimierungspotential sortiert

### 🏢 Objektverwaltung
Zentrale Verwaltung aller Heizungsanlagen und Standorte.

#### Objektliste
- **Übersichtliche Darstellung**: Name, Standort, Status
- **Suchfunktion**: Schnelles Auffinden von Objekten
- **Detailansicht**: Umfassende Objektinformationen

#### Objektbearbeitung
- **Grunddaten**: Name, Adresse, Objekttyp
- **Anlagendaten**: Technische Spezifikationen
- **Konfiguration**: Dashboard- und Meter-Einstellungen
- **JSON-Editor**: Erweiterte Konfigurationsoptionen

### ⚡ Energiedaten
Erfassung und Auswertung von Energieverbrauchsdaten.

#### Funktionen
- **Dateneingabe**: Manuelle Erfassung von Verbrauchswerten
- **Historische Ansicht**: Zeitreihenanalyse von Energiedaten
- **Trends**: Visualisierung von Verbrauchsmustern
- **Export**: Datenexport für weitere Analysen

### 📊 Grafana-Dashboards
Interaktive Datenvisualisierung mit verschiedenen Dashboard-Typen.

#### Dashboard-Typen
- **Wächter**: Temperatur-Monitoring mit Tab-Navigation
- **Auswertung**: Umfassende Datenanalyse
- **Eigenes Board**: Benutzerdefinierte Dashboards
- **Diagramme**: Spezielle Diagrammansichten

#### Funktionen
- **Objektauswahl**: Dropdown-Menü für Anlagenwahl
- **Zeitbereich**: Flexible Zeitraumauswahl
- **Tab-Navigation**: Strukturierte Datenansicht
- **Interaktive Panels**: Zoom, Filter und Drill-Down-Funktionen

### 📖 Logbuch
Dokumentation von Wartungsarbeiten und Aufgabenverwaltung.

#### Logbucheinträge
- **Eintragstypen**: Wartung, Störung, Umbau, Inspektion
- **Kategorien**: Heizung, Sanitär, Elektro, Sonstiges
- **Prioritäten**: Niedrig, Mittel, Hoch, Kritisch
- **Status**: Offen, In Bearbeitung, Erledigt, Verschoben

#### ToDo-Aufgaben
- **Aufgabenverwaltung**: Erstellung und Verfolgung von Aufgaben
- **Terminplanung**: Fälligkeitsdaten und Erinnerungen
- **Zuweisungen**: Verantwortliche Personen definieren
- **Fortschrittsverfolgung**: Status-Updates und Abschluss

---

## Benutzerrollen und Berechtigungen

### 👀 Betrachter (Viewer)
- **Zugriff**: Nur Leseberechtigung
- **Funktionen**: Dashboard, Netzwächter, Grafana-Dashboards anzeigen
- **Einschränkungen**: Keine Bearbeitung oder Konfiguration

### 👤 Benutzer (User)
- **Zugriff**: Lesen und begrenzte Bearbeitung
- **Funktionen**: Energiedaten eingeben, Logbucheinträge erstellen
- **Einschränkungen**: Keine Systemkonfiguration oder Benutzerverwaltung

### 👑 Administrator (Admin)
- **Zugriff**: Vollzugriff auf alle Funktionen
- **Funktionen**: Benutzerverwaltung, Systemkonfiguration, Objektverwaltung
- **Berechtigungen**: Alle Module ohne Einschränkungen

### 🔧 Superadmin
- **Zugriff**: Nur System-Setup
- **Zweck**: Initiale Systemkonfiguration und Wartung
- **Einschränkungen**: Kein Zugriff auf operative Bereiche

---

## Häufige Aufgaben

### 🔍 Kritische Anlagen überprüfen
1. **Dashboard** öffnen
2. **Kritische Anlagen**-Bereich beachten
3. Auf kritische Anlage klicken → Grafana-Dashboard öffnet sich
4. **Netzwächter** für detaillierte Temperaturanalyse besuchen
5. Bei Bedarf **Logbucheintrag** erstellen

### 📊 Portfolio-Effizienz analysieren
1. **Effizienzstrategie** öffnen
2. **Ineffiziente Anlagen** prüfen
3. Anlage auswählen für Detailanalyse
4. **Optimierungsempfehlungen** beachten
5. **Maßnahmen** im Logbuch dokumentieren

### 🏢 Neue Anlage hinzufügen
1. **Objektverwaltung** öffnen
2. **"Objekt hinzufügen"** klicken
3. **Grunddaten** eingeben (Name, Adresse)
4. **Anlagendaten** konfigurieren
5. **Dashboard-Einstellungen** festlegen
6. **Speichern** und testen

### 📖 Wartung dokumentieren
1. **Logbuch** öffnen
2. **"Neuer Eintrag"** klicken
3. **Objekt auswählen**
4. **Eintragstyp** und **Kategorie** wählen
5. **Beschreibung** und **Details** eingeben
6. **Techniker-Informationen** hinzufügen
7. **Speichern**

### 🔧 Benutzerprofil verwalten
1. **Benutzereinstellungen** öffnen
2. **Profildaten** bearbeiten (Name, E-Mail)
3. Bei Bedarf **Passwort ändern**
4. **Speichern**

---

## Tipps und Best Practices

### 🎯 Effizienter Workflow
- **Dashboard als Startpunkt**: Täglicher Überblick über kritische Anlagen
- **Netzwächter-Routine**: Regelmäßige Kontrolle der Temperaturwerte
- **Proaktive Wartung**: Logbucheinträge für geplante Wartungen anlegen
- **Filternutzung**: Objektlisten nach Relevanz filtern

### 📊 Datenqualität
- **Regelmäßige Updates**: Energiedaten zeitnah erfassen
- **Vollständige Dokumentation**: Alle Wartungsarbeiten dokumentieren
- **Objektdaten aktuell halten**: Änderungen zeitnah in der Objektverwaltung eintragen

### 🔍 Monitoring-Effizienz
- **Alarmschwellen prüfen**: Temperaturgrenzwerte regelmäßig überprüfen
- **Trends beobachten**: Grafana-Dashboards für Langzeittrends nutzen
- **Offline-Anlagen**: Regelmäßig auf Datenübertragung prüfen

### 🛠️ Troubleshooting
- **Browser-Cache leeren**: Bei Anzeigeproblemen
- **Logout/Login**: Bei Berechtigungsproblemen
- **Admin kontaktieren**: Bei technischen Problemen
- **API-Test nutzen**: Zur Systemdiagnose (nur für Administratoren)

### 📱 Bedienung
- **Responsive Design**: Anwendung funktioniert auf Desktop, Tablet und Smartphone
- **Keyboard-Shortcuts**: Tab-Navigation für schnelle Bedienung
- **Tooltips nutzen**: Hilfestellungen bei unklaren Funktionen

---

## Support und Weitere Hilfe

### 📞 Kontakt
- **Technischer Support**: Bei Systemfehlern oder Anmeldeproblemen
- **Anwendungssupport**: Bei Fragen zur Bedienung
- **Schulungen**: Verfügbar für neue Benutzer

### 📚 Weitere Dokumentation
- **Technische Dokumentation**: Für Administratoren und IT-Verantwortliche
- **API-Dokumentation**: Für Entwickler und Systemintegration
- **Changelog**: Übersicht über Updates und neue Funktionen

### 🔄 Updates
Die Anwendung wird regelmäßig aktualisiert. Neue Funktionen und Verbesserungen werden automatisch verfügbar gemacht.

---

**Version**: 2025.1  
**Letzte Aktualisierung**: 19. August 2025  
**Gültig für**: Heizsystemmanagement-Anwendung v3.0+
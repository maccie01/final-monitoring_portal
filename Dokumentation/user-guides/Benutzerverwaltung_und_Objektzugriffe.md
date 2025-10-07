# Benutzerverwaltung und Objektzugriffe

## Überblick

Das Heizungsanlagen-Management-System implementiert ein umfassendes Benutzer- und Berechtigungssystem mit rollenbasiertem Zugriff auf Objekte und Funktionen. Diese Dokumentation beschreibt die Verwaltung von Benutzern, Rollen und Objektzugriffen.

## Benutzerrollen

### Superadmin
- **Systemweiter Vollzugriff** auf alle Funktionen und Mandanten
- **Benutzerverwaltung**: Erstellen, bearbeiten, löschen aller Benutzer
- **Objektverwaltung**: Vollzugriff auf alle Objekte systemweit
- **Systemkonfiguration**: Alle Einstellungen und Konfigurationen
- **Mandanten-übergreifend**: Zugriff auf alle Mandanten und Daten

### Administrator (admin)
- **Mandanten-spezifische Administration**
- **Benutzerverwaltung**: Verwaltung von Benutzern innerhalb des eigenen Mandanten
- **Objektverwaltung**: Vollzugriff auf Objekte des eigenen Mandanten
- **Systemkonfiguration**: Mandanten-spezifische Einstellungen
- **Audit-Zugriff**: Logs und Aktivitäten des eigenen Mandanten

### Standard Benutzer (user)
- **Profil-basierte Berechtigungen** (konfiguriert in user_profiles)
- **Objektzugriff**: Basierend auf Mandanten-Zuordnung und Profil-Einstellungen
- **Dashboard-Zugriff**: KPI-Dashboard, Energiedaten, Netzwächter (je nach Profil)
- **Eingeschränkte Konfiguration**: Nur persönliche Einstellungen

**Hinweis**: Die Rolle `viewer` wird in der aktuellen Codebasis nicht implementiert.

## Mandanten-System

### Was ist ein Mandant?

Ein **Mandant** ist eine Organisation oder Firma, die das System nutzt. Das mandantenbasierte System ermöglicht eine strikte Datentrennung zwischen verschiedenen Organisationen bei gleichzeitig flexiblen Kooperationsmöglichkeiten.

### Kategorien
- **Verwalter**: Objektverwaltende Unternehmen
- **Handwerker**: Wartungsdienstleister (H2O, Zauske Haustechnik)
- **Betreuer**: Objektbetreuende Organisationen
- **Wohnungsgesellschaft**: Immobilienunternehmen (Heimkehr eG)
- **Betreiber**: Betreiber von Heizungsanlagen

### Zwei-Level-Zugriffssystem

Jeder Benutzer hat zwei mandantenbezogene Felder für maximale Flexibilität:

#### 1. Haupt-Mandant (`mandantId`)
- **Zweck**: Primäre Organisationszugehörigkeit
- **Typ**: Einzelwert (Integer)
- **Funktion**: Bestimmt die "Heimat-Organisation" des Benutzers
- **Beispiel**: `mandantId: 5` (Demo Handwerker Service)

#### 2. Erweiterte Zugriffe (`mandantAccess`)
- **Zweck**: Zusätzliche Mandanten-Zugriffe
- **Typ**: Array von Integer-Werten  
- **Funktion**: Ermöglicht mandantenübergreifende Zusammenarbeit
- **Beispiel**: `mandantAccess: [3, 7, 12]`

### Berechtigungslogik

```javascript
// Vereinfachte Darstellung der Berechtigungslogik
const users = useMemo(() => {
  if (!allUsers) return [];
  return allUsers.filter((user: any) => {
    if (isAdmin) {
      return true; // Administratoren sehen alle Benutzer
    }
    // Normale Benutzer sehen nur Benutzer ihres Mandanten
    return currentUserMandantId && user.mandantId === currentUserMandantId;
  });
}, [allUsers, isAdmin, currentUserMandantId]);
```

### Praktisches Beispiel: Mandantenübergreifende Zusammenarbeit

**Szenario:**
- Handwerksbetrieb "Schmidt GmbH" (Mandant-ID: 5)
- Wohnungsgesellschaft "Nord eG" (Mandant-ID: 3)
- Wartungsvertrag zwischen beiden Unternehmen

**Benutzer-Konfiguration:**
```json
{
  "userId": 42,
  "username": "mueller.handwerker",
  "mandantId": 5,
  "mandantAccess": [3],
  "mandantRole": "handwerker"
}
```

**Resultat:**
- Benutzer gehört zu "Schmidt GmbH" (Haupt-Mandant)
- Hat zusätzlichen Zugriff auf Objekte der "Nord eG"
- Kann Wartungsarbeiten bei beiden Mandanten durchführen
- Sieht gefilterte Daten beider Organisationen

### Mandantenrollen

Innerhalb eines Mandanten kann ein Benutzer verschiedene Rollen haben:
- **Besitzer**: Vollzugriff auf alle mandantenspezifischen Daten
- **Verwalter**: Administrative Rechte für Objektverwaltung
- **Handwerker**: Wartungs- und Servicezugriff
- **Betreuer**: Betreuende Funktion mit eingeschränkten Rechten
- **Energieberater**: Spezialisiert auf Energieanalyse und -optimierung

### Zuordnungslogik (Legacy)
```javascript
// Objekt-Mandanten-Zuordnung (alte Struktur)
{
  objectId: 274609033,
  verwalter: 5,      // Heimkehr eG
  handwerker: 6,     // Zauske Haustechnik
  betreuer: null
}
```

## Objektzugriffskontrolle

### Benutzer-spezifische Filterung
```javascript
// API-Abfrage mit Mandanten-Filter
const url = currentUserMandantId 
  ? `/api/objects?mandantId=${currentUserMandantId}`
  : "/api/objects";
```

### Datenfilterung

Das System filtert automatisch basierend auf Mandanten-Zugehörigkeit:

- **Objektlisten**: Nur Objekte des eigenen Mandanten + `mandantAccess`
- **Benutzerlisten**: Nur Benutzer des eigenen Mandanten
- **Energiedaten**: Mandantenspezifische Verbrauchsdaten  
- **Berichte**: Gefiltert nach Mandantenzugehörigkeit
- **Dashboards**: Anzeige nur autorisierter Daten

### Sichtbarkeitsregeln
1. **Administrator**: Alle Objekte aller Mandanten sichtbar
2. **Standard Benutzer**: Nur Objekte des eigenen Mandanten (`mandantId`)
3. **Erweiterte Zugriffe**: Zusätzliche Objekte über `mandantAccess` Array
4. **Viewer**: Nur explizit zugewiesene Objekte

## Authentifizierung

### Replit Auth Integration
- **OpenID Connect**: Sichere Authentifizierung über Replit
- **Session-Management**: Express-Sessions mit PostgreSQL Store
- **Automatische Anmeldung**: Nahtlose Integration in Replit-Umgebung

### Session-Verwaltung
```javascript
// Session-Konfiguration
{
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new (require('connect-pg-simple')(session))({
    conObject: {
      connectionString: process.env.DATABASE_URL
    }
  })
}
```

## Benutzerprofile

### Profil-Struktur
```typescript
interface UserProfile {
  id: number;
  name: string;
  startPage: string;
  sidebar: {
    showLogbook: boolean;
    showDashboard: boolean;
    showEnergyData: boolean;
    showSystemSetup: boolean;
    showNetworkMonitor: boolean;
    showUserManagement: boolean;
    showObjectManagement: boolean;
    showGrafanaDashboards: boolean;
    showEfficiencyStrategy: boolean;
  };
}
```

### Standard-Profile

#### Administrator-Profil
```json
{
  "name": "Administrator",
  "startPage": "/users",
  "sidebar": {
    "showLogbook": true,
    "showDashboard": true,
    "showEnergyData": true,
    "showSystemSetup": true,
    "showNetworkMonitor": true,
    "showUserManagement": true,
    "showObjectManagement": true,
    "showGrafanaDashboards": true,
    "showEfficiencyStrategy": true
  }
}
```

#### Standard Benutzer-Profil
```json
{
  "name": "Standard Benutzer",
  "startPage": "/",
  "sidebar": {
    "showLogbook": true,
    "netzwaechter": true,
    "showDashboard": true,
    "showEnergyData": true,
    "showSystemSetup": false,
    "showNetworkMonitor": true,
    "showUserManagement": false,
    "showEfficiencyModule": false,
    "showObjectManagement": false,
    "showGrafanaDashboards": true,
    "showEfficiencyStrategy": false
  }
}
```

## Objektverwaltung

### Objektzuordnung
- **Automatische Synchronisation**: Mandanten-Zuordnungen werden automatisch synchronisiert
- **Rückwärtskompatibilität**: Suche nach Mandanten-Namen für bestehende Objekte
- **Validierung**: Überprüfung der Mandanten-Kategorien bei Zuordnung

### Bearbeitungsrechte
```javascript
// Admin-only Edit-Button
{(user as any)?.role === 'admin' && selectedObject && (
  <Button onClick={() => navigate(`/objects?objectId=${selectedObject.objectid}`)}>
    <Pencil className="h-4 w-4" />
  </Button>
)}
```

## API-Endpunkte

### Benutzerverwaltung
- `GET /api/auth/user` - Aktueller Benutzer
- `POST /api/user-login` - Benutzer-Anmeldung
- `GET /api/users` - Alle Benutzer (Admin only)
- `POST /api/users` - Neuen Benutzer erstellen (Admin only)

### Objektzugriff
- `GET /api/objects` - Objekte (gefiltert nach Berechtigung)
- `GET /api/objects?mandantId={id}` - Mandanten-spezifische Objekte
- `GET /api/objects/by-objectid/{id}` - Einzelnes Objekt
- `PATCH /api/objects/{id}` - Objekt bearbeiten (Berechtigung erforderlich)

### Mandanten-Verwaltung
- `GET /api/mandants` - Alle Mandanten
- `POST /api/object-mandant` - Objekt-Mandanten-Zuordnung

## Sicherheitsfeatures

### Autorisierung
```javascript
// Berechtigungsprüfung
const isUnauthorizedError = (error: any) => {
  return error?.status === 401 || error?.message?.includes('Unauthorized');
};
```

### Session-Schutz
- **Automatische Weiterleitung**: Bei ungültiger Session zur Anmeldung
- **Session-Timeout**: Automatische Abmeldung nach Inaktivität
- **CSRF-Schutz**: Session-basierte Anfrageverifizierung

## Navigation und URL-Parameter

### Automatische Objektauswahl
```javascript
// URL-Parameter-Unterstützung
const urlParams = new URLSearchParams(window.location.search);
const objectIdFromUrl = urlParams.get('objectId');

if (objectIdFromUrl && objects && !selectedObject) {
  const foundObject = objects.find(obj => 
    obj.objectid.toString() === objectIdFromUrl
  );
  if (foundObject) {
    setSelectedObject(foundObject);
  }
}
```

### Admin-Navigation
- **Edit-Button**: Direkter Sprung von Grafana-Dashboard zur Objektbearbeitung
- **URL-Parameter**: Automatische Objektauswahl via `?objectId=123`
- **Zurück-Navigation**: Nahtlose Rückkehr zum ursprünglichen Dashboard

## Best Practices

### Benutzer-Onboarding
1. **Mandanten-Zuordnung**: Neuen Benutzer einem Mandanten zuweisen
2. **Profil-Konfiguration**: Geeignetes Benutzerprofil auswählen
3. **Objektzugriff**: Relevante Objekte dem Mandanten zuordnen
4. **Testanmeldung**: Funktionalität mit Testbenutzer überprüfen

### Sicherheits-Guidelines
1. **Minimale Berechtigungen**: Nur erforderliche Zugriffe gewähren
2. **Regelmäßige Überprüfung**: Benutzerrechte periodisch kontrollieren
3. **Audit-Trail**: Änderungen an Berechtigungen protokollieren
4. **Session-Management**: Sichere Session-Konfiguration verwenden

### Troubleshooting
1. **Zugriffsprobleme**: Mandanten-Zuordnung überprüfen
2. **Fehlende Objekte**: Objektzuordnung kontrollieren
3. **Login-Fehler**: Session-Store und Datenbank-Verbindung prüfen
4. **Performance**: Mandanten-spezifische Abfragen optimieren

## Monitoring und Logging

### Benutzer-Aktivitäten
```javascript
// Console-Logging für Debugging
console.log('🔄 Synchronizing mandant selections for object:', selectedObject.name);
console.log('🔗 Auto-selecting object from URL parameter:', objectIdFromUrl);
```

### Session-Tracking
- **Login-Events**: Erfolgreiche und fehlgeschlagene Anmeldungen
- **Objektzugriffe**: Zugriff auf spezifische Objekte
- **Berechtigungsfehler**: Unberechtigte Zugriff-Versuche

## Erweiterungsmöglichkeiten

### Zukünftige Features
1. **Temporäre Zugriffe**: Zeitlich begrenzte Objektzugriffe
2. **Gruppen-Verwaltung**: Benutzergruppen mit gemeinsamen Berechtigungen
3. **API-Keys**: Programmatischer Zugriff für externe Systeme
4. **Multi-Mandanten-Zugriff**: Benutzer mit Zugriff auf mehrere Mandanten

### Integration-Möglichkeiten
1. **LDAP/AD**: Integration mit Unternehmens-Verzeichnissen
2. **SSO**: Single Sign-On mit externen Systemen
3. **Mobile Apps**: Erweiterte mobile Zugriffskontrolle
4. **Reporting**: Detaillierte Zugriffs- und Nutzungsberichte

---

*Letzte Aktualisierung: September 2025*
*Version: 2.0 - Erweitert um Mandanten-Zugriffssystem*

## Changelog

### Version 2.0 (September 2025)
- **Zwei-Level-Mandanten-System**: Dokumentation des erweiterten Zugriffssystems mit `mandantId` und `mandantAccess`
- **Praktische Beispiele**: Detaillierte Szenarien für mandantenübergreifende Zusammenarbeit
- **Erweiterte Berechtigungslogik**: Vollständige Dokumentation der Filterlogik
- **Datenfilterung**: Umfassende Beschreibung der automatischen Datenfilterung
- **Sicherheitsaspekte**: Erweiterte Sichtbarkeitsregeln und Zugriffskontrolle

### Version 1.0 (August 2025)
- Initiale Dokumentation des Benutzerverwaltungssystems
- Grundlegende Rollen und Berechtigungen
- API-Endpunkte und Authentifizierung
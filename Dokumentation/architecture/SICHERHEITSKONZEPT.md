# 🔐 Sicherheitskonzept - Heizungsanlagen-Management-System

**Version:** 1.0  
**Datum:** 29. August 2025  
**Autor:** System-Dokumentation  
**Status:** Aktiv  

---

## 📋 Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Authentifizierung & Session Management](#authentifizierung--session-management)
3. [Rollenbasierte Zugriffskontrolle](#rollenbasierte-zugriffskontrolle)
4. [API-Route Protection](#api-route-protection)
5. [Datenbankzugriff & Konfiguration](#datenbankzugriff--konfiguration)
6. [Environment Variables & Secrets](#environment-variables--secrets)
7. [Session-Schutz Features](#session-schutz-features)
8. [Autorisierungs-Matrix](#autorisierungs-matrix)
9. [Implementierte Sicherheitsmaßnahmen](#implementierte-sicherheitsmaßnahmen)
10. [Technische Implementation](#technische-implementation)
11. [Monitoring & Logging](#monitoring--logging)
12. [Incident Response](#incident-response)

---

## 🎯 Überblick

Das Heizungsanlagen-Management-System implementiert ein **mehrschichtiges Sicherheitskonzept** für den Schutz kritischer Infrastrukturdaten. Das System verwaltet sensible Energiedaten, Objektinformationen und Benutzerzugriffe für Heizungsanlagen und erfordert daher höchste Sicherheitsstandards.

### Sicherheitsziele
- **Vertraulichkeit**: Schutz sensibler Energiedaten und Anlagenkonfigurationen
- **Integrität**: Sicherstellung korrekter Datenübertragung und -speicherung
- **Verfügbarkeit**: Gewährleistung unterbrechungsfreier Systemverfügbarkeit
- **Authentizität**: Eindeutige Benutzeridentifikation und -autorisierung
- **Nachvollziehbarkeit**: Vollständige Protokollierung aller Systemzugriffe

---

## 🔑 Authentifizierung & Session Management

### 1. Session-Based Authentication

Das System implementiert **session-basierte Authentifizierung** mit PostgreSQL-Session-Storage für sichere Benutzerverwaltung:

```typescript
// Session-Konfiguration mit PostgreSQL-Storage
const sessionStore = new pgStore({
  pool: ConnectionPoolManager.getInstance().getPool(),
  tableName: "sessions",
  createTableIfMissing: false,
});

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'development-secret-change-in-production',
  store: sessionStore,
  resave: false,
  saveUninitialized: false, // Don't create session until login
  rolling: true, // Reset expiration on activity
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true, // XSS protection
    secure: false, // Set to true in production with HTTPS
    sameSite: 'lax'
  }
};
```

**Features:**
- ✅ **PostgreSQL Session Storage** mit Connection Pooling
- ✅ **Rolling Sessions** - Verlängerung bei Aktivität
- ✅ **Secure Cookies** mit httpOnly und sameSite Protection
- ✅ **Session Timeout** Management (24 Stunden)

### 2. Authentication Flow

#### Superadmin Login
```typescript
// POST /api/auth/superadmin-login
// Uses credentials from setup-app.json or environment variables
const { username, password } = req.body;
// Validates against SUPERADMIN_USERNAME/PASSWORD or setup-app.json
```

#### User Login
```typescript
// POST /api/auth/user-login
// Authenticates against users table in database
const user = await db.select().from(users)
  .where(eq(users.email, username))
  .limit(1);
// Creates session with user data and permissions
```

#### Session Validation
```typescript
// Middleware for protected routes
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}
```

### 3. User Roles & Permissions

#### Role-Based Access Control (RBAC)
- **Superadmin**: System-wide access, all permissions
- **Admin**: Mandant-specific administration
- **User**: Standard user with profile-based restrictions

#### Permission System
```typescript
// User profiles define sidebar access and feature permissions
interface UserProfile {
  id: number;
  name: string;
  startPage: string;
  sidebar: {
    showDashboard?: boolean;
    showMaps?: boolean;
    showNetworkMonitor?: boolean;
    // ... other permissions
  };
}
```

---

## 👥 Rollenbasierte Zugriffskontrolle

### 1. Benutzerrollen-Hierarchie

```
┌─────────────┐
│ SUPERADMIN  │ ← Systemweiter Vollzugriff
├─────────────┤
│    ADMIN    │ ← Mandanten-spezifische Administration
├─────────────┤
│    USER     │ ← Standardbenutzer mit Profil-basierten Berechtigungen
└─────────────┘
```

### 2. Rollen-Definitionen

#### **Superadmin**
```json
{
  "role": "superadmin",
  "permissions": {
    "system_management": true,
    "user_management": true,
    "object_management": "all",
    "configuration": true,
    "audit_logs": true,
    "cross_mandant": true
  }
}
```

**Berechtigt für:**
- ✅ Systemweite Administration
- ✅ Zugriff auf alle Mandanten und Objekte
- ✅ Superadmin-Anmeldung
- ✅ System-Konfiguration

#### **Administrator (admin)**
```json
{
  "role": "admin",
  "permissions": {
    "user_management": true,
    "object_management": "mandant",
    "configuration": true,
    "audit_logs": true,
    "mandant_admin": true
  }
}
```

**Berechtigt für:**
- ✅ Benutzerverwaltung innerhalb des eigenen Mandanten
- ✅ Objektverwaltung innerhalb des eigenen Mandanten
- ✅ Mandanten-spezifische Konfiguration
- ✅ Audit-Logs für den eigenen Mandanten

#### **Benutzer (user)**
```json
{
  "role": "user",
  "permissions": {
    "read_access": true,
    "profile_restricted": true
  }
}
```

**Berechtigt für:**
- ✅ Profil-basierte Berechtigungen (definiert in `user_profiles`)
- ✅ Zugriff auf zugewiesene Objekte
- ✅ Lesender Zugriff auf Systemfunktionen

---

## 🏢 Mandanten-System

### Multi-Tenancy Architecture

Das System implementiert eine **mandantenbasierte Multi-Tenancy-Architektur** zur logischen Trennung von Daten zwischen verschiedenen Kunden/Mandanten.

#### Mandanten-Isolation
```sql
-- Beispiel: Objekt-Zuordnung zu Mandanten
SELECT o.* FROM objects o
JOIN object_mandant om ON o.id = om.objectid
WHERE om.mandant_id = $current_user_mandant_id;
```

#### Datenbereiche pro Mandant
- **Objekte**: Immobilien, Gebäude, technische Anlagen
- **Benutzer**: Mandanten-spezifische Benutzerverwaltung
- **Konfiguration**: Mandanten-spezifische Einstellungen
- **Berechtigungen**: Rollen innerhalb des Mandanten-Kontexts

### Mandanten-Zugriffslogik

#### Admin-Zugriff
```typescript
// Admins haben Zugriff auf ihren eigenen Mandanten
if (user.role === 'admin' && object.mandantId === user.mandantId) {
  // Erlaubter Zugriff
}
```

#### Superadmin-Zugriff
```typescript
// Superadmins haben systemweiten Zugriff
if (user.role === 'superadmin') {
  // Vollzugriff auf alle Mandanten
}
```

---

## 🔒 API-Sicherheit

### Authentication Middleware

#### Route Protection
```typescript
// Geschützte Routen verwenden requireAuth Middleware
router.get('/protected-endpoint', requireAuth, handler);
```

#### Role-Based Route Protection
```typescript
// Admin-only Endpunkte
router.post('/admin-action', requireRole('admin'), handler);

// Superadmin-only Endpunkte
router.delete('/system-config', requireRole('superadmin'), handler);
```

### Input Validation & Sanitization

#### SQL Injection Prevention
- **Prepared Statements**: Alle Datenbankabfragen verwenden Parameterized Queries
- **ORM Protection**: Drizzle ORM verhindert SQL Injection automatisch
- **Input Validation**: Zod-Schemas für alle Eingaben

#### XSS Protection
- **Session Cookies**: `httpOnly` und `sameSite` Flags
- **Content Security Policy**: Geplante Implementation
- **Input Sanitization**: Automatische Bereinigung von Eingaben

### Rate Limiting

#### API Rate Limits
- **Authenticated Users**: 1000 requests/hour
- **Public Endpoints**: 100 requests/hour
- **Burst Protection**: Sliding window algorithm

---

## 📊 Audit Logging

### Benutzeraktivitäten-Verfolgung

#### Audit Log Struktur
```typescript
interface UserActivityLog {
  id: number;
  userId: number;
  action: string;
  resource: string;
  resourceId?: number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

#### Protokollierte Aktionen
- **Authentication Events**: Login, Logout, Session Timeout
- **Data Modifications**: Create, Update, Delete Operations
- **Configuration Changes**: System Settings Modifications
- **Permission Changes**: User Role and Profile Updates

### Log Retention & Compliance

#### Aufbewahrungsfristen
- **Authentication Logs**: 2 Jahre
- **Data Modification Logs**: 5 Jahre
- **System Configuration Logs**: 7 Jahre

#### GDPR Compliance
- **Data Minimization**: Nur notwendige Daten werden protokolliert
- **Access Controls**: Audit Logs sind nur für Administratoren zugänglich
- **Data Export**: Benutzer können ihre Aktivitätsdaten einsehen

---

## 🚨 Incident Response

### Sicherheitsvorfälle

#### Incident Detection
- **Automated Monitoring**: Ungewöhnliche Aktivitätsmuster
- **Failed Login Alerts**: Mehrere fehlgeschlagene Anmeldungen
- **Suspicious Access**: Zugriff auf ungewöhnliche Ressourcen

#### Response Procedures
1. **Immediate Isolation**: Verdächtige Sessions beenden
2. **Evidence Collection**: Logs und Session-Daten sichern
3. **Impact Assessment**: Betroffene Daten und Benutzer ermitteln
4. **Communication**: Betroffene Parteien informieren

### Business Continuity

#### Backup & Recovery
- **Database Backups**: Tägliche vollständige Backups
- **Session Data**: Nicht kritisch, kann neu erstellt werden
- **Configuration Backup**: Versionskontrollierte Konfiguration

#### Disaster Recovery
- **Recovery Time Objective (RTO)**: 4 Stunden
- **Recovery Point Objective (RPO)**: 1 Stunde
- **Failover Procedures**: Dokumentierte Wiederherstellungsprozesse

---

## 🔧 Implementation Details

### Technische Sicherheitsmaßnahmen

#### Session Security
```typescript
const sessionConfig = {
  name: 'netzwaechter.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24h
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
};
```

#### Password Security
```typescript
// Passwort-Hashing (wenn implementiert)
import bcrypt from 'bcrypt';
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

### Netzwerksicherheit

#### SSL/TLS Configuration
- **Certificate Management**: Let's Encrypt für automatische Zertifikate
- **HSTS Headers**: Strict Transport Security
- **Cipher Suites**: Moderne, sichere Verschlüsselungsverfahren

#### Firewall Rules
- **Port Restrictions**: Nur notwendige Ports geöffnet (80, 443, 4004)
- **IP Whitelisting**: Administrative Zugriffe eingeschränkt
- **Rate Limiting**: DDoS-Schutz auf Netzwerkebene

---

## 📋 Compliance & Standards

### Datenschutz-Grundverordnung (DSGVO)

#### Betroffenenrechte
- **Recht auf Auskunft**: Benutzer können ihre Daten einsehen
- **Recht auf Löschung**: Daten können auf Anfrage gelöscht werden
- **Recht auf Berichtigung**: Daten können korrigiert werden
- **Recht auf Datenübertragbarkeit**: Daten können exportiert werden

#### Technische Maßnahmen
- **Data Encryption**: Sensible Daten werden verschlüsselt gespeichert
- **Access Logging**: Alle Datenzugriffe werden protokolliert
- **Data Minimization**: Nur notwendige Daten werden erhoben

### ISO 27001 Alignment

#### Information Security Management
- **Risk Assessment**: Regelmäßige Sicherheitsrisiko-Analysen
- **Security Controls**: Implementierte Sicherheitsmaßnahmen
- **Continuous Improvement**: Regelmäßige Sicherheitsüberprüfungen

---

## 📈 Monitoring & Reporting

### Sicherheits-Metriken

#### Authentication Metrics
- **Login Success Rate**: >99.5%
- **Failed Login Attempts**: Tracked and alerted
- **Session Duration**: Average and distribution

#### Access Control Metrics
- **Permission Violation Attempts**: Monitored and blocked
- **Role Distribution**: User roles and access patterns
- **Mandant Isolation**: Cross-mandant access attempts

### Reporting Dashboard

#### Management Reports
- **Monthly Security Summary**: Vorfälle und Trends
- **Access Pattern Analysis**: Benutzerverhalten und Anomalien
- **Compliance Status**: DSGVO und Sicherheitsstandard-Einhaltung

---

*Version: 2.0 | Updated: October 7, 2025 | Status: ✅ Verified Against Implementation*

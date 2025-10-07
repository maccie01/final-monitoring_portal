# Layout-Dokumentation: App-Layout-Schema

## Überblick
Diese Dokumentation beschreibt das komplette Layout-System der Anwendung mit Sidebar, Detail-Bereich und Header-Structure. Das System ist für optimale Browser-Höhen-Nutzung, Responsive Design und strukturierte Navigation entwickelt.

## App-Layout-Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser Header                             │
├─────────────────────────────────────────────────────────────────┤
│ Sidebar (240px)    │              Main Content                 │
│ ┌─────────────────┐ │ ┌─────────────────────────────────────┐   │
│ │ Logo            │ │ │ Header                              │   │
│ │ Info            │ │ │ ┌─ Titel ─────────── Info ─────────┐ │   │
│ │ Slogan          │ │ │ └───────────────────────────────────┘ │   │
│ ├─────────────────┤ │ ├─────────────────────────────────────┤   │
│ │ Sidebar-Eintrag │ │ │ CardContent                         │   │
│ │ Sidebar-Eintrag │ │ │                                     │   │
│ │ Sidebar-Eintrag │ │ │      Detail-Bereich                │   │
│ │ Sidebar-Eintrag │ │ │                                     │   │
│ │ ...             │ │ │                                     │   │
│ ├─────────────────┤ │ │                                     │   │
│ │ Sidebar-Admin   │ │ │                                     │   │
│ │ Sidebar-Admin   │ │ │                                     │   │
│ ├─────────────────┤ │ │                                     │   │
│ │ User            │ │ │                                     │   │
│ │ Avatar + Rolle  │ │ │                                     │   │
│ └─────────────────┘ │ └─────────────────────────────────────┘   │
└─────────────────────┴───────────────────────────────────────────┘
```

### Layout-Struktur

#### Sidebar (240px)
- **Logo-Bereich:** Corporate Identity
- **Info:** Unternehmensbeschreibung  
- **Slogan:** Marken-Slogan
- **Sidebar-Einträge:** Navigation-Items mit Icons
- **Sidebar-Admin:** Administrative Funktionen
- **User:** Avatar, Name, Rolle

#### Main Content
- **Header:** Titel und zusätzliche Informationen
- **CardContent:** Hauptinhalt der jeweiligen Seite

## CSS-Vorlage für Layout-Schema

### Layout-Container
```css
/* Haupt-Layout Container */
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: var(--background);
}

/* Sidebar Container */
.sidebar-container {
  width: 240px;
  background-color: var(--sidebar-bg);
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.sidebar-container.collapsed {
  width: 64px;
}

/* Main Content Container */
.main-content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

### Sidebar-Bereiche
```css
/* Logo-Bereich */
.sidebar-logo {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-logo-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.sidebar-logo-slogan {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
}

/* Navigation */
.sidebar-navigation {
  flex: 1;
  padding: 16px 0;
}

.sidebar-entry {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.sidebar-entry:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.sidebar-entry.active {
  background-color: var(--primary);
  color: white;
}

.sidebar-entry-icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
}

/* Admin-Bereich */
.sidebar-admin {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 0;
}

.sidebar-admin-title {
  padding: 0 24px 8px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* User-Bereich */
.sidebar-user {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-user-info {
  display: flex;
  align-items: center;
  color: white;
}

.sidebar-user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-weight: 600;
}

.sidebar-user-details {
  flex: 1;
}

.sidebar-user-name {
  font-size: 14px;
  font-weight: 500;
}

.sidebar-user-role {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}
```

### Header-Bereich
```css
/* Page Header */
.page-header {
  background-color: white;
  border-bottom: 1px solid var(--border);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--foreground);
}

.page-subtitle {
  font-size: 14px;
  color: var(--muted-foreground);
  margin-top: 4px;
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}
```

### Content-Bereich
```css
/* Main Content */
.page-content {
  flex: 1;
  overflow: auto;
  padding: 24px;
  background-color: var(--background);
}

.card-content {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.detail-area {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  min-height: 400px;
}
```

### Responsive Design
```css
/* Mobile Anpassungen */
@media (max-width: 768px) {
  .sidebar-container {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar-container.mobile-open {
    transform: translateX(0);
  }
  
  .main-content-container {
    width: 100%;
    margin-left: 0;
  }
  
  /* Mobile Overlay */
  .mobile-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 40;
    display: none;
  }
  
  .mobile-overlay.active {
    display: block;
  }
}
```

### Farb-Variablen
```css
:root {
  /* Strawa Brand Colors */
  --strawa-blue: #0064A7;
  --strawa-gray: #f2f2f2;
  
  /* Layout Colors */
  --sidebar-bg: hsl(215, 85%, 15%);
  --primary: hsl(210, 75%, 50%);
  --background: hsl(210, 5%, 96%);
  --card: hsl(0, 0%, 100%);
  --border: hsl(20, 5.9%, 90%);
  --foreground: hsl(20, 14.3%, 4.1%);
  --muted-foreground: hsl(25, 5.3%, 44.7%);
  
  /* Custom Grays */
  --gray-10: hsl(0, 0%, 95.7%);
  --gray-20: hsl(0, 0%, 87.8%);
  --gray-50: hsl(0, 0%, 55.3%);
  --gray-80: hsl(0, 0%, 22.4%);
}

.dark {
  /* Dark Mode Overrides */
  --sidebar-bg: hsl(240, 10%, 3.9%);
  --background: hsl(240, 10%, 3.9%);
  --card: hsl(240, 10%, 3.9%);
  --border: hsl(240, 3.7%, 15.9%);
  --foreground: hsl(0, 0%, 98%);
  --strawa-gray: #2a2a2a;
}
```

### Utility-Klassen
```css
/* Layout Utilities */
.flex-layout {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.flex-1 {
  flex: 1;
}

.h-screen {
  height: 100vh;
}

.overflow-hidden {
  overflow: hidden;
}

.overflow-auto {
  overflow: auto;
}

/* Spacing */
.p-6 { padding: 24px; }
.p-4 { padding: 16px; }
.mt-8 { margin-top: 32px; }
.mb-4 { margin-bottom: 16px; }

/* Colors */
.bg-strawa-gray {
  background-color: var(--strawa-gray);
}

.bg-strawa-blue {
  background-color: var(--strawa-blue);
}

.text-strawa-blue {
  color: var(--strawa-blue);
}

/* Border Radius */
.rounded-lg {
  border-radius: 8px;
}

.rounded-md {
  border-radius: 6px;
}
```

### Layout-Container-Struktur
```tsx
<div className="flex h-screen overflow-hidden">
  {/* Sidebar */}
  <div className="w-60 bg-sidebar">...</div>
  
  {/* Main Content Area */}
  <div className="flex-1 flex flex-col">
    {/* Header */}
    <header className="bg-white border-b">...</header>
    
    {/* Detail Content */}
    <main className="flex-1 overflow-auto">...</main>
  </div>
</div>
```

## Sidebar-System

### Sidebar-Architektur
Die Sidebar besteht aus vier Hauptbereichen:

#### 1. Logo-Bereich (Header)
```tsx
<div className="p-6 border-b border-gray-500">
  <div className="flex items-center space-x-3">
    <Flame className="text-2xl text-accent" />
    {!sidebarCollapsed && (
      <div>
        <h1 className="text-lg font-semibold">{systemTitle}</h1>
        <p className="text-xs text-gray-300">Anlagen-Verwaltung</p>
      </div>
    )}
  </div>
</div>
```

**Features:**
- **System-Titel:** Dynamisch aus Datenbank geladen
- **Logo:** Flame-Icon von Lucide React
- **Untertitel:** "Anlagen-Verwaltung"
- **Responsive:** Text verschwindet bei eingeklappter Sidebar

#### 2. Navigation-Menu (Hauptbereich)
```tsx
const navigationItems = [
  { href: "/dashbord", label: "KPI Dashboard", icon: BarChart3, permission: "showDashboard" },
  { href: "/maps", label: "Objekt-Karte", icon: MapPin, permission: "showMaps" },
  { href: "/network-monitor", label: "Netzwächter", icon: Network, permission: "showNetworkMonitor" },
  // ... weitere Items
];
```

**Navigation-Item-Struktur:**
- **href:** Ziel-Route für wouter-Navigation
- **label:** Angezeigter Text (nur bei ausgeklappter Sidebar)
- **icon:** Lucide React Icon-Komponente
- **permission:** Berechtigung aus Benutzerprofil
- **adminOnly:** (optional) Nur für Administratoren sichtbar

**Icon-Set:**
- `BarChart3` - KPI Dashboard
- `MapPin` - Objekt-Karte
- `Network` - Netzwächter
- `Leaf` - Klassifizierung/Effizienz
- `Building` - Objektverwaltung
- `BookOpen` - Logbuch
- `Monitor` - Objekt-Monitoring
- `Zap` - Energiedaten
- `Cpu` - Geräteverwaltung
- `Settings` - System-Setup
- `Users` - Benutzerverwaltung
- `Shield` - Admin Dashboard

#### 3. Benutzer-Info-Bereich (Footer)
**Eingeklappt:**
```tsx
<div className="flex justify-center">
  <Avatar className="h-8 w-8">
    <AvatarFallback>{initials}</AvatarFallback>
  </Avatar>
</div>
```

**Ausgeklappt:**
```tsx
<div className="flex items-center space-x-3">
  <Avatar className="h-8 w-8" />
  <div className="flex-1 min-w-0 text-left">
    <p className="text-sm font-medium">{fullName}</p>
    <p className="text-xs text-gray-300">{role}</p>
  </div>
  <Settings className="h-4 w-4" />
</div>
```

#### 4. Toggle-Button
```tsx
<button className="absolute -right-3 top-6 bg-primary rounded-full">
  {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
</button>
```

### Sidebar-States

#### Ausgeklappt (w-60)
- **Breite:** 240px (15rem)
- **Content:** Icons + Labels + Benutzer-Details
- **Navigation:** Vollständige Item-Namen sichtbar

#### Eingeklappt (w-16)
- **Breite:** 64px (4rem)
- **Content:** Nur Icons + Avatar
- **Navigation:** Tooltips bei Hover
- **Mobile:** Zusätzliche Hervorhebung für Network-Monitor

### Responsive Verhalten

#### Desktop (≥768px)
- **Standard:** Sidebar ausgeklappt
- **Position:** Relative, im normalen Flow
- **Verhalten:** Toggle zwischen w-60 und w-16

#### Mobile (<768px)
- **Standard:** Sidebar eingeklappt oder versteckt
- **Position:** Fixed overlay bei Ausklappen
- **Overlay:** Schwarzer Hintergrund mit Opacity
- **Navigation:** Reduzierte Item-Liste

#### Mobile-spezifische Features
```tsx
// Nur wichtigste Items anzeigen
if (isMobile && sidebarCollapsed) {
  return item.href === "/network-monitor" || item.href === "/";
}

// Network-Monitor hervorheben
isMobile && sidebarCollapsed && isNetworkMonitor
  ? "bg-accent text-white ring-2 ring-accent-foreground"
  : ""
```

### Berechtigungssystem

#### Permission-Check
```tsx
.filter((item) => {
  const userProfile = user?.userProfile;
  const userRole = user?.role;
  
  // Admin-only prüfen
  if (item.adminOnly && userRole !== "admin") {
    return false;
  }
  
  // Profil-Berechtigungen prüfen
  return userProfile?.sidebar[item.permission] === true;
})
```

#### Verfügbare Berechtigungen
- `showDashboard` - KPI Dashboard
- `showMaps` - Objekt-Karte
- `showNetworkMonitor` - Netzwächter
- `showEfficiencyStrategy` - Klassifizierung
- `showObjectManagement` - Objektverwaltung
- `showLogbook` - Logbuch
- `showGrafanaDashboards` - Monitoring
- `showEnergyData` - Energiedaten
- `showDeviceManagement` - Geräte
- `showSystemSetup` - System-Setup
- `showUserManagement` - Benutzer (Admin)
- `showUser` - Eigenes Profil
- `admin` - Admin-Funktionen

## Header-System

### Header-Struktur
```tsx
<header className="bg-white border-b border-gray-20 px-6 py-4">
  <div className="flex items-center justify-between">
    {/* Links: Seitentitel */}
    <div>
      <h2 className="text-2xl font-semibold">{pageTitle}</h2>
    </div>
    
    {/* Rechts: Controls */}
    <div className="flex items-center space-x-4">
      <Bell />              <!-- Benachrichtigungen -->
      <Avatar />            <!-- Benutzer-Avatar -->
      <LogOut />            <!-- Logout-Button -->
    </div>
  </div>
</header>
```

### Dynamischer Seitentitel
```tsx
const currentItem = navigationItems.find(item => item.href === location);
const baseLabel = currentItem?.label || "KPI Dashboard Wohnungswirtschaft";

// Spezial-Formatting für bestimmte Seiten
if (location === "/efficiency") {
  return `${baseLabel} | Effizienzstrategie`;
}
```

### Header-Controls

#### Benachrichtigungen
```tsx
<div className="relative">
  <Bell className="h-5 w-5 text-gray-50 cursor-pointer" />
  <span className="absolute -top-2 -right-2 bg-error text-white text-xs rounded-full h-5 w-5">
    3
  </span>
</div>
```

#### Benutzer-Bereich
```tsx
<div className="flex items-center space-x-2">
  <Button onClick={openUserSettings}>
    <Avatar className="h-6 w-6" />
  </Button>
  <Button onClick={handleLogout} variant="outline">
    <LogOut className="h-4 w-4" />
  </Button>
</div>
```

## Detail-Bereich (Main Content)

### Content-Container-Struktur
```tsx
<main className="flex-1 overflow-auto print-content">
  <div className="print-no-break">
    {children} {/* Routed Page Content */}
  </div>
</main>
```

### Print-Optimierung
- **Print-Classes:** Spezielle CSS-Klassen für Druck-Layout
- **Sidebar-Hide:** `.print-hide-sidebar` versteckt Sidebar beim Drucken
- **Full-Width:** `.print-full-width` nutzt volle Breite
- **Content-Focus:** Nur Detail-Bereich wird gedruckt

## Spezial-Layout: Portfolio-Tabelle

### Container-Hierarchie (Dashboard-Beispiel)
```tsx
<div className="p-6 h-screen flex flex-col">  {/* Page Container */}
  <Card className="mt-8 flex-1 flex flex-col min-h-0">  {/* Portfolio Card */}
    <CardHeader>  {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <CardTitle>Portfolio Objekte</CardTitle>
        <div className="flex space-x-4">
          <Select />  {/* Effizienzklassen-Filter */}
          <Select />  {/* Gebäudetyp-Filter */}
        </div>
      </div>
    </CardHeader>
    
    <CardContent className="flex-1 flex flex-col p-0 min-h-0">  {/* Table Container */}
      <div className="flex-1 flex flex-col border rounded-md min-h-0">
        
        {/* Fixed Table Header */}
        <div className="bg-blue-100 dark:bg-blue-900 flex-shrink-0">
          <div className="grid grid-cols-7 gap-0 h-10 items-center border-b px-3">
            <div>Objekt</div>
            <div>Fläche</div>
            <div>Effizienzklasse</div>
            <div>Regenerativanteil</div>
            <div>VL-Temp</div>
            <div>RL-Temp</div>
            <div>Status</div>
          </div>
        </div>
        
        {/* Scrollable Table Body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Table Rows */}
          <div className="grid grid-cols-7 gap-0 h-10 items-center px-3">
            {/* Row Content */}
          </div>
        </div>
        
      </div>
    </CardContent>
  </Card>
</div>
```

### Kritische Layout-Eigenschaften

#### `min-h-0` - Essentiell für Scroll-Funktionalität
**Problem:** Flexbox-Items haben standardmäßig `min-height: auto`
**Lösung:** `min-h-0` ermöglicht korrektes Schrumpfen und Overflow

**Wo verwendet:**
- `CardContent` - Hauptcontainer
- `Table Container` - Tabellenrahmen  
- `Scrollable Body` - Scroll-Bereich

#### `flex-1` - Platzverteilung
**Zweck:** Nimmt verfügbaren Platz ein
**Anwendung:** Vertikale Expansion über verfügbare Höhe

#### `flex-shrink-0` - Feste Elemente  
**Zweck:** Verhindert Schrumpfen
**Anwendung:** Tabellenkopf bleibt immer sichtbar

### Grid-System
**7-Spalten-Layout:** Konsistent zwischen Header und Body
```css
.grid-cols-7 {
  grid-template-columns: repeat(7, minmax(0, 1fr));
}
```

**Spalten-Zuordnung:**
1. **Objekt** - Name des Objekts
2. **Fläche** - m²-Angabe  
3. **Effizienzklasse** - Badge mit kWh/m² und Klasse
4. **Regenerativanteil** - Prozent und kWh-Werte
5. **VL-Temp** - Vorlauftemperatur mit Styling
6. **RL-Temp** - Rücklauftemperatur mit Styling  
7. **Status** - Icon-basierte Zustandsanzeige

## Performance-Optimierungen

### Rendering-Optimierung
1. **Fester Header:** Verhindert Re-Rendering beim Scrollen
2. **CSS-Transforms:** Hardware-beschleunigte Übergänge
3. **Grid-Layout:** Effiziente Spalten-Positionierung
4. **Conditional Rendering:** Mobile vs. Desktop optimiert

### Memory-Management
- **Query Caching:** TanStack Query für API-Daten
- **Component Memoization:** React.memo für statische Komponenten
- **Event Cleanup:** useEffect Cleanup-Funktionen

## Fehlerbehebung

### Häufige Layout-Probleme

#### Scroll funktioniert nicht
**Symptom:** Tabelle scrollt nicht bei Overflow
**Lösung:** `min-h-0` zu Flex-Containern hinzufügen

#### Header scrollt mit
**Symptom:** Tabellenkopf verschwindet beim Scrollen  
**Lösung:** `flex-shrink-0` auf Header-Container

#### Inkonsistente Spaltenbreiten
**Symptom:** Header und Body haben unterschiedliche Breiten
**Lösung:** Gleiche `grid-cols-X` Klassen verwenden

#### Mobile-Sidebar zeigt nicht
**Symptom:** Sidebar auf Mobile nicht sichtbar
**Lösung:** Z-Index und Position-Klassen prüfen

### Debug-Tools
```tsx
// Layout-Debug-Klassen
className="border-2 border-red-500"  // Sichtbare Grenzen
className="bg-yellow-200"            // Bereich-Highlighting  
```

## Wartung und Updates

### Layout-Konsistenz
1. **Header-Body-Sync:** Grid-Spalten immer synchron halten
2. **Padding-System:** Einheitliches Spacing verwenden
3. **Color-Variants:** Dark-Mode für neue Komponenten

### Feature-Erweiterungen
1. **Neue Sidebar-Items:** Permission-System erweitern
2. **Zusätzliche Spalten:** Grid-System anpassen
3. **Theme-Varianten:** CSS-Variablen erweitern

Diese Dokumentation bietet eine vollständige Referenz für das Layout-System und unterstützt Entwickler bei Wartung, Debugging und Erweiterungen.
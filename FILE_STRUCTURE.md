# File Structure Documentation

Created: 2025-10-07
Timestamp: 14:30:00

## Overview

This document provides a comprehensive overview of the codebase structure for the Netzwachter monitoring application. It includes all active files, their purposes, and a list of archived files.

## Directory Structure

```
app-version-4_netzwachter/
├── server/              # Backend Express.js server
├── client/              # Frontend React application
├── shared/              # Shared types and schemas
├── archive/             # Archived/unused files
└── Dokumentation/       # Project documentation
```

## Server Directory (`/server`)

### Core Files

#### `/server/index.ts` (4.3K)
- **Purpose**: Main server entry point
- **Exports**: None (runs server)
- **Imports**: express, routes, vite, email-service, db
- **Status**: ACTIVE - Core infrastructure
- **Description**: Initializes Express server, sets up routes, middleware, and starts the application

#### `/server/db.ts` (1.6K)
- **Purpose**: Database connection and initialization
- **Exports**: `initializeDatabase`, `getPool`
- **Imports**: pg, connection-pool
- **Status**: ACTIVE - Core infrastructure
- **Description**: Manages PostgreSQL connection pool and database initialization

#### `/server/auth.ts` (4.6K)
- **Purpose**: Authentication middleware and utilities
- **Exports**: `authenticateToken`, `generateToken`, `hashPassword`, `comparePassword`
- **Imports**: bcrypt, jsonwebtoken
- **Status**: ACTIVE - Core infrastructure
- **Description**: Handles JWT authentication, password hashing, and token validation

#### `/server/storage.ts` (142K)
- **Purpose**: Large storage/data management utility
- **Exports**: Various storage functions
- **Imports**: Multiple
- **Status**: ACTIVE - Core infrastructure
- **Description**: Handles data storage, retrieval, and management operations (very large file, may need review)

#### `/server/connection-pool.ts` (12K)
- **Purpose**: Database connection pooling
- **Exports**: Connection pool functions
- **Imports**: pg
- **Status**: ACTIVE - Core infrastructure
- **Description**: Manages database connection pooling for optimal performance

#### `/server/email-service.ts` (6.2K)
- **Purpose**: Email sending functionality
- **Exports**: `emailService`
- **Imports**: nodemailer
- **Status**: ACTIVE - Core infrastructure
- **Description**: Handles SMTP email configuration and sending

#### `/server/sync-object-mandant.ts` (3.7K)
- **Purpose**: Object-Mandant synchronization
- **Exports**: Sync functions
- **Imports**: db
- **Status**: ACTIVE - Core infrastructure
- **Description**: Synchronizes objects with mandant (tenant) associations

#### `/server/vite.ts` (2.2K)
- **Purpose**: Vite development server setup
- **Exports**: `setupVite`, `serveStatic`, `log`
- **Imports**: vite, express
- **Status**: ACTIVE - Core infrastructure
- **Description**: Configures Vite for development and production builds

### Controllers (`/server/controllers/`)

#### `/server/controllers/authController.ts` (14K)
- **Purpose**: Authentication route handlers
- **Exports**: Auth controller functions
- **Imports**: db, auth utilities
- **Status**: ACTIVE
- **Used By**: `/server/routes/auth.ts`

#### `/server/controllers/databaseController.ts` (20K)
- **Purpose**: Database management operations
- **Exports**: Database controller functions
- **Imports**: db, connection-pool
- **Status**: ACTIVE
- **Used By**: `/server/routes/db.ts`

#### `/server/controllers/efficiencyController.ts` (15K)
- **Purpose**: Energy efficiency analysis
- **Exports**: Efficiency controller functions
- **Imports**: db, energy utilities
- **Status**: ACTIVE
- **Used By**: `/server/routes/efficiency.ts`

#### `/server/controllers/energyController.ts` (43K)
- **Purpose**: Energy data management (largest controller)
- **Exports**: Energy controller functions
- **Imports**: db, various utilities
- **Status**: ACTIVE
- **Used By**: `/server/routes/energy.ts`
- **Note**: Very large file (43K), may benefit from refactoring

#### `/server/controllers/kiReportController.ts` (13K)
- **Purpose**: KI (AI) report generation
- **Exports**: KI report controller functions
- **Imports**: db, AI utilities
- **Status**: ACTIVE
- **Used By**: `/server/routes/kiReport.ts`

#### `/server/controllers/monitoringController.ts` (2.9K)
- **Purpose**: System monitoring endpoints
- **Exports**: Monitoring controller functions
- **Imports**: db
- **Status**: ACTIVE
- **Used By**: `/server/routes/monitoring.ts`

#### `/server/controllers/objectController.ts` (14K)
- **Purpose**: Object (building) management
- **Exports**: Object controller functions
- **Imports**: db
- **Status**: ACTIVE
- **Used By**: `/server/routes/object.ts`

#### `/server/controllers/temperatureController.ts` (9.9K)
- **Purpose**: Temperature data management
- **Exports**: Temperature controller functions
- **Imports**: db, weather APIs
- **Status**: ACTIVE
- **Used By**: `/server/routes/temperature.ts`

#### `/server/controllers/userController.ts` (14K)
- **Purpose**: User management operations
- **Exports**: User controller functions
- **Imports**: db, auth
- **Status**: ACTIVE
- **Used By**: `/server/routes/users.ts`

#### `/server/controllers/weatherController.ts` (18K)
- **Purpose**: Weather data integration
- **Exports**: Weather controller functions
- **Imports**: db, external APIs
- **Status**: ACTIVE
- **Used By**: `/server/routes/weather.ts`

### Routes (`/server/routes/`)

#### `/server/routes/index.ts` (21K)
- **Purpose**: Main route aggregator
- **Exports**: `setupRoutes`
- **Imports**: All route modules
- **Status**: ACTIVE - Core infrastructure
- **Description**: Aggregates and registers all API routes

#### `/server/routes/auth.ts` (599B)
- **Purpose**: Authentication routes
- **Exports**: Router
- **Imports**: authController
- **Status**: ACTIVE
- **Endpoints**: `/api/login`, `/api/logout`, `/api/auth/user`

#### `/server/routes/db.ts` (834B)
- **Purpose**: Database management routes
- **Exports**: Router
- **Imports**: databaseController
- **Status**: ACTIVE
- **Endpoints**: `/api/db/status`, `/api/test-db-connection`

#### `/server/routes/efficiency.ts` (737B)
- **Purpose**: Efficiency analysis routes
- **Exports**: Router
- **Imports**: efficiencyController
- **Status**: ACTIVE
- **Endpoints**: `/api/efficiency-analysis`

#### `/server/routes/energy.ts` (1.4K)
- **Purpose**: Energy data routes
- **Exports**: Router
- **Imports**: energyController
- **Status**: ACTIVE
- **Endpoints**: `/api/energy-data`, `/api/energy`

#### `/server/routes/kiReport.ts` (782B)
- **Purpose**: KI report routes
- **Exports**: Router
- **Imports**: kiReportController
- **Status**: ACTIVE
- **Endpoints**: `/api/ki-report`

#### `/server/routes/monitoring.ts` (726B)
- **Purpose**: System monitoring routes
- **Exports**: Router
- **Imports**: monitoringController
- **Status**: ACTIVE
- **Endpoints**: `/api/monitoring`

#### `/server/routes/object.ts` (1.0K)
- **Purpose**: Object management routes
- **Exports**: Router
- **Imports**: objectController
- **Status**: ACTIVE
- **Endpoints**: `/api/objects`

#### `/server/routes/portal.ts` (1.2K)
- **Purpose**: Portal configuration routes
- **Exports**: Router
- **Imports**: Various controllers
- **Status**: ACTIVE
- **Endpoints**: `/api/portal/config`, `/api/portal/setup`

#### `/server/routes/temperature.ts` (810B)
- **Purpose**: Temperature data routes
- **Exports**: Router
- **Imports**: temperatureController
- **Status**: ACTIVE
- **Endpoints**: `/api/temperature`, `/api/outdoor-temperatures`

#### `/server/routes/users.ts` (1.2K)
- **Purpose**: User management routes
- **Exports**: Router
- **Imports**: userController
- **Status**: ACTIVE
- **Endpoints**: `/api/users`

#### `/server/routes/weather.ts` (1.0K)
- **Purpose**: Weather data routes
- **Exports**: Router
- **Imports**: weatherController
- **Status**: ACTIVE
- **Endpoints**: `/api/weather`

### Middleware (`/server/middleware/`)

#### `/server/middleware/auth.ts` (2.6K)
- **Purpose**: Authentication middleware
- **Exports**: `requireAuth`, `optionalAuth`
- **Imports**: auth utilities
- **Status**: ACTIVE
- **Description**: Express middleware for route authentication

#### `/server/middleware/error.ts` (3.8K)
- **Purpose**: Error handling middleware
- **Exports**: `errorHandler`, `notFoundHandler`
- **Imports**: None
- **Status**: ACTIVE
- **Description**: Centralized error handling for Express

## Client Directory (`/client/src`)

### Core Files

#### `/client/src/App.tsx` (4.5K)
- **Purpose**: Main React application component
- **Exports**: `App` (default)
- **Imports**: All page components, routing, hooks
- **Status**: ACTIVE - Core infrastructure
- **Description**: Main application component with routing logic

#### `/client/src/main.tsx` (300B estimate)
- **Purpose**: React application entry point
- **Exports**: None (mounts React app)
- **Imports**: React, ReactDOM, App
- **Status**: ACTIVE - Core infrastructure
- **Description**: Renders the root React component

### Pages (`/client/src/pages/`)

#### `/client/src/pages/AdminDashboard.tsx`
- **Purpose**: Admin dashboard page
- **Status**: ACTIVE
- **Route**: `/admin-dashboard`
- **Description**: Administrative dashboard for system management

#### `/client/src/pages/ApiManagement.tsx`
- **Purpose**: API testing and documentation interface
- **Status**: ACTIVE
- **Route**: `/api-management`, `/api-test`, `/api-tests`
- **Description**: Interactive API endpoint testing tool

#### `/client/src/pages/Dashboard.tsx`
- **Purpose**: Main user dashboard
- **Status**: ACTIVE
- **Route**: `/dashboard`
- **Description**: Primary dashboard view for authenticated users

#### `/client/src/pages/DbEnergyDataConfig.tsx`
- **Purpose**: Database energy data configuration
- **Status**: ACTIVE
- **Route**: `/db-energy-config`
- **Description**: Configuration interface for energy data sources

#### `/client/src/pages/Devices.tsx`
- **Purpose**: Device management interface
- **Status**: ACTIVE
- **Route**: `/devices`
- **Description**: Manage monitoring devices and sensors

#### `/client/src/pages/EfficiencyAnalysis.tsx`
- **Purpose**: Energy efficiency analysis view
- **Status**: ACTIVE
- **Route**: `/efficiency`
- **Description**: Displays energy efficiency metrics and analysis

#### `/client/src/pages/EnergyData.tsx`
- **Purpose**: Energy data visualization
- **Status**: ACTIVE
- **Route**: `/energy-data`
- **Description**: View and analyze energy consumption data

#### `/client/src/pages/Geraeteverwaltung.tsx`
- **Purpose**: German device management (alternative to Devices)
- **Status**: ACTIVE
- **Route**: `/geraeteverwaltung`
- **Description**: German-language device management interface

#### `/client/src/pages/GrafanaDashboard.tsx`
- **Purpose**: Grafana dashboard integration
- **Status**: ACTIVE
- **Route**: `/grafana-dashboards`, `/grafana-dashboard`
- **Description**: Embedded Grafana dashboards

#### `/client/src/pages/Info.tsx`
- **Purpose**: Information/about page
- **Status**: ACTIVE
- **Route**: Not directly routed (may be accessed via Layout)
- **Description**: Application information and help

#### `/client/src/pages/Landing.tsx`
- **Purpose**: Landing page (currently unused)
- **Status**: ACTIVE but NOT USED in routing
- **Route**: None
- **Description**: May be intended for future use or legacy

#### `/client/src/pages/LayoutStrawa.tsx`
- **Purpose**: Strawa UI layout variant
- **Status**: ACTIVE
- **Route**: `/` (homepage for non-cockpit mode)
- **Description**: Alternative 4-tab layout for specific UI mode

#### `/client/src/pages/Logbook.tsx`
- **Purpose**: System logbook
- **Status**: ACTIVE
- **Route**: `/logbook`
- **Description**: View and manage system log entries

#### `/client/src/pages/Login.tsx`
- **Purpose**: Standard login page
- **Status**: ACTIVE
- **Route**: `/login`
- **Description**: User authentication interface

#### `/client/src/pages/LoginStrawa.tsx`
- **Purpose**: Strawa-style login
- **Status**: ACTIVE
- **Route**: `/anmelden`, `/` (when not authenticated)
- **Description**: Alternative login interface for Strawa mode

#### `/client/src/pages/Maps.tsx`
- **Purpose**: Geographic map view
- **Status**: ACTIVE
- **Route**: `/maps`
- **Description**: Map-based visualization of objects/buildings

#### `/client/src/pages/ModbusConfig.tsx`
- **Purpose**: Modbus protocol configuration
- **Status**: ACTIVE
- **Route**: `/modbusConfig`
- **Description**: Configure Modbus device connections

#### `/client/src/pages/NetworkMonitor.tsx`
- **Purpose**: Network monitoring interface
- **Status**: ACTIVE
- **Route**: `/network-monitor`
- **Description**: Monitor network status and connectivity

#### `/client/src/pages/ObjectManagement.tsx`
- **Purpose**: Building/object management
- **Status**: ACTIVE
- **Route**: `/objects`, `/objektverwaltung`
- **Description**: Manage monitored buildings and locations

#### `/client/src/pages/PerformanceTest.tsx`
- **Purpose**: Database performance testing
- **Status**: ACTIVE
- **Route**: `/performance-test`
- **Description**: Run performance benchmarks and tests

#### `/client/src/pages/SuperadminLogin.tsx`
- **Purpose**: Superadmin authentication
- **Status**: ACTIVE
- **Route**: `/superadmin-login`
- **Description**: Special login for system administrators

#### `/client/src/pages/SystemSettings.tsx`
- **Purpose**: System configuration
- **Status**: ACTIVE
- **Route**: `/system-setup`, `/setup`
- **Description**: Configure system-wide settings

#### `/client/src/pages/TemperatureAnalysis.tsx`
- **Purpose**: Temperature data analysis
- **Status**: ACTIVE
- **Route**: `/temperature-analysis`, `/temperatur-analyse`
- **Description**: Analyze temperature trends and correlations

#### `/client/src/pages/User.tsx`
- **Purpose**: User profile page
- **Status**: ACTIVE
- **Route**: `/user`
- **Description**: View and edit user profile

#### `/client/src/pages/UserManagement.tsx`
- **Purpose**: User administration
- **Status**: ACTIVE
- **Route**: `/users`, `/UserManagement`, `/user-management`, `/User-Management`
- **Description**: Manage system users (admin only)

#### `/client/src/pages/UserSettings.tsx`
- **Purpose**: User preferences
- **Status**: ACTIVE
- **Route**: `/user-settings`
- **Description**: User-specific settings and preferences

#### `/client/src/pages/not-found.tsx`
- **Purpose**: 404 error page
- **Status**: ACTIVE
- **Route**: Fallback route
- **Description**: Displayed when route not found

### Components (`/client/src/components/`)

#### Core Components

- **`/client/src/components/Layout.tsx`** - Main application layout with sidebar (ACTIVE)
- **`/client/src/components/DatabaseStatusHeader.tsx`** - Database connection status indicator (ACTIVE)
- **`/client/src/components/SessionWarning.tsx`** - Session timeout warning (ACTIVE)

#### Portal & Configuration

- **`/client/src/components/CollapsiblePortalCards.tsx`** - Collapsible portal configuration cards (ACTIVE)
- **`/client/src/components/CurrentDatabaseConnection.tsx`** - Current DB connection display (ACTIVE)
- **`/client/src/components/JsonConfigurationEditor.tsx`** - JSON config editor (ACTIVE)
- **`/client/src/components/OriginalConfigurationEditor.tsx`** - Original config editor (ACTIVE)
- **`/client/src/components/PortalConfigCard.tsx`** - Portal config card component (ACTIVE)
- **`/client/src/components/PortalJsonEditor.tsx`** - Portal JSON editor (ACTIVE)
- **`/client/src/components/SystemPortalSetup.tsx`** - System portal setup interface (ACTIVE)
- **`/client/src/components/SystemSchemaView.tsx`** - Database schema viewer (ACTIVE)
- **`/client/src/components/FallbackDatabaseAccess.tsx`** - Fallback DB access component (ACTIVE)

#### Object & Data Management

- **`/client/src/components/ObjectFilterAPI.tsx`** - Object filtering API interface (ACTIVE)
- **`/client/src/components/ObjectListLayout.tsx`** - Object list layout component (ACTIVE)
- **`/client/src/components/ObjektinfoContent.tsx`** - Object information content (ACTIVE)

#### Energy & Analysis

- **`/client/src/components/EfficiencyDistributionCard.tsx`** - Efficiency distribution visualization (ACTIVE)
- **`/client/src/components/TemperatureEfficiencyChart.tsx`** - Temperature vs efficiency chart (ACTIVE)
- **`/client/src/components/ExportDialog.tsx`** - Data export dialog (ACTIVE)

#### Grafana Integration

- **`/client/src/components/GrafanaDiagramme.tsx`** - Grafana diagram components (ACTIVE)
- **`/client/src/components/GrafanaLogic.tsx`** - Grafana logic handler (ACTIVE)
- **`/client/src/components/GrafanaReport.tsx`** - Grafana report generator (ACTIVE)

#### KI/AI Components

- **`/client/src/components/KI_energy.tsx`** - AI energy analysis (ACTIVE)
- **`/client/src/components/KI_energy_jahr.tsx`** - AI yearly energy analysis (ACTIVE)
- **`/client/src/components/KI_energy_jahr_wrapper.tsx`** - AI yearly wrapper (ACTIVE)
- **`/client/src/components/KI_energy_netz.tsx`** - AI network energy analysis (ACTIVE)

#### User Interface

- **`/client/src/components/LoginModal.tsx`** - Login modal dialog (ACTIVE)
- **`/client/src/components/UserSettingsModal.tsx`** - User settings modal (ACTIVE)
- **`/client/src/components/TabLayout.tsx`** - Tab layout component (ACTIVE)
- **`/client/src/components/NetzView.tsx`** - Network view component (ACTIVE)
- **`/client/src/components/deviceanmeldung.tsx`** - Device registration component (ACTIVE)

#### Netzstrawa Components (`/client/src/components/netzstrawa/`)

- **`/client/src/components/netzstrawa/sidebar.tsx`** - Netzstrawa sidebar (ACTIVE)
- **`/client/src/components/netzstrawa/slide-network-monitor.tsx`** - Network monitor slider (ACTIVE)

#### Shared Utilities (`/client/src/components/shared/`)

- **`/client/src/components/shared/energy-utils.tsx`** - Shared energy utility functions (ACTIVE)

#### UI Components (`/client/src/components/ui/`)

All UI components in this directory are from shadcn/ui library and are ACTIVE:

- accordion.tsx
- alert-dialog.tsx
- alert.tsx
- aspect-ratio.tsx
- avatar.tsx
- badge.tsx
- breadcrumb.tsx
- button.tsx
- calendar.tsx
- card.tsx
- carousel.tsx
- chart.tsx
- checkbox.tsx
- collapsible.tsx
- command.tsx
- context-menu.tsx
- dialog.tsx
- drawer.tsx
- dropdown-menu.tsx
- form.tsx
- hover-card.tsx
- input-otp.tsx
- input.tsx
- label.tsx
- menubar.tsx
- navigation-menu.tsx
- pagination.tsx
- popover.tsx
- progress.tsx
- radio-group.tsx
- resizable.tsx
- scroll-area.tsx
- select.tsx
- separator.tsx
- sheet.tsx
- sidebar.tsx
- skeleton.tsx
- slider.tsx
- switch.tsx
- table.tsx
- tabs.tsx
- textarea.tsx
- toast.tsx
- toaster.tsx
- toggle-group.tsx
- toggle.tsx
- tooltip.tsx
- StandardTable.tsx

### Hooks (`/client/src/hooks/`)

- **`/client/src/hooks/useAuth.ts`** - Authentication hook (ACTIVE)
- **`/client/src/hooks/useUIMode.ts`** - UI mode detection hook (ACTIVE)
- **`/client/src/hooks/use-toast.ts`** - Toast notification hook (ACTIVE)
- **`/client/src/hooks/use-mobile.tsx`** - Mobile detection hook (ACTIVE)

### Libraries (`/client/src/lib/`)

- **`/client/src/lib/utils.ts`** - General utility functions (ACTIVE)
- **`/client/src/lib/userActivityLogger.ts`** - User activity logging (ACTIVE)
- **`/client/src/lib/authUtils.ts`** - Authentication utilities (ACTIVE)
- **`/client/src/lib/queryClient.ts`** - React Query client configuration (ACTIVE)
- **`/client/src/lib/api-utils.ts`** - API utility functions (ACTIVE)

### Utils (`/client/src/utils/`)

- **`/client/src/utils/grafanaConfig.ts`** - Grafana configuration utilities (ACTIVE)

### Contexts (`/client/src/contexts/`)

- **`/client/src/contexts/CockpitContext.tsx`** - Cockpit state management context (ACTIVE)

## Shared Directory (`/shared`)

#### `/shared/schema.ts`
- **Purpose**: Shared TypeScript types and schemas
- **Exports**: Type definitions used by both client and server
- **Imports**: None
- **Status**: ACTIVE - Core infrastructure
- **Description**: Common data structures and type definitions

## Archive Directory (`/archive`)

Files moved to archive during cleanup on 2025-10-07:

### Root Level (`/archive/root/`)

- **`db_test.js`** (from root directory)
  - Reason: Test/debugging script, not part of production code
  - Was imported by: None

### Client Pages (`/archive/client/pages/`)

- **`ApiManagement_copy.tsx`** (originally `ApiManagement (copy).tsx`)
  - Reason: Duplicate file (copy of ApiManagement.tsx)
  - Was imported by: None

- **`GrafanaBoard.tsx`**
  - Reason: Unused page, not imported anywhere
  - Was imported by: None
  - Note: Appears to be superseded by GrafanaDashboard.tsx

- **`GrafanaTest.tsx`**
  - Reason: Test page for Grafana integration, not used in production
  - Was imported by: None
  - Note: Test/development file

### Client Components (`/archive/client/components/`)

- **`TabLayoutExample.tsx`**
  - Reason: Example/template file, not used in production
  - Was imported by: None
  - Note: Example implementation

- **`ObjectListTemplate.tsx`**
  - Reason: Template file, not imported anywhere
  - Was imported by: None
  - Note: May have been superseded by ObjectListLayout.tsx

- **`UserProfileRedirect.tsx`**
  - Reason: Not imported anywhere, unused redirect component
  - Was imported by: None

### Previously Archived (`/archive/`)

- **`GrafanaDiagramme_alt.tsx`** (archived before 2025-10-07)
  - Reason: Alternative version, replaced by current implementation

## File Statistics

### Server
- Total files: 31
- Controllers: 10
- Routes: 12
- Middleware: 2
- Core files: 7

### Client
- Total pages: 30 (3 archived = 27 active)
- Total components: 33 custom + 53 UI components = 86 total (3 archived = 83 active)
- Hooks: 4
- Libraries: 5
- Utils: 1
- Contexts: 1

### Total Active Files
- Server: 31 files
- Client: 147 files (pages + components + hooks + libs + utils + contexts)
- Shared: 1 file
- **Total: 179 active code files**

### Total Archived Files
- 7 files moved to archive

## Key Architectural Patterns

### Server Architecture
- **Pattern**: MVC-style with controllers and routes
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT-based with bcrypt password hashing
- **API**: RESTful endpoints

### Client Architecture
- **Pattern**: Component-based React with hooks
- **Routing**: Wouter (lightweight React router)
- **State Management**: React Query + Context API
- **UI Library**: shadcn/ui (Radix UI components)
- **Styling**: Tailwind CSS

### File Naming Conventions
- **Server**: camelCase for files (e.g., `authController.ts`)
- **Client**: PascalCase for components (e.g., `Dashboard.tsx`)
- **Routes**: lowercase with hyphens in URLs (e.g., `/api/energy-data`)

## Recommendations

### High Priority

1. **Review storage.ts (142K)**
   - This file is very large and may benefit from being split into modules
   - Consider breaking into: storage-energy.ts, storage-objects.ts, etc.

2. **Review energyController.ts (43K)**
   - Largest controller, consider splitting into:
     - energyController.ts (main CRUD operations)
     - energyAnalysisController.ts (analysis functions)
     - energyExportController.ts (export functions)

3. **Fix routing typo**
   - Route `/dashbord` should be `/dashboard`
   - Update in App.tsx line 100

4. **Landing.tsx**
   - Currently imported but not used in routing
   - Decision needed: Remove or integrate into routing

### Medium Priority

1. **Consolidate device management**
   - Both `Devices.tsx` and `Geraeteverwaltung.tsx` exist
   - Consider whether both are needed or if one should be the primary interface

2. **Review test/development pages**
   - `PerformanceTest.tsx` is in production code
   - Consider moving to a development-only route or separate build

3. **Standardize route naming**
   - Multiple routes point to UserManagement: `/users`, `/UserManagement`, `/user-management`, `/User-Management`
   - Consolidate to single canonical route

### Low Priority

1. **Documentation**
   - Add JSDoc comments to all exported functions
   - Document API endpoints more thoroughly

2. **Type Safety**
   - Review any `any` types and replace with specific types
   - Ensure all API responses are properly typed

## Notes

- All archived files are preserved in `/archive` with original directory structure
- No files were permanently deleted
- All imports verified before archival
- Active files all have at least one import reference or are entry points

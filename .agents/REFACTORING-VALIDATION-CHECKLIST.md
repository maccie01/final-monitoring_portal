# Netzwächter Refactoring Validation Checklist

**Created**: 2025-10-08
**Purpose**: Complete validation checklist to verify refactored application is functionally complete
**Usage**: Test each item after refactoring to ensure no functionality is lost

---

## 📋 Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Page Navigation & Routing](#page-navigation--routing)
3. [API Endpoints](#api-endpoints)
4. [Dashboard & Analytics](#dashboard--analytics)
5. [User Management](#user-management)
6. [Object Management](#object-management)
7. [Energy Data](#energy-data)
8. [Temperature Analysis](#temperature-analysis)
9. [System Configuration](#system-configuration)
10. [Data Export & Reports](#data-export--reports)

---

## 1. Authentication & Authorization

### 1.1 Login Functionality
- [ ] Regular user login via `/login` works
- [ ] Strawa UI login via `/anmelden` works
- [ ] Superadmin login via `/superadmin-login` works
- [ ] Session persistence after page refresh
- [ ] Logout functionality clears session
- [ ] Session timeout warning displays correctly
- [ ] Rate limiting on login endpoints (max 5 attempts/15min)

### 1.2 Authorization Levels
- [ ] **Regular User**: Access to assigned mandant objects only
- [ ] **Admin User**: Access to all mandant objects
- [ ] **Superadmin**: Access to system-wide settings
- [ ] **User Profiles**: Sidebar permissions work correctly
- [ ] **Mandant Roles**: besitzer/verwalter/handwerker permissions enforced

### 1.3 Session Management
- [ ] Session stored with bcrypt-hashed password (never plaintext)
- [ ] HttpOnly cookies prevent XSS attacks
- [ ] Secure cookies in production (HTTPS only)
- [ ] SameSite='strict' prevents CSRF
- [ ] Session secret rotation supported

**API Endpoints:**
```
POST /api/auth/user-login          - User authentication
POST /api/auth/superadmin-login    - Superadmin authentication
POST /api/auth/logout              - Logout user
GET  /api/auth/user                - Get current user session
```

---

## 2. Page Navigation & Routing

### 2.1 Public Pages
- [ ] `/login` - Main login page (loads)
- [ ] `/anmelden` - Strawa login page (loads)
- [ ] `/superadmin-login` - Superadmin login (loads)

### 2.2 Authenticated Pages (24 pages total)
- [ ] `/` - Homepage (4-tab Strawa layout or dashboard)
- [ ] `/dashbord` - KPI Dashboard (typo intentional in route)
- [ ] `/maps` - Object map view
- [ ] `/energy-data` - Energy consumption data
- [ ] `/network-monitor` - Network monitoring
- [ ] `/efficiency` - Efficiency analysis
- [ ] `/objects` OR `/objektverwaltung` - Object management
- [ ] `/users` OR `/user-management` - User management (4 route aliases)
- [ ] `/user` - User profile
- [ ] `/user-settings` - User settings
- [ ] `/system-setup` OR `/setup` - System settings
- [ ] `/logbook` - Activity logbook
- [ ] `/grafana-dashboards` - Grafana integration
- [ ] `/temperature-analysis` OR `/temperatur-analyse` - Temperature analysis
- [ ] `/admin-dashboard` - Admin control panel
- [ ] `/api-management` OR `/api-test` - API testing
- [ ] `/db-energy-config` - Database energy configuration
- [ ] `/performance-test` - Performance testing tools
- [ ] `/modbusConfig` - Modbus device configuration
- [ ] `/devices` - Device management
- [ ] `/geraeteverwaltung` - Device administration (German)
- [ ] `/layout` - Layout component test page

### 2.3 UI Modes
- [ ] **Cockpit Mode** (`?ui=cockpit`): Large sidebar navigation
- [ ] **Strawa Mode** (default): 4-tab layout (Karte, KPI, Energiedaten, Netzwächter)
- [ ] UI mode switches correctly based on query parameter

---

## 3. API Endpoints

### 3.1 Core APIs (94 endpoints total)

#### Health & Status
- [ ] `GET /api/health` - API health check
- [ ] `GET /api/database/status` - Database connection status

#### Authentication (4 endpoints)
- [ ] `POST /api/auth/user-login` - User login
- [ ] `POST /api/auth/superadmin-login` - Superadmin login
- [ ] `POST /api/auth/logout` - User logout
- [ ] `GET /api/auth/user` - Get current user

#### Users (9 endpoints)
- [ ] `GET /api/users` - Get all users
- [ ] `GET /api/users/:id` - Get user by ID
- [ ] `POST /api/users` - Create new user
- [ ] `PATCH /api/users/:id` - Update user (partial)
- [ ] `DELETE /api/users/:id` - Delete user
- [ ] `POST /api/users/:id/change-password` - Change password
- [ ] `GET /api/users/profiles/list` - Get user profiles
- [ ] `POST /api/users/profiles` - Create user profile
- [ ] `PUT /api/users/profiles/:id` - Update user profile
- [ ] `DELETE /api/users/profiles/:id` - Delete user profile

#### User Profiles (4 endpoints)
- [ ] `GET /api/user-profiles` - Get all profiles
- [ ] `POST /api/user-profiles` - Create profile
- [ ] `PUT /api/user-profiles/:id` - Update profile
- [ ] `DELETE /api/user-profiles/:id` - Delete profile

#### Mandants (3 endpoints)
- [ ] `GET /api/mandants` - Get all mandants
- [ ] `POST /api/mandants` - Create mandant
- [ ] `PATCH /api/mandants/:id` - Update mandant
- [ ] `DELETE /api/mandants/:id` - Delete mandant

#### Objects (9 endpoints)
- [ ] `GET /api/objects` - Get all objects
- [ ] `GET /api/objects/:id` - Get object by ID
- [ ] `GET /api/objects/by-objectid/:objectId` - Get by objectId
- [ ] `GET /api/objects/hierarchy/:mandantId` - Get object hierarchy
- [ ] `GET /api/objects/:id/children` - Get child objects
- [ ] `POST /api/objects` - Create object
- [ ] `PUT /api/objects/:id` - Update object
- [ ] `DELETE /api/objects/:id` - Delete object

#### Object Groups (4 endpoints)
- [ ] `GET /api/object-groups` - Get all groups
- [ ] `POST /api/object-groups` - Create group
- [ ] `PATCH /api/object-groups/:id` - Update group
- [ ] `DELETE /api/object-groups/:id` - Delete group

#### Energy Data (6 endpoints)
- [ ] `GET /api/energy-data` - Get energy data
- [ ] `POST /api/energy-data` - Create energy data
- [ ] `GET /api/daily-consumption/:objectId` - Daily consumption
- [ ] `GET /api/monthly-consumption/:objectId` - Monthly consumption
- [ ] `GET /api/energy-data-meters/:objectId` - Meter-specific data
- [ ] `GET /api/energy-data/temperature-efficiency-chart/:objectId` - Combined chart

#### Public Energy Endpoints (3 endpoints - no auth)
- [ ] `GET /api/public-daily-consumption/:objectId` - Public daily data
- [ ] `GET /api/public-monthly-consumption/:objectId` - Public monthly data
- [ ] `GET /api/monthly-netz/:objectId` - Network monthly data

#### Temperature Analysis (5 endpoints)
- [ ] `GET /api/settings/thresholds` - Temperature thresholds
- [ ] `GET /api/temperature-analysis/:objectId` - Analyze object
- [ ] `GET /api/temperature-analysis` - Analyze all objects
- [ ] `GET /api/outdoor-temperatures/postal-code/:postalCode/latest` - Latest temp
- [ ] `GET /api/outdoor-temperatures/postal-code/:postalCode` - Temperature history
- [ ] `POST /api/outdoor-temperatures/restore-climate-data` - Restore data
- [ ] `POST /api/outdoor-temperatures/import-2023-climate` - Import 2023 data

#### Efficiency Analysis (2 endpoints)
- [ ] `GET /api/efficiency-analysis/:objectId` - Efficiency metrics
- [ ] `GET /api/test-efficiency-analysis/:objectId` - Public test endpoint

#### KI Reports (1 endpoint)
- [ ] `GET /api/yearly-summary/:objectId` - AI yearly summary

#### Dashboard (1 endpoint)
- [ ] `GET /api/dashboard/kpis` - Dashboard KPI metrics

#### Database Config (5 endpoints)
- [ ] `GET /api/status` - Database status
- [ ] `GET /api/objects` - Get objects from DB
- [ ] `GET /api/mandants` - Get mandants from DB
- [ ] `GET /api/settings` - Get settings
- [ ] `POST /api/settings` - Save setting

#### Portal Config (9 endpoints)
- [ ] `GET /api/portal/config` - Portal configuration
- [ ] `GET /api/portal/fallback-config` - Fallback config
- [ ] `POST /api/portal/save-fallback-config` - Save fallback
- [ ] `POST /api/portal/test-connection` - Test DB connection
- [ ] `GET /api/portal/load-config/:configType` - Load config
- [ ] `POST /api/portal/test-config/:configType` - Test config
- [ ] `POST /api/portal/save-config/:configType` - Save config
- [ ] `POST /api/portal/activate-config` - Activate config
- [ ] `GET /api/portal/active-config` - Get active config

#### Setup & Configuration (1 endpoint)
- [ ] `GET /api/setup-config` - Get setup configuration

#### User Activity Logs (3 endpoints)
- [ ] `GET /api/user-logs` - Get user logs
- [ ] `GET /api/user-activity-logs/:timeRange?` - Get logs with time filter (1d/7d/30d)
- [ ] `POST /api/user-activity-logs` - Create activity log

#### Export & Email (1 endpoint)
- [ ] `POST /api/export/send-email` - Send PDF export via email

#### Legacy Compatibility (1 endpoint)
- [ ] `GET /api/temperature-efficiency-chart/:objectId` - Legacy chart endpoint

---

## 4. Dashboard & Analytics

### 4.1 Main Dashboard (`/dashbord`)
- [ ] KPI cards display correctly
- [ ] Real-time data updates
- [ ] Responsive grid layout
- [ ] Chart visualizations load

### 4.2 Admin Dashboard (`/admin-dashboard`)
- [ ] Superadmin-only access enforced
- [ ] System metrics displayed
- [ ] Database health indicators
- [ ] User statistics

### 4.3 KPI Dashboard (Strawa Tab 2)
- [ ] 4-tab navigation works
- [ ] KPI metrics load from API
- [ ] Date range filtering works
- [ ] Export functionality

---

## 5. User Management

### 5.1 User CRUD Operations (`/user-management`)
- [ ] List all users
- [ ] Create new user with validation
- [ ] Edit existing user
- [ ] Delete user (with confirmation)
- [ ] Change user password
- [ ] Assign user to mandant
- [ ] Assign user profile

### 5.2 User Profiles
- [ ] List all user profiles
- [ ] Create custom profile
- [ ] Edit profile permissions
- [ ] Delete profile
- [ ] Assign profile to users

### 5.3 User Settings (`/user-settings`)
- [ ] View own profile
- [ ] Update own settings
- [ ] Change own password
- [ ] View assigned objects

### 5.4 User Activity Logs
- [ ] View activity logs (1d/7d/30d)
- [ ] Log actions automatically
- [ ] Display user, action, timestamp
- [ ] Export logs

---

## 6. Object Management

### 6.1 Object CRUD (`/objects`)
- [ ] List all objects (hierarchy)
- [ ] Filter by mandant
- [ ] Create new object
- [ ] Edit object details
- [ ] Delete object
- [ ] Parent-child relationships
- [ ] Object groups management

### 6.2 Object Hierarchy
- [ ] Tree view of objects
- [ ] Expand/collapse nodes
- [ ] Breadcrumb navigation

### 6.3 Object Map (`/maps`)
- [ ] Map displays all objects
- [ ] Markers show locations
- [ ] Click marker shows details
- [ ] Filter objects on map

### 6.4 Object Groups
- [ ] Create object group
- [ ] Assign objects to group
- [ ] Edit group
- [ ] Delete group

---

## 7. Energy Data

### 7.1 Energy Data View (`/energy-data`)
- [ ] Daily consumption charts
- [ ] Monthly consumption charts
- [ ] Meter-specific data
- [ ] Date range selection
- [ ] Export to CSV/PDF

### 7.2 Energy Analytics
- [ ] Temperature-efficiency correlation
- [ ] Consumption trends
- [ ] Peak usage analysis

### 7.3 Database Energy Config (`/db-energy-config`)
- [ ] Configure energy meters
- [ ] Set meter multipliers
- [ ] Import energy data
- [ ] Export energy data

---

## 8. Temperature Analysis

### 8.1 Temperature Analysis Page (`/temperature-analysis`)
- [ ] Outdoor temperature data loads
- [ ] Temperature by postal code
- [ ] Latest temperature display
- [ ] Historical temperature charts
- [ ] Import climate data (2023)
- [ ] Restore climate data

### 8.2 Temperature-Efficiency Correlation
- [ ] Combined chart displays
- [ ] Time range selection
- [ ] Legacy API compatibility

### 8.3 Temperature Thresholds
- [ ] View thresholds from API
- [ ] Alert indicators when exceeded

---

## 9. System Configuration

### 9.1 System Setup (`/system-setup`)
- [ ] General settings config
- [ ] Email service config (SMTP)
- [ ] Database connection settings
- [ ] API key management
- [ ] Superadmin-only access

### 9.2 Portal Configuration
- [ ] Primary database config
- [ ] Fallback database config
- [ ] Test database connection
- [ ] Activate configuration
- [ ] View active configuration

### 9.3 API Management (`/api-management`)
- [ ] Test API endpoints
- [ ] View API response times
- [ ] Debug mode toggle
- [ ] API rate limit monitoring

### 9.4 Modbus Configuration (`/modbusConfig`)
- [ ] Configure Modbus devices
- [ ] Set device addresses
- [ ] Test connections

### 9.5 Device Management (`/devices`, `/geraeteverwaltung`)
- [ ] List all devices
- [ ] Add new device
- [ ] Configure device settings
- [ ] Remove device

---

## 10. Data Export & Reports

### 10.1 PDF Export
- [ ] Generate PDF from data
- [ ] Send PDF via email
- [ ] Email attachment works
- [ ] SMTP TLS security

### 10.2 KI Reports
- [ ] AI-generated yearly summary
- [ ] Summary includes key metrics
- [ ] Export report

### 10.3 Logbook (`/logbook`)
- [ ] View system events
- [ ] Filter by date/type
- [ ] Search functionality
- [ ] Export logs

---

## 11. Logging Consistency

### 11.1 Logging Standards
- [ ] All modules use consistent logging format
- [ ] Error logging includes context (module, operation, params)
- [ ] Security events logged (login, logout, unauthorized access)
- [ ] Performance logging for slow operations (>100ms)
- [ ] Business events logged (user created, object updated, report generated)

### 11.2 Backend Module Logging
- [ ] **Auth Module**: Login attempts, password failures, session events logged
- [ ] **Users Module**: User CRUD operations logged with context
- [ ] **Objects Module**: Object CRUD logged, search operations logged
- [ ] **Energy Module**: Energy queries >100ms logged, aggregations logged
- [ ] **Temperature Module**: Temperature data import logged
- [ ] **Monitoring Module**: Health check failures logged
- [ ] **KI Reports Module**: Report generation logged
- [ ] **Settings Module**: Configuration changes logged

### 11.3 Logging Utility
- [ ] `server/utils/logger.ts` created and used consistently
- [ ] All `console.error/warn/info` replaced with logger
- [ ] Contextual information included (userId, objectId, mandantId)
- [ ] Stack traces included in error logs

### 11.4 Audit Report
- [ ] LOGGING-AUDIT.md created with module-by-module analysis
- [ ] All catch blocks have proper error logging
- [ ] No silent failures (all errors logged)

---

## 📊 Testing Metrics

### Coverage Goals
- [ ] **Page Load**: All 24 pages load without errors
- [ ] **API Coverage**: All 94 endpoints return expected responses
- [ ] **Authentication**: All 3 auth methods work
- [ ] **CRUD Operations**: Create, Read, Update, Delete tested
- [ ] **Data Visualization**: Charts and graphs render
- [ ] **Security**: Rate limiting, auth, authorization enforced
- [ ] **Logging**: All modules log consistently

### Performance Benchmarks
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms (avg)
- [ ] Database query time < 200ms (avg)
- [ ] Bundle size < 2.5MB (gzipped < 700KB)

### Security Validation
- [ ] No plaintext passwords in storage
- [ ] All endpoints require auth (except public)
- [ ] Session cookies are HttpOnly + Secure
- [ ] Rate limiting prevents brute force
- [ ] SQL injection prevention
- [ ] XSS prevention (sanitized inputs)
- [ ] CSRF protection (SameSite cookies)

---

## 🚀 Automated Testing Script

```bash
#!/bin/bash
# Run this script to validate all critical endpoints

BASE_URL="http://localhost:5000"

echo "🧪 Testing Netzwächter API Endpoints..."

# Health Check
curl -s "$BASE_URL/api/health" | jq .

# Auth Endpoints
curl -s -X POST "$BASE_URL/api/auth/user-login" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' | jq .

# Objects
curl -s "$BASE_URL/api/objects" -H "Cookie: connect.sid=..." | jq .

# Energy Data
curl -s "$BASE_URL/api/daily-consumption/12345" -H "Cookie: connect.sid=..." | jq .

# Temperature
curl -s "$BASE_URL/api/temperature-analysis/12345" -H "Cookie: connect.sid=..." | jq .

echo "✅ Basic API tests complete"
```

---

## 📝 Validation Summary

**Total Items**: 250+
- **Authentication**: 15 items
- **Pages**: 24 items
- **API Endpoints**: 94 items
- **Features**: 100+ items
- **Security**: 10+ items

**Validation Process**:
1. ✅ Complete Phase 1 refactoring (Frontend + Security)
2. ✅ Complete Phase 2 refactoring (Backend Modularization)
3. ✅ Complete Phase 3 refactoring (DB Optimization + Docker)
4. 🔄 Run this checklist on refactored version
5. 🔄 Fix any failing items
6. 🔄 Deploy to production

---

**Created**: 2025-10-08
**Last Updated**: 2025-10-08
**Version**: 1.0
**Maintainer**: Claude (Refactoring Management Agent)

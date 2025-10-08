# Frontend Feature Extraction Plan

Created: 2025-10-08
Purpose: Extract 8 feature modules from monolithic client/src structure
Branch: feature/frontend-modules (to be created)
Duration: 1 week (parallel with backend-mod)
Status: PLANNED - Ready to execute

---

## Overview

Extract the cleaned frontend codebase into 8 feature-based modules following best practices:
- Feature-first organization
- Colocation of related code
- Clear boundaries
- Shared component library

**Current Structure** (Monolithic):
```
client/src/
├── pages/          # 24 pages mixed together
├── components/ui/  # 22 shared components
├── lib/            # Utilities
└── styles/         # Global styles
```

**Target Structure** (Modular):
```
client/src/
├── features/                # Feature modules (8)
│   ├── auth/
│   ├── user-management/
│   ├── object-management/
│   ├── energy-dashboard/
│   ├── temperature-monitor/
│   ├── network-monitor/
│   ├── ki-reports/
│   └── settings/
├── components/ui/           # Shared UI library
├── lib/                     # Shared utilities
└── styles/                  # Global styles + design tokens
```

---

## 8 Feature Modules

### Module 1: Auth Feature (~300 LOC)

**Purpose**: Authentication and session management

**Pages to Extract**:
- `/login` → `features/auth/pages/LoginPage.tsx`
- `/anmelden` → `features/auth/pages/LoginStrawa.tsx`
- `/superadmin-login` → `features/auth/pages/SuperadminLoginPage.tsx`

**Structure**:
```
features/auth/
├── pages/
│   ├── LoginPage.tsx
│   ├── LoginStrawa.tsx
│   └── SuperadminLoginPage.tsx
├── components/
│   ├── LoginForm.tsx
│   ├── PasswordInput.tsx
│   └── AuthLayout.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useLogin.ts
│   └── useLogout.ts
├── services/
│   └── auth.service.ts
├── types/
│   └── auth.types.ts
└── index.ts
```

**API Endpoints Used**:
- POST /api/auth/user-login
- POST /api/auth/logout
- GET /api/auth/check-auth

---

### Module 2: User Management Feature (~500 LOC)

**Purpose**: User and profile administration

**Pages to Extract**:
- `/users` → `features/user-management/pages/UsersPage.tsx`
- `/user-profile` → `features/user-management/pages/UserProfilePage.tsx`

**Structure**:
```
features/user-management/
├── pages/
│   ├── UsersPage.tsx
│   └── UserProfilePage.tsx
├── components/
│   ├── UserList.tsx
│   ├── UserCard.tsx
│   ├── UserForm.tsx
│   ├── UserProfileForm.tsx
│   └── MandantSelector.tsx
├── hooks/
│   ├── useUsers.ts
│   ├── useUser.ts
│   ├── useCreateUser.ts
│   ├── useUpdateUser.ts
│   └── useUserProfiles.ts
├── services/
│   └── users.service.ts
├── types/
│   └── user.types.ts
└── index.ts
```

**API Endpoints Used**:
- GET /api/users
- GET /api/user/:id
- POST /api/users
- PUT /api/user/:id
- DELETE /api/user/:id
- GET /api/user/profiles/list
- POST /api/user/profiles
- PUT /api/user/profiles/:id

---

### Module 3: Object Management Feature (~600 LOC)

**Purpose**: Building/object administration and meter management

**Pages to Extract**:
- `/objects` → `features/object-management/pages/ObjectsPage.tsx`
- `/objects/:id` → `features/object-management/pages/ObjectDetailPage.tsx`
- `/objekte_excel` → `features/object-management/pages/ObjectExcelPage.tsx`

**Structure**:
```
features/object-management/
├── pages/
│   ├── ObjectsPage.tsx
│   ├── ObjectDetailPage.tsx
│   └── ObjectExcelPage.tsx
├── components/
│   ├── ObjectList.tsx
│   ├── ObjectCard.tsx
│   ├── ObjectForm.tsx
│   ├── MeterList.tsx
│   ├── MeterForm.tsx
│   ├── ObjectHierarchy.tsx
│   └── ObjectMap.tsx
├── hooks/
│   ├── useObjects.ts
│   ├── useObject.ts
│   ├── useCreateObject.ts
│   ├── useUpdateObject.ts
│   ├── useMeters.ts
│   └── useObjectHierarchy.ts
├── services/
│   └── objects.service.ts
├── types/
│   └── object.types.ts
└── index.ts
```

**API Endpoints Used**:
- GET /api/objects
- GET /api/objects/:id
- POST /api/objects
- PUT /api/objects/:id
- DELETE /api/objects/:id
- GET /api/objects/mandant/:mandantId
- GET /api/objects/:id/hierarchy
- POST /api/objects/:id/meter
- PUT /api/objects/:id/meter/:meterId

---

### Module 4: Energy Dashboard Feature (~800 LOC)

**Purpose**: Energy consumption visualization and analysis

**Pages to Extract**:
- `/dashbord` → `features/energy-dashboard/pages/DashboardPage.tsx`
- `/energy-data` → `features/energy-dashboard/pages/EnergyDataPage.tsx`
- `/verbrauchsgrafiken` → `features/energy-dashboard/pages/ConsumptionChartsPage.tsx`
- `/jahresverbräuche` → `features/energy-dashboard/pages/YearlyConsumptionPage.tsx`
- `/comparison` → `features/energy-dashboard/pages/ComparisonPage.tsx`

**Structure**:
```
features/energy-dashboard/
├── pages/
│   ├── DashboardPage.tsx
│   ├── EnergyDataPage.tsx
│   ├── ConsumptionChartsPage.tsx
│   ├── YearlyConsumptionPage.tsx
│   └── ComparisonPage.tsx
├── components/
│   ├── KPICards.tsx
│   ├── ConsumptionChart.tsx
│   ├── TrendChart.tsx
│   ├── ComparisonTable.tsx
│   ├── YearlyOverview.tsx
│   ├── EnergyDataTable.tsx
│   └── FilterPanel.tsx
├── hooks/
│   ├── useEnergyData.ts
│   ├── useConsumption.ts
│   ├── useYearlyData.ts
│   ├── useComparison.ts
│   └── useTrends.ts
├── services/
│   └── energy.service.ts
├── types/
│   └── energy.types.ts
└── index.ts
```

**API Endpoints Used**:
- GET /api/energy-data
- GET /api/energy-data/daily
- GET /api/energy-data/monthly
- GET /api/energy-data/yearly
- GET /api/energy-data/comparison
- GET /api/consumption/:objectId
- GET /api/trends/:objectId
- GET /api/yearly-summary/:objectId

---

### Module 5: Temperature Monitor Feature (~400 LOC)

**Purpose**: Temperature monitoring and analysis

**Pages to Extract**:
- `/temperature` → `features/temperature-monitor/pages/TemperaturePage.tsx`
- `/temperature-analysis` → `features/temperature-monitor/pages/TemperatureAnalysisPage.tsx`
- `/heating-degree-days` → `features/temperature-monitor/pages/HeatingDegreeDaysPage.tsx`

**Structure**:
```
features/temperature-monitor/
├── pages/
│   ├── TemperaturePage.tsx
│   ├── TemperatureAnalysisPage.tsx
│   └── HeatingDegreeDaysPage.tsx
├── components/
│   ├── TemperatureChart.tsx
│   ├── IndoorOutdoorComparison.tsx
│   ├── HeatingCurveChart.tsx
│   ├── ComfortAnalysis.tsx
│   └── TemperatureAlerts.tsx
├── hooks/
│   ├── useTemperatureData.ts
│   ├── useIndoorTemp.ts
│   ├── useOutdoorTemp.ts
│   └── useHeatingDegreeDays.ts
├── services/
│   └── temperature.service.ts
├── types/
│   └── temperature.types.ts
└── index.ts
```

**API Endpoints Used**:
- GET /api/temperature/indoor/:objectId
- GET /api/temperature/outdoor/:objectId
- GET /api/temperature-analysis/:objectId
- GET /api/temperature/heating-degree-days

---

### Module 6: Network Monitor Feature (~300 LOC)

**Purpose**: Network monitoring and availability tracking

**Pages to Extract**:
- `/netzwerk-uebersicht` → `features/network-monitor/pages/NetworkOverviewPage.tsx`
- `/netzwerk-details` → `features/network-monitor/pages/NetworkDetailsPage.tsx`

**Structure**:
```
features/network-monitor/
├── pages/
│   ├── NetworkOverviewPage.tsx
│   └── NetworkDetailsPage.tsx
├── components/
│   ├── NetworkStatusGrid.tsx
│   ├── DeviceCard.tsx
│   ├── UptimeChart.tsx
│   └── AlertsList.tsx
├── hooks/
│   ├── useNetworkStatus.ts
│   ├── useDevices.ts
│   └── useNetworkAlerts.ts
├── services/
│   └── network.service.ts
├── types/
│   └── network.types.ts
└── index.ts
```

**API Endpoints Used**:
- GET /api/monitoring/status
- GET /api/monitoring/devices
- GET /api/monitoring/alerts

---

### Module 7: KI Reports Feature (~400 LOC)

**Purpose**: AI-generated reports and analysis

**Pages to Extract**:
- `/ki-reports` → `features/ki-reports/pages/KIReportsPage.tsx`
- `/ki-report/:id` → `features/ki-reports/pages/ReportDetailPage.tsx`
- `/generate-report` → `features/ki-reports/pages/GenerateReportPage.tsx`

**Structure**:
```
features/ki-reports/
├── pages/
│   ├── KIReportsPage.tsx
│   ├── ReportDetailPage.tsx
│   └── GenerateReportPage.tsx
├── components/
│   ├── ReportList.tsx
│   ├── ReportCard.tsx
│   ├── ReportViewer.tsx
│   ├── ReportGenerator.tsx
│   └── ReportExport.tsx
├── hooks/
│   ├── useReports.ts
│   ├── useReport.ts
│   ├── useGenerateReport.ts
│   └── useExportReport.ts
├── services/
│   └── reports.service.ts
├── types/
│   └── report.types.ts
└── index.ts
```

**API Endpoints Used**:
- GET /api/ki-reports
- GET /api/ki-reports/:id
- POST /api/ki-reports/generate
- DELETE /api/ki-reports/:id

---

### Module 8: Settings Feature (~500 LOC)

**Purpose**: System configuration and settings

**Pages to Extract**:
- `/settings` → `features/settings/pages/SettingsPage.tsx`
- `/portal-config` → `features/settings/pages/PortalConfigPage.tsx`
- `/mandants` → `features/settings/pages/MandantsPage.tsx`
- `/system-info` → `features/settings/pages/SystemInfoPage.tsx`

**Structure**:
```
features/settings/
├── pages/
│   ├── SettingsPage.tsx
│   ├── PortalConfigPage.tsx
│   ├── MandantsPage.tsx
│   └── SystemInfoPage.tsx
├── components/
│   ├── SettingsForm.tsx
│   ├── PortalConfigEditor.tsx
│   ├── MandantList.tsx
│   ├── MandantForm.tsx
│   └── SystemInfoPanel.tsx
├── hooks/
│   ├── useSettings.ts
│   ├── usePortalConfig.ts
│   ├── useMandants.ts
│   └── useSystemInfo.ts
├── services/
│   └── settings.service.ts
├── types/
│   └── settings.types.ts
└── index.ts
```

**API Endpoints Used**:
- GET /api/settings
- PUT /api/settings/:key
- GET /api/portal/config
- POST /api/portal/config
- GET /api/mandants
- POST /api/mandants

---

## Shared Code

### Keep in Shared Locations

**Components** (`components/ui/`):
- Button, Card, Input, Select, etc. (22 components)
- Already cleaned and documented in Phase 1

**Utilities** (`lib/`):
- api-client.ts
- query-client.ts
- utils.ts
- validators.ts

**Styles** (`styles/`):
- globals.css
- design-tokens.ts (created in Phase 1)

**Hooks** (`hooks/`):
- useAuth.ts (stays global)
- useQueryClient.ts

---

## Extraction Process

### For Each Feature Module

1. **Create Directory Structure**:
   ```bash
   mkdir -p features/{feature}/pages
   mkdir -p features/{feature}/components
   mkdir -p features/{feature}/hooks
   mkdir -p features/{feature}/services
   mkdir -p features/{feature}/types
   ```

2. **Move Pages**:
   - Move page files from `src/pages/` to `features/{feature}/pages/`
   - Update import paths

3. **Extract Components**:
   - Identify components used only by this feature
   - Move to `features/{feature}/components/`
   - Keep shared components in `components/ui/`

4. **Create Hooks**:
   - Extract API calls to custom hooks
   - Use TanStack Query for server state
   - Follow naming: `use{Entity}` pattern

5. **Create Services**:
   - API client methods
   - Business logic
   - Type-safe requests

6. **Define Types**:
   - Request/response types
   - Domain types
   - Utility types

7. **Create Index**:
   - Export public API
   - Hide internal implementation

8. **Update Routes**:
   - Update router configuration
   - Use lazy loading for features

9. **Test Build**:
   - Verify no circular dependencies
   - Check bundle size
   - Ensure hot reload works

---

## Migration Strategy

### Phase 1: Setup (Day 1)
- Create `features/` directory
- Create all 8 module skeletons
- Update router for lazy loading

### Phase 2: Extract Features (Days 2-5)
- Day 2: Auth + User Management
- Day 3: Object Management + Energy Dashboard
- Day 4: Temperature + Network Monitor
- Day 5: KI Reports + Settings

### Phase 3: Cleanup (Day 6)
- Remove old `pages/` directory
- Update all import paths
- Fix any circular dependencies
- Optimize bundle splits

### Phase 4: Testing (Day 7)
- Full integration testing
- Bundle size verification
- Performance testing
- Documentation update

---

## Success Criteria

- ✅ All 24 pages extracted to feature modules
- ✅ Zero circular dependencies
- ✅ Bundle size <2.2 MB (or improved)
- ✅ Build time <15s
- ✅ All routes working
- ✅ No regressions in functionality
- ✅ Clean import paths
- ✅ Feature isolation (can develop independently)

---

## Benefits

1. **Developer Experience**:
   - Clear boundaries
   - Easier to find code
   - Faster hot reload (smaller modules)

2. **Maintainability**:
   - Feature-first organization
   - Related code collocated
   - Easier to refactor

3. **Performance**:
   - Better code splitting
   - Lazy loading features
   - Smaller initial bundle

4. **Scalability**:
   - Easy to add new features
   - Can assign features to different developers
   - Independent testing

---

## Next Steps

1. **Create feature extraction agent** (or do manually)
2. **Start with Auth module** (smallest, fewest dependencies)
3. **Extract one module at a time**
4. **Test after each extraction**
5. **Update documentation**

---

Created: 2025-10-08
Status: READY TO EXECUTE
Estimated Duration: 1 week
Can Run: Parallel with backend-modularization
Branch: feature/frontend-modules (to be created)

# Frontend Feature Extraction Tasks

Created: 2025-10-08
Agent: frontend-features-agent
Branch: feature/frontend-modules
Priority: P1 (Parallel with Backend Mod)
Duration: 1 week

Status: Active

---

## Overview

Extract frontend pages into feature-based modules that align with the 8 backend modules. This creates a clean separation of concerns and makes the codebase more maintainable.

### Goals

1. Organize pages by feature domain (Auth, Users, Objects, Energy, etc.)
2. Create shared hooks and utilities per feature
3. Implement consistent API client patterns
4. Set up proper routing structure
5. Maintain existing functionality (zero breaking changes)

### Prerequisites

- Frontend Cleanup Agent completed (Phase 1)
- Build passing
- No TypeScript errors

### Success Criteria

- All pages organized into feature folders
- Each feature has its own API hooks
- Shared utilities properly extracted
- Build still passes
- All existing routes work
- Zero functionality changes

---

## Module Structure

Target structure for each feature:

```
client/src/features/
├── auth/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── LoginStrawa.tsx
│   │   └── SuperadminLogin.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   └── api/
│       └── authApi.ts
├── users/
│   ├── pages/
│   │   └── UserSettings.tsx
│   └── api/
│       └── usersApi.ts
├── objects/
│   ├── pages/
│   │   └── ObjectManagement.tsx
│   ├── components/
│   │   ├── ObjectListLayout.tsx
│   │   ├── ObjectFilterAPI.tsx
│   │   └── SystemSchemaView.tsx
│   └── api/
│       └── objectsApi.ts
├── energy/
│   ├── pages/
│   │   ├── EnergyData.tsx
│   │   ├── DbEnergyDataConfig.tsx
│   │   └── EfficiencyAnalysis.tsx
│   ├── components/
│   │   ├── KI_energy.tsx
│   │   ├── EfficiencyDistributionCard.tsx
│   │   └── shared/energy-utils.tsx
│   └── api/
│       └── energyApi.ts
├── temperature/
│   ├── pages/
│   │   └── TemperatureAnalysis.tsx
│   ├── components/
│   │   ├── TemperatureEfficiencyChart.tsx
│   │   └── TempAnalysisTable.tsx
│   └── api/
│       └── temperatureApi.ts
├── monitoring/
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── NetworkMonitor.tsx
│   │   └── PerformanceTest.tsx
│   ├── components/
│   │   └── GrafanaDashboard.tsx
│   └── api/
│       └── monitoringApi.ts
├── ki-reports/
│   ├── pages/
│   │   └── GrafanaDashboard.tsx
│   ├── components/
│   │   ├── GrafanaReport.tsx
│   │   ├── GrafanaDiagramme.tsx
│   │   └── GrafanaLogic.tsx
│   └── api/
│       └── reportsApi.ts
└── settings/
    ├── pages/
    │   ├── SystemSettings.tsx
    │   ├── ApiManagement.tsx
    │   ├── ModbusConfig.tsx
    │   └── Geraeteverwaltung.tsx
    └── api/
        └── settingsApi.ts
```

---

## Tasks

### Task 1: Create Feature Directory Structure
**Status**: Pending
**Estimated**: 1 hour

Create the base directory structure:
- `client/src/features/` (root)
- 8 feature folders (auth, users, objects, energy, temperature, monitoring, ki-reports, settings)
- Subdirectories: pages/, components/, hooks/, api/

### Task 2: Extract Auth Feature
**Status**: Pending
**Estimated**: 2 hours

Move and organize authentication-related files:
- **Pages**: Login.tsx, LoginStrawa.tsx, SuperadminLogin.tsx, LayoutStrawa.tsx
- **Hooks**: useAuth.ts
- **API**: Create authApi.ts with login/logout/check-auth methods
- **Components**: LoginModal.tsx, SessionWarning.tsx
- Update all imports

### Task 3: Extract Users Feature
**Status**: Pending
**Estimated**: 1.5 hours

Move user management files:
- **Pages**: UserSettings.tsx, AdminDashboard.tsx
- **Components**: UserSettingsModal.tsx
- **API**: Create usersApi.ts
- Update imports

### Task 4: Extract Objects Feature
**Status**: Pending
**Estimated**: 3 hours

Move object management files (largest feature):
- **Pages**: ObjectManagement.tsx
- **Components**: ObjectListLayout.tsx, ObjectFilterAPI.tsx, SystemSchemaView.tsx, NetzView.tsx, ObjektinfoContent.tsx
- **API**: Create objectsApi.ts (19 endpoints)
- Update imports

### Task 5: Extract Energy Feature
**Status**: Pending
**Estimated**: 3 hours

Move energy-related files:
- **Pages**: EnergyData.tsx, DbEnergyDataConfig.tsx, EfficiencyAnalysis.tsx
- **Components**: KI_energy.tsx, KI_energy_jahr.tsx, KI_energy_jahr_wrapper.tsx, KI_energy_netz.tsx, EfficiencyDistributionCard.tsx, shared/energy-utils.tsx
- **API**: Create energyApi.ts (9 endpoints)
- Update imports

### Task 6: Extract Temperature Feature
**Status**: Pending
**Estimated**: 2 hours

Move temperature analysis files:
- **Pages**: TemperatureAnalysis.tsx
- **Components**: TemperatureEfficiencyChart.tsx, TempAnalysisTable.tsx (CSS)
- **API**: Create temperatureApi.ts
- Update imports

### Task 7: Extract Monitoring Feature
**Status**: Pending
**Estimated**: 2.5 hours

Move monitoring and dashboard files:
- **Pages**: Dashboard.tsx, NetworkMonitor.tsx, PerformanceTest.tsx, Maps.tsx
- **Components**: (monitoring-specific components)
- **API**: Create monitoringApi.ts
- Update imports

### Task 8: Extract KI Reports Feature
**Status**: Pending
**Estimated**: 2 hours

Move Grafana and reporting files:
- **Pages**: GrafanaDashboard.tsx
- **Components**: GrafanaReport.tsx, GrafanaDiagramme.tsx, GrafanaLogic.tsx, grafanaConfig.ts
- **API**: Create reportsApi.ts
- Update imports

### Task 9: Extract Settings Feature
**Status**: Pending
**Estimated**: 2.5 hours

Move system settings files:
- **Pages**: SystemSettings.tsx, ApiManagement.tsx, ModbusConfig.tsx, Geraeteverwaltung.tsx, Devices.tsx
- **Components**: JsonConfigurationEditor.tsx, PortalJsonEditor.tsx, PortalConfigCard.tsx, SystemPortalSetup.tsx, CollapsiblePortalCards.tsx, deviceanmeldung.tsx
- **API**: Create settingsApi.ts
- Update imports

### Task 10: Update Shared Layout & Components
**Status**: Pending
**Estimated**: 1.5 hours

Keep truly shared components in `client/src/components/`:
- Layout.tsx (main layout)
- ExportDialog.tsx
- DatabaseStatusHeader.tsx
- CurrentDatabaseConnection.tsx
- FallbackDatabaseAccess.tsx
- UI components (already in ui/)

### Task 11: Update Routing
**Status**: Pending
**Estimated**: 2 hours

Update App.tsx and routing:
- Import pages from new feature locations
- Organize routes by feature
- Add route guards per feature
- Verify all routes work

### Task 12: Create Shared API Client
**Status**: Pending
**Estimated**: 1 hour

Create centralized API client:
- `client/src/lib/apiClient.ts` - base fetch wrapper
- Each feature's API extends this base
- Consistent error handling
- Auth token management

### Task 13: Update TypeScript Paths
**Status**: Pending
**Estimated**: 0.5 hours

Update tsconfig.json with path aliases:
```json
{
  "paths": {
    "@features/*": ["./src/features/*"],
    "@components/*": ["./src/components/*"],
    "@lib/*": ["./src/lib/*"]
  }
}
```

### Task 14: Verify Build & Tests
**Status**: Pending
**Estimated**: 1 hour

- Run build: `npm run build`
- Check for TypeScript errors
- Manually test key pages
- Verify all routes
- Check console for errors

### Task 15: Commit & Documentation
**Status**: Pending
**Estimated**: 1 hour

- Commit feature extraction
- Update COMPONENT_LIBRARY.md with new structure
- Create FEATURES.md documenting the feature modules
- Update README with new structure

---

## Parallel Execution Strategy

Since this is running parallel with backend modularization:

1. **Zero Backend Dependency**: Only touching client/ files
2. **No API Changes**: Just reorganizing frontend, not changing API calls
3. **Safe to Run**: No file conflicts with backend work
4. **Independent Commits**: Can commit per feature without waiting for backend

---

## Validation Checklist

After each task:
- [ ] Build passes
- [ ] No TypeScript errors
- [ ] All imports resolve correctly
- [ ] Feature still works in browser
- [ ] No console errors
- [ ] Commit with clear message

---

## Estimated Timeline

**Total**: ~25 hours (~1 week with breaks)

- Day 1: Tasks 1-3 (structure + auth + users)
- Day 2: Tasks 4-5 (objects + energy)
- Day 3: Tasks 6-7 (temperature + monitoring)
- Day 4: Tasks 8-9 (reports + settings)
- Day 5: Tasks 10-15 (shared, routing, validation, docs)

---

## Notes

- This is organizational refactoring only - zero functionality changes
- All existing features continue to work
- Build must pass after each task
- Safe to run in parallel with backend modularization
- Will make future feature development much easier

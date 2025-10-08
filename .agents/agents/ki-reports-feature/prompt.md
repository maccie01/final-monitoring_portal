# KI Reports Feature Extraction Task

## Objective
Extract KI Reports feature (Task 8) - Grafana dashboards and reporting functionality.

## Files to Move

### Pages
- GrafanaDashboard.tsx → client/src/features/ki-reports/pages/

### Components
- GrafanaReport.tsx → client/src/features/ki-reports/components/
- GrafanaDiagramme.tsx → client/src/features/ki-reports/components/
- GrafanaLogic.tsx → client/src/features/ki-reports/components/
- grafanaConfig.ts → client/src/features/ki-reports/components/

## Tasks

### 1. Move Files
Use `git mv` to move all Grafana-related files to the ki-reports feature directory.

### 2. Create reportsApi.ts
Location: `client/src/features/ki-reports/api/reportsApi.ts`

Create API client with endpoints for:
- Grafana dashboard data
- Report generation
- Report exports

### 3. Update Imports
- Update App.tsx
- Update any files importing Grafana components
- Update internal imports within moved files

### 4. Verify Build
- Run `npm run build`
- Fix any errors

### 5. Commit
```
feat(frontend): extract KI Reports feature module

- Move GrafanaDashboard and Grafana components
- Create reportsApi.ts
- Update all imports
- Build passing

Task 8/15 complete
```

## Success Criteria
- ✅ All Grafana files moved
- ✅ reportsApi.ts created
- ✅ All imports updated
- ✅ Build passing
- ✅ Committed and pushed

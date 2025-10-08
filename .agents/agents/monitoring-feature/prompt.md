# Monitoring Feature Extraction Task

## Objective
Complete the Monitoring feature extraction (Task 7) by creating API client and updating all imports.

## Current State
- Pages ALREADY MOVED: Dashboard.tsx, NetworkMonitor.tsx, PerformanceTest.tsx, Maps.tsx
- Location: client/src/features/monitoring/pages/
- Status: Needs API client and import updates

## Tasks

### 1. Create monitoringApi.ts
Location: `client/src/features/monitoring/api/monitoringApi.ts`

Analyze the monitoring pages and create API client with endpoints for:
- System health/status
- Network monitoring
- Performance metrics
- Map/location data

Use the same pattern as other API clients (authApi.ts, usersApi.ts, etc.)

### 2. Update Imports
Find all files importing the monitoring pages from old locations and update to new paths:
- Update App.tsx
- Update any other files referencing monitoring pages

### 3. Verify Build
- Run `npm run build` to ensure no errors
- Fix any import issues

### 4. Commit
Create a commit with message:
```
feat(frontend): complete Monitoring feature extraction

- Create monitoringApi.ts with monitoring endpoints
- Update all imports to new feature paths
- Build passing

Task 7/15 complete
```

## Success Criteria
- ✅ monitoringApi.ts created
- ✅ All imports updated
- ✅ Build passing
- ✅ Committed and pushed

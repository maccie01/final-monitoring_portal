# Backend Modularization Tasks

**Agent**: backend-modularization-agent
**Branch**: `refactor/backend-modules`
**Target**: Extract storage.ts (3,961 LOC) → 8 domain modules
**Duration**: 2 weeks (14 days)
**Status**: Not started

---

## Overview

Extract the monolithic `server/storage.ts` file into 8 clean domain modules following the repository pattern. Each module should have proper separation of concerns (repository, service, controller layers) with comprehensive testing.

**Critical**: Security-agent MUST be merged to main before starting (bcrypt password hashing dependency).

---

## Module Extraction Tasks (8 Total)

### Module 1: Auth Module (~400 LOC)
**Priority**: HIGH (other modules depend on this)
**Status**: Pending

**Scope**:
- User authentication logic
- Session management
- Password validation (bcrypt)
- Login/logout flows

**Files to create**:
- `server/modules/auth/auth.repository.ts` - Database queries
- `server/modules/auth/auth.service.ts` - Business logic
- `server/modules/auth/auth.controller.ts` - HTTP handlers
- `server/modules/auth/auth.routes.ts` - Route definitions
- `server/modules/auth/auth.types.ts` - TypeScript types
- `server/modules/auth/__tests__/auth.repository.test.ts`
- `server/modules/auth/__tests__/auth.service.test.ts`
- `server/modules/auth/__tests__/auth.controller.test.ts`

**Endpoints affected**: 3
- POST /api/auth/user-login
- POST /api/auth/logout
- GET /api/auth/check-auth

**Estimated**: 2 days

---

### Module 2: Users Module (~600 LOC)
**Priority**: HIGH (many dependencies)
**Status**: Pending

**Scope**:
- User CRUD operations
- User profiles management
- Mandant access control
- User search/filtering

**Files to create**:
- `server/modules/users/users.repository.ts`
- `server/modules/users/users.service.ts`
- `server/modules/users/users.controller.ts`
- `server/modules/users/users.routes.ts`
- `server/modules/users/users.types.ts`
- `server/modules/users/__tests__/*.test.ts` (3 files)

**Endpoints affected**: 15
- GET /api/user/
- GET /api/user/users
- GET /api/user/:id
- PUT /api/user/:id
- POST /api/user/
- DELETE /api/user/:id
- PUT /api/user/:id/password
- GET /api/user/profiles/list
- POST /api/user/profiles
- PUT /api/user/profiles/:id
- DELETE /api/user/profiles/:id
- (+ 4 more user-related endpoints)

**Estimated**: 3 days

---

### Module 3: Objects Module (~700 LOC)
**Priority**: MEDIUM
**Status**: Pending

**Scope**:
- Object CRUD operations
- Object search/filtering
- Object metadata management
- Mandant relationships
- GPS coordinates

**Files to create**:
- `server/modules/objects/objects.repository.ts`
- `server/modules/objects/objects.service.ts`
- `server/modules/objects/objects.controller.ts`
- `server/modules/objects/objects.routes.ts`
- `server/modules/objects/objects.types.ts`
- `server/modules/objects/__tests__/*.test.ts` (3 files)

**Endpoints affected**: 18
- GET /api/objects
- GET /api/objects/:id
- POST /api/objects
- PUT /api/objects/:id
- DELETE /api/objects/:id
- GET /api/objects/mandant/:mandantId
- GET /api/objects/search
- (+ 11 more object-related endpoints)

**Estimated**: 3 days

---

### Module 4: Energy Module (~600 LOC)
**Priority**: MEDIUM
**Status**: Pending

**Scope**:
- Energy data queries (day_comp table)
- Energy consumption analysis
- Day/week/month/year aggregations
- Energy efficiency calculations
- Comparison analysis

**Files to create**:
- `server/modules/energy/energy.repository.ts`
- `server/modules/energy/energy.service.ts`
- `server/modules/energy/energy.controller.ts`
- `server/modules/energy/energy.routes.ts`
- `server/modules/energy/energy.types.ts`
- `server/modules/energy/__tests__/*.test.ts` (3 files)

**Endpoints affected**: 22
- GET /api/energy-data
- GET /api/energy-data/daily
- GET /api/energy-data/weekly
- GET /api/energy-data/monthly
- GET /api/energy-data/yearly
- GET /api/energy-data/comparison
- GET /api/efficiency-analysis/:objectId
- GET /api/yearly-summary/:objectId
- (+ 14 more energy endpoints)

**Estimated**: 3 days

---

### Module 5: Temperature Module (~400 LOC)
**Priority**: MEDIUM
**Status**: Pending

**Scope**:
- Temperature data queries
- Outdoor temperature integration (daily_outdoor_temperatures)
- Temperature analysis
- Heating degree days calculation
- Weather data integration

**Files to create**:
- `server/modules/temperature/temperature.repository.ts`
- `server/modules/temperature/temperature.service.ts`
- `server/modules/temperature/temperature.controller.ts`
- `server/modules/temperature/temperature.routes.ts`
- `server/modules/temperature/temperature.types.ts`
- `server/modules/temperature/__tests__/*.test.ts` (3 files)

**Endpoints affected**: 8
- GET /api/temperature-analysis
- GET /api/temperature-analysis/:objectId
- GET /api/temperature/outdoor
- GET /api/temperature/heating-degree-days
- POST /api/temperature/outdoor/import
- (+ 3 more temperature endpoints)

**Estimated**: 2 days

---

### Module 6: Monitoring Module (~500 LOC)
**Priority**: LOW
**Status**: Pending

**Scope**:
- System monitoring
- Health checks
- Performance metrics
- Database connection monitoring
- Logging utilities

**Files to create**:
- `server/modules/monitoring/monitoring.repository.ts`
- `server/modules/monitoring/monitoring.service.ts`
- `server/modules/monitoring/monitoring.controller.ts`
- `server/modules/monitoring/monitoring.routes.ts`
- `server/modules/monitoring/monitoring.types.ts`
- `server/modules/monitoring/__tests__/*.test.ts` (3 files)

**Endpoints affected**: 6
- GET /api/monitoring/health
- GET /api/monitoring/metrics
- GET /api/monitoring/db-status
- GET /api/monitoring/system-info
- (+ 2 more monitoring endpoints)

**Estimated**: 2 days

---

### Module 7: KI Reports Module (~400 LOC)
**Priority**: LOW
**Status**: Pending

**Scope**:
- AI-generated reports storage/retrieval
- Report metadata management
- Report templates
- Report scheduling

**Files to create**:
- `server/modules/ki-reports/ki-reports.repository.ts`
- `server/modules/ki-reports/ki-reports.service.ts`
- `server/modules/ki-reports/ki-reports.controller.ts`
- `server/modules/ki-reports/ki-reports.routes.ts`
- `server/modules/ki-reports/ki-reports.types.ts`
- `server/modules/ki-reports/__tests__/*.test.ts` (3 files)

**Endpoints affected**: 7
- GET /api/ki-reports
- GET /api/ki-reports/:id
- POST /api/ki-reports
- PUT /api/ki-reports/:id
- DELETE /api/ki-reports/:id
- GET /api/ki-reports/generate/:objectId
- (+ 1 more KI report endpoint)

**Estimated**: 2 days

---

### Module 8: Settings Module (~400 LOC)
**Priority**: LOW
**Status**: Pending

**Scope**:
- System settings management
- Configuration storage (settings table)
- Feature flags
- Portal configuration (portal_configs table)

**Files to create**:
- `server/modules/settings/settings.repository.ts`
- `server/modules/settings/settings.service.ts`
- `server/modules/settings/settings.controller.ts`
- `server/modules/settings/settings.routes.ts`
- `server/modules/settings/settings.types.ts`
- `server/modules/settings/__tests__/*.test.ts` (3 files)

**Endpoints affected**: 15
- GET /api/settings
- GET /api/settings/:key
- PUT /api/settings/:key
- DELETE /api/settings/:key
- GET /api/portal/config
- POST /api/portal/config
- PUT /api/portal/config/:id
- DELETE /api/portal/config/:id
- GET /api/portal/active-config
- (+ 6 more settings endpoints)

**Estimated**: 2 days

---

## Integration Tasks

### Task 9: Update Module Imports
**Status**: Pending
**Estimated**: 1 day

Update all files that import from storage.ts to use the new modules:
- Server controllers (15+ files)
- Server routes (10+ files)
- Server middleware (3 files)
- Test files (20+ files)

### Task 10: Update server/index.ts
**Status**: Pending
**Estimated**: 0.5 days

Register all new module routes in the main server file.

### Task 11: Delete/Minimize storage.ts
**Status**: Pending
**Estimated**: 0.5 days

After all modules are extracted and verified:
- Delete storage.ts OR
- Leave only shared database connection logic (<10 LOC)

---

## Verification Checklist

### Per-Module Verification
After each module extraction:
- [ ] All repository methods have database queries
- [ ] All service methods have business logic (no DB access)
- [ ] All controller methods handle HTTP requests/responses
- [ ] Routes are properly defined with middleware
- [ ] Types are comprehensive and exported
- [ ] Unit tests cover ≥75% of code
- [ ] Build passes (`npm run build`)
- [ ] Type check passes (`npm run type-check`)

### Final Verification
After all modules extracted:
- [ ] All 94 API endpoints functional (manual smoke test)
- [ ] Integration tests pass (`npm run test:integration`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Full test suite passes (`npm test`)
- [ ] Test coverage ≥75% (`npm run test:coverage`)
- [ ] Build successful (`npm run build`)
- [ ] No new security vulnerabilities (`npm audit`)
- [ ] storage.ts deleted or <10 LOC
- [ ] Documentation updated (README, API docs)
- [ ] PR created with detailed summary

---

## Rollback Plan

If critical issues arise:
```bash
git checkout main
git branch rollback-backend-$(date +%Y%m%d)
git reset --hard <pre-refactor-commit>
npm install
npm run build
npm test
```

---

## Success Metrics

- **Modules Created**: 8/8 (100%)
- **LOC Refactored**: 3,961
- **Test Coverage**: ≥75%
- **Build Status**: Passing
- **API Endpoints**: 94/94 working (100%)
- **No Regressions**: All tests green

---

## Notes

- Start with Auth Module (highest priority, fewest dependencies)
- Can run 8 subagents in parallel after Auth is complete
- Commit after each module extraction
- Update progress log after each task
- Request approval before deleting storage.ts

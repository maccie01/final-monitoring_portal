# PHASE 1.2: Directory Structure Mapping

Created: 2025-10-07
Timestamp: 13:50:00

## Complete Directory Tree (Up to 6 Levels)

```
app-version-4_netzwächter/                    # Root directory
│
├── .claude/                                   # Claude Code IDE configuration
│
├── archive/                                   # Archived/legacy code
│   ├── client/
│   │   ├── components/
│   │   │   └── netzstrawa/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── pages/
│   ├── root/
│   ├── server/
│   └── shared/
│
├── client/                                    # Frontend React application
│   ├── public/                                # Static assets
│   ├── src/
│   │   ├── components/                        # React components (81 files)
│   │   │   ├── ui/                            # shadcn/ui components (53 files)
│   │   │   ├── netzstrawa/                    # Netzstrawa-specific components
│   │   │   └── shared/                        # Shared utility components
│   │   ├── contexts/                          # React contexts
│   │   ├── hooks/                             # Custom React hooks (3 files)
│   │   ├── lib/                               # Utility libraries (4 files)
│   │   ├── pages/                             # Page components (27 files)
│   │   ├── styles/                            # Global styles
│   │   └── utils/                             # Utility functions
│   └── index.html                             # HTML entry point
│
├── dist/                                      # Build output directory
│   ├── index.js                               # Backend bundle
│   └── public/                                # Frontend build
│       └── assets/
│
├── Dokumentation/                             # Project documentation
│   ├── architecture/                          # Architecture documentation
│   ├── assets/                                # Documentation assets
│   │   ├── Cursor/
│   │   ├── Grafana_Cursor/
│   │   └── replit/
│   ├── developer/                             # Developer docs
│   │   ├── analysis/
│   │   └── api/
│   ├── legacy/                                # Legacy documentation
│   └── user-guides/                           # User guides
│
├── node_modules/                              # Dependencies (467 subdirectories)
│
├── server/                                    # Backend Express.js application
│   ├── controllers/                           # Route controllers (10 files)
│   │   ├── authController.ts
│   │   ├── databaseController.ts
│   │   ├── efficiencyController.ts
│   │   ├── energyController.ts
│   │   ├── kiReportController.ts
│   │   ├── monitoringController.ts
│   │   ├── objectController.ts
│   │   ├── temperatureController.ts
│   │   ├── userController.ts
│   │   └── weatherController.ts
│   ├── middleware/                            # Express middleware (2 files)
│   │   ├── auth.ts
│   │   └── error.ts
│   ├── routes/                                # API route definitions (12 files)
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── efficiency.ts
│   │   ├── energy.ts
│   │   ├── index.ts
│   │   ├── kiReport.ts
│   │   ├── monitoring.ts
│   │   ├── object.ts
│   │   ├── portal.ts
│   │   ├── temperature.ts
│   │   ├── users.ts
│   │   └── weather.ts
│   ├── auth.ts                                # Authentication utilities
│   ├── connection-pool.ts                     # Database connection pooling
│   ├── db.ts                                  # Database initialization
│   ├── email-service.ts                       # Email service
│   ├── index.ts                               # Server entry point
│   ├── storage.ts                             # Storage utilities (146KB)
│   ├── sync-object-mandant.ts                 # Multi-tenant sync
│   └── vite.ts                                # Vite dev server integration
│
├── shared/                                    # Shared code (frontend + backend)
│   └── schema.ts                              # Drizzle schema definitions (37KB)
│
├── todo/                                      # Task tracking
│   ├── analysis-todo.md
│   ├── phase1-1-configuration-analysis.md
│   ├── phase1-1-dependencies-analysis.md
│   ├── phase1-1-environment-variables.md
│   └── phase1-1-root-architecture.md
│
├── .DS_Store                                  # macOS metadata
├── .env                                       # Environment variables (537 bytes)
├── .gitignore                                 # Git ignore rules (463 bytes)
├── drizzle.config.ts                          # Drizzle ORM config
├── FILE_STRUCTURE.md                          # File structure documentation
├── package.json                               # NPM dependencies
├── package-lock.json                          # Locked versions (465KB)
├── postcss.config.js                          # PostCSS config
├── README.md                                  # Project README (22KB)
├── replit.md                                  # Replit documentation
├── tailwind.config.ts                         # Tailwind CSS config
├── test_apis.sh                               # API testing script
├── TODO_AUTH_PGBOUNCER_MIGRATION.md           # Migration TODO (28KB)
├── tsconfig.json                              # TypeScript config
└── vite.config.ts                             # Vite build config
```

---

## Directory Classification

### Root Level Directories (9 total)

| Directory | Type | Purpose | File Count |
|-----------|------|---------|------------|
| `.claude/` | Config | IDE configuration | - |
| `archive/` | Legacy | Archived code | 7 files |
| `client/` | Frontend | React application | ~115 files |
| `dist/` | Build | Build artifacts | Variable |
| `Dokumentation/` | Docs | Documentation | 40 files |
| `node_modules/` | Dependencies | NPM packages | ~20,000+ files |
| `server/` | Backend | Express.js app | 32 files |
| `shared/` | Shared | Common code | 1 file |
| `todo/` | Tracking | Task management | 5 files |

---

## File Count Statistics

### Total Project Files (Excluding node_modules, dist, .git)
**265 files total**

### By Major Directory

| Directory | Files | Percentage |
|-----------|-------|------------|
| client/src/ | 115 | 43.4% |
| server/ | 32 | 12.1% |
| Dokumentation/ | 40 | 15.1% |
| archive/ | 7 | 2.6% |
| todo/ | 5 | 1.9% |
| Root level | 14 | 5.3% |
| shared/ | 1 | 0.4% |
| Other | 51 | 19.2% |

### Source Code Files Only

| Category | TypeScript/TSX Files | Percentage |
|----------|---------------------|------------|
| **Frontend** (client/) | 112 | 77.8% |
| **Backend** (server/) | 32 | 22.2% |
| **Total Source Files** | **144** | **100%** |

---

## Client Directory Breakdown

### client/ Structure (13 subdirectories, 115+ files)

```
client/
├── public/                    # Static assets
│   └── (favicon, images, etc.)
│
├── src/
│   ├── components/           # 81 files total
│   │   ├── ui/              # 53 shadcn/ui components
│   │   ├── netzstrawa/      # 2 Netzstrawa-specific components
│   │   ├── shared/          # 1 shared utility component
│   │   └── [27 custom components at root level]
│   │
│   ├── contexts/            # 1 context (CockpitContext)
│   │
│   ├── hooks/               # 3 custom hooks
│   │   ├── useAuth.ts
│   │   ├── useUIMode.ts
│   │   └── use-mobile.tsx
│   │
│   ├── lib/                 # 4 utility libraries
│   │   ├── api-utils.ts
│   │   ├── authUtils.ts
│   │   ├── queryClient.ts
│   │   └── utils.ts
│   │
│   ├── pages/               # 27 page components
│   │   ├── AdminDashboard.tsx
│   │   ├── ApiManagement.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DbEnergyDataConfig.tsx
│   │   ├── Devices.tsx
│   │   ├── EfficiencyAnalysis.tsx
│   │   ├── EnergyData.tsx
│   │   ├── Geraeteverwaltung.tsx
│   │   ├── GrafanaDashboard.tsx
│   │   ├── Info.tsx
│   │   ├── LayoutStrawa.tsx
│   │   ├── Logbook.tsx
│   │   ├── Login.tsx
│   │   ├── LoginStrawa.tsx
│   │   ├── Maps.tsx
│   │   ├── ModbusConfig.tsx
│   │   ├── NetworkMonitor.tsx
│   │   ├── ObjectManagement.tsx
│   │   ├── PerformanceTest.tsx
│   │   ├── SuperadminLogin.tsx
│   │   ├── SystemSettings.tsx
│   │   ├── TemperatureAnalysis.tsx
│   │   ├── User.tsx
│   │   ├── UserManagement.tsx
│   │   ├── UserSettings.tsx
│   │   └── [3 backup files: .backup, .working]
│   │
│   ├── styles/              # Global CSS
│   │
│   ├── utils/               # 1 utility file
│   │   └── grafanaConfig.ts
│   │
│   ├── App.tsx              # Main app component
│   └── main.tsx             # React entry point
│
└── index.html               # HTML entry point
```

### UI Component Library (53 files in client/src/components/ui/)

**shadcn/ui Components**:
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
- StandardTable.tsx (custom)
- [Additional UI components...]

**Pattern**: Full shadcn/ui implementation with custom extensions

---

## Server Directory Breakdown

### server/ Structure (4 subdirectories, 32 files)

```
server/
├── controllers/              # 10 controller files
│   ├── authController.ts           # Authentication
│   ├── databaseController.ts       # Database management
│   ├── efficiencyController.ts     # Energy efficiency
│   ├── energyController.ts         # Energy data (large)
│   ├── kiReportController.ts       # AI reports
│   ├── monitoringController.ts     # System monitoring
│   ├── objectController.ts         # Building/object management
│   ├── temperatureController.ts    # Temperature data
│   ├── userController.ts           # User management
│   └── weatherController.ts        # Weather integration
│
├── middleware/               # 2 middleware files
│   ├── auth.ts                     # Authentication middleware
│   └── error.ts                    # Error handling
│
├── routes/                   # 12 route files
│   ├── index.ts                    # Route aggregator
│   ├── auth.ts                     # Auth routes
│   ├── db.ts                       # Database routes
│   ├── efficiency.ts               # Efficiency routes
│   ├── energy.ts                   # Energy routes
│   ├── kiReport.ts                 # AI report routes
│   ├── monitoring.ts               # Monitoring routes
│   ├── object.ts                   # Object routes
│   ├── portal.ts                   # Portal config routes
│   ├── temperature.ts              # Temperature routes
│   ├── users.ts                    # User routes
│   └── weather.ts                  # Weather routes
│
├── auth.ts                   # Auth utilities (4.7KB)
├── connection-pool.ts        # DB connection pool (12KB)
├── db.ts                     # DB initialization (1.6KB)
├── email-service.ts          # Email service (6.3KB)
├── index.ts                  # Server entry point (4.4KB)
├── storage.ts                # Storage utilities (146KB - LARGE)
├── sync-object-mandant.ts    # Multi-tenant sync (3.8KB)
└── vite.ts                   # Vite integration (2.3KB)
```

### Server File Sizes

| File | Size | Status |
|------|------|--------|
| storage.ts | 146,432 bytes | ⚠️ Very large - needs refactoring |
| connection-pool.ts | 12,290 bytes | Normal |
| email-service.ts | 6,329 bytes | Normal |
| auth.ts | 4,714 bytes | Normal |
| index.ts | 4,370 bytes | Normal |
| sync-object-mandant.ts | 3,765 bytes | Normal |
| vite.ts | 2,263 bytes | Normal |
| db.ts | 1,618 bytes | Normal |

---

## Shared Directory

### shared/ Structure (1 file)

```
shared/
└── schema.ts                 # Drizzle schema (37KB)
```

**Purpose**:
- Database schema definitions
- Shared types between frontend and backend
- Used by Drizzle ORM

**Size**: 37,150 bytes (large schema file)

---

## Archive Directory

### archive/ Structure (7 files across 6 subdirectories)

```
archive/
├── client/
│   ├── components/
│   │   └── netzstrawa/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   └── pages/
├── root/
├── server/
└── shared/
```

**Purpose**: Legacy/unused code preserved during cleanup
**Date Archived**: 2025-10-07 (per FILE_STRUCTURE.md)

---

## Dokumentation Directory

### Dokumentation/ Structure (40 files across 5 subdirectories)

```
Dokumentation/
├── architecture/             # Architecture docs
├── assets/                   # Documentation assets
│   ├── Cursor/
│   ├── Grafana_Cursor/
│   └── replit/
├── developer/                # Developer documentation
│   ├── analysis/
│   └── api/
├── legacy/                   # Legacy documentation (17 files)
├── user-guides/              # User guides
├── DOCUMENTATION_AUDIT_REPORT.md
└── README.md
```

**Content**: Mixed documentation, some reorganized recently

---

## Todo Directory

### todo/ Structure (5 files)

```
todo/
├── analysis-todo.md                      # Main analysis checklist
├── phase1-1-configuration-analysis.md    # Config analysis results
├── phase1-1-dependencies-analysis.md     # Dependency analysis
├── phase1-1-environment-variables.md     # Env var analysis
└── phase1-1-root-architecture.md         # Root structure analysis
```

**Purpose**: Tracking comprehensive codebase analysis progress

---

## Monorepo Indicators Check

### Files Searched For

| File | Present? | Evidence |
|------|----------|----------|
| lerna.json | ❌ No | Not found |
| nx.json | ❌ No | Not found |
| pnpm-workspace.yaml | ❌ No | Not found |
| turbo.json | ❌ No | Not found |
| workspace in package.json | ❌ No | package.json:1-133 shows no workspaces field |

**Result**: ❌ **NOT a formal monorepo**

**Structure**: Pseudo-monorepo (manual client/server/shared split without tooling)

---

## Build Artifacts Directories

| Directory | Purpose | Committed? |
|-----------|---------|------------|
| dist/ | Build output | ❌ No (.gitignore:10) |
| build/ | Alternative build output | ❌ No (.gitignore:11) |
| node_modules/ | Dependencies | ❌ No (.gitignore:2) |
| .next/ | Next.js build | ❌ No (.gitignore:12) |
| out/ | Export output | ❌ No (.gitignore:13) |

**Evidence**: .gitignore lines 2, 10-13

---

## Docker & Containerization Check

### Docker Files Searched For

```bash
find . -name "Dockerfile" -o -name "docker-compose.yml" -o -name ".dockerignore"
```

**Result**: ❌ **NO Docker files found**

**Containerization Status**: Not containerized

---

## Key Observations

### 1. **Pseudo-Monorepo Structure**
- Manual separation: client/, server/, shared/
- No monorepo tooling (Nx, Turborepo, Lerna)
- Single package.json at root
- Shared code via TypeScript path aliases

### 2. **Code Organization**
- **Clean separation**: Frontend/backend/shared clearly defined
- **MVC-like backend**: Controllers, routes, middleware separated
- **Component-based frontend**: Pages, components, hooks organized
- **Large files identified**: storage.ts (146KB), schema.ts (37KB)

### 3. **No Containerization**
- No Dockerfile
- No docker-compose.yml
- No container orchestration
- **Opportunity**: Ready for containerization blueprint

### 4. **Documentation Structure**
- Comprehensive documentation folder
- Recently reorganized (architecture/, developer/, user-guides/)
- Legacy docs preserved

### 5. **Build Output**
- dist/ for production builds
- Separate frontend (dist/public/) and backend (dist/index.js)
- All build artifacts git-ignored

### 6. **Backup Files Present**
- NetworkMonitor.tsx.backup_20250812_222516
- NetworkMonitor.tsx.working
- Should be cleaned up or moved to archive/

---

## Recommendations

### High Priority
1. **Containerize Application**: Create Dockerfile and docker-compose.yml
2. **Refactor storage.ts**: 146KB file should be split into modules
3. **Clean Backup Files**: Remove .backup and .working files from pages/
4. **Consider Monorepo Tooling**: Add Nx or Turborepo for better workspace management

### Medium Priority
1. **Migrations Directory**: Create ./migrations/ for Drizzle migrations
2. **Shared Types**: Expand shared/ to include more common code
3. **Documentation**: Continue consolidation in Dokumentation/

### Low Priority
1. **Archive Cleanup**: Review archive/ for permanent deletion candidates
2. **DS_Store**: Add to .gitignore and remove from repo
3. **Test Directory**: Create tests/ directory for test files

# NETZWÄCHTER IMPLEMENTATION PLAN GENERATOR

**Project**: Netzwächter Monitoring Portal (Energy & Network Monitoring Application)
**Analysis Base**: Complete Phase 1-10 analysis reports in `/todo/`
**Objective**: Transform current monolithic structure into modular, secure, containerized system

---

## CONTEXT SUMMARY

Based on completed analysis, this Netzwächter monitoring portal has:

**Current State**:
- **Backend**: Express.js 4.21.2 + PostgreSQL (Neon) + Drizzle ORM
- **Frontend**: React 18.3.1 + Vite 5.4.19 + Wouter routing + React Query 5.60.5
- **Database**: PostgreSQL with 20 tables, JSONB-heavy schema, multi-tenant architecture
- **Authentication**: Session-based (express-session + connect-pg-simple)
- **Structure**: Monolithic application (~265 files, ~13,000 LOC)
- **Deployment**: Currently non-containerized

**Critical Issues Identified**:
1. **12 Security Vulnerabilities** (10 CRITICAL, 2 MEDIUM) - See `phase2-5-authentication-authorization.md`
2. **8,000+ Lines Dead Code** (15% of codebase) - See `Dokumentation/developer/analysis/`
3. **Storage.ts Monolith** (3,961 lines) - Massive technical debt
4. **26 Unused UI Components** (54% of UI library)
5. **Connection Pool Overprovisioning** (50 connections, should be 5-20)
6. **React Query Misconfiguration** (staleTime: Infinity - data never refreshes)

**Project-Specific Constraints**:
- Multi-tenant system (mandants table + mandantAccess JSONB)
- Active production system (cannot freeze features)
- Small team (incremental migration required)
- Must maintain backward compatibility during migration

---

## INPUT DOCUMENTS REFERENCE

**Analysis Reports** (All in `/todo/`):
```
Phase 1: Root Architecture
- phase1-1-root-architecture.md
- phase1-1-dependencies-analysis.md
- phase1-1-environment-variables.md

Phase 2: Backend Forensics
- phase2-1-backend-entry-point.md
- phase2-2-all-api-endpoints.md (94 endpoints)
- phase2-3-database-schema.md (20 tables)
- phase2-4-business-logic-analysis.md (storage.ts 3,961 lines)
- phase2-5-authentication-authorization.md (12 security issues)
- phase2-6-external-integrations.md

Phase 3: Frontend Analysis
- phase3-1-frontend-architecture.md (102 components)

Additional:
- COMPLETE-PROJECT-ANALYSIS-SUMMARY.md
- Dokumentation/developer/analysis/* (Dead code analysis)
```

**Implementation Guides Created**:
```
- /todo/AGENT-A-FRONTEND-CLEANUP.md
- /todo/AGENT-B-BACKEND-SECURITY.md
```

---

## YOUR MISSION

Create a **MASTER IMPLEMENTATION PLAN** that:

1. **Addresses all 12 critical security vulnerabilities** (Priority P0)
2. **Eliminates 8,000+ lines of dead code** (Quick wins)
3. **Refactors storage.ts** into modular service layer
4. **Containerizes the entire application** (Docker + docker-compose)
5. **Implements proper multi-tenant isolation**
6. **Optimizes database queries and connection pooling**
7. **Establishes monorepo structure** for future scalability

**Timeline Target**: 18-24 weeks (with 30% buffer)
**Team Size Assumption**: 2-3 developers working in parallel
**Migration Strategy**: Incremental/Strangler Fig (cannot do big bang)

---

## SECTION 1: NETZWÄCHTER-SPECIFIC ANALYSIS SYNTHESIS

### 1.1 Critical Findings Extraction

Extract from existing analysis reports and create:

- [ ] **Architecture Summary Table**:
  | Layer | Technology | Version | Issues Found | Priority |
  |-------|------------|---------|--------------|----------|
  | Backend | Express.js | 4.21.2 | [from phase2-1] | |
  | Frontend | React | 18.3.1 | [from phase3-1] | |
  | Database | PostgreSQL | [version] | [from phase2-3] | |
  | ORM | Drizzle | 0.39.1 | N+1 queries | |
  | State | React Query | 5.60.5 | staleTime issue | |

- [ ] **Security Vulnerabilities Inventory** (from phase2-5):
  | ID | Vulnerability | File:Line | Severity | CVSS | Remediation |
  |----|---------------|-----------|----------|------|-------------|
  | SEC-01 | Plaintext password validation | storage.ts:3342-3369 | CRITICAL | 9.8 | Implement bcrypt |
  | SEC-02 | Hardcoded admin bypass | authController.ts:114 | CRITICAL | 9.1 | Remove bypass |
  | SEC-03 | SSL disabled | .env:DATABASE_URL | CRITICAL | 8.2 | Enable SSL |
  | SEC-04 | Weak SESSION_SECRET | .env:SESSION_SECRET | CRITICAL | 7.5 | Generate strong secret |
  | SEC-05-17 | [Extract remaining from phase2-5] | | | | |

- [ ] **Dead Code Inventory** (from Dokumentation/developer/analysis/):
  | Category | Files | Lines | Impact | Removal Priority |
  |----------|-------|-------|--------|------------------|
  | Unused Pages | 5 | 3,940 | Bundle -200KB | P0 |
  | Unused UI Components | 26 | ~4,000 | Bundle -150KB | P0 |
  | Backup Files | 2 | 2,536 | Tech debt | P0 |

- [ ] **Technical Debt Inventory**:
  | Issue | Location | LOC | Complexity | Refactoring Effort |
  |-------|----------|-----|------------|-------------------|
  | Monolithic storage | storage.ts | 3,961 | Very High | 8 weeks |
  | Massive pages | 5 files | ~400KB | High | 4 weeks |
  | Connection pool | connection-pool.ts | - | Medium | 2 days |
  | React Query config | queryClient.ts | - | Low | 4 hours |

### 1.2 Domain Boundary Identification

Based on the 94 API endpoints (phase2-2) and database schema (phase2-3), identify bounded contexts:

- [ ] **Domain Map for Netzwächter**:
  | Domain | API Endpoints | DB Tables | Frontend Pages | Coupling Level |
  |--------|---------------|-----------|----------------|----------------|
  | **Authentication** | /api/auth/* (6 endpoints) | users, sessions, user_profiles | Login, Register | Low |
  | **User Management** | /api/users/* (12 endpoints) | users, user_profiles | UserManagement page | Medium |
  | **Object Management** | /api/objects/* (18 endpoints) | objects, object_mandant | ObjectManagement page | High |
  | **Energy Monitoring** | /api/energy/* (15 endpoints) | day_comp, view_mon_comp | Dashboard, Charts | Medium |
  | **Temperature Data** | /api/temperature/* (8 endpoints) | daily_outdoor_temperatures | Maps page | Low |
  | **Alerts/Monitoring** | /api/monitoring/* (10 endpoints) | [identify tables] | NetworkMonitor | Medium |
  | **KI Reports** | /api/ki-report/* (4 endpoints) | objects.kianalyse | KI pages | Medium |
  | **Settings** | /api/settings/* (8 endpoints) | settings, mandants | SystemSettings | High |
  | **Database Admin** | /api/db/* (7 endpoints) | - | Admin tools | Low |
  | **Weather** | /api/weather/* (6 endpoints) | daily_outdoor_temperatures | Maps | Low |

- [ ] **Domain Dependencies Graph**:
  Create a diagram showing which domains depend on which
  Example: Object Management → Energy Monitoring → Temperature Data

- [ ] **Multi-Tenant Isolation Analysis**:
  | Domain | Tenant Isolation Method | Risk Level | Refactoring Needed |
  |--------|------------------------|------------|-------------------|
  | Objects | mandant_id + mandantAccess JSONB | Medium | Standardize |
  | Users | mandant_id + mandantAccess array | Medium | Add validation |
  | Energy Data | Through objects.mandant_id | Low | None |

### 1.3 Quantitative Metrics

Compile from all analysis reports:

- [ ] **Codebase Metrics**:
  ```
  Total Files: 265
  Total LOC: ~13,000
  Dead Code: 8,000+ lines (61%)

  Backend:
    - Controllers: 11 files, ~X LOC
    - Routes: 12 files, ~X LOC
    - storage.ts: 3,961 LOC (LARGEST FILE)
    - Average file size: [calculate]

  Frontend:
    - Pages: 25 files, [from phase3-1]
    - Components: 102 total (29 custom + 48 UI + 25 pages)
    - Massive files: 5 files >50KB (394KB total)

  Database:
    - Tables: 20
    - JSONB fields: 15 (in objects table)
    - Indexes: [from phase2-3]
  ```

- [ ] **Dependency Metrics**:
  ```
  Total Dependencies: 101 (from phase1-1)
  Outdated: [count from phase1-1]
  Vulnerable: [count from phase1-1]
  Unused: 9 (from phase2-6)

  Heavy Dependencies:
    - Drizzle ORM: [impact]
    - React Query: [impact]
    - [others from phase1-1]
  ```

- [ ] **Performance Metrics** (establish baseline):
  ```
  Connection Pool: 50 connections (EXCESSIVE)
  Bundle Size: ~2.1MB (includes 200KB dead code)
  Build Time: [measure]
  API Response Times: [p50, p95, p99 - measure]
  ```

---

## SECTION 2: TARGET ARCHITECTURE FOR NETZWÄCHTER

### 2.1 Modularization Strategy Decision

- [ ] **Monorepo vs Polyrepo**:
  **DECISION**: Monorepo (pnpm workspaces recommended)

  **Justification**:
  - Shared TypeScript types between frontend/backend (multi-tenant logic)
  - Single version of truth for API contracts
  - Small team (2-3 devs) - easier coordination
  - Shared validation schemas (Zod/Joi)
  - Atomic commits across frontend/backend

  **Tool Recommendation**: pnpm workspaces (lightweight) or Turborepo (if need caching)

- [ ] **Microservices vs Modular Monolith**:
  **DECISION**: Hybrid (Modular Monolith → Selective Microservices)

  **Phase 1**: Modular Monolith
  - Refactor storage.ts into domain modules
  - Keep single deployment initially
  - Establish clear module boundaries

  **Phase 2** (6+ months later): Extract to microservices if needed
  - Candidates for extraction:
    1. **Weather Service** (low coupling, external API integration)
    2. **KI Reports Service** (compute-intensive, async)
    3. **Temperature Data Service** (independent data source)

  **Keep as Monolith**:
  - Authentication (tightly coupled)
  - User Management (core domain)
  - Object Management (core domain)

- [ ] **Frontend Architecture**:
  **DECISION**: Modular SPA (NOT micro-frontends)

  **Justification**:
  - Small team, single product
  - Shared UI components (shadcn/ui)
  - Feature-based organization
  - Route-level code splitting sufficient

  **Structure**: Feature modules + shared component library

### 2.2 Proposed Netzwächter Directory Structure

```
netzwaechter-monorepo/
├── apps/
│   ├── backend-api/                    # Main Express.js API
│   │   ├── src/
│   │   │   ├── modules/                # Domain modules
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── login.dto.ts
│   │   │   │   │   │   └── register.dto.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   ├── users/
│   │   │   │   │   ├── users.controller.ts
│   │   │   │   │   ├── users.service.ts
│   │   │   │   │   ├── users.repository.ts   # Replaces storage.ts methods
│   │   │   │   │   ├── users.routes.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── objects/                  # Core domain
│   │   │   │   │   ├── objects.controller.ts
│   │   │   │   │   ├── objects.service.ts
│   │   │   │   │   ├── objects.repository.ts
│   │   │   │   │   ├── objects.routes.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── energy/                   # Energy monitoring
│   │   │   │   │   ├── energy.controller.ts
│   │   │   │   │   ├── energy.service.ts
│   │   │   │   │   ├── energy.repository.ts
│   │   │   │   │   └── routes/
│   │   │   │   ├── temperature/
│   │   │   │   ├── monitoring/
│   │   │   │   ├── ki-reports/
│   │   │   │   ├── weather/
│   │   │   │   ├── settings/
│   │   │   │   └── database-admin/
│   │   │   ├── core/                         # Shared within backend
│   │   │   │   ├── config/
│   │   │   │   │   ├── database.config.ts
│   │   │   │   │   └── session.config.ts
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── auth.middleware.ts
│   │   │   │   │   ├── error.middleware.ts
│   │   │   │   │   └── tenant.middleware.ts   # Multi-tenant isolation
│   │   │   │   ├── database/
│   │   │   │   │   ├── connection-pool.ts
│   │   │   │   │   └── migrations/
│   │   │   │   └── services/
│   │   │   │       ├── email.service.ts
│   │   │   │       └── logger.service.ts
│   │   │   ├── shared/                       # Utilities
│   │   │   │   ├── decorators/
│   │   │   │   ├── guards/
│   │   │   │   └── utils/
│   │   │   ├── index.ts                      # Entry point
│   │   │   └── app.ts
│   │   ├── test/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend-web/                    # React SPA
│       ├── src/
│       │   ├── features/                # Feature-based organization
│       │   │   ├── auth/
│       │   │   │   ├── components/
│       │   │   │   │   ├── LoginForm.tsx
│       │   │   │   │   └── RegisterForm.tsx
│       │   │   │   ├── pages/
│       │   │   │   │   └── LoginPage.tsx
│       │   │   │   ├── hooks/
│       │   │   │   │   └── useAuth.ts        # From current codebase
│       │   │   │   ├── api/
│       │   │   │   │   └── auth.api.ts
│       │   │   │   └── types.ts
│       │   │   ├── user-management/
│       │   │   │   ├── components/
│       │   │   │   ├── pages/
│       │   │   │   │   └── UserManagementPage.tsx  # Refactor from 2,088 LOC
│       │   │   │   ├── hooks/
│       │   │   │   └── api/
│       │   │   ├── object-management/        # From current Objects domain
│       │   │   │   ├── components/
│       │   │   │   ├── pages/
│       │   │   │   │   └── ObjectManagementPage.tsx # Refactor from 1,786 LOC
│       │   │   │   └── api/
│       │   │   ├── energy-dashboard/
│       │   │   │   ├── components/
│       │   │   │   │   ├── EnergyChart.tsx
│       │   │   │   │   └── ConsumptionTable.tsx
│       │   │   │   ├── pages/
│       │   │   │   │   └── DashboardPage.tsx
│       │   │   │   └── hooks/
│       │   │   │       └── useEnergyData.ts
│       │   │   ├── network-monitor/
│       │   │   │   ├── pages/
│       │   │   │   │   └── NetworkMonitorPage.tsx # Refactor from 1,705 LOC
│       │   │   │   └── components/
│       │   │   ├── maps/                     # Temperature visualization
│       │   │   │   ├── pages/
│       │   │   │   │   └── MapsPage.tsx      # Refactor from 1,100 LOC
│       │   │   │   └── components/
│       │   │   ├── ki-reports/
│       │   │   ├── settings/
│       │   │   │   ├── pages/
│       │   │   │   │   └── SystemSettingsPage.tsx # Refactor from 2,019 LOC
│       │   │   │   └── components/
│       │   │   └── weather/
│       │   ├── shared/                       # Shared within frontend
│       │   │   ├── components/               # shadcn/ui + custom
│       │   │   │   ├── ui/                   # Keep only 22 used components
│       │   │   │   │   ├── button.tsx
│       │   │   │   │   ├── card.tsx
│       │   │   │   │   ├── input.tsx
│       │   │   │   │   └── [19 more]
│       │   │   │   └── layout/
│       │   │   │       ├── Header.tsx
│       │   │   │       ├── Sidebar.tsx
│       │   │   │       └── MainLayout.tsx
│       │   │   ├── hooks/
│       │   │   ├── utils/
│       │   │   └── styles/
│       │   ├── core/                         # Core setup
│       │   │   ├── api/
│       │   │   │   ├── client.ts             # Axios instance
│       │   │   │   └── query-client.ts       # React Query setup (FIX staleTime)
│       │   │   ├── router/
│       │   │   │   └── routes.tsx            # Wouter routes
│       │   │   ├── store/                    # Global state (if needed)
│       │   │   └── config/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── public/
│       ├── Dockerfile
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
│
├── packages/                             # Shared across apps
│   ├── shared-types/                     # TypeScript interfaces
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── auth.types.ts
│   │   │   │   ├── users.types.ts
│   │   │   │   ├── objects.types.ts
│   │   │   │   └── energy.types.ts
│   │   │   ├── database/
│   │   │   │   └── schema.types.ts       # From Drizzle schema
│   │   │   ├── dto/                      # Data Transfer Objects
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared-validation/                # Zod schemas (FE + BE)
│   │   ├── src/
│   │   │   ├── auth.schema.ts
│   │   │   ├── users.schema.ts
│   │   │   ├── objects.schema.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── shared-utils/                     # Common utilities
│   │   ├── src/
│   │   │   ├── date/
│   │   │   ├── string/
│   │   │   ├── array/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── api-client/                       # Frontend API SDK (optional)
│       ├── src/
│       │   ├── auth.client.ts
│       │   ├── users.client.ts
│       │   └── index.ts
│       └── package.json
│
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.frontend
│   │   └── Dockerfile.database
│   ├── k8s/                              # Future: Kubernetes
│   └── nginx/
│       └── nginx.conf                    # Reverse proxy config
│
├── scripts/
│   ├── seed-database.ts
│   ├── migrate-passwords.ts              # From AGENT-B security tasks
│   └── cleanup-dead-code.sh
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── docker-compose.yml                    # Local development
├── docker-compose.prod.yml               # Production overrides
├── pnpm-workspace.yaml                   # Monorepo config
├── package.json                          # Root package.json
├── tsconfig.base.json                    # Shared TS config
├── .env.example
├── .gitignore
└── README.md
```

### 2.3 Technology Stack Optimization for Netzwächter

- [ ] **Backend Stack Updates**:
  | Current | Keep/Upgrade | Rationale |
  |---------|-------------|-----------|
  | Express.js 4.21.2 | Keep | Stable, team knows it |
  | Drizzle ORM 0.39.1 | **Upgrade to latest** | Fix JOIN issues (N+1 queries) |
  | bcryptjs | **Add** (P0) | Password hashing (currently plaintext!) |
  | express-session | Keep | Works well for current needs |
  | connect-pg-simple | Keep | PostgreSQL session store |
  | Zod | **Add** | Validation + type inference (replace manual validation) |
  | Winston | **Add** | Structured logging (currently console.log) |
  | express-rate-limit | **Add** (P1) | DDoS protection |

- [ ] **Frontend Stack Updates**:
  | Current | Keep/Upgrade/Remove | Rationale |
  |---------|-------------------|-----------|
  | React 18.3.1 | Keep | Latest stable |
  | Vite 5.4.19 | Keep | Fast, modern |
  | Wouter 3.3.5 | Keep | Lightweight routing |
  | React Query 5.60.5 | Keep but **FIX CONFIG** | staleTime: Infinity issue |
  | shadcn/ui | Keep (remove 26 unused) | Good component library |
  | Tailwind CSS 3.4.17 | Keep | Team preference |
  | Zod | **Add** | Form validation + type safety |

- [ ] **Shared Stack**:
  | Tool | Action | Purpose |
  |------|--------|---------|
  | TypeScript | Upgrade to 5.x | Better type inference |
  | ESLint | Configure monorepo | Consistency |
  | Prettier | Standardize | Code formatting |
  | Husky | Add | Pre-commit hooks |
  | pnpm | Add | Monorepo package manager |

### 2.4 Containerization Architecture for Netzwächter

- [ ] **Container Strategy**:
  ```yaml
  # docker-compose.yml structure

  version: '3.8'

  services:
    # PostgreSQL Database
    postgres:
      image: postgres:16-alpine
      environment:
        POSTGRES_DB: netzwaechter
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: ${DB_PASSWORD}
      volumes:
        - postgres-data:/var/lib/postgresql/data
        - ./db/init:/docker-entrypoint-initdb.d
      ports:
        - "5432:5432"
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U postgres"]
        interval: 10s
        timeout: 5s
        retries: 5

    # Backend API
    backend:
      build:
        context: .
        dockerfile: apps/backend-api/Dockerfile
        target: development
      environment:
        NODE_ENV: development
        DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/netzwaechter?sslmode=require
        SESSION_SECRET: ${SESSION_SECRET}
        MAILSERVER_HOST: ${MAILSERVER_HOST}
        MAILSERVER_PORT: ${MAILSERVER_PORT}
        MAILSERVER_USER: ${MAILSERVER_USER}
        MAILSERVER_PASSWORD: ${MAILSERVER_PASSWORD}
      volumes:
        - ./apps/backend-api:/app
        - /app/node_modules
      ports:
        - "5000:5000"
      depends_on:
        postgres:
          condition: service_healthy
      healthcheck:
        test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
        interval: 30s
        timeout: 10s
        retries: 3

    # Frontend Web
    frontend:
      build:
        context: .
        dockerfile: apps/frontend-web/Dockerfile
        target: development
      environment:
        VITE_API_URL: http://localhost:5000
      volumes:
        - ./apps/frontend-web:/app
        - /app/node_modules
      ports:
        - "5173:5173"
      depends_on:
        - backend

    # Nginx Reverse Proxy (production)
    nginx:
      image: nginx:alpine
      profiles: ["production"]
      volumes:
        - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
        - ./apps/frontend-web/dist:/usr/share/nginx/html:ro
      ports:
        - "80:80"
        - "443:443"
      depends_on:
        - backend

  networks:
    default:
      name: netzwaechter-network

  volumes:
    postgres-data:
  ```

- [ ] **Dockerfile Templates**:

  **Backend Dockerfile** (multi-stage):
  ```dockerfile
  # Build stage
  FROM node:20-alpine AS build
  WORKDIR /app

  # Install pnpm
  RUN npm install -g pnpm

  # Copy package files
  COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
  COPY apps/backend-api/package.json ./apps/backend-api/
  COPY packages/*/package.json ./packages/

  # Install dependencies
  RUN pnpm install --frozen-lockfile

  # Copy source
  COPY apps/backend-api ./apps/backend-api
  COPY packages ./packages

  # Build
  RUN pnpm --filter backend-api build

  # Production stage
  FROM node:20-alpine AS production
  WORKDIR /app

  # Install pnpm
  RUN npm install -g pnpm

  # Copy package files
  COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
  COPY --from=build /app/apps/backend-api/package.json ./apps/backend-api/

  # Install production dependencies only
  RUN pnpm install --prod --frozen-lockfile

  # Copy built application
  COPY --from=build /app/apps/backend-api/dist ./apps/backend-api/dist

  # Create non-root user
  RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
  USER nodejs

  EXPOSE 5000

  HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD node healthcheck.js

  CMD ["node", "apps/backend-api/dist/index.js"]

  # Development stage
  FROM build AS development
  EXPOSE 5000
  CMD ["pnpm", "--filter", "backend-api", "dev"]
  ```

---

## SECTION 3: PRIORITIZATION & RISK ASSESSMENT

### 3.1 Netzwächter Task Inventory

Extract from both AGENT-A and AGENT-B todos:

**Security Tasks (P0 - CRITICAL)**:
1. Implement bcrypt password hashing (storage.ts:3342, AGENT-B Task 1.1)
2. Remove hardcoded admin bypass (authController.ts:114, AGENT-B Task 1.2)
3. Enable SSL for database (DATABASE_URL, AGENT-B Task 1.3)
4. Generate strong SESSION_SECRET (AGENT-B Task 1.4)
5. Protect 13 unprotected endpoints (AGENT-B Task 2.1)
6. Implement rate limiting (AGENT-B Task 2.2)
7. Secure email config (AGENT-B Task 2.3)
8-12. [Remaining security issues from phase2-5]

**Dead Code Cleanup Tasks (P0 - Quick Wins)**:
13. Delete 5 unused page components (AGENT-A Task 1.1)
14. Delete 26 unused UI components (AGENT-A Task 1.2)
15. Standardize import quotes (AGENT-A Task 2.1)
16. Standardize Card imports (AGENT-A Task 2.2)
17. Move utility script (AGENT-B cleanup)

**Backend Refactoring Tasks (P1)**:
18. Optimize connection pool (50→10-20, AGENT-B Task 3.1)
19. Fix N+1 query issues (AGENT-B Task 3.2)
20. Refactor storage.ts into modules (8 domains × services)
21. Extract authentication module
22. Extract user management module
23. Extract object management module
24. Extract energy monitoring module
25. Extract temperature module
26. Extract monitoring/alerts module
27. Extract KI reports module
28. Extract settings module

**Frontend Refactoring Tasks (P1-P2)**:
29. Add ARIA labels (AGENT-A Task 3.1)
30. Implement design tokens (AGENT-A Task 4.1)
31. Create component documentation (AGENT-A Task 4.2)
32. Refactor UserManagement page (2,088 LOC → modules)
33. Refactor ObjectManagement page (1,786 LOC → modules)
34. Refactor NetworkMonitor page (1,705 LOC → modules)
35. Refactor Maps page (1,100 LOC → modules)
36. Refactor SystemSettings page (2,019 LOC → modules)
37. Fix React Query config (staleTime: Infinity)
38. Migrate features to new structure (8 features)

**Containerization Tasks (P1)**:
39. Create backend Dockerfile (AGENT-B Task 4.1)
40. Create frontend Dockerfile (AGENT-B Task 4.1)
41. Create docker-compose.yml (AGENT-B Task 4.1)
42. Optimize Docker images
43. Setup CI/CD pipeline

**Monorepo Tasks (P2)**:
44. Setup pnpm workspaces
45. Extract shared-types package
46. Extract shared-validation package
47. Extract shared-utils package
48. Setup monorepo build tooling

**Testing Tasks (P2)**:
49. Setup backend testing (unit + integration)
50. Setup frontend testing (component + E2E)
51. Achieve 75% backend coverage
52. Achieve 70% frontend coverage

### 3.2 Prioritization Matrix

| Task ID | Task Description | Business Value | Tech Debt | Risk | Effort | Priority Score |
|---------|-----------------|----------------|-----------|------|--------|----------------|
| 1 | Bcrypt password hashing | 5 | 5 | 5 | 3 | **8.33** |
| 2 | Remove admin bypass | 5 | 5 | 4 | 1 | **12.50** |
| 3 | Enable SSL | 5 | 5 | 3 | 2 | **8.33** |
| 4 | Strong SESSION_SECRET | 5 | 5 | 2 | 1 | **12.50** |
| 5 | Protect unprotected endpoints | 5 | 4 | 4 | 2 | **7.81** |
| 6 | Rate limiting | 4 | 3 | 2 | 2 | **6.75** |
| 13 | Delete unused pages | 3 | 5 | 1 | 1 | **14.50** |
| 14 | Delete unused UI components | 3 | 5 | 1 | 2 | **10.00** |
| 18 | Optimize connection pool | 4 | 4 | 2 | 2 | **7.00** |
| 37 | Fix React Query config | 4 | 3 | 2 | 1 | **10.50** |

**Priority Formula**: `(Business Value × 2 + Tech Debt × 1.5) / (Risk × Effort)`

**Quick Wins** (High score, low effort):
1. Strong SESSION_SECRET (Score: 12.50, Effort: 1)
2. Remove admin bypass (Score: 12.50, Effort: 1)
3. Delete unused pages (Score: 14.50, Effort: 1)
4. Fix React Query config (Score: 10.50, Effort: 1)

### 3.3 Dependency Mapping

```
CRITICAL PATH (MUST BE SEQUENTIAL):

Phase 0: Preparation
└─> Phase 1: Security Fixes (Tasks 1-7)
    └─> Phase 2: Dead Code Cleanup (Tasks 13-17)
        └─> Phase 3: Backend Modularization (Tasks 18-28)
            ├─> Phase 4a: Frontend Modularization (Tasks 29-38) [PARALLEL]
            └─> Phase 4b: Containerization (Tasks 39-43) [PARALLEL]
                └─> Phase 5: Monorepo Setup (Tasks 44-48)
                    └─> Phase 6: Testing (Tasks 49-52)

PARALLEL WORK OPPORTUNITIES:
- Frontend cleanup (Tasks 13-17, 29-31) can run parallel with Backend security (Tasks 1-7)
- Frontend refactoring (Tasks 32-38) can run parallel with Containerization (Tasks 39-43)
- Testing (Tasks 49-52) can start early for completed modules
```

---

## SECTION 4: PHASED IMPLEMENTATION ROADMAP FOR NETZWÄCHTER

### TIMELINE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│ NETZWÄCHTER REFACTORING ROADMAP (24 weeks / ~6 months)         │
├─────────────────────────────────────────────────────────────────┤
│ Phase 0: Preparation            Week 1-2   (2 weeks)            │
│ Phase 1: Security Fixes         Week 3-5   (3 weeks) [CRITICAL] │
│ Phase 2: Dead Code Cleanup      Week 6-7   (2 weeks) [2 agents] │
│ Phase 3: Backend Modularization Week 8-13  (6 weeks)            │
│ Phase 4: Frontend + Docker      Week 14-19 (6 weeks) [2 agents] │
│ Phase 5: Monorepo Setup         Week 20-21 (2 weeks)            │
│ Phase 6: Testing & QA           Week 22-24 (3 weeks)            │
├─────────────────────────────────────────────────────────────────┤
│ Total: 24 weeks + 30% buffer = ~31 weeks (7.5 months)          │
└─────────────────────────────────────────────────────────────────┘
```

### PHASE 0: PREPARATION (Week 1-2)

**Goals**: Establish safety nets, baseline metrics, tooling

**Tasks** (from AGENT-A & AGENT-B):
1. ✓ Setup git branching strategy (feature branches + main)
2. Create comprehensive database backup (Neon snapshot)
3. Document current API behavior (Postman collection export)
4. Measure baseline metrics:
   - Bundle size: ~2.1MB
   - API response times: [measure all 94 endpoints]
   - Connection pool usage: [monitor]
   - Build time: [measure]
5. Setup ESLint + Prettier (monorepo-ready)
6. Configure Husky pre-commit hooks
7. Create test database instance
8. Setup CI/CD skeleton (GitHub Actions)
9. Document rollback procedures

**Success Criteria**:
- [ ] Can restore database from backup
- [ ] Baseline metrics captured
- [ ] Linters working across all files
- [ ] Pre-commit hooks prevent bad commits

**Deliverables**:
- `metrics-baseline.md` with all measurements
- `.eslintrc.json` (monorepo config)
- `.github/workflows/ci.yml`
- `docs/ROLLBACK_PROCEDURES.md`

---

### PHASE 1: SECURITY FIXES (Week 3-5) [P0 - CRITICAL]

**Goals**: Fix all 12 critical security vulnerabilities

**Tasks** (AGENT-B Phase 1):

**Week 3: Authentication Security**
1. Implement bcrypt password hashing
   - Install bcrypt: `npm install bcrypt @types/bcrypt`
   - Create migration script: `server/scripts/migrate-passwords.ts`
   - Update storage.ts:3342-3369 `validateUserCredentials`
   - Update `createUser` and `updateUser` methods
   - Run migration: `npx tsx server/scripts/migrate-passwords.ts`
   - Test login with hashed passwords
   - **File**: `server/storage.ts`
   - **Commits**:
     - `feat(security): add bcrypt password hashing`
     - `feat(security): migrate existing passwords to bcrypt`

2. Remove hardcoded admin bypass
   - Delete authController.ts:114-125 hardcoded check
   - Ensure real admin exists in database
   - Test login (admin/admin123 should FAIL)
   - **File**: `server/controllers/authController.ts`
   - **Commit**: `fix(security): remove hardcoded admin bypass`

3. Enable SSL for database
   - Update .env: `sslmode=require`
   - Update connection-pool.ts SSL config
   - Test connection with SSL
   - **Files**: `.env`, `server/connection-pool.ts`
   - **Commit**: `feat(security): enable SSL for database connections`

4. Generate strong SESSION_SECRET
   - Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - Update .env with new secret
   - Restart server (invalidates all sessions)
   - **File**: `.env`
   - **Commit**: `feat(security): generate strong SESSION_SECRET`

**Week 4: API Protection**
5. Protect 13 unprotected endpoints
   - Add `requireAuth` middleware to:
     - /api/user-profiles (GET, POST, PUT, DELETE)
     - /api/settings/* endpoints
     - /api/db/* endpoints (requireAdmin)
     - /api/monitoring/* endpoints
     - /api/portal/* endpoints
   - Create test script to verify 401 responses
   - **Files**: `server/routes/*.ts`
   - **Commits**: One commit per route file
     - `fix(security): protect user-profile endpoints`
     - `fix(security): protect settings endpoints`
     - etc.

6. Implement rate limiting
   - Install: `npm install express-rate-limit`
   - Create `server/middleware/rate-limit.ts`
   - Apply to /api/auth/* (5 attempts / 15 min)
   - Apply to /api/* (100 requests / min)
   - Test with script
   - **Files**: `server/middleware/rate-limit.ts`, `server/routes/auth.ts`, `server/index.ts`
   - **Commit**: `feat(security): add rate limiting to auth and API endpoints`

**Week 5: Infrastructure Security**
7. Secure email configuration
   - Update email-service.ts with TLS enforcement
   - Move credentials to .env (already done)
   - Test email sending
   - **File**: `server/email-service.ts`
   - **Commit**: `feat(security): enforce TLS for email service`

8. Fix remaining security issues (from phase2-5 analysis)
   - [List specific issues 8-12 from security audit]
   - Address one per day

9. Security audit verification
   - Run security scan (npm audit)
   - Verify all endpoints require auth
   - Test with Postman collection
   - Update security documentation

**Success Criteria**:
- [ ] All passwords stored as bcrypt hashes
- [ ] admin/admin123 login FAILS
- [ ] DATABASE_URL uses SSL
- [ ] SESSION_SECRET is 128+ characters
- [ ] All 13 endpoints return 401 without auth
- [ ] Rate limiting blocks after 5 login attempts
- [ ] Email uses TLS 1.2+
- [ ] Zero critical security vulnerabilities

**Deliverables**:
- Migration script: `server/scripts/migrate-passwords.ts`
- Security test script: `server/scripts/verify-auth-protection.sh`
- Updated documentation: `docs/SECURITY.md`
- **Git Tag**: `v1.1.0-security-hardened`

**Risk Mitigation**:
- Take database snapshot before password migration
- Test authentication thoroughly before deploying
- Keep rollback script ready
- Notify users of session invalidation (SESSION_SECRET change)

---

### PHASE 2: DEAD CODE CLEANUP (Week 6-7) [P0 - Quick Wins]

**Goals**: Remove 8,000+ lines of dead code, reduce bundle by ~350KB

**Agent Assignment**: 2 agents working in parallel

**AGENT A: Frontend Cleanup** (Week 6-7)

Week 6:
1. Delete 5 unused page components (AGENT-A Task 1.1)
   - `client/src/pages/Landing.tsx` (324 lines)
   - `client/src/pages/not-found.tsx` (21 lines)
   - `client/src/contexts/CockpitContext.tsx` (59 lines)
   - `client/src/pages/NetworkMonitor.tsx.backup_20250812_222516` (1,268 lines)
   - `client/src/pages/NetworkMonitor.tsx.working` (1,268 lines)
   - Verify build works: `npm run build`
   - Test all routes manually
   - **Commit**: `refactor(cleanup): remove 5 unused page components (-2,940 LOC)`

2. Delete 26 unused UI components (AGENT-A Task 1.2)
   - Run verification script to confirm 0 references
   - Delete unused components (aspect-ratio, breadcrumb, carousel, etc.)
   - Verify build: `npm run build`
   - Check bundle size reduction
   - **Commit**: `refactor(cleanup): remove 26 unused UI components (-~4,000 LOC)`

Week 7:
3. Standardize import quotes (AGENT-A Task 2.1)
   - Add ESLint rule: `"quotes": ["error", "double"]`
   - Run autofix: `npx eslint client/src --ext .ts,.tsx --fix`
   - Verify 0 linting errors
   - **Commit**: `style: standardize all imports to double quotes`

4. Standardize Card component imports (AGENT-A Task 2.2)
   - Create script to standardize pattern
   - Manual review CardDescription usage
   - Test Card rendering
   - **Commit**: `refactor: standardize Card component import patterns`

**AGENT B: Backend Cleanup** (Week 6-7)

Week 6:
1. Move utility script to proper location
   - Create `server/utilities/` directory
   - Move `server/sync-object-mandant.ts`
   - Update any references (likely none)
   - **Commit**: `refactor: move utility scripts to utilities directory`

2. Clean up console.log statements
   - Replace with proper logger (Winston)
   - Install: `npm install winston`
   - Create logger service: `server/core/services/logger.service.ts`
   - Replace console.log across codebase
   - **Commit**: `feat: replace console.log with Winston logger`

Week 7:
3. Remove TODO/FIXME comments
   - Search: `grep -r "TODO\|FIXME" server/`
   - Create GitHub issues for valid TODOs
   - Remove or fix comments
   - **Commit**: `chore: resolve TODO/FIXME comments`

4. Document environment variables
   - Already done in `server/ENVIRONMENT_VARIABLES.md`
   - Review and update
   - **Commit**: `docs: update environment variables documentation`

**Success Criteria**:
- [ ] Bundle size reduced by 350KB (2.1MB → 1.75MB)
- [ ] Dead code: 0% (from 15%)
- [ ] All imports use double quotes
- [ ] Build time improved by ~15%
- [ ] No console.log in production code

**Deliverables**:
- Bundle size comparison: `docs/bundle-analysis-comparison.md`
- Clean lint report: `0 errors, 0 warnings`
- **Git Tag**: `v1.2.0-cleanup-complete`

---

### PHASE 3: BACKEND MODULARIZATION (Week 8-13) [6 weeks]

**Goals**: Refactor storage.ts (3,961 LOC) into domain modules

**Week 8: Setup Module Structure**

1. Create module directory structure
   ```bash
   mkdir -p server/src/modules/{auth,users,objects,energy,temperature,monitoring,ki-reports,settings}
   ```

2. Define repository pattern
   - Create base repository interface
   - Document service layer pattern
   - Create module template

**Week 9-10: Core Domain Modules (Authentication & Users)**

**Authentication Module** (Week 9):
- Extract from storage.ts:
  - `validateUserCredentials` (already updated with bcrypt)
  - `createSession`, `destroySession`
  - Session management methods
- Create files:
  - `server/src/modules/auth/auth.service.ts`
  - `server/src/modules/auth/auth.controller.ts`
  - `server/src/modules/auth/dto/login.dto.ts`
  - `server/src/modules/auth/dto/register.dto.ts`
- Move routes from `server/routes/auth.ts`
- Add Zod validation
- Write unit tests
- **Commit**: `refactor(backend): extract authentication module`

**Users Module** (Week 10):
- Extract from storage.ts:
  - `getUser`, `getAllUsers`, `createUser`, `updateUser`, `deleteUser`
  - `getUserProfiles`, `createUserProfile`, etc.
- Create repository: `users.repository.ts`
- Create service: `users.service.ts` (business logic)
- Create controller: `users.controller.ts`
- Fix N+1 query (LEFT JOIN userProfiles)
- Add validation DTOs
- **Commit**: `refactor(backend): extract users module with N+1 fix`

**Week 11-12: Core Business Modules (Objects & Energy)**

**Objects Module** (Week 11):
- Extract from storage.ts (largest domain):
  - `getObjects`, `getObjectById`, `createObject`, `updateObject`
  - `getObjectsByMandant` (tenant isolation)
  - Object-mandant relationship methods
- Implement proper tenant isolation middleware
- Create comprehensive DTOs
- **Commit**: `refactor(backend): extract objects module with tenant isolation`

**Energy Monitoring Module** (Week 12):
- Extract from storage.ts:
  - `getMonthlyConsumptionData`
  - Energy calculation methods
  - Energy balance logic (from kiReportController)
- Create `energy.repository.ts`
- Optimize queries (currently slow)
- **Commit**: `refactor(backend): extract energy monitoring module`

**Week 13: Remaining Modules**

Complete in parallel:
- Temperature module
- Monitoring/Alerts module
- KI Reports module
- Settings module

**Week 13 End: Integration**
- Update route registration
- Remove old storage.ts file (archive as `storage.ts.old`)
- Run full test suite
- Performance comparison
- **Commit**: `refactor(backend): complete modularization - remove legacy storage.ts`

**Success Criteria**:
- [ ] storage.ts reduced from 3,961 LOC to 0 (archived)
- [ ] 8 domain modules created
- [ ] All modules follow repository pattern
- [ ] N+1 queries fixed
- [ ] 75% test coverage for services
- [ ] API response times maintained or improved

**Deliverables**:
- 8 modular domains
- Unit tests for all services
- Performance comparison report
- **Git Tag**: `v2.0.0-modular-backend`

---

### PHASE 4: FRONTEND MODULARIZATION + CONTAINERIZATION (Week 14-19) [6 weeks, 2 agents]

**Two agents working in parallel**:
- **AGENT A**: Frontend refactoring
- **AGENT B**: Containerization

### AGENT A: Frontend Modularization (Week 14-19)

**Week 14: Shared Components & Design System**
1. Extract common UI components to shared library
   - Keep only 22 used components in `shared/components/ui/`
   - Standardize component APIs
   - Add component documentation (Storybook optional)
   - **Commit**: `refactor(frontend): create shared UI component library`

2. Implement design tokens (AGENT-A Task 4.1)
   - Create `client/src/styles/design-tokens.ts`
   - Update Tailwind config
   - **Commit**: `feat(frontend): implement design token system`

**Week 15-16: Feature Module Migration (Start with small features)**

**Auth Feature** (Week 15):
- Create `client/src/features/auth/`
- Move LoginForm, RegisterForm
- Extract useAuth hook (already exists)
- Create auth.api.ts
- **Commit**: `refactor(frontend): migrate auth feature to new structure`

**Weather & Temperature Features** (Week 15):
- Smallest, least coupled features
- Good learning opportunity
- **Commit**: `refactor(frontend): migrate weather and temperature features`

**Energy Dashboard** (Week 16):
- Medium complexity
- Extract EnergyChart, ConsumptionTable
- Create useEnergyData hook
- Fix React Query config (staleTime: Infinity → proper value)
- **Commit**: `refactor(frontend): migrate energy dashboard feature`
- **Commit**: `fix(frontend): correct React Query staleTime configuration`

**Week 17-19: Large Page Refactoring**

**UserManagement Page** (Week 17):
- Current: 2,088 LOC monolith
- Split into:
  - `features/user-management/components/UserTable.tsx`
  - `features/user-management/components/UserForm.tsx`
  - `features/user-management/components/UserFilters.tsx`
  - `features/user-management/hooks/useUsers.ts`
  - `features/user-management/pages/UserManagementPage.tsx` (<300 LOC)
- **Commit**: `refactor(frontend): modularize UserManagement page (2088 → ~800 LOC)`

**ObjectManagement Page** (Week 17-18):
- Current: 1,786 LOC
- Similar component extraction
- **Commit**: `refactor(frontend): modularize ObjectManagement page`

**NetworkMonitor Page** (Week 18):
- Current: 1,705 LOC
- Extract monitoring components
- **Commit**: `refactor(frontend): modularize NetworkMonitor page`

**SystemSettings & Maps Pages** (Week 19):
- SystemSettings: 2,019 LOC
- Maps: 1,100 LOC
- Complete feature migration
- **Commits**:
  - `refactor(frontend): modularize SystemSettings page`
  - `refactor(frontend): modularize Maps page`

**Success Criteria**:
- [ ] All features migrated to feature-based structure
- [ ] No page component >500 LOC
- [ ] React Query config fixed
- [ ] Bundle size maintained or reduced
- [ ] All routes working

**Deliverables**:
- Feature-based architecture
- Component library documentation
- **Git Tag**: `v2.1.0-modular-frontend`

---

### AGENT B: Containerization (Week 14-19)

**Week 14: Docker Setup**

1. Create backend Dockerfile (multi-stage)
   - Base: `node:20-alpine`
   - Build stage: Install deps, build TypeScript
   - Production stage: Only production deps
   - Non-root user
   - Health check
   - **File**: `apps/backend-api/Dockerfile`
   - **Commit**: `feat(docker): add multi-stage Dockerfile for backend`

2. Create frontend Dockerfile
   - Build stage: Vite build
   - Production stage: nginx:alpine to serve static files
   - **File**: `apps/frontend-web/Dockerfile`
   - **Commit**: `feat(docker): add Dockerfile for frontend`

**Week 15: Docker Compose Configuration**

3. Create docker-compose.yml
   - Services: postgres, backend, frontend, nginx
   - Networks: netzwaechter-network
   - Volumes: postgres-data (persistence)
   - Health checks for all services
   - **File**: `docker-compose.yml`
   - **Commit**: `feat(docker): add docker-compose for local development`

4. Create docker-compose.prod.yml
   - Production overrides
   - Environment variable templates
   - **File**: `docker-compose.prod.yml`
   - **Commit**: `feat(docker): add production docker-compose overrides`

**Week 16: Environment & Configuration**

5. Create .dockerignore files
   - Optimize build context
   - Reduce image size
   - **Files**: `apps/backend-api/.dockerignore`, `apps/frontend-web/.dockerignore`
   - **Commit**: `feat(docker): add dockerignore files for optimization`

6. Database initialization scripts
   - Create `db/init/01-create-schema.sql`
   - Create `db/init/02-seed-data.sql`
   - **Commit**: `feat(docker): add database initialization scripts`

**Week 17: Optimization**

7. Optimize Docker images
   - Layer caching optimization
   - Multi-stage builds
   - Image size reduction
   - Target: Backend <200MB, Frontend <50MB
   - **Commit**: `perf(docker): optimize Docker images for size and caching`

8. Setup nginx reverse proxy
   - Create nginx.conf
   - SSL/TLS configuration (for production)
   - API proxy to backend
   - Static file serving for frontend
   - **File**: `infrastructure/nginx/nginx.conf`
   - **Commit**: `feat(docker): configure nginx reverse proxy`

**Week 18-19: Testing & Documentation**

9. Test containerized environment
   - `docker-compose up` starts entire stack
   - Hot reload working in development
   - Database persistence verified
   - Health checks passing
   - **Test script**: `scripts/test-docker-setup.sh`

10. Optimize startup time
    - Parallel service startup where possible
    - Connection retry logic
    - Reduce wait times
    - **Commit**: `perf(docker): optimize container startup sequence`

11. Create Docker documentation
    - Setup guide
    - Troubleshooting
    - Production deployment guide
    - **File**: `docs/DOCKER_SETUP.md`
    - **Commit**: `docs: add comprehensive Docker setup guide`

**Success Criteria**:
- [ ] Single command starts entire stack: `docker-compose up`
- [ ] Hot reload working for dev
- [ ] Production images optimized (<250MB total)
- [ ] Health checks passing
- [ ] Startup time <2 minutes

**Deliverables**:
- Complete Docker setup
- Production-ready images
- Deployment documentation
- **Git Tag**: `v2.2.0-containerized`

---

### PHASE 5: MONOREPO SETUP (Week 20-21) [2 weeks]

**Goals**: Establish monorepo structure with shared packages

**Week 20: Monorepo Foundation**

1. Setup pnpm workspaces
   - Create `pnpm-workspace.yaml`
   - Convert package.json to monorepo root
   - Migrate apps to `apps/` directory
   - **Commit**: `feat: initialize pnpm monorepo workspace`

2. Create shared-types package
   - Extract TypeScript interfaces from backend + frontend
   - Create `packages/shared-types/src/`
   - Export all shared types
   - Update imports in apps
   - **Commit**: `feat(shared): create shared-types package`

3. Create shared-validation package
   - Install Zod in shared package
   - Move validation schemas
   - Use in both frontend (forms) and backend (DTOs)
   - **Commit**: `feat(shared): create shared-validation package with Zod`

**Week 21: Shared Utilities & Tooling**

4. Create shared-utils package
   - Extract common utilities (date, string, array helpers)
   - Remove duplicates
   - **Commit**: `feat(shared): create shared-utils package`

5. Setup monorepo build tooling
   - Install Turborepo (optional, for build caching)
   - Configure build dependencies
   - Setup parallel builds
   - **Commit**: `feat: setup Turborepo for monorepo builds`

6. Update CI/CD for monorepo
   - Update GitHub Actions workflow
   - Build only changed packages
   - Run tests in parallel
   - **File**: `.github/workflows/ci.yml`
   - **Commit**: `ci: update CI/CD for monorepo architecture`

**Success Criteria**:
- [ ] pnpm workspace working
- [ ] Shared packages used in both apps
- [ ] Build time optimized with caching
- [ ] CI/CD running tests in parallel
- [ ] Type safety across frontend/backend

**Deliverables**:
- Monorepo structure
- 4 shared packages
- Optimized build system
- **Git Tag**: `v3.0.0-monorepo`

---

### PHASE 6: TESTING & QA (Week 22-24) [3 weeks]

**Goals**: Achieve acceptable test coverage, E2E testing

**Week 22: Backend Testing**

1. Setup backend testing infrastructure
   - Install Jest/Vitest
   - Configure test database
   - Setup test utilities
   - **Commit**: `test: setup backend testing infrastructure`

2. Write unit tests for services
   - Target: 80% coverage for service layer
   - Focus on business logic
   - Mock repositories
   - **Commits**: One per module
     - `test: add unit tests for auth service`
     - `test: add unit tests for users service`
     - etc.

3. Write integration tests for API endpoints
   - Test all critical endpoints
   - Test authentication flows
   - Test tenant isolation
   - **Commit**: `test: add integration tests for API endpoints`

**Week 23: Frontend Testing**

4. Setup frontend testing
   - Install Vitest + Testing Library
   - Configure test environment
   - Setup MSW for API mocking
   - **Commit**: `test: setup frontend testing infrastructure`

5. Write component tests
   - Test shared UI components
   - Test feature components
   - Target: 70% coverage
   - **Commits**: Per feature
     - `test: add component tests for auth feature`
     - `test: add component tests for user management`

6. Write integration tests
   - Test complete feature flows
   - Test state management
   - **Commit**: `test: add frontend integration tests`

**Week 24: E2E Testing & Final QA**

7. Setup E2E testing
   - Install Playwright
   - Configure test environment
   - Create test data seeding
   - **Commit**: `test: setup Playwright E2E testing`

8. Write E2E test scenarios
   - User login flow
   - Object management flow
   - Energy dashboard flow
   - Settings management
   - **Commit**: `test: add critical E2E test scenarios`

9. Final QA & Performance Testing
   - Run full test suite
   - Performance comparison with baseline
   - Load testing (optional)
   - Security scan
   - **Deliverable**: `docs/QA_REPORT.md`

**Success Criteria**:
- [ ] Backend coverage: >75% for services
- [ ] Frontend coverage: >70% for business logic
- [ ] 10+ E2E scenarios passing
- [ ] All tests passing in CI/CD
- [ ] Performance maintained or improved

**Deliverables**:
- Comprehensive test suite
- Test coverage reports
- QA & Performance report
- **Git Tag**: `v3.1.0-tested`

---

## SECTION 5: FILE-BY-FILE EXECUTION STRATEGY

[Use the detailed file migration patterns from original prompt, adapted for Netzwächter files]

**Example: storage.ts → users module migration**

**PRE-MIGRATION**:
- [ ] Current location: `server/storage.ts:203-450` (getUserById, getAllUsers, createUser, etc.)
- [ ] Files importing storage: [grep results]
- [ ] Dependencies: database pool, schema
- [ ] Tests: None (need to create)

**MIGRATION STEPS**:
1. Create `server/src/modules/users/users.repository.ts`
2. Copy user-related methods from storage.ts
3. Refactor to use repository pattern:
   ```typescript
   // Before (storage.ts)
   async getUserById(id: string): Promise<User | null> {
     const [result] = await getDb().select().from(users).where(eq(users.id, id));
     if (!result) return null;

     // N+1 query issue
     if (result.userProfileId) {
       const [profile] = await getDb().select().from(userProfiles)...
     }
   }

   // After (users.repository.ts)
   async getUserById(id: string): Promise<User | null> {
     // Fixed with LEFT JOIN
     const result = await getDb()
       .select({
         ...users,
         userProfile: userProfiles
       })
       .from(users)
       .leftJoin(userProfiles, eq(users.userProfileId, userProfiles.id))
       .where(eq(users.id, id))
       .limit(1);

     return result[0] || null;
   }
   ```
4. Create `users.service.ts` for business logic
5. Create `users.controller.ts` for HTTP handling
6. Write tests: `users.repository.spec.ts`, `users.service.spec.ts`
7. Update imports in all files using storage.getUserById
8. Delete methods from storage.ts
9. Run tests
10. **Commit**: `refactor(backend): migrate users to repository pattern with N+1 fix`

---

## SECTION 6: SUCCESS METRICS & MONITORING

### 6.1 Metrics Dashboard

**Before Refactoring (Baseline)**:
```
Code Quality:
- Total LOC: 13,000
- Dead Code: 8,000 lines (61%)
- Largest File: storage.ts (3,961 LOC)
- Test Coverage: ~0%

Performance:
- Bundle Size: 2.1MB
- Connection Pool: 50 connections
- Build Time: [measure]
- API p95: [measure]

Security:
- Critical Vulnerabilities: 12
- Unprotected Endpoints: 13
- Password Hashing: Plaintext
```

**After Refactoring (Target)**:
```
Code Quality:
- Total LOC: ~9,000 (30% reduction)
- Dead Code: 0%
- Largest File: <500 LOC
- Test Coverage: >75% backend, >70% frontend

Performance:
- Bundle Size: 1.75MB (17% reduction)
- Connection Pool: 10-20 connections
- Build Time: -15% faster
- API p95: Maintained or improved

Security:
- Critical Vulnerabilities: 0
- Unprotected Endpoints: 0
- Password Hashing: bcrypt (12 rounds)
```

### 6.2 Phase Completion Tracking

```
✓ Phase 0: Preparation (Week 1-2)
✓ Phase 1: Security Fixes (Week 3-5)
✓ Phase 2: Dead Code Cleanup (Week 6-7)
⏳ Phase 3: Backend Modularization (Week 8-13)
⏳ Phase 4: Frontend + Docker (Week 14-19)
⏳ Phase 5: Monorepo Setup (Week 20-21)
⏳ Phase 6: Testing & QA (Week 22-24)
```

---

## SECTION 7: ROLLBACK & RISK MITIGATION

### 7.1 Critical Rollback Points

**Phase 1 (Security)**: Password migration
- **Risk**: Login fails for all users
- **Rollback**: Restore database from pre-migration snapshot
- **Time**: 5 minutes
- **Script**: `scripts/rollback-passwords.sh`

**Phase 3 (Backend Modularization)**: API breakage
- **Risk**: API endpoints return 500 errors
- **Rollback**: Revert to pre-modularization commit
- **Time**: 10 minutes
- **Git**: `git revert <commit-hash>`

**Phase 4 (Frontend Refactoring)**: UI breakage
- **Risk**: Pages don't render
- **Rollback**: Revert frontend commits, redeploy
- **Time**: 5 minutes

### 7.2 Testing Strategy Per Phase

**After Each Phase**:
1. Run full test suite (unit + integration + E2E)
2. Manual smoke testing of critical paths
3. Performance benchmarking
4. Security scan
5. Deploy to staging
6. Staging smoke tests
7. Get stakeholder approval
8. Deploy to production
9. Monitor for 24 hours

---

## SECTION 8: DELIVERABLES & DOCUMENTATION

### Final Deliverables

**Code Deliverables**:
1. ✅ Secure, modular backend (8 domain modules)
2. ✅ Feature-based frontend architecture
3. ✅ Monorepo with 4 shared packages
4. ✅ Full Docker containerization
5. ✅ Comprehensive test suite (>75% coverage)
6. ✅ CI/CD pipeline

**Documentation Deliverables**:
1. `README.md` - Updated for monorepo
2. `docs/ARCHITECTURE.md` - System architecture
3. `docs/SECURITY.md` - Security practices
4. `docs/DOCKER_SETUP.md` - Docker guide
5. `docs/DEVELOPMENT_GUIDE.md` - Developer onboarding
6. `docs/API_DOCUMENTATION.md` - API reference (94 endpoints)
7. `docs/DEPLOYMENT_GUIDE.md` - Production deployment
8. `docs/ROLLBACK_PROCEDURES.md` - Emergency procedures

**Reports Deliverables**:
1. `metrics-baseline.md` - Before/after comparison
2. `bundle-analysis-comparison.md` - Bundle size analysis
3. `performance-report.md` - API performance
4. `security-audit-report.md` - Security improvements
5. `QA_REPORT.md` - Testing results

---

## EXECUTION INSTRUCTIONS

**For the Implementation Team**:

1. **Follow the phases sequentially** - Do not skip ahead
2. **Use feature branches** for each phase
3. **Commit frequently** with descriptive messages
4. **Create PRs** for each major task (code review)
5. **Test thoroughly** after each change
6. **Update documentation** as you go
7. **Monitor metrics** throughout
8. **Communicate progress** in daily standups

**For Project Manager**:
- Track progress with provided Gantt chart
- Weekly progress reviews
- Risk assessment updates
- Resource allocation adjustments

**Success Criteria for Completion**:
- [ ] All 6 phases completed
- [ ] 0 critical security vulnerabilities
- [ ] 0% dead code
- [ ] >75% test coverage
- [ ] Containerized deployment working
- [ ] Documentation complete
- [ ] Team trained on new architecture

---

**Created**: 2025-10-07
**Project**: Netzwächter Monitoring Portal
**Estimated Total Duration**: 24 weeks (with 30% buffer: ~31 weeks / 7.5 months)
**Status**: Ready for Implementation

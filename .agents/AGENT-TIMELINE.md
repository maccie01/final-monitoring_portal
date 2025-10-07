# Agent Execution Timeline & Orchestration

**Project**: Netzwächter Monitoring Portal Refactoring
**Total Duration**: 8 weeks (estimated)
**Total Agents**: 5 agents
**Created**: 2025-10-07
**Status**: ✅ OPERATIONAL - Timeline Active

**Current Work Location**: `/Users/janschubert/code-projects/monitoring_firma/app-version-4_netzwächter/`
**Final Target Location**: `/Users/janschubert/code-projects/monitoring_firma/netzwaechter-refactored/`

---

## Overview

This document defines **when to use which agents**, their dependencies, and the execution timeline for the Netzwächter refactoring project.

**Important**: Agents work in the current directory, then the final refactored project will be copied to the target location (`netzwaechter-refactored/`) with the complete monorepo structure defined in `TARGET-ARCHITECTURE.md`.

## Agent Priority System

- **P0 (Critical)**: Must run first, blocks other agents
- **P1 (High)**: Run after P0 agents complete
- **P2 (Normal)**: Run after dependencies met

---

## Phase 1: Critical Foundation (Weeks 1-3) - P0 Agents

### ✅ Agent A: Frontend Cleanup Agent
**Status**: 🔄 **RUNNING** (Started 2025-10-07)
**Branch**: `cleanup/frontend-dead-code`
**Duration**: 2 weeks
**Priority**: P0

**Why First?**
- No dependencies
- Can run in parallel with Security Agent
- ZERO file conflicts with Security Agent (client/** vs server/**)

**Progress**: 6/11 tasks (55%)

**Recent Work**:
- ✅ Task 3.1: ARIA labels (Commit af294c2)
- ✅ Task 3.2: Button Guidelines (Commit 65cfb41)
- 🔄 Task 4.1: Design Token System (IN PROGRESS)

**Blocks**: None (independent work)

---

### ⏸️ Agent B: Security Hardening Agent
**Status**: ⏸️ **PAUSED** (Manual work complete, awaiting SDK restart)
**Branch**: `security/backend-hardening`
**Duration**: 3 weeks
**Priority**: P0

**Why First?**
- Critical security vulnerabilities
- Blocks Backend Modularization (storage.ts conflict)
- Can run in parallel with Frontend Cleanup

**Progress**: 4/9 tasks (44%)

**Completed Tasks**:
- ✅ SEC-1.1: bcrypt password hashing (Commit f104d5b)
- ✅ SEC-1.2: Remove admin bypass (Commit d8cf78a)
- ✅ SEC-1.3: SSL/TLS configuration (Commit 73d2e76)
- ✅ SEC-1.4: API rate limiting (Commit aca2596)

**Remaining Tasks**:
- 🔲 SEC-1.5: Environment variable security
- 🔲 SEC-1.6: Session secret rotation
- 🔲 SEC-1.7: SQL injection prevention
- 🔲 SEC-1.8: CORS configuration
- 🔲 SEC-1.9: Security documentation

**Blocks**: Backend Modularization Agent (storage.ts file conflict)

---

## Phase 2: Backend Refactoring (Weeks 4-6) - P1 Agents

### 🔲 Agent C: Backend Modularization Agent
**Status**: ⏳ **WAITING** (Blocked by Security Agent)
**Branch**: `refactor/backend-modules`
**Duration**: 2 weeks
**Priority**: P1

**Dependencies**:
- ⚠️ **BLOCKED BY**: Security Agent (storage.ts conflict)
- **Must wait**: Security Agent must merge to main first

**Why This Order?**
- Security Agent modifies storage.ts (password hashing)
- This agent SPLITS storage.ts into 8 modules
- Cannot run simultaneously - file conflict

**Task Overview**: Extract 3,961 LOC storage.ts into 8 domain modules

**Target Modules**:
1. auth (400 LOC)
2. users (600 LOC)
3. objects (700 LOC)
4. energy (600 LOC)
5. temperature (400 LOC)
6. monitoring (500 LOC)
7. ki-reports (400 LOC)
8. settings (400 LOC)

**Strategy**: Can spawn 8 parallel subagents (one per module)

**Blocks**: Database Optimizer Agent (needs new module structure)

---

### 🔲 Agent D: Database Optimizer Agent
**Status**: ⏳ **WAITING** (Blocked by Backend Modularization)
**Branch**: `perf/database-optimization`
**Duration**: 1 week
**Priority**: P1

**Dependencies**:
- ⚠️ **BLOCKED BY**: Backend Modularization Agent
- **Reason**: Needs new repository pattern to optimize queries
- **Must wait**: Backend Modularization must merge to main first

**Why This Order?**
- Backend Modularization creates repository pattern
- This agent optimizes those repositories
- Requires new module structure to work properly

**Task Overview**:
- Add database indexes
- Implement Redis caching
- Optimize slow queries
- Create monitoring dashboard

**Performance Goals**:
- 30-50% query performance improvement
- Cache hit ratio >80%
- All frequently-queried fields indexed

**Blocks**: None (can run in parallel with Containerization)

---

## Phase 3: Infrastructure (Weeks 6-8) - P1 Agents

### 🔲 Agent E: Containerization Agent
**Status**: ⏳ **READY** (No blockers, recommended after Backend Modularization)
**Branch**: `docker/containerization`
**Duration**: 2 weeks
**Priority**: P1

**Dependencies**:
- ✅ **No Hard Blockers**
- 📋 **Recommended After**: Backend Modularization (for clean module structure)
- **Can run**: In parallel with Database Optimizer

**Why This Order?**
- No file conflicts
- Better to containerize after modules are clean
- Can run alongside DB optimization

**Task Overview**:
- Create multi-stage Dockerfiles (backend + frontend)
- Configure docker-compose orchestration
- Production-ready deployment setup
- Health checks and networking

**Success Criteria**:
- Backend image <300MB
- Frontend image <200MB
- Single-command full-stack startup
- Hot reload in dev mode

**Blocks**: None

---

## Execution Timeline

### Visual Timeline

```
Week 1-2:  [Frontend Cleanup ██████████████] ✅ RUNNING
           [Security Agent  ████████------] ⏸️ PAUSED (44%)

Week 3:    [Security Agent  ██████████████] Complete → MERGE
           [Frontend Cleanup ██████████████] Complete → MERGE

Week 4-5:  [Backend Modularization ██████████████] Start after merge

Week 6:    [Backend Modularization ██████████████] Complete → MERGE
           [DB Optimizer    ██████████████] Start
           [Containerization ████████------] Start (parallel)

Week 7-8:  [DB Optimizer    ██████████████] Complete → MERGE
           [Containerization ██████████████] Complete → MERGE

           🎉 ALL AGENTS COMPLETE
```

### Sequential Dependencies

```
Timeline:
┌─────────────────┐
│ P0 Phase (Weeks 1-3)                                  │
├─────────────────┤
│ Frontend Cleanup (2w) ──────────────────────┐        │
│ Security Agent (3w) ─────────────────────┐  │        │
│                                           ↓  ↓        │
│                                     [MERGE to main]   │
└─────────────────┘                           ↓
┌─────────────────┐                           ↓
│ P1 Phase (Weeks 4-6)                        ↓        │
├─────────────────┤                           ↓
│ Backend Modularization (2w) ←───────────────┘        │
│   ↓                                                   │
│   └─→ [MERGE to main]                                │
│           ↓                                           │
│           ├─→ DB Optimizer (1w) ─────────┐           │
│           └─→ Containerization (2w) ──┐  │           │
│                                       ↓  ↓           │
│                                 [MERGE to main]      │
└─────────────────┘                      ↓
                                         ↓
                                   🎉 COMPLETE
```

---

## Current Status (2025-10-07)

### Active Work
- ✅ **Frontend Cleanup Agent**: Task 4.1 (Design Tokens) - 55% complete
- ⏸️ **Security Agent**: Paused at 44%, ready to resume via SDK

### Immediate Next Steps

1. **Complete Frontend Agent** (5 tasks remaining)
   - Expected: ~1 week
   - Will auto-commit and update progress

2. **Resume Security Agent** (5 tasks remaining)
   - Spawn via: `python .agents/spawn_agent.py security-agent`
   - Expected: ~1.5 weeks

3. **Merge Both to Main** (Week 3)
   - Create PRs for both branches
   - Review and merge

4. **Start Backend Modularization** (Week 4)
   - Can spawn 8 parallel subagents
   - Expected: ~2 weeks

5. **Start DB Optimizer + Containerization** (Week 6)
   - Run in parallel
   - Expected: 1-2 weeks

---

## File Conflict Analysis Matrix

### Agent File Access Matrix

| File/Directory | Security | Frontend | Backend Mod | DB Opt | Docker | Conflict? |
|----------------|----------|----------|-------------|--------|--------|-----------|
| **Backend Files** |
| server/storage.ts | ✅ WRITE | ❌ None | ✅ WRITE | ✅ READ | ❌ None | ⚠️ CONFLICT |
| server/controllers/authController.ts | ✅ WRITE | ❌ None | ❌ None | ❌ None | ❌ None | ✅ SAFE |
| server/connection-pool.ts | ✅ WRITE | ❌ None | ❌ None | ✅ WRITE | ❌ None | ⚠️ CONFLICT |
| server/routes/*.ts | ✅ WRITE | ❌ None | ✅ WRITE | ❌ None | ❌ None | ⚠️ CONFLICT |
| **Frontend Files** |
| client/src/pages/*.tsx | ❌ None | ✅ WRITE | ❌ None | ❌ None | ❌ None | ✅ SAFE |
| client/src/components/ui/*.tsx | ❌ None | ✅ WRITE | ❌ None | ❌ None | ❌ None | ✅ SAFE |
| **Config Files** |
| .env | ✅ WRITE | ❌ None | ❌ None | ❌ None | ✅ READ | ⚠️ CONFLICT |
| package.json | ✅ WRITE | ✅ WRITE | ✅ WRITE | ✅ WRITE | ✅ WRITE | ⚠️ CONFLICT |
| **Docker Files** |
| Dockerfile | ❌ None | ❌ None | ❌ None | ❌ None | ✅ WRITE | ✅ SAFE |
| docker-compose.yml | ❌ None | ❌ None | ❌ None | ❌ None | ✅ WRITE | ✅ SAFE |

### Conflict Resolution

**Conflict 1: server/storage.ts**
- Security Agent modifies (password hashing) → Week 1-3
- Backend Mod refactors → modules → Week 4-5 (must wait)
- DB Opt optimizes new modules → Week 6-7 (must wait)

**Conflict 2: server/connection-pool.ts**
- Security Agent adds SSL → Week 1
- DB Opt optimizes pool size → Week 6-7 (must wait)

**Conflict 3: server/routes/\*.ts**
- Security Agent adds auth middleware → Week 2
- Backend Mod moves routes to modules → Week 4-5 (must wait)

---

## Parallel Execution Matrix

| Agents | Can Run Together? | Why / Why Not |
|--------|------------------|---------------|
| Frontend + Security | ✅ YES | ZERO file overlap (client/** vs server/**) |
| Security + Backend Mod | ❌ NO | storage.ts conflict |
| Backend Mod + DB Opt | ❌ NO | DB Opt needs new repository pattern |
| DB Opt + Container | ✅ YES | No file conflicts |
| Frontend + Backend Mod | ✅ YES | No file conflicts |
| Frontend + DB Opt | ✅ YES | No file conflicts |
| Frontend + Container | ✅ YES | No file conflicts |

**Key Insight**: Frontend Cleanup can run in parallel with ANY other agent.

---

## Dependency Graph

```
┌──────────────────┐
│ Security Agent   │ (Week 1-3)
│ - Auth, passwords│
│ - Endpoints      │
└─────────┬────────┘
          │ modifies storage.ts, routes
          │ BLOCKS ↓
┌─────────▼────────┐
│ Frontend Agent   │ (Week 1-2, parallel with Security)
│ - Dead code      │
│ - UI cleanup     │
└──────────────────┘
          │
          │ (both complete, merge to main)
          ▼
┌──────────────────┐
│ Backend Module   │ (Week 4-5)
│ - Refactor       │
│ storage.ts       │
└─────────┬────────┘
          │ creates modules
          │ ENABLES ↓
     ┌────┴────┐
     ▼         ▼
┌─────────┐ ┌─────────┐
│DB Optim.│ │Docker   │ (Week 6-7, parallel)
│         │ │Agent    │
└─────────┘ └─────────┘
```

**Legend**:
- ⬇️ Blocks/Must wait for
- ⬇️ Enables/Can proceed after
- Parallel agents shown side-by-side

---

## Agent Spawning Commands

### Spawn Individual Agents

```bash
# Frontend Cleanup (already running - PID 984416)
python .agents/spawn_agent.py frontend-cleanup-agent

# Security Agent (ready to start)
python .agents/spawn_agent.py security-agent

# Backend Modularization (wait for security merge)
python .agents/spawn_agent.py backend-modularization-agent

# Database Optimizer (wait for backend merge)
python .agents/spawn_agent.py database-optimizer-agent

# Containerization (ready after backend merge)
python .agents/spawn_agent.py containerization-agent
```

### Check Agent Status

```bash
# View all agent status
python .agents/orchestrator.py status

# View specific agent progress
cat .agents/logs/frontend-agent-progress.md
cat .agents/logs/security-agent-progress.md

# View latest commits
git log cleanup/frontend-dead-code -5
git log security/backend-hardening -5
```

---

## Risk Mitigation

### What If Security Agent Takes Longer?

**Impact**: Delays Backend Modularization → delays DB Optimizer
**Mitigation**:
- Frontend Cleanup continues unaffected
- Containerization can start early (recommended after backend, but no hard blocker)
- Timeline extends by Security Agent delay

### What If Backend Modularization Fails?

**Impact**: DB Optimizer cannot optimize new repository pattern
**Mitigation**:
- Can still optimize existing storage.ts queries
- Containerization can proceed
- Rollback strategy: `git revert` all commits

### What If Two Agents Conflict?

**Prevention**:
- Validation Matrix checked (see parallel execution matrix)
- Frontend (client/**) and Security (server/**) = ZERO overlap
- Backend Mod and Security must run sequentially (validated)

**Detection**:
- Manager validates all commits
- Build verification after each task
- Merge conflicts detected before PR merge

---

## Success Metrics

### Per Agent

| Agent | Success Criteria | Validation |
|-------|-----------------|------------|
| Frontend Cleanup | Bundle -350KB, UI standardized | `npm run build`, bundle analysis |
| Security | Zero critical vulns, bcrypt implemented | `npm audit`, password format check |
| Backend Mod | 8 modules created, storage.ts deleted | File structure, test coverage |
| DB Optimizer | 30-50% query improvement, caching working | Benchmark tests, monitoring |
| Containerization | <300MB backend, <200MB frontend | Docker image sizes, health checks |

### Overall Project

- ✅ All builds passing
- ✅ All tests passing (>75% coverage)
- ✅ Zero critical security vulnerabilities
- ✅ Performance improved by >30%
- ✅ Codebase reduced by >4,000 LOC
- ✅ Production-ready Docker deployment
- ✅ Complete monorepo structure in `/Users/janschubert/code-projects/monitoring_firma/netzwaechter-refactored/`
- ✅ 8 backend modules extracted from storage.ts (3,961 LOC → ~500 LOC per module)
- ✅ 8 frontend feature modules
- ✅ 3 shared packages (types, validation, utils)

---

## When to Use Which Agent

### Use Frontend Cleanup Agent When:
- ✅ Removing dead code from client/**
- ✅ Standardizing UI components
- ✅ Optimizing bundle size
- ✅ Improving accessibility
- ✅ Can run anytime (no dependencies)

### Use Security Agent When:
- ✅ Fixing vulnerabilities in server/**
- ✅ Implementing authentication/authorization
- ✅ Hardening backend security
- ⚠️ Must complete before Backend Modularization

### Use Backend Modularization Agent When:
- ⚠️ Security Agent merged to main
- ✅ Ready to refactor storage.ts
- ✅ Implementing repository pattern
- ⚠️ Must complete before DB Optimizer

### Use Database Optimizer Agent When:
- ⚠️ Backend Modularization merged to main
- ✅ Optimizing query performance
- ✅ Implementing caching strategy
- ✅ Adding database indexes

### Use Containerization Agent When:
- ✅ Creating Docker deployment
- 📋 Recommended: After Backend Modularization (cleaner structure)
- ✅ Can run in parallel with DB Optimizer
- ✅ Production deployment preparation

---

## Manager Responsibilities

As the managing agent, monitor and validate:

1. **Daily**:
   - Check agent progress logs
   - Validate new commits
   - Verify builds pass

2. **Per Task Completion**:
   - Review code changes
   - Run build verification
   - Update timeline if delays

3. **Per Agent Completion**:
   - Review all commits
   - Create pull request
   - Verify success criteria met
   - Update agent-status.json

4. **Before Spawning Next Agent**:
   - Verify dependencies met
   - Check for conflicts
   - Update timeline estimates

---

## Timeline Adjustments

**Last Updated**: 2025-10-07

| Date | Change | Reason | Impact |
|------|--------|--------|--------|
| 2025-10-07 | Security Agent paused at 44% | Transitioning to SDK execution | +0 days (parallel with Frontend) |
| 2025-10-07 | Frontend Agent accelerated | Autonomous work via SDK | -2 days |

**Current Projection**: On track for 8-week completion

---

**Manager**: Claude (this instance)
**Orchestration Mode**: SDK-based autonomous agents
**Execution Status**: ✅ ACTIVE
**Timeline Health**: 🟢 ON TRACK

---

## Final Deliverable

### Target Location
**Path**: `/Users/janschubert/code-projects/monitoring_firma/netzwaechter-refactored/`

### What Will Be There

A production-ready monorepo with:

1. **apps/** - Applications
   - `backend-api/` - Modular backend (8 domain modules)
   - `frontend-web/` - Feature-based frontend (8 features)

2. **packages/** - Shared code
   - `shared-types/` - TypeScript types
   - `shared-validation/` - Validation schemas
   - `shared-utils/` - Utility functions

3. **infrastructure/** - Deployment
   - `docker/` - Dockerfiles and compose configs
   - `nginx/` - Reverse proxy config
   - `scripts/` - Deployment automation

4. **Complete Documentation**
   - API docs (OpenAPI)
   - Architecture docs
   - Deployment guides
   - Development guides

### Migration Process

1. **Weeks 1-8**: Agents refactor in current directory
2. **Week 8**: Create target directory structure
3. **Week 8**: Copy refactored code to target
4. **Week 8**: Final verification and deployment

See `TARGET-ARCHITECTURE.md` for complete structure details.

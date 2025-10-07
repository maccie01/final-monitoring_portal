# Master Execution Plan - Netzwächter Refactoring

Created: 2025-10-07
Purpose: Complete step-by-step execution plan for all agents

---

## Executive Summary

**Objective**: Transform monolithic Netzwächter application into clean, modular, secure, containerized system
**Approach**: Multi-agent parallel + sequential execution via Claude Agent SDK
**Duration**: 7-8 weeks (vs 16+ weeks sequential)
**Success Criteria**: Zero critical vulnerabilities, modular architecture, production-ready deployment

---

## Infrastructure Ready

### ✅ Prerequisites Complete
- [x] Agent SDK infrastructure created (`.agents/` directory)
- [x] Agent configurations prepared (Security, Frontend Cleanup)
- [x] Orchestrator implemented (`orchestrator.py`)
- [x] Git workflow defined (`configs/git-workflow.json`)
- [x] Validation matrix created (file conflicts analyzed)
- [x] Todo mapping complete (100% coverage)
- [x] Target architecture designed
- [x] New project structure created (`netzwaechter-refactored/`)

### ⏳ Setup Remaining
- [ ] Install Python dependencies (`pip install -r requirements.txt`)
- [ ] Initialize orchestrator state (`python orchestrator.py init`)
- [ ] Create database backup (pre-agent safety)
- [ ] Create git backup branch (`backup-pre-agents`)

---

## Execution Phases

### Phase 1: Parallel Security + Frontend (Weeks 1-3)

**Timeline**: 3 weeks
**Agents**: Security Agent + Frontend Cleanup Agent
**Conflict Status**: ✅ SAFE - No file overlaps

#### Terminal 1: Security Agent

**Branch**: `security/backend-hardening`
**Duration**: 2-3 weeks
**Priority**: P0 - CRITICAL

**Command**:
```bash
cd .agents
python orchestrator.py spawn security-agent
```

**Tasks** (12 critical security fixes):
1. SEC-1.1: Implement bcrypt password hashing (3h)
2. SEC-1.2: Remove hardcoded admin bypass (30min)
3. SEC-1.3: Enable SSL for database (1h)
4. SEC-1.4: Generate strong SESSION_SECRET (15min)
5. SEC-2.1: Protect 13 unprotected endpoints (2h)
6. SEC-2.2: Implement rate limiting (1h)
7. SEC-2.3: Secure email configuration (30min)
8. SEC-3.1: Optimize connection pool (2h)
9. SEC-3.2: Fix N+1 query issues (4h)
10. SEC-4.1: Environment variable audit (1h)
11. SEC-4.2: Production deployment checklist (2h)
12. SEC-4.3: Rollback procedures (1h)

**Expected Commits**: ~15 commits (1-2 per task)

**Files Modified**:
- `server/storage.ts` (password hashing, query optimization)
- `server/controllers/authController.ts` (remove bypass)
- `server/connection-pool.ts` (pool optimization, SSL)
- `server/routes/*.ts` (add authentication middleware)
- `server/middleware/rate-limit.ts` (new file)
- `server/email-service.ts` (SSL/TLS)
- `.env` (new secrets)
- `.env.example` (documentation)

**Success Criteria**:
- ✅ All 12 security vulnerabilities resolved
- ✅ 100% passwords bcrypt hashed
- ✅ 100% API endpoints authenticated
- ✅ SSL/TLS enabled for DB and email
- ✅ All tests passing
- ✅ Security scan clean (`npm audit`)

**Monitoring**:
```bash
# Check status every 30-60 minutes
python orchestrator.py status

# View logs
python orchestrator.py logs security-agent --follow
```

**Completion Signal**: PR created automatically to `main`

---

#### Terminal 2: Frontend Cleanup Agent

**Branch**: `cleanup/frontend-dead-code`
**Duration**: 2 weeks
**Priority**: P0 - CRITICAL

**Command**:
```bash
cd .agents
python orchestrator.py spawn frontend-cleanup-agent
```

**Tasks** (11 frontend optimization tasks):
1. FE-1.1: Delete 5 unused page components (30min)
2. FE-1.2: Delete 26 unused UI components (2h)
3. FE-2.1: Standardize import quotes (1h)
4. FE-2.2: Standardize Card component imports (45min)
5. FE-3.1: Add ARIA labels to icon buttons (2h)
6. FE-3.2: Button variant consistency (1h)
7. FE-4.1: Create design token system (3h)
8. FE-4.2: Component documentation (2h)
9. FE-5.1: Automated bundle size monitoring (1h)
10. FE-5.2: Accessibility audit (2h)
11. FE-5.3: Frontend integration testing (3h)

**Expected Commits**: ~11 commits (1 per major task)

**Files Modified**:
- `client/src/pages/*` (delete 5 unused pages)
- `client/src/components/ui/*` (delete 26 components)
- `client/src/**/*.tsx` (import standardization)
- `client/src/styles/design-tokens.ts` (new file)
- `.eslintrc.json` (enforce quote style)
- `vite.config.ts` (bundle analysis)

**Files Deleted**: 31 files (~6,940 lines of dead code)

**Success Criteria**:
- ✅ 0% dead code (from 15%)
- ✅ Bundle size reduced by -200KB minimum
- ✅ 100% import consistency
- ✅ Lighthouse accessibility score >90
- ✅ All routes functional
- ✅ Build successful

**Monitoring**:
```bash
python orchestrator.py status
python orchestrator.py logs frontend-cleanup-agent --follow
```

**Completion Signal**: PR created automatically to `main`

---

### Phase 1 Completion Checklist

**Week 3 End**:
- [ ] Security Agent: PR created and reviewed
- [ ] Frontend Agent: PR created and reviewed
- [ ] Both PRs pass CI/CD checks
- [ ] Manual testing completed
- [ ] Security scan clean
- [ ] Merge Security Agent PR to `main`
- [ ] Merge Frontend Agent PR to `main`
- [ ] Tag release: `v1.1.0-security-hardened`
- [ ] Deploy to staging for validation
- [ ] All tests passing on `main`

**Gate to Phase 2**: Both agents merged to `main`, no blocking issues

---

### Phase 2: Backend Modularization (Weeks 4-9)

**Timeline**: 6 weeks (sequential only) → **2 weeks with 8 parallel subagents**
**Agent**: Backend Modularization Agent (with 8 subagents)
**Conflict Status**: ⚠️ MUST WAIT for Security Agent (storage.ts conflicts)

**Branch**: `refactor/backend-modules`
**Duration**: 2 weeks with subagents
**Priority**: P1

**Command**:
```bash
# After Phase 1 complete
cd .agents
python orchestrator.py spawn backend-modularization-agent
```

**Strategy**: Parent agent spawns 8 subagents, one per module

#### Subagents (Run in Parallel)

1. **Auth Module Subagent**
   - Extract auth logic from storage.ts
   - Create: controller, service, repository, routes, types
   - Endpoints: `/api/auth/login`, `/api/auth/logout`
   - Duration: ~2 days

2. **Users Module Subagent**
   - Extract user CRUD from storage.ts
   - Fix N+1 query (already done by Security Agent)
   - Create: full module structure
   - Endpoints: `/api/users/*`, `/api/user-profiles/*`
   - Duration: ~3 days

3. **Objects Module Subagent**
   - Extract object management
   - Handle objdata JSONB field
   - Create: full module structure
   - Endpoints: `/api/objects/*`
   - Duration: ~3 days

4. **Energy Module Subagent**
   - Extract energy/consumption tracking
   - Handle zlog data, day_comp table
   - Create: full module structure
   - Endpoints: `/api/energy/*`
   - Duration: ~3 days

5. **Temperature Module Subagent**
   - Extract temperature monitoring
   - Integrate outdoor temperature data
   - Create: full module structure
   - Endpoints: `/api/temperature/*`
   - Duration: ~2 days

6. **Monitoring Module Subagent**
   - Extract network monitoring, alerts
   - Create: full module structure
   - Endpoints: `/api/monitoring/*`
   - Duration: ~2 days

7. **KI Reports Module Subagent**
   - Extract AI report generation
   - Create: full module structure
   - Endpoints: `/api/ki-reports/*`
   - Duration: ~2 days

8. **Settings Module Subagent**
   - Extract application settings
   - Create: full module structure
   - Endpoints: `/api/settings/*`
   - Duration: ~2 days

**Parent Agent Responsibilities**:
- Coordinate subagent work
- Ensure consistent patterns across modules
- Handle shared code extraction
- Integrate all modules into `app.ts`
- Update imports across codebase
- Create module documentation
- Run integration tests

**Expected Structure After**:
```
apps/backend-api/src/modules/
├── auth/       (~400 LOC)
├── users/      (~600 LOC)
├── objects/    (~700 LOC)
├── energy/     (~600 LOC)
├── temperature/ (~400 LOC)
├── monitoring/ (~500 LOC)
├── ki-reports/ (~400 LOC)
└── settings/   (~400 LOC)

Total: ~4,000 LOC (from 3,961 LOC monolithic storage.ts)
Average module size: ~500 LOC (manageable, maintainable)
```

**Success Criteria**:
- ✅ storage.ts completely refactored (0 LOC remaining)
- ✅ 8 clean modules created
- ✅ Repository pattern implemented
- ✅ All API endpoints still functional
- ✅ All tests passing
- ✅ 75% test coverage minimum
- ✅ Build successful

**Monitoring**:
```bash
python orchestrator.py status
python orchestrator.py logs backend-modularization-agent --follow
```

**Completion Signal**: PR created with all 8 modules

---

### Phase 2 Completion Checklist

**Week 9 End**:
- [ ] All 8 modules extracted and tested
- [ ] storage.ts fully refactored
- [ ] Integration tests passing
- [ ] PR reviewed by senior developer
- [ ] Performance benchmarks meet targets
- [ ] Merge to `main`
- [ ] Tag release: `v2.0.0-modular-backend`
- [ ] Deploy to staging
- [ ] Monitor for regressions

**Gate to Phase 3**: Backend modularization complete, all tests passing

---

### Phase 3: Parallel Database + Docker (Weeks 10-12)

**Timeline**: 2 weeks
**Agents**: DB Optimizer Agent + Containerization Agent
**Conflict Status**: ✅ SAFE - Different concerns, no file overlaps

#### Terminal 1: DB Optimizer Agent

**Branch**: `perf/database-optimization`
**Duration**: 1 week
**Priority**: P1

**Command**:
```bash
cd .agents
python orchestrator.py spawn database-optimizer-agent
```

**Tasks**:
1. Add indexes for frequently queried fields (2h)
2. Optimize JOIN patterns in new modules (3h)
3. Implement query result caching (Redis) (4h)
4. Add database monitoring/observability (2h)
5. Create query performance benchmarks (2h)
6. Optimize slow queries identified (4h)
7. Add connection pool metrics (1h)
8. Document query optimization strategies (2h)

**Expected Commits**: ~8 commits

**Files Modified**:
- All module `*.repository.ts` files (query optimization)
- `db/schema.ts` (add indexes)
- `server/config/redis.config.ts` (new file)
- `server/middleware/cache.middleware.ts` (new file)

**Success Criteria**:
- ✅ Query performance improved by 30-50%
- ✅ Indexes added for all frequently queried fields
- ✅ Redis caching implemented
- ✅ Monitoring dashboard functional
- ✅ All tests passing

---

#### Terminal 2: Containerization Agent

**Branch**: `docker/containerization`
**Duration**: 2 weeks
**Priority**: P1

**Command**:
```bash
cd .agents
python orchestrator.py spawn containerization-agent
```

**Tasks**:
1. Create multi-stage Dockerfile for backend (3h)
2. Create multi-stage Dockerfile for frontend (3h)
3. Optimize Docker layer caching (2h)
4. Create docker-compose.yml for local dev (3h)
5. Create docker-compose.prod.yml (3h)
6. Setup PostgreSQL container (2h)
7. Setup Redis container (2h)
8. Configure networking (2h)
9. Implement health checks (2h)
10. Create .dockerignore files (1h)
11. Document Docker commands (2h)
12. Test full stack deployment (3h)

**Expected Commits**: ~12 commits

**Files Created**:
- `infrastructure/docker/Dockerfile.backend`
- `infrastructure/docker/Dockerfile.frontend`
- `infrastructure/docker/docker-compose.yml`
- `infrastructure/docker/docker-compose.prod.yml`
- `infrastructure/docker/.dockerignore`
- `infrastructure/nginx/nginx.conf`
- `infrastructure/scripts/deploy.sh`
- `infrastructure/scripts/backup-db.sh`

**Success Criteria**:
- ✅ Full stack runs with `docker-compose up`
- ✅ Hot reload working in development
- ✅ Production images optimized (<500MB total)
- ✅ Health checks passing
- ✅ All services communicating
- ✅ Documentation complete

---

### Phase 3 Completion Checklist

**Week 12 End**:
- [ ] DB Optimizer: PR reviewed and merged
- [ ] Docker Agent: PR reviewed and merged
- [ ] Full stack deployable with Docker
- [ ] Performance benchmarks documented
- [ ] Tag release: `v2.2.0-containerized`
- [ ] Deploy to production (if approved)

---

## Rollout Timeline

### Week 1: Security Agent Start
- Day 1: Agent spawned, branch created
- Day 2-3: Critical security fixes (SEC-1.1 to SEC-1.4)
- Day 4-5: API protection (SEC-2.1 to SEC-2.3)
- Day 6-7: Database optimization (SEC-3.1 to SEC-3.2)
- Week 2: Infrastructure tasks (SEC-4.1 to SEC-4.3)
- Week 3: Testing, documentation, PR creation

### Week 1-2: Frontend Agent (Parallel)
- Week 1: Dead code elimination, standardization
- Week 2: Design system, testing, PR creation

### Week 3: Phase 1 Completion
- Review PRs
- Merge to main
- Deploy to staging
- Gate decision for Phase 2

### Week 4-5: Backend Modularization
- Week 4: Subagents extract modules (8 parallel)
- Week 5: Integration, testing, PR creation

### Week 6-7: Contingency / Additional Backend Work
- Buffer for complex refactoring
- Additional testing
- Performance tuning

### Week 8-9: Backend Modularization Completion
- Final testing
- PR review and merge
- Staging deployment

### Week 10-12: DB + Docker (Parallel)
- Week 10: DB optimization + Docker setup
- Week 11: Testing and refinement
- Week 12: Final PRs, merge, production deployment

---

## Risk Management

### High-Risk Operations

1. **Password Migration (SEC-1.1)**
   - **Risk**: Users unable to login if migration fails
   - **Mitigation**: Run migration script first, validate all passwords, keep rollback script ready
   - **Rollback**: Restore database backup, revert code

2. **SESSION_SECRET Change (SEC-1.4)**
   - **Risk**: All users logged out simultaneously
   - **Mitigation**: Schedule during maintenance window, notify users in advance
   - **Impact**: Temporary (users re-login)

3. **Backend Modularization**
   - **Risk**: Breaking changes to API contracts
   - **Mitigation**: Maintain same API contracts, extensive integration tests
   - **Rollback**: Git revert to pre-modularization

4. **Database Schema Changes**
   - **Risk**: Data loss or corruption
   - **Mitigation**: Backup before migrations, test migrations on staging
   - **Rollback**: Database restore + code rollback

### Rollback Procedures

**Immediate Rollback** (Critical failure):
```bash
# Stop server
npm run stop

# Rollback code
git checkout main
git branch rollback-$(date +%Y%m%d)
git reset --hard <last-good-commit>

# Restore database (if needed)
./infrastructure/scripts/backup-db.sh restore <backup-file>

# Rebuild and restart
npm install
npm run build
npm start

# Verify
npm run health-check
```

**Partial Rollback** (Single agent issue):
```bash
# Revert specific PR
git revert <merge-commit-hash>
git push origin main

# Deploy reverted version
npm install
npm run build
npm start
```

---

## Monitoring & Observability

### Real-Time Agent Monitoring

```bash
# Dashboard (every 30-60 minutes)
python orchestrator.py status

# Specific agent logs
python orchestrator.py logs security-agent
python orchestrator.py logs frontend-cleanup-agent
python orchestrator.py logs backend-modularization-agent

# Follow logs in real-time
python orchestrator.py logs security-agent --follow
```

### Application Monitoring (Post-Deployment)

**Metrics to Track**:
- Error rate (should be <1%)
- Response time (p50, p95, p99)
- Database query performance
- Connection pool utilization
- Memory usage
- CPU usage

**Tools**:
- Application logs: `logs/`
- Database logs: PostgreSQL logs
- System metrics: `top`, `htop`
- Custom dashboard: `/api/db/pool-stats`

---

## Communication Protocol

### Agent → Orchestrator

Every 30 minutes or on significant event:
```json
{
  "agent_id": "security-agent",
  "status": "in_progress",
  "current_task": "SEC-1.1",
  "progress": 0.42,
  "tests_passing": true,
  "blockers": [],
  "files_modified": ["server/storage.ts"],
  "next_action": "Run migration script"
}
```

### Orchestrator → Human

Alert conditions:
- Agent blocked (needs decision)
- Tests failing (requires fix)
- Merge conflict (requires resolution)
- Critical error (requires intervention)

**Notification Channels**:
- CLI output: `python orchestrator.py status`
- Log files: `logs/<agent-id>.log`
- Email: (optional configuration)

---

## Success Criteria

### Code Quality
- ✅ Dead code: 0% (from 15%)
- ✅ Test coverage: >75% (from minimal)
- ✅ TypeScript strict mode: enabled
- ✅ ESLint errors: 0
- ✅ Security vulnerabilities: 0 (from 12 critical)

### Performance
- ✅ Bundle size: -200KB minimum
- ✅ Database queries: -50% to -99.5%
- ✅ Connection pool: 60-90% reduction
- ✅ Build time: <45s
- ✅ Page load time: <3s

### Architecture
- ✅ Backend modules: 8 clean modules
- ✅ Average module size: ~500 LOC
- ✅ Frontend features: 8 feature modules
- ✅ Shared packages: 3 (types, validation, utils)

### Security
- ✅ Password security: 100% bcrypt
- ✅ API authentication: 100%
- ✅ SSL/TLS: 100% encrypted
- ✅ Rate limiting: implemented
- ✅ Environment variables: secured

### Infrastructure
- ✅ Docker: full containerization
- ✅ docker-compose: works locally
- ✅ Production deployment: ready
- ✅ Health checks: passing
- ✅ Rollback procedures: tested

---

## Final Deliverables

### Code
1. **5 merged branches**:
   - `security/backend-hardening` → `main`
   - `cleanup/frontend-dead-code` → `main`
   - `refactor/backend-modules` → `main`
   - `perf/database-optimization` → `main`
   - `docker/containerization` → `main`

2. **New project structure**: `netzwaechter-refactored/`

### Documentation
1. **Architecture Documentation**:
   - TARGET-ARCHITECTURE.md (this document)
   - Module documentation (8 modules)
   - API documentation (OpenAPI spec)

2. **Operational Documentation**:
   - Deployment guide (Docker)
   - Rollback procedures
   - Monitoring setup
   - Development guide

3. **Agent Execution Reports**:
   - Security Agent report
   - Frontend Agent report
   - Backend Agent report
   - DB Optimizer report
   - Docker Agent report

### Artifacts
1. **Security Audit**: Clean scan, 0 vulnerabilities
2. **Performance Benchmarks**: Before/after metrics
3. **Test Coverage Report**: >75% coverage
4. **Bundle Analysis**: Size reduction documented
5. **Git Tags**: v1.1.0, v2.0.0, v2.2.0

---

## Timeline Summary

```
Week 1-3:  Security + Frontend (parallel)        ████████████
Week 4-9:  Backend Modularization (sequential)   ████████████████████████
Week 10-12: DB + Docker (parallel)               ████████

Total: 12 weeks (3 + 6 + 2 + 1 buffer)
```

**With Agent SDK Optimization**:
```
Week 1-3:  Security + Frontend (parallel)        ████████████
Week 4-5:  Backend Modularization (8 subagents)  ████████
Week 6-7:  DB + Docker (parallel)                ████████

Total: 7-8 weeks (65% faster)
```

---

## Next Actions

### Immediate (Today)
1. ✅ Validation matrix complete
2. ✅ Todo mapping complete
3. ✅ Target architecture complete
4. ✅ Directory structure created
5. ✅ Execution plan complete

### Tomorrow
1. Install Python dependencies
2. Initialize orchestrator
3. Create database backup
4. Create git backup branch
5. **Spawn Security Agent** (Terminal 1)
6. **Spawn Frontend Agent** (Terminal 2)
7. Begin monitoring

---

**Status**: Ready to execute
**Confidence**: High (all conflicts resolved, plan validated)
**Risk Level**: Low-Medium (comprehensive rollback procedures)
**Expected Success**: 95%+ (detailed planning, proven patterns)

---

Created: 2025-10-07
Last Updated: 2025-10-07
Status: ✅ READY TO EXECUTE

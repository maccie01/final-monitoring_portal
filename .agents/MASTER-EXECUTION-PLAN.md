# Master Execution Plan - Netzwächter Refactoring

Created: 2025-10-07
Last Updated: 2025-10-07 21:45
Purpose: Complete step-by-step execution plan for managing agent

**Status**: ✅ IN EXECUTION - Phase 1 COMPLETE, Phase 2 ACTIVE

---

## Executive Summary

**Objective**: Transform monolithic Netzwächter application into clean, modular, secure, containerized system
**Approach**: Multi-agent parallel + sequential execution via Claude Agent SDK
**Duration**: 7-8 weeks (vs 16+ weeks sequential)
**Success Criteria**: Zero critical vulnerabilities, modular architecture, production-ready deployment
**Final Location**: `/Users/janschubert/code-projects/monitoring_firma/netzwaechter-refactored/`

---

## Infrastructure Status

### ✅ Prerequisites Complete
- [x] Agent SDK infrastructure created (`.agents/` directory)
- [x] Agent configurations prepared (5 agents configured)
- [x] Orchestrator implemented (`orchestrator.py`)
- [x] Spawn system working (`spawn_agent.py`)
- [x] Git workflow defined (`configs/git-workflow.json`)
- [x] Validation matrix created (file conflicts analyzed)
- [x] Todo mapping complete (100% coverage)
- [x] Target architecture designed (TARGET-ARCHITECTURE.md)
- [x] Python dependencies installed
- [x] Orchestrator state initialized
- [x] Database backup created (backup-20251007-pre-agents.dump)
- [x] Git safety branch created (security/backend-hardening)

### ✅ Phase 1 Complete - MERGED TO MAIN
- [x] **Frontend Cleanup Agent**: ✅ COMPLETE (11/11 tasks, 100%, merged)
- [x] **Security Agent**: ✅ COMPLETE (12/12 tasks, 100%, merged)
- [x] **Merge Date**: 2025-10-07
- [x] **Commits to Main**: Frontend (04db492), Security (8c84885)

### 🔄 Phase 2 Active
- [x] **Backend Modularization Agent**: 🔄 IN PROGRESS (1/8 modules, 12.5%)

---

## Managing Agent Responsibilities

As the **managing agent**, I (Claude) must:

### 1. Monitor Agent Progress
**Every 30-60 minutes**:
```bash
# Check agent output
BashOutput tool with PID 984416

# View progress logs
cat .agents/logs/frontend-agent-progress.md
cat .agents/logs/security-agent-progress.md
```

### 2. Validate Agent Work
**After each commit**:
- Check commit message format
- Verify files changed match task
- Run build verification
- Check for regressions
- Update progress tracking

### 3. Intervene When Needed
**Intervention Triggers**:
- Build failures
- Agent stuck/looping
- Incorrect changes
- Security concerns
- File conflicts

### 4. Coordinate Transitions
**Between phases**:
- Merge completed PRs
- Verify dependencies met
- Spawn next agents
- Update timeline

### 5. Document Everything
- Agent progress logs
- Commit validations
- Issues encountered
- Decisions made

---

## Execution Phases

### Phase 1: Parallel Security + Frontend (Weeks 1-3) ✅ IN PROGRESS

**Timeline**: 3 weeks
**Agents**: Security Agent + Frontend Cleanup Agent
**Conflict Status**: ✅ SAFE - No file overlaps
**Current Week**: Week 1

#### Frontend Cleanup Agent ✅ RUNNING

**Status**: 🔄 IN PROGRESS (55% complete, 6/11 tasks)
**Branch**: `cleanup/frontend-dead-code`
**Duration**: 2 weeks
**Priority**: P0 - CRITICAL
**PID**: 984416 (running via spawn_agent.py)

**Completed Tasks**:
- ✅ Task 1.1: Delete Unused Page Components (pre-agent)
- ✅ Task 1.2: Delete Unused UI Components (Commit 07c9b84)
- ✅ Task 2.2: Fix Malformed Imports (Commit 07c9b84)
- ✅ Task 2.1: Standardize Import Quotes (Commit eb9cc2f)
- ✅ Task 3.1: Add ARIA Labels (Commit af294c2)
- ✅ Task 3.2: Button Guidelines (Commit 65cfb41)

**Current Task**:
- 🔄 Task 4.1: Design Token System (IN PROGRESS)

**Remaining Tasks**:
- Task 4.2: Component Documentation
- Task 5.1: Bundle Size Monitoring
- Task 5.2: Accessibility Audit
- Task 5.3: Frontend Integration Testing

**Manager Actions Required**:
- [x] Validate Task 3.1 (ARIA labels) ✅ VALIDATED
- [x] Validate Task 3.2 (Button Guidelines) ✅ VALIDATED
- [ ] Monitor Task 4.1 progress
- [ ] Verify build passes after each task
- [ ] Review final PR when agent completes

**Command to Check**:
```bash
# Check agent output
BashOutput tool with bash_id=984416

# View progress
cat .agents/logs/frontend-agent-progress.md

# Verify latest commits
git log cleanup/frontend-dead-code -5
```

---

#### Security Agent ⏸️ PAUSED (Ready to Resume)

**Status**: ⏸️ PAUSED (44% complete, 4/9 tasks)
**Branch**: `security/backend-hardening`
**Duration**: 3 weeks
**Priority**: P0 - CRITICAL

**Completed Tasks** (Manual work):
- ✅ SEC-1.1: bcrypt password hashing (Commit f104d5b)
- ✅ SEC-1.2: Remove admin bypass (Commit d8cf78a)
- ✅ SEC-1.3: SSL/TLS configuration (Commit 73d2e76)
- ✅ SEC-1.4: API rate limiting (Commit aca2596)

**Remaining Tasks**:
- SEC-1.5: Environment variable security
- SEC-1.6: Session secret rotation
- SEC-1.7: SQL injection prevention
- SEC-1.8: CORS configuration
- SEC-1.9: Security documentation

**Manager Actions Required**:
- [ ] Decide when to resume Security Agent
- [ ] Spawn via: `python .agents/spawn_agent.py security-agent`
- [ ] Monitor progress every 30-60 minutes
- [ ] Validate each commit
- [ ] Create PR when complete

**Files to Watch**:
- `server/storage.ts` (conflicts with Backend Mod)
- `server/controllers/*` (authentication)
- `.env` / `.env.example` (secrets)

---

### Phase 1 Completion Checklist

**Week 3 End**:
- [ ] Frontend Agent: All 11 tasks complete
- [ ] Security Agent: All 9 tasks complete
- [ ] Both agents create PRs
- [ ] Manager validates all commits
- [ ] Both PRs pass build checks
- [ ] Manual testing completed
- [ ] Security scan clean (`npm audit`)
- [ ] Merge Frontend Agent PR to `main`
- [ ] Merge Security Agent PR to `main`
- [ ] Tag release: `v1.1.0-security-hardened`
- [ ] Deploy to staging for validation
- [ ] All tests passing on `main`

**Gate to Phase 2**: Both agents merged to `main`, no blocking issues

---

### Phase 2: Backend Modularization (Weeks 4-5)

**Timeline**: 2 weeks (with 8 parallel subagents)
**Agent**: Backend Modularization Agent (with 8 subagents)
**Conflict Status**: ⚠️ MUST WAIT for Security Agent (storage.ts conflicts)
**Dependency**: Security Agent must merge to main FIRST

**Branch**: `refactor/backend-modules`
**Duration**: 2 weeks with subagents
**Priority**: P1

**Strategy**: Parent agent spawns 8 subagents, one per module

**Subagents** (Run in Parallel):
1. Auth Module Subagent (~400 LOC)
2. Users Module Subagent (~600 LOC)
3. Objects Module Subagent (~700 LOC)
4. Energy Module Subagent (~600 LOC)
5. Temperature Module Subagent (~400 LOC)
6. Monitoring Module Subagent (~500 LOC)
7. KI Reports Module Subagent (~400 LOC)
8. Settings Module Subagent (~400 LOC)

**Manager Responsibilities**:
- [ ] Verify Security Agent merged to main
- [ ] Spawn Backend Modularization Agent
- [ ] Monitor 8 parallel subagents
- [ ] Validate module structure consistency
- [ ] Ensure repository pattern implemented
- [ ] Verify all API endpoints still work
- [ ] Check test coverage >75%
- [ ] Review and merge PR

**Command**:
```bash
# After Phase 1 complete
python .agents/spawn_agent.py backend-modularization-agent
```

**Success Criteria**:
- ✅ storage.ts completely refactored (0 LOC remaining)
- ✅ 8 clean modules created
- ✅ Repository pattern implemented
- ✅ All API endpoints still functional
- ✅ All tests passing
- ✅ 75% test coverage minimum

---

### Phase 3: Parallel Database + Docker (Weeks 6-7)

**Timeline**: 2 weeks
**Agents**: DB Optimizer Agent + Containerization Agent
**Conflict Status**: ✅ SAFE - Different concerns
**Dependency**: Backend Modularization must merge to main FIRST

#### DB Optimizer Agent

**Branch**: `perf/database-optimization`
**Duration**: 1 week
**Priority**: P1

**Tasks**:
1. Add indexes for frequently queried fields
2. Optimize JOIN patterns in new modules
3. Implement query result caching (Redis)
4. Add database monitoring/observability
5. Create query performance benchmarks
6. Optimize slow queries identified
7. Add connection pool metrics
8. Document query optimization strategies

**Manager Responsibilities**:
- [ ] Verify Backend Mod merged to main
- [ ] Spawn DB Optimizer Agent
- [ ] Monitor query performance metrics
- [ ] Validate 30-50% performance improvement
- [ ] Check Redis caching works
- [ ] Review and merge PR

---

#### Containerization Agent

**Branch**: `docker/containerization`
**Duration**: 2 weeks
**Priority**: P1

**Tasks**:
1. Create multi-stage Dockerfile for backend
2. Create multi-stage Dockerfile for frontend
3. Optimize Docker layer caching
4. Create docker-compose.yml for local dev
5. Create docker-compose.prod.yml
6. Setup PostgreSQL container
7. Setup Redis container
8. Configure networking
9. Implement health checks
10. Create .dockerignore files
11. Document Docker commands
12. Test full stack deployment

**Manager Responsibilities**:
- [ ] Spawn Containerization Agent (can run parallel with DB Opt)
- [ ] Monitor Docker build success
- [ ] Verify health checks passing
- [ ] Test docker-compose up works
- [ ] Check image sizes (<500MB total)
- [ ] Review and merge PR

---

## Manager Validation Workflow

### For Each Agent Commit

1. **Check Notification**:
   ```bash
   BashOutput bash_id=<agent-pid>
   # Or check progress log
   cat .agents/logs/<agent>-progress.md
   ```

2. **Validate Commit**:
   ```bash
   git show <commit-hash> --stat
   git log <branch> -1
   ```

3. **Verify Build**:
   ```bash
   npm run build
   # Check for errors
   ```

4. **Check for Regressions**:
   ```bash
   git diff main...<branch>
   # Verify only intended changes
   ```

5. **Update Tracking**:
   - Note commit hash
   - Update progress percentage
   - Log any issues
   - Document decisions

### When Agent Completes

1. **Final Validation**:
   - Review all commits
   - Verify success criteria met
   - Run full test suite
   - Check bundle size (if frontend)

2. **Create Pull Request**:
   ```bash
   gh pr create --title "<agent> completion" --body "..."
   ```

3. **Merge to Main**:
   ```bash
   git checkout main
   git merge <branch> --no-ff
   git push origin main
   ```

4. **Tag Release**:
   ```bash
   git tag v<version>
   git push origin v<version>
   ```

5. **Update Documentation**:
   - Update agent status
   - Update timeline
   - Document lessons learned

---

## Risk Management

### High-Risk Operations

1. **Password Migration (SEC-1.1)** ✅ COMPLETE
   - **Status**: Successfully completed
   - **Result**: All 11 users migrated to bcrypt

2. **SESSION_SECRET Change (SEC-1.4)**
   - **Status**: Pending (SEC-1.6)
   - **Risk**: All users logged out
   - **Mitigation**: Maintenance window

3. **Backend Modularization**
   - **Risk**: Breaking API changes
   - **Mitigation**: Maintain same contracts
   - **Rollback**: Git revert

4. **Database Schema Changes**
   - **Risk**: Data loss
   - **Mitigation**: Backup before migrations
   - **Backup**: backup-20251007-pre-agents.dump

### Rollback Procedures

**Immediate Rollback**:
```bash
git checkout main
git reset --hard <last-good-commit>
npm install && npm run build && npm start
```

**Database Rollback**:
```bash
PGPASSWORD='9c9snLP2Rckx50xbAy3b3C5Va' pg_restore \
  -h 23.88.40.91 -p 50184 -U postgres \
  -d 20251001_neu_neondb \
  backup-20251007-pre-agents.dump
```

---

## Communication Protocol

### Agent → Manager (Me)

**Via Progress Logs**:
- `.agents/logs/<agent>-progress.md` (auto-updated by agents)

**Via Commits**:
- Commit messages follow format
- Co-Authored-By: Claude <noreply@anthropic.com>

### Manager → User

**Status Updates**:
- After each phase completion
- When issues arise
- Before major decisions

**Documentation**:
- Agent progress logs
- This master plan (updated)
- Timeline adjustments

---

## Success Metrics

### Code Quality
- ✅ Dead code: 0% (from 15%)
- ⏳ Test coverage: >75% (from minimal)
- ✅ TypeScript strict mode: enabled
- ✅ ESLint errors: 0 (after fixes)
- ⏳ Security vulnerabilities: In progress (4/9 complete)

### Performance
- ⏳ Bundle size: -200KB minimum (measuring)
- ⏳ Database queries: -50% to -99.5% (Phase 2)
- ✅ Connection pool: Already optimized (SEC-1.3)
- ✅ Build time: ~10s (good)

### Architecture
- ⏳ Backend modules: 8 clean modules (Phase 2)
- ⏳ Frontend features: 8 feature modules (cleanup in progress)
- ⏳ Shared packages: 3 (Phase 2)

### Security
- ✅ Password security: 100% bcrypt ✅
- ✅ API rate limiting: Implemented ✅
- ⏳ API authentication: In progress (SEC-1.5)
- ⏳ SSL/TLS: Documented (disabled due to DB limits)
- ⏳ Environment variables: Needs SEC-1.5

---

## Current Status (2025-10-08 08:15)

### ✅ Phase 1 Complete (100%)
- **Frontend Cleanup Agent**: ✅ 100% (11/11 tasks merged to main)
- **Security Agent**: ✅ 100% (12/12 tasks merged to main)

### 🔄 Phase 2 Active (25%)
- **Backend Modularization Agent**: ✅ 25% (2/8 modules complete)
  - ✅ Auth Module: Complete (1,592 LOC, commit 834bf2c)
  - ✅ Users Module: Complete (2,493 LOC, commit 709a6cc)
  - 🔄 Objects Module: Next (estimated ~1000 LOC)

### 🔄 Phase 3 Running Early (Parallel Work)
- **Containerization Agent**: ✅ COMPLETE (commit 1e80e9a)
  - 7 Docker files created (Dockerfiles, docker-compose, scripts)
  - Production-ready containerization infrastructure
  - Deployment documentation complete

- **Database Optimizer Agent**: ⏸️ CORRECTLY WAITING
  - Agent intelligently recognized prerequisite not met
  - Waiting for backend modularization to complete (2/8 modules done)
  - Will activate when all 8 modules are ready

### Next Actions for Manager

**Immediate** (next hour):
1. Check frontend agent progress (Task 4.1)
2. Validate any new commits
3. Monitor for errors

**Today**:
1. Let frontend agent continue autonomously
2. Decide when to resume security agent
3. Update this plan with progress

**Tomorrow**:
1. Resume security agent if appropriate
2. Continue monitoring frontend agent
3. Prepare for Phase 1 completion

**This Week**:
1. Complete frontend agent (5 tasks remaining)
2. Resume and advance security agent (5 tasks)
3. Prepare PRs for both

---

## Final Deliverable

**Target Location**: `/Users/janschubert/code-projects/monitoring_firma/netzwaechter-refactored/`

**What Will Be There**:
- Complete monorepo structure (apps/ + packages/ + infrastructure/)
- 8 backend modules extracted from storage.ts
- 8 frontend feature modules
- 3 shared packages
- Docker containerization
- Complete documentation
- Production-ready deployment

See **TARGET-ARCHITECTURE.md** for complete details.

---

**Status**: ✅ IN EXECUTION
**Phase**: 2 of 3 (Week 4-5)
**Progress**: ~40% overall (Phase 1: 100%, Phase 2: 12.5%, Phase 3: 0%)
**On Track**: Yes
**Next Milestone**: Complete Phase 2 (8 modules extracted)
**Manager**: Claude (this instance)
**Last Updated**: 2025-10-08 07:00 UTC

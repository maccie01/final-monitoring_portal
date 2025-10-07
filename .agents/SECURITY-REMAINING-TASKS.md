# Security Agent - Remaining Tasks

**Date**: 2025-10-07
**Branch**: `security/backend-hardening`
**Status**: 4/11 tasks complete (36%)

---

## Completed Tasks ✅

1. ✅ **Task 1.1**: Implement bcrypt password hashing (Commit f104d5b)
2. ✅ **Task 1.2**: Remove hardcoded admin bypass (Commit d8cf78a)
3. ✅ **Task 1.3**: Enable SSL for database (Commit 73d2e76)
4. ✅ **Task 1.4**: Implement API rate limiting (Commit aca2596)

---

## Remaining Tasks (7 tasks)

### 🔴 High Priority (P0)

#### Task 2.1: Protect Unprotected Management Endpoints
**Estimated Time**: 2 hours
**Files**: `server/routes/*.ts`, `server/middleware/auth.ts`

**Goal**: Add authentication middleware to 13 unprotected endpoints

**Unprotected Endpoints**:
1. `/api/db/pool-stats` - Database pool statistics
2. `/api/user-profiles/:id` - User profile management
3. `/api/modbus-data` - Modbus data access
4. `/api/efficiency-data` - Efficiency analysis
5. `/api/temperature-data` - Temperature monitoring
6. `/api/weather-data` - Weather data access
7. `/api/ki-reports` - AI reports
8. `/api/system-settings` - System configuration
9. `/api/portal-configs` - Portal configurations
10. `/api/admin/*` - Admin operations
11. `/api/objects/export` - Data export
12. `/api/monitoring/*` - Monitoring endpoints
13. `/api/devices/*` - Device management

**Implementation**:
```typescript
// Add to all routes
import { requireAuth } from '../middleware/auth';

router.get('/endpoint', requireAuth, handler);
router.post('/endpoint', requireAuth, handler);
```

---

#### Task 2.3: Secure Email Service Configuration
**Estimated Time**: 30 minutes
**Files**: `server/email-service.ts`, `.env`

**Goal**: Enable TLS for email sending

**Current Issue**:
```typescript
// email-service.ts - Missing TLS
const transporter = nodemailer.createTransport({
  // No secure: true
  // No TLS configuration
});
```

**Implementation**:
```typescript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: true,
  },
});
```

---

### 🟡 Medium Priority (P1)

#### Task 3.1: Optimize Connection Pool Configuration
**Estimated Time**: 2 hours
**Files**: `server/connection-pool.ts`

**Goal**: Reduce connection pool size from 50 to optimal 10-20 connections

**Current Issue**:
```typescript
// Connection pool too large
min: 50,
max: 50,
```

**Implementation**:
```typescript
const poolConfig: PoolConfig = {
  min: 10,  // Reduced from 50
  max: 20,  // Reduced from 50 (or calculate based on CPU cores)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};
```

**Testing**: Monitor pool stats at `/api/db/pool-stats`

---

#### Task 3.2: Fix N+1 Query Issues in Storage Layer
**Estimated Time**: 4 hours
**Files**: `server/storage.ts` (specific methods need optimization)

**Goal**: Optimize queries that fetch data in loops

**Known Issues**:
1. User preferences loading (N+1 queries)
2. Object relationships loading
3. Portal configurations with nested data

**Implementation Pattern**:
```typescript
// Before: N+1 queries
for (const user of users) {
  const preferences = await db.query('SELECT * FROM preferences WHERE user_id = $1', [user.id]);
}

// After: Single query with JOIN
const usersWithPreferences = await db.query(`
  SELECT u.*, p.*
  FROM users u
  LEFT JOIN preferences p ON p.user_id = u.id
`);
```

---

### 🟢 Low Priority (P2)

#### Task 4.1: Environment Variable Security Audit
**Estimated Time**: 1 hour
**Files**: `.env`, `.env.example`, `server/config/*`

**Goal**: Audit all environment variables for security issues

**Checklist**:
- [ ] All secrets use strong values
- [ ] .env not committed to git
- [ ] .env.example has placeholder values only
- [ ] No hardcoded secrets in code
- [ ] Sensitive vars documented
- [ ] Production vars differ from dev

**Actions**:
1. Review all env vars in `.env`
2. Update `.env.example` with safe placeholders
3. Document required variables
4. Create validation script

---

#### Task 4.2: Production Deployment Checklist
**Estimated Time**: 2 hours
**Files**: `docs/DEPLOYMENT.md` (new), `docs/SECURITY.md` (new)

**Goal**: Create comprehensive deployment documentation

**Checklist Items**:
1. Environment configuration
2. Database setup and migrations
3. SSL/TLS certificates
4. Session management
5. Rate limiting configuration
6. Monitoring and logging
7. Backup procedures
8. Rollback procedures
9. Security hardening
10. Performance tuning

**Deliverables**:
- `docs/DEPLOYMENT.md` - Step-by-step deployment guide
- `docs/SECURITY.md` - Security configuration reference
- `scripts/pre-deployment-check.sh` - Validation script

---

## Task Priorities

**Immediate (Today)**:
1. Task 2.1: Protect endpoints (2h)
2. Task 2.3: Email TLS (30min)

**This Week**:
3. Task 3.1: Connection pool (2h)
4. Task 3.2: N+1 queries (4h)

**Before Deployment**:
5. Task 4.1: Env audit (1h)
6. Task 4.2: Deployment docs (2h)

**Total Remaining**: ~11.5 hours (1.5 days of work)

---

## Execution Options

### Option A: Manual Completion
Work through tasks one by one with human developer

**Pros**:
- Full control over each change
- Can review and discuss decisions
- Good for learning/understanding

**Cons**:
- Slower (11.5 hours of focused work)
- Context switching
- More manual testing

---

### Option B: Spawn Security Agent (Recommended)
Resume autonomous Security Agent via Claude Agent SDK

**Command**:
```bash
cd /Users/janschubert/code-projects/monitoring_firma/app-version-4_netzwächter
source .agents/venv/bin/activate
python .agents/spawn_agent.py security-agent
```

**Agent Configuration**:
- Resume on branch `security/backend-hardening`
- Continue from Task 2.1
- Autonomous execution with validation
- Commit after each task
- ~6-8 hours total (agent works faster)

**Pros**:
- Faster completion (agent doesn't take breaks)
- Consistent patterns
- Automatic testing and validation
- Documented decisions

**Cons**:
- Less human oversight during execution
- Need to review all changes afterward

---

## Recommendation

**Use Option B (Spawn Security Agent)** because:

1. **Proven Track Record**: Frontend Agent completed 11/11 tasks successfully
2. **Safe to Run**: Zero file conflicts with frontend work
3. **Well-Defined Tasks**: All tasks have clear implementation steps
4. **Faster**: Agent can complete in 6-8 hours vs 11.5+ hours manual
5. **Validated**: Agent tests after each task

**Monitoring**:
- Check progress every 30-60 minutes
- Agent will commit after each task
- Review commits as they come in
- Can intervene if needed

---

## Next Steps

**If proceeding with Security Agent**:

1. **Prepare**:
   ```bash
   git checkout security/backend-hardening
   git pull origin security/backend-hardening
   ```

2. **Spawn Agent**:
   ```bash
   source .agents/venv/bin/activate
   python .agents/spawn_agent.py security-agent
   ```

3. **Monitor**:
   - Check progress log: `.agents/logs/security-agent-progress.md`
   - View commits: `git log security/backend-hardening`
   - Check build: `npm run build`

4. **After Completion**:
   - Review all commits
   - Test critical flows
   - Create PR
   - Merge alongside frontend PR

---

**Created**: 2025-10-07
**Status**: Ready to resume
**Estimated Completion**: 6-8 hours (agent) or 11.5+ hours (manual)

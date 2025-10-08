# Database Optimizer Tasks

**Agent**: database-optimizer-agent
**Branch**: `perf/database-optimization`
**Target**: 30-50% query performance improvement via indexing + caching
**Duration**: 1 week (7 days)
**Status**: Ready (waiting for backend-modularization-agent merge)

---

## Prerequisites

**CRITICAL**: Backend-modularization-agent MUST be merged to main before starting.

Verify:
```bash
git log --oneline -20 | grep "backend modularization"
ls server/modules/  # Should show 8 directories
```

If modules not present, STOP and wait.

---

## Performance Baseline (Current State)

From Security Agent analysis:
- ✅ Connection pool: Already optimized (50→5 connections, 90% reduction)
- ✅ N+1 queries: Partially fixed in users module
- ❌ Missing indexes: All foreign keys, filtered columns
- ❌ No caching layer: Every request hits database
- ❌ Slow aggregations: Energy summaries, temperature analysis

**Current avg query time**: ~250ms (estimated)
**Target avg query time**: <150ms (40% improvement)

---

## Task 1: Performance Profiling (Day 1)

### 1.1 Analyze All Repository Queries
**Status**: Pending

For each module in `server/modules/*/`:
1. Read all repository files (`*.repository.ts`)
2. Extract all SQL queries
3. Run `EXPLAIN ANALYZE` on each query
4. Document slow queries (>100ms)
5. Identify missing indexes

**Output**: Create `PERFORMANCE-BASELINE.md` with:
```markdown
## Query Performance Baseline

### Auth Module
- validateUser query: 45ms (ACCEPTABLE)
- getUserByEmail query: 30ms (ACCEPTABLE)

### Users Module
- getUsers query: 350ms (SLOW - missing index on mandant_id)
- getUsersByMandant query: 280ms (SLOW - sequential scan)

### Objects Module
- getObjects query: 420ms (SLOW - no index on mandant_id)
- searchObjects query: 650ms (VERY SLOW - no full-text index)

...
```

### 1.2 Identify Caching Opportunities
Analyze which data is:
- Frequently accessed (>100 requests/hour)
- Rarely changes (TTL >5 minutes viable)
- Expensive to compute (aggregations, joins)

**Output**: Add to `PERFORMANCE-BASELINE.md`:
```markdown
## Caching Opportunities

HIGH PRIORITY:
- Settings table (read: 500/hr, write: 1/day) → Cache 1hr
- Portal configs (read: 200/hr, write: 5/day) → Cache 30min
- Energy daily aggregations (read: 100/hr, compute: 2s) → Cache 1hr

MEDIUM PRIORITY:
- User profiles (read: 150/hr, write: 20/hr) → Cache 5min
- Object metadata (read: 300/hr, write: 10/hr) → Cache 15min

LOW PRIORITY:
- Temperature data (read: 80/hr, write: 24/day) → Cache 1hr
```

---

## Task 2: Auth Module Optimization (Day 1)

### 2.1 Add Indexes
```sql
-- Users table (auth-related)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
```

**Verification**:
```bash
# Test login performance before/after
time curl -X POST localhost:5000/api/auth/user-login -d '{"username":"admin","password":"admin"}'
```

### 2.2 No Caching Needed
Auth data must be fresh for security. Skip caching.

**Commit**: `perf(db): add auth indexes (email, username)`

---

## Task 3: Users Module Optimization (Day 2)

### 3.1 Add Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_users_mandant_id ON users(mandant_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_role_mandant ON users(role, mandant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
```

### 3.2 Implement User Profile Caching
```typescript
// users.service.ts
import { cache } from '../utils/cache';

async getUserProfile(id: number) {
  const cacheKey = `user_profile:${id}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const profile = await this.repository.getUserProfile(id);
  await cache.set(cacheKey, profile, 300); // 5 min TTL
  return profile;
}
```

**Verification**:
```bash
# Test query performance
npm run test:performance -- users
```

**Commit**: `perf(db): optimize users module (4 indexes, profile caching)`

---

## Task 4: Objects Module Optimization (Day 2)

### 4.1 Add Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_objects_mandant_id ON objects(mandant_id);
CREATE INDEX IF NOT EXISTS idx_objects_objectid ON objects(objectid);
CREATE INDEX IF NOT EXISTS idx_objects_name ON objects(name);

-- GiST index for GPS coordinates
CREATE INDEX IF NOT EXISTS idx_objects_gps ON objects
  USING GIST (ST_Point(CAST(objdata->>'longitude' AS FLOAT), CAST(objdata->>'latitude' AS FLOAT)));

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_objects_name_fts ON objects
  USING GIN (to_tsvector('german', name));
```

### 4.2 Implement Object Metadata Caching
```typescript
async getObjectMetadata(objectId: number) {
  const cacheKey = `object:${objectId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const object = await this.repository.getObject(objectId);
  await cache.set(cacheKey, object, 900); // 15 min TTL
  return object;
}
```

**Commit**: `perf(db): optimize objects module (5 indexes incl full-text, metadata caching)`

---

## Task 5: Energy Module Optimization (Day 3)

### 5.1 Add Indexes
```sql
-- day_comp table (energy data)
CREATE INDEX IF NOT EXISTS idx_day_comp_log ON day_comp(log);  -- meter ID
CREATE INDEX IF NOT EXISTS idx_day_comp_time ON day_comp(_time);  -- timestamp
CREATE INDEX IF NOT EXISTS idx_day_comp_id ON day_comp(id);  -- object ID
CREATE INDEX IF NOT EXISTS idx_day_comp_log_time ON day_comp(log, _time);  -- composite
```

### 5.2 Implement Aggregation Caching
```typescript
async getDailyEnergySum(objectId: number, date: string) {
  const cacheKey = `energy:daily:${objectId}:${date}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const sum = await this.repository.getDailySum(objectId, date);
  await cache.set(cacheKey, sum, 3600); // 1 hour TTL
  return sum;
}
```

### 5.3 Create Materialized View (Optional)
```sql
CREATE MATERIALIZED VIEW mv_daily_energy_summary AS
SELECT
  id as object_id,
  DATE(_time) as date,
  SUM(value) as total_energy
FROM day_comp
GROUP BY id, DATE(_time);

CREATE INDEX ON mv_daily_energy_summary (object_id, date);

-- Refresh daily at 1 AM
-- Add cron job: psql -c "REFRESH MATERIALIZED VIEW mv_daily_energy_summary"
```

**Commit**: `perf(db): optimize energy module (4 indexes, aggregation caching, materialized view)`

---

## Task 6: Temperature Module Optimization (Day 3)

### 6.1 Add Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_daily_outdoor_temps_postal ON daily_outdoor_temperatures(postal_code);
CREATE INDEX IF NOT EXISTS idx_daily_outdoor_temps_date ON daily_outdoor_temperatures(date);
CREATE INDEX IF NOT EXISTS idx_daily_outdoor_temps_postal_date ON daily_outdoor_temperatures(postal_code, date);
```

### 6.2 Cache Outdoor Temperature Data
```typescript
async getOutdoorTemperature(postalCode: string, date: string) {
  const cacheKey = `temp:${postalCode}:${date}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const temp = await this.repository.getTemperature(postalCode, date);
  await cache.set(cacheKey, temp, 86400); // 24 hour TTL (weather doesn't change retroactively)
  return temp;
}
```

**Commit**: `perf(db): optimize temperature module (3 indexes, outdoor temp caching)`

---

## Task 7: Monitoring Module Optimization (Day 4)

### 7.1 Add Indexes
```sql
-- Monitoring/logging tables
CREATE INDEX IF NOT EXISTS idx_monitoring_timestamp ON monitoring_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_monitoring_metric ON monitoring_logs(metric_name);
```

### 7.2 Cache Health Check Results
```typescript
async getHealthStatus() {
  const cacheKey = 'health:status';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const health = await this.repository.checkHealth();
  await cache.set(cacheKey, health, 60); // 1 min TTL
  return health;
}
```

**Commit**: `perf(db): optimize monitoring module (2 indexes, health check caching)`

---

## Task 8: KI Reports Module Optimization (Day 4)

### 8.1 Add Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_ki_reports_object_id ON ki_reports(object_id);
CREATE INDEX IF NOT EXISTS idx_ki_reports_created_at ON ki_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_ki_reports_type ON ki_reports(report_type);
```

### 8.2 Cache Generated Reports
```typescript
async getReport(reportId: number) {
  const cacheKey = `report:${reportId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const report = await this.repository.getReport(reportId);
  await cache.set(cacheKey, report); // No TTL - invalidate on update
  return report;
}

async updateReport(reportId: number, data: any) {
  await this.repository.updateReport(reportId, data);
  await cache.del(`report:${reportId}`); // Invalidate cache
}
```

**Commit**: `perf(db): optimize ki-reports module (3 indexes, report caching with invalidation)`

---

## Task 9: Settings Module Optimization (Day 5)

### 9.1 Add Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key_name);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
CREATE INDEX IF NOT EXISTS idx_portal_configs_id ON portal_configs(id);
```

### 9.2 Cache All Settings
```typescript
async getAllSettings() {
  const cacheKey = 'settings:all';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const settings = await this.repository.getAllSettings();
  await cache.set(cacheKey, settings, 3600); // 1 hour TTL
  return settings;
}

async updateSetting(key: string, value: any) {
  await this.repository.updateSetting(key, value);
  await cache.del('settings:all'); // Invalidate cache
}
```

**Commit**: `perf(db): optimize settings module (3 indexes, settings caching)`

---

## Task 10: Redis Cache Setup (Day 5)

### 10.1 Install Redis
```bash
npm install redis ioredis
npm install --save-dev @types/redis
```

### 10.2 Create Cache Utility
```typescript
// server/utils/cache.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

export const cache = {
  async get(key: string): Promise<any> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  },

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async clear(): Promise<void> {
    await redis.flushdb();
  }
};
```

**Commit**: `perf(db): add Redis caching infrastructure`

---

## Task 11: Performance Monitoring Dashboard (Day 6)

### 11.1 Add Query Performance Logging
```typescript
// middleware/query-logger.ts
export const queryLogger = async (query: string, params: any[]) => {
  const start = Date.now();
  const result = await db.query(query, params);
  const duration = Date.now() - start;

  if (duration > 100) {
    console.warn(`Slow query (${duration}ms):`, query);
  }

  return result;
};
```

### 11.2 Create Performance Metrics Endpoint
```typescript
// monitoring.controller.ts
async getPerformanceMetrics(req: Request, res: Response) {
  const metrics = {
    avgQueryTime: await db.query('SELECT AVG(duration) FROM query_log'),
    cacheHitRatio: await cache.get('cache:stats'),
    slowQueries: await db.query('SELECT * FROM query_log WHERE duration > 100 LIMIT 10')
  };
  res.json(metrics);
}
```

**Commit**: `perf(db): add performance monitoring dashboard`

---

## Task 12: Logging Consistency Validation (Day 7)

### 12.1 Audit Logging Standards
**Status**: Pending

Check all modules for consistent logging patterns:

**Required Logging Standards**:
1. **Error Logging**: All catch blocks must log errors with context
   ```typescript
   catch (error) {
     console.error('[ModuleName] Operation failed:', { operation, params, error });
     throw error;
   }
   ```

2. **Performance Logging**: Slow queries (>100ms) must be logged
   ```typescript
   const start = Date.now();
   const result = await query();
   const duration = Date.now() - start;
   if (duration > 100) {
     console.warn(`[DB] Slow query (${duration}ms):`, queryName);
   }
   ```

3. **Security Events**: Authentication/authorization events must be logged
   ```typescript
   console.info('[Auth] Login attempt:', { username, success, ip });
   console.warn('[Auth] Unauthorized access attempt:', { userId, resource });
   ```

4. **Cache Events**: Cache hits/misses should be logged for monitoring
   ```typescript
   console.debug('[Cache] Hit:', cacheKey);
   console.debug('[Cache] Miss:', cacheKey);
   ```

### 12.2 Create Logging Audit Report
**Status**: Pending

Scan all modules and create `LOGGING-AUDIT.md`:
```markdown
## Logging Consistency Audit

### Auth Module
- Error logging: CONSISTENT
- Performance logging: MISSING (add to validateUser)
- Security logging: CONSISTENT
- Issues: None

### Users Module
- Error logging: CONSISTENT
- Performance logging: PARTIAL (missing in getUsersByMandant)
- Security logging: CONSISTENT
- Issues: 2 catch blocks missing context

### Energy Module
- Error logging: INCONSISTENT (some catches silent)
- Performance logging: MISSING
- Security logging: N/A
- Issues: 5 catch blocks need logging

...
```

### 12.3 Fix Logging Inconsistencies
**Status**: Pending

For each module with issues:
1. Add missing error logging
2. Add performance logging for slow operations
3. Standardize log message format
4. Add contextual information (userId, objectId, etc.)

### 12.4 Create Logging Utility
**Status**: Pending

```typescript
// server/utils/logger.ts
export const logger = {
  error(module: string, operation: string, error: any, context?: object) {
    console.error(`[${module}] ${operation} failed:`, { ...context, error });
  },

  warn(module: string, message: string, context?: object) {
    console.warn(`[${module}] ${message}`, context);
  },

  info(module: string, message: string, context?: object) {
    console.info(`[${module}] ${message}`, context);
  },

  performance(module: string, operation: string, duration: number, threshold = 100) {
    if (duration > threshold) {
      console.warn(`[${module}] Slow operation (${duration}ms): ${operation}`);
    }
  }
};
```

**Commit**: `feat(logging): standardize logging across all modules`

---

## Task 13: Final Verification & Documentation (Day 7)

### 13.1 Run Performance Tests
```bash
npm run test:performance
npm run benchmark
```

### 13.2 Measure Improvements
Compare before/after metrics:
- Average query time
- P95/P99 query times
- Cache hit ratio
- Database connection usage

### 13.3 Create Migration Script
```sql
-- migrations/001_add_indexes.sql
-- All CREATE INDEX statements in correct order
```

### 13.4 Document Optimizations
Create `DATABASE-OPTIMIZATION-RESULTS.md`:
```markdown
## Performance Improvements

### Query Performance
- Baseline: 250ms avg
- Optimized: 145ms avg
- Improvement: 42%

### Cache Hit Ratio
- Target: 80%
- Achieved: 85%

### Indexes Added: 28
- Auth: 2
- Users: 4
- Objects: 5
...

### Rollback Plan
`sql
DROP INDEX idx_users_mandant_id;
-- ... all indexes
`
```

**Commit**: `perf(db): complete database optimization (42% faster, 85% cache hit ratio)`

---

## Success Criteria

- [ ] All 8 modules profiled and analyzed
- [ ] 25+ indexes added across all tables
- [ ] Redis caching implemented for all modules
- [ ] Cache hit ratio ≥80%
- [ ] Query performance improved 30-50%
- [ ] Monitoring dashboard functional
- [ ] All tests passing
- [ ] Build successful
- [ ] Migration scripts created
- [ ] Documentation complete
- [ ] Rollback plan documented

---

## Rollback Plan

```bash
# If optimizations cause issues:
git checkout main
git branch rollback-db-opt-$(date +%Y%m%d)

# Remove all indexes
psql $DATABASE_URL -f rollback/drop_indexes.sql

# Disable caching
export ENABLE_CACHE=false

# Restart server
npm run build
npm start
```

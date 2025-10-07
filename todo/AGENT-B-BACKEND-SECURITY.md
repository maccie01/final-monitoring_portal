# Agent B: Backend Security & Infrastructure

**Branch**: `security/backend-hardening`
**Agent Role**: Backend security, authentication, database optimization, API protection
**Estimated Duration**: 2 weeks
**Priority**: P0 - Critical
**Dependencies**: None - can start immediately

---

## Mission Objective

Fix all critical security vulnerabilities, harden authentication system, implement API protection, optimize database queries, and establish security best practices. This work is completely independent of frontend changes and can proceed in parallel.

---

## Phase 1: Critical Security Fixes (Days 1-3)

### Task 1.1: Implement Password Hashing with bcrypt
**Priority**: P0 - CRITICAL SECURITY VULNERABILITY
**Estimated Time**: 3 hours
**Success Criteria**:
- All passwords stored as bcrypt hashes
- Existing plaintext passwords migrated
- Login still works for all users
- Password validation uses bcrypt.compare()

**Security Issue**:
```typescript
// storage.ts:3342-3369 - CRITICAL VULNERABILITY
async validateUserCredentials(username: string, password: string): Promise<User | null> {
  // INSECURE: Plaintext password comparison
  if (user.password === password) {
    return user;
  }
}
```

**Implementation Steps**:
```bash
# 1. Install bcrypt (already in dependencies)
npm install bcrypt @types/bcrypt

# 2. Create password migration script
cat > server/scripts/migrate-passwords.ts << 'EOF'
import bcrypt from 'bcrypt';
import { getDb } from '../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 12;

export async function migratePasswordsToHash() {
  console.log('🔐 Starting password migration to bcrypt...');

  const db = getDb();
  const allUsers = await db.select().from(users);

  let migrated = 0;
  let errors = 0;

  for (const user of allUsers) {
    try {
      // Check if password is already hashed (bcrypt hashes start with $2b$)
      if (user.password && !user.password.startsWith('$2b$')) {
        console.log(`Hashing password for user: ${user.username}`);

        const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, user.id));

        migrated++;
      }
    } catch (error) {
      console.error(`Failed to migrate user ${user.username}:`, error);
      errors++;
    }
  }

  console.log(`✅ Migration complete: ${migrated} passwords hashed, ${errors} errors`);
  return { migrated, errors };
}

// Run if called directly
if (require.main === module) {
  migratePasswordsToHash()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
EOF

# 3. Update storage.ts validateUserCredentials
# Replace lines 3342-3369 with:
cat > server/patches/password-validation.ts << 'EOF'
async validateUserCredentials(username: string, password: string): Promise<User | null> {
  const [user] = await getDb()
    .select()
    .from(users)
    .where(or(eq(users.username, username), eq(users.email, username)))
    .limit(1);

  if (!user) {
    // User not found
    // Use dummy bcrypt.compare to prevent timing attacks
    await bcrypt.compare(password, '$2b$12$dummy.hash.to.prevent.timing.attacks');
    return null;
  }

  // Secure password comparison using bcrypt
  const isValid = await bcrypt.compare(password, user.password);

  if (isValid) {
    return user;
  }

  return null;
}
EOF

# 4. Update user creation/update methods
# storage.ts - createUser method
async createUser(userData: Partial<User>): Promise<User> {
  if (userData.password) {
    // Hash password before storing
    userData.password = await bcrypt.hash(userData.password, 12);
  }

  const [user] = await getDb()
    .insert(users)
    .values(userData)
    .returning();

  return user;
}

# storage.ts - updateUser method
async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  if (updates.password) {
    // Hash password before storing
    updates.password = await bcrypt.hash(updates.password, 12);
  }

  const [user] = await getDb()
    .update(users)
    .set(updates)
    .where(eq(users.id, id))
    .returning();

  return user || null;
}

# 5. Run migration
npx tsx server/scripts/migrate-passwords.ts

# 6. Test login functionality
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 7. Verify in database
PGPASSWORD='9c9snLP2Rckx50xbAy3b3C5Va' psql -h 23.88.40.91 -p 50184 \
  -U postgres -d 20251001_neu_neondb \
  -c "SELECT username, LEFT(password, 20) as password_hash FROM users LIMIT 5;"
```

**Verification Checklist**:
- [ ] bcrypt installed and imported
- [ ] Migration script created and tested
- [ ] All passwords in DB start with `$2b$`
- [ ] validateUserCredentials uses bcrypt.compare
- [ ] createUser hashes passwords
- [ ] updateUser hashes passwords
- [ ] Login works with existing credentials
- [ ] Password reset works

**Documentation**:
```
Password Security Implementation:

Algorithm: bcrypt
Salt Rounds: 12
Hash Format: $2b$12$...

Migration Results:
- Users migrated: [count]
- Errors: [count]
- Failed users: [list if any]

Code Changes:
1. storage.ts:3342-3369 - validateUserCredentials (bcrypt.compare)
2. storage.ts:createUser - Hash before insert
3. storage.ts:updateUser - Hash before update

Testing:
- Login with existing users: ✓ PASS
- Login with wrong password: ✓ FAIL (as expected)
- Password reset: ✓ PASS
- User creation: ✓ PASS

Database Verification:
SELECT username, LEFT(password, 10) FROM users;
All passwords start with $2b$12$: ✓

Commit Hash: [git hash]
```

---

### Task 1.2: Remove Hardcoded Admin Bypass
**Priority**: P0 - CRITICAL SECURITY VULNERABILITY
**Estimated Time**: 30 minutes
**Success Criteria**:
- Hardcoded admin/admin123 removed
- Admin must use real credentials
- No authentication bypasses

**Security Issue**:
```typescript
// authController.ts:114 - CRITICAL VULNERABILITY
if (username.toLowerCase() === 'admin' && password === 'admin123') {
  const adminUser = await storage.getUser('100');
  // BACKDOOR: Bypasses real authentication
}
```

**Implementation Steps**:
```bash
# 1. Locate the hardcoded bypass
grep -n "admin123" server/controllers/authController.ts

# 2. Remove the hardcoded admin bypass
# Delete or comment out lines ~114-125 in authController.ts

# Before:
# if (username.toLowerCase() === 'admin' && password === 'admin123') {
#   const adminUser = await storage.getUser('100');
#   ...
# }

# After: Remove entire block, proceed to normal validation

# 3. Ensure real admin exists in database
PGPASSWORD='9c9snLP2Rckx50xbAy3b3C5Va' psql -h 23.88.40.91 -p 50184 \
  -U postgres -d 20251001_neu_neondb \
  -c "SELECT id, username, role FROM users WHERE role = 'admin';"

# 4. If no admin exists, create one
cat > server/scripts/create-admin.ts << 'EOF'
import bcrypt from 'bcrypt';
import { getDb } from '../db';
import { users } from '../../db/schema';

async function createAdminUser() {
  const hashedPassword = await bcrypt.hash('SecureAdminPass2025!', 12);

  const [admin] = await getDb()
    .insert(users)
    .values({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@netzwaechter.de',
      role: 'admin',
      mandantId: 1,
    })
    .returning();

  console.log('✅ Admin user created:', admin.username);
  console.log('Password: SecureAdminPass2025!');
  console.log('CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN');
}

createAdminUser()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
EOF

# 5. Test login without bypass
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# Should FAIL

curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"SecureAdminPass2025!"}'
# Should SUCCEED
```

**Verification Checklist**:
- [ ] Hardcoded bypass code removed
- [ ] Real admin user exists in database
- [ ] Login with admin/admin123 fails
- [ ] Login with real credentials works
- [ ] Admin has correct role and permissions

**Documentation**:
```
Hardcoded Admin Bypass Removal:

Location: server/controllers/authController.ts:114-125
Code Removed: if (username === 'admin' && password === 'admin123')

Admin User Setup:
- Username: admin
- Email: admin@netzwaechter.de
- Role: admin
- Password: [REDACTED - stored securely]

Testing:
- Old hardcoded login: ✓ BLOCKED
- Real admin login: ✓ WORKS
- Admin permissions: ✓ VERIFIED

Security Impact: High
Risk Before: Anyone could login as admin with known credentials
Risk After: Only users with real credentials can authenticate

Commit Hash: [git hash]
```

---

### Task 1.3: Enable SSL for Database Connection
**Priority**: P0 - CRITICAL SECURITY VULNERABILITY
**Estimated Time**: 1 hour
**Success Criteria**:
- Database connection uses SSL
- Certificate verification enabled
- Connection still works

**Security Issue**:
```bash
# .env - CRITICAL VULNERABILITY
DATABASE_URL=postgresql://...?sslmode=disable
```

**Implementation Steps**:
```bash
# 1. Update DATABASE_URL in .env
# Before:
# DATABASE_URL=postgresql://postgres:9c9snLP2Rckx50xbAy3b3C5Va@23.88.40.91:50184/20251001_neu_neondb?sslmode=disable

# After:
DATABASE_URL=postgresql://postgres:9c9snLP2Rckx50xbAy3b3C5Va@23.88.40.91:50184/20251001_neu_neondb?sslmode=require

# 2. Update connection-pool.ts to enforce SSL
cat > server/patches/ssl-connection.ts << 'EOF'
import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  min: 10,  // Reduced from 50
  max: 20,  // Reduced from 50
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,

  // SSL Configuration
  ssl: {
    rejectUnauthorized: true,  // Verify certificates
    ca: process.env.DB_SSL_CERT,  // Optional: CA certificate
  },
};

// Fallback for development (optional)
if (process.env.NODE_ENV === 'development') {
  console.warn('⚠️  Development mode: SSL certificate verification relaxed');
  poolConfig.ssl = {
    rejectUnauthorized: false,  // Less strict for dev
  };
}
EOF

# 3. Test connection with SSL
cat > server/scripts/test-ssl-connection.ts << 'EOF'
import { ConnectionPoolManager } from '../connection-pool';

async function testSSLConnection() {
  console.log('🔐 Testing SSL database connection...');

  const pool = ConnectionPoolManager.getInstance().getPool();

  try {
    const result = await pool.query('SELECT version(), current_setting(\'ssl\') as ssl_enabled;');
    console.log('✅ Database connected with SSL');
    console.log('PostgreSQL version:', result.rows[0].version);
    console.log('SSL enabled:', result.rows[0].ssl_enabled);
  } catch (error) {
    console.error('❌ SSL connection failed:', error);
    process.exit(1);
  }
}

testSSLConnection();
EOF

# 4. Run SSL test
npx tsx server/scripts/test-ssl-connection.ts

# 5. Update .env.example
cat >> .env.example << 'EOF'

# Database SSL Configuration
# Production: sslmode=require (enforces SSL)
# Development: sslmode=prefer (tries SSL, falls back)
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
EOF

# 6. Restart server and verify
npm run dev
# Check logs for SSL connection confirmation
```

**Verification Checklist**:
- [ ] DATABASE_URL updated to sslmode=require
- [ ] connection-pool.ts enforces SSL
- [ ] SSL test script runs successfully
- [ ] Server starts without errors
- [ ] Database queries work normally
- [ ] SSL verified in logs

**Documentation**:
```
Database SSL Implementation:

Configuration:
- SSL Mode: require (enforces SSL)
- Certificate Verification: enabled (production)
- Fallback: relaxed verification in development

Connection Pool Updates:
- SSL enabled in pool config
- Certificate verification: rejectUnauthorized: true
- Development exception: optional relaxed mode

Testing Results:
PostgreSQL Version: [version]
SSL Enabled: on
Connection Status: ✓ SUCCESS

Environment Variables:
DATABASE_URL: Updated with sslmode=require
.env.example: Updated with SSL documentation

Security Impact: High
Risk Before: Unencrypted database traffic
Risk After: All database traffic encrypted with SSL/TLS

Commit Hash: [git hash]
```

---

### Task 1.4: Implement Strong SESSION_SECRET
**Priority**: P0 - CRITICAL SECURITY VULNERABILITY
**Estimated Time**: 15 minutes
**Success Criteria**:
- Strong random SESSION_SECRET generated
- Secret stored securely
- Sessions still work

**Security Issue**:
```bash
# .env - CRITICAL VULNERABILITY
SESSION_SECRET=your-session-secret-here
```

**Implementation Steps**:
```bash
# 1. Generate cryptographically secure random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Output: [128-character hex string]

# 2. Update .env with new secret
# Copy the generated secret and update .env:
SESSION_SECRET=[paste-generated-secret-here]

# 3. Update .env.example with instructions
cat > .env.example.patch << 'EOF'
# Session Configuration
# Generate a strong secret with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# IMPORTANT: Keep this secret secure and never commit to git
SESSION_SECRET=generate-a-new-secret-here-do-not-use-this-placeholder
EOF

# 4. Verify .env is in .gitignore
grep "^\.env$" .gitignore || echo ".env" >> .gitignore

# 5. Add security note to documentation
cat > server/SESSION_SECURITY.md << 'EOF'
# Session Security

## SESSION_SECRET Requirements

### Generation
```bash
# Generate a cryptographically secure random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Storage
- Store in `.env` file (never commit to git)
- Use environment variables in production
- Rotate periodically (every 90 days recommended)

### Security Best Practices
1. Minimum 64 bytes (128 hex characters)
2. Use cryptographically secure random generator
3. Different secret for each environment
4. Never share or expose in logs
5. Rotate after security incidents

### Impact
The SESSION_SECRET is used to sign session cookies. If compromised:
- Attackers can forge session cookies
- User sessions can be hijacked
- Authentication can be bypassed

## Current Configuration
- Algorithm: HMAC-SHA256 (via express-session)
- Cookie settings: httpOnly, secure (production), sameSite
- Session timeout: 2 hours inactivity, 24 hours absolute
EOF

# 6. Restart server (invalidates all existing sessions)
npm run dev

# 7. Test login and session creation
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"[admin-password]"}' \
  -c cookies.txt

# Verify session cookie is set
cat cookies.txt
```

**Verification Checklist**:
- [ ] New SESSION_SECRET is 128+ characters
- [ ] Secret stored in .env
- [ ] .env in .gitignore
- [ ] .env.example has instructions
- [ ] Documentation created
- [ ] Server restarts successfully
- [ ] Login creates session cookie
- [ ] Session persistence works

**Documentation**:
```
SESSION_SECRET Security Implementation:

Secret Generation:
- Method: crypto.randomBytes(64).toString('hex')
- Length: 128 characters (256 bits entropy)
- Algorithm: Cryptographically secure PRNG

Storage:
- Location: .env file
- Git Protection: .env in .gitignore ✓
- Documentation: SESSION_SECURITY.md created

Session Configuration:
- Signing Algorithm: HMAC-SHA256
- Cookie Security: httpOnly, secure (prod), sameSite
- Timeout: 2h inactivity / 24h absolute

Testing:
- Server start: ✓ SUCCESS
- Login: ✓ Creates session
- Cookie set: ✓ Signed correctly
- Session persistence: ✓ WORKS

Security Impact: High
Risk Before: Weak secret, potential session forgery
Risk After: Strong cryptographic secret, secure sessions

NOTE: Deploying this change will invalidate all existing user sessions.
Users will need to log in again.

Commit Hash: [git hash]
```

---

## Phase 2: API Security Hardening (Days 4-6)

### Task 2.1: Protect Unprotected Management Endpoints
**Priority**: P0 - CRITICAL SECURITY VULNERABILITY
**Estimated Time**: 2 hours
**Success Criteria**:
- All 13 unprotected endpoints require authentication
- Role-based access control implemented
- API returns 401 for unauthenticated requests

**Security Issue**:
```typescript
// 13 endpoints with NO AUTHENTICATION
// From phase2-2-all-api-endpoints.md:
GET    /api/user-profiles
POST   /api/user-profiles
DELETE /api/user-profiles/:id
// ... 10 more
```

**Implementation Steps**:
```bash
# 1. Identify all unprotected routes
grep -r "router\.\(get\|post\|put\|delete\)" server/routes --include="*.ts" -A 1 | \
  grep -B 1 -v "requireAuth\|requireAdmin"

# 2. Create comprehensive list
cat > server/security-audit/unprotected-endpoints.txt << 'EOF'
Unprotected Endpoints Requiring Auth:

User Management:
GET    /api/user-profiles
POST   /api/user-profiles
PUT    /api/user-profiles/:id
DELETE /api/user-profiles/:id

Settings:
GET    /api/settings/all
PUT    /api/settings/mandant/:mandantId
GET    /api/settings/ui-mode
PUT    /api/settings/ui-mode

Database:
GET    /api/db/test-connection
GET    /api/db/pool-stats

Monitoring:
POST   /api/monitoring/manual-check
GET    /api/monitoring/alerts

Portal:
GET    /api/portal/mandants
POST   /api/portal/assign-object
EOF

# 3. Add authentication middleware to routes

# server/routes/users.ts
import { requireAuth, requireAdmin } from '../middleware/auth';

// Before:
router.get('/user-profiles', userController.getUserProfiles);

// After:
router.get('/user-profiles', requireAuth, userController.getUserProfiles);
router.post('/user-profiles', requireAdmin, userController.createUserProfile);
router.put('/user-profiles/:id', requireAdmin, userController.updateUserProfile);
router.delete('/user-profiles/:id', requireAdmin, userController.deleteUserProfile);

# server/routes/db.ts
router.get('/test-connection', requireAuth, databaseController.testConnection);
router.get('/pool-stats', requireAdmin, databaseController.getPoolStats);

# server/routes/monitoring.ts
router.post('/manual-check', requireAuth, monitoringController.manualCheck);
router.get('/alerts', requireAuth, monitoringController.getAlerts);

# server/routes/portal.ts
router.get('/mandants', requireAuth, portalController.getMandants);
router.post('/assign-object', requireAdmin, portalController.assignObject);

# 4. Create verification script
cat > server/scripts/verify-auth-protection.sh << 'EOF'
#!/bin/bash

echo "🔐 Verifying API endpoint protection..."

# Test unprotected access (should fail with 401)
endpoints=(
  "GET /api/user-profiles"
  "GET /api/settings/all"
  "GET /api/db/pool-stats"
  "GET /api/monitoring/alerts"
  "GET /api/portal/mandants"
)

for endpoint in "${endpoints[@]}"; do
  method=$(echo $endpoint | cut -d' ' -f1)
  path=$(echo $endpoint | cut -d' ' -f2)

  response=$(curl -s -w "%{http_code}" -X $method http://localhost:5000$path)
  status_code="${response: -3}"

  if [ "$status_code" = "401" ]; then
    echo "✓ $endpoint - Protected (401 Unauthorized)"
  else
    echo "✗ $endpoint - NOT PROTECTED (Status: $status_code)"
  fi
done

echo ""
echo "Test with authenticated session (should succeed with 200)..."

# Login first
cookie=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"[password]"}' \
  -c - | grep connect.sid | awk '{print $7}')

# Test with session
for endpoint in "${endpoints[@]}"; do
  method=$(echo $endpoint | cut -d' ' -f1)
  path=$(echo $endpoint | cut -d' ' -f2)

  response=$(curl -s -w "%{http_code}" -X $method http://localhost:5000$path \
    -b "connect.sid=$cookie")
  status_code="${response: -3}"

  if [ "$status_code" = "200" ]; then
    echo "✓ $endpoint - Accessible with auth (200 OK)"
  else
    echo "✗ $endpoint - Failed with auth (Status: $status_code)"
  fi
done
EOF

chmod +x server/scripts/verify-auth-protection.sh

# 5. Run verification
./server/scripts/verify-auth-protection.sh

# 6. Update API documentation
# Mark all endpoints with required auth level in documentation
```

**Verification Checklist**:
- [ ] All 13 endpoints have requireAuth or requireAdmin
- [ ] Verification script shows all 401s without auth
- [ ] Verification script shows all 200s with auth
- [ ] No endpoints accessible without authentication
- [ ] Role-based access works (user vs admin)
- [ ] API documentation updated

**Documentation**:
```
API Authentication Protection:

Endpoints Secured: 13

Authentication Middleware Applied:
1. GET /api/user-profiles - requireAuth
2. POST /api/user-profiles - requireAdmin
3. PUT /api/user-profiles/:id - requireAdmin
4. DELETE /api/user-profiles/:id - requireAdmin
5. GET /api/settings/all - requireAuth
6. PUT /api/settings/mandant/:mandantId - requireAdmin
7. GET /api/settings/ui-mode - requireAuth
8. PUT /api/settings/ui-mode - requireAuth
9. GET /api/db/test-connection - requireAuth
10. GET /api/db/pool-stats - requireAdmin
11. POST /api/monitoring/manual-check - requireAuth
12. GET /api/monitoring/alerts - requireAuth
13. GET /api/portal/mandants - requireAuth

Access Control:
- requireAuth: Any authenticated user
- requireAdmin: Admin role required

Testing Results:
Without Auth: All endpoints return 401 ✓
With User Auth: User endpoints accessible ✓
With Admin Auth: All endpoints accessible ✓

Security Impact: Critical
Risk Before: Unauthenticated access to sensitive data
Risk After: All endpoints require authentication

Commit Hash: [git hash]
```

---

### Task 2.2: Implement Rate Limiting
**Priority**: P1
**Estimated Time**: 1 hour
**Success Criteria**:
- Rate limiting on login endpoint
- Configurable limits per endpoint
- Proper error responses

**Implementation Steps**:
```bash
# 1. Install rate limiting middleware
npm install express-rate-limit

# 2. Create rate limiter configuration
cat > server/middleware/rate-limit.ts << 'EOF'
import rateLimit from 'express-rate-limit';

// Strict rate limit for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many login attempts. Please try again in 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests from the count
  skipSuccessfulRequests: true,
});

// General API rate limit
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests. Please slow down.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for data export endpoints
export const exportRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 exports per hour
  message: {
    error: 'Export rate limit exceeded. Please try again later.',
    code: 'EXPORT_LIMIT_EXCEEDED',
  },
});
EOF

# 3. Apply rate limiting to routes

# server/routes/auth.ts
import { authRateLimiter } from '../middleware/rate-limit';

router.post('/login', authRateLimiter, authController.login);
router.post('/register', authRateLimiter, authController.register);
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);

# server/index.ts (global API rate limit)
import { apiRateLimiter } from './middleware/rate-limit';

app.use('/api', apiRateLimiter);

# 4. Test rate limiting
cat > server/scripts/test-rate-limit.sh << 'EOF'
#!/bin/bash

echo "🚦 Testing rate limiting..."

# Test login rate limit (should block after 5 attempts)
for i in {1..7}; do
  echo "Attempt $i:"
  curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"wrong","password":"wrong"}' | \
    jq -r '.error // .message'
  sleep 1
done
EOF

chmod +x server/scripts/test-rate-limit.sh
./server/scripts/test-rate-limit.sh
```

**Verification Checklist**:
- [ ] express-rate-limit installed
- [ ] Rate limiters configured
- [ ] Auth endpoints protected (5/15min)
- [ ] API endpoints protected (100/min)
- [ ] Test shows blocking after limit
- [ ] Error messages are user-friendly
- [ ] Rate-limit headers present

**Documentation**:
```
Rate Limiting Implementation:

Configuration:

1. Authentication Endpoints (/api/auth/login, /register, /forgot-password)
   - Window: 15 minutes
   - Max Attempts: 5
   - Skip Successful: Yes

2. General API Endpoints (/api/*)
   - Window: 1 minute
   - Max Requests: 100
   - Skip Successful: No

3. Export Endpoints (future)
   - Window: 1 hour
   - Max Exports: 10

Headers:
- RateLimit-Limit: Maximum requests
- RateLimit-Remaining: Remaining requests
- RateLimit-Reset: Reset timestamp

Error Response:
{
  "error": "Too many login attempts. Please try again in 15 minutes.",
  "code": "RATE_LIMIT_EXCEEDED"
}

Testing Results:
- Login attempts 1-5: ✓ ALLOWED
- Login attempt 6: ✓ BLOCKED
- Wait 15 minutes: ✓ RESET
- General API within limits: ✓ ALLOWED
- General API exceeding limits: ✓ BLOCKED

Security Impact: Medium-High
Protection Against: Brute force, DDoS, API abuse

Commit Hash: [git hash]
```

---

### Task 2.3: Secure Email Service Configuration
**Priority**: P1
**Estimated Time**: 30 minutes
**Success Criteria**:
- Email credentials moved to environment variables
- SMTP connection uses TLS
- Certificate verification enabled

**Security Issue**:
```bash
# .env - Credentials exposed
MAILSERVER_PASSWORD="Ceder2020#"
```

**Implementation Steps**:
```bash
# 1. Review email service configuration
cat server/email-service.ts

# 2. Update email transporter configuration
cat > server/patches/email-security.ts << 'EOF'
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAILSERVER_HOST || 'smtp.udag.de',
  port: parseInt(process.env.MAILSERVER_PORT || '587'),
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.MAILSERVER_USER,
    pass: process.env.MAILSERVER_PASSWORD,
  },
  tls: {
    // Enforce TLS
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2',
  },
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service configuration error:', error);
  } else {
    console.log('✅ Email service ready');
  }
});
EOF

# 3. Update .env with secure defaults
cat >> .env.example << 'EOF'

# Email Configuration
MAILSERVER_HOST=smtp.udag.de
MAILSERVER_PORT=587
MAILSERVER_USER=your-email-username
MAILSERVER_PASSWORD=your-secure-password
MAILSERVER_FROM=noreply@netzwaechter.de
EOF

# 4. Test email service
cat > server/scripts/test-email.ts << 'EOF'
import { emailService } from '../email-service';

async function testEmail() {
  console.log('📧 Testing email service...');

  try {
    await emailService.sendPasswordResetEmail(
      'test@example.com',
      'Test User',
      'test-token-123'
    );
    console.log('✅ Email sent successfully');
  } catch (error) {
    console.error('❌ Email send failed:', error);
  }
}

testEmail();
EOF

# 5. Run test
npx tsx server/scripts/test-email.ts
```

**Verification Checklist**:
- [ ] Email credentials in environment variables
- [ ] SMTP connection uses TLS 1.2+
- [ ] Certificate verification enabled
- [ ] Connection verified on startup
- [ ] Test email sends successfully

**Documentation**:
```
Email Service Security:

SMTP Configuration:
- Host: smtp.udag.de
- Port: 587 (STARTTLS)
- TLS Version: 1.2+
- Certificate Verification: Enabled

Security Improvements:
1. Credentials in environment variables ✓
2. TLS enforcement ✓
3. Certificate validation ✓
4. Connection verification on startup ✓

Environment Variables:
MAILSERVER_HOST=smtp.udag.de
MAILSERVER_PORT=587
MAILSERVER_USER=[from .env]
MAILSERVER_PASSWORD=[from .env]

Testing:
- Connection: ✓ SUCCESS
- TLS Negotiation: ✓ TLSv1.2
- Test Email: ✓ SENT

Security Impact: Medium
Risk Before: Potential MITM, exposed credentials
Risk After: Encrypted transport, secure auth

Commit Hash: [git hash]
```

---

## Phase 3: Database Optimization (Days 7-10)

### Task 3.1: Optimize Connection Pool Configuration
**Priority**: P1
**Estimated Time**: 2 hours
**Success Criteria**:
- Connection pool size optimized (reduce from 50)
- Idle timeout configured correctly
- Pool monitoring in place

**Performance Issue**:
```typescript
// connection-pool.ts - EXCESSIVE
const poolConfig: PoolConfig = {
  min: 50,  // Too many persistent connections
  max: 50,
  idleTimeoutMillis: 0,  // Never timeout
};
```

**Implementation Steps**:
```bash
# 1. Calculate optimal pool size
# Formula: connections = ((core_count * 2) + effective_spindle_count)
# Typical: 10-20 connections for most applications

# 2. Update connection pool configuration
cat > server/patches/pool-optimization.ts << 'EOF'
import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,

  // Optimized connection pool
  min: 5,   // Reduced from 50 (persistent connections)
  max: 20,  // Reduced from 50 (max concurrent)

  // Connection lifecycle
  idleTimeoutMillis: 30000,      // Close idle after 30s (was 0)
  connectionTimeoutMillis: 5000,  // 5s to acquire connection

  // Performance
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,

  // SSL (from Task 1.3)
  ssl: {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
};

export class ConnectionPoolManager {
  private static instance: ConnectionPoolManager;
  private pool: Pool;
  private stats = {
    queries: 0,
    errors: 0,
    avgResponseTime: 0,
  };

  private constructor() {
    this.pool = new Pool(poolConfig);

    // Monitor pool events
    this.pool.on('connect', () => {
      console.log('📊 New database connection established');
    });

    this.pool.on('error', (err) => {
      console.error('❌ Unexpected pool error:', err);
      this.stats.errors++;
    });

    this.pool.on('remove', () => {
      console.log('📊 Connection removed from pool');
    });
  }

  public async getPoolStats() {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
      queries: this.stats.queries,
      errors: this.stats.errors,
      avgResponseTime: this.stats.avgResponseTime,
    };
  }

  public async query(text: string, params?: any[]) {
    const start = Date.now();
    this.stats.queries++;

    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      // Update moving average
      this.stats.avgResponseTime =
        (this.stats.avgResponseTime * 0.9) + (duration * 0.1);

      return result;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  // ... rest of singleton implementation
}
EOF

# 3. Add pool monitoring endpoint
# server/routes/db.ts
router.get('/pool-stats', requireAdmin, async (req, res) => {
  const stats = await ConnectionPoolManager.getInstance().getPoolStats();
  res.json({
    pool: stats,
    config: {
      min: 5,
      max: 20,
      idleTimeout: 30000,
    },
    health: stats.errors / stats.queries < 0.01 ? 'healthy' : 'degraded',
  });
});

# 4. Monitor pool usage
cat > server/scripts/monitor-pool.sh << 'EOF'
#!/bin/bash

echo "📊 Monitoring connection pool..."

while true; do
  stats=$(curl -s http://localhost:5000/api/db/pool-stats \
    -H "Cookie: connect.sid=$SESSION_COOKIE" | jq)

  clear
  echo "=== Connection Pool Stats ==="
  echo "$stats" | jq '.pool'
  echo ""
  echo "Health: $(echo "$stats" | jq -r '.health')"

  sleep 5
done
EOF

# 5. Load test to verify pool handles concurrent requests
npm install --save-dev autocannon

npx autocannon -c 50 -d 30 http://localhost:5000/api/objects
```

**Verification Checklist**:
- [ ] Pool size reduced to 5-20 connections
- [ ] Idle timeout set to 30s
- [ ] Pool monitoring added
- [ ] Load test shows adequate performance
- [ ] No connection exhaustion under load
- [ ] Stats endpoint works

**Documentation**:
```
Connection Pool Optimization:

Configuration Changes:
Before:
- Min: 50 connections
- Max: 50 connections
- Idle Timeout: 0 (never)
- Issues: Resource waste, connection limit exhaustion

After:
- Min: 5 connections (90% reduction)
- Max: 20 connections (60% reduction)
- Idle Timeout: 30s
- Benefits: Efficient resource usage, auto-scaling

Pool Statistics Monitoring:
- Total connections
- Idle connections
- Waiting requests
- Query count
- Error rate
- Average response time

Load Testing Results:
Concurrent Users: 50
Test Duration: 30s
Requests/sec: [X]
Avg Latency: [X]ms
Errors: 0
Pool Max Reached: [Yes/No]

Performance Impact:
- Database server load: Reduced
- Application memory: -XXX MB
- Connection overhead: Minimal
- Query performance: Unchanged

Monitoring:
curl http://localhost:5000/api/db/pool-stats

Commit Hash: [git hash]
```

---

### Task 3.2: Fix N+1 Query Issues in Storage Layer
**Priority**: P2
**Estimated Time**: 4 hours
**Success Criteria**:
- UserProfile loaded with single query
- JOIN issues with Drizzle resolved
- Query count reduced significantly

**Performance Issue**:
```typescript
// storage.ts:203-218 - N+1 QUERY PATTERN
const [result] = await getDb().select().from(users).where(eq(users.id, id));

// Separate query due to Drizzle JOIN error
if (result.userProfileId) {
  const [profile] = await getDb()
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, result.userProfileId));
}
```

**Implementation Steps**:
```bash
# 1. Analyze current N+1 patterns
grep -n "// User Profile separat laden" server/storage.ts

# 2. Fix Drizzle JOIN implementation
cat > server/patches/join-fix.ts << 'EOF'
import { getDb } from './db';
import { users, userProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';

// BEFORE (N+1):
async getUserById(id: string): Promise<User | null> {
  const [result] = await getDb()
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!result) return null;

  let userProfile = null;
  if (result.userProfileId) {
    const [profile] = await getDb()
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, result.userProfileId));
    userProfile = profile || null;
  }

  return { ...result, userProfile };
}

// AFTER (Single query with LEFT JOIN):
async getUserById(id: string): Promise<User | null> {
  const result = await getDb()
    .select({
      // User fields
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      mandantId: users.mandantId,
      mandantAccess: users.mandantAccess,
      userProfileId: users.userProfileId,

      // UserProfile fields (with alias)
      userProfile: {
        id: userProfiles.id,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        phone: userProfiles.phone,
        profileImage: userProfiles.profileImage,
      },
    })
    .from(users)
    .leftJoin(userProfiles, eq(users.userProfileId, userProfiles.id))
    .where(eq(users.id, id))
    .limit(1);

  if (!result[0]) return null;

  // Transform result
  const user = result[0];
  return {
    ...user,
    userProfile: user.userProfile?.id ? user.userProfile : null,
  };
}
EOF

# 3. Apply fix to storage.ts
# Update getUserById method (around line 203)
# Update getAllUsers method
# Update any other methods with similar pattern

# 4. Test query count reduction
cat > server/scripts/test-query-count.ts << 'EOF'
import { storage } from '../storage';

async function testQueryCount() {
  console.log('📊 Testing query count...');

  // Monkey-patch to count queries
  let queryCount = 0;
  const originalQuery = storage.db.query.bind(storage.db);
  storage.db.query = async (...args: any[]) => {
    queryCount++;
    console.log(`Query #${queryCount}:`, args[0].substring(0, 50));
    return originalQuery(...args);
  };

  console.log('\n--- Getting single user ---');
  queryCount = 0;
  await storage.getUserById('100');
  console.log(`Total queries: ${queryCount}\n`);

  console.log('--- Getting all users ---');
  queryCount = 0;
  await storage.getAllUsers();
  console.log(`Total queries: ${queryCount}\n`);
}

testQueryCount();
EOF

# 5. Run test and compare before/after
npx tsx server/scripts/test-query-count.ts
```

**Verification Checklist**:
- [ ] JOIN implementation works correctly
- [ ] Query count reduced (1 query instead of N+1)
- [ ] User profile data returned correctly
- [ ] All user-related endpoints work
- [ ] Performance improved

**Documentation**:
```
N+1 Query Fix:

Problem:
- Pattern: Select user, then select profile separately
- Impact: 2 queries per user (1 + N for N users)
- Example: Getting 100 users = 200 queries

Solution:
- Use LEFT JOIN to fetch user + profile in single query
- Drizzle ORM: Explicit field selection with aliases
- Result transformation to match expected shape

Query Count Reduction:
Before:
- Single user: 2 queries
- 100 users: 200 queries
- getAllUsers: 1 + N queries

After:
- Single user: 1 query (50% reduction)
- 100 users: 1 query (99.5% reduction)
- getAllUsers: 1 query (100% reduction)

Performance Impact:
- Database load: -50% to -99.5%
- Response time: -X ms average
- Network roundtrips: Reduced

Code Changes:
server/storage.ts:
- getUserById (line 203): Added LEFT JOIN
- getAllUsers (line 450): Added LEFT JOIN
- [... other methods]

Testing:
✓ Single user fetch: 1 query
✓ All users fetch: 1 query
✓ Profile data: Complete
✓ Endpoints: Working

Commit Hash: [git hash]
```

---

## Phase 4: Infrastructure & Deployment (Days 11-14)

### Task 4.1: Environment Variable Security Audit
**Priority**: P1
**Estimated Time**: 1 hour
**Success Criteria**:
- All sensitive values in environment variables
- .env.example has no real secrets
- Documentation for all variables

**Implementation Steps**:
```bash
# 1. Audit current .env file
cat > server/scripts/audit-env.sh << 'EOF'
#!/bin/bash

echo "🔍 Environment Variables Security Audit"
echo "========================================"

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ .env file not found"
  exit 1
fi

# Check for common security issues
echo ""
echo "Checking for security issues..."

# Weak secrets
if grep -q "secret-here\|change-me\|example" .env; then
  echo "⚠️  WARNING: Placeholder secrets found"
fi

# Hardcoded passwords
if grep -q "password=.*[0-9]" .env; then
  echo "⚠️  WARNING: Possible hardcoded passwords"
fi

# Check .env is in .gitignore
if ! grep -q "^\.env$" .gitignore; then
  echo "❌ CRITICAL: .env not in .gitignore"
else
  echo "✓ .env is in .gitignore"
fi

# Check .env.example exists
if [ ! -f .env.example ]; then
  echo "⚠️  WARNING: .env.example not found"
else
  echo "✓ .env.example exists"
fi

# Verify .env.example has no secrets
if grep -E "password=.{10,}|secret=.{20,}" .env.example; then
  echo "❌ CRITICAL: Real secrets in .env.example"
else
  echo "✓ .env.example has placeholders only"
fi

echo ""
echo "Environment variables found:"
grep -E "^[A-Z_]+=." .env | cut -d'=' -f1 | sort
EOF

chmod +x server/scripts/audit-env.sh
./server/scripts/audit-env.sh

# 2. Create comprehensive .env.example
cat > .env.example << 'EOF'
# Database Configuration
# Production database connection string
# SSL is required in production (sslmode=require)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Local development database (optional)
LOCAL_DATABASE_URL=postgresql://localhost:5432/netzwaechter_dev

# Session Security
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
SESSION_SECRET=generate-a-new-secret-with-the-command-above

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Service Configuration
# SMTP settings for password reset and notifications
MAILSERVER_HOST=smtp.udag.de
MAILSERVER_PORT=587
MAILSERVER_USER=your-email-username
MAILSERVER_PASSWORD=your-email-password
MAILSERVER_FROM=noreply@netzwaechter.de

# Database SSL Certificate (optional, for custom CA)
# DB_SSL_CERT=/path/to/ca-certificate.crt

# Feature Flags (optional)
# ENABLE_REGISTRATION=false
# ENABLE_API_DOCS=true
EOF

# 3. Create environment variable documentation
cat > server/ENVIRONMENT_VARIABLES.md << 'EOF'
# Environment Variables Documentation

## Required Variables

### DATABASE_URL
- **Description**: PostgreSQL connection string
- **Format**: `postgresql://user:pass@host:port/db?sslmode=require`
- **Example**: `postgresql://postgres:secret@localhost:5432/netzwaechter`
- **Security**:
  - Must use `sslmode=require` in production
  - Keep password secure, never commit to git
- **Default**: None (required)

### SESSION_SECRET
- **Description**: Secret key for signing session cookies
- **Format**: 128-character hex string (64 bytes)
- **Generate**: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- **Security**:
  - Use different secret for each environment
  - Rotate every 90 days
  - Never share or expose in logs
- **Default**: None (required)

## Email Configuration

### MAILSERVER_HOST
- **Description**: SMTP server hostname
- **Example**: `smtp.udag.de`
- **Default**: `smtp.udag.de`

### MAILSERVER_PORT
- **Description**: SMTP server port (use 587 for STARTTLS)
- **Example**: `587`
- **Default**: `587`

### MAILSERVER_USER
- **Description**: SMTP authentication username
- **Security**: Store securely, never commit

### MAILSERVER_PASSWORD
- **Description**: SMTP authentication password
- **Security**: Store securely, never commit

### MAILSERVER_FROM
- **Description**: From address for sent emails
- **Example**: `noreply@netzwaechter.de`

## Optional Variables

### LOCAL_DATABASE_URL
- **Description**: Alternative local database for development
- **Usage**: Fallback if main DATABASE_URL fails

### PORT
- **Description**: Server port
- **Default**: `5000`

### NODE_ENV
- **Description**: Environment mode
- **Values**: `development` | `production` | `test`
- **Default**: `development`

## Security Best Practices

1. **Never commit .env to git**
   - Add `.env` to `.gitignore`
   - Use `.env.example` with placeholders

2. **Use strong secrets**
   - Minimum 64 bytes (128 hex chars) for SESSION_SECRET
   - Cryptographically secure random generation

3. **Different secrets per environment**
   - Development, staging, production all separate
   - Never reuse secrets across environments

4. **Rotate secrets regularly**
   - SESSION_SECRET: Every 90 days
   - Database passwords: Every 180 days

5. **Restrict access**
   - .env file permissions: 600 (owner read/write only)
   - Only necessary personnel have access
EOF

# 4. Set proper file permissions
chmod 600 .env
chmod 644 .env.example

# 5. Verify no secrets in git history
git log --all --full-history -p -- .env
```

**Verification Checklist**:
- [ ] Audit script runs successfully
- [ ] .env in .gitignore
- [ ] .env.example has no real secrets
- [ ] .env file permissions: 600
- [ ] Documentation complete
- [ ] No secrets in git history

**Documentation**:
```
Environment Variable Security Audit:

Files Checked:
- .env: Protected, not in git ✓
- .env.example: Placeholders only ✓
- .gitignore: Contains .env ✓

Security Issues Found: [count]
1. [Issue description]
2. [Issue description]

Security Issues Resolved: [count]
1. [Resolution]
2. [Resolution]

Environment Variables Documented: 11
- DATABASE_URL
- SESSION_SECRET
- MAILSERVER_* (5 vars)
- Optional vars (4)

File Permissions:
- .env: 600 (owner read/write only) ✓
- .env.example: 644 (public readable) ✓

Documentation: server/ENVIRONMENT_VARIABLES.md

Best Practices Implemented:
✓ Strong secret generation documented
✓ Rotation schedule defined
✓ Per-environment separation
✓ Access restrictions

Commit Hash: [git hash]
```

---

### Task 4.2: Production Deployment Checklist
**Priority**: P1
**Estimated Time**: 2 hours
**Success Criteria**:
- Comprehensive deployment checklist created
- Pre-deployment verification script
- Rollback procedure documented

**Implementation Steps**:
```bash
# 1. Create deployment checklist
cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
# Production Deployment Checklist

## Pre-Deployment (1 Week Before)

### Code Quality
- [ ] All tests passing
- [ ] Code review completed
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Bundle size within limits

### Database
- [ ] Database migrations tested
- [ ] Backup created and verified
- [ ] Migration rollback tested
- [ ] Connection pool optimized

### Security
- [ ] All passwords hashed with bcrypt
- [ ] SESSION_SECRET is strong and unique
- [ ] DATABASE_URL uses SSL (sslmode=require)
- [ ] All API endpoints require auth
- [ ] Rate limiting configured
- [ ] Environment variables secured

### Configuration
- [ ] .env configured for production
- [ ] NODE_ENV=production
- [ ] Email service tested
- [ ] Error logging configured
- [ ] Monitoring configured

## Deployment Day

### Before Deployment
- [ ] Notify users of maintenance window
- [ ] Create database backup
- [ ] Tag release in git
- [ ] Document current version

### Deployment Steps
1. [ ] Pull latest code
2. [ ] Install dependencies (`npm install`)
3. [ ] Run database migrations
4. [ ] Build frontend (`npm run build`)
5. [ ] Run security checks
6. [ ] Start server
7. [ ] Verify health checks

### Post-Deployment
- [ ] Test critical user flows
- [ ] Verify authentication works
- [ ] Check error logs
- [ ] Monitor performance
- [ ] Verify email sending
- [ ] Test rate limiting

### Rollback Plan (If Needed)
1. [ ] Stop server
2. [ ] Restore database backup
3. [ ] Revert to previous git tag
4. [ ] Rebuild and restart
5. [ ] Notify users

## Post-Deployment (24 Hours)

### Monitoring
- [ ] Error rate normal
- [ ] Response times normal
- [ ] Database pool healthy
- [ ] No authentication issues
- [ ] User feedback positive

### Documentation
- [ ] Update CHANGELOG
- [ ] Document any issues
- [ ] Update runbook if needed
EOF

# 2. Create pre-deployment verification script
cat > scripts/pre-deployment-check.sh << 'EOF'
#!/bin/bash

echo "🚀 Pre-Deployment Verification"
echo "=============================="

EXIT_CODE=0

# Check Node.js version
echo ""
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
  echo "✓ Node.js version: $(node -v)"
else
  echo "✗ Node.js version too old: $(node -v) (need v18+)"
  EXIT_CODE=1
fi

# Check environment
echo ""
echo "Checking environment configuration..."

if [ ! -f .env ]; then
  echo "✗ .env file missing"
  EXIT_CODE=1
else
  echo "✓ .env file exists"

  # Check critical variables
  if ! grep -q "^DATABASE_URL=" .env; then
    echo "✗ DATABASE_URL not set"
    EXIT_CODE=1
  else
    # Check SSL is enabled
    if grep -q "sslmode=disable" .env; then
      echo "✗ DATABASE_URL has SSL disabled (sslmode=disable)"
      EXIT_CODE=1
    else
      echo "✓ DATABASE_URL configured with SSL"
    fi
  fi

  if ! grep -q "^SESSION_SECRET=" .env; then
    echo "✗ SESSION_SECRET not set"
    EXIT_CODE=1
  else
    SECRET_LENGTH=$(grep "^SESSION_SECRET=" .env | cut -d'=' -f2 | wc -c)
    if [ "$SECRET_LENGTH" -lt 64 ]; then
      echo "✗ SESSION_SECRET too short ($SECRET_LENGTH chars, need 128+)"
      EXIT_CODE=1
    else
      echo "✓ SESSION_SECRET is strong"
    fi
  fi

  if ! grep -q "^NODE_ENV=production" .env; then
    echo "⚠️  NODE_ENV not set to production"
  else
    echo "✓ NODE_ENV=production"
  fi
fi

# Check dependencies
echo ""
echo "Checking dependencies..."
if [ -d node_modules ]; then
  echo "✓ node_modules exists"
else
  echo "✗ node_modules missing (run npm install)"
  EXIT_CODE=1
fi

# Run tests
echo ""
echo "Running tests..."
npm run type-check
if [ $? -eq 0 ]; then
  echo "✓ Type checking passed"
else
  echo "✗ Type checking failed"
  EXIT_CODE=1
fi

# Check build
echo ""
echo "Testing build..."
npm run build
if [ $? -eq 0 ]; then
  echo "✓ Build successful"
else
  echo "✗ Build failed"
  EXIT_CODE=1
fi

# Database connection
echo ""
echo "Testing database connection..."
npm run db:test || {
  echo "✗ Database connection failed"
  EXIT_CODE=1
}

# Final summary
echo ""
echo "=============================="
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ All pre-deployment checks passed"
  echo "Ready to deploy!"
else
  echo "❌ Pre-deployment checks failed"
  echo "Fix issues before deploying"
fi

exit $EXIT_CODE
EOF

chmod +x scripts/pre-deployment-check.sh

# 3. Create rollback script
cat > scripts/rollback.sh << 'EOF'
#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./rollback.sh <git-tag>"
  echo "Example: ./rollback.sh v1.2.3"
  exit 1
fi

TAG=$1

echo "🔄 Rolling back to $TAG"
echo "=============================="

# Stop server
echo "Stopping server..."
killall node || true

# Backup current state
echo "Backing up current state..."
git branch backup-$(date +%Y%m%d-%H%M%S)

# Revert code
echo "Reverting to $TAG..."
git checkout $TAG

# Install dependencies
echo "Installing dependencies..."
npm install

# Restore database (if backup provided)
if [ -n "$2" ]; then
  echo "Restoring database from $2..."
  # Add database restore command here
fi

# Rebuild
echo "Building application..."
npm run build

# Restart
echo "Starting server..."
npm start

echo "✅ Rollback complete"
EOF

chmod +x scripts/rollback.sh

# 4. Test pre-deployment check
./scripts/pre-deployment-check.sh
```

**Verification Checklist**:
- [ ] Deployment checklist complete
- [ ] Pre-deployment script works
- [ ] Rollback script tested
- [ ] All checks pass locally
- [ ] Documentation clear

**Documentation**:
```
Production Deployment Preparation:

Artifacts Created:
1. DEPLOYMENT_CHECKLIST.md - Complete deployment guide
2. scripts/pre-deployment-check.sh - Automated verification
3. scripts/rollback.sh - Emergency rollback procedure

Pre-Deployment Checks:
✓ Node.js version: v18+
✓ Environment configured
✓ SSL enabled in DATABASE_URL
✓ SESSION_SECRET strong (128+ chars)
✓ Dependencies installed
✓ Type checking passes
✓ Build successful
✓ Database connection works

Deployment Process:
1. Pre-deployment checks (automated)
2. Database backup
3. Code deployment
4. Database migrations
5. Build and start
6. Post-deployment verification
7. Monitor for 24 hours

Rollback Procedure:
Time to Rollback: <5 minutes
Steps:
1. Stop server
2. Run ./scripts/rollback.sh <tag>
3. Restore database if needed
4. Verify functionality

Testing:
Pre-deployment check: ✓ PASS
Build verification: ✓ PASS
Security checks: ✓ PASS

Ready for Production: [YES/NO]

Commit Hash: [git hash]
```

---

## Final Deliverables

### Required Artifacts
1. **Pull Request**: Branch `security/backend-hardening` → `main`
2. **Security Audit Report**: All vulnerabilities resolved
3. **Performance Report**: Database optimization results
4. **Deployment Documentation**: Complete deployment guide
5. **Migration Scripts**: Password migration, database setup

### Success Metrics
- **Security Vulnerabilities**: 0 (from 12 critical)
- **Password Security**: 100% bcrypt hashed
- **API Protection**: 100% endpoints authenticated
- **Connection Pool**: 60-90% reduction in connections
- **Query Performance**: 50-99.5% fewer database queries
- **SSL/TLS**: 100% encrypted connections

### Git Workflow
```bash
# 1. Create branch
git checkout -b security/backend-hardening

# 2. Commit after each phase
git add .
git commit -m "Phase 1: Critical Security Fixes

- Implemented bcrypt password hashing (12 rounds)
- Migrated all existing passwords to hashes
- Removed hardcoded admin bypass vulnerability
- Enabled SSL for database connections
- Generated strong SESSION_SECRET

Security improvements:
- 5 critical vulnerabilities resolved
- All passwords secured with industry-standard hashing
- Database traffic encrypted with TLS
- Session security hardened

Testing: All authentication flows verified working"

# 3. Push and create PR
git push origin security/backend-hardening
gh pr create --title "Backend Security Hardening & Infrastructure Optimization" \
  --body "$(cat todo/AGENT-B-BACKEND-SECURITY.md)"
```

---

## Dependencies & Coordination

### No Conflicts With Frontend Work
This branch touches:
- `server/*` - Backend only
- `db/schema.ts` - Database schema (backend)
- `.env`, `.env.example` - Environment config
- Backend scripts and utilities

### Safe to Merge Independently
- No frontend component changes
- No UI/UX modifications
- No client-side code changes
- API contracts maintained (authentication added, but compatible)

---

## Risk Mitigation

### Critical Deployment Notes

#### Password Migration
```bash
# IMPORTANT: Run password migration BEFORE deploying authentication changes
# This ensures all passwords are hashed before bcrypt validation is enforced

# 1. Deploy migration script first
npm run migrate:passwords

# 2. Verify all passwords migrated
SELECT username, LEFT(password, 10) FROM users;
# All should start with $2b$12$

# 3. Then deploy authentication changes
```

#### Session Invalidation
```bash
# WARNING: Changing SESSION_SECRET invalidates all active sessions
# All users will be logged out and must login again

# Schedule during maintenance window
# Notify users in advance
```

### Rollback Plan
```bash
# If critical issues after deployment:

# 1. Immediate rollback
./scripts/rollback.sh v<previous-version>

# 2. Database rollback (if migrations run)
# Restore from backup taken pre-deployment

# 3. Verify application works
npm run health-check

# 4. Notify team and investigate
```

---

**Created**: 2025-10-07
**Last Updated**: 2025-10-07
**Agent**: B (Backend Security)
**Status**: Ready to Start

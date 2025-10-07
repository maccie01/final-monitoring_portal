# Session Security Documentation

## Overview

Netzwächter uses PostgreSQL-backed session storage with comprehensive security measures to protect user sessions from hijacking, fixation, and other session-based attacks.

## Session Configuration

### SESSION_SECRET Requirements

#### Generation
```bash
# Generate a cryptographically secure random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Requirements:**
- Minimum 64 bytes (128 hex characters)
- Cryptographically secure random generation
- Different secret for each environment (dev, staging, production)
- Never commit to git
- Rotate every 90 days

#### Storage
- Store in `.env` file (never commit to git)
- Use environment variables in production
- Add to secret management system (e.g., AWS Secrets Manager, HashiCorp Vault)

### Security Best Practices

1. **Strong Secrets**
   - Minimum 64 bytes (128 hex characters)
   - Use `crypto.randomBytes()` for generation
   - Never use predictable values

2. **Different Secrets Per Environment**
   - Development: Own secret
   - Staging: Own secret
   - Production: Own secret (highest security)
   - Never reuse across environments

3. **Regular Rotation**
   - SESSION_SECRET: Every 90 days
   - Database passwords: Every 180 days
   - After security incidents: Immediately

4. **Access Control**
   - .env file permissions: 600 (owner read/write only)
   - Only necessary personnel have access
   - Audit access logs regularly

## Session Implementation

### Cookie Security Settings

```typescript
cookie: {
  httpOnly: true,        // Prevent XSS access
  secure: isProduction,  // HTTPS only in production
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  sameSite: 'strict',    // CSRF protection (production)
  domain: undefined,     // Auto-detect
  path: '/'             // All paths
}
```

### Session Timeouts

#### Inactivity Timeout
- **Duration:** 2 hours
- **Purpose:** Automatically expire inactive sessions
- **Behavior:** Session destroyed after 2 hours without activity
- **Updates:** Last activity updated on every authenticated request

#### Absolute Timeout
- **Duration:** 24 hours
- **Purpose:** Force re-authentication after maximum session lifetime
- **Behavior:** Session destroyed 24 hours after login
- **Security:** Prevents indefinite session extension through activity

### Session Storage

- **Backend:** PostgreSQL database
- **Table:** `sessions`
- **Connection:** Shared connection pool (optimized)
- **Cleanup:** Automatic cleanup of expired sessions

## Security Features

### 1. XSS Protection
- `httpOnly: true` - JavaScript cannot access session cookies
- Cookies not exposed to client-side scripts
- Mitigates cookie theft via XSS attacks

### 2. CSRF Protection
- `sameSite: 'strict'` in production
- Prevents cross-site request forgery
- Cookie only sent for same-origin requests

### 3. Transport Security
- `secure: true` in production
- Cookies only transmitted over HTTPS
- Prevents man-in-the-middle attacks

### 4. Session Fixation Prevention
- New session ID generated on login
- Old session data destroyed
- Prevents session fixation attacks

### 5. Session Hijacking Mitigation
- Timeout mechanisms (inactivity + absolute)
- IP address can be validated (optional)
- User agent can be validated (optional)

## Impact Analysis

### SESSION_SECRET Compromise

If SESSION_SECRET is compromised, attackers can:
- Forge session cookies
- Hijack user sessions
- Bypass authentication
- Impersonate any user

**Mitigation:**
1. Rotate SESSION_SECRET immediately
2. Force all users to re-login (old sessions invalidated)
3. Audit access logs for suspicious activity
4. Investigate how secret was compromised

### Cookie Theft (XSS)

Protected by:
- `httpOnly: true` - JavaScript cannot access cookies
- Input sanitization (prevents XSS injection)
- Content Security Policy headers

### Cookie Interception (MITM)

Protected by:
- `secure: true` - HTTPS only transmission
- SSL/TLS encryption
- HSTS headers (force HTTPS)

### Session Fixation

Protected by:
- New session on login
- Session regeneration
- Old session destruction

## Configuration Examples

### Development
```env
NODE_ENV=development
SESSION_SECRET=<128-char-hex-string>
```

Settings:
- secure: false (allows HTTP)
- sameSite: 'lax' (less strict for local dev)

### Production
```env
NODE_ENV=production
SESSION_SECRET=<different-128-char-hex-string>
```

Settings:
- secure: true (HTTPS required)
- sameSite: 'strict' (maximum CSRF protection)
- Strong secret validation enforced

## Monitoring & Alerts

### Metrics to Track
1. Active session count
2. Session creation rate
3. Session expiration rate (timeout vs logout)
4. Failed authentication attempts
5. Session validation errors

### Alert Thresholds
- Sudden spike in session creation (potential attack)
- High rate of timeout expirations (user experience issue)
- Multiple failed auth attempts from same IP (brute force)
- Invalid session cookie attempts (session hijacking)

## Testing

### Manual Tests

```bash
# 1. Test session creation on login
curl -X POST http://localhost:5000/api/auth/user-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  -c cookies.txt

# 2. Test authenticated request
curl http://localhost:5000/api/user/ \
  -b cookies.txt

# 3. Test logout destroys session
curl -X POST http://localhost:5000/api/auth/logout \
  -b cookies.txt

# 4. Verify session is destroyed
curl http://localhost:5000/api/user/ \
  -b cookies.txt
# Should return 401 Unauthorized
```

### Automated Tests

See `server/scripts/test-session-security.sh` for comprehensive session security testing.

## Compliance

### OWASP Top 10 (2021)
- ✅ **A01:2021** - Broken Access Control: Session timeouts prevent unauthorized access
- ✅ **A02:2021** - Cryptographic Failures: Strong SESSION_SECRET, secure cookies
- ✅ **A07:2021** - Identification and Authentication Failures: Secure session management

### CWE Coverage
- ✅ **CWE-287**: Improper Authentication - Secure session validation
- ✅ **CWE-384**: Session Fixation - New session on login
- ✅ **CWE-521**: Weak Password Requirements - Strong SESSION_SECRET
- ✅ **CWE-613**: Insufficient Session Expiration - Dual timeout mechanism

## Incident Response

### If Session Security Breach Suspected

1. **Immediate Actions (< 5 minutes)**
   ```bash
   # Rotate SESSION_SECRET
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   # Update .env with new secret
   # Restart application (invalidates all sessions)
   ```

2. **Investigation (< 1 hour)**
   - Review access logs
   - Identify compromised accounts
   - Check for unauthorized actions
   - Document timeline of events

3. **Communication (< 2 hours)**
   - Notify affected users
   - Force password reset if needed
   - Provide security recommendations

4. **Post-Mortem (< 1 week)**
   - Root cause analysis
   - Update security procedures
   - Implement additional safeguards
   - Training for team

## Deployment Checklist

Before deploying to production:

- [ ] SESSION_SECRET is 128+ characters
- [ ] SESSION_SECRET is unique (not reused from other environments)
- [ ] .env file is not committed to git
- [ ] NODE_ENV=production is set
- [ ] HTTPS is configured and working
- [ ] Session store (PostgreSQL) is accessible
- [ ] Connection pool is optimized
- [ ] Session timeout values are appropriate
- [ ] Monitoring is configured
- [ ] Alert thresholds are set
- [ ] Incident response plan is documented

## References

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Express Session Documentation](https://github.com/expressjs/session)
- [connect-pg-simple Documentation](https://github.com/voxpelli/node-connect-pg-simple)

---

**Last Updated:** 2025-10-07
**Maintained By:** Security Team
**Next Review:** 2025-01-07 (90 days)

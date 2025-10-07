# Environment Variables Documentation

## Overview

This document provides comprehensive documentation for all environment variables used in the Netzwächter monitoring portal. Environment variables are used to store configuration and secrets that should not be committed to version control.

---

## Table of Contents

1. [Required Variables](#required-variables)
2. [Optional Variables](#optional-variables)
3. [Security Best Practices](#security-best-practices)
4. [Setup Instructions](#setup-instructions)
5. [Troubleshooting](#troubleshooting)
6. [Production Checklist](#production-checklist)

---

## Required Variables

### DATABASE_URL

**Description**: PostgreSQL connection string for the main database.

**Format**:
```
postgresql://username:password@host:port/database?sslmode=require
```

**Example**:
```bash
DATABASE_URL=postgresql://postgres:SecurePass123@db.example.com:5432/netzwaechter?sslmode=require
```

**Security Requirements**:
- ✅ **MUST** use `sslmode=require` in production
- ✅ **MUST** use strong database password (12+ characters)
- ✅ **MUST NOT** commit to git
- ⚠️ **AVOID** `sslmode=disable` (unencrypted connections)
- ⚠️ **AVOID** `sslmode=prefer` (allows fallback to unencrypted)

**SSL Mode Options**:
| Mode | Description | Use Case |
|------|-------------|----------|
| `require` | Enforce SSL, fail if unavailable | **Production** (recommended) |
| `prefer` | Use SSL if available, fallback to plain | Development (not recommended) |
| `disable` | Never use SSL | **Never use** (insecure) |
| `verify-ca` | SSL with CA verification | High-security production |
| `verify-full` | SSL with full verification | Maximum security |

**Testing**:
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Verify SSL is enabled
psql $DATABASE_URL -c "SELECT current_setting('ssl');"
```

**Troubleshooting**:
- **Error: "sslmode value 'require' invalid"**: PostgreSQL version too old
- **Error: "could not connect"**: Check host, port, credentials
- **Error: "SSL connection has been closed unexpectedly"**: Check server SSL config

---

### SESSION_SECRET

**Description**: Secret key for signing session cookies. Used by express-session to prevent session tampering.

**Format**: 128-character hexadecimal string (64 bytes of entropy)

**Generate**:
```bash
# macOS / Linux / Windows (Git Bash)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example Output**:
```
a1b2c3d4e5f6...128 characters total...xyz789
```

**Example .env**:
```bash
SESSION_SECRET=a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

**Security Requirements**:
- ✅ **MUST** be at least 128 characters (64 bytes)
- ✅ **MUST** be cryptographically random
- ✅ **MUST** be different for each environment (dev/staging/prod)
- ✅ **MUST** be kept secret (never log, never expose)
- ✅ **MUST NOT** contain the words "secret", "change", "example", etc.

**Rotation Schedule**:
- Development: Change periodically
- Staging: Every 90 days
- Production: Every 90 days or after security incident

**Impact of Changing**:
⚠️ **WARNING**: Changing SESSION_SECRET invalidates all active user sessions. Users will be logged out and must log in again.

**Validation**:
```bash
# Check length
echo -n "$SESSION_SECRET" | wc -c
# Should be 128 or more

# Check strength (should be random hex)
echo "$SESSION_SECRET" | grep -qE '^[0-9a-f]{128,}$' && echo "Valid" || echo "Invalid"
```

**Security Impact**:
If SESSION_SECRET is compromised:
- ❌ Attackers can forge session cookies
- ❌ User sessions can be hijacked
- ❌ Authentication can be bypassed
- ❌ Complete system compromise possible

---

### MAILSERVER_PASSWORD

**Description**: SMTP authentication password for sending emails (password resets, notifications).

**Format**: Strong password (provider-dependent)

**Example**:
```bash
MAILSERVER_PASSWORD="MySecureEmailPass2025!"
```

**Security Requirements**:
- ✅ **MUST** be strong (12+ characters, mixed case, numbers, symbols)
- ✅ **MUST** be stored in environment variable only (not in database)
- ✅ **MUST NOT** be logged or exposed in error messages
- ✅ **SHOULD** be rotated every 180 days

**SMTP Configuration**:
Additional SMTP settings (host, port, username) are stored in the database under `settings.Mailserver_Portal`. Only the password is in the environment for security.

**Default SMTP Settings** (stored in database):
```json
{
  "email": "portal@monitoring.direct",
  "username": "monitoring-direct-0002",
  "smtp_server": "smtps.udag.de",
  "port_ssl": 465,
  "port_starttls": 587,
  "password_env": "MAILSERVER_PASSWORD"
}
```

**Testing**:
```bash
# Test email service (requires server running)
curl -X POST http://localhost:5000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com"}'
```

**Troubleshooting**:
- **Error: "MAILSERVER_PASSWORD not set"**: Add to .env file
- **Error: "Authentication failed"**: Verify password is correct
- **Error: "Connection timeout"**: Check SMTP server is reachable

---

## Optional Variables

### NODE_ENV

**Description**: Application environment mode. Affects security settings, logging, error handling.

**Values**:
- `production` - Production mode (strict security, minimal logging)
- `development` - Development mode (relaxed security, verbose logging)
- `test` - Testing mode (for automated tests)

**Default**: `development`

**Example**:
```bash
NODE_ENV=production
```

**Impact on Security**:
| Feature | Development | Production |
|---------|-------------|------------|
| Database SSL verification | Relaxed | Strict |
| Email SSL verification | Relaxed | Strict |
| Error stack traces | Shown | Hidden |
| Debug logging | Enabled | Disabled |
| Session cookie secure flag | false | true |
| Session cookie sameSite | lax | strict |

**Production Requirements**:
When `NODE_ENV=production`:
- ✅ Database must use SSL (`sslmode=require`)
- ✅ SESSION_SECRET must be strong (128+ chars)
- ✅ Email service uses strict certificate verification
- ✅ Session cookies are HTTPS-only (`secure: true`)
- ✅ CORS is configured restrictively

---

### PORT

**Description**: HTTP server port number.

**Default**: `5000`

**Example**:
```bash
PORT=3000
```

**Valid Range**: 1024-65535 (avoid privileged ports < 1024)

**Common Ports**:
- `3000` - Common development port
- `5000` - Default for this application
- `8080` - Alternative HTTP port
- `443` - HTTPS (requires reverse proxy)

---

### LOCAL_DATABASE_URL

**Description**: Optional local PostgreSQL database connection string for development.

**Use Case**: Fallback database when main `DATABASE_URL` is unavailable or for local development.

**Format**: Same as `DATABASE_URL`

**Example**:
```bash
LOCAL_DATABASE_URL=postgresql://localhost:5432/netzwaechter_dev?sslmode=prefer
```

**Note**: Can use `sslmode=prefer` or `disable` for local development.

---

### MAILSERVER_CA_CERT

**Description**: Optional custom CA certificate for SMTP TLS verification.

**Use Case**: Corporate environments with internal certificate authorities or self-signed certificates.

**Format**: Path to CA certificate file (PEM format)

**Example**:
```bash
MAILSERVER_CA_CERT=/path/to/ca-certificate.pem
```

**When Needed**:
- Corporate SMTP servers with internal CA
- Self-signed certificates (production)
- Custom certificate chains

**Testing**:
```bash
# Verify certificate is valid PEM format
openssl x509 -in /path/to/ca-certificate.pem -text -noout
```

---

## Security Best Practices

### 1. Never Commit Secrets

**Critical Rule**: Never commit `.env` to version control.

**Enforcement**:
```bash
# Add to .gitignore (should already be present)
echo ".env" >> .gitignore

# Verify .env is not tracked
git ls-files --error-unmatch .env
# Should fail (file not tracked)

# If accidentally tracked, remove from git
git rm --cached .env
git commit -m "Remove .env from version control"
```

### 2. Use Strong Secrets

**Password Strength Requirements**:
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- No dictionary words
- No personal information
- No common patterns (123456, password, etc.)

**Secret Generation**:
```bash
# SESSION_SECRET (128 characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Random password (24 characters)
node -e "console.log(require('crypto').randomBytes(18).toString('base64'))"

# Using openssl (alternative)
openssl rand -hex 64  # For SESSION_SECRET
openssl rand -base64 24  # For passwords
```

### 3. Different Secrets Per Environment

**Rule**: Never reuse secrets across environments.

**Example**:
```bash
# Development .env
SESSION_SECRET=dev_secret_abc123...

# Staging .env
SESSION_SECRET=staging_secret_xyz789...

# Production .env
SESSION_SECRET=prod_secret_qwe456...
```

**Why**: If development is compromised, production remains secure.

### 4. Rotate Secrets Regularly

**Rotation Schedule**:
| Secret | Development | Production | After Incident |
|--------|-------------|------------|----------------|
| SESSION_SECRET | Periodically | Every 90 days | Immediately |
| Database Password | Yearly | Every 180 days | Immediately |
| Email Password | Yearly | Every 180 days | Immediately |

**Rotation Procedure**:
1. Generate new secret
2. Update .env file
3. Restart application
4. Verify functionality
5. Invalidate old secret

### 5. Secure File Permissions

**File Permissions**:
```bash
# .env should be readable only by owner
chmod 600 .env

# Verify permissions
ls -l .env
# Should show: -rw------- (600)

# .env.example can be world-readable
chmod 644 .env.example
```

**Ownership**:
```bash
# Ensure correct ownership
chown your-user:your-group .env

# Verify
ls -l .env
```

### 6. Environment-Specific Configuration

**Principle**: Use different configurations for different environments.

**Development .env**:
```bash
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/netzwaechter_dev?sslmode=prefer
SESSION_SECRET=dev_secret_[generated]
MAILSERVER_PASSWORD=dev_password
```

**Production .env**:
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/netzwaechter?sslmode=require
SESSION_SECRET=prod_secret_[generated_128_chars]
MAILSERVER_PASSWORD=strong_prod_password
```

### 7. Audit Regularly

**Monthly Audit**:
```bash
# Run security audit
./server/scripts/audit-env.sh

# Check for weak values
# Check file permissions
# Verify SSL modes
# Review git history
```

---

## Setup Instructions

### Initial Setup

**Step 1: Copy template**
```bash
cp .env.example .env
```

**Step 2: Generate SESSION_SECRET**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Step 3: Edit .env**
```bash
# Open .env in editor
nano .env

# Or use vi/vim
vim .env

# Or use VS Code
code .env
```

**Step 4: Update values**
- Replace `DATABASE_URL` with real connection string
- Replace `SESSION_SECRET` with generated secret
- Replace `MAILSERVER_PASSWORD` with real password
- Set `NODE_ENV` appropriately

**Step 5: Set permissions**
```bash
chmod 600 .env
```

**Step 6: Verify configuration**
```bash
./server/scripts/audit-env.sh
```

**Step 7: Test application**
```bash
npm run dev
```

### Environment-Specific Setup

**Development**:
```bash
# Create development .env
cat > .env << EOF
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/netzwaechter_dev?sslmode=prefer
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
MAILSERVER_PASSWORD=dev_password
PORT=5000
EOF

chmod 600 .env
```

**Production**:
```bash
# Create production .env (manually, never scripted)
# Use strong, unique secrets
# Enable all security features
# Use SSL for all connections
```

---

## Troubleshooting

### Issue: "Environment variable not set"

**Symptoms**:
```
Error: DATABASE_URL environment variable not set
```

**Solution**:
```bash
# Check .env exists
ls -la .env

# Check variable is in .env
grep DATABASE_URL .env

# Verify .env is loaded
source .env
echo $DATABASE_URL

# Restart application
npm run dev
```

---

### Issue: "Weak SESSION_SECRET"

**Symptoms**:
```
Warning: SESSION_SECRET is too short or weak
```

**Solution**:
```bash
# Generate new strong secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update .env
# Replace SESSION_SECRET= line with generated value

# Verify length
echo -n "$SESSION_SECRET" | wc -c
# Should be 128+

# Restart application
npm run dev
```

---

### Issue: "SSL connection error"

**Symptoms**:
```
Error: SSL connection to database failed
```

**Solutions**:

**Option 1: Enable SSL on database**
```bash
# Check if database supports SSL
psql $DATABASE_URL -c "SHOW ssl;"
# Should return: on

# If off, enable SSL on database server
```

**Option 2: Use correct SSL mode**
```bash
# For production (strict)
DATABASE_URL=postgresql://...?sslmode=require

# For development (relaxed)
DATABASE_URL=postgresql://...?sslmode=prefer

# For local dev (no SSL)
DATABASE_URL=postgresql://...?sslmode=disable
```

**Option 3: Custom CA certificate**
```bash
# If using self-signed certificate
# Add CA certificate path
DB_SSL_CERT=/path/to/ca-cert.pem

# Update connection code to use custom CA
```

---

### Issue: "Session not persisting"

**Symptoms**: Users logged out immediately, sessions not saved

**Causes & Solutions**:

**1. SESSION_SECRET changed**
```bash
# Check if SESSION_SECRET is consistent
# Don't change during testing

# If changed, all users must re-login
```

**2. SESSION_SECRET too short**
```bash
# Verify length
echo -n "$SESSION_SECRET" | wc -c
# Must be 128+

# Generate new if too short
```

**3. Cookie configuration**
```bash
# Check NODE_ENV
echo $NODE_ENV

# Development: secure=false (allows HTTP)
# Production: secure=true (requires HTTPS)

# If using HTTP in production, set NODE_ENV=development
# (Not recommended, use HTTPS in production)
```

---

## Production Checklist

### Pre-Deployment

- [ ] **Strong Secrets**
  - [ ] SESSION_SECRET is 128+ characters
  - [ ] SESSION_SECRET is cryptographically random
  - [ ] Database password is strong (12+ characters)
  - [ ] Email password is strong (12+ characters)

- [ ] **SSL/TLS Enabled**
  - [ ] DATABASE_URL uses `sslmode=require`
  - [ ] No `sslmode=disable` in production
  - [ ] Email service uses TLS 1.2+

- [ ] **Environment Configuration**
  - [ ] NODE_ENV=production
  - [ ] All required variables set
  - [ ] No placeholder values
  - [ ] No weak/default passwords

- [ ] **File Security**
  - [ ] .env has 600 permissions
  - [ ] .env is in .gitignore
  - [ ] .env is not in git history
  - [ ] .env.example has no real secrets

- [ ] **Audit Passed**
  - [ ] `./server/scripts/audit-env.sh` passes
  - [ ] No critical issues
  - [ ] No warnings (or documented)

### Post-Deployment

- [ ] **Verify Functionality**
  - [ ] Application starts successfully
  - [ ] Database connection works
  - [ ] User login works
  - [ ] Sessions persist correctly
  - [ ] Email sending works

- [ ] **Security Verification**
  - [ ] HTTPS enabled
  - [ ] SSL connections verified
  - [ ] No secrets in logs
  - [ ] Error handling secure (no stack traces)

### Regular Maintenance

**Weekly**:
- Monitor logs for configuration errors
- Check application health

**Monthly**:
- Run security audit: `./server/scripts/audit-env.sh`
- Review access logs

**Quarterly (Every 90 days)**:
- Rotate SESSION_SECRET
- Review and update all secrets
- Security audit

**Bi-Annually (Every 180 days)**:
- Rotate database password
- Rotate email password
- Full security review

---

## References

- [12-Factor App: Config](https://12factor.net/config)
- [OWASP: Configuration Management](https://cheatsheetseries.owasp.org/cheatsheets/Configuration_Management_Cheat_Sheet.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## Appendix: Quick Reference

### Essential Commands

```bash
# Create .env from template
cp .env.example .env

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Set file permissions
chmod 600 .env

# Run security audit
./server/scripts/audit-env.sh

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check environment variables
grep -E "^[A-Z_]+=" .env | cut -d'=' -f1

# Verify .env not in git
git ls-files --error-unmatch .env

# Remove .env from git (if accidentally committed)
git rm --cached .env
```

### Environment Variable Checklist

```bash
# Required
✓ DATABASE_URL (with sslmode=require)
✓ SESSION_SECRET (128+ characters)
✓ MAILSERVER_PASSWORD

# Optional but Recommended
○ NODE_ENV (production/development)
○ PORT (default: 5000)

# Optional
○ LOCAL_DATABASE_URL (fallback)
○ MAILSERVER_CA_CERT (custom CA)
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-07
**Maintainer**: Security Team
**Review Cycle**: Quarterly

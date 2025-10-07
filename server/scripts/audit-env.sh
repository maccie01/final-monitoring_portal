#!/bin/bash

# ========================================
# Environment Variables Security Audit
# ========================================
# Audits .env configuration for security
# issues and best practices compliance
# ========================================

set -e

echo "🔍 Environment Variables Security Audit"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0
CRITICAL=0

# ========================================
# 1. File Existence and Permissions
# ========================================

echo "1. File Existence and Permissions"
echo "-----------------------------------"

# Check .env exists
if [ ! -f .env ]; then
  echo -e "${RED}❌ CRITICAL${NC}: .env file not found"
  echo "   Create .env from .env.example template"
  ((CRITICAL++))
  exit 1
else
  echo -e "${GREEN}✓${NC} .env file exists"
  ((PASSED++))
fi

# Check .env permissions
PERMS=$(stat -f "%A" .env 2>/dev/null || stat -c "%a" .env 2>/dev/null)
if [ "$PERMS" = "600" ]; then
  echo -e "${GREEN}✓${NC} .env has secure permissions (600)"
  ((PASSED++))
elif [ "$PERMS" = "400" ]; then
  echo -e "${GREEN}✓${NC} .env has secure permissions (400 - read only)"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠️  WARNING${NC}: .env has permissions $PERMS"
  echo "   Recommended: chmod 600 .env (owner read/write only)"
  ((WARNINGS++))
fi

# Check .env is in .gitignore
if grep -q "^\.env$" .gitignore 2>/dev/null; then
  echo -e "${GREEN}✓${NC} .env is in .gitignore"
  ((PASSED++))
else
  echo -e "${RED}❌ CRITICAL${NC}: .env not in .gitignore"
  echo "   Add .env to .gitignore immediately to prevent credential exposure"
  ((CRITICAL++))
fi

# Check .env.example exists
if [ -f .env.example ]; then
  echo -e "${GREEN}✓${NC} .env.example exists"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠️  WARNING${NC}: .env.example not found"
  echo "   Create .env.example as template for other developers"
  ((WARNINGS++))
fi

echo ""

# ========================================
# 2. Required Variables
# ========================================

echo "2. Required Variables"
echo "---------------------"

# Load .env
set -a
source .env 2>/dev/null || true
set +a

# Check DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
  echo -e "${GREEN}✓${NC} DATABASE_URL is set"
  ((PASSED++))

  # Check SSL mode
  if echo "$DATABASE_URL" | grep -q "sslmode=require"; then
    echo -e "${GREEN}✓${NC} DATABASE_URL uses SSL (sslmode=require)"
    ((PASSED++))
  elif echo "$DATABASE_URL" | grep -q "sslmode=disable"; then
    echo -e "${RED}❌ CRITICAL${NC}: DATABASE_URL has SSL disabled (sslmode=disable)"
    echo "   Change to sslmode=require for encrypted connections"
    ((CRITICAL++))
  elif echo "$DATABASE_URL" | grep -q "sslmode=prefer"; then
    echo -e "${YELLOW}⚠️  WARNING${NC}: DATABASE_URL uses sslmode=prefer"
    echo "   Recommended: sslmode=require for production"
    ((WARNINGS++))
  else
    echo -e "${YELLOW}⚠️  WARNING${NC}: DATABASE_URL has no SSL mode specified"
    echo "   Add ?sslmode=require to connection string"
    ((WARNINGS++))
  fi

  # Check for password in URL (should be obfuscated in production)
  if echo "$DATABASE_URL" | grep -qE ":[^:@]+@"; then
    echo -e "${BLUE}ℹ${NC}  Database password is in connection string"
  fi
else
  echo -e "${RED}❌ CRITICAL${NC}: DATABASE_URL not set"
  ((CRITICAL++))
fi

# Check SESSION_SECRET
if [ -n "$SESSION_SECRET" ]; then
  echo -e "${GREEN}✓${NC} SESSION_SECRET is set"
  ((PASSED++))

  SECRET_LENGTH=${#SESSION_SECRET}

  if [ "$SECRET_LENGTH" -ge 128 ]; then
    echo -e "${GREEN}✓${NC} SESSION_SECRET is strong ($SECRET_LENGTH characters)"
    ((PASSED++))
  elif [ "$SECRET_LENGTH" -ge 64 ]; then
    echo -e "${YELLOW}⚠️  WARNING${NC}: SESSION_SECRET is $SECRET_LENGTH characters"
    echo "   Recommended: 128+ characters for production"
    ((WARNINGS++))
  else
    echo -e "${RED}❌ CRITICAL${NC}: SESSION_SECRET is too short ($SECRET_LENGTH chars)"
    echo "   Generate new secret: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    ((CRITICAL++))
  fi

  # Check for placeholder values
  if echo "$SESSION_SECRET" | grep -qiE "secret|change|example|placeholder|your-|generate"; then
    echo -e "${RED}❌ CRITICAL${NC}: SESSION_SECRET appears to be a placeholder"
    echo "   Generate real secret: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    ((CRITICAL++))
  fi
else
  echo -e "${RED}❌ CRITICAL${NC}: SESSION_SECRET not set"
  ((CRITICAL++))
fi

# Check MAILSERVER_PASSWORD
if [ -n "$MAILSERVER_PASSWORD" ]; then
  echo -e "${GREEN}✓${NC} MAILSERVER_PASSWORD is set"
  ((PASSED++))

  PASSWORD_LENGTH=${#MAILSERVER_PASSWORD}

  if [ "$PASSWORD_LENGTH" -ge 12 ]; then
    echo -e "${GREEN}✓${NC} MAILSERVER_PASSWORD is adequate ($PASSWORD_LENGTH characters)"
    ((PASSED++))
  elif [ "$PASSWORD_LENGTH" -ge 8 ]; then
    echo -e "${YELLOW}⚠️  WARNING${NC}: MAILSERVER_PASSWORD is short ($PASSWORD_LENGTH chars)"
    echo "   Consider using a stronger password (12+ characters)"
    ((WARNINGS++))
  else
    echo -e "${RED}❌ FAIL${NC}: MAILSERVER_PASSWORD is too short ($PASSWORD_LENGTH chars)"
    echo "   Use a password with at least 8 characters"
    ((FAILED++))
  fi
else
  echo -e "${YELLOW}⚠️  WARNING${NC}: MAILSERVER_PASSWORD not set"
  echo "   Email functionality will not work"
  ((WARNINGS++))
fi

echo ""

# ========================================
# 3. Optional but Recommended Variables
# ========================================

echo "3. Optional Variables"
echo "---------------------"

# Check NODE_ENV
if [ -n "$NODE_ENV" ]; then
  echo -e "${GREEN}✓${NC} NODE_ENV is set to: $NODE_ENV"
  ((PASSED++))

  if [ "$NODE_ENV" = "production" ]; then
    echo -e "${BLUE}ℹ${NC}  Production mode: strict security enabled"
  elif [ "$NODE_ENV" = "development" ]; then
    echo -e "${BLUE}ℹ${NC}  Development mode: relaxed security for local testing"
  else
    echo -e "${YELLOW}⚠️  WARNING${NC}: Unusual NODE_ENV value: $NODE_ENV"
    echo "   Expected: 'production' or 'development'"
    ((WARNINGS++))
  fi
else
  echo -e "${YELLOW}⚠️  WARNING${NC}: NODE_ENV not set (defaults to development)"
  ((WARNINGS++))
fi

# Check PORT
if [ -n "$PORT" ]; then
  echo -e "${GREEN}✓${NC} PORT is set to: $PORT"
  ((PASSED++))
else
  echo -e "${BLUE}ℹ${NC}  PORT not set (will use default: 5000)"
fi

# Check for LOCAL_DATABASE_URL (fallback)
if [ -n "$LOCAL_DATABASE_URL" ]; then
  echo -e "${BLUE}ℹ${NC}  LOCAL_DATABASE_URL is set (fallback database)"
fi

echo ""

# ========================================
# 4. Security Best Practices
# ========================================

echo "4. Security Best Practices"
echo "---------------------------"

# Check for common weak/placeholder values
echo "Checking for placeholder/weak values..."

WEAK_PATTERNS=(
  "password=password"
  "password=123"
  "secret=secret"
  "change-me"
  "replaceme"
  "example"
  "test123"
  "admin123"
)

for pattern in "${WEAK_PATTERNS[@]}"; do
  if grep -qi "$pattern" .env 2>/dev/null; then
    echo -e "${RED}❌ CRITICAL${NC}: Weak/placeholder value found: $pattern"
    ((CRITICAL++))
  fi
done

if [ $CRITICAL -eq 0 ]; then
  echo -e "${GREEN}✓${NC} No obvious weak/placeholder values found"
  ((PASSED++))
fi

# Check for URLs with http:// (should be https://)
if grep -qi "http://" .env 2>/dev/null && ! grep -q "localhost" .env; then
  echo -e "${YELLOW}⚠️  WARNING${NC}: HTTP URL found (should use HTTPS for production)"
  ((WARNINGS++))
fi

# Check .env.example doesn't contain real secrets
if [ -f .env.example ]; then
  echo ""
  echo "Checking .env.example for real secrets..."

  if grep -qE "[A-Za-z0-9]{32,}" .env.example 2>/dev/null; then
    echo -e "${YELLOW}⚠️  WARNING${NC}: .env.example may contain real values"
    echo "   Verify it only has placeholders"
    ((WARNINGS++))
  else
    echo -e "${GREEN}✓${NC} .env.example appears to have placeholders only"
    ((PASSED++))
  fi
fi

echo ""

# ========================================
# 5. Git Security
# ========================================

echo "5. Git Security"
echo "---------------"

# Check if .env is tracked in git
if git ls-files --error-unmatch .env 2>/dev/null; then
  echo -e "${RED}❌ CRITICAL${NC}: .env is tracked in git"
  echo "   Remove with: git rm --cached .env"
  echo "   Ensure .env is in .gitignore"
  ((CRITICAL++))
else
  echo -e "${GREEN}✓${NC} .env is not tracked in git"
  ((PASSED++))
fi

# Check git history for .env
if git log --all --full-history --source --pretty=format: --name-only --follow -- .env 2>/dev/null | grep -q ".env"; then
  echo -e "${RED}⚠️  ALERT${NC}: .env found in git history"
  echo "   Secrets may have been exposed in previous commits"
  echo "   Consider: git filter-branch to remove from history"
  ((WARNINGS++))
else
  echo -e "${GREEN}✓${NC} .env not found in git history"
  ((PASSED++))
fi

echo ""

# ========================================
# 6. Environment Variable List
# ========================================

echo "6. Environment Variables Found"
echo "-------------------------------"

echo "Variables in .env:"
grep -E "^[A-Z_]+=" .env 2>/dev/null | cut -d'=' -f1 | sort | while read -r var; do
  echo "  - $var"
done

echo ""

# ========================================
# Summary
# ========================================

echo "=============================="
echo "Audit Summary"
echo "=============================="
echo -e "Passed:   ${GREEN}$PASSED${NC}"
echo -e "Failed:   ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo -e "Critical: ${RED}$CRITICAL${NC}"
echo ""

if [ $CRITICAL -gt 0 ]; then
  echo -e "${RED}❌ CRITICAL ISSUES FOUND${NC}"
  echo "Fix critical issues immediately before deployment"
  exit 2
elif [ $FAILED -gt 0 ]; then
  echo -e "${RED}❌ FAILED CHECKS${NC}"
  echo "Fix failures before deploying to production"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  WARNINGS FOUND${NC}"
  echo "Review warnings and consider fixing before production"
  exit 0
else
  echo -e "${GREEN}✅ All checks passed${NC}"
  echo "Environment configuration looks secure"
  exit 0
fi

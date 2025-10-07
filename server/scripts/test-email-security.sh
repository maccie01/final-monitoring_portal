#!/bin/bash

# ========================================
# Email Security Test Script
# ========================================
# Tests SMTP connection, TLS encryption,
# and security configuration
# ========================================

set -e

echo "📧 Email Service Security Test"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

# Test function
test_check() {
  local name=$1
  local command=$2
  local expected=$3

  echo -n "Testing: $name... "

  if eval "$command"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
    if [ -n "$expected" ]; then
      echo "  Expected: $expected"
    fi
  fi
}

test_warning() {
  local name=$1
  local message=$2

  echo -e "${YELLOW}⚠️  WARNING${NC}: $name"
  echo "  $message"
  ((WARNINGS++))
}

# ========================================
# 1. Environment Variable Checks
# ========================================

echo "1. Environment Variables"
echo "------------------------"

# Check MAILSERVER_PASSWORD exists
test_check "MAILSERVER_PASSWORD is set" \
  "[ -n \"\$MAILSERVER_PASSWORD\" ]" \
  "Environment variable should be set in .env"

# Check password strength (minimum 8 characters)
if [ -n "$MAILSERVER_PASSWORD" ]; then
  PASSWORD_LENGTH=${#MAILSERVER_PASSWORD}
  test_check "MAILSERVER_PASSWORD length >= 8" \
    "[ $PASSWORD_LENGTH -ge 8 ]" \
    "Password should be at least 8 characters"

  if [ $PASSWORD_LENGTH -lt 12 ]; then
    test_warning "Weak password" \
      "Password is only $PASSWORD_LENGTH characters. Recommended: 12+ characters"
  fi
fi

# Check NODE_ENV
if [ "$NODE_ENV" = "production" ]; then
  echo -e "${GREEN}✓${NC} NODE_ENV=production (certificate verification enabled)"
elif [ "$NODE_ENV" = "development" ]; then
  echo -e "${YELLOW}⚠️${NC}  NODE_ENV=development (certificate verification relaxed)"
else
  echo -e "${YELLOW}⚠️${NC}  NODE_ENV not set (defaults to development)"
fi

echo ""

# ========================================
# 2. SMTP Server Connectivity
# ========================================

echo "2. SMTP Server Connectivity"
echo "----------------------------"

# Get SMTP server from database or use default
SMTP_SERVER="smtps.udag.de"

# Test port 587 (STARTTLS)
test_check "Port 587 reachable (STARTTLS)" \
  "timeout 5 bash -c 'cat < /dev/null > /dev/tcp/$SMTP_SERVER/587' 2>/dev/null" \
  "STARTTLS port should be open"

# Test port 465 (SSL/TLS)
test_check "Port 465 reachable (SSL/TLS)" \
  "timeout 5 bash -c 'cat < /dev/null > /dev/tcp/$SMTP_SERVER/465' 2>/dev/null" \
  "SSL/TLS port should be open"

echo ""

# ========================================
# 3. TLS Configuration
# ========================================

echo "3. TLS/SSL Security"
echo "-------------------"

# Check if openssl is available
if command -v openssl &> /dev/null; then

  # Test STARTTLS (port 587)
  echo -n "Testing TLS on port 587... "
  TLS_OUTPUT=$(echo | openssl s_client -connect $SMTP_SERVER:587 -starttls smtp 2>/dev/null)

  if echo "$TLS_OUTPUT" | grep -q "Protocol.*TLS"; then
    TLS_VERSION=$(echo "$TLS_OUTPUT" | grep "Protocol" | awk '{print $3}')
    echo -e "${GREEN}✓ Connected with $TLS_VERSION${NC}"
    ((PASSED++))

    # Check TLS version is 1.2 or higher
    if echo "$TLS_VERSION" | grep -qE "TLSv1\.[2-3]"; then
      echo -e "${GREEN}✓${NC} TLS version is secure (1.2+)"
      ((PASSED++))
    else
      echo -e "${RED}✗${NC} TLS version is outdated: $TLS_VERSION"
      ((FAILED++))
    fi

    # Check cipher suite
    CIPHER=$(echo "$TLS_OUTPUT" | grep "Cipher" | head -1 | awk '{print $3}')
    echo "  Cipher: $CIPHER"

  else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
  fi

  # Test SSL/TLS (port 465)
  echo -n "Testing SSL on port 465... "
  SSL_OUTPUT=$(echo | openssl s_client -connect $SMTP_SERVER:465 2>/dev/null)

  if echo "$SSL_OUTPUT" | grep -q "Protocol.*TLS"; then
    SSL_VERSION=$(echo "$SSL_OUTPUT" | grep "Protocol" | awk '{print $3}')
    echo -e "${GREEN}✓ Connected with $SSL_VERSION${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
  fi

  # Check certificate validity
  echo -n "Testing certificate validity... "
  CERT_CHECK=$(echo | openssl s_client -connect $SMTP_SERVER:587 -starttls smtp 2>/dev/null | openssl x509 -noout -checkend 0 2>/dev/null)

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Certificate is valid${NC}"
    ((PASSED++))

    # Show certificate expiry
    CERT_EXPIRY=$(echo | openssl s_client -connect $SMTP_SERVER:587 -starttls smtp 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    echo "  Expires: $CERT_EXPIRY"
  else
    echo -e "${RED}✗ Certificate is invalid or expired${NC}"
    ((FAILED++))
  fi

else
  test_warning "OpenSSL not available" \
    "Cannot test TLS configuration. Install openssl to enable TLS tests."
fi

echo ""

# ========================================
# 4. Application Configuration
# ========================================

echo "4. Application Configuration"
echo "-----------------------------"

# Check if email service file exists
test_check "email-service.ts exists" \
  "[ -f server/email-service.ts ]" \
  "Email service file should exist"

# Check for secure TLS configuration in code
if [ -f server/email-service.ts ]; then

  test_check "TLS minVersion configured" \
    "grep -q \"minVersion.*TLSv1.2\" server/email-service.ts" \
    "Code should enforce TLS 1.2+"

  test_check "Certificate verification environment-aware" \
    "grep -q \"rejectUnauthorized.*NODE_ENV\" server/email-service.ts" \
    "Certificate verification should be stricter in production"

  # Check password is from environment
  test_check "Password from environment variable" \
    "grep -q \"process.env.MAILSERVER_PASSWORD\" server/email-service.ts" \
    "Password should come from environment, not hardcoded"

  # Check password is not logged (actual password, not just length)
  if grep -qE "console\.log.*password['\"]?\s*\)" server/email-service.ts && ! grep -q "password.length" server/email-service.ts; then
    test_warning "Password logging detected" \
      "Code may be logging password. Review console.log statements."
  else
    echo -e "${GREEN}✓${NC} Password not directly logged (length only is safe)"
    ((PASSED++))
  fi
fi

echo ""

# ========================================
# 5. Security Best Practices
# ========================================

echo "5. Security Best Practices"
echo "--------------------------"

# Check .env is not in git
test_check ".env in .gitignore" \
  "grep -q \"^\.env$\" .gitignore" \
  ".env should be in .gitignore to prevent credential exposure"

# Check .env.example exists
test_check ".env.example exists" \
  "[ -f .env.example ]" \
  "Should have .env.example as template"

# Check .env.example doesn't contain real secrets
if [ -f .env.example ]; then
  if grep -qE "password=.{10,}" .env.example; then
    echo -e "${RED}✗${NC} Real passwords found in .env.example"
    ((FAILED++))
  else
    echo -e "${GREEN}✓${NC} .env.example has placeholders only"
    ((PASSED++))
  fi
fi

# Check .env file permissions
if [ -f .env ]; then
  PERMS=$(stat -f "%A" .env 2>/dev/null || stat -c "%a" .env 2>/dev/null)
  if [ "$PERMS" = "600" ]; then
    echo -e "${GREEN}✓${NC} .env has secure permissions (600)"
    ((PASSED++))
  else
    test_warning "Insecure .env permissions" \
      ".env has permissions $PERMS. Recommended: 600 (chmod 600 .env)"
  fi
fi

# Check documentation exists
test_check "EMAIL_SECURITY.md exists" \
  "[ -f server/EMAIL_SECURITY.md ]" \
  "Email security documentation should exist"

echo ""

# ========================================
# 6. Database Configuration
# ========================================

echo "6. Database Configuration"
echo "-------------------------"

# Only test if database is available
if [ -n "$DATABASE_URL" ]; then
  echo "Database connection available, checking email config..."

  # Note: This would require psql or a Node script to query the database
  # Skipping for now as it requires database access
  echo "  (Database checks require running application)"
else
  test_warning "Database not available" \
    "Cannot test database configuration. Set DATABASE_URL to enable."
fi

echo ""

# ========================================
# Summary
# ========================================

echo "=============================="
echo "Test Summary"
echo "=============================="
echo -e "Passed:   ${GREEN}$PASSED${NC}"
echo -e "Failed:   ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All critical tests passed${NC}"
  if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Review $WARNINGS warning(s) above${NC}"
  fi
  exit 0
else
  echo -e "${RED}❌ $FAILED test(s) failed${NC}"
  echo "Review failures above and fix issues before deployment"
  exit 1
fi

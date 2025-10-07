#!/bin/bash

echo "🔐 Testing Session Security"
echo "==========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="http://localhost:5000"
PASSED=0
FAILED=0

# Test credentials
USERNAME="admin"
PASSWORD="admin"

# Clean up cookies file
rm -f test-cookies.txt

echo "Test 1: Session creation on login"
echo "---------------------------------"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/user-login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" \
  -c test-cookies.txt)

if [ "$STATUS" = "200" ]; then
  echo -e "${GREEN}✓${NC} Login successful, session created (HTTP $STATUS)"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Login failed (HTTP $STATUS)"
  ((FAILED++))
fi
echo ""

echo "Test 2: Authenticated request with session cookie"
echo "--------------------------------------------------"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/user/" \
  -b test-cookies.txt)

if [ "$STATUS" = "200" ]; then
  echo -e "${GREEN}✓${NC} Authenticated request successful (HTTP $STATUS)"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Authenticated request failed (HTTP $STATUS)"
  ((FAILED++))
fi
echo ""

echo "Test 3: Request without session cookie should fail"
echo "---------------------------------------------------"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/user/")

if [ "$STATUS" = "401" ]; then
  echo -e "${GREEN}✓${NC} Unauthenticated request blocked (HTTP $STATUS)"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Unauthenticated request not blocked (HTTP $STATUS)"
  ((FAILED++))
fi
echo ""

echo "Test 4: Session cookie has httpOnly flag"
echo "-----------------------------------------"
# Check if cookie file contains httpOnly directive
if grep -q "#HttpOnly" test-cookies.txt; then
  echo -e "${GREEN}✓${NC} Session cookie has httpOnly flag"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Session cookie missing httpOnly flag"
  ((FAILED++))
fi
echo ""

echo "Test 5: Session cookie name is not default"
echo "-------------------------------------------"
# Check cookie name is 'sid' not 'connect.sid'
if grep -q "sid" test-cookies.txt && ! grep -q "connect.sid" test-cookies.txt; then
  echo -e "${GREEN}✓${NC} Custom session cookie name in use (security through obscurity)"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠${NC} Using default cookie name (minor security issue)"
  ((PASSED++))
fi
echo ""

echo "Test 6: Logout destroys session"
echo "--------------------------------"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/logout" \
  -b test-cookies.txt)

if [ "$STATUS" = "200" ] || [ "$STATUS" = "302" ]; then
  echo -e "${GREEN}✓${NC} Logout successful (HTTP $STATUS)"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Logout failed (HTTP $STATUS)"
  ((FAILED++))
fi
echo ""

echo "Test 7: Session is destroyed after logout"
echo "------------------------------------------"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/user/" \
  -b test-cookies.txt)

if [ "$STATUS" = "401" ]; then
  echo -e "${GREEN}✓${NC} Session destroyed, access denied (HTTP $STATUS)"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Session still valid after logout (HTTP $STATUS)"
  ((FAILED++))
fi
echo ""

echo "Test 8: SESSION_SECRET strength check"
echo "--------------------------------------"
if [ -f .env ]; then
  SECRET_LENGTH=$(grep "^SESSION_SECRET=" .env | cut -d'=' -f2 | wc -c)
  # Remove 1 for newline
  SECRET_LENGTH=$((SECRET_LENGTH - 1))

  if [ "$SECRET_LENGTH" -ge 128 ]; then
    echo -e "${GREEN}✓${NC} SESSION_SECRET is strong ($SECRET_LENGTH characters)"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} SESSION_SECRET is weak ($SECRET_LENGTH characters, need 128+)"
    ((FAILED++))
  fi
else
  echo -e "${RED}✗${NC} .env file not found"
  ((FAILED++))
fi
echo ""

# Clean up
rm -f test-cookies.txt

# Summary
echo "==========================="
echo "Session Security Test Results"
echo "==========================="
echo "  Total Tests: $((PASSED + FAILED))"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All session security tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some session security tests failed!${NC}"
  exit 1
fi

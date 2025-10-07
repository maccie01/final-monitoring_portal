#!/bin/bash

echo "🔐 Verifying API Endpoint Protection"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for results
PROTECTED=0
UNPROTECTED=0
TOTAL=0

# Base URL
BASE_URL="http://localhost:5000"

# Test endpoints without authentication (should return 401)
echo "Testing unauthenticated access (expecting 401 Unauthorized):"
echo "-------------------------------------------------------------"

# Define test endpoints
declare -a ENDPOINTS=(
  "GET /api/db/status"
  "GET /api/db/objects"
  "GET /api/db/mandants"
  "GET /api/db/settings"
  "GET /api/objects"
  "GET /api/energy-data"
  "GET /api/efficiency-analysis/1"
  "GET /api/temperature-analysis"
  "GET /api/yearly-summary/1"
  "GET /api/user/profiles/list"
  "GET /api/user/"
  "GET /api/portal/config"
  "GET /api/portal/active-config"
)

for endpoint in "${ENDPOINTS[@]}"; do
  METHOD=$(echo "$endpoint" | cut -d' ' -f1)
  PATH=$(echo "$endpoint" | cut -d' ' -f2)

  ((TOTAL++))

  # Make request without auth
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X "$METHOD" "$BASE_URL$PATH")

  if [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ]; then
    echo -e "${GREEN}✓${NC} $endpoint - Protected (HTTP $STATUS)"
    ((PROTECTED++))
  else
    echo -e "${RED}✗${NC} $endpoint - NOT PROTECTED (HTTP $STATUS)"
    ((UNPROTECTED++))
  fi
done

echo ""
echo "===================================="
echo "Results:"
echo "  Total endpoints tested: $TOTAL"
echo -e "  ${GREEN}Protected: $PROTECTED${NC}"
echo -e "  ${RED}Unprotected: $UNPROTECTED${NC}"
echo ""

if [ $UNPROTECTED -eq 0 ]; then
  echo -e "${GREEN}✅ All endpoints are properly protected!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some endpoints are not protected!${NC}"
  exit 1
fi

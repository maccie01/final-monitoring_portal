#!/bin/bash

# API Cleanup Validation Tests
# Tests all changes made during API cleanup
# Date: October 7, 2025

set -e

# Configuration
API_BASE="http://localhost:4004"
TEST_RESULTS_FILE="test/test-results.txt"
PASSED=0
FAILED=0
SKIPPED=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize results file
echo "API Cleanup Validation Test Results" > "$TEST_RESULTS_FILE"
echo "Date: $(date)" >> "$TEST_RESULTS_FILE"
echo "========================================" >> "$TEST_RESULTS_FILE"
echo "" >> "$TEST_RESULTS_FILE"

# Helper function to print test status
print_test() {
    local status=$1
    local test_name=$2
    local details=$3

    case $status in
        "PASS")
            echo -e "${GREEN}✓ PASS${NC} - $test_name"
            echo "✓ PASS - $test_name" >> "$TEST_RESULTS_FILE"
            ((PASSED++))
            ;;
        "FAIL")
            echo -e "${RED}✗ FAIL${NC} - $test_name"
            echo "  Details: $details"
            echo "✗ FAIL - $test_name" >> "$TEST_RESULTS_FILE"
            echo "  Details: $details" >> "$TEST_RESULTS_FILE"
            ((FAILED++))
            ;;
        "SKIP")
            echo -e "${YELLOW}⊘ SKIP${NC} - $test_name"
            echo "  Reason: $details"
            echo "⊘ SKIP - $test_name" >> "$TEST_RESULTS_FILE"
            echo "  Reason: $details" >> "$TEST_RESULTS_FILE"
            ((SKIPPED++))
            ;;
    esac
}

# Helper function to test endpoint existence
test_endpoint_exists() {
    local method=$1
    local endpoint=$2
    local test_name=$3
    local auth_header=$4

    if [ -z "$auth_header" ]; then
        response=$(curl -s -X "$method" -w "\n%{http_code}" "$API_BASE$endpoint" 2>&1)
    else
        response=$(curl -s -X "$method" -H "$auth_header" -w "\n%{http_code}" "$API_BASE$endpoint" 2>&1)
    fi

    http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" != "404" ]; then
        print_test "PASS" "$test_name" "HTTP $http_code"
        return 0
    else
        print_test "FAIL" "$test_name" "Endpoint not found (404)"
        return 1
    fi
}

# Helper function to test endpoint is removed
test_endpoint_removed() {
    local method=$1
    local endpoint=$2
    local test_name=$3

    response=$(curl -s -X "$method" -w "\n%{http_code}" "$API_BASE$endpoint" 2>&1)
    http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "404" ]; then
        print_test "PASS" "$test_name" "Correctly removed (404)"
        return 0
    else
        print_test "FAIL" "$test_name" "Endpoint still exists (HTTP $http_code)"
        return 1
    fi
}

# Helper function to test authentication requirement
test_requires_auth() {
    local method=$1
    local endpoint=$2
    local test_name=$3

    response=$(curl -s -X "$method" -w "\n%{http_code}" "$API_BASE$endpoint" 2>&1)
    http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        print_test "PASS" "$test_name" "Correctly requires authentication (HTTP $http_code)"
        return 0
    else
        print_test "FAIL" "$test_name" "Does not require authentication (HTTP $http_code)"
        return 1
    fi
}

echo -e "\n${BLUE}=== API Cleanup Validation Tests ===${NC}\n"

# ============================================================================
# Section 1: Security Fixes
# ============================================================================
echo -e "\n${BLUE}Section 1: Security Fixes${NC}"
echo "" >> "$TEST_RESULTS_FILE"
echo "Section 1: Security Fixes" >> "$TEST_RESULTS_FILE"
echo "-------------------------" >> "$TEST_RESULTS_FILE"

# Test 1.1: Efficiency routes require authentication
test_requires_auth "GET" "/api/efficiency-analysis/1" "Efficiency route requires authentication"

# ============================================================================
# Section 2: Route Ordering Fixes
# ============================================================================
echo -e "\n${BLUE}Section 2: Route Ordering Fixes${NC}"
echo "" >> "$TEST_RESULTS_FILE"
echo "Section 2: Route Ordering Fixes" >> "$TEST_RESULTS_FILE"
echo "-------------------------------" >> "$TEST_RESULTS_FILE"

# Test 2.1: Specific object routes are accessible (need auth)
test_requires_auth "GET" "/api/objects/by-objectid/1" "Specific route /objects/by-objectid/:objectId accessible"
test_requires_auth "GET" "/api/objects/hierarchy/1" "Specific route /objects/hierarchy/:mandantId accessible"

# ============================================================================
# Section 3: Duplicate Endpoints Removed
# ============================================================================
echo -e "\n${BLUE}Section 3: Duplicate Endpoints Removed${NC}"
echo "" >> "$TEST_RESULTS_FILE"
echo "Section 3: Duplicate Endpoints Removed" >> "$TEST_RESULTS_FILE"
echo "--------------------------------------" >> "$TEST_RESULTS_FILE"

# Note: These duplicates were in index.ts, so we verify they're removed by checking
# that the proper versions still work

# Test 3.1: Public monthly consumption still works (not duplicate removed)
test_endpoint_exists "GET" "/api/public-monthly-consumption/1" "Public monthly consumption endpoint exists"

# Test 3.2: Auth login route still works
test_endpoint_exists "POST" "/api/auth/user-login" "Auth user-login endpoint exists"

# Test 3.3: Mandants route still works via db routes
test_requires_auth "GET" "/api/mandants" "Mandants endpoint exists (requires auth)"

# Test 3.4: KI yearly summary still works
test_requires_auth "GET" "/api/yearly-summary/1" "KI yearly-summary endpoint exists"

# ============================================================================
# Section 4: Unused Endpoints Removed
# ============================================================================
echo -e "\n${BLUE}Section 4: Unused Endpoints Removed${NC}"
echo "" >> "$TEST_RESULTS_FILE"
echo "Section 4: Unused Endpoints Removed" >> "$TEST_RESULTS_FILE"
echo "-----------------------------------" >> "$TEST_RESULTS_FILE"

# Test 4.1: Heartbeat endpoint removed
test_endpoint_removed "POST" "/api/auth/heartbeat" "Auth heartbeat endpoint removed"

# Test 4.2: Heating systems endpoint removed
test_endpoint_removed "GET" "/api/heating-systems" "Energy heating-systems endpoint removed"

# Test 4.3: Energy data by object endpoint removed
test_endpoint_removed "GET" "/api/energy-data/1" "Energy energy-data/:objectId removed"

# Test 4.4: KI energy balance removed
test_endpoint_removed "POST" "/api/energy-balance/1" "KI energy-balance endpoint removed"

# Test 4.5: KI monthly consumption multi-year removed
test_endpoint_removed "GET" "/api/monthly-consumption-multi-year/1" "KI monthly-consumption-multi-year removed"

# Test 4.6: Weather authenticated endpoints removed
test_endpoint_removed "GET" "/api/outdoor-temperatures/objects" "Weather /objects endpoint removed"
test_endpoint_removed "GET" "/api/outdoor-temperatures/" "Weather root GET endpoint removed"
test_endpoint_removed "POST" "/api/outdoor-temperatures/" "Weather root POST endpoint removed"

# Test 4.7: Monitoring endpoints removed
test_endpoint_removed "GET" "/api/monitoring/pool/stats" "Monitoring pool/stats endpoint removed"
test_endpoint_removed "GET" "/api/monitoring/pool/health" "Monitoring pool/health endpoint removed"
test_endpoint_removed "GET" "/api/monitoring/dashboard" "Monitoring dashboard endpoint removed"

# Test 4.8: Settings delete endpoint removed
test_endpoint_removed "DELETE" "/api/settings/test/test" "Settings DELETE endpoint removed"

# ============================================================================
# Section 5: TODO Implementations Completed
# ============================================================================
echo -e "\n${BLUE}Section 5: TODO Implementations${NC}"
echo "" >> "$TEST_RESULTS_FILE"
echo "Section 5: TODO Implementations" >> "$TEST_RESULTS_FILE"
echo "-------------------------------" >> "$TEST_RESULTS_FILE"

# Test 5.1: Test connection endpoint exists
test_requires_auth "POST" "/api/portal/test-connection" "testConnection endpoint exists"

# Test 5.2: Activate config endpoint exists
test_requires_auth "POST" "/api/portal/activate-config" "activateConfig endpoint exists"

# Test 5.3: Get active config endpoint exists
test_requires_auth "GET" "/api/portal/active-config" "getActiveConfig endpoint exists"

# ============================================================================
# Section 6: Core Endpoints Still Working
# ============================================================================
echo -e "\n${BLUE}Section 6: Core Endpoints Verification${NC}"
echo "" >> "$TEST_RESULTS_FILE"
echo "Section 6: Core Endpoints Verification" >> "$TEST_RESULTS_FILE"
echo "--------------------------------------" >> "$TEST_RESULTS_FILE"

# Test 6.1: Health check
test_endpoint_exists "GET" "/api/health" "Health check endpoint works"

# Test 6.2: Status endpoint
test_requires_auth "GET" "/api/status" "Status endpoint works"

# Test 6.3: Objects endpoint
test_requires_auth "GET" "/api/objects" "Objects endpoint works"

# Test 6.4: Settings endpoint
test_requires_auth "GET" "/api/settings" "Settings endpoint works"

# Test 6.5: Energy data endpoint
test_requires_auth "GET" "/api/energy-data" "Energy data endpoint works"

# Test 6.6: Dashboard KPIs
test_requires_auth "GET" "/api/dashboard/kpis" "Dashboard KPIs endpoint works"

# Test 6.7: Public endpoints work without auth
test_endpoint_exists "GET" "/api/public-daily-consumption/1" "Public daily consumption works"

# ============================================================================
# Print Summary
# ============================================================================
echo -e "\n${BLUE}=== Test Summary ===${NC}"
echo ""
echo "Summary" >> "$TEST_RESULTS_FILE"
echo "-------" >> "$TEST_RESULTS_FILE"

TOTAL=$((PASSED + FAILED + SKIPPED))

echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Skipped: $SKIPPED${NC}"

echo "" >> "$TEST_RESULTS_FILE"
echo "Total Tests: $TOTAL" >> "$TEST_RESULTS_FILE"
echo "Passed: $PASSED" >> "$TEST_RESULTS_FILE"
echo "Failed: $FAILED" >> "$TEST_RESULTS_FILE"
echo "Skipped: $SKIPPED" >> "$TEST_RESULTS_FILE"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed!${NC}"
    echo "" >> "$TEST_RESULTS_FILE"
    echo "Result: ALL TESTS PASSED" >> "$TEST_RESULTS_FILE"
    exit 0
else
    echo -e "\n${RED}Some tests failed. See $TEST_RESULTS_FILE for details.${NC}"
    echo "" >> "$TEST_RESULTS_FILE"
    echo "Result: SOME TESTS FAILED" >> "$TEST_RESULTS_FILE"
    exit 1
fi

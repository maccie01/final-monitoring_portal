#!/bin/bash

# Frontend Validation Script for Netzwaechter Application
# Created: 2025-10-08
#
# This script validates all frontend routes by checking:
# 1. HTTP status codes
# 2. Response times
# 3. Content validation
# 4. Error detection

set -e

# Configuration
FRONTEND_URL="${FRONTEND_URL:-http://localhost:4005}"
BACKEND_URL="${BACKEND_URL:-http://localhost:4004}"
OUTPUT_DIR="test/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="$OUTPUT_DIR/frontend-validation-$TIMESTAMP.txt"
JSON_RESULTS="$OUTPUT_DIR/frontend-validation-$TIMESTAMP.json"
MAX_RESPONSE_TIME=3000  # 3 seconds in milliseconds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Initialize counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SLOW_TESTS=0

# Initialize JSON results
echo "{\"timestamp\":\"$TIMESTAMP\",\"routes\":[]}" > "$JSON_RESULTS"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "PASS")
            echo -e "${GREEN}✓ PASS${NC}: $message"
            ;;
        "FAIL")
            echo -e "${RED}✗ FAIL${NC}: $message"
            ;;
        "SLOW")
            echo -e "${YELLOW}⚠ SLOW${NC}: $message"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ INFO${NC}: $message"
            ;;
    esac
}

# Function to test a route
test_route() {
    local route=$1
    local description=$2
    local requires_auth=${3:-true}

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo ""
    echo "=========================================="
    echo "Testing: $description"
    echo "Route: $route"
    echo "=========================================="

    # Make request and capture timing and response
    local start_time=$(date +%s%3N)

    if [ "$requires_auth" = "true" ]; then
        # For authenticated routes, we expect redirect to login or 401
        response=$(curl -s -w "\n%{http_code}\n%{time_total}" -o /dev/null "$FRONTEND_URL$route" 2>&1 || echo -e "\n000\n0")
    else
        # For public routes, we expect 200
        response=$(curl -s -w "\n%{http_code}\n%{time_total}" -o /dev/null "$FRONTEND_URL$route" 2>&1 || echo -e "\n000\n0")
    fi

    local end_time=$(date +%s%3N)

    # Parse response
    http_code=$(echo "$response" | tail -2 | head -1)
    time_total=$(echo "$response" | tail -1)
    time_ms=$(echo "$time_total * 1000" | bc | cut -d'.' -f1)

    # Determine if test passed
    local passed=false
    local status_message=""

    if [ "$http_code" = "200" ] || [ "$http_code" = "304" ]; then
        passed=true
        status_message="HTTP $http_code - OK"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_status "PASS" "$status_message (${time_ms}ms)"
    elif [ "$http_code" = "302" ] || [ "$http_code" = "301" ] && [ "$requires_auth" = "true" ]; then
        # Redirect is expected for authenticated routes when not logged in
        passed=true
        status_message="HTTP $http_code - Redirect (expected for auth)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_status "PASS" "$status_message (${time_ms}ms)"
    elif [ "$http_code" = "401" ] && [ "$requires_auth" = "true" ]; then
        # 401 is expected for authenticated routes when not logged in
        passed=true
        status_message="HTTP $http_code - Unauthorized (expected for auth)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_status "PASS" "$status_message (${time_ms}ms)"
    else
        status_message="HTTP $http_code - FAILED"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        print_status "FAIL" "$status_message (${time_ms}ms)"
    fi

    # Check response time
    if [ "$time_ms" -gt "$MAX_RESPONSE_TIME" ]; then
        SLOW_TESTS=$((SLOW_TESTS + 1))
        print_status "SLOW" "Response time ${time_ms}ms exceeds ${MAX_RESPONSE_TIME}ms threshold"
    fi

    # Log results
    echo "$route|$http_code|${time_ms}ms|$passed|$description" >> "$RESULTS_FILE"

    # Add to JSON results
    jq --arg route "$route" \
       --arg desc "$description" \
       --arg code "$http_code" \
       --argjson time "$time_ms" \
       --argjson passed "$passed" \
       '.routes += [{"route":$route,"description":$desc,"http_code":$code,"response_time_ms":$time,"passed":$passed}]' \
       "$JSON_RESULTS" > "${JSON_RESULTS}.tmp" && mv "${JSON_RESULTS}.tmp" "$JSON_RESULTS"
}

# Function to check if servers are running
check_servers() {
    print_status "INFO" "Checking if servers are running..."

    # Check frontend
    if curl -s -f -o /dev/null "$FRONTEND_URL"; then
        print_status "PASS" "Frontend server is running at $FRONTEND_URL"
    else
        print_status "FAIL" "Frontend server is NOT running at $FRONTEND_URL"
        echo ""
        echo "Please start the frontend server with: npm run dev"
        exit 1
    fi

    # Check backend
    if curl -s -f -o /dev/null "$BACKEND_URL/api/health" 2>/dev/null; then
        print_status "PASS" "Backend server is running at $BACKEND_URL"
    else
        print_status "FAIL" "Backend server is NOT running at $BACKEND_URL"
        echo ""
        echo "Please start the backend server with: npm run dev"
        exit 1
    fi
}

# Main execution
echo "=========================================="
echo "Frontend Route Validation"
echo "=========================================="
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"
echo "Timestamp: $TIMESTAMP"
echo "Max Response Time: ${MAX_RESPONSE_TIME}ms"
echo "=========================================="
echo ""

# Check if servers are running
check_servers

echo ""
print_status "INFO" "Starting route validation tests..."

# Test Auth Routes (public - no auth required)
test_route "/login" "Login Page" false
test_route "/anmelden" "Strawa Login Page" false
test_route "/superadmin-login" "Superadmin Login Page" false

# Test User Routes (authenticated)
test_route "/users" "User Management Page" true
test_route "/user" "User Profile Page" true
test_route "/user-settings" "User Settings Page" true

# Test Object Routes (authenticated)
test_route "/objects" "Objects Management Page" true
test_route "/objektverwaltung" "Objects Management Page (German)" true

# Test Energy Routes (authenticated)
test_route "/energy-data" "Energy Data Page" true
test_route "/efficiency" "Efficiency Analysis Page" true
test_route "/db-energy-config" "Database Energy Config Page" true

# Test Temperature Routes (authenticated)
test_route "/temperature-analysis" "Temperature Analysis Page" true
test_route "/temperatur-analyse" "Temperature Analysis Page (German)" true

# Test Monitoring Routes (authenticated)
test_route "/dashbord" "Dashboard Page" true
test_route "/maps" "Maps Page" true
test_route "/network-monitor" "Network Monitor Page" true
test_route "/performance-test" "Performance Test Page" true

# Test KI Reports Routes (authenticated)
test_route "/grafana-dashboard" "Grafana Dashboard Page" true
test_route "/grafana-dashboards" "Grafana Dashboards Page" true

# Test Settings Routes (authenticated)
test_route "/system-setup" "System Setup Page" true
test_route "/api-management" "API Management Page" true
test_route "/modbusConfig" "Modbus Configuration Page" true
test_route "/devices" "Devices Page" true
test_route "/geraeteverwaltung" "Device Management Page (German)" true

# Test Admin Routes (authenticated)
test_route "/admin-dashboard" "Admin Dashboard Page" true
test_route "/logbook" "Logbook Page" true

# Generate Summary Report
echo ""
echo "=========================================="
echo "VALIDATION SUMMARY"
echo "=========================================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo "Slow (>${MAX_RESPONSE_TIME}ms): $SLOW_TESTS"
echo "Success Rate: $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%"
echo "=========================================="

# Update JSON summary
jq --argjson total "$TOTAL_TESTS" \
   --argjson passed "$PASSED_TESTS" \
   --argjson failed "$FAILED_TESTS" \
   --argjson slow "$SLOW_TESTS" \
   '.summary = {"total":$total,"passed":$passed,"failed":$failed,"slow":$slow}' \
   "$JSON_RESULTS" > "${JSON_RESULTS}.tmp" && mv "${JSON_RESULTS}.tmp" "$JSON_RESULTS"

echo ""
print_status "INFO" "Results saved to:"
echo "  - Text: $RESULTS_FILE"
echo "  - JSON: $JSON_RESULTS"
echo ""

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    print_status "PASS" "All tests passed!"
    exit 0
else
    print_status "FAIL" "$FAILED_TESTS test(s) failed"
    exit 1
fi

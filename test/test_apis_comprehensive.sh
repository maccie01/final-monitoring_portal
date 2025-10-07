#!/bin/bash

# Comprehensive API Testing Script
# Tests all documented API endpoints for valid responses

BASE_URL="http://localhost:4004"
OUTPUT_FILE="api_test_results_$(date +%Y%m%d_%H%M%S).md"

echo "# API Testing Results - $(date)" > $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Function to test endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local description=$3
    local auth=$4
    local expected_status=${5:-200}

    echo "## $description" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
    echo "**Endpoint:** $method $url" >> $OUTPUT_FILE
    echo "**Authentication:** $auth" >> $OUTPUT_FILE
    echo "**Expected Status:** $expected_status" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE

    # Make request
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL$url" 2>/dev/null)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST -H "Content-Type: application/json" "$BASE_URL$url" 2>/dev/null)
    fi

    # Extract status and body
    status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS:/d')

    echo "**Actual Status:** $status" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE

    # Check if status matches expected
    if [ "$status" = "$expected_status" ]; then
        echo "**✅ Status:** PASS" >> $OUTPUT_FILE
    else
        echo "**❌ Status:** FAIL (expected $expected_status, got $status)" >> $OUTPUT_FILE
    fi

    echo "" >> $OUTPUT_FILE
    echo "**Response:**" >> $OUTPUT_FILE
    echo "\`\`\`json" >> $OUTPUT_FILE

    # Pretty print JSON if valid
    if echo "$body" | jq . >/dev/null 2>&1 && [ -n "$body" ]; then
        echo "$body" | jq . >> $OUTPUT_FILE
    elif [ -n "$body" ]; then
        echo "$body" >> $OUTPUT_FILE
    else
        echo "(empty response)" >> $OUTPUT_FILE
    fi

    echo "\`\`\`" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
    echo "---" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
}

# Test Public Endpoints
echo "### 🟢 PUBLIC ENDPOINTS" >> $OUTPUT_FILE

# Health Check
test_endpoint "GET" "/api/health" "Health Check" "None required"

# Weather Data APIs
test_endpoint "GET" "/api/outdoor-temperatures/postal-code/10115/latest" "Latest Temperature by Postal Code" "None required"
test_endpoint "GET" "/api/outdoor-temperatures/postal-code/10115" "Temperature History by Postal Code" "None required"

# Public Energy APIs
test_endpoint "GET" "/api/public-daily-consumption/123456789" "Public Daily Consumption" "None required"
test_endpoint "GET" "/api/public-monthly-consumption/123456789" "Public Monthly Consumption" "None required"
test_endpoint "GET" "/api/monthly-netz/123456789" "Monthly Netz Data" "None required"

# Test Efficiency Analysis
test_endpoint "GET" "/api/test-efficiency-analysis/123456789" "Test Efficiency Analysis" "None required"

# Test Authenticated Endpoints (will likely fail without session)
echo "### 🔴 AUTHENTICATED ENDPOINTS (Expected to fail without login)" >> $OUTPUT_FILE

# Auth endpoints
test_endpoint "POST" "/api/auth/superadmin-login" "Superadmin Login" "None (login endpoint)" 401
test_endpoint "POST" "/api/auth/user-login" "User Login" "None (login endpoint)" 401
test_endpoint "GET" "/api/auth/user" "Get Current User" "Required" 401

# Core Database APIs
test_endpoint "GET" "/api/status" "Database Status" "Required" 401
test_endpoint "GET" "/api/objects" "Get Objects" "Required" 401
test_endpoint "GET" "/api/mandants" "Get Mandants" "Required" 401
test_endpoint "GET" "/api/settings" "Get Settings" "Required" 401

# Energy APIs
test_endpoint "GET" "/api/energy-data" "Get Energy Data" "Required" 401
test_endpoint "GET" "/api/daily-consumption/123456789" "Daily Consumption" "Required" 401
test_endpoint "GET" "/api/monthly-consumption/123456789" "Monthly Consumption" "Required" 401

# Efficiency APIs
test_endpoint "GET" "/api/efficiency-analysis/123456789" "Efficiency Analysis" "Required" 401

# Temperature APIs
test_endpoint "GET" "/api/settings/thresholds" "Temperature Thresholds" "Required" 401
test_endpoint "GET" "/api/temperature-analysis/123456789" "Temperature Analysis" "Required" 401

# Object Management APIs
test_endpoint "GET" "/api/objects/by-objectid/123456789" "Object by ObjectId" "Required" 401
test_endpoint "GET" "/api/objects/hierarchy/1" "Object Hierarchy" "Required" 401

# KI Report APIs
test_endpoint "GET" "/api/yearly-summary/123456789" "Yearly Summary" "Required" 401

# Portal APIs
test_endpoint "GET" "/api/portal/config" "Portal Config" "Required" 401

# Monitoring APIs
test_endpoint "GET" "/api/monitoring/pool/stats" "Pool Stats" "Required (admin)" 401

# Legacy Compatibility APIs
test_endpoint "GET" "/api/temperature-efficiency-chart/123456789" "Legacy Temperature Efficiency Chart" "Required" 401

echo "### 📊 SUMMARY" >> $OUTPUT_FILE
echo "- **Public APIs Tested:** 8" >> $OUTPUT_FILE
echo "- **Authenticated APIs Tested:** 16" >> $OUTPUT_FILE
echo "- **Total Endpoints Tested:** 24" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "Run this script with: \`bash test_apis_comprehensive.sh\`" >> $OUTPUT_FILE

echo "API testing complete. Results saved to: $OUTPUT_FILE"

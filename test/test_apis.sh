#!/bin/bash

# Comprehensive API Testing Script for Netzwächter
# Tests all endpoints and documents their actual responses

BASE_URL="http://localhost:4004"
OUTPUT_FILE="api_test_results.md"

echo "# API Test Results - Netzwächter Monitoring System" > $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "Generated: $(date)" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local description=$3
    local auth=$4
    local data=$5

    echo "## $description" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
    echo "**Endpoint:** $method $url" >> $OUTPUT_FILE
    echo "**Authentication:** $auth" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE

    # Make the request and capture both response and status
    if [ "$method" = "GET" ]; then
        response=$(curl -s "$BASE_URL$url" 2>/dev/null)
        status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$url" 2>/dev/null)
    elif [ "$method" = "POST" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$url" 2>/dev/null)
            status=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$url" 2>/dev/null)
        else
            response=$(curl -s -X POST "$BASE_URL$url" 2>/dev/null)
            status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL$url" 2>/dev/null)
        fi
    fi

    echo "**Status Code:** $status" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
    echo "**Response:**" >> $OUTPUT_FILE
    echo "\`\`\`json" >> $OUTPUT_FILE

    # Pretty print JSON if it's valid JSON
    if [ -n "$response" ] && echo "$response" | jq . >/dev/null 2>&1; then
        echo "$response" | jq . >> $OUTPUT_FILE
    elif [ -n "$response" ]; then
        echo "$response" >> $OUTPUT_FILE
    else
        echo "(empty response)" >> $OUTPUT_FILE
    fi

    echo "\`\`\`" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
    echo "---" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
}

# Test Health Check
test_endpoint "GET" "/api/health" "Health Check" "None"

# Test Public Weather APIs
test_endpoint "GET" "/api/outdoor-temperatures/postal-code/10115/latest" "Latest Temperature by Postal Code" "None"
test_endpoint "GET" "/api/outdoor-temperatures/postal-code/10115" "Temperature History by Postal Code" "None"

# Test Public Energy APIs
test_endpoint "GET" "/api/public-daily-consumption/TEST001" "Public Daily Consumption" "None"
test_endpoint "GET" "/api/public-monthly-consumption/TEST001" "Public Monthly Consumption" "None"

# Test Public Efficiency API
test_endpoint "GET" "/api/test-efficiency-analysis/TEST001" "Test Efficiency Analysis" "None"

# Test Authentication Endpoints (without proper auth)
test_endpoint "POST" "/api/auth/user-login" "User Login (Invalid Credentials)" "None" '{"username":"test","password":"test"}'
test_endpoint "POST" "/api/auth/superadmin-login" "Superadmin Login (Invalid Credentials)" "None" '{"username":"test","password":"test"}'

echo "API testing completed. Results saved to $OUTPUT_FILE"

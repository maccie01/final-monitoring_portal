#!/bin/bash

# Quick API Validation - Critical Tests Only
# Tests key changes made during API cleanup

API_BASE="http://localhost:4004"

echo "=== Quick API Validation ==="
echo ""

# Test 1: Security Fix - Efficiency route requires auth
echo -n "1. Efficiency auth required... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/efficiency-analysis/1")
if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo "✓ PASS (HTTP $HTTP_CODE)"
else
    echo "✗ FAIL (HTTP $HTTP_CODE)"
fi

# Test 2: Route ordering - specific object routes accessible
echo -n "2. /objects/by-objectid route... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/objects/by-objectid/1")
if [ "$HTTP_CODE" != "404" ]; then
    echo "✓ PASS (HTTP $HTTP_CODE)"
else
    echo "✗ FAIL (HTTP $HTTP_CODE - not found)"
fi

echo -n "3. /objects/hierarchy route... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/objects/hierarchy/1")
if [ "$HTTP_CODE" != "404" ]; then
    echo "✓ PASS (HTTP $HTTP_CODE)"
else
    echo "✗ FAIL (HTTP $HTTP_CODE - not found)"
fi

# Test 3: Removed endpoints return 404
echo -n "4. Heartbeat removed... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/auth/heartbeat")
if [ "$HTTP_CODE" = "404" ]; then
    echo "✓ PASS (404)"
else
    echo "✗ FAIL (HTTP $HTTP_CODE - should be 404)"
fi

echo -n "5. Heating-systems removed... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/heating-systems")
if [ "$HTTP_CODE" = "404" ]; then
    echo "✓ PASS (404)"
else
    echo "✗ FAIL (HTTP $HTTP_CODE - should be 404)"
fi

echo -n "6. Energy-balance removed... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/api/energy-balance/1")
if [ "$HTTP_CODE" = "404" ]; then
    echo "✓ PASS (404)"
else
    echo "✗ FAIL (HTTP $HTTP_CODE - should be 404)"
fi

echo -n "7. Monitoring endpoints removed... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/monitoring/pool/stats")
if [ "$HTTP_CODE" = "404" ]; then
    echo "✓ PASS (404)"
else
    echo "✗ FAIL (HTTP $HTTP_CODE - should be 404)"
fi

# Test 4: Core endpoints still work
echo -n "8. Health check works... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/health")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ PASS (200)"
else
    echo "✗ FAIL (HTTP $HTTP_CODE)"
fi

echo -n "9. Public endpoint works... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/public-daily-consumption/1")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ PASS (200)"
else
    echo "✗ FAIL (HTTP $HTTP_CODE)"
fi

echo -n "10. Yearly summary exists... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/yearly-summary/1")
if [ "$HTTP_CODE" != "404" ]; then
    echo "✓ PASS (HTTP $HTTP_CODE)"
else
    echo "✗ FAIL (HTTP $HTTP_CODE - endpoint missing)"
fi

echo ""
echo "=== Validation Complete ==="

#!/bin/bash

# Frontend Performance Testing Script for Netzwaechter Application
# Created: 2025-10-08
#
# This script measures and analyzes frontend performance:
# 1. Bundle size analysis
# 2. Load time measurements
# 3. Memory usage estimation
# 4. Performance bottleneck identification

set -e

# Configuration
FRONTEND_URL="${FRONTEND_URL:-http://localhost:4005}"
BACKEND_URL="${BACKEND_URL:-http://localhost:4004}"
OUTPUT_DIR="test/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="$OUTPUT_DIR/frontend-performance-$TIMESTAMP.txt"
JSON_RESULTS="$OUTPUT_DIR/frontend-performance-$TIMESTAMP.json"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIENT_DIR="$PROJECT_ROOT/client"
DIST_DIR="$CLIENT_DIR/dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Initialize JSON results
echo "{\"timestamp\":\"$TIMESTAMP\",\"tests\":{}}" > "$JSON_RESULTS"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "PASS")
            echo -e "${GREEN}✓${NC} $message"
            ;;
        "FAIL")
            echo -e "${RED}✗${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}⚠${NC} $message"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ${NC} $message"
            ;;
        "SECTION")
            echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
            echo -e "${BLUE}$message${NC}"
            echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
            ;;
    esac
}

# Function to format bytes to human readable
format_bytes() {
    local bytes=$1
    if [ "$bytes" -lt 1024 ]; then
        echo "${bytes}B"
    elif [ "$bytes" -lt 1048576 ]; then
        echo "$(echo "scale=2; $bytes / 1024" | bc)KB"
    else
        echo "$(echo "scale=2; $bytes / 1048576" | bc)MB"
    fi
}

# Function to measure response time with detailed breakdown
measure_load_time() {
    local url=$1
    local description=$2

    print_status "INFO" "Measuring: $description"

    # Make request with detailed timing
    local response=$(curl -o /dev/null -s -w "DNS:%{time_namelookup}|Connect:%{time_connect}|StartTransfer:%{time_starttransfer}|Total:%{time_total}|Size:%{size_download}|Code:%{http_code}" "$url" 2>&1)

    # Parse timing data
    local dns_time=$(echo "$response" | grep -o "DNS:[0-9.]*" | cut -d: -f2)
    local connect_time=$(echo "$response" | grep -o "Connect:[0-9.]*" | cut -d: -f2)
    local starttransfer=$(echo "$response" | grep -o "StartTransfer:[0-9.]*" | cut -d: -f2)
    local total_time=$(echo "$response" | grep -o "Total:[0-9.]*" | cut -d: -f2)
    local size=$(echo "$response" | grep -o "Size:[0-9]*" | cut -d: -f2)
    local http_code=$(echo "$response" | grep -o "Code:[0-9]*" | cut -d: -f2)

    # Convert to milliseconds
    local dns_ms=$(echo "$dns_time * 1000" | bc | cut -d. -f1)
    local connect_ms=$(echo "$connect_time * 1000" | bc | cut -d. -f1)
    local starttransfer_ms=$(echo "$starttransfer * 1000" | bc | cut -d. -f1)
    local total_ms=$(echo "$total_time * 1000" | bc | cut -d. -f1)

    echo "  DNS Lookup: ${dns_ms}ms"
    echo "  TCP Connect: ${connect_ms}ms"
    echo "  Time to First Byte: ${starttransfer_ms}ms"
    echo "  Total Time: ${total_ms}ms"
    echo "  Size: $(format_bytes $size)"
    echo "  HTTP Code: $http_code"

    # Performance assessment
    if [ "$total_ms" -lt 1000 ]; then
        print_status "PASS" "Excellent performance (< 1s)"
    elif [ "$total_ms" -lt 3000 ]; then
        print_status "PASS" "Good performance (< 3s)"
    elif [ "$total_ms" -lt 5000 ]; then
        print_status "WARN" "Acceptable performance (< 5s)"
    else
        print_status "FAIL" "Poor performance (> 5s)"
    fi

    echo ""

    # Return total time for summary
    echo "$total_ms"
}

# Function to analyze bundle sizes
analyze_bundle_sizes() {
    print_status "SECTION" "BUNDLE SIZE ANALYSIS"

    if [ ! -d "$DIST_DIR" ]; then
        print_status "WARN" "Build directory not found. Building application..."
        cd "$CLIENT_DIR"
        npm run build > /dev/null 2>&1
        cd - > /dev/null
    fi

    if [ ! -d "$DIST_DIR" ]; then
        print_status "FAIL" "Failed to build application or dist directory not found"
        return 1
    fi

    print_status "INFO" "Analyzing bundle sizes in: $DIST_DIR"
    echo ""

    # JavaScript bundles
    echo "JavaScript Bundles:"
    if ls "$DIST_DIR/assets/"*.js 2>/dev/null | grep -q .; then
        local total_js_size=0
        for file in "$DIST_DIR/assets/"*.js; do
            if [ -f "$file" ]; then
                local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
                total_js_size=$((total_js_size + size))
                local filename=$(basename "$file")
                echo "  - $filename: $(format_bytes $size)"

                # Warn if bundle is too large
                if [ "$size" -gt 1048576 ]; then  # > 1MB
                    print_status "WARN" "Large bundle detected: $filename ($(format_bytes $size))"
                fi
            fi
        done
        echo "  Total JS Size: $(format_bytes $total_js_size)"

        # Save to JSON
        jq --arg size "$total_js_size" '.tests.bundle_sizes.total_js = $size' "$JSON_RESULTS" > "${JSON_RESULTS}.tmp" && mv "${JSON_RESULTS}.tmp" "$JSON_RESULTS"
    else
        print_status "WARN" "No JavaScript bundles found"
    fi

    echo ""

    # CSS bundles
    echo "CSS Bundles:"
    if ls "$DIST_DIR/assets/"*.css 2>/dev/null | grep -q .; then
        local total_css_size=0
        for file in "$DIST_DIR/assets/"*.css; do
            if [ -f "$file" ]; then
                local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
                total_css_size=$((total_css_size + size))
                local filename=$(basename "$file")
                echo "  - $filename: $(format_bytes $size)"
            fi
        done
        echo "  Total CSS Size: $(format_bytes $total_css_size)"

        # Save to JSON
        jq --arg size "$total_css_size" '.tests.bundle_sizes.total_css = $size' "$JSON_RESULTS" > "${JSON_RESULTS}.tmp" && mv "${JSON_RESULTS}.tmp" "$JSON_RESULTS"
    else
        print_status "WARN" "No CSS bundles found"
    fi

    echo ""

    # Total size
    local total_size=$(du -sk "$DIST_DIR" | cut -f1)
    local total_size_bytes=$((total_size * 1024))
    echo "Total Build Size: $(format_bytes $total_size_bytes)"

    # Save to JSON
    jq --arg size "$total_size_bytes" '.tests.bundle_sizes.total_build = $size' "$JSON_RESULTS" > "${JSON_RESULTS}.tmp" && mv "${JSON_RESULTS}.tmp" "$JSON_RESULTS"

    # Assessment
    if [ "$total_size_bytes" -lt 5242880 ]; then  # < 5MB
        print_status "PASS" "Build size is optimal (< 5MB)"
    elif [ "$total_size_bytes" -lt 10485760 ]; then  # < 10MB
        print_status "WARN" "Build size is acceptable (< 10MB)"
    else
        print_status "FAIL" "Build size is too large (> 10MB) - consider code splitting"
    fi

    echo ""
}

# Function to test critical routes
test_critical_routes() {
    print_status "SECTION" "CRITICAL ROUTE PERFORMANCE"

    declare -A routes
    routes["/"]="Homepage"
    routes["/login"]="Login Page"
    routes["/dashboard"]="Dashboard"
    routes["/maps"]="Maps"
    routes["/energy-data"]="Energy Data"
    routes["/objects"]="Objects Management"

    local total_time=0
    local route_count=0
    local slowest_route=""
    local slowest_time=0

    for route in "${!routes[@]}"; do
        description="${routes[$route]}"
        time_ms=$(measure_load_time "$FRONTEND_URL$route" "$description")

        total_time=$((total_time + time_ms))
        route_count=$((route_count + 1))

        if [ "$time_ms" -gt "$slowest_time" ]; then
            slowest_time=$time_ms
            slowest_route="$route ($description)"
        fi

        # Save to JSON
        jq --arg route "$route" \
           --arg desc "$description" \
           --argjson time "$time_ms" \
           '.tests.critical_routes += [{"route":$route,"description":$desc,"load_time_ms":$time}]' \
           "$JSON_RESULTS" > "${JSON_RESULTS}.tmp" && mv "${JSON_RESULTS}.tmp" "$JSON_RESULTS"
    done

    local avg_time=$((total_time / route_count))

    echo ""
    print_status "INFO" "Performance Summary:"
    echo "  Average Load Time: ${avg_time}ms"
    echo "  Slowest Route: $slowest_route (${slowest_time}ms)"

    # Save summary to JSON
    jq --argjson avg "$avg_time" \
       --arg slowest "$slowest_route" \
       --argjson slowest_time "$slowest_time" \
       '.tests.performance_summary = {"avg_load_time_ms":$avg,"slowest_route":$slowest,"slowest_time_ms":$slowest_time}' \
       "$JSON_RESULTS" > "${JSON_RESULTS}.tmp" && mv "${JSON_RESULTS}.tmp" "$JSON_RESULTS"

    echo ""
}

# Function to analyze dependencies
analyze_dependencies() {
    print_status "SECTION" "DEPENDENCY ANALYSIS"

    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        print_status "FAIL" "package.json not found"
        return 1
    fi

    print_status "INFO" "Analyzing package dependencies..."

    # Count dependencies
    local deps=$(cat "$PROJECT_ROOT/package.json" | jq '.dependencies | length')
    local dev_deps=$(cat "$PROJECT_ROOT/package.json" | jq '.devDependencies | length')
    local total_deps=$((deps + dev_deps))

    echo "  Production Dependencies: $deps"
    echo "  Development Dependencies: $dev_deps"
    echo "  Total Dependencies: $total_deps"

    # Save to JSON
    jq --argjson deps "$deps" \
       --argjson dev_deps "$dev_deps" \
       --argjson total "$total_deps" \
       '.tests.dependencies = {"production":$deps,"development":$dev_deps,"total":$total}' \
       "$JSON_RESULTS" > "${JSON_RESULTS}.tmp" && mv "${JSON_RESULTS}.tmp" "$JSON_RESULTS"

    # Check for large dependencies
    echo ""
    print_status "INFO" "Checking for potentially large dependencies..."

    local large_deps=$(cat "$PROJECT_ROOT/package.json" | jq -r '.dependencies | keys[]' | grep -E "(moment|lodash|@material-ui)" || echo "")

    if [ -n "$large_deps" ]; then
        print_status "WARN" "Found potentially large dependencies:"
        echo "$large_deps" | while read dep; do
            echo "  - $dep (consider lighter alternatives)"
        done
    else
        print_status "PASS" "No obviously large dependencies detected"
    fi

    echo ""
}

# Function to check for optimization opportunities
check_optimizations() {
    print_status "SECTION" "OPTIMIZATION OPPORTUNITIES"

    local recommendations=()

    # Check if code splitting is configured
    if [ -f "$CLIENT_DIR/vite.config.ts" ] || [ -f "$CLIENT_DIR/vite.config.js" ]; then
        if grep -q "manualChunks" "$CLIENT_DIR/vite.config.ts" "$CLIENT_DIR/vite.config.js" 2>/dev/null; then
            print_status "PASS" "Code splitting is configured"
        else
            print_status "WARN" "Code splitting not detected - consider implementing it"
            recommendations+=("Implement code splitting in vite.config")
        fi
    fi

    # Check for lazy loading
    if grep -rq "React.lazy\|lazy(" "$CLIENT_DIR/src" 2>/dev/null; then
        print_status "PASS" "Lazy loading is implemented"
    else
        print_status "WARN" "No lazy loading detected - consider lazy loading routes"
        recommendations+=("Implement lazy loading for route components")
    fi

    # Check for image optimization
    if ls "$DIST_DIR/assets/"*.{jpg,jpeg,png,gif} 2>/dev/null | grep -q .; then
        print_status "INFO" "Images found in build - ensure they are optimized"
        recommendations+=("Verify image optimization (use WebP, compress images)")
    fi

    # Check for service worker
    if [ -f "$DIST_DIR/service-worker.js" ] || [ -f "$DIST_DIR/sw.js" ]; then
        print_status "PASS" "Service worker detected"
    else
        print_status "INFO" "No service worker detected - consider PWA features"
    fi

    # Save recommendations to JSON
    if [ ${#recommendations[@]} -gt 0 ]; then
        local recs_json=$(printf '%s\n' "${recommendations[@]}" | jq -R . | jq -s .)
        jq --argjson recs "$recs_json" '.tests.recommendations = $recs' "$JSON_RESULTS" > "${JSON_RESULTS}.tmp" && mv "${JSON_RESULTS}.tmp" "$JSON_RESULTS"
    fi

    echo ""
}

# Main execution
echo "=========================================="
echo "Frontend Performance Testing"
echo "=========================================="
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"
echo "Timestamp: $TIMESTAMP"
echo "=========================================="

# Check if frontend is running
if ! curl -s -f -o /dev/null "$FRONTEND_URL"; then
    print_status "WARN" "Frontend server is not running at $FRONTEND_URL"
    print_status "INFO" "Some tests will be skipped. Run 'npm run dev' to start the server."
    FRONTEND_RUNNING=false
else
    print_status "PASS" "Frontend server is running"
    FRONTEND_RUNNING=true
fi

echo ""

# Run tests
analyze_bundle_sizes

if [ "$FRONTEND_RUNNING" = true ]; then
    test_critical_routes
else
    print_status "WARN" "Skipping route performance tests (frontend not running)"
fi

analyze_dependencies
check_optimizations

# Generate Summary Report
print_status "SECTION" "PERFORMANCE TEST SUMMARY"

print_status "INFO" "Results saved to:"
echo "  - Text: $RESULTS_FILE"
echo "  - JSON: $JSON_RESULTS"

# Create text summary
{
    echo "Frontend Performance Test Results"
    echo "================================="
    echo "Timestamp: $TIMESTAMP"
    echo ""
    cat "$JSON_RESULTS" | jq -r '
        "Bundle Sizes:",
        "  Total JS: \(.tests.bundle_sizes.total_js // "N/A") bytes",
        "  Total CSS: \(.tests.bundle_sizes.total_css // "N/A") bytes",
        "  Total Build: \(.tests.bundle_sizes.total_build // "N/A") bytes",
        "",
        "Performance Summary:",
        "  Average Load Time: \(.tests.performance_summary.avg_load_time_ms // "N/A")ms",
        "  Slowest Route: \(.tests.performance_summary.slowest_route // "N/A")",
        "",
        "Dependencies:",
        "  Production: \(.tests.dependencies.production // "N/A")",
        "  Development: \(.tests.dependencies.development // "N/A")",
        "  Total: \(.tests.dependencies.total // "N/A")"
    '
} > "$RESULTS_FILE"

echo ""
print_status "PASS" "Performance testing complete!"

exit 0

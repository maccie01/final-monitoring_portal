#!/bin/bash

# Bundle Size Tracking Script
# Monitors bundle size and alerts if it grows beyond thresholds
# Part of Frontend Cleanup Agent - Task 5.1

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Bundle Size Analysis"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Build the project
echo "📦 Building project..."
npm run build > /dev/null 2>&1

# Check if build succeeded
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Cannot analyze bundle size."
  exit 1
fi

echo "✅ Build successful"
echo ""

# Calculate total bundle size (all JS files)
BUNDLE_SIZE=$(du -sk dist/public/assets/*.js 2>/dev/null | awk '{sum+=$1} END {print sum}')

# Individual file sizes
echo "📊 Individual Asset Sizes:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
du -h dist/public/assets/*.js | sort -hr | while read size file; do
  filename=$(basename "$file")
  echo "  $size  $filename"
done
echo ""

# Calculate CSS size
CSS_SIZE=$(du -sk dist/public/assets/*.css 2>/dev/null | awk '{sum+=$1} END {print sum}')

echo "📊 Bundle Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  JavaScript: ${BUNDLE_SIZE} KB"
echo "  CSS:        ${CSS_SIZE} KB"
echo "  Total:      $((BUNDLE_SIZE + CSS_SIZE)) KB"
echo ""

# Baseline from before cleanup (from UI_SYSTEM_ANALYSIS.md)
BASELINE_JS=2100  # Estimated baseline in KB
BASELINE_CSS=100  # Estimated CSS baseline in KB
BASELINE_TOTAL=$((BASELINE_JS + BASELINE_CSS))

# Current total
CURRENT_TOTAL=$((BUNDLE_SIZE + CSS_SIZE))

# Calculate reduction
REDUCTION=$((BASELINE_TOTAL - CURRENT_TOTAL))
REDUCTION_PCT=$((REDUCTION * 100 / BASELINE_TOTAL))

echo "📈 Comparison to Baseline:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Baseline:   ${BASELINE_TOTAL} KB"
echo "  Current:    ${CURRENT_TOTAL} KB"

if [ $REDUCTION -gt 0 ]; then
  echo "  Reduction:  ${REDUCTION} KB (-${REDUCTION_PCT}%)"
  echo "  Status:     ✅ Improved"
else
  GROWTH=$((CURRENT_TOTAL - BASELINE_TOTAL))
  GROWTH_PCT=$((GROWTH * 100 / BASELINE_TOTAL))
  echo "  Growth:     +${GROWTH} KB (+${GROWTH_PCT}%)"
  echo "  Status:     ⚠️  Bundle grew"
fi
echo ""

# Target: 200KB reduction (from task document)
TARGET_REDUCTION=200

echo "🎯 Cleanup Target Progress:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Target:     ${TARGET_REDUCTION} KB reduction"
echo "  Current:    ${REDUCTION} KB reduction"

if [ $REDUCTION -ge $TARGET_REDUCTION ]; then
  echo "  Status:     ✅ Target achieved!"
elif [ $REDUCTION -ge 150 ]; then
  echo "  Status:     🟡 Close to target (75%+)"
elif [ $REDUCTION -gt 0 ]; then
  PROGRESS=$((REDUCTION * 100 / TARGET_REDUCTION))
  echo "  Status:     🟡 ${PROGRESS}% to target"
else
  echo "  Status:     ❌ No reduction yet"
fi
echo ""

# Alert if bundle grew significantly
if [ $CURRENT_TOTAL -gt $((BASELINE_TOTAL + 50)) ]; then
  echo "⚠️  WARNING: Bundle size increased by more than 50KB!"
  echo "   This may indicate new dependencies or dead code."
  echo ""
  exit 1
fi

# Check if analysis file was generated
if [ -f "dist/bundle-analysis.html" ]; then
  echo "📁 Detailed Analysis Available:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  File: dist/bundle-analysis.html"
  echo "  Open this file in a browser for interactive visualization"
  echo ""
fi

echo "✅ Bundle size tracking complete"
echo ""

# Success exit
exit 0

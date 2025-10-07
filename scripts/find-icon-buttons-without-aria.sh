#!/bin/bash
# Script to find icon-only buttons without aria-label

echo "=== Searching for icon-only buttons without aria-label ==="
echo ""

# Find buttons that contain only an icon (no text)
# Pattern: <Button ...><SomeIcon .../></Button> without aria-label

grep -rn "<Button" client/src --include="*.tsx" -A 1 | \
  grep -B 1 "Icon" | \
  grep -v "aria-label" | \
  grep -v "mr-2" | \
  grep -v "ml-2" | \
  grep "Button.*>" | \
  sed 's/:/ /' | \
  awk '{print $1 ":" $2}'

echo ""
echo "=== Analysis Complete ==="

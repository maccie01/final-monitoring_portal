#!/bin/bash
cd client/src/components/ui
for component in *.tsx; do
  name=$(basename "$component" .tsx)
  # Search for imports excluding the component file itself
  count=$(grep -r "from [\"'].*/$name[\"']" ../.. --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "components/ui/$name" | wc -l | xargs)
  count2=$(grep -r "import.*$name.*from" ../.. --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "components/ui/$name" | wc -l | xargs)
  total=$((count + count2))

  if [ "$total" -eq 0 ]; then
    echo "UNUSED: $component"
  else
    echo "USED($total): $component"
  fi
done | sort

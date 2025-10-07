# Agent A: Frontend Cleanup & Optimization

**Branch**: `cleanup/frontend-dead-code`
**Agent Role**: Frontend cleanup, UI consistency, component optimization
**Estimated Duration**: 2 weeks
**Priority**: P0 - Critical
**Dependencies**: None - can start immediately

---

## Mission Objective

Remove all dead code from the frontend, standardize UI components, implement consistency rules, and optimize bundle size. This work is completely independent of backend changes and can proceed in parallel.

---

## Phase 1: Dead Code Elimination (Days 1-2)

### Task 1.1: Delete Unused Page Components
**Priority**: P0
**Estimated Time**: 30 minutes
**Success Criteria**:
- 5 files deleted
- No import errors after deletion
- Application builds successfully
- All routes still functional

**Implementation Steps**:
```bash
# 1. Verify files are truly unused (safety check)
grep -r "Landing" client/src --include="*.tsx" --include="*.ts" | grep -v "pages/Landing.tsx"
grep -r "not-found" client/src --include="*.tsx" --include="*.ts" | grep -v "pages/not-found.tsx"
grep -r "CockpitContext" client/src --include="*.tsx" --include="*.ts" | grep -v "contexts/CockpitContext.tsx"

# 2. Delete files
rm client/src/pages/Landing.tsx
rm client/src/pages/not-found.tsx
rm client/src/contexts/CockpitContext.tsx
rm client/src/pages/NetworkMonitor.tsx.backup_20250812_222516
rm client/src/pages/NetworkMonitor.tsx.working

# 3. Verify build
npm run build

# 4. Test critical routes
npm run dev
# Manually verify: /, /dashboard, /objects, /network-monitor
```

**Verification Checklist**:
- [ ] All 5 files deleted from filesystem
- [ ] `npm run build` completes without errors
- [ ] `npm run dev` starts successfully
- [ ] No 404 errors in browser console
- [ ] All main routes load correctly

**Documentation**:
```
Files Deleted:
1. client/src/pages/Landing.tsx (324 lines)
2. client/src/pages/not-found.tsx (21 lines)
3. client/src/contexts/CockpitContext.tsx (59 lines)
4. client/src/pages/NetworkMonitor.tsx.backup_20250812_222516 (1,268 lines)
5. client/src/pages/NetworkMonitor.tsx.working (1,268 lines)

Total Lines Removed: 2,940
Build Status: [PASS/FAIL]
Test Results: [Notes]
Commit Hash: [git hash]
```

---

### Task 1.2: Identify and Delete 26 Unused UI Components
**Priority**: P0
**Estimated Time**: 2 hours
**Success Criteria**:
- All 26 unused components identified and verified
- Components deleted without breaking imports
- Bundle size reduced by ~150KB
- Application builds and runs successfully

**Implementation Steps**:
```bash
# 1. Create verification script
cat > scripts/find-unused-components.sh << 'EOF'
#!/bin/bash
cd client/src/components/ui
for component in *.tsx; do
  name=$(basename "$component" .tsx)
  # Search for imports excluding the component file itself
  count=$(grep -r "$name" ../.. --include="*.tsx" --include="*.ts" | \
          grep -v "components/ui/$name" | wc -l)
  if [ "$count" -eq 0 ]; then
    echo "UNUSED: $component (0 references)"
  fi
done
EOF

chmod +x scripts/find-unused-components.sh

# 2. Run verification
./scripts/find-unused-components.sh > unused-components-list.txt

# 3. Review list and delete components
# DELETE THESE (based on UI_SYSTEM_ANALYSIS.md):
rm client/src/components/ui/aspect-ratio.tsx
rm client/src/components/ui/breadcrumb.tsx
rm client/src/components/ui/carousel.tsx
rm client/src/components/ui/command.tsx
rm client/src/components/ui/hover-card.tsx
rm client/src/components/ui/menubar.tsx
rm client/src/components/ui/navigation-menu.tsx
rm client/src/components/ui/sheet.tsx
# ... (add remaining 18 components after verification)

# 4. Verify build
npm run build

# 5. Check bundle size
du -h dist/assets/*.js | sort -h
```

**Verification Checklist**:
- [ ] Verification script created and run
- [ ] All 26 components confirmed as unused
- [ ] Components deleted from filesystem
- [ ] No import errors in build output
- [ ] Bundle size reduced (compare before/after)
- [ ] Application runs without errors

**Documentation**:
```
Components Deleted (26 total):
1. aspect-ratio.tsx - [size] bytes
2. breadcrumb.tsx - [size] bytes
3. carousel.tsx - [size] bytes
[... list all 26]

Bundle Size Before: [X] MB
Bundle Size After: [Y] MB
Reduction: [Z] KB (-XX%)

Build Status: [PASS/FAIL]
Verification: [grep results showing 0 references]
Commit Hash: [git hash]
```

---

## Phase 2: Import Standardization (Days 3-4)

### Task 2.1: Standardize All Import Quotes to Double Quotes
**Priority**: P0
**Estimated Time**: 1 hour
**Success Criteria**:
- 100% of imports use double quotes
- ESLint rule enforces consistency
- No manual changes required in future

**Implementation Steps**:
```bash
# 1. Install ESLint plugin if needed
npm install --save-dev eslint-plugin-quotes

# 2. Update .eslintrc.json (or .eslintrc.js)
# Add this rule:
{
  "rules": {
    "quotes": ["error", "double", { "avoidEscape": true }]
  }
}

# 3. Auto-fix all files
npx eslint client/src --ext .ts,.tsx --fix

# 4. Verify no errors remain
npx eslint client/src --ext .ts,.tsx

# 5. Test build
npm run build
```

**Verification Checklist**:
- [ ] ESLint rule added to config
- [ ] All files auto-fixed
- [ ] `npx eslint` shows 0 errors
- [ ] Build successful
- [ ] No single quotes in imports (verify with grep)

**Documentation**:
```
ESLint Rule Added:
"quotes": ["error", "double", { "avoidEscape": true }]

Files Modified: [count from eslint output]
Single Quotes Before: 128 usages
Double Quotes After: 100% compliance

Verification:
grep -r "import.*'" client/src --include="*.tsx" | wc -l
Result: 0

Commit Hash: [git hash]
```

---

### Task 2.2: Standardize Card Component Import Patterns
**Priority**: P1
**Estimated Time**: 45 minutes
**Success Criteria**:
- All Card imports follow consistent pattern
- Standard pattern: `import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"`
- No CardDescription unless actually used

**Implementation Steps**:
```bash
# 1. Find all Card imports
grep -r "from.*ui/card" client/src --include="*.tsx" -n > card-imports.txt

# 2. Create standardization script
cat > scripts/standardize-card-imports.js << 'EOF'
const fs = require('fs');
const glob = require('glob');

const files = glob.sync('client/src/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Standardize Card imports
  content = content.replace(
    /import\s*{\s*Card[^}]*}\s*from\s*["']@\/components\/ui\/card["'];?/g,
    'import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";'
  );

  fs.writeFileSync(file, content);
});

console.log('Card imports standardized');
EOF

# 3. Run standardization
node scripts/standardize-card-imports.js

# 4. Manual review (check for CardDescription usage)
grep -r "CardDescription" client/src --include="*.tsx" -B 2 -A 2

# 5. Add CardDescription back where needed
# (Manual step - review each usage)

# 6. Verify build
npm run build
```

**Verification Checklist**:
- [ ] All Card imports follow standard pattern
- [ ] CardDescription added only where used
- [ ] No import errors
- [ ] Cards render correctly in UI
- [ ] Build successful

**Documentation**:
```
Standard Import Pattern:
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

Files Modified: [count]
CardDescription Exceptions: [list files that need it]

Before: Mixed patterns across 37 Card usages
After: Consistent pattern, CardDescription only where needed

Commit Hash: [git hash]
```

---

## Phase 3: UI Consistency & Accessibility (Days 5-7)

### Task 3.1: Add ARIA Labels to All Icon Buttons
**Priority**: P1
**Estimated Time**: 2 hours
**Success Criteria**:
- All icon-only buttons have aria-label
- Screen reader testing passes
- No accessibility warnings in build

**Implementation Steps**:
```bash
# 1. Find all icon buttons
grep -r "<Button" client/src --include="*.tsx" -A 2 | grep -B 1 "Icon" > icon-buttons.txt

# 2. Create verification script
cat > scripts/check-aria-labels.js << 'EOF'
const fs = require('fs');
const glob = require('glob');

const files = glob.sync('client/src/**/*.tsx');
const issues = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');

  // Find icon buttons without aria-label
  const buttonRegex = /<Button[^>]*>[\s\n]*<\w+Icon[^>]*\/?>[\s\n]*<\/Button>/g;
  const matches = content.match(buttonRegex) || [];

  matches.forEach(match => {
    if (!match.includes('aria-label')) {
      issues.push({ file, button: match });
    }
  });
});

console.log(`Found ${issues.length} icon buttons without aria-label`);
issues.forEach(({ file, button }) => {
  console.log(`${file}: ${button.substring(0, 50)}...`);
});
EOF

node scripts/check-aria-labels.js

# 3. Manual fix (example pattern)
# Before:
# <Button variant="ghost" size="sm">
#   <TrashIcon className="h-4 w-4" />
# </Button>

# After:
# <Button variant="ghost" size="sm" aria-label="Delete item">
#   <TrashIcon className="h-4 w-4" />
# </Button>

# 4. Re-run verification
node scripts/check-aria-labels.js

# 5. Test with screen reader
# Use NVDA (Windows) or VoiceOver (Mac) to verify
```

**Verification Checklist**:
- [ ] Verification script shows 0 issues
- [ ] All icon buttons have descriptive aria-label
- [ ] Screen reader announces button purpose
- [ ] No accessibility warnings in console
- [ ] Manual testing with keyboard navigation

**Documentation**:
```
Icon Buttons Found: [count]
ARIA Labels Added: [count]

Examples:
1. Delete button: aria-label="Delete item"
2. Edit button: aria-label="Edit settings"
3. Close button: aria-label="Close dialog"

Screen Reader Testing:
- Tool Used: [NVDA/VoiceOver/etc]
- Test Results: [PASS/FAIL]
- Issues Found: [none/list]

Commit Hash: [git hash]
```

---

### Task 3.2: Implement Button Variant Consistency
**Priority**: P2
**Estimated Time**: 1 hour
**Success Criteria**:
- Button variants follow design system guidelines
- Document preferred variant usage patterns
- Consistent size usage (prefer "sm")

**Implementation Steps**:
```bash
# 1. Audit current Button usage
grep -r '<Button' client/src --include="*.tsx" -o | wc -l
grep -r 'variant="outline"' client/src --include="*.tsx" -o | wc -l
grep -r 'variant="ghost"' client/src --include="*.tsx" -o | wc -l
grep -r 'variant="destructive"' client/src --include="*.tsx" -o | wc -l

# 2. Create usage guidelines document
cat > client/src/components/ui/BUTTON_GUIDELINES.md << 'EOF'
# Button Usage Guidelines

## Variant Guidelines

### outline (Primary)
- Default for most actions
- Clear visual hierarchy
- Good for toolbars and action bars

### ghost (Secondary)
- Subtle actions
- Icon-only buttons
- Table row actions

### destructive (Danger)
- Delete operations
- Irreversible actions
- Always confirm with dialog

### default (Minimal Use)
- Primary CTAs only
- Login/Submit buttons
- Limit to 1 per page

## Size Guidelines

### sm (Preferred)
- Default size for most buttons
- Compact interfaces
- Table actions

### default
- Forms and dialogs
- Primary actions

## Examples

// Primary action
<Button variant="outline" size="sm">Save</Button>

// Delete action
<Button variant="destructive" size="sm">Delete</Button>

// Icon button
<Button variant="ghost" size="sm" aria-label="Close">
  <XIcon className="h-4 w-4" />
</Button>
EOF

# 3. Review and adjust inconsistent usage
# (Manual review of outliers)
```

**Verification Checklist**:
- [ ] Guidelines document created
- [ ] Current usage audited and documented
- [ ] Inconsistencies reviewed
- [ ] Team agrees on guidelines

**Documentation**:
```
Button Variant Distribution:
- outline: 75 usages (65%)
- ghost: 17 usages (15%)
- secondary: 11 usages (9%)
- destructive: 9 usages (8%)
- default: 3 usages (3%)

Size Distribution:
- sm: 70 usages (61%)
- default: 45 usages (39%)

Guidelines Document: client/src/components/ui/BUTTON_GUIDELINES.md

Commit Hash: [git hash]
```

---

## Phase 4: Design System Implementation (Days 8-10)

### Task 4.1: Create Design Token System
**Priority**: P2
**Estimated Time**: 3 hours
**Success Criteria**:
- Centralized color/spacing tokens
- All components use tokens
- Easy to modify theme

**Implementation Steps**:
```bash
# 1. Create design tokens file
cat > client/src/styles/design-tokens.ts << 'EOF'
export const colors = {
  // Primary palette
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },

  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Neutral grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    500: '#6b7280',
    700: '#374151',
    900: '#111827',
  },
};

export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  xxl: '3rem',    // 48px
};

export const borderRadius = {
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  full: '9999px',
};

export const fontSize = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
};
EOF

# 2. Update tailwind.config.js to use tokens
# Add to theme.extend:
# colors: {
#   primary: colors.primary,
#   success: colors.success,
#   ...
# }

# 3. Create example component using tokens
# (Documentation pattern)
```

**Verification Checklist**:
- [ ] design-tokens.ts created
- [ ] Tailwind config updated
- [ ] Tokens work in components
- [ ] Documentation includes examples

**Documentation**:
```
Design Tokens Created:
- Colors: 3 palettes (primary, status, neutral)
- Spacing: 6 sizes (xs to xxl)
- Border Radius: 4 sizes
- Font Sizes: 6 sizes

Tailwind Integration: ✓
Example Usage:
className="bg-primary-500 text-white p-md rounded-lg"

Commit Hash: [git hash]
```

---

### Task 4.2: Component Documentation
**Priority**: P2
**Estimated Time**: 2 hours
**Success Criteria**:
- Top 10 components documented
- Usage examples for each
- Props documented

**Implementation Steps**:
```bash
# Create component library documentation
cat > client/src/components/ui/COMPONENT_LIBRARY.md << 'EOF'
# UI Component Library

## Usage Statistics
- Total Components: 22 (after cleanup)
- Most Used: Button (46x), Card (37x), Input (29x)

## Core Components

### Button
**Usage**: 46 instances across 15+ pages
**Props**:
- variant: "default" | "outline" | "ghost" | "destructive"
- size: "default" | "sm" | "lg"
- aria-label: string (required for icon buttons)

**Examples**:
```tsx
// Primary action
<Button variant="outline" size="sm">Save Changes</Button>

// Destructive action
<Button variant="destructive" size="sm">Delete User</Button>

// Icon button
<Button variant="ghost" size="sm" aria-label="Edit item">
  <PencilIcon className="h-4 w-4" />
</Button>
```

### Card
**Usage**: 37 instances
**Sub-components**: CardContent, CardHeader, CardTitle, CardDescription

**Example**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Energy Overview</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Monthly consumption: 1,234 kWh</p>
  </CardContent>
</Card>
```

### Input
**Usage**: 29 instances
**Props**:
- type: string
- placeholder: string
- id: string (for label association)

**Example**:
```tsx
<div>
  <Label htmlFor="email">Email Address</Label>
  <Input
    id="email"
    type="email"
    placeholder="user@example.com"
    aria-describedby="email-error"
  />
</div>
```

[... document remaining 7 components]
EOF
```

**Verification Checklist**:
- [ ] Documentation covers top 10 components
- [ ] All examples are valid code
- [ ] Props documented with types
- [ ] Usage patterns clear

**Documentation**:
```
Components Documented: 10
Examples Provided: 25+
File: client/src/components/ui/COMPONENT_LIBRARY.md

Documented Components:
1. Button (46 usages)
2. Card (37 usages)
3. Input (29 usages)
4. Badge (22 usages)
5. Select (20 usages)
6. Label (20 usages)
7. Dialog (17 usages)
8. Tabs (13 usages)
9. Table (11 usages)
10. Textarea (10 usages)

Commit Hash: [git hash]
```

---

## Phase 5: Quality Assurance & Testing (Days 11-14)

### Task 5.1: Automated Bundle Size Monitoring
**Priority**: P1
**Estimated Time**: 1 hour
**Success Criteria**:
- Bundle size tracked in CI
- Alert if bundle grows >50KB
- Historical tracking

**Implementation Steps**:
```bash
# 1. Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# 2. Update vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});

# 3. Create size tracking script
cat > scripts/track-bundle-size.sh << 'EOF'
#!/bin/bash
npm run build
BUNDLE_SIZE=$(du -sk dist/assets/*.js | awk '{sum+=$1} END {print sum}')
echo "Bundle size: ${BUNDLE_SIZE}KB"

# Compare with baseline (200KB reduction expected)
BASELINE=2100  # KB before cleanup
CURRENT=$BUNDLE_SIZE
REDUCTION=$((BASELINE - CURRENT))

echo "Baseline: ${BASELINE}KB"
echo "Current: ${CURRENT}KB"
echo "Reduction: ${REDUCTION}KB"

if [ $REDUCTION -lt 150 ]; then
  echo "WARNING: Expected 200KB reduction, got ${REDUCTION}KB"
  exit 1
fi

echo "✓ Bundle size optimized successfully"
EOF

chmod +x scripts/track-bundle-size.sh

# 4. Run verification
./scripts/track-bundle-size.sh
```

**Verification Checklist**:
- [ ] Visualizer installed and configured
- [ ] Bundle analysis generated
- [ ] Tracking script works
- [ ] Size reduction verified (>150KB)

**Documentation**:
```
Bundle Size Analysis:

Before Cleanup:
- Total Bundle: 2,100 KB
- Main Chunk: 1,800 KB
- Vendor Chunk: 300 KB

After Cleanup:
- Total Bundle: [X] KB
- Main Chunk: [Y] KB
- Vendor Chunk: [Z] KB

Reduction: [~200] KB (-9.5%)

Analysis File: dist/bundle-analysis.html

Commit Hash: [git hash]
```

---

### Task 5.2: Accessibility Audit
**Priority**: P1
**Estimated Time**: 2 hours
**Success Criteria**:
- Lighthouse accessibility score >90
- All WCAG 2.1 AA issues resolved
- Keyboard navigation tested

**Implementation Steps**:
```bash
# 1. Install accessibility testing tools
npm install --save-dev axe-core @axe-core/react

# 2. Add to development environment
# In client/src/main.tsx (development only):
if (import.meta.env.DEV) {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000);
  });
}

# 3. Run Lighthouse audit
# Open Chrome DevTools > Lighthouse > Accessibility

# 4. Create keyboard navigation checklist
cat > test/accessibility-checklist.md << 'EOF'
# Accessibility Testing Checklist

## Keyboard Navigation
- [ ] Tab order is logical and sequential
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are clearly visible
- [ ] Escape key closes dialogs and modals
- [ ] Enter/Space activates buttons
- [ ] Arrow keys navigate lists and menus

## Screen Reader Testing
- [ ] All images have alt text
- [ ] All buttons have accessible names
- [ ] Form inputs have associated labels
- [ ] Error messages are announced
- [ ] Dynamic content changes are announced

## Visual Accessibility
- [ ] Color contrast ratio >4.5:1 for text
- [ ] Interactive elements >44x44px touch target
- [ ] Focus indicators visible in all themes
- [ ] Text can be resized to 200% without breaking

## ARIA
- [ ] ARIA labels on icon buttons
- [ ] ARIA-describedby on form errors
- [ ] ARIA-live regions for notifications
- [ ] Modal focus management
EOF

# 5. Manual testing
# Use NVDA/VoiceOver to navigate through each page
```

**Verification Checklist**:
- [ ] Axe DevTools installed
- [ ] Lighthouse score documented
- [ ] Keyboard navigation tested
- [ ] Screen reader tested
- [ ] All issues from checklist resolved

**Documentation**:
```
Lighthouse Accessibility Score:
Before: [baseline score]
After: [current score]
Target: >90

WCAG 2.1 AA Compliance:
- Level A: [X/Y issues resolved]
- Level AA: [X/Y issues resolved]

Keyboard Navigation: ✓ Passed
Screen Reader Testing: ✓ Passed

Issues Found: [count]
Issues Resolved: [count]
Remaining Issues: [list with justification]

Tools Used:
- Axe DevTools
- Chrome Lighthouse
- NVDA Screen Reader

Commit Hash: [git hash]
```

---

### Task 5.3: Frontend Integration Testing
**Priority**: P1
**Estimated Time**: 3 hours
**Success Criteria**:
- All critical user flows tested
- No regressions from cleanup
- Performance benchmarks met

**Implementation Steps**:
```bash
# 1. Create test checklist
cat > test/integration-test-checklist.md << 'EOF'
# Frontend Integration Test Checklist

## Authentication Flow
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout functionality
- [ ] Session timeout warning
- [ ] Password reset flow

## Dashboard & Navigation
- [ ] Dashboard loads all widgets
- [ ] Navigation between pages works
- [ ] Breadcrumbs update correctly
- [ ] User menu displays correctly

## Object Management
- [ ] Object list loads and displays
- [ ] Object details page loads
- [ ] Object filtering works
- [ ] Object search works
- [ ] Pagination works

## Energy Monitoring
- [ ] Charts render correctly
- [ ] Data refreshes on interval
- [ ] Date range selector works
- [ ] Export functionality works

## User Management (Admin)
- [ ] User list loads
- [ ] Create new user
- [ ] Edit user details
- [ ] Delete user (with confirmation)
- [ ] Role assignment works

## Forms & Validation
- [ ] Required field validation
- [ ] Email format validation
- [ ] Error messages display
- [ ] Success messages display
- [ ] Form submission works

## Performance
- [ ] Initial page load <3s
- [ ] Navigation <500ms
- [ ] Chart rendering <1s
- [ ] No memory leaks (24h test)
EOF

# 2. Manual testing
npm run dev
# Test all items in checklist

# 3. Performance benchmarks
# Use Chrome DevTools Performance tab
# Record: Dashboard load, Object list load, Chart rendering

# 4. Document results
```

**Verification Checklist**:
- [ ] All test scenarios executed
- [ ] No critical failures
- [ ] Performance within targets
- [ ] Screenshots of key flows
- [ ] All issues documented

**Documentation**:
```
Integration Test Results:

Test Scenarios: 25
Passed: [X]
Failed: [Y]
Blocked: [Z]

Critical Failures: [none/list]

Performance Benchmarks:
- Dashboard Load: [X]ms (target: <3000ms)
- Object List: [X]ms (target: <2000ms)
- Chart Render: [X]ms (target: <1000ms)
- Navigation: [X]ms (target: <500ms)

Regressions Found: [none/list]

Test Environment:
- Browser: Chrome 120
- OS: [system]
- Network: Fast 3G throttled

Commit Hash: [git hash]
```

---

## Final Deliverables

### Required Artifacts
1. **Pull Request**: Branch `cleanup/frontend-dead-code` → `main`
2. **Bundle Analysis Report**: `dist/bundle-analysis.html`
3. **Accessibility Report**: Lighthouse scores + manual testing results
4. **Component Documentation**: `COMPONENT_LIBRARY.md`
5. **Design Tokens**: `design-tokens.ts`
6. **Test Results**: All checklists completed

### Success Metrics
- **Dead Code**: 0% (from 15%)
- **Bundle Size**: -200KB minimum
- **UI Components**: 22/22 used (100%)
- **Import Consistency**: 100% double quotes
- **Accessibility Score**: >90
- **Build Time**: <45s (15% improvement)

### Git Workflow
```bash
# 1. Create branch
git checkout -b cleanup/frontend-dead-code

# 2. Commit after each phase
git add .
git commit -m "Phase 1: Delete unused page components and UI library cleanup

- Removed 5 unused page components (2,940 lines)
- Removed 26 unused UI components (54% of library)
- Bundle size reduced by 205KB
- All routes verified functional
- No regressions found"

# 3. Push and create PR
git push origin cleanup/frontend-dead-code
gh pr create --title "Frontend Cleanup: Remove Dead Code & Standardize UI" \
  --body "$(cat todo/AGENT-A-FRONTEND-CLEANUP.md)"
```

---

## Dependencies & Coordination

### No Conflicts With Backend Work
This branch touches:
- `client/src/pages/*` - Frontend only
- `client/src/components/ui/*` - Frontend only
- `client/src/styles/*` - Frontend only
- Frontend config files only

### Safe to Merge Independently
- No API changes
- No database changes
- No server changes
- No shared code modifications

---

## Risk Mitigation

### Rollback Plan
```bash
# If issues found after merge:
git revert <commit-hash>
npm run build
npm run dev
# Verify application works
git push origin main
```

### Testing Before Merge
1. Full regression test suite
2. Manual testing of all critical flows
3. Bundle size verification
4. Performance benchmarks
5. Accessibility audit

---

**Created**: 2025-10-07
**Last Updated**: 2025-10-07
**Agent**: A (Frontend Cleanup)
**Status**: Ready to Start

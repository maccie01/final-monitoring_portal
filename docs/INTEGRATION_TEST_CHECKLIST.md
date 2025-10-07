# Frontend Integration Test Checklist

**Last Updated**: 2025-10-07
**Agent**: Frontend Cleanup & Optimization (Agent A)
**Branch**: `cleanup/frontend-dead-code`
**Test Environment**: Development (localhost:5173)

---

## Overview

This checklist ensures all critical user flows work correctly after frontend cleanup and optimization. All items should be tested manually before merging to main branch.

---

## Test Environment Setup

### Prerequisites
```bash
# Start development server
npm run dev

# Open browser
open http://localhost:5173

# Monitor console for errors
# Check Network tab for failed requests
# Verify no accessibility violations (axe-core)
```

### Test Browsers
- [ ] Chrome (latest) - Primary browser
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Test Devices
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## 1. Authentication Flow

### 1.1 Login
- [ ] Login page loads correctly
- [ ] Email input accepts valid email
- [ ] Password input masks characters
- [ ] "Show password" toggle works (if exists)
- [ ] Login button is clickable
- [ ] Valid credentials allow login
- [ ] Invalid credentials show error message
- [ ] Error message is accessible (screen reader)
- [ ] Loading state shown during authentication
- [ ] Redirect to dashboard after successful login

**Test Data**:
- Valid: `admin@example.com` / `[password]`
- Invalid: `wrong@example.com` / `wrong123`

**Expected Errors**:
- "Invalid credentials"
- "Email is required"
- "Password is required"

### 1.2 Logout
- [ ] Logout button visible in user menu
- [ ] Logout button accessible via keyboard
- [ ] Clicking logout clears session
- [ ] Redirect to login page after logout
- [ ] Cannot access protected pages after logout
- [ ] Session token cleared from storage

### 1.3 Session Management
- [ ] Session persists on page refresh
- [ ] Session timeout shows warning (if implemented)
- [ ] Expired session redirects to login
- [ ] Token refresh works (if implemented)

---

## 2. Dashboard & Navigation

### 2.1 Dashboard Loading
- [ ] Dashboard loads after login
- [ ] All widgets/cards render correctly
- [ ] No console errors on load
- [ ] No failed network requests
- [ ] Loading skeletons shown (if implemented)
- [ ] Data populates after loading

**Key Metrics to Verify**:
- Total energy consumption
- Number of monitored objects
- System status
- Recent alerts/notifications

### 2.2 Main Navigation
- [ ] Sidebar/header navigation visible
- [ ] All menu items clickable
- [ ] Current page highlighted in navigation
- [ ] Navigation works with keyboard (Tab + Enter)
- [ ] Mobile menu toggle works (on mobile)
- [ ] Navigation accessible to screen readers

**Routes to Test**:
- [ ] `/` or `/dashboard` - Dashboard
- [ ] `/objects` - Object List
- [ ] `/network-monitor` - Network Monitor
- [ ] `/users` - User Management (admin only)
- [ ] `/settings` - Settings

### 2.3 Page Transitions
- [ ] Clicking nav items loads new page
- [ ] URL updates correctly
- [ ] Browser back/forward buttons work
- [ ] Page title updates (check browser tab)
- [ ] No flash of unstyled content
- [ ] Smooth transitions (no jarring layout shifts)

---

## 3. Object Management

### 3.1 Object List Page
- [ ] Object list loads and displays
- [ ] All columns visible (name, status, type, etc.)
- [ ] Data matches expected format
- [ ] Empty state shown when no objects (if applicable)
- [ ] Loading state shown while fetching

**Verify Data Display**:
- [ ] Object names displayed
- [ ] Status badges shown with correct colors
- [ ] Icons/avatars render
- [ ] Timestamps formatted correctly

### 3.2 Object Filtering
- [ ] Search/filter input visible
- [ ] Typing in search filters results
- [ ] Filter updates in real-time
- [ ] Clear filter button works (if exists)
- [ ] "No results" message shown when appropriate
- [ ] Filter persists during pagination (if applicable)

**Test Filters**:
- [ ] Search by name
- [ ] Filter by status (Online, Offline, Warning)
- [ ] Filter by type
- [ ] Combined filters work together

### 3.3 Object Details Page
- [ ] Clicking object opens details page
- [ ] All object information displayed
- [ ] Charts/graphs render correctly
- [ ] Historical data loads
- [ ] Action buttons visible and functional
- [ ] Breadcrumb navigation shows path

**Test Actions**:
- [ ] Edit object details
- [ ] View consumption history
- [ ] Export data (if implemented)
- [ ] Delete object (with confirmation)

### 3.4 Pagination
- [ ] Pagination controls visible (if >10 items)
- [ ] Next/previous buttons work
- [ ] Page numbers clickable
- [ ] Current page highlighted
- [ ] Data updates when changing pages
- [ ] Keyboard navigation works (Tab to page numbers)

---

## 4. Energy Monitoring

### 4.1 Charts & Visualizations
- [ ] Energy consumption chart renders
- [ ] Chart data loads correctly
- [ ] Chart axes labeled properly
- [ ] Chart legend visible
- [ ] Chart colors distinguishable
- [ ] Chart tooltips show on hover
- [ ] Chart is responsive (resizes with window)

**Test Chart Types**:
- [ ] Line chart (consumption over time)
- [ ] Bar chart (comparison)
- [ ] Pie chart (distribution) - if exists
- [ ] Area chart (cumulative) - if exists

### 4.2 Date Range Selector
- [ ] Date range picker visible
- [ ] Clicking opens date picker
- [ ] Can select start date
- [ ] Can select end date
- [ ] Date range validates (end > start)
- [ ] Chart updates after date selection
- [ ] Preset ranges work (Today, Week, Month)

**Test Presets**:
- [ ] Today
- [ ] Last 7 days
- [ ] Last 30 days
- [ ] Custom range

### 4.3 Data Refresh
- [ ] Manual refresh button works
- [ ] Auto-refresh indicator shown (if enabled)
- [ ] Data updates without full page reload
- [ ] Loading indicator shown during refresh
- [ ] No duplicate requests

### 4.4 Export Functionality
- [ ] Export button visible
- [ ] Export dialog opens
- [ ] Can select export format (CSV, Excel, PDF)
- [ ] Export includes correct data
- [ ] Export file downloads successfully
- [ ] Export filename is descriptive

---

## 5. User Management (Admin Only)

### 5.1 User List
- [ ] User list loads and displays
- [ ] All users shown with details (name, email, role)
- [ ] Status badges shown (Active, Inactive)
- [ ] Action buttons visible (Edit, Delete)
- [ ] Search/filter works

### 5.2 Create New User
- [ ] "Add User" button visible
- [ ] Dialog/page opens on click
- [ ] All form fields render
- [ ] Form validation works
- [ ] Required field errors shown
- [ ] Email format validated
- [ ] Password requirements shown
- [ ] Role selector works
- [ ] Submit button creates user
- [ ] Success message shown
- [ ] User list updates with new user

**Test Form Fields**:
- [ ] Name (required)
- [ ] Email (required, valid format)
- [ ] Password (required, min length)
- [ ] Role (required, dropdown)

### 5.3 Edit User
- [ ] Edit button opens edit dialog/page
- [ ] Form pre-populated with current data
- [ ] Can modify all fields
- [ ] Changes save correctly
- [ ] User list updates
- [ ] Success message shown

### 5.4 Delete User
- [ ] Delete button visible
- [ ] Confirmation dialog shown
- [ ] Cancel button works (no deletion)
- [ ] Confirm button deletes user
- [ ] User removed from list
- [ ] Success message shown
- [ ] Cannot delete own account (if rule exists)

---

## 6. Forms & Validation

### 6.1 Form Field Validation
- [ ] Required fields show error when empty
- [ ] Email fields validate format
- [ ] Number fields accept only numbers
- [ ] Password fields enforce requirements
- [ ] Date fields validate format
- [ ] URL fields validate format

**Test Invalid Inputs**:
- Email: `notanemail`, `@example.com`, `user@`
- Number: `abc`, `12.34.56`
- Date: `99/99/9999`, `2025-13-01`

### 6.2 Error Messages
- [ ] Error messages displayed clearly
- [ ] Error messages describe the problem
- [ ] Error messages suggest how to fix
- [ ] Error messages accessible (aria-describedby)
- [ ] Field border/background indicates error
- [ ] Multiple errors shown simultaneously

### 6.3 Success Messages
- [ ] Success message shown after form submission
- [ ] Success message auto-dismisses (after 3-5s)
- [ ] Success message can be manually dismissed
- [ ] Success message accessible (aria-live)

### 6.4 Form Submission
- [ ] Submit button disabled during submission
- [ ] Loading indicator shown
- [ ] Form cannot be submitted twice
- [ ] Network errors handled gracefully
- [ ] Validation errors prevent submission
- [ ] Successful submission clears form (if appropriate)

---

## 7. Dialogs & Modals

### 7.1 Dialog Behavior
- [ ] Dialog opens on trigger click
- [ ] Dialog overlay visible (backdrop)
- [ ] Background content dimmed/blurred
- [ ] Close button (X) visible
- [ ] Clicking overlay closes dialog (if enabled)
- [ ] Escape key closes dialog
- [ ] Focus moves to dialog when opened
- [ ] Focus returns to trigger when closed

**Test Dialogs**:
- [ ] Confirmation dialog (Delete actions)
- [ ] Form dialog (Create/Edit user)
- [ ] Info dialog (Details/Help)

### 7.2 Focus Trap
- [ ] Tab cycles through dialog elements only
- [ ] Cannot tab to background content
- [ ] Shift+Tab works in reverse
- [ ] Focus visible on all elements
- [ ] First focusable element focused on open

---

## 8. Tables & Data Display

### 8.1 Table Structure
- [ ] Table renders with correct columns
- [ ] Table header visible
- [ ] Table rows display data
- [ ] Empty state shown for no data
- [ ] Loading state shown while fetching

### 8.2 Table Sorting
- [ ] Column headers clickable for sorting
- [ ] Sort indicator shown (▲/▼)
- [ ] Ascending/descending toggle works
- [ ] Data sorts correctly
- [ ] Multi-column sort works (if implemented)

**Test Sortable Columns**:
- [ ] Name (alphabetical)
- [ ] Date (chronological)
- [ ] Number (numerical)
- [ ] Status (categorical)

### 8.3 Table Actions
- [ ] Row action buttons visible
- [ ] Action buttons keyboard accessible
- [ ] Icon buttons have aria-label ✅ (Task 3.1)
- [ ] Bulk actions work (if implemented)
- [ ] Select all checkbox works (if implemented)

---

## 9. Responsive Design

### 9.1 Mobile Layout (375px width)
- [ ] Navigation collapses to hamburger menu
- [ ] Tables scroll horizontally or stack
- [ ] Cards stack vertically
- [ ] Forms remain usable
- [ ] Buttons large enough to tap (44x44px)
- [ ] Text remains readable (no tiny fonts)
- [ ] No horizontal scrolling (except tables)

### 9.2 Tablet Layout (768px width)
- [ ] Layout adapts to medium screen
- [ ] Sidebar behavior changes (if applicable)
- [ ] Cards arrange in 2-column grid
- [ ] Charts resize appropriately
- [ ] Touch targets adequate

### 9.3 Desktop Layout (1920px width)
- [ ] Full navigation visible
- [ ] Content uses available space
- [ ] No excessive white space
- [ ] Charts utilize full width
- [ ] Multi-column layouts where appropriate

---

## 10. Performance Benchmarks

### 10.1 Initial Page Load
**Target**: <3 seconds (Fast 3G)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Time to First Byte (TTFB) | <800ms | ___ | [ ] |
| First Contentful Paint (FCP) | <1.5s | ___ | [ ] |
| Largest Contentful Paint (LCP) | <2.5s | ___ | [ ] |
| Time to Interactive (TTI) | <4.0s | ___ | [ ] |
| Cumulative Layout Shift (CLS) | <0.1 | ___ | [ ] |

**How to Measure**: Chrome DevTools > Lighthouse

### 10.2 Navigation Performance
- [ ] Page navigation <500ms
- [ ] No layout shift during navigation
- [ ] Smooth transitions
- [ ] No flash of unstyled content

**Test**: Navigate between pages and measure time

### 10.3 Chart Rendering
- [ ] Chart appears <1 second after data load
- [ ] Chart interaction smooth (hover, zoom)
- [ ] Chart resize smooth
- [ ] No frame drops during animation

**Test**: Navigate to charts page with DevTools Performance tab recording

### 10.4 Memory Usage
- [ ] No memory leaks after 30 minutes of use
- [ ] Memory usage stable during navigation
- [ ] No excessive DOM nodes (Chrome DevTools Memory)

**Test**: Chrome DevTools > Memory > Take Heap Snapshot

---

## 11. Error Handling

### 11.1 Network Errors
- [ ] Lost connection handled gracefully
- [ ] Error message shown to user
- [ ] Retry mechanism available
- [ ] Offline indicator shown (if implemented)

**Test**: Disable network in DevTools and trigger actions

### 11.2 API Errors
- [ ] 400 errors show user-friendly message
- [ ] 401 errors redirect to login
- [ ] 403 errors show permission denied
- [ ] 404 errors show not found message
- [ ] 500 errors show server error message

**Test**: Mock API errors (if possible)

### 11.3 Client Errors
- [ ] JavaScript errors don't crash app
- [ ] Error boundary catches React errors (if implemented)
- [ ] Console errors logged but app continues
- [ ] User notified of error (if critical)

---

## 12. Browser Compatibility

### 12.1 Chrome (Latest)
- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly
- [ ] Performance acceptable

### 12.2 Firefox (Latest)
- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly
- [ ] Performance acceptable

### 12.3 Safari (Latest)
- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly
- [ ] Performance acceptable
- [ ] Date pickers work (native vs custom)

### 12.4 Edge (Latest)
- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly

---

## 13. Regression Testing (After Cleanup)

### 13.1 Verify No Breaking Changes
- [ ] All previously working features still work
- [ ] No new console errors
- [ ] No missing components (accidentally deleted)
- [ ] No broken imports
- [ ] No styling regressions

### 13.2 Cleanup Verification
- [ ] Unused components removed (Task 1.2) ✅
- [ ] Imports use double quotes (Task 2.1) ✅
- [ ] Icon buttons have aria-label (Task 3.1) ✅
- [ ] Button variants consistent (Task 3.2) ✅
- [ ] Design tokens available (Task 4.1) ✅
- [ ] Component docs complete (Task 4.2) ✅
- [ ] Bundle analysis working (Task 5.1) ✅
- [ ] Accessibility audit active (Task 5.2) ✅

### 13.3 Build Verification
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Bundle size acceptable (<2.5MB)
- [ ] Production build works (test built files)

---

## Test Results Template

### Test Session Information
```
Date: _______________
Tester: _______________
Branch: cleanup/frontend-dead-code
Commit: _______________
Browser: _______________ (version)
OS: _______________
Screen Size: _______________
```

### Summary
```
Total Tests: ___
Passed: ___
Failed: ___
Blocked: ___

Pass Rate: ____%
```

### Issues Found
```
1. [Severity] Description
   Steps to Reproduce:
   Expected:
   Actual:

2. [Severity] Description
   ...
```

### Performance Results
```
Lighthouse Score: ___/100
- Performance: ___
- Accessibility: ___
- Best Practices: ___
- SEO: ___

Page Load Time: ___s
Bundle Size: ___KB
```

---

## Critical User Flows (Priority Testing)

### Flow 1: Login → View Dashboard → View Object Details
1. Navigate to login page
2. Enter credentials and log in
3. Verify dashboard loads
4. Click on an object
5. Verify object details load
6. **Expected**: Complete flow without errors in <10 seconds

### Flow 2: Create New User (Admin)
1. Log in as admin
2. Navigate to User Management
3. Click "Add User"
4. Fill in form
5. Submit
6. **Expected**: New user created, appears in list

### Flow 3: View Energy Consumption
1. Navigate to Energy Monitoring
2. Select date range
3. View chart
4. Export data
5. **Expected**: Chart renders, export downloads

---

## Sign-Off

### Manual Testing Complete
- [ ] All critical flows tested
- [ ] All high-priority pages tested
- [ ] All browsers tested
- [ ] Mobile responsive verified
- [ ] Performance benchmarks met
- [ ] No critical bugs found

### Accessibility Verified
- [ ] axe-core shows no violations
- [ ] Keyboard navigation works
- [ ] Screen reader tested (NVDA/VoiceOver)
- [ ] Color contrast verified
- [ ] Lighthouse accessibility >90

### Ready for Merge
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Progress log updated
- [ ] Git commits clean and descriptive
- [ ] No uncommitted changes

**Tester Signature**: _______________
**Date**: _______________

---

**Maintained by**: Frontend Cleanup Agent
**Status**: Active Testing
**Last Updated**: 2025-10-07

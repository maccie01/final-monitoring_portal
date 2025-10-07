# Accessibility Testing Checklist

**Last Updated**: 2025-10-07
**Agent**: Frontend Cleanup & Optimization (Agent A)
**Branch**: `cleanup/frontend-dead-code`
**WCAG Version**: 2.1 Level AA

---

## Overview

This checklist ensures the Netzwächter application meets WCAG 2.1 Level AA accessibility standards. All items should be tested and verified before merging frontend changes.

---

## 1. Keyboard Navigation

### 1.1 Tab Order
- [ ] Tab order is logical and follows visual order
- [ ] All interactive elements are reachable via keyboard
- [ ] Tab order skips hidden/disabled elements
- [ ] No keyboard traps (user can escape all interactions)
- [ ] Skip links provided for main content (if applicable)

**Test Method**: Navigate entire application using only Tab key

### 1.2 Focus Indicators
- [ ] All interactive elements show visible focus state
- [ ] Focus indicators have sufficient contrast (3:1 ratio minimum)
- [ ] Focus indicators are clearly visible in all themes
- [ ] Focus states don't disappear when hovering
- [ ] Custom focus styles match design system

**Test Method**: Tab through pages and verify focus ring visibility

### 1.3 Keyboard Shortcuts
- [ ] Escape key closes all dialogs and modals
- [ ] Enter/Space activates all buttons
- [ ] Enter submits forms
- [ ] Arrow keys navigate within select menus (if applicable)
- [ ] Custom shortcuts documented and don't conflict with browser/AT

**Test Method**: Test all interactive components with keyboard only

### 1.4 Interactive Elements
- [ ] All buttons are keyboard accessible
- [ ] All links are keyboard accessible
- [ ] All form controls are keyboard accessible
- [ ] All custom widgets support keyboard interaction
- [ ] Tooltips appear on keyboard focus (not just hover)

**Test Method**: Complete key user flows using only keyboard

---

## 2. Screen Reader Testing

### 2.1 Alternative Text
- [ ] All images have descriptive alt text
- [ ] Decorative images have empty alt attribute (`alt=""`)
- [ ] Icon buttons have accessible names (aria-label)
- [ ] Charts and graphs have text alternatives
- [ ] Complex images have long descriptions (aria-describedby)

**Test Method**: Review all `<img>` and icon usage

### 2.2 Form Accessibility
- [ ] All form inputs have associated labels
- [ ] Labels are properly linked (htmlFor/id matching)
- [ ] Required fields are marked (aria-required or required)
- [ ] Error messages are announced (aria-describedby)
- [ ] Field hints are associated (aria-describedby)
- [ ] Field groups use fieldset/legend
- [ ] Select menus announce current value

**Test Method**: Navigate forms with NVDA/JAWS/VoiceOver

### 2.3 Dynamic Content
- [ ] Loading states are announced (aria-live="polite")
- [ ] Error messages are announced (aria-live="assertive")
- [ ] Success notifications are announced
- [ ] Content updates don't interrupt reading
- [ ] Infinite scroll/pagination is accessible

**Test Method**: Trigger dynamic updates and verify announcements

### 2.4 Headings & Structure
- [ ] Page has single H1 heading
- [ ] Heading hierarchy is logical (no skipped levels)
- [ ] Headings describe content sections
- [ ] Landmarks used appropriately (header, nav, main, aside, footer)
- [ ] Skip links to main content

**Test Method**: Use HeadingsMap browser extension

### 2.5 Links & Buttons
- [ ] Link text is descriptive (no "click here")
- [ ] Links announce purpose and destination
- [ ] Buttons announce their action
- [ ] Icon-only buttons have aria-label
- [ ] Button states announced (pressed, expanded, etc.)

**Test Method**: Navigate with screen reader and verify announcements

---

## 3. Visual Accessibility

### 3.1 Color Contrast
- [ ] Normal text: 4.5:1 contrast ratio minimum
- [ ] Large text (18pt+): 3:1 contrast ratio minimum
- [ ] UI components: 3:1 contrast ratio minimum
- [ ] Focus indicators: 3:1 contrast ratio minimum
- [ ] Disabled elements visually distinct

**Test Method**: Use WebAIM Contrast Checker or axe DevTools

**Current Status (Netzwächter)**:
- Primary text on white: ✅ Passes (gray-900 on white = 17:1)
- Link blue on white: ✅ Passes (blue-600 on white = 7:1)
- Button borders: ✅ Passes (border-input)
- Badge backgrounds: ⚠️ Needs verification

### 3.2 Touch Targets
- [ ] All interactive elements minimum 44x44 CSS pixels
- [ ] Adequate spacing between touch targets (8px minimum)
- [ ] Buttons not too close to screen edges
- [ ] Small touch targets have large padding

**Test Method**: Test on mobile device (375px width)

### 3.3 Text Resizing
- [ ] Text can be resized to 200% without loss of content
- [ ] Horizontal scrolling not required at 200% zoom
- [ ] No text truncation at 200% zoom
- [ ] Layout adapts to larger text sizes

**Test Method**: Zoom browser to 200% and verify all pages

### 3.4 Visual Cues
- [ ] Information not conveyed by color alone
- [ ] Icons paired with text labels where possible
- [ ] Error states use icons + text (not just red color)
- [ ] Status indicators use color + icon/text
- [ ] Required fields marked with * and label text

**Test Method**: Use grayscale mode and verify comprehension

---

## 4. ARIA Usage

### 4.1 ARIA Labels
- [x] All icon-only buttons have aria-label ✅ (Task 3.1 complete)
- [ ] Complex widgets have aria-label or aria-labelledby
- [ ] Form inputs use aria-label when visual label not possible
- [ ] Navigation landmarks have aria-label when multiple exist
- [ ] SVG icons have aria-hidden="true" or proper role

**Test Method**: Review all ARIA attributes with axe DevTools

### 4.2 ARIA States
- [ ] Expandable elements use aria-expanded
- [ ] Toggleable buttons use aria-pressed
- [ ] Selected items use aria-selected
- [ ] Current page link has aria-current="page"
- [ ] Disabled elements use aria-disabled (or disabled attribute)

**Test Method**: Test interactive components and verify states

### 4.3 ARIA Relationships
- [ ] Error messages linked with aria-describedby
- [ ] Field hints linked with aria-describedby
- [ ] Tabs linked to tab panels (aria-controls)
- [ ] Comboboxes linked to options (aria-owns/aria-controls)
- [ ] Dialog titles linked with aria-labelledby

**Test Method**: Review component implementations

### 4.4 ARIA Roles
- [ ] Custom widgets have appropriate roles
- [ ] Role matches actual behavior
- [ ] No redundant roles (e.g., role="button" on <button>)
- [ ] Dialog/modal has role="dialog"
- [ ] Alert messages have role="alert" or aria-live

**Test Method**: Validate HTML with aXe or WAVE

---

## 5. Forms & Validation

### 5.1 Form Structure
- [ ] All inputs have accessible names
- [ ] Related fields grouped with fieldset
- [ ] Required fields clearly marked
- [ ] Optional fields marked (if majority are required)
- [ ] Form purpose is clear from heading/context

**Test Method**: Navigate forms with keyboard + screen reader

### 5.2 Error Handling
- [ ] Errors announced to screen readers
- [ ] Errors clearly identify which field has problem
- [ ] Errors suggest how to fix the problem
- [ ] Focus moves to first error on submit
- [ ] Errors visible without scrolling
- [ ] Errors don't rely on color alone

**Test Method**: Submit invalid forms and verify error handling

### 5.3 Input Assistance
- [ ] Placeholder text not only way to identify input
- [ ] Format requirements stated in label or hint
- [ ] Autocomplete attributes used where appropriate
- [ ] Date pickers keyboard accessible
- [ ] File uploads keyboard accessible

**Test Method**: Fill out all forms with keyboard only

---

## 6. Modal & Dialog Accessibility

### 6.1 Focus Management
- [ ] Focus moves to dialog when opened
- [ ] Focus trapped within dialog while open
- [ ] Focus returns to trigger element when closed
- [ ] First focusable element receives focus (or close button)
- [ ] Escape key closes dialog

**Test Method**: Open dialogs and verify focus behavior

### 6.2 Dialog Structure
- [ ] Dialog has role="dialog" or role="alertdialog"
- [ ] Dialog has accessible name (aria-labelledby)
- [ ] Dialog description provided (aria-describedby)
- [ ] Background content is inert (aria-hidden or inert attribute)
- [ ] Close button visible and accessible

**Test Method**: Review Dialog component implementation

**Current Status (Netzwächter)**:
- Dialog component from Radix UI: ✅ Built-in accessibility
- Focus trap: ✅ Automatic
- Escape to close: ✅ Automatic
- Close button: ✅ Included with aria-label

---

## 7. Tables & Data Grids

### 7.1 Table Structure
- [ ] Data tables use proper table elements
- [ ] Tables have caption or aria-label
- [ ] Header cells use <th> with scope attribute
- [ ] Complex headers use aria-labelledby
- [ ] Empty cells handled appropriately

**Test Method**: Review all table implementations

### 7.2 Sortable Tables
- [ ] Sort controls are keyboard accessible
- [ ] Current sort direction announced
- [ ] Sort changes announced (aria-live)
- [ ] Visual sort indicators present

**Test Method**: Test table sorting with screen reader

---

## 8. Media & Content

### 8.1 Images & Graphics
- [ ] All informative images have alt text
- [ ] Decorative images have alt="" or aria-hidden
- [ ] Complex images have detailed descriptions
- [ ] Image maps have alt text for each area
- [ ] SVG graphics have proper ARIA labels

**Test Method**: Review all image usage

### 8.2 Charts & Visualizations
- [ ] Charts have text alternative (table or description)
- [ ] Chart data available in accessible format
- [ ] Color not only way to distinguish data series
- [ ] Chart labels programmatically associated
- [ ] Interactive charts keyboard accessible

**Test Method**: Navigate energy monitoring charts

**Current Status (Netzwächter)**:
- Recharts library used for charts
- ⚠️ Needs text alternative or data table
- ⚠️ Verify keyboard accessibility

---

## 9. Performance & User Experience

### 9.1 Loading States
- [ ] Loading indicators announced to screen readers
- [ ] Skeleton screens don't confuse screen readers
- [ ] Long operations show progress indication
- [ ] Timeout warnings given (if applicable)
- [ ] Auto-refresh announced (if applicable)

**Test Method**: Test slow network scenarios

### 9.2 Session Management
- [ ] Session timeout warnings provided
- [ ] User can extend session without losing data
- [ ] Re-authentication preserves context
- [ ] Logout is obvious and accessible

**Test Method**: Test session timeout behavior

---

## 10. Browser & Assistive Technology Testing

### 10.1 Browser Compatibility
- [ ] Tested in Chrome (latest)
- [ ] Tested in Firefox (latest)
- [ ] Tested in Safari (latest)
- [ ] Tested in Edge (latest)
- [ ] Tested on mobile browsers

### 10.2 Screen Reader Testing
- [ ] NVDA + Firefox (Windows)
- [ ] JAWS + Chrome (Windows)
- [ ] VoiceOver + Safari (macOS)
- [ ] VoiceOver + Safari (iOS)
- [ ] TalkBack + Chrome (Android)

**Minimum Testing**: NVDA + Firefox for primary validation

### 10.3 Other Assistive Technologies
- [ ] Voice control (Dragon, Voice Control)
- [ ] Screen magnification (Windows Magnifier, ZoomText)
- [ ] Switch access (if applicable)

---

## Testing Tools

### Automated Tools
1. **axe DevTools** (Browser Extension)
   - Install: Chrome/Firefox/Edge extension
   - Run on each major page
   - Fix all issues before manual testing

2. **axe-core in Development** ✅ Installed
   - Integrated in client/src/main.tsx
   - Runs automatically in dev mode
   - Reports issues to console

3. **WAVE** (WebAIM)
   - Browser extension
   - Visual feedback on page
   - Good for quick checks

4. **Lighthouse** (Chrome DevTools)
   - Built into Chrome
   - Accessibility score + specific issues
   - Performance metrics bonus

### Manual Testing Tools
1. **HeadingsMap** - Verify heading structure
2. **WebAIM Contrast Checker** - Check color contrast
3. **Keyboard** - Tab through entire app
4. **Screen Reader** - NVDA (free), JAWS (paid), VoiceOver (macOS/iOS)

---

## Testing Procedure

### For Each Page/Component
1. Run automated scan (axe DevTools)
2. Fix all automated issues
3. Test keyboard navigation
4. Test with screen reader
5. Check color contrast
6. Verify ARIA usage
7. Document results

### Priority Pages
1. **Login/Authentication** - P0 (Critical)
2. **Dashboard** - P0 (Critical)
3. **Object Management** - P0 (Critical)
4. **Energy Monitoring** - P1 (High)
5. **User Management** - P1 (High)
6. **Settings** - P2 (Medium)

---

## Current Known Issues

### ✅ Fixed in Task 3.1
- Icon-only buttons now have aria-label
- 10 buttons updated across 4 files

### ⚠️ Needs Verification
- [ ] Chart accessibility (Recharts)
- [ ] Color contrast on all badge variants
- [ ] Form error announcements
- [ ] Table sort announcements
- [ ] Loading state announcements

### 📋 Future Improvements
- [ ] Add skip links to main content
- [ ] Add landmark ARIA labels when multiples exist
- [ ] Implement proper focus management for client-side routing
- [ ] Add keyboard shortcuts documentation page

---

## Success Criteria

### WCAG 2.1 Level AA Compliance
- [ ] All Level A criteria met (25 success criteria)
- [ ] All Level AA criteria met (13 success criteria)
- [ ] Lighthouse Accessibility score >90
- [ ] Zero critical axe DevTools violations
- [ ] All priority pages tested with screen reader

### Netzwächter Specific Goals
- [x] All icon buttons have accessible names ✅
- [ ] All forms have proper error handling
- [ ] All tables are properly structured
- [ ] All dialogs manage focus correctly
- [ ] All charts have text alternatives

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Resources](https://webaim.org/resources/)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

---

**Maintained by**: Frontend Cleanup Agent
**Status**: Active Testing
**Last Audit**: 2025-10-07
**Next Audit**: After Task 5.3 (Integration Testing)

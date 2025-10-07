# Button Usage Guidelines

**Version**: 1.0
**Last Updated**: 2025-10-07
**Maintainer**: Frontend Cleanup Agent

---

## Current Usage Statistics

**Total Buttons**: 224 instances across the application

### Variant Distribution

| Variant | Count | Percentage | Usage |
|---------|-------|------------|-------|
| outline | 113 | 50% | ✅ Primary actions, toolbars |
| ghost | 38 | 17% | ✅ Secondary actions, icon buttons |
| secondary | 12 | 5% | ⚠️ Tertiary actions |
| destructive | 9 | 4% | ✅ Delete/dangerous actions |
| default | ~52 | 23% | ⚠️ Should be limited to CTAs |

### Size Distribution

| Size | Count | Percentage | Usage |
|------|-------|------------|-------|
| sm | 9 (explicit) | ~4% | ⚠️ Compact interfaces, tables |
| default | ~215 | ~96% | ✅ Standard size for most buttons |
| lg | 0 | 0% | Reserved for hero CTAs |

---

## Variant Guidelines

### 1. `variant="outline"` (Primary) - **MOST COMMON**

**When to use:**
- Default for most actions
- Clear visual hierarchy
- Good for toolbars and action bars
- Form submit buttons
- Primary actions in cards

**Examples:**
```tsx
// Standard action button
<Button variant="outline" size="sm">Speichern</Button>

// Form submit
<Button variant="outline">Anmelden</Button>

// Toolbar action
<Button variant="outline" size="sm">
  <PlusIcon className="h-4 w-4 mr-2" />
  Neuer Eintrag
</Button>
```

**Current Usage**: 113 instances (50%)

---

### 2. `variant="ghost"` (Secondary) - **SUBTLE ACTIONS**

**When to use:**
- Subtle actions that don't need emphasis
- Icon-only buttons in tables
- Secondary navigation
- Close/dismiss actions
- Toolbar icon buttons

**Examples:**
```tsx
// Icon-only button
<Button variant="ghost" size="sm" aria-label="Bearbeiten">
  <Edit2 className="h-4 w-4" />
</Button>

// Secondary action
<Button variant="ghost">Abbrechen</Button>

// Navigation item
<Button variant="ghost" className="w-full justify-start">
  <HomeIcon className="h-4 w-4 mr-2" />
  Dashboard
</Button>
```

**Current Usage**: 38 instances (17%)

---

### 3. `variant="destructive"` (Danger) - **DELETE OPERATIONS**

**When to use:**
- Delete operations
- Irreversible actions
- Dangerous operations
- Always confirm with dialog

**Examples:**
```tsx
// Delete button with confirmation
<Button
  variant="destructive"
  size="sm"
  onClick={() => {
    if (confirm("Sind Sie sicher?")) {
      deleteItem();
    }
  }}
>
  Löschen
</Button>

// Icon-only delete
<Button
  variant="outline"
  size="sm"
  aria-label="Löschen"
>
  <Trash2 className="h-3 w-3 text-red-600" />
</Button>
```

**Current Usage**: 9 instances (4%)
**Note**: Often used with `outline` + red icon color instead

---

### 4. `variant="default"` (Solid) - **PRIMARY CTA ONLY**

**When to use:**
- Primary CTAs on landing pages
- Login/Submit buttons on auth pages
- Main call-to-action per page
- **Limit to 1 per page for maximum impact**

**Examples:**
```tsx
// Login button
<Button variant="default" className="w-full">
  Anmelden
</Button>

// Primary CTA
<Button variant="default" size="lg">
  Jetzt starten
</Button>
```

**Current Usage**: ~52 instances (23%)
**⚠️ Recommendation**: Review usage - many should be `outline` instead

---

### 5. `variant="secondary"` - **TERTIARY ACTIONS**

**When to use:**
- Less important actions
- Alternative options
- Complementary actions to primary buttons

**Examples:**
```tsx
// Alternative action
<Button variant="secondary">Vorschau</Button>

// Complementary button
<div className="flex gap-2">
  <Button variant="outline">Speichern</Button>
  <Button variant="secondary">Entwurf speichern</Button>
</div>
```

**Current Usage**: 12 instances (5%)

---

## Size Guidelines

### 1. `size="sm"` - **COMPACT INTERFACES**

**When to use:**
- Table row actions
- Toolbar buttons
- Icon-only buttons
- Compact forms
- Dense layouts

**Examples:**
```tsx
// Table action button
<Button size="sm" variant="outline" className="h-8 w-8 p-0">
  <PencilIcon className="h-3 w-3" />
</Button>

// Compact toolbar
<Button size="sm" variant="outline">
  Exportieren
</Button>
```

**Current Usage**: ~9 explicit instances
**Note**: Many buttons use custom className instead

---

### 2. `size="default"` (no size prop) - **STANDARD SIZE**

**When to use:**
- Forms and dialogs
- Primary actions
- Card actions
- Most general-purpose buttons

**Examples:**
```tsx
// Standard button
<Button variant="outline">Speichern</Button>

// Form button
<Button type="submit">Absenden</Button>
```

**Current Usage**: ~215 instances (96%)

---

### 3. `size="lg"` - **HERO BUTTONS**

**When to use:**
- Hero sections
- Landing page CTAs
- Major milestone actions
- Use sparingly

**Examples:**
```tsx
// Hero CTA
<Button variant="default" size="lg" className="text-lg px-8 py-6">
  Jetzt loslegen
</Button>
```

**Current Usage**: 0 instances
**Status**: Reserved for future use

---

## Accessibility Requirements

### Icon-Only Buttons
All icon-only buttons **MUST** have `aria-label`:

```tsx
// ✅ CORRECT
<Button variant="ghost" size="sm" aria-label="Benutzer bearbeiten">
  <PencilIcon className="h-4 w-4" />
</Button>

// ❌ WRONG - Missing aria-label
<Button variant="ghost" size="sm">
  <PencilIcon className="h-4 w-4" />
</Button>
```

### Button Text
- Use clear, action-oriented text
- Prefer German for consistency
- Keep text concise (1-3 words)

---

## Common Patterns

### 1. Table Row Actions
```tsx
<div className="flex space-x-2">
  <Button
    size="sm"
    variant="outline"
    className="h-8 w-8 p-0"
    aria-label="Bearbeiten"
  >
    <PencilIcon className="h-3 w-3 text-blue-600" />
  </Button>
  <Button
    size="sm"
    variant="outline"
    className="h-8 w-8 p-0"
    aria-label="Löschen"
  >
    <Trash2 className="h-3 w-3 text-red-600" />
  </Button>
</div>
```

### 2. Form Actions
```tsx
<div className="flex justify-end gap-2">
  <Button variant="ghost" onClick={onCancel}>
    Abbrechen
  </Button>
  <Button variant="outline" type="submit">
    Speichern
  </Button>
</div>
```

### 3. Card Header Actions
```tsx
<CardHeader>
  <div className="flex items-center justify-between">
    <CardTitle>Titel</CardTitle>
    <Button variant="outline" size="sm">
      <PlusIcon className="h-4 w-4 mr-2" />
      Neu
    </Button>
  </div>
</CardHeader>
```

### 4. Toolbar Actions
```tsx
<div className="flex gap-2">
  <Button variant="outline" size="sm">
    <FilterIcon className="h-4 w-4 mr-2" />
    Filter
  </Button>
  <Button variant="outline" size="sm">
    <DownloadIcon className="h-4 w-4 mr-2" />
    Export
  </Button>
</div>
```

---

## Migration Recommendations

### High Priority
1. **Review default variant usage**: Many buttons using `variant="default"` should be `outline`
2. **Add size="sm" explicitly**: Replace custom `className="h-8 w-8 p-0"` patterns with standard sizes
3. **Verify all icon-only buttons have aria-label**: Already completed ✅

### Low Priority
1. **Standardize icon sizes**: Use consistent h-4 w-4 for standard buttons, h-3 w-3 for compact
2. **Review secondary variant**: Consider if `ghost` would be more appropriate
3. **Add button groups**: Use consistent spacing (gap-2) for button groups

---

## Testing Checklist

- [ ] All icon-only buttons have aria-label
- [ ] Destructive actions have confirmation dialogs
- [ ] Button text is clear and action-oriented
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Focus indicators are visible
- [ ] Buttons have sufficient contrast (WCAG AA)
- [ ] Touch targets are at least 44x44px

---

## Related Documentation

- **Component Library**: `COMPONENT_LIBRARY.md`
- **Design Tokens**: `../../styles/design-tokens.ts`
- **Button Component**: `button.tsx`

---

**Questions or suggestions?** Contact the frontend team or update this document.

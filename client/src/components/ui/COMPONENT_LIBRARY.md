# UI Component Library Documentation

**Last Updated**: 2025-10-07
**Total Components**: 20 active components
**Framework**: React + Radix UI + Tailwind CSS

---

## Overview

This is the complete reference guide for the Netzwächter UI component library. All components are built on [Radix UI](https://www.radix-ui.com/) primitives with custom Tailwind styling for consistency and accessibility.

### Usage Statistics

| Component | Instances | Usage % | Priority |
|-----------|-----------|---------|----------|
| Select | 370 | 24% | Critical |
| Card | 343 | 22% | Critical |
| Table | 282 | 18% | Critical |
| Button | 224 | 14% | Critical |
| Input | 151 | 10% | High |
| Dialog | 129 | 8% | High |
| Label | 108 | 7% | High |
| Tabs | 107 | 7% | High |
| Badge | 62 | 4% | Medium |
| Avatar | 16 | 1% | Low |
| Textarea | 15 | <1% | Low |
| Tooltip | 11 | <1% | Low |
| Switch | 9 | <1% | Low |
| RadioGroup | 6 | <1% | Low |
| Checkbox | 6 | <1% | Low |

**Total Instances**: 1,839 component usages across application

---

## Core Components

### 1. Select Component

**Usage**: 370 instances (most used component)
**File**: `client/src/components/ui/select.tsx`
**Based on**: Radix UI Select

#### Sub-components
- `Select` - Root container (manages state)
- `SelectTrigger` - Button that opens the dropdown
- `SelectValue` - Displays selected value
- `SelectContent` - Dropdown container
- `SelectItem` - Individual option
- `SelectGroup` - Groups related items
- `SelectLabel` - Group label
- `SelectSeparator` - Visual divider

#### Props

**SelectTrigger**
```typescript
interface SelectTriggerProps {
  className?: string
  children: React.ReactNode
  disabled?: boolean
}
```

**SelectItem**
```typescript
interface SelectItemProps {
  value: string      // Required: unique value
  className?: string
  children: React.ReactNode
  disabled?: boolean
}
```

#### Example Usage

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Basic select
<Select onValueChange={(value) => console.log(value)}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="online">Online</SelectItem>
    <SelectItem value="offline">Offline</SelectItem>
    <SelectItem value="warning">Warning</SelectItem>
  </SelectContent>
</Select>

// With form control
<div className="space-y-2">
  <Label htmlFor="status-select">Status</Label>
  <Select defaultValue="online">
    <SelectTrigger id="status-select">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="online">Online</SelectItem>
      <SelectItem value="offline">Offline</SelectItem>
    </SelectContent>
  </Select>
</div>
```

#### Common Patterns

1. **Status Selection**: Device/object status dropdowns
2. **Time Range**: Date range and interval selection
3. **User Selection**: User or group pickers
4. **Filter Menus**: Table column filters

---

### 2. Card Component

**Usage**: 343 instances
**File**: `client/src/components/ui/card.tsx`
**Purpose**: Container for grouped content

#### Sub-components
- `Card` - Root container with border and shadow
- `CardHeader` - Top section with padding
- `CardTitle` - Large heading text
- `CardDescription` - Subtitle/description text
- `CardContent` - Main content area
- `CardFooter` - Bottom section for actions

#### Props

All card components accept standard `React.HTMLAttributes<HTMLDivElement>`:
```typescript
interface CardProps {
  className?: string
  children: React.ReactNode
  // Plus all standard div props
}
```

#### Example Usage

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Dashboard metric card
<Card>
  <CardHeader>
    <CardTitle>Energieverbrauch</CardTitle>
    <CardDescription>Letzten 24 Stunden</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">1,234 kWh</div>
    <p className="text-sm text-muted-foreground">
      +12% gegenüber gestern
    </p>
  </CardContent>
</Card>

// Simple content card (no header)
<Card>
  <CardContent className="pt-6">
    <p>Einfacher Inhalt ohne Kopfzeile.</p>
  </CardContent>
</Card>

// Card with footer actions
<Card>
  <CardHeader>
    <CardTitle>Einstellungen</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Konfigurationsoptionen...</p>
  </CardContent>
  <CardFooter className="justify-end gap-2">
    <Button variant="outline">Abbrechen</Button>
    <Button>Speichern</Button>
  </CardFooter>
</Card>
```

#### Best Practices

- **Always include CardHeader**: Provides context and structure
- **Use CardTitle**: For primary heading (not raw h1/h2)
- **CardDescription is optional**: Only use when subtitle adds value
- **CardContent padding**: Default is `p-6 pt-0`, adjust with className if needed

---

### 3. Table Component

**Usage**: 282 instances
**File**: `client/src/components/ui/table.tsx`
**Purpose**: Structured data display

#### Sub-components
- `Table` - Root table element
- `TableHeader` - Table head wrapper
- `TableBody` - Table body wrapper
- `TableRow` - Table row
- `TableHead` - Header cell
- `TableCell` - Data cell
- `TableCaption` - Optional table description

#### Example Usage

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Verbrauch</TableHead>
      <TableHead className="text-right">Aktionen</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">Objekt 1</TableCell>
      <TableCell>
        <Badge variant="default">Online</Badge>
      </TableCell>
      <TableCell>234 kWh</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm">
          Details
        </Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

### 4. Button Component

**Usage**: 224 instances
**File**: `client/src/components/ui/button.tsx`
**Documentation**: See `BUTTON_GUIDELINES.md` for complete usage guide

#### Variants
- `default` - Primary filled button (blue)
- `outline` - Bordered button (most common)
- `ghost` - Transparent hover effect
- `secondary` - Secondary filled button
- `destructive` - Red for delete/danger actions
- `link` - Text link style

#### Sizes
- `default` - Standard height (h-10)
- `sm` - Small height (h-9)
- `lg` - Large height (h-11)
- `icon` - Square icon button (h-10 w-10)

#### Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean  // Renders as Slot for custom elements
}
```

#### Example Usage

```tsx
import { Button } from "@/components/ui/button"
import { Trash2Icon, PencilIcon } from "lucide-react"

// Primary action
<Button variant="outline" size="sm">
  Speichern
</Button>

// Destructive action
<Button variant="destructive" size="sm">
  Löschen
</Button>

// Icon-only button (ALWAYS include aria-label)
<Button
  variant="ghost"
  size="sm"
  aria-label="Eintrag bearbeiten"
>
  <PencilIcon className="h-4 w-4" />
</Button>

// Loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Lädt...
</Button>
```

#### Statistics
- `outline`: 113 usages (50%) - Primary actions
- `default`: 52 usages (23%) - CTA buttons
- `ghost`: 38 usages (17%) - Icon/subtle actions
- `secondary`: 12 usages (5%) - Tertiary actions
- `destructive`: 9 usages (4%) - Delete operations

---

### 5. Input Component

**Usage**: 151 instances
**File**: `client/src/components/ui/input.tsx`
**Purpose**: Text input fields

#### Props

```typescript
interface InputProps extends React.ComponentProps<"input"> {
  type?: string      // text, email, password, number, etc.
  className?: string
  disabled?: boolean
  // All standard input HTML attributes
}
```

#### Example Usage

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// With label
<div className="space-y-2">
  <Label htmlFor="email">E-Mail</Label>
  <Input
    id="email"
    type="email"
    placeholder="user@example.com"
    required
  />
</div>

// Search input
<Input
  type="search"
  placeholder="Suchen..."
  className="max-w-sm"
/>

// Number input
<Input
  type="number"
  min={0}
  max={100}
  step={1}
  defaultValue={50}
/>

// With error state
<div className="space-y-2">
  <Label htmlFor="username">Benutzername</Label>
  <Input
    id="username"
    className="border-destructive"
    aria-invalid="true"
    aria-describedby="username-error"
  />
  <p id="username-error" className="text-sm text-destructive">
    Benutzername ist bereits vergeben
  </p>
</div>
```

#### Accessibility
- **Always pair with Label**: Use `htmlFor` matching input `id`
- **Error messages**: Use `aria-describedby` to link error text
- **Required fields**: Add `required` attribute and visual indicator
- **Placeholders**: Not a replacement for labels

---

### 6. Dialog Component

**Usage**: 129 instances
**File**: `client/src/components/ui/dialog.tsx`
**Based on**: Radix UI Dialog

#### Sub-components
- `Dialog` - Root component (controls open/close state)
- `DialogTrigger` - Button that opens the dialog
- `DialogContent` - Modal content container
- `DialogHeader` - Top section
- `DialogTitle` - Dialog heading
- `DialogDescription` - Subtitle/description
- `DialogFooter` - Bottom action area
- `DialogClose` - Close button

#### Example Usage

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// Confirmation dialog
<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">Löschen</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Objekt wirklich löschen?</DialogTitle>
      <DialogDescription>
        Diese Aktion kann nicht rückgängig gemacht werden.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Abbrechen</Button>
      <Button variant="destructive">Löschen</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Form dialog
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Neues Objekt anlegen</DialogTitle>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" />
      </div>
    </div>
    <DialogFooter>
      <Button onClick={() => setOpen(false)}>Speichern</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Best Practices
- **Always include DialogTitle**: Required for accessibility
- **Use controlled state**: For complex forms, manage `open` state
- **Escape to close**: Built-in, no extra code needed
- **Focus management**: Automatically handled by Radix

---

### 7. Label Component

**Usage**: 108 instances
**File**: `client/src/components/ui/label.tsx`
**Based on**: Radix UI Label

#### Props

```typescript
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor: string  // Required: must match input id
  className?: string
}
```

#### Example Usage

```tsx
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

<div className="space-y-2">
  <Label htmlFor="email">E-Mail-Adresse</Label>
  <Input id="email" type="email" />
</div>

// With required indicator
<Label htmlFor="password">
  Passwort <span className="text-destructive">*</span>
</Label>
```

---

### 8. Tabs Component

**Usage**: 107 instances
**File**: `client/src/components/ui/tabs.tsx`
**Based on**: Radix UI Tabs

#### Sub-components
- `Tabs` - Root container
- `TabsList` - Tab button container
- `TabsTrigger` - Individual tab button
- `TabsContent` - Content for each tab

#### Example Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="overview" className="w-full">
  <TabsList>
    <TabsTrigger value="overview">Übersicht</TabsTrigger>
    <TabsTrigger value="analytics">Analysen</TabsTrigger>
    <TabsTrigger value="settings">Einstellungen</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    <Card>
      <CardHeader>
        <CardTitle>Übersicht</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overview content */}
      </CardContent>
    </Card>
  </TabsContent>

  <TabsContent value="analytics">
    {/* Analytics content */}
  </TabsContent>

  <TabsContent value="settings">
    {/* Settings content */}
  </TabsContent>
</Tabs>
```

---

### 9. Badge Component

**Usage**: 62 instances
**File**: `client/src/components/ui/badge.tsx`
**Purpose**: Status indicators and labels

#### Variants
- `default` - Blue filled badge
- `secondary` - Gray filled badge
- `destructive` - Red filled badge
- `outline` - Bordered transparent badge

#### Example Usage

```tsx
import { Badge } from "@/components/ui/badge"

// Status indicators
<Badge variant="default">Online</Badge>
<Badge variant="destructive">Offline</Badge>
<Badge variant="secondary">Wartung</Badge>

// In table cells
<TableCell>
  <Badge variant="default">Aktiv</Badge>
</TableCell>

// Custom colors
<Badge className="bg-green-500 text-white">
  Erfolgreich
</Badge>
```

---

### 10. Textarea Component

**Usage**: 15 instances
**File**: `client/src/components/ui/textarea.tsx`
**Purpose**: Multi-line text input

#### Example Usage

```tsx
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="notes">Notizen</Label>
  <Textarea
    id="notes"
    placeholder="Ihre Notizen hier eingeben..."
    rows={4}
  />
</div>
```

---

## Accessibility Guidelines

### ARIA Labels
✅ **All icon-only buttons MUST have aria-label**
```tsx
<Button variant="ghost" size="sm" aria-label="Bearbeiten">
  <PencilIcon className="h-4 w-4" />
</Button>
```

### Form Accessibility
✅ **Link labels to inputs**
```tsx
<Label htmlFor="email">E-Mail</Label>
<Input id="email" type="email" />
```

✅ **Link error messages**
```tsx
<Input aria-describedby="email-error" />
<p id="email-error">Ungültige E-Mail</p>
```

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order is logical and sequential
- Escape closes dialogs and popups
- Enter/Space activates buttons

---

## Import Patterns

### Standard Import (Preferred)
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
```

### Multiple Components
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
```

### Icon Imports
```tsx
import { PencilIcon, Trash2Icon, CheckIcon } from "lucide-react"
```

---

## Design Tokens Integration

Components work seamlessly with the design token system in `client/src/styles/design-tokens.ts`.

```tsx
import { colors, spacing, borderRadius } from "@/styles/design-tokens"

// Using tokens in components
<div
  style={{
    backgroundColor: colors.primary[500],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  }}
>
  Custom styled with design tokens
</div>
```

---

## Performance Tips

### Code Splitting
Components are automatically tree-shaken. Only import what you use:
```tsx
// ✅ Good - imports only Button
import { Button } from "@/components/ui/button"

// ❌ Bad - imports entire ui barrel export
import { Button } from "@/components/ui"
```

### Lazy Loading Dialogs
```tsx
const EditDialog = lazy(() => import("@/components/EditDialog"))

<Suspense fallback={<Spinner />}>
  <EditDialog />
</Suspense>
```

---

## Testing Checklist

When using components, verify:

- [ ] Responsive on mobile (test at 375px width)
- [ ] Keyboard navigation works
- [ ] Screen reader announces content correctly
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Touch targets are 44x44px minimum
- [ ] Forms have proper validation
- [ ] Loading states are indicated
- [ ] Error states are clear

---

## Common Patterns

### Form Layout
```tsx
<div className="grid gap-4">
  <div className="grid gap-2">
    <Label htmlFor="name">Name</Label>
    <Input id="name" />
  </div>

  <div className="grid gap-2">
    <Label htmlFor="email">E-Mail</Label>
    <Input id="email" type="email" />
  </div>

  <Button>Speichern</Button>
</div>
```

### Data Table with Actions
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead className="text-right">Aktionen</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${item.name} bearbeiten`}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Dashboard Card Grid
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  <Card>
    <CardHeader>
      <CardTitle>Metric 1</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">1,234</div>
    </CardContent>
  </Card>

  {/* More cards... */}
</div>
```

---

## Migration Notes

### From v1 to v2 (Current)
- All imports now use double quotes (enforced by ESLint)
- Icon-only buttons require `aria-label`
- Card imports include all sub-components explicitly
- Button size `sm` is now preferred for most actions

---

## Support & Resources

- **Component Source**: `client/src/components/ui/`
- **Design Tokens**: `client/src/styles/design-tokens.ts`
- **Button Guidelines**: `client/src/components/ui/BUTTON_GUIDELINES.md`
- **Radix UI Docs**: https://www.radix-ui.com/primitives/docs/overview/introduction
- **Tailwind CSS**: https://tailwindcss.com/docs

---

**Maintained by**: Frontend Cleanup Agent
**Version**: 2.0
**Last Audit**: 2025-10-07

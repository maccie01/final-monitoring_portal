/**
 * Design Tokens for Netzwächter Monitoring Portal
 *
 * Centralized design system tokens for colors, spacing, typography, and more.
 * These tokens ensure consistency across the application and make theming easier.
 *
 * @version 1.0.0
 * @created 2025-10-07
 */

// ============================================================================
// COLOR SYSTEM
// ============================================================================

/**
 * Primary brand colors - Blue palette for main UI elements
 */
export const colors = {
  // Primary palette (Blue)
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",  // Main primary color
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },

  // Status colors for alerts and notifications
  status: {
    success: "#10b981",      // Green
    successLight: "#d1fae5", // Light green background
    warning: "#f59e0b",      // Orange
    warningLight: "#fef3c7", // Light orange background
    error: "#ef4444",        // Red
    errorLight: "#fee2e2",   // Light red background
    info: "#3b82f6",         // Blue
    infoLight: "#dbeafe",    // Light blue background
  },

  // System status colors (for monitoring)
  monitoring: {
    online: "#10b981",       // Green - system online
    offline: "#ef4444",      // Red - system offline
    warning: "#f59e0b",      // Orange - warning state
    critical: "#dc2626",     // Dark red - critical state
    unknown: "#6b7280",      // Gray - unknown state
  },

  // Neutral grays for text and backgrounds
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },

  // Semantic colors for UI states
  semantic: {
    background: "#ffffff",
    backgroundAlt: "#f9fafb",
    border: "#e5e7eb",
    borderHover: "#d1d5db",
    text: "#111827",
    textSecondary: "#6b7280",
    textMuted: "#9ca3af",
  },
};

// ============================================================================
// SPACING SYSTEM
// ============================================================================

/**
 * Spacing scale based on 4px base unit
 * Use these instead of arbitrary values for consistency
 */
export const spacing = {
  xs: "0.25rem",   // 4px
  sm: "0.5rem",    // 8px
  md: "1rem",      // 16px
  lg: "1.5rem",    // 24px
  xl: "2rem",      // 32px
  "2xl": "2.5rem", // 40px
  "3xl": "3rem",   // 48px
  "4xl": "4rem",   // 64px
  "5xl": "5rem",   // 80px
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

/**
 * Border radius values for rounded corners
 */
export const borderRadius = {
  none: "0",
  sm: "0.25rem",   // 4px - small elements
  md: "0.375rem",  // 6px - default for cards, buttons
  lg: "0.5rem",    // 8px - larger cards
  xl: "0.75rem",   // 12px - modals, dialogs
  "2xl": "1rem",   // 16px - hero sections
  full: "9999px",  // Fully rounded (pills, avatars)
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

/**
 * Font size scale
 */
export const fontSize = {
  xs: "0.75rem",      // 12px
  sm: "0.875rem",     // 14px
  base: "1rem",       // 16px - body text
  lg: "1.125rem",     // 18px
  xl: "1.25rem",      // 20px
  "2xl": "1.5rem",    // 24px
  "3xl": "1.875rem",  // 30px
  "4xl": "2.25rem",   // 36px
  "5xl": "3rem",      // 48px
};

/**
 * Font weights
 */
export const fontWeight = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};

/**
 * Line heights
 */
export const lineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};

// ============================================================================
// SHADOWS
// ============================================================================

/**
 * Box shadow values for elevation
 */
export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
};

// ============================================================================
// TRANSITIONS
// ============================================================================

/**
 * Transition durations and easings
 */
export const transitions = {
  duration: {
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
    slower: "500ms",
  },
  easing: {
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

// ============================================================================
// BREAKPOINTS
// ============================================================================

/**
 * Responsive breakpoints
 */
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

/**
 * Z-index values for layering
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

/**
 * Button-specific design tokens
 */
export const button = {
  padding: {
    sm: `${spacing.sm} ${spacing.md}`,
    base: `${spacing.md} ${spacing.lg}`,
    lg: `${spacing.lg} ${spacing.xl}`,
  },
  borderRadius: borderRadius.md,
  fontSize: {
    sm: fontSize.sm,
    base: fontSize.base,
    lg: fontSize.lg,
  },
};

/**
 * Card-specific design tokens
 */
export const card = {
  padding: spacing.lg,
  borderRadius: borderRadius.lg,
  shadow: shadows.base,
  borderColor: colors.semantic.border,
};

/**
 * Input-specific design tokens
 */
export const input = {
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: borderRadius.md,
  borderColor: colors.semantic.border,
  borderColorFocus: colors.primary[500],
  fontSize: fontSize.base,
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example usage in TypeScript/TSX:
 *
 * import { colors, spacing, borderRadius } from '@/styles/design-tokens';
 *
 * // In styled components or inline styles
 * const buttonStyle = {
 *   backgroundColor: colors.primary[500],
 *   padding: spacing.md,
 *   borderRadius: borderRadius.md,
 * };
 *
 * // In Tailwind classes (via tailwind.config.js extension)
 * <div className="bg-primary-500 p-md rounded-lg">
 *   Content
 * </div>
 */

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  lineHeight,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  button,
  card,
  input,
};

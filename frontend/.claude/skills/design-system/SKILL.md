---
name: design-system
description: Design system tokens and patterns including color palettes, typography, spacing, shadows, border radius, and CSS variables. Use when setting up a project's visual foundation, choosing colors, fonts, spacing scales, creating CSS custom properties, building dark mode, or establishing design consistency.
---

# Design System Quick Reference

## Color Palettes

### Modern Neutral (Safe Default)
```css
:root {
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  --gray-950: #030712;
}
```

### Brand Color Palettes
```css
/* Ocean Blue - Professional, Trust */
--primary-500: #3b82f6;
--primary-600: #2563eb;
--primary-700: #1d4ed8;

/* Emerald - Growth, Success */
--primary-500: #10b981;
--primary-600: #059669;
--primary-700: #047857;

/* Violet - Creative, Premium */
--primary-500: #8b5cf6;
--primary-600: #7c3aed;
--primary-700: #6d28d9;

/* Amber - Warm, Energetic */
--primary-500: #f59e0b;
--primary-600: #d97706;
--primary-700: #b45309;

/* Rose - Bold, Passion */
--primary-500: #f43f5e;
--primary-600: #e11d48;
--primary-700: #be123c;
```

### Semantic Colors
```css
:root {
  --success-light: #dcfce7;
  --success: #22c55e;
  --success-dark: #15803d;

  --warning-light: #fef3c7;
  --warning: #f59e0b;
  --warning-dark: #b45309;

  --error-light: #fee2e2;
  --error: #ef4444;
  --error-dark: #b91c1c;

  --info-light: #dbeafe;
  --info: #3b82f6;
  --info-dark: #1d4ed8;
}
```

### Dark Mode Colors
```css
:root.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --border: #334155;
}
```

---

## Typography

### Font Stacks
```css
/* Modern Sans-Serif */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Geometric Sans */
font-family: 'DM Sans', 'Outfit', sans-serif;

/* Monospace */
font-family: 'JetBrains Mono', 'Fira Code', monospace;

/* Display / Headlines */
font-family: 'Cal Sans', 'Clash Display', sans-serif;
```

### Google Fonts Quick Picks
```html
<!-- Modern Clean -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<!-- Tech / Developer -->
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">

<!-- Friendly & Rounded -->
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
```

### Type Scale
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
```

---

## Spacing System (4px grid)

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
```

### Component Spacing Guidelines
```
Button padding: 8px 16px (small), 12px 24px (medium), 16px 32px (large)
Card padding: 16px (compact), 24px (default), 32px (spacious)
Form field spacing: 16px between fields
Section spacing: 48-64px between major sections
Page margins: 16px (mobile), 24-32px (tablet), 48-64px (desktop)
```

---

## Border Radius
```css
--radius-sm: 0.125rem;  /* 2px - subtle */
--radius-md: 0.375rem;  /* 6px - buttons, inputs */
--radius-lg: 0.5rem;    /* 8px - cards */
--radius-xl: 0.75rem;   /* 12px - modals */
--radius-2xl: 1rem;     /* 16px - large cards */
--radius-full: 9999px;  /* circles */
```

## Shadows
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

## Z-Index Scale
```css
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
```

---

## CSS Variables Template

A complete starter template for CSS custom properties is available in [reference.md](reference.md), including full light/dark mode setup, common component patterns (cards, buttons, inputs), responsive breakpoints, and animation tokens.

## Responsive Breakpoints
```css
/* Mobile first */
@media (min-width: 640px) { }   /* Tablet */
@media (min-width: 768px) { }   /* Small laptop */
@media (min-width: 1024px) { }  /* Desktop */
@media (min-width: 1280px) { }  /* Large desktop */
```

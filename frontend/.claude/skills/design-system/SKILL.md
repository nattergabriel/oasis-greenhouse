---
name: design-system
description: Mars Greenhouse Command Center design system. Dark-only theme with warm Mars palette, cockpit-inspired UI. Reference for colors, typography, spacing, components, and layout patterns.
---

# Mars Greenhouse Command Center Design System

**Dark-only theme.** No light mode. Warm, Mars-inspired palette for a cockpit-style interface designed for astronauts.

---

## Color Palette

### Background Layers
```css
:root {
  --background: #0f0e0d;    /* near-black, warm base */
  --card: #1a1917;          /* card backgrounds */
  --secondary: #252320;     /* elevated/hover states */
  --border: #2e2b27;        /* subtle dividers */
}
```

**Tailwind usage:**
- `bg-background` - page background
- `bg-card` - card backgrounds
- `bg-secondary` - hover states, raised elements
- `border-border` - dividers, card borders

**Hex values:**
- base: `#0f0e0d`
- surface: `#1a1917`
- elevated: `#252320`
- border: `#2e2b27`

### Text Colors
```css
:root {
  --foreground: #e8e2d9;          /* warm off-white, primary text */
  --muted-foreground: #9c9488;    /* muted labels */
  --tertiary: #6b6560;            /* disabled, hints */
}
```

**Tailwind usage:**
- `text-foreground` - primary text
- `text-muted-foreground` - labels, secondary text
- `text-[#6b6560]` - disabled/tertiary text

### Accent Colors
```css
:root {
  --primary: #d4924a;        /* amber - primary action, Mars sun */
  --destructive: #c75a3a;    /* red - critical, destructive */
  --green: #5a9a6b;          /* healthy, growth */
  --yellow: #c4a344;         /* warning, attention */
  --blue: #4a7c9e;           /* water, information */
  --purple: #7c6aad;         /* agent/AI actions */
}
```

**Semantic usage:**
- Amber (`#d4924a`) - primary actions, highlights, Mars theme
- Red (`#c75a3a`) - destructive actions, critical alerts
- Green (`#5a9a6b`) - healthy status, growth indicators
- Yellow (`#c4a344`) - warnings, attention needed
- Blue (`#4a7c9e`) - water-related, informational
- Purple (`#7c6aad`) - AI agent actions, autonomous systems

**Tailwind usage:**
- `text-primary` or `bg-primary` - amber
- `text-destructive` or `bg-destructive` - red
- `text-[#5a9a6b]` or `bg-[#5a9a6b]` - green
- `text-[#c4a344]` or `bg-[#c4a344]` - yellow
- `text-[#4a7c9e]` or `bg-[#4a7c9e]` - blue
- `text-[#7c6aad]` or `bg-[#7c6aad]` - purple

### Status Colors
```css
/* Status indicators */
--status-healthy: #5a9a6b;
--status-warning: #c4a344;
--status-critical: #c75a3a;
```

**Status dots:** 8px circles with status colors.

### Chart Colors
```css
/* For data visualization */
--chart-1: #d4924a;  /* amber */
--chart-2: #5a9a6b;  /* green */
--chart-3: #4a7c9e;  /* blue */
--chart-4: #c4a344;  /* yellow */
--chart-5: #7c6aad;  /* purple */
```

---

## Typography

### Fonts
```tsx
// next/font/google import
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
```

**Font families:**
- **Geist Sans** - all body text, headings, UI
- **Geist Mono** - numbers, data, code, technical values

### Type Styles

| Element | Classes | Notes |
|---------|---------|-------|
| Page Title | `text-xl font-medium tracking-tight` | Top-level page heading |
| Section Heading | `text-base font-medium` | Card titles, section headers |
| Body Text | `text-sm` | Default text size |
| Label | `text-xs text-muted-foreground uppercase tracking-wide` | Form labels, metadata |
| Data/Numbers | `text-sm font-mono tabular-nums` | Metrics, readings, counts |

### Type Scale
```css
--text-xs: 0.75rem;    /* 12px - labels */
--text-sm: 0.875rem;   /* 14px - body, data */
--text-base: 1rem;     /* 16px - section headings */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px - page titles */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

### Number Formatting
Always use monospace font with tabular figures for numbers:
```tsx
<span className="font-mono tabular-nums">23.7°C</span>
<div className="text-sm font-mono tabular-nums">1,847 kcal</div>
```

---

## Component Patterns

### Cards
```tsx
<div className="bg-card border border-border rounded-lg p-4">
  {/* content */}
</div>
```

**Rules:**
- NO shadows - borders only
- `rounded-lg` consistently
- `border-border` for subtle division
- `p-4` standard padding (16px)

### Status Indicators
```tsx
<div className="flex items-center gap-2">
  <div className="w-2 h-2 rounded-full bg-[#5a9a6b]" />
  <span className="text-sm">Healthy</span>
</div>
```

**Status dot sizes:** 8px (w-2 h-2) for inline indicators.

### Labels
```tsx
<div className="text-xs text-muted-foreground uppercase tracking-wide">
  Temperature
</div>
```

Always uppercase, extra letter spacing, muted color.

### Buttons
```tsx
// Primary
<button className="bg-primary text-background rounded-lg px-4 py-2">
  Action
</button>

// Secondary
<button className="bg-secondary text-foreground rounded-lg px-4 py-2 hover:bg-[#2e2b27]">
  Action
</button>

// Destructive
<button className="bg-destructive text-background rounded-lg px-4 py-2">
  Delete
</button>
```

**Rules:**
- Use `rounded-lg` (NOT `rounded-full`)
- Standard padding: `px-4 py-2`
- Icons: 16px inline within buttons

### Icons
- **Library:** lucide-react only
- **Inline icons:** 16px (size={16})
- **Standalone icons:** 20px (size={20})
- **Color:** inherit from parent text color

```tsx
import { AlertTriangle, Droplets } from 'lucide-react';

// Inline
<span className="flex items-center gap-2">
  <Droplets size={16} />
  Water Level
</span>

// Standalone
<AlertTriangle size={20} className="text-destructive" />
```

---

## Layout

### Page Structure
```tsx
<div className="min-h-screen bg-background text-foreground">
  {/* Navbar - fixed top */}
  <nav className="fixed top-0 w-full h-14 border-b border-border bg-background z-10">
    {/* nav content */}
  </nav>

  {/* Main content */}
  <main className="flex-1 pt-14 p-6">
    <div className="space-y-4">
      {/* cards, widgets */}
    </div>
  </main>
</div>
```

### Navbar
- Height: `h-14` (56px)
- Position: `fixed top-0 w-full`
- Border: `border-b border-border`
- Background: `bg-background`
- Z-index: `z-10` (or higher if needed)

### Content Area
- Padding top: `pt-14` (to clear fixed navbar)
- Page padding: `p-6` (24px)
- Vertical spacing: `space-y-4` or `gap-4` (16px between elements)

### Widget Cards
```tsx
<div className="bg-card border border-border rounded-lg p-4 min-h-[160px]">
  {/* widget content */}
</div>
```

**Minimum height:** 160px for visual consistency.

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

### Common Spacing Patterns
- **Card padding:** 16px (p-4)
- **Widget spacing:** 16px gap (gap-4)
- **Page padding:** 24px (p-6)
- **Navbar height:** 56px (h-14)
- **Status dot size:** 8px (w-2 h-2)
- **Icon inline:** 16px (size={16})
- **Icon standalone:** 20px (size={20})

---

## Border Radius

```css
--radius-sm: 0.125rem;  /* 2px */
--radius-md: 0.375rem;  /* 6px */
--radius-lg: 0.5rem;    /* 8px - primary radius */
--radius-xl: 0.75rem;   /* 12px */
--radius-2xl: 1rem;     /* 16px */
--radius-full: 9999px;  /* circles, status dots */
```

**Standard:** Use `rounded-lg` (8px) for cards, buttons, inputs.
**Exceptions:** `rounded-full` only for status dots and avatar circles.

---

## Z-Index Scale

```css
--z-base: 1;
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
```

**Navbar:** Use `z-10` or higher as needed (typically `z-sticky`).

---

## Design Principles

1. **No shadows** - Use borders only for depth
2. **No gradients** - Except for greenhouse visualization if needed
3. **Consistent rounding** - `rounded-lg` everywhere (except dots)
4. **Monospace numbers** - Always for data, metrics, readings
5. **Uppercase labels** - Small, muted, letter-spaced
6. **Status dots** - 8px circles with semantic colors
7. **lucide-react only** - No other icon libraries
8. **Dark-only** - No light mode toggle or implementation

---

## Quick Reference

### Color Variables
```css
/* Backgrounds */
bg-background  /* #0f0e0d */
bg-card        /* #1a1917 */
bg-secondary   /* #252320 */

/* Text */
text-foreground        /* #e8e2d9 */
text-muted-foreground  /* #9c9488 */

/* Accents */
text-primary       /* #d4924a - amber */
text-destructive   /* #c75a3a - red */
text-[#5a9a6b]     /* green */
text-[#c4a344]     /* yellow */
text-[#4a7c9e]     /* blue */
text-[#7c6aad]     /* purple */

/* Borders */
border-border  /* #2e2b27 */
```

### Common Patterns
```tsx
// Card
<div className="bg-card border border-border rounded-lg p-4" />

// Label
<div className="text-xs text-muted-foreground uppercase tracking-wide" />

// Number
<span className="text-sm font-mono tabular-nums" />

// Status dot
<div className="w-2 h-2 rounded-full bg-[#5a9a6b]" />

// Button
<button className="bg-primary text-background rounded-lg px-4 py-2" />

// Section heading
<h2 className="text-base font-medium" />

// Page title
<h1 className="text-xl font-medium tracking-tight" />
```

---

## Responsive Breakpoints

```css
/* Mobile first */
@media (min-width: 640px) { }   /* sm - Tablet */
@media (min-width: 768px) { }   /* md - Small laptop */
@media (min-width: 1024px) { }  /* lg - Desktop */
@media (min-width: 1280px) { }  /* xl - Large desktop */
```

**Approach:** Design mobile-first, enhance for larger screens.

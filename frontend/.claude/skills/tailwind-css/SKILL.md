---
name: tailwind-css
description: Tailwind CSS utility class reference covering layout (flexbox, grid), spacing, typography, colors, sizing, borders, shadows, positioning, responsive design, states, animations, and common component patterns. Use when writing Tailwind CSS classes, building responsive layouts, styling components with utility classes, or looking up Tailwind class names.
---

# Tailwind CSS Quick Reference

## Project Theme Classes

This project uses Tailwind CSS v4 with a dark-only Mars theme. Custom color classes available:

### Background Colors
```html
bg-background       /* #0f0e0d - main app background */
bg-card             /* #1a1917 - card/panel background */
bg-secondary        /* #252320 - input/secondary surfaces */
```

### Text Colors
```html
text-foreground         /* #e8e2d9 - primary text */
text-muted-foreground   /* #9c9488 - muted/secondary text */
text-primary            /* #d4924a - accent/interactive text */
text-destructive        /* #c75a3a - error/warning text */
```

### Border Colors
```html
border-border       /* #2e2b27 - default borders */
border-input        /* #2e2b27 - input borders */
```

### Mars Accent Colors
```html
bg-mars-amber | text-mars-amber      /* Mars orange/amber accent */
bg-mars-red | text-mars-red          /* Mars red accent */
bg-mars-green | text-mars-green      /* Status healthy */
bg-mars-yellow | text-mars-yellow    /* Status warning */
bg-mars-blue | text-mars-blue        /* Info accent */
bg-mars-purple | text-mars-purple    /* Special accent */
```

### Status Colors
```html
status-healthy      /* Green - optimal conditions */
status-warning      /* Yellow - attention needed */
status-critical     /* Red - critical issue */
```

---

## Layout

### Flexbox
```html
<div class="flex">...</div>
<div class="flex flex-col">...</div>

<!-- Justify (main axis) -->
justify-start | justify-center | justify-end | justify-between | justify-around | justify-evenly

<!-- Align (cross axis) -->
items-start | items-center | items-end | items-baseline | items-stretch

<!-- Gap -->
gap-4 | gap-x-4 | gap-y-2

<!-- Flex item -->
flex-1      /* grow and shrink */
flex-none   /* don't grow/shrink */
```

### Grid
```html
<div class="grid grid-cols-3 gap-4">...</div>

grid-cols-1 | grid-cols-2 | grid-cols-3 | grid-cols-4 | grid-cols-6 | grid-cols-12
col-span-2 | col-span-3 | col-span-full
grid-cols-[200px_1fr_2fr]  /* arbitrary */
```

### Container & Centering
```html
<div class="container mx-auto px-4">...</div>
max-w-sm | max-w-md | max-w-lg | max-w-xl | max-w-2xl | max-w-4xl | max-w-7xl

<!-- Center anything -->
<div class="flex items-center justify-center min-h-screen">...</div>
<div class="grid place-items-center min-h-screen">...</div>
```

---

## Spacing

```html
p-4 | m-4                    <!-- All sides -->
px-4 | py-2 | mx-auto        <!-- Horizontal/Vertical -->
pt-4 | pr-4 | pb-4 | pl-4    <!-- Individual sides -->
-mt-4 | -ml-2                <!-- Negative margin -->
space-x-4 | space-y-2        <!-- Between children -->
```

### Spacing Scale
```
0 -> 0px    1 -> 4px    2 -> 8px    3 -> 12px   4 -> 16px
5 -> 20px   6 -> 24px   8 -> 32px   10 -> 40px  12 -> 48px
16 -> 64px  20 -> 80px  24 -> 96px
```

---

## Typography

```html
text-xs | text-sm | text-base | text-lg | text-xl | text-2xl | text-3xl | text-4xl | text-5xl
font-thin | font-light | font-normal | font-medium | font-semibold | font-bold | font-extrabold
leading-none | leading-tight | leading-normal | leading-relaxed
text-left | text-center | text-right
truncate                              /* single line ellipsis */
line-clamp-2 | line-clamp-3           /* multi-line truncate */
uppercase | lowercase | capitalize
```

---

## Sizing

```html
w-full | w-screen | w-auto | w-fit
w-1/2 | w-1/3 | w-2/3 | w-1/4 | w-3/4
w-64 | w-96 | w-[300px]

h-full | h-screen | h-auto
min-h-screen | max-h-96

aspect-auto | aspect-square | aspect-video
```

---

## Borders, Shadows, Rings

```html
border | border-2 | border-4
rounded-none | rounded-sm | rounded | rounded-md | rounded-lg | rounded-xl | rounded-full

shadow-sm | shadow | shadow-md | shadow-lg | shadow-xl | shadow-2xl

ring | ring-2 | ring-4
ring-blue-500 | ring-offset-2

<!-- Divide between children -->
<div class="divide-y divide-gray-200">...</div>
```

---

## Positioning

```html
static | relative | absolute | fixed | sticky

inset-0 | top-0 | right-0 | bottom-0 | left-0
z-0 | z-10 | z-20 | z-30 | z-40 | z-50

<!-- Overlay pattern -->
<div class="fixed inset-0 bg-black/50 z-40">
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
    Modal
  </div>
</div>

<!-- Sticky header -->
<header class="sticky top-0 z-50 bg-card/80 backdrop-blur">
```

---

## Responsive Design

```
sm:  640px    md:  768px    lg:  1024px    xl:  1280px    2xl: 1536px
```

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
<div class="hidden md:block">Desktop only</div>
<div class="md:hidden">Mobile only</div>
<div class="p-4 md:p-6 lg:p-8">
<h1 class="text-2xl md:text-4xl lg:text-6xl">
```

---

## States & Interactions

```html
hover:bg-primary
focus:outline-none focus:ring-2 focus:ring-ring
active:scale-95
disabled:opacity-50 disabled:cursor-not-allowed

<!-- Group hover -->
<div class="group">
  <span class="group-hover:text-primary">...</span>
</div>

<!-- Odd/Even -->
<tr class="odd:bg-card even:bg-secondary">
```

---

## Animations & Transitions

```html
transition-colors | transition-opacity | transition-shadow | transition-transform | transition-all
duration-75 | duration-100 | duration-150 | duration-200 | duration-300 | duration-500
ease-linear | ease-in | ease-out | ease-in-out

animate-spin | animate-ping | animate-pulse | animate-bounce

scale-95 | scale-100 | scale-105
rotate-45 | rotate-90 | rotate-180
translate-x-4 | -translate-x-1/2
```

---

## Common Component Patterns

```html
<!-- Card -->
<div class="bg-card rounded-lg border border-border p-4">

<!-- Primary button -->
<button class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

<!-- Input -->
<input class="w-full px-4 py-2 bg-secondary border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />

<!-- Badge -->
<span class="px-2 py-1 text-xs font-medium bg-secondary text-foreground rounded-lg">

<!-- Label -->
<label class="text-xs uppercase tracking-wide text-muted-foreground">

<!-- Data Display -->
<span class="font-mono text-sm tabular-nums text-foreground">

<!-- Avatar -->
<div class="w-10 h-10 rounded-full bg-gradient-to-br from-mars-amber to-mars-red flex items-center justify-center text-white font-medium">

<!-- sr-only -->
<span class="sr-only">Accessible text</span>
```

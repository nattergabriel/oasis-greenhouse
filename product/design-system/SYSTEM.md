# Design System

> Lightweight component-level decisions so the frontend dev doesn't have to guess. Builds on `brand/IDENTITY.md`.

---

## UI Framework

- **Library:** _TBD (e.g., Tailwind + shadcn/ui, MUI, Chakra, plain CSS)_
- **Rationale:** _Why this choice — speed, familiarity, aesthetics_

---

## Spacing Scale

Use a consistent scale. Pick one:

| Token | Value |
|-------|-------|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 16px |
| `lg` | 24px |
| `xl` | 32px |
| `2xl` | 48px |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 4px | Inputs, small elements |
| `md` | 8px | Cards, buttons |
| `lg` | 16px | Modals, hero sections |
| `full` | 9999px | Avatars, pills |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `md` | `0 4px 6px rgba(0,0,0,0.07)` | Cards |
| `lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |

---

## Component Patterns

### Buttons
- **Primary:** filled, primary color, white text
- **Secondary:** outlined, primary border, primary text
- **Destructive:** filled, error color
- **Sizes:** `sm` (32px height), `md` (40px), `lg` (48px)

### Cards
- Background: surface color
- Border-radius: `md`
- Shadow: `md`
- Padding: `md` to `lg`

### Inputs
- Height: 40px
- Border: 1px solid muted
- Border-radius: `sm`
- Focus ring: primary color

### Navigation
- _Top nav / sidebar / tabs — decide based on app type_

---

## Dark Mode

- [ ] Yes, support dark mode
- [ ] No, light only (faster for hackathon)

If yes, define dark variants for: background, surface, text, borders.

---

## Responsive Breakpoints

| Name | Width | Notes |
|------|-------|-------|
| Mobile | < 640px | Stack layout |
| Tablet | 640–1024px | Adaptive |
| Desktop | > 1024px | Full layout |

**Priority for demo:** _Desktop-first? Mobile-first?_

---

## Handoff to Frontend

Once filled in, share this file + `brand/IDENTITY.md` with the frontend dev. They should have everything needed to set up the project styling without back-and-forth.

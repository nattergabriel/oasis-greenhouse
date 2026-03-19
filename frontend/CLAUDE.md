@AGENTS.md

# Mars Greenhouse Command Center — Frontend

## Quick Start

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## Tech Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4** (PostCSS plugin, no tailwind.config — uses CSS-based config in `globals.css`)
- **shadcn/ui v4** (base-ui, NOT Radix) — components in `src/components/ui/`
- **Recharts 3** for data visualization
- **Framer Motion** for animations
- **Lucide React** for icons (only icon library allowed)

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    dashboard/            # Main dashboard with greenhouse SVG + metrics
    greenhouse/           # Greenhouse detail view with cross-section + heatmap
    crops/                # Crop catalog (expandable rows)
    alerts/               # Alert management (expandable rows)
    agent/                # AI agent decisions + activity log
    nutrition/            # Crew nutrition tracking + micronutrients
    forecasting/          # Resource forecasting with charts
    admin/
      simulation/         # Simulation controls (speed, pause, reset)
      scenarios/          # Scenario injection
      agent-config/       # Agent configuration
      analytics/          # Analytics dashboard
  components/
    ui/                   # shadcn/ui primitives (button, card, dialog, etc.)
    layout/               # App shell, navbar, nav-link, status-popover, sim-controls
    greenhouse-cross-section.tsx  # Animated SVG greenhouse visualization
  lib/
    types.ts              # All TypeScript types (matches contracts/API.md)
    mock-data.ts          # Mock data layer (greenhouses, sensors, crops, alerts, etc.)
    simulation.ts         # Simulation state reducer + tick logic
    api.ts                # API client (mock-first, swap to real endpoints)
    utils.ts              # Tailwind cn() helper
  providers/
    simulation-provider.tsx  # React context for simulation state (useReducer + setInterval)
```

## Design System

**Dark-only Mars theme.** No light mode. All colors defined as CSS custom properties in `globals.css`.

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#0f0e0d` | Page background |
| `--card` | `#1a1917` | Card surfaces |
| `--secondary` | `#252320` | Hover states, elevated |
| `--border` | `#2e2b27` | All borders (no shadows) |
| `--foreground` | `#e8e2d9` | Primary text |
| `--muted-foreground` | `#9c9488` | Labels, secondary text |
| `--primary` | `#d4924a` | Amber — primary actions |
| `--destructive` | `#c75a3a` | Red — critical/destructive |
| `--color-status-healthy` | `#5a9a6b` | Green status |
| `--color-status-warning` | `#c4a344` | Yellow status |
| `--color-status-critical` | `#c75a3a` | Red status |
| `--color-mars-blue` | `#4a7c9e` | Water/info |
| `--color-agent-purple` | `#7c6aad` | AI agent actions |

### Key Rules

- **No shadows** — use `border border-border` for depth
- **No gradients** — except greenhouse SVG visualization
- **`rounded-lg`** everywhere (except status dots which are `rounded-full`)
- **Monospace numbers** — always `font-mono tabular-nums` for data/metrics
- **Uppercase labels** — `text-xs text-muted-foreground uppercase tracking-wide`
- **Status dots** — 8px (`w-2 h-2`) circles with semantic colors
- **Fonts** — Geist Sans (body) + Geist Mono (numbers)

## Data Flow

The frontend uses a **mock-first** approach:
1. `mock-data.ts` provides all data matching `contracts/API.md` types
2. `simulation-provider.tsx` wraps the app with simulation state context
3. Pages consume state via `useSimulation()` hook
4. When backend is ready, swap mock calls in `api.ts` with real endpoints

## 5 Mars Crops

The greenhouse grows exactly these 5 crops (from Syngenta Knowledge Base):
1. **Lettuce** — Fast-cycle micronutrient source (28d growth)
2. **Potato** — Energy backbone, caloric staple (90d growth)
3. **Radish** — Quick-harvest vitamin source (30d growth)
4. **Bean** — Protein security, nitrogen fixing (55d growth)
5. **Herb (Basil)** — Psychological wellbeing, flavor (35d growth)

## Conventions

- Prefer editing existing files over creating new ones
- Use shadcn/ui components from `@/components/ui/` — don't build custom equivalents
- Import paths use `@/` alias (mapped to `src/`)
- All pages are client components (`"use client"`) since they consume simulation context
- Expandable row pattern used on crops, alerts, and agent pages
- Greenhouse cross-section component accepts `compact` prop for dashboard vs full view

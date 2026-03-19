# Mars Greenhouse Command Center

Frontend for the Syngenta x AWS hackathon project (START Hack 2026, St. Gallen). A cockpit-style interface for astronauts managing an autonomous greenhouse on Mars during a 450-day surface mission.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Tech Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4** with dark-only Mars theme
- **shadcn/ui v4** (base-ui) component library
- **Recharts 3** for resource/nutrition charts
- **Framer Motion** for animations
- **Lucide React** for icons

## Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview — animated greenhouse SVG, resource meters, environment sensors, weather, stockpile |
| `/greenhouse` | Greenhouse detail — cross-section visualization, sensor heatmap grid |
| `/crops` | Crop catalog — expandable rows with growth profiles, nutrition data, environment requirements |
| `/alerts` | Alert management — severity-sorted expandable rows, acknowledge/resolve actions |
| `/agent` | AI agent — pending decisions (approve/dismiss) + activity log |
| `/nutrition` | Crew nutrition — per-astronaut tracking, macro/micro coverage, risk hierarchy, caloric heatmap |
| `/forecasting` | Resource forecasting — 30-day projection charts, resource status, weather conditions |
| `/admin/simulation` | Simulation controls — speed, pause/resume, reset, scenario injection |
| `/admin/scenarios` | Scenario management |
| `/admin/agent-config` | Agent configuration |
| `/admin/analytics` | Analytics dashboard |

## Design

Dark-only theme inspired by Mars mission control. Warm amber/brown palette with semantic status colors (green/yellow/red). No shadows — borders only. Monospace numbers throughout. Cockpit-style information density.

The animated greenhouse cross-section is a custom SVG component showing a Mars dome with growing plants, LED grow lights, dust particles, and real-time status indicators.

## Project Structure

```
src/
  app/          → Pages (Next.js App Router)
  components/
    ui/         → shadcn/ui primitives
    layout/     → Navbar, app shell, sim controls
  lib/          → Types, mock data, simulation logic, API client
  providers/    → Simulation context provider
```

## Scripts

```bash
npm run dev     # Start dev server
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint
```

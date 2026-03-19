# Implementation Plan

The frontend has no framework yet. This plan gets us from zero to a working prototype with mock data, focusing on layout, pages, and design first.

All types and mock data are derived from `contracts/API.md` — that file is the source of truth.

---

## Phase 0: Project Setup

### 0.1 Initialize Next.js

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

This gives us: App Router, TypeScript, Tailwind, src/ directory, @ import alias.

### 0.2 Install dependencies

```bash
npx shadcn@latest init
npm install framer-motion recharts lucide-react
```

- shadcn/ui: component primitives (card, tabs, badge, tooltip, dialog, dropdown, separator, scroll-area)
- framer-motion: greenhouse animations, page transitions, state changes
- recharts: all charts (nutrition bars, resource gauges, forecast lines)
- lucide-react: icon set (clean, consistent, not cartoonish)

### 0.3 Add shadcn components we'll need

```bash
npx shadcn@latest add card badge tabs tooltip separator scroll-area dropdown-menu dialog button progress
```

### 0.4 Set up design tokens

Create a custom Mars-themed palette in `tailwind.config.ts` extending the defaults. See Phase 1.

---

## Phase 1: Design System

Before building any pages, lock down the visual language. Everything flows from this.

### Color palette

Dark base with warm Mars accents. NOT full-black -- use warm dark grays.

```
Background:
  base:      #0f0e0d     (near-black, warm)
  surface:   #1a1917     (card backgrounds)
  elevated:  #252320     (hover states, raised elements)
  border:    #2e2b27     (subtle dividers)

Text:
  primary:   #e8e2d9     (warm off-white, not pure white)
  secondary: #9c9488     (muted labels)
  tertiary:  #6b6560     (disabled, hints)

Accent:
  amber:     #d4924a     (primary action, highlights, Mars sun)
  red:       #c75a3a     (critical alerts, Mars terrain)
  green:     #5a9a6b     (healthy, growth, positive)
  yellow:    #c4a344     (warning, attention needed)
  blue:      #4a7c9e     (water, cool, information)
  purple:    #7c6aad     (agent/AI actions, knowledge base)

Status:
  healthy:   #5a9a6b
  warning:   #c4a344
  critical:  #c75a3a
```

### Typography

System font stack. One font weight for body, one for headings. No decorative fonts.

```
Font: system-ui, -apple-system, sans-serif
Monospace (for data/numbers): 'SF Mono', 'Cascadia Code', 'JetBrains Mono', monospace

Sizes:
  page-title: text-xl font-medium tracking-tight
  section:    text-base font-medium
  body:       text-sm
  label:      text-xs text-secondary uppercase tracking-wide
  data:       text-sm font-mono tabular-nums
```

### Spacing and layout

```
Navbar:      h-14, fixed top, full width
Content:     flex-1, pt-14 p-6 gap-4
Cards:       rounded-lg border border-border bg-surface p-4
Widgets:     min-h-[160px] (dashboard cards maintain visual consistency)
```

### Component style rules

- Cards: `bg-surface border-border rounded-lg` -- no shadows, borders only
- Status dots: small 8px circles with status colors, no text badges for inline status
- Numbers: always monospace, tabular-nums for alignment
- Labels: uppercase, xs, secondary color, letter-spaced
- No gradients except on the greenhouse visualization
- No rounded-full buttons -- use rounded-lg consistently
- Icons: 16px for inline, 20px for standalone -- lucide-react only

---

## Phase 2: Layout Shell

Build the persistent layout that wraps every page.

### File: `src/app/layout.tsx`

Root layout with dark theme class on html.

### File: `src/components/layout/navbar.tsx`

Fixed top navigation bar, always visible. Contains:

```
Left section:
  Logo / App name ("GREENHOUSE")
  Mission counter: "SOL 142 / 450"

Center section — Navigation links (horizontal):
  Dashboard
  Greenhouse
  Agent
  Alerts
  Crops
  Nutrition
  Forecasting

  Admin dropdown (single dropdown button, opens menu):
    Simulation
    Scenarios
    Agent Config
    Analytics

Right section:
  Simulation controls: play/pause, speed buttons (1x / 10x)
  Quick status: 3 tiny resource bars (water/nutrient/energy) + alert badge count
```

Each nav link: icon + label (text only on larger screens, icon-only on narrow). Active state highlighted with amber accent underline.

### File: `src/components/layout/app-shell.tsx`

Composes navbar + main content area. Every page renders inside this.

```tsx
<div className="flex min-h-screen flex-col bg-base text-primary">
  <Navbar />
  <main className="flex-1 overflow-y-auto p-6 pt-20">
    {children}
  </main>
</div>
```

---

## Phase 3: Mock Data Layer

Before any page UI, create the mock data that powers everything. This means all pages can be built in parallel, and switching to real API later is a single-file change.

### File: `src/lib/types.ts`

All TypeScript types/interfaces, derived directly from `contracts/API.md`. Group by controller:

```ts
// === Enums (match API contract exactly) ===
type GreenhouseStatus = 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL'
type SlotStatus = 'EMPTY' | 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL'
type SensorStatus = 'NORMAL' | 'WARNING' | 'CRITICAL'
type LightCyclePhase = 'DAY' | 'NIGHT'
type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL'
type AlertType = 'NUTRIENT_DEFICIENCY' | 'DISEASE' | 'ENVIRONMENTAL_STRESS' | 'EQUIPMENT_FAILURE' | 'OTHER'
type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'
type AgentOutcome = 'SUCCESS' | 'PENDING' | 'FAILED'
type RecommendationStatus = 'PENDING' | 'APPROVED' | 'DISMISSED'
type Urgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
type AutonomyLevel = 'FULLY_AUTONOMOUS' | 'SUGGEST_ONLY' | 'HYBRID'
type RiskTolerance = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE'
type SimulationStatus = 'RUNNING' | 'PAUSED' | 'COMPLETED'
type ScenarioType = 'WATER_LEAK' | 'SOLAR_PANEL_FAILURE' | 'DISEASE_OUTBREAK' | 'DUST_STORM' | 'EQUIPMENT_MALFUNCTION'
type ScenarioSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CATASTROPHIC'
type InjectionStatus = 'ACTIVE' | 'RESOLVED'
type CropCategory = 'VEGETABLE' | 'LEGUME' | 'GRAIN' | 'HERB'
type WaterRequirement = 'LOW' | 'MEDIUM' | 'HIGH'
type StressType = 'DROUGHT' | 'OVERWATERING' | 'HEAT' | 'COLD' | 'NUTRIENT_DEFICIENCY_N' | 'NUTRIENT_DEFICIENCY_K' | 'NUTRIENT_DEFICIENCY_FE' | 'SALINITY' | 'LIGHT_INSUFFICIENT' | 'LIGHT_EXCESSIVE' | 'CO2_IMBALANCE' | 'ROOT_HYPOXIA'
type TimelineEventType = 'SENSOR_SNAPSHOT' | 'SLOT_SNAPSHOT' | 'AGENT_ACTION' | 'STRESS_DETECTED' | 'STRESS_RESOLVED' | 'SCENARIO_INJECTED' | 'HARVEST'
type MilestoneType = 'HARVEST_WINDOW' | 'PLANTING_DEADLINE' | 'RESOURCE_CRITICAL' | 'TRIP_END'

// === Interfaces (match API response shapes) ===

// GreenhouseController
interface GreenhouseSummary { id, name, description, rows, cols, totalSlots, occupiedSlots, overallStatus }
interface GreenhouseDetail { ...GreenhouseSummary, slots: PlantSlot[], resources: { waterReservePercent, nutrientReservePercent, energyReservePercent } }
interface PlantSlot { id, position: {row, col}, cropId, cropName, status, growthStagePercent, daysUntilHarvest, plantedAt, activeStressTypes, estimatedYieldKg }
interface SensorSnapshot { timestamp, temperature, humidity, lightIntensity, par, lightCyclePhase, co2, waterFlowRate, waterRecyclingEfficiency, nutrientSolution: {ph, ec, dissolvedOxygen} }
  // Each sensor value: { value: number, status: SensorStatus }
interface SensorHistoryReading { timestamp, temperature, humidity, lightIntensity, par, co2, waterFlowRate, waterRecyclingEfficiency, nutrientSolutionPh, nutrientSolutionEc, nutrientSolutionDissolvedOxygen }

// WeatherController
interface MarsWeather { timestamp, solarIrradiance, dustStormIndex, externalTemperature, atmosphericPressure, forecast: WeatherForecastDay[] }
interface WeatherForecastDay { missionDay, dustStormRisk: RiskLevel, solarIrradiance }

// AgentController
interface AgentLogEntry { id, timestamp, actionType, description, reasoning, knowledgeBaseSource, outcome: AgentOutcome }
interface Recommendation { id, createdAt, actionType, description, reasoning, confidence, urgency: Urgency, expiresAt, status: RecommendationStatus }
interface AgentConfig { autonomyLevel, certaintyThreshold, riskTolerance, priorityWeights: { yield, diversity, resourceConservation } }

// AlertController
interface Alert { id, createdAt, resolvedAt, severity, type: AlertType, cropId, slotId, greenhouseId, diagnosis, confidence, status: AlertStatus, escalatedToHuman, suggestedAction }

// CropController
interface Crop { id, name, category, growthDays, harvestIndex, typicalYieldPerM2Kg, waterRequirement, environmentalRequirements: {...}, stressSensitivities, nutritionalProfile: { caloriesPer100g, proteinG, carbsG, fatG, fiberG, micronutrients: {...} } }
interface PlantingQueueItem { rank, cropId, cropName, greenhouseId, recommendedPlantDate, missionDay, reason, nutritionalGapsAddressed }
interface HarvestEntry { id, harvestedAt, missionDay, cropId, cropName, yieldKg, slotId, greenhouseId, notes }
interface StockpileItem { cropId, cropName, quantityKg, estimatedCalories, daysOfSupply, expiresInDays }

// NutritionController
interface DailyNutritionEntry { date, totalCalories, proteinG, carbsG, fatG, fiberG, targetCalories, coveragePercent, micronutrients: {...} }
interface CoverageHeatmap { nutrients: string[], missionDays: number[], coverage: number[][] }

// ForecastController
interface ResourceProjection { missionDay, waterReservePercent, nutrientReservePercent, energyReservePercent, riskLevel }
interface MissionTimeline { missionStartDate, missionEndDate, currentMissionDay, totalMissionDays, milestones: Milestone[] }
interface Milestone { missionDay, date, type: MilestoneType, label, cropId }

// SimulationController
interface SimulationSummary { id, name, learningGoal, status, createdAt, completedAt, missionDuration, crewSize, yieldTarget, outcomeScore, autonomyLevel, riskTolerance }
interface SimulationDetail extends SimulationSummary { resourceAvailability: {...}, agentConfig: AgentConfig, currentMetrics: {...} }
interface ScenarioInjection { id, scenarioId, scenarioName, triggeredAt, resolvedAt, intensity, status: InjectionStatus }

// ScenarioController
interface Scenario { id, name, type: ScenarioType, description, severity: ScenarioSeverity, defaultDurationMinutes }

// AnalyticsController
interface AgentPerformance { simulationId, simulationName, status, decisionAccuracyPercent, avgResponseTimeMs, resourceEfficiencyScore, nutritionalTargetHitRate, diversityScore, autonomousActionsCount, humanOverridesCount, crisisResponseScore }

// OnboardingController
interface OnboardingStatus { completed, completedSteps: string[], totalSteps }
```

### File: `src/lib/api.ts`

Centralized API client. Every function maps 1:1 to a contract endpoint. During dev, each function returns mock data. When the backend is ready, swap the implementation to `fetch()` calls.

```ts
// Structure:
export const api = {
  greenhouses: {
    list: () => ...,
    get: (id) => ...,
    create: (body) => ...,
    update: (id, body) => ...,
    delete: (id) => ...,
    sensorsLatest: (id) => ...,
    sensorsHistory: (id, params) => ...,
  },
  slots: {
    get: (greenhouseId, slotId) => ...,
    update: (greenhouseId, slotId, body) => ...,
    history: (greenhouseId, slotId, params) => ...,
  },
  weather: {
    current: () => ...,
  },
  agent: {
    log: (params) => ...,
    recommendations: (params) => ...,
    approveRecommendation: (id) => ...,
    dismissRecommendation: (id, reason) => ...,
    config: () => ...,
    updateConfig: (body) => ...,
  },
  alerts: {
    list: (params) => ...,
    get: (id) => ...,
    acknowledge: (id, note) => ...,
    resolve: (id, resolution) => ...,
  },
  crops: {
    list: () => ...,
    plantingQueue: (greenhouseId?) => ...,
    harvestJournal: (params) => ...,
    logHarvest: (body) => ...,
    stockpile: () => ...,
  },
  nutrition: {
    consumption: (from, to) => ...,
    logConsumption: (body) => ...,
    coverageHeatmap: (fromDay?, toDay?) => ...,
  },
  forecast: {
    resources: (days?) => ...,
    missionTimeline: () => ...,
  },
  simulations: {
    list: () => ...,
    create: (body) => ...,
    get: (id) => ...,
    update: (id, body) => ...,
    injections: (id) => ...,
    inject: (id, body) => ...,
    cancelInjection: (simId, injId) => ...,
    pause: (id) => ...,
    resume: (id) => ...,
    stop: (id) => ...,
    timeline: (id, params) => ...,
  },
  scenarios: {
    list: () => ...,
  },
  analytics: {
    agentPerformance: (simulationId?) => ...,
  },
  onboarding: {
    status: () => ...,
    complete: () => ...,
    completeStep: (stepKey) => ...,
    reset: () => ...,
  },
}
```

### File: `src/lib/mock-data.ts`

One file exporting all mock state. Structured to match the API response shapes exactly. Includes:
- 2 greenhouses (one 4x6 "Alpha", one 3x4 "Beta") with populated slots
- 8 crop types with full nutritional profiles
- Sensor snapshots with realistic Mars greenhouse values
- Weather with dust storm forecast
- Agent log entries, recommendations, alerts
- Harvest journal entries, stockpile
- Nutrition consumption data for ~7 days
- Resource forecast for 30 days
- Mission timeline with milestones
- 1 running simulation with injections
- 5 crisis scenario types

### File: `src/lib/simulation.ts`

A simple simulation tick function that advances mock state over time. Used by simulation speed controls. Not a real physics engine -- just plausible data changes per tick:

- Increment currentMissionDay
- Advance crop growthStagePercent
- Decrease resource reserve levels slightly
- Occasionally trigger an alert
- Log agent actions

### File: `src/hooks/use-simulation.ts`

React hook that runs the simulation loop at the configured speed, providing current state to all pages via context.

### File: `src/providers/simulation-provider.tsx`

React context wrapping the app. All pages and modules read from this context. This is the single data source that makes modularity work -- compact and full variants of the same module read the same context.

---

## Phase 4: Pages (build order)

Build pages in this order. Each page is a composition of module components.

---

### 4.1 Dashboard (`src/app/dashboard/page.tsx`)

The first page to build because it uses compact variants of every module. Building this forces us to build all the compact widgets first.

**Layout:** CSS grid, responsive. 3-column on desktop, 2 on tablet, 1 on mobile.

```
Row 1: [Greenhouse viz (span 2)]  [Mars weather]
Row 2: [Sensor snapshot]          [Resources]       [Alerts]
Row 3: [Agent activity]           [Pending actions]  [Next harvests]
Row 4: [Nutrition status]         [Forecast]         [Timeline]
```

Each widget is a shadcn Card with:
- Small label header (uppercase, xs, secondary color)
- Content area
- Click target to navigate to full page

**Module components to build for this page:**

```
src/components/modules/greenhouse-viz/compact.tsx
src/components/modules/sensors/compact.tsx
src/components/modules/resources/compact.tsx
src/components/modules/weather/compact.tsx
src/components/modules/alerts/compact.tsx
src/components/modules/agent-log/compact.tsx
src/components/modules/actions-queue/compact.tsx
src/components/modules/crops/compact.tsx
src/components/modules/nutrition/compact.tsx
src/components/modules/forecast/compact.tsx
src/components/modules/timeline/compact.tsx
```

---

### 4.2 Greenhouse Environment (`src/app/greenhouse/page.tsx`)

The visual centerpiece. This page sells the project.

**Data sources:** `GET /api/greenhouses`, `GET /api/greenhouses/{id}` (slots + resources), `GET /api/greenhouses/{id}/sensors/latest`, `GET /api/greenhouses/{id}/sensors/history`

**Layout:** Greenhouse selector (dropdown/tabs if multiple greenhouses) at top, then stacked sections.

**Sections:**
1. Cross-section SVG view (large, 400-500px tall) -- animated greenhouse scene
2. Top-down grid view with metric overlay selector (status, growth, stress, yield)
3. Full sensor readouts (gauges with sparklines from sensor history)

**Module components:**

```
src/components/modules/greenhouse-viz/cross-section.tsx   (SVG scene)
src/components/modules/greenhouse-viz/top-down.tsx        (grid with overlays)
src/components/modules/greenhouse-viz/zone-tooltip.tsx    (shared tooltip)
src/components/modules/sensors/full.tsx                   (gauges + sparklines)
```

**SVG approach for cross-section:**
- Build dome, ground, sky as static SVG layers
- Plant slots are positioned within the dome
- Each slot renders a crop SVG based on growthStagePercent (from API)
- Weather layer sits behind/around the dome (driven by `GET /api/weather/current`)
- Use Framer Motion `AnimatePresence` for weather state transitions
- CSS keyframes for ambient loops (light rays, particles)

Start with a SIMPLIFIED version: colored rectangles for plants, basic dome outline, simple weather indicators. Polish the SVGs later. Get the structure and animation wiring right first.

---

### 4.3 Autonomous Agent (`src/app/agent/page.tsx`)

**Data sources:** `GET /api/agent/recommendations`, `GET /api/agent/log`, `GET /api/agent/config`

**Layout:** Two-panel vertical split.

**Sections:**
1. Recommended Actions Queue (top) -- cards with approve/dismiss buttons. Each shows actionType, description, reasoning, confidence bar, urgency badge, expiresAt countdown.
2. Activity Log (bottom, scrollable) -- filterable by actionType and outcome. Each entry expandable to show reasoning + knowledgeBaseSource.

**Module components:**

```
src/components/modules/agent-log/full.tsx           (filterable feed)
src/components/modules/agent-log/log-entry.tsx      (single expandable entry)
src/components/modules/actions-queue/full.tsx        (queue with approve/reject)
src/components/modules/actions-queue/action-card.tsx (single action)
```

---

### 4.4 Alerts and Incidents (`src/app/alerts/page.tsx`)

**Data sources:** `GET /api/alerts`, `GET /api/alerts/{id}`, `POST .../acknowledge`, `POST .../resolve`

**Layout:** Single-column list with expandable detail panels.

**Sections:**
1. Active alerts (OPEN + ACKNOWLEDGED, sorted by severity). Each card shows: severity badge, alertType, diagnosis, confidence, suggestedAction, escalatedToHuman flag.
2. Resolved alerts (collapsed by default)

**Actions:** Acknowledge button (moves OPEN -> ACKNOWLEDGED), Resolve button with resolution text input.

**Module components:**

```
src/components/modules/alerts/full.tsx
src/components/modules/alerts/alert-card.tsx
```

---

### 4.5 Crop and Harvest Management (`src/app/crops/page.tsx`)

**Data sources:** `GET /api/crops` (catalog), `GET /api/crops/planting-queue`, `GET /api/crops/harvest-journal`, `GET /api/crops/stockpile`

**Layout:** Tabbed interface using shadcn Tabs.

**Tabs:**
1. Crop Catalog -- grid of crop cards showing name, category, growthDays, nutritionalProfile summary, waterRequirement, environmentalRequirements ranges
2. Planting Queue -- ranked list from agent. Shows rank, cropName, recommendedPlantDate, reason, nutritionalGapsAddressed tags
3. Harvest Journal -- paginated table with harvestedAt, cropName, yieldKg, greenhouseId, notes
4. Stockpile -- inventory list with quantityKg, estimatedCalories, daysOfSupply, expiresInDays

**Module components:**

```
src/components/modules/crops/full.tsx
src/components/modules/crops/crop-card.tsx
src/components/modules/crops/planting-queue.tsx
src/components/modules/crops/harvest-log.tsx
src/components/modules/crops/stockpile-list.tsx
```

---

### 4.6 Nutrition and Consumption (`src/app/nutrition/page.tsx`)

**Data sources:** `GET /api/nutrition/consumption`, `GET /api/nutrition/coverage-heatmap`

**Layout:** Top section with big numbers, bottom section with heatmap.

**Sections:**
1. Calorie tracker (big number: totalCalories vs targetCalories + trend chart over dailyEntries)
2. Macro breakdown (horizontal bars: proteinG, carbsG, fatG, fiberG -- current vs target)
3. Micronutrient coverage heatmap (nutrients x missionDays grid, cells colored 0-100%)

**Module components:**

```
src/components/modules/nutrition/full.tsx
src/components/modules/nutrition/calorie-chart.tsx    (Recharts AreaChart)
src/components/modules/nutrition/macro-bars.tsx        (horizontal bar chart)
src/components/modules/nutrition/coverage-heatmap.tsx  (custom grid from API)
```

---

### 4.7 Forecasting (`src/app/forecasting/page.tsx`)

**Data sources:** `GET /api/forecast/resources`, `GET /api/forecast/mission-timeline`, `GET /api/weather/current`

**Layout:** Chart-heavy page. Resource forecasts on top, mission timeline below.

**Sections:**
1. Resource projection charts (Recharts AreaChart with waterReservePercent, nutrientReservePercent, energyReservePercent lines, color-coded riskLevel bands)
2. Mars weather outlook (extended forecast from weather.forecast array -- dustStormRisk + solarIrradiance per mission day)
3. Mission timeline (horizontal scrollable, milestones plotted by missionDay with type-based icons: HARVEST_WINDOW, PLANTING_DEADLINE, RESOURCE_CRITICAL, TRIP_END)

**Module components:**

```
src/components/modules/forecast/full.tsx
src/components/modules/forecast/resource-chart.tsx    (Recharts)
src/components/modules/weather/full.tsx
src/components/modules/timeline/full.tsx
```

---

### 4.8 Admin Pages

Lower priority for visual polish. Functional forms and tables.

**Simulation** (`src/app/admin/simulation/page.tsx`)

Data: `GET/POST /api/simulations`, `GET /api/simulations/{id}`, pause/resume/stop actions

- Table of past simulation runs (name, status, outcomeScore, autonomyLevel, riskTolerance)
- Form to create new simulation (name, learningGoal, missionDuration, crewSize, yieldTarget, resourceAvailability, agentConfig)
- Detail view: currentMetrics (missionDay, reserves, totalYieldKg), injections list
- Controls: pause, resume, stop

**Scenarios** (`src/app/admin/scenarios/page.tsx`)

Data: `GET /api/scenarios`, `POST /api/simulations/{id}/injections`

- Card grid of available crisis types (name, type, severity, description)
- Click to inject: intensity slider (0-1), optional durationMinutes, target simulation selector
- Active injection indicators with cancel button

**Agent Config** (`src/app/admin/agent-config/page.tsx`)

Data: `GET/PUT /api/agent/config`

- Radio group for autonomyLevel (FULLY_AUTONOMOUS / HYBRID / SUGGEST_ONLY)
- Slider for certaintyThreshold (0.0 - 1.0)
- Radio group for riskTolerance (CONSERVATIVE / MODERATE / AGGRESSIVE)
- Three linked sliders for priorityWeights (yield + diversity + resourceConservation must sum to 1.0)
- Save button

**Analytics** (`src/app/admin/analytics/page.tsx`)

Data: `GET /api/analytics/agent-performance`

- Simulation selector dropdown
- Stat cards: decisionAccuracyPercent, avgResponseTimeMs, resourceEfficiencyScore, nutritionalTargetHitRate, diversityScore, crisisResponseScore
- Ratio display: autonomousActionsCount vs humanOverridesCount

---

## Phase 5: Greenhouse Visualization (deep work)

This is the make-or-break visual. Once the basic structure is working from Phase 4.2, iterate on polish.

### 5.1 SVG plant assets

Create 6 crop types x 4-5 growth stages as simple SVGs. Style: geometric, slightly rounded, flat color with 1-2 accent shades. NOT photorealistic. Think: stylized icon illustrations scaled up.

Quick approach: build them as React SVG components with props for color/scale. Each stage is a different component or a single component with conditional paths.

### 5.2 Weather animations

- Clear: amber gradient overlay on sky, diagonal light ray lines (CSS animated translateX)
- Dust storm: CSS keyframe particle drift, sky darkens (opacity overlay), dome gets haze filter
- Night: dark blue sky, star dots, LED glow on plants (purple/pink tint)

### 5.3 Top-down metric overlays

- Build the grid as a CSS grid of divs (not SVG -- easier styling)
- Each cell's background-color driven by the selected metric (status color, growth %, stress type, estimated yield)
- Smooth `transition-colors duration-300` on metric switch
- Metric selector: shadcn dropdown or segmented button bar above the grid

---

## File Structure Summary

```
src/
  app/
    layout.tsx                    # Root layout, dark theme, simulation provider
    page.tsx                      # Redirect to /dashboard
    dashboard/page.tsx
    greenhouse/page.tsx
    agent/page.tsx
    alerts/page.tsx
    crops/page.tsx
    nutrition/page.tsx
    forecasting/page.tsx
    admin/
      simulation/page.tsx
      scenarios/page.tsx
      agent-config/page.tsx
      analytics/page.tsx

  components/
    layout/
      navbar.tsx                  # Top navigation bar
      app-shell.tsx               # Navbar + main content area
      nav-link.tsx                # Single nav item
      sim-controls.tsx            # Play/pause/speed in navbar

    modules/
      greenhouse-viz/
        compact.tsx               # Dashboard widget
        cross-section.tsx         # SVG animated scene
        top-down.tsx              # Grid with metric overlays
        zone-tooltip.tsx
        plants/                   # SVG crop components
          lettuce.tsx
          tomato.tsx
          potato.tsx
          spinach.tsx
          soybean.tsx
          wheat.tsx

      sensors/
        compact.tsx
        full.tsx
        gauge.tsx                 # Reusable gauge component

      resources/
        compact.tsx
        full.tsx

      weather/
        compact.tsx
        full.tsx

      agent-log/
        compact.tsx
        full.tsx
        log-entry.tsx

      actions-queue/
        compact.tsx
        full.tsx
        action-card.tsx

      alerts/
        compact.tsx
        full.tsx
        alert-card.tsx

      crops/
        compact.tsx
        full.tsx
        crop-card.tsx
        planting-queue.tsx
        harvest-log.tsx
        stockpile-list.tsx

      nutrition/
        compact.tsx
        full.tsx
        calorie-chart.tsx
        macro-bars.tsx
        coverage-heatmap.tsx

      forecast/
        compact.tsx
        full.tsx
        resource-chart.tsx

      timeline/
        compact.tsx
        full.tsx

    ui/                           # shadcn components live here (auto-generated)

  lib/
    types.ts                      # All TypeScript interfaces (from contracts/API.md)
    api.ts                        # Centralized API client (mock -> real swap point)
    mock-data.ts                  # Static mock data matching API shapes
    simulation.ts                 # Simulation tick logic
    utils.ts                      # cn() helper, formatters

  hooks/
    use-simulation.ts             # Simulation loop hook

  providers/
    simulation-provider.tsx       # React context for simulation state

  styles/
    greenhouse.css                # CSS keyframe animations for greenhouse
```

---

## Build Order (what to do first)

```
1. Phase 0: Init Next.js, install deps, add shadcn components
2. Phase 1: Design tokens in tailwind.config.ts + globals.css
3. Phase 2: Layout shell (navbar, app-shell)
4. Phase 3: Types + api client + mock data + simulation context
5. Phase 4.1: Dashboard with all compact widgets
   -- At this point you have a working app with visible data --
6. Phase 4.2: Greenhouse page (simplified, colored rectangles)
7. Phase 4.3: Agent page
8. Phase 4.6: Nutrition page (charts are high visual impact)
9. Phase 4.7: Forecasting page
10. Phase 4.4: Alerts page
11. Phase 4.5: Crops page
12. Phase 4.8: Admin pages (minimal styling)
13. Phase 5: Polish greenhouse SVGs and animations
```

The critical milestone is after step 5: you have a navigable app with a dashboard showing real-looking data. Everything after that is filling in detail pages and polish.

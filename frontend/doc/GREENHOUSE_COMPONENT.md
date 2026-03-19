# Greenhouse Visualization Component

The hero visual of the entire app. Two distinct views of the same greenhouse, each serving a different purpose. The user toggles between them or sees both on the Greenhouse Environment page.

---

## View 1: Cross-Section View (Side Profile)

The "living" view. Shows the greenhouse as if you sliced it in half and are looking at it from the side. This is where the STORY of the greenhouse is told visually.

### Structure

- **Dome shell** — transparent curved structure, slightly tinted. The dome sits on Mars terrain (rust/amber ground, distant horizon, sky gradient from salmon to dark).
- **Interior ground level** — divided into visible growing zones/beds running left to right across the floor of the dome.
- **Plants** — each zone shows its crop rendered at its CURRENT growth stage. A seedling looks like a seedling. A mature tomato plant has visible fruit. A harvested zone shows bare soil or freshly replanted sprouts.
- **Infrastructure** — subtle lines showing irrigation pipes along the base, overhead LED grow lights hanging from the dome frame, small sensor nodes on the walls.

### Animated States: Plants

Each crop type needs a small set of growth stage illustrations (simple, stylized, not photorealistic):

| Stage | Visual |
|-------|--------|
| Empty/fallow | Bare growing bed, soil visible |
| Seeded | Soil with tiny markers/labels |
| Sprouting | Small green shoots breaking surface |
| Vegetative | Leafy growth, increasing in size |
| Flowering/fruiting | Visible flowers or small fruit forming |
| Harvest-ready | Full-size plant, fruit/leaves at peak, subtle glow or highlight to signal "ready" |
| Stressed | Yellowing leaves, drooping, desaturated color |
| Dead/failed | Brown, wilted, collapsed |

Transitions between stages are smooth (CSS/Framer Motion). In real-time simulation, plants visibly grow as days advance. When simulation is sped up, you watch the greenhouse come to life.

### Animated States: Watering

When a zone is being actively watered:
- Small animated droplets or flow lines along the irrigation pipes leading to that zone
- Subtle blue tint/shimmer on the soil surface of the active zone
- Duration: plays for a few seconds then stops (triggered by agent action or scheduled watering event)

### Animated States: External Weather

Outside the dome, the Mars environment is alive:

| Condition | Animation |
|-----------|-----------|
| Clear day | Warm amber sunlight rays hitting the dome from the appropriate angle. Light passes through dome and falls on plants as visible light patches. |
| Dust storm | Particles blowing across the exterior. Sky darkens. Sunlight dims. Interior lighting kicks in brighter (LEDs compensating). Dome shell gets a dusty/hazy overlay. |
| Night | Dark exterior. Stars visible. Interior lit only by LED grow lights casting purple/pink artificial glow on plants. |
| High wind | Subtle vibration or sway on dome surface. Dust particles moving fast outside. |
| Radiation event | Faint orange/red pulse on the dome exterior. Warning indicator. |

### Animated States: Systems

| Event | Animation |
|-------|-----------|
| LED lights adjusting | Visible brightness change on the overhead lights. Color temperature shift if spectrum changes. |
| Temperature change | Subtle heat shimmer effect if heating. Cool blue tinge near vents if cooling. |
| CO2 injection | Faint mist/gas animation near vent locations. |
| Sensor alert | The affected zone's sensor node blinks red. |

### Interaction

- **Hover a zone** — tooltip showing crop name, growth stage, health, days to harvest
- **Click a zone** — opens that crop's detail card (connects to Crop Cards module)
- **Hover external weather** — tooltip showing current Mars conditions
- **Non-interactive mode** — on dashboard, this runs as a passive animation with no hover/click (just visual status)

### Color Language

The plants and zones silently communicate status through color:
- Healthy: natural greens, vibrant
- Needs attention: slight yellowing or muted tones
- Critical: desaturated, brown tints
- Harvest-ready: subtle golden glow or sparkle

No need for explicit labels in this view — the color tells the story. Labels live in View 2.

---

## View 2: Top-Down Eagle View (Floor Plan)

The "data" view. Shows the greenhouse from directly above. The dome becomes a flat oval/circular shape, and the interior is divided into a clean grid of rectangular crop zones. This is where the astronaut makes decisions.

### Structure

- **Dome outline** — oval or circular border representing the greenhouse footprint from above
- **Grid cells** — the interior is divided into rectangular sections, one per growing zone. Uniform grid with subtle divider lines.
- **Airlock/entry** — small protrusion on one side of the dome showing the entry point (orientation anchor so the astronaut knows which side is which)
- **Secondary structures** — if applicable, smaller attached modules (storage, equipment room) shown as adjacent shapes

### Per-Cell Information (Default View)

Each grid cell shows:
- Crop icon or name label
- Growth stage indicator (small progress bar or ring)
- Health status color fill (green/yellow/red background tint)

### Metric Overlay Modes

The key feature of this view: the astronaut selects a METRIC and the entire grid recolors to show that metric across all zones. Like a heatmap that answers one question at a time.

| Metric Mode | What each cell shows |
|-------------|---------------------|
| **Health** (default) | Green/yellow/red based on overall plant health score |
| **Water usage** | Blue gradient — darker = consuming more water |
| **Growth progress** | Progress bar or percentage — how far along to harvest |
| **Temperature** | Warm-to-cool gradient per zone (some zones may run hotter) |
| **Light levels** | Yellow gradient — showing light distribution across zones |
| **Nutrient levels** | Colored by nutrient solution concentration |
| **Days to harvest** | Number in each cell, color-coded (green = soon, gray = far) |
| **Yield forecast** | Projected kg output per zone, color-coded by relative contribution |
| **Stress indicators** | Red highlighting on zones with active stress alerts |

Switching between modes is a dropdown or toggle bar above the grid. Transition is a smooth color fade, not a hard switch.

### Interaction

- **Hover a cell** — expanded tooltip with full zone stats (crop, stage, health, water, light, next action)
- **Click a cell** — opens crop detail card (same as cross-section view, connects to Crop Cards module)
- **Select multiple cells** — compare zones side by side (stretch goal)
- **Metric selector** — dropdown/toggle bar to switch overlay mode

### Visual Style

- Clean, minimal, diagrammatic — not trying to look "real" like the cross-section view
- Thin grid lines, rounded cell corners
- Muted base colors with the metric overlay providing the visual signal
- Small icons per crop type (tomato, lettuce, potato, etc.) centered in each cell
- The dome outline should feel like a blueprint/technical drawing — fits the "mission control" aesthetic

---

## How Both Views Connect

These are two perspectives of the SAME greenhouse state. They share the same data source. When the agent waters Zone 3, the cross-section view shows water animation in that zone AND the top-down view's water usage metric updates for that cell.

### On the Greenhouse Environment Page

Both views shown together. Layout options:
- **Option A: Stacked** — cross-section on top (larger, hero), top-down below (data reference)
- **Option B: Tabs** — toggle between the two views
- **Option C: Split** — side by side on wide screens (cross-section left, top-down right)

Recommendation: **Option A (stacked)** — the cross-section is the visual hook, the top-down is the working tool below it.

### On the Dashboard

Only the cross-section view appears, in compact mode:
- Smaller size, no hover/click interaction
- Passive animation running (plants at current stage, current weather outside)
- Acts as a "window into the greenhouse" — glanceable status
- Click anywhere on it to navigate to the full Greenhouse Environment page

---

## Animation Performance Notes

- Use CSS animations for simple loops (weather particles, light rays, water droplets)
- Use Framer Motion for state transitions (plant growth stage changes, metric overlay fades)
- Use canvas or SVG for the particle effects (dust storm, precipitation) if CSS is too heavy
- Plants should be SVG-based for clean scaling and easy state swaps
- Target 30fps for ambient animations, 60fps for interaction responses
- Provide a "reduce motion" toggle for accessibility (replaces animations with instant state changes)

---

## Crop Visual Assets Needed

Each crop type needs a simple SVG illustration set:

| Crop | Side view stages (for cross-section) | Top-down icon (for eagle view) |
|------|--------------------------------------|-------------------------------|
| Lettuce | 6 stages: empty -> seed -> sprout -> small rosette -> full head -> harvest glow | Circular leaf cluster icon |
| Tomato | 6 stages: empty -> seed -> sprout -> vine with leaves -> flowers -> red fruit | Round fruit icon |
| Potato | 6 stages: empty -> seed -> sprout -> bushy foliage -> flowering -> harvest glow (tubers underground implied) | Root/tuber icon |
| Spinach | 6 stages: empty -> seed -> sprout -> small leaves -> full bunch -> harvest glow | Leaf bunch icon |
| Soybean | 6 stages: empty -> seed -> sprout -> branching plant -> pods forming -> full pods | Pod icon |
| Wheat | 6 stages: empty -> seed -> sprout -> tall grass -> grain heads forming -> golden ready | Grain stalk icon |

These don't need to be photorealistic. Stylized, clean, slightly geometric SVGs that read well at small sizes. Can be AI-generated or hand-drawn and vectorized.

---

## Data Interface

Both views consume the same state object:

```
GreenhouseState {
  zones: [
    {
      id: string
      position: { row, col }          // for top-down grid placement
      crop: CropType | null
      growthStage: 'empty' | 'seeded' | 'sprouting' | 'vegetative' | 'flowering' | 'harvest-ready' | 'stressed' | 'dead'
      growthProgress: number           // 0-100%
      healthScore: number              // 0-100
      daysToHarvest: number
      waterUsage: number               // liters/day
      lightLevel: number               // umol/m2/s
      temperature: number              // celsius
      nutrientLevel: number            // concentration
      yieldForecast: number            // kg
      activeAlerts: Alert[]
      isBeingWatered: boolean          // triggers water animation
    }
  ]
  environment: {
    timeOfDay: 'day' | 'night' | 'twilight'
    weatherCondition: 'clear' | 'dusty' | 'storm' | 'high-wind'
    dustOpacity: number                // 0-1, drives storm intensity
    solarIrradiance: number            // W/m2
    externalTemp: number
    windSpeed: number
    isRadiationEvent: boolean
  }
  systems: {
    ledBrightness: number              // 0-100%
    ledSpectrum: 'full' | 'red-blue' | 'supplemental'
    heatingActive: boolean
    coolingActive: boolean
    co2Injecting: boolean
  }
  mission: {
    currentSol: number
    totalSols: number
  }
}
```

This state updates every simulation tick. Both views re-render reactively from it.

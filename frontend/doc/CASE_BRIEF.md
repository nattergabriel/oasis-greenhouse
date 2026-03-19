# Syngenta x AWS Hackathon Challenge

## Agriculture's Next Frontier: Feeding Humans on the Red Planet

**Event:** St Gallen, 18 March 2026 | **Partners:** Syngenta Group + AWS

---

## The Problem

NASA targets the late 2030s to send astronauts to Mars (up to 9 months each way). Growing nutritionally balanced food on Mars is critical for mission success.

## The Challenge

Design an **autonomous AI agent system** to manage a **Martian greenhouse** for **4 astronauts** during a **450-day surface-stay mission**. Maximize nutrient output, maintain dietary balance, minimize resource consumption.

## Knowledge Base (7 domains via Amazon Bedrock)

| # | Domain | Contents |
|---|--------|----------|
| 1 | Mars Environmental Constraints | Gravity, daylight, sunlight intensity, atmosphere, soil |
| 2 | Controlled Environment Agriculture | Hydroponics, environmental control for isolated environments |
| 3 | Crop Profiles | Yield, growth cycles, nutrition/water needs, optimum conditions, stress responses |
| 4 | Plant Stress and Response Guide | Detection and mitigation strategies |
| 5 | Human Nutritional Strategy | Requirements and optimization for astronaut dietary needs |
| 6 | Greenhouse Operational Scenarios | Events and failure modes for AI decision-making |
| 7 | Innovation Impact (Mars to Earth) | Autonomous agriculture applied to Earth |

## Architecture

```
Your Account                    Syngenta AWS Account
+-----------------+             +-----------------------------------+
|  AI Agent       |  /mcp      | Amazon Bedrock Knowledge Base     |
|  (MCP Client)   +----------->| AgentCore Gateway (interceptors)  |
+-----------------+  Endpoint   |   -> API / Lambda / MCP targets   |
                                +-----------------------------------+
```

## Judging (25% each)

Creativity | Functional Accuracy | Visual Design / UX | Presentation / Demo

---
---

# PRODUCT FEATURES

## Modularity Principle

Features are built as **self-contained component modules**. Each module is implemented once with its full logic, data, and visuals. Pages compose these modules -- they don't re-implement them. A module can appear as a compact widget (dashboard) or expanded full view (dedicated page).

```
Module: defined once with full logic
  -> Compact variant: summary card for dashboard/sidebar embedding
  -> Full variant: detailed view for dedicated page
  -> Shared state: both variants read from the same data source
```

---

## COMPONENT MODULES

These are the atomic building blocks. Each is defined once and reused.

---

### Module: Greenhouse Visualization

**What it is:** Animated visual representation of the greenhouse showing all growing zones and plant status at a glance.

**Data sources:** Crop Profiles (KB #3), Plant Stress Guide (KB #4), live sensor state

**Full variant (Greenhouse Environment page):**
- Top-down or isometric view of the full greenhouse layout
- Each growing zone is a clickable region showing the crop planted there
- Per-zone color coding: green (healthy), yellow (needs attention), red (critical)
- Click a zone to drill into that crop's detail card
- Animated growth indicators (subtle plant size/stage changes over simulation time)
- Zone labels showing crop name and days-to-harvest

**Compact variant (Dashboard widget):**
- Simplified greenhouse silhouette with zone colors only
- Total counts: X healthy, Y warning, Z critical
- Click to navigate to full Greenhouse Environment page

---

### Module: Sensor Data Feed

**What it is:** Real-time environmental readings from all greenhouse sensors.

**Data sources:** Mars Environmental Constraints (KB #1), Controlled Environment Agriculture (KB #2), simulated sensor stream

**Readings tracked:**
- Temperature (current, target range, trend arrow)
- Humidity (current %, target range)
- Light intensity and light cycle phase (on/off, spectrum)
- CO2 concentration (ppm, target range)
- Water flow rate (liters/hour through hydroponic system)

**Full variant (Greenhouse Environment page):**
- Each sensor as a gauge/meter with historical sparkline (last 24h / 7d)
- Threshold bands showing optimal range per crop zone (different crops have different ideals)
- Anomaly highlighting when a reading exits its optimal band
- Ability to view per-zone sensor data (not just greenhouse-wide averages)

**Compact variant (Dashboard widget):**
- 5 key numbers in a row with colored status dots (in-range = green, drifting = yellow, out = red)
- No historical data, just current snapshot
- Click any sensor to jump to the full Environment page filtered to that sensor

---

### Module: Resource Statistics

**What it is:** Current reserves and consumption rates for the three critical resources.

**Data sources:** Controlled Environment Agriculture (KB #2), Greenhouse Operational Scenarios (KB #6)

**Resources tracked:**
- **Water** — total reserve (liters), daily consumption rate, recycling recovery rate, net daily loss
- **Nutrients** — hydroponic nutrient solution levels (N, P, K and micronutrients), days until depletion per nutrient
- **Energy** — current power draw (watts), solar input, battery reserve, net energy balance

**Full variant (used in Forecasting page for resource projection context):**
- Bar/gauge for each resource showing current level vs. starting level
- Daily burn rate with trend (increasing/decreasing/stable)
- Estimated days until depletion at current rate
- Per-resource breakdown: where is it going? (e.g., water: 60% crops, 25% recycling loss, 15% crew)

**Compact variant (Dashboard widget):**
- Three mini progress bars (water, nutrients, energy) with percentage remaining
- Color-coded: >50% green, 25-50% yellow, <25% red
- Single "days of reserves remaining" number for each

---

### Module: Mars Weather Monitor

**What it is:** External Mars environmental conditions that affect greenhouse operations.

**Data sources:** Mars Environmental Constraints (KB #1), AgentCore Gateway "Check Weather on Mars" tool

**Data tracked:**
- External temperature
- Atmospheric pressure
- Solar irradiance (W/m2) — directly affects energy available and supplemental lighting needs
- Dust opacity (tau value) — key indicator of dust storm activity
- Current Mars season / solar longitude

**Full variant (could be used as section in Forecasting or Greenhouse Environment):**
- Weather timeline showing conditions over past and projected future days
- Dust storm alerts with estimated duration and severity
- Impact analysis: "Current dust opacity reduces solar input by X%, triggering supplemental lighting"
- Seasonal daylight curve for current Mars position

**Compact variant (Dashboard widget):**
- Current conditions as icon + numbers (temp, sun level, dust level)
- Storm warning badge if dust opacity exceeds threshold
- Click to expand to full weather detail

---

### Module: Agent Activity Log

**What it is:** Chronological record of every autonomous action the AI agent has taken, with full reasoning transparency.

**Data sources:** Agent runtime, AgentCore Gateway interaction logs, Knowledge Base references

**Log entry structure:**
- **Timestamp** — simulation date/time
- **Action taken** — plain English description ("Increased Zone 2 lighting by 15%")
- **Reasoning chain** — why the agent decided this ("Sensor read 180 umol/m2/s, below optimal 250 for tomatoes at flowering stage. KB #3 Crop Profiles indicates tomato flowering requires 200-400 umol/m2/s.")
- **Knowledge base source** — which KB domain(s) were consulted, with specific references
- **Confidence level** — how certain the agent was (high/medium/low)
- **Outcome** — result of the action if enough time has passed ("Light increased, growth rate normalized within 6 hours")

**Full variant (Autonomous Agent page):**
- Scrollable chronological feed, newest first
- Filterable by: action type (watering, lighting, nutrients, temperature, alerts), zone, confidence level, time range
- Each entry expandable to show full reasoning chain and KB citations
- Bulk actions visible (e.g., "Agent made 12 routine adjustments overnight" collapsible into individual entries)

**Compact variant (Dashboard widget):**
- Last 3-5 actions as one-line summaries
- Count badge: "Agent took 14 actions in last 24h"
- Click to navigate to full log

---

### Module: Recommended Actions Queue

**What it is:** Actions the agent has identified but will NOT execute autonomously because its confidence is below the configured threshold. Requires human review and approval.

**Data sources:** Agent runtime, configured certainty threshold from Agent Configuration

**Queue entry structure:**
- **Proposed action** — what the agent wants to do
- **Reasoning** — why it thinks this is needed
- **Confidence score** — why it's below the autonomous threshold
- **Urgency** — time-sensitive or can wait (with deadline if applicable)
- **Options** — Approve / Reject / Modify / Ask agent for more info

**Full variant (Autonomous Agent page, below the Activity Log):**
- Sorted by urgency (critical first)
- Each item shows full reasoning and alternative options the agent considered
- Approve/reject with optional crew notes ("Approved, but reduce amount by half")
- History of past recommendations and crew decisions

**Compact variant (Dashboard widget):**
- Count badge: "3 actions need your review"
- Highest-urgency item shown as a preview card
- Click to go to full queue

---

### Module: Plant Stress Alerts

**What it is:** AI-driven detection and diagnosis of plant health issues with escalation logic.

**Data sources:** Plant Stress and Response Guide (KB #4), Crop Profiles (KB #3), sensor data

**Alert structure:**
- **Affected zone/crop** — which plants and where
- **Diagnosis** — what the AI thinks is wrong (nutrient deficiency, overwatering, light stress, disease, pest-like symptoms)
- **Evidence** — which sensor readings or visual indicators led to this diagnosis
- **Severity** — low (cosmetic), medium (yield impact), high (crop loss risk)
- **AI response** — what the agent did or proposes to do
- **Escalation flag** — if confidence is low, escalated to Recommended Actions Queue (connects to that module)

**Full variant (Alert and Incident page):**
- All active and recent alerts in a filterable list
- Per-alert detail panel with diagnosis explanation, visual reference, and recommended manual inspection steps
- Resolution tracking: open -> in progress -> resolved, with notes
- Historical alert patterns (is Zone 3 always having humidity issues?)

**Compact variant (Dashboard widget):**
- Active alert count with severity breakdown (2 high, 1 medium)
- Top alert shown as banner/card
- Click to navigate to full alert page

---

### Module: Crop Cards & Planting Calendar

**What it is:** Management of what's planted, what to plant next, and the harvest timeline.

**Data sources:** Crop Profiles (KB #3), Human Nutritional Strategy (KB #5)

**Crop Card contents:**
- Crop name and variety
- Current growth stage (seedling / vegetative / flowering / fruiting / harvest-ready) with visual icon
- Days since planting / estimated days to harvest
- Zone location
- Health status (pulling from Plant Stress Alerts module)
- Expected yield (kg) at harvest

**Planting Calendar:**
- Agent-recommended planting queue based on: current nutritional gaps (from Nutrition module), growth cycle timing to avoid harvest gaps, resource availability
- Timeline visualization: horizontal bars showing each crop's growth period, staggered to show continuous harvest flow
- Recommendations tagged with reasoning ("Plant spinach now — crew will be short on iron in 45 days per KB #5")

**Harvest Journal:**
- Log of completed harvests: date, crop, zone, actual yield vs. expected
- Running total of kg harvested per crop type

**Supply/Stockpile Overview:**
- Current stored food inventory (harvested but not yet consumed)
- Shelf life tracking per item
- Expiration warnings

**Full variant (Crop and Harvest Management page):**
- All of the above in a tabbed or sectioned layout: Active Crops | Planting Queue | Harvest Journal | Stockpile

**Compact variant (Dashboard widget):**
- "Next harvest: Lettuce (Zone 1) in 3 days"
- Pie chart: crops by growth stage
- Click to navigate to full crop management page

---

### Module: Nutrition Tracker

**What it is:** Tracks whether greenhouse output actually meets the dietary needs of 4 astronauts.

**Data sources:** Human Nutritional Strategy (KB #5), Crop Profiles (KB #3), harvest/stockpile data

**Core metrics:**
- **Calorie tracker** — daily/weekly caloric output from greenhouse vs. crew requirement (~2,500 kcal/person/day = 10,000 kcal/day total)
- **Macronutrient breakdown** — protein, carbohydrates, fats: produced vs. required (grams/day)
- **Micronutrient coverage** — vitamins and minerals, shown as a coverage percentage

**Nutritional Coverage Heatmap:**
- Grid/matrix of all tracked nutrients (rows) vs. time periods (columns)
- Cell color: green (>80% covered), yellow (50-80%), red (<50%)
- Instantly shows which nutrients are chronically underserved and when

**Full variant (Nutrition and Consumption page):**
- Calorie trend chart over mission timeline
- Macro donut/bar chart: current vs. target
- Full heatmap with all micronutrients
- Breakdown by crop contribution ("Potatoes provide 40% of calories, spinach provides 60% of iron")
- Gap analysis: what nutrients the greenhouse CANNOT cover, and by how much

**Compact variant (Dashboard widget):**
- Single calorie number: "Today: 8,200 / 10,000 kcal" with progress bar
- Three mini bars for protein/carbs/fats
- Red badge if any critical nutrient below 50%
- Click to navigate to full nutrition page

---

### Module: Resource Forecast

**What it is:** Forward-looking projection of resource reserves over the remaining mission timeline.

**Data sources:** Resource Statistics (module), Mars Weather Monitor (module), Greenhouse Operational Scenarios (KB #6)

**Projections:**
- Water reserves over next X mission days (line chart with confidence band)
- Nutrient reserves over next X mission days
- Energy reserves, factoring in seasonal solar variation and known weather patterns
- Scenario overlays: "What if dust storm hits on day X?" shown as alternate projection line

**Full variant (Forecasting page):**
- Interactive timeline chart with draggable time horizon
- Toggle between resources
- Current Resource Statistics module embedded above for context
- Critical dates flagged: "Water drops below safe threshold on Day 312 at current rate"

**Compact variant (Dashboard widget):**
- Single "most critical resource" highlight: "Water: 187 days remaining"
- Trend arrow (improving/worsening)
- Click to navigate to full Forecasting page

---

### Module: Mission Timeline

**What it is:** Calendar view of the full 450-day mission with all key events, milestones, and projections.

**Data sources:** All other modules feed into this

**Events shown:**
- Predicted harvest windows (from Crop Cards module)
- Planting dates (from Planting Calendar)
- Resource depletion milestones (from Resource Forecast)
- Seasonal changes on Mars (from Mars Weather)
- Injected crisis events (from Scenario Injection in Admin)
- Mission milestones (mission start, mid-point, end)

**Full variant (Forecasting page, below or alongside Resource Forecast):**
- Horizontal scrollable timeline or calendar grid
- Events color-coded by category (harvest = green, planting = blue, risk = red, milestone = gold)
- Click any event for detail

**Compact variant (Dashboard widget):**
- "Upcoming" list: next 3-5 events across all categories
- Current mission day indicator

---

## PAGE COMPOSITIONS

How modules assemble into the pages users actually navigate.

---

### Page: Dashboard

The morning check. Everything at a glance, nothing in depth.

| Widget | Module Used | Variant |
|--------|-------------|---------|
| Greenhouse overview | Greenhouse Visualization | Compact |
| Sensor snapshot | Sensor Data Feed | Compact |
| Resource levels | Resource Statistics | Compact |
| Mars weather | Mars Weather Monitor | Compact |
| Active alerts | Plant Stress Alerts | Compact |
| Agent activity | Agent Activity Log | Compact |
| Pending actions | Recommended Actions Queue | Compact |
| Next harvests | Crop Cards & Planting Calendar | Compact |
| Nutrition status | Nutrition Tracker | Compact |
| Upcoming events | Mission Timeline | Compact |

---

### Page: Autonomous Agent

The AI transparency and control center.

| Section | Module Used | Variant |
|---------|-------------|---------|
| Activity feed | Agent Activity Log | Full |
| Pending decisions | Recommended Actions Queue | Full |

---

### Page: Greenhouse Environment

Full environmental detail and greenhouse visualization.

| Section | Module Used | Variant |
|---------|-------------|---------|
| Greenhouse map | Greenhouse Visualization | Full |
| Sensor readings | Sensor Data Feed | Full |

---

### Page: Alerts and Incidents

All plant health issues and system warnings.

| Section | Module Used | Variant |
|---------|-------------|---------|
| Active alerts | Plant Stress Alerts | Full |

---

### Page: Crop and Harvest Management

Everything about what's growing, what to plant, what's been harvested.

| Section | Module Used | Variant |
|---------|-------------|---------|
| Active crops | Crop Cards & Planting Calendar | Full (Active Crops tab) |
| Planting queue | Crop Cards & Planting Calendar | Full (Planting Queue tab) |
| Harvest journal | Crop Cards & Planting Calendar | Full (Harvest Journal tab) |
| Stockpile | Crop Cards & Planting Calendar | Full (Stockpile tab) |

---

### Page: Nutrition and Consumption

Dietary tracking and nutritional gap analysis.

| Section | Module Used | Variant |
|---------|-------------|---------|
| Calorie/macro tracker | Nutrition Tracker | Full |
| Coverage heatmap | Nutrition Tracker | Full (heatmap sub-view) |

---

### Page: Forecasting

Forward-looking projections and mission timeline.

| Section | Module Used | Variant |
|---------|-------------|---------|
| Resource context | Resource Statistics | Full |
| Resource projections | Resource Forecast | Full |
| Mission calendar | Mission Timeline | Full |
| Weather outlook | Mars Weather Monitor | Full |

---

### Page: Onboarding

Interactive guided tour for new users.

- **Step-by-step walkthrough** that highlights each page/module on first use
- **Contextual tooltips** explaining what each widget shows and why it matters
- **"Try it" prompts** — guided interaction ("Click this zone to see crop details")
- **Skippable** — experienced users dismiss immediately
- **Re-accessible** — "Help" button to re-trigger tour from any page

---

## ADMIN PANEL

Separate interface for simulation control (not astronaut-facing in a real mission, but essential for the hackathon demo).

---

### Admin: Simulation Management

- **Start new simulation** — configure initial parameters:
  - Mission duration (default 450 days)
  - Crew size (default 4)
  - Starting resource levels (water, nutrients, energy)
  - Yield targets and dietary goals
  - Initial crop selection and planting schedule
- **Simulation speed controls** — pause, 1x, 10x, 100x, jump to specific day
- **View past simulations** — list of completed runs with parameters and final outcomes for comparison

---

### Admin: Scenario Injection

Trigger crisis events mid-simulation to test agent resilience. Based on Greenhouse Operational Scenarios (KB #6).

**Available crisis events:**
- **Water leak** — sudden loss of X% water reserves, agent must triage and conserve
- **Solar panel failure** — energy input drops by X%, affects lighting and heating
- **Disease outbreak** — specific crop zone infected, agent must decide: quarantine, treat, or destroy and replant
- **Dust storm** — extended period of reduced solar energy and increased heating demand
- **Equipment malfunction** — pump, fan, or sensor failure requiring workaround

**Injection controls:**
- Select event type
- Set severity (mild / moderate / severe)
- Set timing (immediate or scheduled for day X)
- Chain multiple events for cascading failure scenarios

---

### Admin: Agent Configuration

- **Autonomy level:**
  - *Fully autonomous* — agent acts on all decisions, only logs for review
  - *Suggest-only* — agent proposes everything, crew approves all
  - *Hybrid* — agent acts autonomously above confidence threshold, escalates below it (threshold configurable)
- **Risk tolerance** — how conservative the agent is (aggressive optimization vs. safe margins)
- **Priority weights** — sliders for relative importance of:
  - Yield maximization
  - Food diversity
  - Resource conservation
  - Nutritional completeness

---

### Admin: Analytics

Agent performance metrics across the simulation.

- **Decision accuracy** — how often agent actions led to positive outcomes
- **Response time** — average time from event detection to action
- **Resource efficiency score** — resources consumed per calorie produced
- **Nutritional target hit rate** — percentage of days where crew dietary needs were met
- **Crisis handling** — number of scenarios faced, autonomous resolution rate, average recovery time

---

## SIMULATION OBJECTIVES

The scoring functions that define "success" for any simulation run:

1. **Maximize harvest yield** — total kg of food produced
2. **Maximize food diversity** — number of distinct crops successfully grown
3. **Maintain healthy stockpile levels** — never fall below minimum food buffer
4. **Optimize resource consumption** — minimize waste of water, nutrients, energy
5. **Minimize crew nutritional gaps** — fewest days with unmet dietary requirements
6. **Maximize system resilience** — performance degradation under crisis scenarios

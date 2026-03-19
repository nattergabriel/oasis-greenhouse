# Project Audit — Full Cross-Check

> Generated 2026-03-19. Compares simulation spec, API contract, feature list, case brief, KB data, and product docs. Flags misalignments, stale content, and gaps.

---

## Status of Simulation Spec (`simulation/SIMULATION-SPEC.md`)

### Just added via `simulation/SPEC-ADDENDUM.md`:
- [x] Stored food reserve component (Component 7) — with KB grounding and feeding logic
- [x] Greenhouse sizing (Component 8) — 60 m² total, 4 zones × 15 m², area-based capacity, NASA sources
- [x] Initial state definition (start from zero, empty greenhouse)
- [x] Updated day loop with stored food feeding step
- [x] Sanity math confirming 15-25% caloric supplementation (matches KB framing)

### Claude Code needs to merge the addendum into the main spec:
- [ ] Replace abstract slot system with area-based capacity
- [ ] Add `stored_food` to state snapshot
- [ ] Add `footprint_m2` to Crop class
- [ ] Add `feed_crew()` to day loop
- [ ] Update yield calculation to kg-based

---

## Simulation Spec vs API Contract (`contracts/API.md`)

### Aligned:
- Greenhouse zones concept (simulation) ↔ Greenhouse with slots (API) — both model growing positions
- Crop catalog with KB-sourced nutritional profiles — both present
- Agent log with reasoning and KB source — both present
- Alert system for stress detection — both present
- Simulation management (start, pause, resume, stop) — API has it
- Scenario injection — both present
- Agent configuration (autonomy, risk tolerance, priority weights) — both present
- Sensor data (temp, humidity, light, CO2, water) — API has detailed endpoints

### Misalignments to resolve:
| Issue | Simulation Spec | API Contract | Resolution needed |
|-------|----------------|-------------|-------------------|
| **Stored food** | Now defined in addendum | Not present in API | API needs a stored food endpoint or it goes in the stockpile/resources response |
| **Greenhouse sizing** | 60 m² total, 15 m²/zone, area-based | Rows × cols grid of slots | API grid system is fine for UI; simulation uses area internally. Map: each API slot = one crop planting with a footprint. Compatible. |
| **Astronaut model** | 4 named astronauts with scores | No astronaut endpoints in API | API has no astronaut controller. Nutrition controller covers calorie intake but not per-astronaut health/mood. For the demo this may be fine (simulation tracks astronauts, frontend reads from simulation state) but flag it. |
| **Weather** | Solar hours, intensity, outside temp, season | API has weather endpoint with irradiance, dust index, temp, pressure, forecast | Compatible. Simulation generates weather; API serves it. |
| **Food supply units** | Was abstract "units", now kg-based | API stockpile is in kg with calorie estimates | Now aligned after addendum. |
| **Mission day** | Tracked in simulation state | API uses mission day in multiple endpoints | Aligned. |
| **Greenhouse fraction** | New metric from addendum | Not in API | Should be added to nutrition or analytics endpoints |

### Not in the simulation spec but in the API:
- Onboarding controller — frontend-only, doesn't need simulation support
- Sensor history (time series) — simulation emits per-tick, API stores and serves history
- Slot history — API tracks slot state over time, simulation emits it

### Not in the API but in the simulation spec:
- Astronaut individual state (mood, health, mission_capable) — needs to be exposed somehow
- Stored food reserve — needs an endpoint
- Greenhouse fraction metric — needs to be in analytics or nutrition

---

## Feature List (`product/FEATURES.md`) vs What's Actually Being Built

### Features with simulation support:
- [x] Animated greenhouse overview with plant status — simulation emits zone/crop state ✅
- [x] Live sensor data feed — simulation emits environment state ✅
- [x] Resource statistics — simulation emits water/nutrients/energy ✅
- [x] Mars weather monitoring — simulation emits environment ✅
- [x] Agent Activity Log — agent logs via API ✅
- [x] Recommended Actions queue — agent recommendations via API ✅
- [x] Plant stress detection — simulation tracks crop health/infection ✅
- [x] Planting queue/calendar — agent generates via API ✅
- [x] Harvest journal — API endpoint exists ✅
- [x] Supply/Stockpile overview — API endpoint exists ✅
- [x] Consumption tracker — API nutrition endpoint exists ✅
- [x] Nutritional Coverage Heatmap — API endpoint exists ✅
- [x] Resource Forecast — API endpoint exists ✅
- [x] Mission Timeline/Calendar — API endpoint exists ✅
- [x] Start/configure/view simulations — API endpoints exist ✅
- [x] Scenario injection — API endpoints exist ✅
- [x] Agent configuration — API endpoints exist ✅
- [x] Agent Performance Metrics — API endpoint exists ✅

### Features WITHOUT simulation or API support yet:
- [ ] **Greenhouse Environment Information** (live readouts for temp, humidity, light, CO2, water flow) — API has sensor endpoints but simulation doesn't emit all of these per-tick (humidity, CO2 are tracked as events/parameters, not continuous readings). Minor gap.
- [ ] **Interactive User Guide / Tour** — API has onboarding endpoints. Low priority for hackathon.

---

## Product Docs — Stale or Incorrect Content

### `product/CONTEXT.md` — STALE

| Issue | Current state | Should be |
|-------|-------------|-----------|
| Decision #5 | "6 crop types" | Should be "5 crop types (KB-backed)" |
| Next Steps | Lists "Query MCP endpoint" as step 1 | Already done — KB data is in `simulation/kb_data/` |
| Next Steps | Lists "Validate/update simulation spec" as step 2 | Done — spec updated with KB data |
| Missing | No mention of API contract | `contracts/API.md` is a major artifact now |
| Missing | No mention of frontend work started | `frontend/doc/` has implementation plan |
| Missing | No mention of stored food or greenhouse sizing | Just added in addendum |
| Key Reference Files | Doesn't list `contracts/API.md` | Should be listed |

### `product/research/PARTNER-ANALYSIS.md` — EMPTY TEMPLATE
Still has placeholder text ("_What's happening in agriculture right now?_"). Never filled in. Low priority for hackathon but needed for pitch.

### `product/research/BUSINESS-CASE.md` — EMPTY TEMPLATE
All placeholder text. Needed for the pitch but not urgent during build phase.

### `product/research/VALUE-ROADMAP.md` — EMPTY TEMPLATE
All placeholder text. Core features TBD. Needed for pitch.

### `product/research/MARKET-FIT.md` — EMPTY TEMPLATE
All placeholder text. Needed for pitch.

### `product/PREP-PLAN.md` — STALE
- "Wait for challenge drop" — challenge dropped hours ago
- "Align with frontend dev on UI library" — already decided (Next.js + Tailwind + shadcn)
- Doesn't reflect current status at all
- The whole "Layer" structure is pre-hackathon thinking

### `product/brand/` — NOT STARTED
No colors, fonts, or identity chosen. Frontend has started with a Mars theme in their implementation plan but nothing is in the product brand folder.

### `product/design-system/` — NOT STARTED
Frontend is using shadcn/ui + Tailwind. The design system folder still has the generic template from before the hackathon.

### `product/pitch/` — NOT STARTED
No demo script, no slides, no submission text.

### `product/wireframes/` — NOT STARTED
Frontend has a `sketch.png` in their folder but nothing in the product wireframes folder.

---

## Summary: What to do next

### Immediate (simulation — Claude Code):
1. Merge `SPEC-ADDENDUM.md` into `SIMULATION-SPEC.md`
2. Start building simulation Python code

### Before demo prep (Michael — Claude Desktop):
3. Update `product/CONTEXT.md` with current reality
4. Fill in product research docs for pitch (partner analysis, business case, value roadmap)
5. Start pitch structure

### Team coordination:
6. Flag to backend dev: API needs stored food and astronaut endpoints
7. Flag to frontend dev: stored food reserve and greenhouse fraction metric need UI treatment

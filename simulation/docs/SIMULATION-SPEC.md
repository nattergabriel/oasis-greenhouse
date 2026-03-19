# Simulation Specification

> Source of truth for the simulation engine. Data sources: **(KB)** = Syngenta MCP Knowledge Base. **(SIM)** = simulation mechanic. **(NASA)** = external research.

## Overview

A 450-day stateless simulation of a Martian greenhouse supplementing the diet of 4 astronauts. An AI agent assigns crop types to slots and adjusts environment settings. The engine runs day-by-day physics, auto-harvests and auto-replants crops, and stops early when events or threshold breaches require agent reaction.

## Greenhouse Layout

4 slots in a 2×2 grid. Each slot is 4 m² (2m × 2m). Total area: **16 m²**.

Each slot holds **one crop type** (`slot.crop_type`). The engine fills the slot with as many plantings of that type as fit, and auto-replants after harvest or death.

## Success Metrics

| Metric | Description |
|--------|-------------|
| **Calorie greenhouse fraction** | % of crew's 12,000 kcal/day from greenhouse |
| **Protein greenhouse fraction** | % of crew's ~400g protein/day from greenhouse |
| **Micronutrient coverage** | Count of 7 critical nutrients covered (0-7) |
| Water remaining | Liters at day 450 |
| Total harvested (kg) | Raw production output |
| Crops lost | Lost to stress/death |

---

## Execution Model

The sim engine is a **stateless REST server** with 3 endpoints:

- `POST /simulate/init` — create initial greenhouse state
- `POST /simulate/tick` — advance N days with agent actions
- `POST /simulate/inject-event` — manually inject a crisis event

### Batch Execution Flow

```
1. Orchestrator calls /simulate/init → empty state at day 0
2. Agent (LLM) returns crop assignments + settings
3. Orchestrator calls /simulate/tick with actions for ~30 days
4. Engine runs day-by-day. If event fires or threshold breached → STOP EARLY
5. Orchestrator sends state to agent → reactive actions → tick again
6. Repeat until day 450
7. Post-run: LLM analyzes run, rewrites strategy document
```

Estimated ~20-25 LLM calls per 450-day run.

### Agent Triggers

| Trigger | When |
|---------|------|
| Day 0 | Initial crop assignments |
| Every ~30 days | Scheduled review |
| Event fires | `water_recycling_degradation` or `temperature_control_failure` |
| Crop health < 30 | Crop about to die |
| Water < 1,500L (15%) | Resource crisis |
| Energy deficit 3+ days | Must cut lighting or heating |

---

## Day Loop (inside /simulate/tick)

Applied in order each day:

1. **Apply agent actions** (first tick only)
2. **Roll random events** — if new event fires on tick > 0, mark for early stop
3. **Apply event effects** to environment/resources
4. **Update environment** — seasonal solar, temperature, energy budget
5. **Track energy deficit streak**
6. **Compute water availability** — global factor (0-1)
7. **Grow crops** + detect/apply stress
8. **Remove dead crops** + auto-replant
9. **Consume resources** — water + nutrients
10. **Recycle resources** — 90% water, 70% nutrients
11. **Auto-harvest** ready crops (growth ≥ 95%, health > 20) + auto-replant
12. **Fill unfilled slots** to capacity
13. **Feed crew** — greenhouse food first, stored food fills gap
14. **Update metrics** — running averages
15. **Expire events** — countdown remaining sols
16. **Early stop checks** — event fired, threshold breach, starvation

### RNG Determinism

RNG state (`Random.getstate()`) is saved in the serialized state after each tick call and restored at the start of the next, ensuring deterministic results regardless of how days are batched across calls.

---

## Crops (KB)

### 5 Crop Types

| Crop | Cycle (sols) | Footprint (m²) | Water/sol (L) | Light (hrs) | Optimal temp (°C) | Heat stress above | Yield (kg/m²) | kcal/100g | Protein g/100g | Micronutrients |
|------|-------------|-----------------|---------------|-------------|--------------------|--------------------|---------------|-----------|----------------|----------------|
| Lettuce | 37 | 0.5 | 2 | 10 | 15-22 | 25°C | 4 | 15 | 1.4 | Vit A, K, folate |
| Potato | 90 | 2.0 | 4 | 8 | 16-20 | 26°C | 6 | 77 | 2.0 | Vit C, potassium |
| Radish | 25 | 0.5 | 1.5 | 8 | 15-22 | 26°C | 3 | 16 | 0.7 | Vit C |
| Beans/Peas | 60 | 1.5 | 3 | 10 | 18-25 | 30°C | 3 | 100 | 7.0 | Iron, folate, K, Mg |
| Herbs | 30 | 0.3 | 1 | 8 | 18-24 | 28°C | 1.5 | 15 | 1.0 | Vit A, C, K |

### Growth

```python
water_factor = min(1.0, water_allocated / water_need)
light_factor = min(1.0, effective_solar / light_need)
temp_factor = temperature_curve(internal_temp, optimal_range)  # 1.0 in range, falls to 0 at ±15°C

efficiency = water_factor * light_factor * temp_factor
daily_growth = (100.0 / growth_cycle_days) * efficiency
```

### Stress (7 types, KB Domain 4)

| Stress | Condition | Severity (health/sol) |
|--------|-----------|----------------------|
| drought | water factor < 0.5 | -5 |
| nutrient_deficiency | nutrients < 500 | -4 |
| heat | temp > heat threshold | -4 |
| cold | temp < optimal min | -3 |
| overwatering | water factor > 1.3 | -3 |
| light_insufficient | light factor < 0.4 | -2 |
| co2_imbalance | CO₂ event active | -2 |

No stress → health recovers +1/sol. Health clamped 0-100.

### Harvest

Auto-harvested at growth ≥ 95% and health > 20:
```python
yield_kg = yield_per_m2 * footprint_m2 * (health / 100)
yield_kcal = yield_kg * 10 * kcal_per_100g
```

Dead crops (health = 0) are removed and auto-replanted per slot assignment.

---

## Environment (SIM + KB)

```python
solar_hours = 12 + 3 * sin(2π * day / 687)      # 9-15 hrs seasonal
outside_temp = -63 + 20 * sin(2π * day / 687)    # -83 to -43°C seasonal
internal_temp = target_temp (± event drift)

energy_generated = solar_hours * 4.5              # solar panel efficiency
energy_needed = heating + lighting + pumps
heating_cost = 0.5 * (internal_temp - outside_temp)
energy_deficit = max(0, energy_needed - energy_generated)
```

Energy deficit → light penalty up to 50%.

---

## Resources

| Resource | Starting | Recycling |
|----------|----------|-----------|
| Water | 10,000 L | 90% (KB) |
| Nutrients | 5,000 units | 70% (SIM) |

Crew consumes 10L water/day (2.5L × 4). Crops consume per their `water_per_sol_l`. Nutrients: 0.5 units/crop/sol.

## Stored Food

5,400,000 kcal (450 × 12,000). Crew eats greenhouse food first, stored food fills the gap. No spoilage.

## Crew (KB)

4 astronauts. 3,000 kcal/day each (12,000 total). 100g protein/day each (400g total). 7 critical micronutrients tracked. No health/mood/death model.

---

## Random Events (2 types, KB-backed)

| Event | Code name | Prob/sol | Duration | Effect |
|-------|-----------|---------|----------|--------|
| Water recycling degradation | `water_recycling_degradation` | 1% | 5-15 sols | Recycling drops to 70-80% |
| Temperature control failure | `temperature_control_failure` | 1% | 1-3 sols | Internal temp drifts ±5°C |

Events can also be injected manually via `/simulate/inject-event`.

---

## Agent Actions

| Action | Parameters | Effect |
|--------|-----------|--------|
| `set_crop` | slot_id, crop_type | Assign crop type to slot. Clears existing crops, fills with new type. |
| `plant` | slot_id, crop_type | Add one crop to slot if space available |
| `harvest` | crop_id | Manual harvest (growth ≥ 95%, health > 20) |
| `remove` | crop_id | Remove a specific crop |
| `water_adjust` | slot_id, multiplier (0-1.5) | Set water allocation for slot |
| `light_toggle` | slot_id, on/off | Toggle artificial lighting |
| `set_temperature` | target_temp | Adjust greenhouse temperature |

---

## Early Stop Thresholds

| Condition | Threshold |
|-----------|-----------|
| Crop health critical | Any crop health < 30 |
| Water critical | Water < 1,500L (15%) |
| Energy deficit streak | 3+ consecutive days |
| Starvation | Both stored food and greenhouse food exhausted |

---

## KB Data Reference

Raw KB responses: `simulation/kb_data/`
Raw KB source documents: `backend/docs/Mars-Crop-Data/`
MCP tool: `kb-start-hack-target___knowledge_base_retrieve`
MCP endpoint: `https://kb-start-hack-gateway-buyjtibfpg.gateway.bedrock-agentcore.us-east-2.amazonaws.com/mcp`

# Simulation Engine API

Stateless REST server. Receives current state + actions, returns next state. No internal state between calls.

## `POST /simulate/init`

Creates initial greenhouse state from config.

### Request

```json
{
  "config": {
    "num_zones": 4,
    "zone_area_m2": 15.0,
    "mission_duration_days": 450,
    "crew_size": 4,
    "initial_resources": {
      "water": 10000,
      "nutrients": 5000,
      "water_recycling_efficiency": 0.90,
      "nutrient_recycling_efficiency": 0.70
    }
  }
}
```

### Response

Full `GreenhouseState` at day 0 (see STATE-MODEL.md). All zones empty, no crop plans set.

---

## `POST /simulate/tick`

Advances simulation by N days, applying agent actions. Auto-harvests and auto-replants crops per zone plans. Stops early if a random event fires or a critical threshold is breached.

### Request

```json
{
  "state": { },
  "actions": [
    { "day": 1, "type": "set_zone_plan", "zone_id": 1, "crops": {"potato": 1.0} },
    { "day": 1, "type": "set_zone_plan", "zone_id": 2, "crops": {"potato": 0.5, "beans_peas": 0.5} },
    { "day": 1, "type": "set_zone_plan", "zone_id": 3, "crops": {"lettuce": 0.5, "radish": 0.3, "herbs": 0.2} },
    { "day": 1, "type": "set_zone_plan", "zone_id": 4, "crops": {"beans_peas": 0.7, "herbs": 0.3} },
    { "day": 1, "type": "set_temperature", "value": 20.0 },
    { "day": 1, "type": "water_adjust", "zone_id": 1, "value": 1.2 },
    { "day": 1, "type": "light_toggle", "zone_id": 3, "value": false },
    { "day": 20, "type": "remove", "crop_id": "crop_007" }
  ],
  "days": 30,
  "inject_events": [
    { "day": 15, "type": "temperature_failure", "severity": 0.6 }
  ]
}
```

### Action Types

| Type | Fields | Effect |
|---|---|---|
| `set_zone_plan` | `day`, `zone_id`, `crops` | Sets crop allocation for a zone (dict of crop type → fraction). Engine fills empty area per plan and auto-replants after every harvest. |
| `remove` | `day`, `crop_id` | Removes a specific crop (frees area, auto-replant fills it per zone plan) |
| `water_adjust` | `day`, `zone_id`, `value` | Sets zone water allocation multiplier (0.0-1.5) |
| `light_toggle` | `day`, `zone_id`, `value` | Toggles artificial lighting on/off for a zone |
| `set_temperature` | `day`, `value` | Adjusts greenhouse internal temperature target |

### Zone plans and auto-harvest/replant

The agent does not plant or harvest individual crops. Instead, it sets a **percentage-based crop plan** per zone via `set_zone_plan`. The sim engine:

1. **Fills** empty zone area according to the plan (as many crops as fit within the percentage allocation)
2. **Auto-harvests** any crop that reaches >=95% growth with >20 health
3. **Auto-replants** the same crop type in the freed spot, per the zone plan
4. **Auto-replants on death** — when a crop hits 0 health, it's removed and replaced per the plan

When a zone plan is changed, existing crops grow to completion before being replaced with the new plan's types. The `remove` action lets the agent force-remove a crop for faster plan transitions.

Example: `{"potato": 0.6, "beans_peas": 0.4}` in a 15m² zone → 60% = 9m² for potatoes (4 × 2.0m² = 8m²), 40% = 6m² for beans (4 × 1.5m² = 6m²). Total used: 14m².

Each action has a `day` field (relative to batch start, 1-indexed). The sim engine applies actions on their specified day. Invalid actions are skipped and logged as warnings.

### Response

```json
{
  "final_state": { },
  "days_simulated": 17,
  "stopped_early": true,
  "stop_reason": {
    "type": "event_fired",
    "event": {
      "type": "water_recycling_decline",
      "severity": 0.6,
      "day_triggered": 18,
      "duration": 10,
      "details": "Water recycling efficiency dropped from 0.90 to 0.72"
    }
  },
  "daily_log": [
    {
      "day": 1,
      "resource_consumption": { "water": 52.0, "nutrients": 12.0 },
      "resource_recovery": { "water": 46.8, "nutrients": 8.4 },
      "energy": { "generated": 45, "needed": 38, "deficit": 0 },
      "harvests": [{"crop_id": "crop_012", "type": "radish", "yield_kg": 0.8}],
      "replants": [{"zone_id": 3, "type": "radish"}],
      "crop_stress_changes": [{"crop_id": "crop_005", "stress": "heat", "health": 72}],
      "warnings": []
    }
  ]
}
```

### Early stop behavior

The sim engine stops mid-batch and returns early when any of these occur:

**Events** (checked each day):
1. **Injected events**: if `inject_events` contains an event for this day, fire it
2. **Random events**: roll against per-event probabilities

**Threshold breaches** (checked each day):
3. **Crop health critical**: any crop health drops below 30
4. **Water critical**: water drops below 15% of starting amount (< 1,500L)
5. **Persistent energy deficit**: energy deficit for 3+ consecutive days

When any of these trigger, the engine applies effects to the state and returns immediately with `stopped_early: true`. The orchestrator then asks the agent how to respond before continuing. For threshold breaches, the `stop_reason.type` is `"threshold_breach"` instead of `"event_fired"`.

If nothing triggers, the engine runs all `days` and returns `stopped_early: false`.

---

## `POST /simulate/inject-event`

Manually apply an event to the current state (used by Mission Planner UI).

### Request

```json
{
  "state": { },
  "event": {
    "type": "temperature_failure",
    "severity": 0.7
  }
}
```

### Response

```json
{
  "state": { },
  "impact": {
    "internal_temp_drift": 5.0,
    "description": "Temperature control failure: internal temp drifting to 27°C"
  }
}
```

---

## Event Types

2 event types with KB-backed effects.

| Type | Prob/sol | Duration | Effect | KB source |
|---|---|---|---|---|
| `water_recycling_decline` | 1% | 5-15 sols | Recycling efficiency drops to 70-80% | KB 6.3 |
| `temperature_failure` | 1% | 1-3 sols | Internal temp drifts ±5°C from setpoint | KB 6.6 |

Water recycling decline recovers gradually over its duration. Temperature failure auto-resolves after 1-3 sols.

---

## Crop Reference Data

| Crop | Cycle (sols) | Footprint (m²) | Water/sol (L) | Light (hrs) | Optimal temp (°C) | Heat stress above | Yield (kg/m²) |
|---|---|---|---|---|---|---|---|
| Potato | 70-120 | 2.0 | 4 | 8 | 16-20 | 25-28°C | 4-8 |
| Lettuce | 30-45 | 0.5 | 2 | 10 | 15-22 | 25°C | 3-5 |
| Radish | 21-30 | 0.5 | 1.5 | 8 | 15-22 | 26°C | 2-4 |
| Beans/Peas | 50-70 | 1.5 | 3 | 10 | 18-25 | 30°C | 2-4 |
| Herbs | 25-35 | 0.3 | 1 | 8 | 18-24 | 28°C | 1-2 |

### Nutritional Output per Harvest

| Crop | kcal/100g | Protein g/100g | Micronutrients provided |
|---|---|---|---|
| Potato | 77 | 2.0 | vitamin C, potassium |
| Lettuce | 15 | 1.4 | vitamin A, vitamin K, folate |
| Radish | 16 | 0.7 | vitamin C |
| Beans/Peas | 100 | 7.0 | iron, folate, potassium, magnesium |
| Herbs | 15 | 1.0 | vitamin A, vitamin C, vitamin K |

### Crew Nutritional Targets (daily, 4 astronauts)

- Total need: 12,000 kcal, ~400g protein
- 7 critical micronutrients: vitamin A, C, K, folate, iron, potassium, magnesium
- Greenhouse supplements packaged food (5,400,000 kcal starting reserve)
- Crew also consumes 10L water/day (2.5L/person) from the water supply

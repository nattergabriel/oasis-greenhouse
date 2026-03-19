# Simulation Engine API

Stateless REST server at `http://localhost:8001` (configurable). Receives current state + actions, returns next state.

## `POST /simulate/init`

Creates initial greenhouse state.

### Request

```json
{
  "seed": 42,
  "crop_assignments": { "0": "potato", "1": "beans_peas" }
}
```

`crop_assignments` is optional. Maps slot ID → crop type. Omitted slots start empty.

### Response

`SimulationResponse` with state at day 0 and `days_simulated: 0`.

---

## `POST /simulate/tick`

Advances simulation by N days with agent actions applied on the first day.

### Request

```json
{
  "state": { "...full serialized GreenhouseState..." },
  "days": 30,
  "actions": [
    { "action": "set_crop", "slot_id": 0, "crop_type": "potato" },
    { "action": "water_adjust", "slot_id": 1, "multiplier": 1.2 },
    { "action": "light_toggle", "slot_id": 2, "on": false },
    { "action": "set_temperature", "target_temp": 20.0 },
    { "action": "remove", "crop_id": "crop_0_3" }
  ],
  "inject_events": [
    { "event_type": "temperature_control_failure", "duration_sols": 3 }
  ]
}
```

### Action Types

| Action | Key fields | Effect |
|--------|-----------|--------|
| `set_crop` | `slot_id`, `crop_type` | Assign crop type to slot, clear existing crops, fill with new type |
| `plant` | `slot_id`, `crop_type` | Add one crop if space available |
| `harvest` | `crop_id` | Manual harvest (growth ≥ 95%, health > 20) |
| `remove` | `crop_id` | Remove a specific crop |
| `water_adjust` | `slot_id`, `multiplier` (0-1.5) | Set water allocation multiplier |
| `light_toggle` | `slot_id`, `on` (bool) | Toggle artificial lighting |
| `set_temperature` | `target_temp` | Adjust greenhouse temperature target |

Actions are applied on the first day of the tick. Invalid actions are skipped and logged as warnings.

### Response

```json
{
  "state": { "...updated GreenhouseState..." },
  "daily_logs": [
    {
      "day": 31,
      "harvests": [{ "id": "crop_0_1", "type": "potato", "kg": 9.2, "kcal": 7084.0 }],
      "deaths": [{ "id": "crop_2_5", "type": "herbs", "stress": "drought" }],
      "events_started": [],
      "events_ended": ["water_recycling_degradation"],
      "warnings": [],
      "calorie_gh_fraction": 0.18,
      "protein_gh_fraction": 0.12,
      "micronutrient_count": 5,
      "water_remaining": 8423.0,
      "stored_food_remaining": 4200000.0,
      "active_events": [],
      "crop_count": 14
    }
  ],
  "days_simulated": 30,
  "stopped_early": false,
  "stop_reason": null
}
```

### Early Stop

The engine stops and returns early when:

| Trigger | `stop_reason.type` | Details |
|---------|--------------------|---------|
| Random event fires (tick > 0) | `event_fired` | Full day still simulated before stopping |
| Crop health < 30 | `threshold_breach` | `trigger: crop_health_low` |
| Water < 1,500L | `threshold_breach` | `trigger: water_low` |
| Energy deficit 3+ days | `threshold_breach` | `trigger: energy_deficit_streak` |
| All food exhausted | `threshold_breach` | `trigger: starvation` |

---

## `POST /simulate/inject-event`

Inject a crisis event into the state without advancing the simulation.

### Request

```json
{
  "state": { "...GreenhouseState..." },
  "event_type": "water_recycling_degradation",
  "duration_sols": 10
}
```

`duration_sols` is optional (random within config range if omitted).

### Response

Same `SimulationResponse` format with the event added to `state.active_events`.

---

## Event Types

| Event | Code name | Prob/sol | Duration | Effect |
|-------|-----------|---------|----------|--------|
| Water recycling degradation | `water_recycling_degradation` | 1% | 5-15 sols | Recycling drops to 70-80% |
| Temperature control failure | `temperature_control_failure` | 1% | 1-3 sols | Internal temp drifts ±5°C |

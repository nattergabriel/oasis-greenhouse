# State Model Alignment Guide — Sim Engine → Backend

> **For the backend dev.** The sim engine is built and tested (192 tests). Don't change it.
> Adapt `backend/src/models/state.py` and `backend/src/sim_client.py` to match the sim engine's actual output.

---

## Sim engine actual output format

### `/simulate/init` response

```json
{
  "state": {
    "day": 0,
    "environment": {
      "solar_hours": 12.0,
      "outside_temp": -63.0,
      "internal_temp": 22.0,
      "target_temp": 22.0,
      "co2_level": 1000.0,
      "co2_event_active": false,
      "energy_generated": 0.0,
      "energy_needed": 0.0,
      "energy_deficit": 0.0,
      "light_penalty": 0.0
    },
    "zones": [
      {
        "id": 1,
        "area_m2": 15.0,
        "crops": [],
        "artificial_light": true,
        "water_allocation": 1.0,
        "crop_plan": {}
      }
    ],
    "resources": {
      "water": 10000.0,
      "nutrients": 5000.0,
      "energy_generated": 0.0,
      "energy_needed": 0.0,
      "energy_deficit": 0.0,
      "water_recycling_rate": 0.9,
      "water_availability": 1.0
    },
    "food_supply": {
      "items": {}
    },
    "stored_food": {
      "total_calories": 5400000.0,
      "remaining_calories": 5400000.0
    },
    "active_events": [],
    "daily_nutrition": {
      "calorie_gh_fraction": 0.0,
      "protein_gh_fraction": 0.0,
      "micronutrients_covered": [],
      "micronutrient_count": 0,
      "gh_kcal": 0.0,
      "gh_protein_g": 0.0,
      "stored_kcal_consumed": 0.0
    },
    "metrics": {
      "avg_calorie_gh_fraction": 0.0,
      "avg_protein_gh_fraction": 0.0,
      "avg_micronutrient_coverage": 0.0,
      "unique_micronutrients_seen": [],
      "total_harvested_kg": 0.0,
      "crops_lost": 0,
      "days_simulated": 0
    },
    "next_crop_id": 1,
    "seed": 42,
    "consecutive_energy_deficit_days": 0
  },
  "daily_logs": [],
  "days_simulated": 0,
  "stopped_early": false,
  "stop_reason": null
}
```

### `/simulate/init` request format

```json
{
  "seed": 42,
  "zone_plans": {
    "1": {"potato": 0.6, "beans_peas": 0.4},
    "2": {"potato": 0.5, "beans_peas": 0.5},
    "3": {"lettuce": 0.5, "radish": 0.3, "herbs": 0.2},
    "4": {"beans_peas": 0.7, "herbs": 0.3}
  }
}
```

Note: zone_plans keys are integers (zone IDs), NOT the config object with num_zones/zone_area_m2/etc. The sim engine uses defaults from its own config.py.

### `/simulate/tick` request format

```json
{
  "state": { ... full state dict from previous response ... },
  "days": 30,
  "actions": [
    {"action": "set_zone_plan", "zone_id": 1, "plan": {"potato": 1.0}},
    {"action": "water_adjust", "zone_id": 2, "multiplier": 0.5},
    {"action": "light_toggle", "zone_id": 3, "on": false},
    {"action": "set_temperature", "target_temp": 18.0},
    {"action": "remove", "crop_id": "crop_1_5"}
  ],
  "inject_events": [
    {"event_type": "water_recycling_degradation", "duration_sols": 5}
  ]
}
```

Note: actions use `"action"` key (not `"type"`). Zone plans use `"plan"` key (not `"crops"`).

### `/simulate/tick` response format

```json
{
  "state": { ... updated state dict ... },
  "daily_logs": [
    {
      "day": 1,
      "harvests": [{"id": "crop_1_5", "type": "radish", "kg": 0.8, "kcal": 128}],
      "deaths": [{"id": "crop_2_3", "type": "lettuce", "stress": "heat"}],
      "events_started": ["water_recycling_degradation"],
      "events_ended": [],
      "warnings": [],
      "calorie_gh_fraction": 0.05,
      "protein_gh_fraction": 0.03,
      "micronutrient_count": 3,
      "water_remaining": 9850.0,
      "stored_food_remaining": 5388000.0,
      "active_events": ["water_recycling_degradation"],
      "crop_count": 42
    }
  ],
  "days_simulated": 17,
  "stopped_early": true,
  "stop_reason": {
    "type": "event_fired",
    "trigger": "random_event",
    "events": ["temperature_control_failure"],
    "detail": "New event(s) fired: ['temperature_control_failure']"
  }
}
```

Or for threshold breach:
```json
{
  "stop_reason": {
    "type": "threshold_breach",
    "trigger": "crop_health_low",
    "detail": "Crop crop_1_3 (potato) health at 28.0 (threshold: 30.0)",
    "crop_id": "crop_1_3",
    "crop_type": "potato",
    "health": 28.0
  }
}
```

### Crop object shape

```json
{
  "id": "crop_1_5",
  "type": "potato",
  "zone_id": 1,
  "footprint_m2": 2.0,
  "planted_day": 0,
  "age": 45,
  "health": 87.0,
  "growth": 50.0,
  "active_stress": null,
  "growth_cycle_days": 90
}
```

### Active event shape

```json
{
  "type": "water_recycling_degradation",
  "started_day": 50,
  "duration_sols": 10,
  "remaining_sols": 5,
  "temp_drift_c": 0.0,
  "degraded_recycling": 0.75
}
```

---

## What to change in backend

### `sim_client.py`

```python
# init() — change request format
async def init(self, seed=42, zone_plans=None):
    body = {"seed": seed}
    if zone_plans:
        body["zone_plans"] = zone_plans
    response = await self._client.post(f"{self.base_url}/simulate/init", json=body)
    response.raise_for_status()
    data = response.json()
    return data["state"]  # returns the state dict inside the response

# tick() — fix response field names
async def tick(self, state_dict, actions, days=30, inject_events=None):
    response = await self._client.post(
        f"{self.base_url}/simulate/tick",
        json={
            "state": state_dict,
            "actions": actions,
            "days": days,
            "inject_events": inject_events or [],
        },
    )
    response.raise_for_status()
    result = response.json()
    # Response keys: "state", "daily_logs", "days_simulated", "stopped_early", "stop_reason"
    return result
```

### `models/state.py` — match sim engine output

The simplest approach: use the sim engine state dict directly without deserializing into Pydantic models. Store it as `dict[str, Any]` in LangGraph state and access fields by key. This avoids all the field mapping issues.

If you want typed models, match the sim engine's exact field names and structure (see JSON examples above).

### Key differences to remember

| Your current code | Sim engine reality |
|---|---|
| `greenhouse.mission_day` | `state["day"]` |
| `greenhouse.resources.water_recycling_efficiency` | `state["resources"]["water_recycling_rate"]` |
| `greenhouse.food_supply.total_kg` | `sum(item["kg"] for item in state["food_supply"]["items"].values())` |
| `greenhouse.food_supply.by_type` | `state["food_supply"]["items"]` |
| `greenhouse.mars.solar_hours` | `state["environment"]["solar_hours"]` |
| `greenhouse.daily_nutrition.stored_food_days_left` | compute: `state["stored_food"]["remaining_calories"] / 12000` |
| `result["final_state"]` | `result["state"]` |
| `result["daily_log"]` | `result["daily_logs"]` |
| `stop_reason["event"]["type"]` | `stop_reason["trigger"]` or `stop_reason["events"][0]` |

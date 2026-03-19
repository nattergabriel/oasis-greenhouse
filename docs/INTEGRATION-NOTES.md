# Backend ↔ Simulation Engine Integration Notes

> For the backend dev: read this to fix the state model mismatch.
> The sim engine is complete (192 tests, don't change it). Adapt the backend models to match.

---

## What the sim engine actually returns

### POST /simulate/init

**Request it expects:**
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

**Response:** `SimulationResponse` with `state` (GreenhouseState dict), empty `daily_logs`, `days_simulated: 0`.

### POST /simulate/tick

**Request it expects:**
```json
{
    "state": { ... GreenhouseState dict ... },
    "days": 30,
    "actions": [
        {"action": "set_zone_plan", "zone_id": 1, "plan": {"potato": 0.6, "beans_peas": 0.4}},
        {"action": "water_adjust", "zone_id": 1, "multiplier": 1.2},
        {"action": "set_temperature", "target_temp": 20.0},
        {"action": "light_toggle", "zone_id": 3, "on": false}
    ],
    "inject_events": [
        {"event_type": "water_recycling_degradation", "duration_sols": 5}
    ]
}
```

Note: actions use `"action"` key (not `"type"`). Zone plan uses `"plan"` key (not `"crops"`).

**Response:**
```json
{
    "state": { ... updated GreenhouseState dict ... },
    "daily_logs": [ ... array of day entries ... ],
    "days_simulated": 17,
    "stopped_early": true,
    "stop_reason": {
        "type": "event_fired",
        "trigger": "random_event",
        "events": ["water_recycling_degradation"],
        "detail": "New event(s) fired: ['water_recycling_degradation']"
    }
}
```

Or for threshold breach:
```json
{
    "stop_reason": {
        "type": "threshold_breach",
        "trigger": "crop_health_low",
        "detail": "Crop crop_1_3 (potato) health at 28.5 (threshold: 30.0)",
        "crop_id": "crop_1_3",
        "crop_type": "potato",
        "health": 28.5
    }
}
```

### POST /simulate/inject-event

**Request:**
```json
{
    "state": { ... },
    "event_type": "temperature_control_failure",
    "duration_sols": 3
}
```

---

## The actual GreenhouseState structure (from sim engine)

```json
{
    "day": 127,
    "environment": {
        "solar_hours": 13.2,
        "outside_temp": -52.0,
        "internal_temp": 20.0,
        "target_temp": 20.0,
        "co2_level": 1000.0,
        "co2_event_active": false,
        "energy_generated": 45.0,
        "energy_needed": 38.0,
        "energy_deficit": 0.0,
        "light_penalty": 0.0
    },
    "zones": [{
        "id": 1,
        "area_m2": 15.0,
        "crops": [{
            "id": "crop_1_1",
            "type": "potato",
            "zone_id": 1,
            "footprint_m2": 2.0,
            "planted_day": 0,
            "age": 127,
            "health": 87.0,
            "growth": 100.0,
            "active_stress": null,
            "growth_cycle_days": 90
        }],
        "artificial_light": true,
        "water_allocation": 1.2,
        "crop_plan": {"potato": 0.6, "beans_peas": 0.4}
    }],
    "resources": {
        "water": 8423.0,
        "nutrients": 3891.0,
        "energy_generated": 45.0,
        "energy_needed": 38.0,
        "energy_deficit": 0.0,
        "water_recycling_rate": 0.90,
        "water_availability": 0.95
    },
    "food_supply": {
        "items": {
            "potato": {"kg": 12.0, "kcal": 9240.0, "protein_g": 240.0},
            "beans_peas": {"kg": 10.0, "kcal": 10000.0, "protein_g": 700.0}
        }
    },
    "stored_food": {
        "total_calories": 5400000.0,
        "remaining_calories": 4200000.0
    },
    "active_events": [{
        "type": "water_recycling_degradation",
        "started_day": 120,
        "duration_sols": 10,
        "remaining_sols": 3,
        "temp_drift_c": 0.0,
        "degraded_recycling": 0.75
    }],
    "daily_nutrition": {
        "calorie_gh_fraction": 0.21,
        "protein_gh_fraction": 0.15,
        "micronutrients_covered": ["vitamin_a", "vitamin_c", "vitamin_k", "folate", "potassium"],
        "micronutrient_count": 5,
        "gh_kcal": 2520.0,
        "gh_protein_g": 60.0,
        "stored_kcal_consumed": 9480.0
    },
    "metrics": {
        "avg_calorie_gh_fraction": 0.169,
        "avg_protein_gh_fraction": 0.171,
        "avg_micronutrient_coverage": 0.9,
        "unique_micronutrients_seen": ["vitamin_a", "vitamin_c", "vitamin_k", "folate", "iron", "potassium", "magnesium"],
        "total_harvested_kg": 1770.0,
        "crops_lost": 0,
        "days_simulated": 127
    },
    "next_crop_id": 250,
    "seed": 42,
    "consecutive_energy_deficit_days": 0
}
```

## Daily log entry structure (in tick response)

```json
{
    "day": 52,
    "harvests": [{"id": "crop_1_12", "type": "radish", "kg": 0.8, "kcal": 128.0}],
    "deaths": [{"id": "crop_2_5", "type": "lettuce", "stress": "heat"}],
    "events_started": ["water_recycling_degradation"],
    "events_ended": [],
    "warnings": [],
    "calorie_gh_fraction": 0.05,
    "protein_gh_fraction": 0.03,
    "micronutrient_count": 3,
    "water_remaining": 9200.0,
    "stored_food_remaining": 5100000.0,
    "active_events": ["water_recycling_degradation"],
    "crop_count": 42
}
```

---

## Checklist for backend dev

- [ ] Update `GreenhouseState` model: `mission_day` → `day`, add `metrics`, `next_crop_id`, `seed`, `consecutive_energy_deficit_days`
- [ ] Update `Resources` model: `water_recycling_efficiency` → `water_recycling_rate`, add `water_availability`, `energy_generated`, `energy_needed`, `energy_deficit`
- [ ] Update `EnvironmentState` model: add `target_temp`, `co2_level`, `co2_event_active`, `light_penalty`
- [ ] Remove `MarsConditions` — solar_hours and outside_temp are in `environment`
- [ ] Update `FoodSupply` model: use `items: dict[str, FoodItem]` structure (not `total_kg`/`by_type`)
- [ ] Update `Event` → `ActiveEvent` model: use `started_day`, `duration_sols`, `remaining_sols`, `temp_drift_c`, `degraded_recycling`
- [ ] Update `Crop` model: add `growth_cycle_days`
- [ ] Update `DailyNutrition`: add `gh_kcal`, `gh_protein_g`, `stored_kcal_consumed`
- [ ] Fix `sim_client.py` init request: send `{"seed": 42, "zone_plans": {...}}`
- [ ] Fix `sim_client.py` tick: read `daily_logs` (plural), read `stop_reason` with correct structure
- [ ] Fix `simulate_node.py`: read harvest data as `{"id", "type", "kg", "kcal"}` not `{"yield_kg"}`
- [ ] Fix `react_node.py`: read stop_reason as `stop_reason["trigger"]` not `stop_reason["breach"]["type"]`

# State Model

## GreenhouseState

Top-level state object. Passed between orchestrator and sim engine on every call.

```python
class GreenhouseState(BaseModel):
    mission_day: int                      # 0-450
    zones: list[Zone]                     # 4 zones
    environment: EnvironmentState
    resources: Resources
    mars: MarsConditions
    food_supply: FoodSupply
    stored_food: StoredFood
    daily_nutrition: DailyNutrition
    active_events: list[Event]
```

## Zone

Each zone is 15 m² and can hold multiple crops. The agent sets a crop plan (percentage allocation); the engine fills and replants automatically.

```python
class Zone(BaseModel):
    id: int
    area_m2: float                        # 15.0
    crops: list[Crop]
    artificial_light: bool                # toggleable by agent
    water_allocation: float               # multiplier 0.0-1.5, adjustable by agent
    crop_plan: dict[str, float]           # e.g. {"potato": 0.6, "beans_peas": 0.4}

    def used_area(self) -> float:
        return sum(c.footprint_m2 for c in self.crops)

    def available_area(self) -> float:
        return self.area_m2 - self.used_area()
```

### Zone plan behavior

When a zone plan is set, the engine fills empty area according to the percentages. After auto-harvest or crop death, the engine replants the same crop type in the freed spot per the plan. Existing crops from a previous plan grow to completion before being replaced.

## Crop

```python
class Crop(BaseModel):
    id: str                               # unique crop id
    type: str                             # "potato", "lettuce", "radish", "beans_peas", "herbs"
    zone_id: int
    footprint_m2: float                   # potato: 2.0, beans: 1.5, lettuce: 0.5, radish: 0.5, herbs: 0.3
    planted_day: int
    age: int                              # days since planting
    health: float                         # 0-100, affects yield at harvest
    growth: float                         # 0-100%, auto-harvested when >=95%
    active_stress: str | None             # one of 7 stress types or None
```

### Crop Footprints

| Crop | m² per planting |
|------|----------------|
| Potato | 2.0 |
| Beans/Peas | 1.5 |
| Lettuce | 0.5 |
| Radish | 0.5 |
| Herbs | 0.3 |

## EnvironmentState

Partially controlled by agent (set_temperature, light_toggle), partially driven by Mars conditions.

```python
class EnvironmentState(BaseModel):
    solar_hours: float                    # 9-15 hrs, seasonal
    outside_temp: float                   # seasonal, not controllable
    internal_temp: float                  # C, agent-controllable target
    energy_generated: float               # from solar, affected by season
    energy_needed: float                  # heating + lighting + pumps
    energy_deficit: float                 # max(0, needed - generated)
```

## Resources

Finite. Depleted each tick by crop consumption and crew needs. Partially recovered via recycling.

```python
class Resources(BaseModel):
    water: float                          # liters, starts at 10,000
    nutrients: float                      # abstract units, starts at 5,000
    water_recycling_efficiency: float     # 0.90 default, can degrade via events
    nutrient_recycling_efficiency: float  # 0.70 default
```

## MarsConditions

External. Not controllable by agent.

```python
class MarsConditions(BaseModel):
    solar_hours: float                    # seasonal: 12 + 3 * sin(2pi * day / 687)
    outside_temp: float                   # seasonal: -63 + 20 * sin(2pi * day / 687)
```

## FoodSupply

Stockpile of harvested greenhouse food. Accumulates via auto-harvest, consumed daily by crew. No spoilage in core.

```python
class FoodSupply(BaseModel):
    total_kg: float
    total_kcal: float
    total_protein_g: float
    by_type: dict[str, CropStock]         # per crop type breakdown

class CropStock(BaseModel):
    kg: float
    kcal: float
    protein_g: float
```

## StoredFood

Packaged food brought from Earth. Depletes as greenhouse food supply falls short.

```python
class StoredFood(BaseModel):
    total_calories: float                 # starts at 5,400,000
    remaining_calories: float
```

## DailyNutrition

Calculated each tick after feeding crew.

```python
class DailyNutrition(BaseModel):
    calorie_gh_fraction: float            # greenhouse kcal / crew daily need
    protein_gh_fraction: float            # greenhouse protein / crew daily need
    micronutrients_covered: list[str]     # which of 7 nutrients are covered
    micronutrient_count: int              # 0-7
    stored_food_remaining: float
    stored_food_days_left: float
```

### 7 Critical Micronutrients

Tracked as a count based on which crop types are being harvested:
- Vitamin A (lettuce, herbs)
- Vitamin C (potato, radish, herbs)
- Vitamin K (lettuce, herbs)
- Folate (lettuce, beans)
- Iron (beans)
- Potassium (potato, beans)
- Magnesium (beans)

## Event

```python
class Event(BaseModel):
    type: str                             # water_recycling_decline, temperature_failure
    severity: float                       # 0-1
    day_triggered: int
    duration: int                         # sols
    details: str
    resolved: bool
```

## AgentAction

Logged for frontend playback.

```python
class AgentAction(BaseModel):
    day: int
    node: str                             # "plan", "react"
    reasoning: str                        # LLM explanation
    actions: list[dict]                   # structured actions sent to sim engine
```

## DailySnapshot

Lightweight state for frontend playback.

```python
class DailySnapshot(BaseModel):
    mission_day: int
    zones: list[ZoneSnapshot]
    environment: EnvironmentState
    resources: Resources
    mars: MarsConditions
    food_supply: FoodSupply
    stored_food: StoredFood
    daily_nutrition: DailyNutrition
    active_events: list[Event]

class ZoneSnapshot(BaseModel):
    id: int
    area_m2: float
    used_area_m2: float
    available_area_m2: float
    artificial_light: bool
    water_allocation: float
    crop_plan: dict[str, float]
    crops: list[CropSnapshot]

class CropSnapshot(BaseModel):
    id: str
    type: str
    footprint_m2: float
    age: int
    health: float
    growth: float
    active_stress: str | None
```

## SimulationResult

Returned by `/api/simulations/{id}`. Contains everything the frontend needs for playback.

```python
class SimulationResult(BaseModel):
    id: str
    daily_snapshots: list[DailySnapshot]  # 450 snapshots
    agent_decisions: list[AgentAction]    # ~20-25 decisions with reasoning
    events: list[Event]                   # all events that fired
    final_metrics: SimulationMetrics
    strategy_doc_before: str
    strategy_doc_after: str

class SimulationMetrics(BaseModel):
    avg_calorie_gh_fraction: float        # avg greenhouse coverage over mission
    avg_protein_gh_fraction: float
    avg_micronutrient_coverage: float     # avg count out of 7
    total_harvested_kg: float
    crops_lost: int
    stored_food_remaining_pct: float      # % of packaged food left at mission end
    resource_efficiency: float            # resources remaining / started
    events_handled: int
```

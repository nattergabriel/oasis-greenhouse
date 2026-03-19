# Simulation Specification — Core

> **Version:** Clean rewrite after session decisions. This is the ONLY spec Claude Code should follow.
> **Rule:** Build exactly this. Nothing more. Additions are listed at the bottom — do not implement them unless explicitly told to.
>
> **Data sources:** **(KB)** = from Syngenta MCP Knowledge Base. **(SIM)** = our simulation mechanic. **(NASA)** = external research.

---

## What the simulation does

A 450-day loop simulating a Martian greenhouse that supplements the diet of 4 astronauts. An AI agent manages the greenhouse — planting crops, allocating water, adjusting conditions. The simulation measures how much of the crew's nutritional needs the greenhouse can provide.

## Success metrics (what we optimize)

| Metric | What it measures |
|--------|-----------------|
| **Calorie greenhouse fraction** | % of crew's 12,000 kcal/day from greenhouse crops |
| **Protein greenhouse fraction** | % of crew's ~400g protein/day from greenhouse crops |
| **Micronutrient coverage** | How many of 7 critical nutrients are covered by crop diversity (0-7) |
| Water remaining | Liters left at day 450 |
| Nutrients remaining | Units left at day 450 |
| Total harvested (kg) | Raw production output |
| Crops lost | Number lost to stress |

---

## Day loop

```python
for day in range(1, 451):
    # 1. Environment updates
    environment.update(day)  # solar hours, temperature (seasonal)
    
    # 2. Random events
    events = roll_events(day)
    apply_events(events, environment, crops, resources)
    
    # 3. Crops update
    for crop in all_crops:
        crop.grow(environment, resources, zone)
        crop.detect_stress(environment, resources, zone)
    
    # 4. Resources consumed
    resources.consume(all_crops, crew_size=4)
    resources.recycle()
    
    # 5. Harvest ready crops
    for crop in all_crops:
        if crop.is_harvestable():
            food_supply.add(crop.harvest())
    
    # 6. Feed crew (greenhouse first, stored food fills gap)
    daily_result = feed_crew(food_supply, stored_food, crew_size=4)
    
    # 7. Emit state
    state = build_state(day, environment, zones, food_supply, stored_food, resources, daily_result, events)
    
    # 8. Agent decides + acts
    actions = agent.decide(state)
    apply_actions(actions, zones, resources, environment)
```

---

## Component 1: Mars environment

### Constants (KB)

| Parameter | Value | Source |
|-----------|-------|--------|
| Gravity | 3.721 m/s² (0.38g) | KB |
| Atmospheric pressure | ~610 Pa (6.1 mbar) | KB |
| Atmosphere | 95.32% CO₂, 2.7% N₂, 0.13% O₂ | KB |
| Solar irradiance (peak) | ~590 W/m² (43% of Earth) | KB |
| Average surface temp | -63°C | KB |
| Temp range | -140°C to +21°C | KB |
| Martian year | 687 sols | Real science |
| Hydroponics required | Perchlorates in soil | KB |
| Optimal CO₂ for crops | 800-1200 ppm | KB |
| PAR for leafy crops | 150-250 μmol/m²/s | KB |

### Per-tick variables (SIM)

```python
# Seasonal solar hours (SIM model of KB's "seasonal variation")
solar_hours = 12 + 3 * sin(2π * day / 687)  # 9-15 hrs over Martian year

# Seasonal outside temperature (SIM model of KB's temp range)
outside_temp = -63 + 20 * sin(2π * day / 687)  # -83 to -43°C

# Greenhouse targets (derived from KB crop requirements)
internal_temp = 22  # °C
co2_level = 1000    # ppm

# Energy budget
energy_generated = solar_hours * solar_panel_efficiency  # more sun = more energy
energy_needed = heating_cost + lighting_cost + pump_cost
heating_cost = 0.5 * (internal_temp - outside_temp)      # colder outside = more energy
energy_deficit = max(0, energy_needed - energy_generated)
```

---

## Component 2: Crops (KB)

### 5 crop types

| Crop | Growth (sols) | Water/sol (L) | Light (hrs) | Optimal temp (°C) | Heat stress above | Yield (kg/m²) | kcal/100g | Protein g/100g | Micronutrients provided | Source |
|------|--------------|---------------|-------------|--------------------|--------------------|---------------|-----------|----------------|------------------------|--------|
| Lettuce | 30-45 | 2 | 10 | 15-22 | 25°C | 3-5 | 15 | 1.4 | Vit A, Vit K, folate | KB |
| Potato | 70-120 | 4 | 8 | 16-20 | 25-28°C | 4-8 | 77 | 2.0 | Vit C, potassium | KB |
| Radish | 21-30 | 1.5 | 8 | 15-22 | 26°C | 2-4 | 16 | 0.7 | Vit C | KB |
| Beans/Peas | 50-70 | 3 | 10 | 18-25 | 30°C | 2-4 | 100 | 7.0 | Iron, folate, potassium, magnesium | KB |
| Herbs | 25-35 | 1 | 8 | 18-24 | 28°C | 1-2 | 15 | 1.0 | Vit A, Vit C, Vit K | SIM est. |

> Water/sol, light hours, and herb numbers are SIM estimates. KB gives qualitative levels only.

### Crop footprint (SIM)

| Crop | m² per planting |
|------|----------------|
| Potato | 2.0 |
| Beans/Peas | 1.5 |
| Lettuce | 0.5 |
| Radish | 0.5 |
| Herbs | 0.3 |

### Crop state

```python
class Crop:
    type: str
    zone: int
    footprint_m2: float
    planted_day: int
    age: int            # days since planting
    health: float       # 0-100, affects yield at harvest
    growth: float       # 0-100%, harvested when ≥95%
    active_stress: str | None  # one of 7 stress types or None
```

### Growth per tick (SIM)

```python
water_factor = min(1.0, water_allocated / water_need)
light_factor = min(1.0, effective_solar / light_need)
temp_factor = temperature_curve(internal_temp, optimal_range)

efficiency = water_factor * light_factor * temp_factor
daily_growth = (100.0 / growth_cycle_days) * efficiency
growth = min(100.0, growth + daily_growth)
```

### Temperature curve (SIM)

```python
def temperature_curve(actual, optimal_range):
    low, high = optimal_range
    if low <= actual <= high:
        return 1.0
    distance = min(abs(actual - low), abs(actual - high))
    return max(0.0, 1.0 - distance / 15.0)
```

### 7 stress types (KB — from Domain 4)

```python
def detect_stress(self, environment, resources, zone):
    water_factor = min(1.0, zone.water_allocation * resources.water_factor)
    light_factor = min(1.0, environment.effective_solar / self.light_need)
    temp = environment.internal_temp

    if water_factor < 0.5:                        return "drought"
    if water_factor > 1.3:                        return "overwatering"
    if temp > self.heat_stress_threshold:          return "heat"
    if temp < self.optimal_temp[0]:                return "cold"
    if resources.nutrients_critically_low:          return "nutrient_deficiency"
    if light_factor < 0.4:                         return "light_insufficient"
    if environment.co2_event_active:               return "co2_imbalance"
    return None
```

### Stress → health impact (KB priority: water deficit & nutrient def are HIGH risk)

```python
STRESS_SEVERITY = {
    "drought": 5, "nutrient_deficiency": 4, "heat": 4,
    "cold": 3, "overwatering": 3, "light_insufficient": 2, "co2_imbalance": 2,
}

# Per tick:
if stress is None:
    health = min(100, health + 1)  # recovery
else:
    health -= STRESS_SEVERITY[stress]
```

### Harvest (kg-based)

```python
if growth >= 95.0 and health > 20:
    yield_kg = yield_per_m2 * footprint_m2 * (health / 100.0)
    yield_kcal = yield_kg * 10 * kcal_per_100g
    yield_protein_g = yield_kg * 10 * protein_per_100g
    yield_micronutrients = CROP_MICRONUTRIENT_MAP[type]
```

### Crop → micronutrient map (KB)

```python
CROP_MICRONUTRIENT_MAP = {
    "lettuce":    ["vitamin_a", "vitamin_k", "folate"],
    "potato":     ["vitamin_c", "potassium"],
    "radish":     ["vitamin_c"],
    "beans_peas": ["iron", "folate", "potassium", "magnesium"],
    "herbs":      ["vitamin_a", "vitamin_c", "vitamin_k"],
}
```

---

## Component 3: Astronauts (simplified)

4 identical crew members. No names, no roles, no weights.

```python
CREW_SIZE = 4
CALORIES_PER_PERSON_PER_DAY = 3000    # KB: planning average
PROTEIN_PER_PERSON_PER_DAY_G = 100    # KB: 1.2-1.8 g/kg at ~75kg avg
WATER_PER_PERSON_PER_DAY_L = 2.5      # KB: 2.1-2.5

TOTAL_DAILY_CALORIES = CREW_SIZE * CALORIES_PER_PERSON_PER_DAY  # 12,000
TOTAL_DAILY_PROTEIN_G = CREW_SIZE * PROTEIN_PER_PERSON_PER_DAY_G  # 400
```

No health score. No mood. No death. The crew's wellbeing is represented entirely by the greenhouse fraction metrics.

---

## Component 4: Stored food reserve (KB-backed framing)

The crew arrives with enough stored food for the full mission. The greenhouse supplements it.

```python
class StoredFood:
    total_calories: float = 5_400_000     # 450 × 12,000 (KB)
    remaining_calories: float = 5_400_000
```

### Feeding logic (per tick)

```python
def feed_crew(food_supply, stored_food, crew_size):
    daily_need_kcal = crew_size * 3000
    daily_need_protein_g = crew_size * 100

    # Greenhouse production today
    gh_kcal = food_supply.consume_available_calories()
    gh_protein_g = food_supply.consume_available_protein()
    gh_micronutrients = food_supply.get_micronutrients_covered()

    # Stored food fills the rest
    stored_kcal = daily_need_kcal - gh_kcal
    stored_food.remaining_calories -= stored_kcal

    return {
        "calorie_gh_fraction": gh_kcal / daily_need_kcal,
        "protein_gh_fraction": gh_protein_g / daily_need_protein_g,
        "micronutrients_covered": gh_micronutrients,  # list of nutrient names
        "micronutrient_count": len(set(gh_micronutrients)),  # out of 7
        "stored_food_remaining": stored_food.remaining_calories,
        "stored_food_days_left": stored_food.remaining_calories / daily_need_kcal,
    }
```

---

## Component 5: Resources

### Starting values (SIM — fixed, configurable later)

| Resource | Amount | Unit |
|----------|--------|------|
| Water | 10,000 | liters |
| Nutrients | 5,000 | units |
| Energy | Solar-dependent | units/sol |

### Per-tick

```python
# Consumption
water_used = sum(crop.water_need for crop in active_crops) + CREW_SIZE * 2.5
nutrients_used = sum(crop.nutrient_need for crop in active_crops)
water -= water_used
nutrients -= nutrients_used

# Recycling (KB: 85-95% water recovery)
water += water_used * 0.90
nutrients += nutrients_used * 0.70  # SIM estimate

# Energy (daily, no storage)
energy_generated = solar_hours * panel_efficiency
energy_needed = heating + lighting + pumps
energy_deficit = max(0, energy_needed - energy_generated)

# Critical thresholds
# water == 0 → crops get no water → drought stress on everything
# nutrients critically low → nutrient_deficiency stress
# energy deficit → must cut lighting or heating (agent decides)
```

---

## Component 6: Greenhouse zones (SIM + NASA)

60 m² total growing area. 4 zones × 15 m² each. Grounded in NASA research.

> Sources: Wheeler et al. (40-50 m²/person for full calories), NASA prototype (48 m² for 25% supplement for 6 crew), Lunar Palace 1 (69 m² for 55% food for 3 crew).

```python
class Zone:
    id: int
    area_m2: float = 15.0
    crops: list[Crop]
    artificial_light: bool = True
    water_allocation: float = 1.0  # multiplier 0.0-1.5

    def used_area(self): return sum(c.footprint_m2 for c in self.crops)
    def available_area(self): return self.area_m2 - self.used_area()
    def can_plant(self, crop_type): return self.available_area() >= CROP_FOOTPRINT[crop_type]
```

---

## Component 7: Random events (2 only — both KB-backed)

| Event | Prob/sol | Duration | Effect | KB source |
|-------|---------|----------|--------|-----------|
| Water recycling degradation | 1% | 5-15 sols | Recycling drops to 70-80% | KB scenario 6.3 |
| Temperature control failure | 1% | 1-3 sols | Internal temp drifts ±5°C | KB scenario 6.6 |

Plus: **manual injection via admin panel** (feature list item).

---

## Component 8: Initial state

Greenhouse starts empty. Agent decides what to plant.

```python
initial = {
    "day": 0,
    "zones": [Zone(id=i, area_m2=15.0, crops=[]) for i in range(1, 5)],
    "stored_food": StoredFood(remaining=5_400_000),
    "food_supply": {},
    "resources": ResourcePool(water=10_000, nutrients=5_000),
}
```

---

## Agent actions

| Action | Parameters | Effect |
|--------|-----------|--------|
| `plant` | crop_type, zone_id | Plant crop in zone (if area available) |
| `harvest` | crop_id | Harvest ready crop → food supply |
| `remove` | crop_id | Remove dead/stressed crop (frees area) |
| `water_adjust` | zone_id, multiplier (0-1.5) | Change water allocation for zone |
| `light_toggle` | zone_id, on/off | Toggle artificial lighting |
| `set_temperature` | target_temp | Adjust greenhouse temperature |

---

## State snapshot (per tick → frontend + agent)

```json
{
  "day": 127,
  "environment": {
    "solar_hours": 13.2,
    "outside_temp": -52,
    "internal_temp": 22,
    "energy_generated": 45,
    "energy_needed": 38,
    "energy_deficit": 0
  },
  "zones": [{
    "id": 1,
    "area_m2": 15.0,
    "used_area_m2": 12.5,
    "available_area_m2": 2.5,
    "artificial_light": true,
    "water_allocation": 1.0,
    "crops": [{
      "id": "crop_001",
      "type": "potato",
      "footprint_m2": 2.0,
      "age": 45,
      "health": 87,
      "growth_pct": 50.0,
      "active_stress": null
    }]
  }],
  "resources": {
    "water": 8423,
    "nutrients": 3891
  },
  "food_supply": {
    "total_kg": 34.0,
    "total_kcal": 18200,
    "total_protein_g": 620,
    "by_type": {
      "potato": {"kg": 12.0, "kcal": 9240, "protein_g": 240},
      "beans_peas": {"kg": 10.0, "kcal": 10000, "protein_g": 700},
      "lettuce": {"kg": 4.5, "kcal": 675, "protein_g": 63},
      "radish": {"kg": 3.0, "kcal": 480, "protein_g": 21},
      "herbs": {"kg": 0.5, "kcal": 75, "protein_g": 5}
    }
  },
  "stored_food": {
    "remaining_kcal": 4200000,
    "days_remaining": 350
  },
  "daily_nutrition": {
    "calorie_gh_fraction": 0.21,
    "protein_gh_fraction": 0.15,
    "micronutrients_covered": ["vitamin_a", "vitamin_c", "vitamin_k", "folate", "potassium"],
    "micronutrient_count": 5
  },
  "active_events": [],
  "agent_actions": [],
  "metrics": {
    "avg_calorie_gh_fraction": 0.19,
    "avg_protein_gh_fraction": 0.14,
    "avg_micronutrient_coverage": 4.8,
    "total_harvested_kg": 285,
    "crops_lost": 4,
    "days_survived": 127
  }
}
```

---

## Additions for later (do NOT build now)

| Feature | Description | Priority |
|---------|-------------|----------|
| EVA missions | Every 30 sols, 1.4x calorie multiplier, need capable crew | Medium |
| Astronaut personas | Names, roles, weights, individual calorie needs | Low |
| Mood system | Variety bonus, stored food penalty, herbs boost | Medium |
| Health/death mechanic | Health score, deficiency streaks, crew death | Medium |
| Infection/disease | Probability-based, spreads between crops | Medium |
| Dust storms | 2%/sol, 3-7 days, -60 to -90% solar | High |
| Pump failure event | 1%/sol, 1-2 days, no water delivery | Medium |
| Light malfunction event | 1.5%/sol, 1-3 days, zone loses light | Medium |
| Weather forecast | 7-day projected solar + storm risk | Medium |
| Food spoilage | Harvested food expires after N days | Low |
| Configurable resources | Admin panel sets starting water/nutrients | Low |
| Mission capability | Health > threshold required for EVA | Low |
| Treat disease action | Agent treats infected crop, 70% success | Medium |
| Ration stored food action | Agent caps daily stored food use | Low |

---

## KB data reference

Raw KB responses: `simulation/kb_data/`
MCP tool: `kb-start-hack-target___knowledge_base_retrieve`
MCP endpoint: `https://kb-start-hack-gateway-buyjtibfpg.gateway.bedrock-agentcore.us-east-2.amazonaws.com/mcp`

# Simulation Specification

> Complete spec for the Martian greenhouse simulation. Defines every parameter, formula, event, and how the system connects. Backend dev builds from this.

---

## Goal

Simulate 450 sols of greenhouse operation for 4 astronauts. Day-by-day loop where environment changes, crops grow or die, astronauts consume food, resources deplete/recycle, random events create pressure. An AI agent observes state each day and takes actions.

### Scoring metrics

| Metric | Target |
|--------|--------|
| Crew survival | All 4 alive at day 450 (hard fail if anyone dies) |
| Mission completion | ≥80% of scheduled EVA missions |
| Nutrition balance | Average nutrition score across crew (0-100) |
| Food diversity | ≥3 crop types eaten per week |
| Resource efficiency | Water and nutrients remaining at day 450 |
| Crop waste | Crops lost to disease/stress/neglect |

---

## Day loop (pseudocode)

```python
for day in range(1, 451):
    environment.update(day)
    events = roll_random_events(day)
    apply_events(events, environment, crops, resources)

    for crop in crops:
        crop.grow(environment, resources)
        crop.check_stress()
        crop.check_infection()

    resources.consume(crops, astronauts)
    resources.recycle()
    food_supply.add(harvest_ready_crops(crops))

    for astronaut in astronauts:
        astronaut.eat(food_supply)
        astronaut.update_nutrition()
        astronaut.update_mood()
        astronaut.check_health()

    if is_mission_day(day):
        check_mission_readiness(astronauts)

    state = capture_state(everything)
    actions = agent.decide(state)  # queries AgentCore + strategy doc
    apply_actions(actions)
    store(state)
```

---

## Component 1: Mars environment

### Constants (from knowledge base, set once)

| Parameter | Value |
|-----------|-------|
| Gravity | 0.38g |
| Atmospheric pressure (outside) | ~610 Pa |
| Base solar irradiance (peak) | ~590 W/m² (43% of Earth) |
| Martian year | 687 sols |
| Sol length | ~24h (simplified) |

### Variables (per tick)

**Solar hours:**
```python
base_solar_hours = 12
seasonal_amplitude = 3
solar_hours = base_solar_hours + seasonal_amplitude * sin(2π * day / 687)
# Range: ~9h (winter) to ~15h (summer)
```

**Solar intensity (0.0-1.0):**
```python
solar_intensity = 1.0 - dust_penalty  # dust_penalty set by storm events
effective_solar = solar_hours * solar_intensity
```

**Outside temperature:**
```python
outside_temp = -60 + 20 * sin(2π * day / 687)  # -80°C to -40°C
```

**Greenhouse heating cost:**
```python
target_temp = 22  # °C
heating_cost = 0.5 * (target_temp - outside_temp)  # energy units/sol
```

---

## Component 2: Crops

### Crop types (6 types, query KB domain 3 for real values)

| Crop | Growth (sols) | Water/sol (L) | Light need (hrs) | Optimal temp (°C) | Yield (units) | Key nutrients |
|------|--------------|---------------|-------------------|--------------------|---------------|---------------|
| Lettuce | 30 | 2 | 10 | 18-24 | 15 | Vitamins A, C, K |
| Potato | 80 | 4 | 8 | 15-20 | 60 | Carbs, potassium |
| Tomato | 60 | 3 | 12 | 20-26 | 40 | Vitamins A, C |
| Soybean | 75 | 3 | 10 | 20-25 | 50 | Protein, iron |
| Wheat | 90 | 2.5 | 10 | 15-22 | 55 | Carbs, fiber |
| Spinach | 35 | 1.5 | 8 | 15-20 | 20 | Iron, calcium, vitamins |

### Crop instance state

```python
class Crop:
    type: str
    zone: int           # 1-4
    planted_day: int
    age: int
    health: float       # 0-100
    growth: float       # 0-100%
    infected: bool
    harvested: bool
```

### Growth (per tick)

```python
water_factor = min(1.0, water_allocated / water_need)
light_factor = min(1.0, effective_solar / light_need)
temp_factor = temperature_curve(internal_temp, optimal_range)

efficiency = water_factor * light_factor * temp_factor
daily_growth = (100.0 / growth_cycle_days) * efficiency
growth = min(100.0, growth + daily_growth)
```

### Temperature curve

```python
def temperature_curve(actual, optimal_range):
    low, high = optimal_range
    if low <= actual <= high:
        return 1.0
    distance = min(abs(actual - low), abs(actual - high))
    return max(0.0, 1.0 - distance / 15.0)
```

### Stress (per tick)

```python
if efficiency >= 0.8:   health += 1    # recovering
elif efficiency >= 0.5: health -= 2    # stressed
else:                   health -= 5    # severe stress
```

### Infection (per tick)

```python
if health < 40:   infection_chance = 0.05   # 5%/day
elif health < 60: infection_chance = 0.02   # 2%/day
else:             infection_chance = 0.005  # 0.5%/day

if infected: health -= 8  # deteriorates fast
```

### Harvest

```python
harvestable = growth >= 95.0 and not infected and health > 20
actual_yield = base_yield * (health / 100.0)
```

### Death: health hits 0 → crop removed, logged as waste.

---

## Component 3: Astronauts

### Initial parameters (from KB domain 5)

| Astronaut | Role | Weight (kg) | Base cal/sol |
|-----------|------|-------------|-------------|
| 1 | Commander | 80 | 2400 |
| 2 | Scientist | 65 | 2000 |
| 3 | Engineer | 85 | 2500 |
| 4 | Medic | 60 | 1900 |

### State

```python
class Astronaut:
    calories_score: float = 100    # 0-100
    protein_score: float = 100
    vitamin_score: float = 100
    mineral_score: float = 100
    mood: float = 100
    health: float = 100
    meals_log: list  # last 7 days
    deficiency_streak: int = 0
    mission_capable: bool = True
```

### Daily calorie need

```python
need = base_calories
if is_mission_day: need *= 1.4
if internal_temp > 26: need *= 1.05
need *= uniform(0.95, 1.05)  # daily noise
```

### Nutrition update (per tick)

```python
calorie_ratio = calories_consumed / daily_need
calories_score += (calorie_ratio - 0.9) * 20  # clamped 0-100

# Similar for protein, vitamins, minerals vs daily targets
# If avg nutrition < 40: deficiency_streak += 1
# Else: deficiency_streak -= 1 (min 0)
```

### Mood (per tick)

```python
variety = count distinct crop types in last 7 days of meals
if variety >= 4: delta += 2
elif variety == 1: delta -= 3
elif variety == 0: delta -= 5

if avg_nutrition > 70: delta += 1
elif avg_nutrition < 30: delta -= 3

delta += uniform(-1, 1)  # daily noise
mood = clamp(mood + delta, 0, 100)
```

### Health (per tick)

```python
if deficiency_streak > 5:
    health -= (deficiency_streak - 5) * 2  # escalates fast
if mood < 20:
    health -= 1
if deficiency_streak == 0 and mood > 50:
    health += 0.5  # slow recovery

mission_capable = health > 40 and mood > 25
# health == 0 → astronaut dies (hard fail)
```

### Missions

```python
MISSION_INTERVAL = 30  # every 30 sols
MIN_CREW = 2           # need at least 2 capable astronauts
```

---

## Component 4: Resource pool

### Starting values

| Resource | Amount | Unit |
|----------|--------|------|
| Water | 10,000 | liters |
| Nutrients | 5,000 | units |
| Energy | Solar-dependent | units/sol |

### Per-tick

```python
water_used = sum(crop.water_need for crop) + len(astronauts) * 3
nutrients_used = sum(crop.nutrient_need for crop)
water -= water_used
nutrients -= nutrients_used

# Recycling
water += water_used * 0.90     # 90% recovery
nutrients += nutrients_used * 0.70  # 70% recovery

# Energy (daily budget, no storage)
energy_generated = effective_solar * panel_efficiency
energy_needed = heating + lighting + pumps + life_support
energy_deficit = max(0, energy_needed - energy_generated)
# Deficit → agent must cut something
```

### Critical: water == 0 → all crops health -20/sol. Nutrients == 0 → growth at 50%.

---

## Component 5: Random events

| Event | Prob/sol | Duration | Effect |
|-------|---------|----------|--------|
| Dust storm | 2% | 3-7 sols | Solar -60% to -90% |
| Pump failure | 1% | 1-2 sols | No water delivery |
| Light malfunction | 1.5% | 1-3 sols | One zone loses light |
| Crop disease | 1% | Until treated | One crop infected, can spread |
| Temperature spike | 0.5% | 1 sol | +5°C (stresses heat-sensitive crops) |

Plus: **manual injection via admin panel** (scenario injection feature).

---

## Component 6: Greenhouse zones

```python
ZONES = 4
MAX_CROPS_PER_ZONE = 6

class Zone:
    id: int
    crops: list[Crop]
    artificial_light: bool = True
    water_allocation: float = 1.0  # multiplier 0.0-1.5
```

---

## Agent actions (per tick)

| Action | Parameters | Effect |
|--------|-----------|--------|
| `plant` | crop_type, zone_id | New crop in zone |
| `harvest` | crop_id | Harvest ready crop → food supply |
| `remove` | crop_id | Remove dead/infected crop |
| `water_adjust` | zone_id, multiplier | Change water allocation |
| `light_toggle` | zone_id, on/off | Toggle artificial lighting |
| `treat_disease` | crop_id | Treat infection (uses nutrients, 70% success) |
| `set_temperature` | target_temp | Adjust greenhouse temp |

---

## Agent decision flow

```
1. Receive state snapshot
2. Load strategy document (learned from past runs)
3. Check for urgent issues (crop stress, nutrition gaps, events)
4. Query AgentCore KB for guidance (domains 2-6)
5. Decide actions
6. Return actions with confidence scores and reasoning
7. If confidence < threshold → queue as "recommended" for human review
```

See `backend/docs/LEARNING-SYSTEM.md` for how the strategy document evolves across runs.

---

## State snapshot (emitted per tick, consumed by frontend + agent)

```json
{
  "day": 127,
  "environment": {
    "solar_hours": 13.2, "solar_intensity": 0.85,
    "outside_temp": -52, "internal_temp": 22, "season": "spring"
  },
  "zones": [{
    "id": 1,
    "crops": [{"type": "lettuce", "age": 18, "health": 87, "growth": 60.0, "infected": false}],
    "artificial_light": true, "water_allocation": 1.0
  }],
  "astronauts": [{
    "name": "Commander",
    "calories_score": 78, "protein_score": 65,
    "vitamin_score": 72, "mineral_score": 58,
    "mood": 71, "health": 92, "mission_capable": true
  }],
  "resources": {
    "water": 8423, "nutrients": 3891,
    "energy_available": 45, "energy_used": 38, "energy_deficit": 0
  },
  "food_supply": {
    "total_units": 340,
    "by_type": {"lettuce": 45, "potato": 120, "soybean": 100, "spinach": 75}
  },
  "active_events": [
    {"type": "dust_storm", "day_started": 125, "days_remaining": 2, "severity": 0.7}
  ],
  "agent_actions": [
    {"action": "water_adjust", "zone": 2, "multiplier": 0.6, "reason": "conserving during storm", "confidence": 0.88}
  ],
  "metrics": {
    "missions_completed": 3, "missions_failed": 1,
    "crops_lost": 4, "total_harvested": 28, "days_survived": 127
  }
}
```

---

## Variability summary

| Random | Range |
|--------|-------|
| Solar hours noise | ±0.5 hrs/sol |
| Astronaut calorie need | ±5% daily |
| Infection chance | 0.5-5% based on health |
| Event probability | 0.5-2% per type per sol |
| Treatment success | 70% fixed |
| Mood noise | ±1 point/sol |

| Deterministic | |
|---------------|---|
| Growth formula | Given inputs → predictable output |
| Resource consumption | Exact per crop/astronaut |
| Nutrition scoring | Formula-based |
| Health decline | Streak-based |
| Mission schedule | Every 30 sols |

---

## Hackathon simplifications

| Full realism | Our simplification |
|-------------|-------------------|
| Continuous time | Day-by-day tick |
| Complex soil chemistry | Single "nutrients" pool |
| Crop interactions | Independent crops |
| Light spectrum needs | Single "hours of light" |
| Water quality degradation | Water is water |
| Energy storage (batteries) | Daily budget, no storage |
| Food spoilage | Harvested food doesn't expire |
| Atmospheric management | Ignored |
| Detailed psychology | Simple mood score |

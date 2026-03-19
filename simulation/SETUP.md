# Simulation Engine — Implementation Guide

> **For Claude Code.** Read these files in order:
> 1. This file (`SETUP.md`) — HOW to build, engineering standards, testing strategy
> 2. `SIMULATION-SPEC.md` — WHAT to build (formulas, parameters, state schema)
> 3. `IMPLEMENTATION-NOTES.md` — Zone plan rounding fix (critical for zones.py)

---

## What we're building

A stateless FastAPI REST server that simulates a Martian greenhouse. It receives state + agent actions, runs day-by-day physics for N days, and returns updated state. No AI/LLM logic — the backend orchestrator handles that separately.

**Python 3.13**, project venv at `.venv/` (repo root).

---

## IMPORTANT: Working with Michael (the PM)

### When to ask before proceeding

**STOP and ask Michael** when:
- A formula from the spec seems wrong or produces unrealistic results (e.g., crops growing in 5 days instead of 70)
- Two parts of the spec contradict each other
- You're unsure about a design decision not covered in the spec (e.g., "what happens if water goes negative?")
- A test fails and you're not sure if the test or the implementation is wrong
- You want to change the file structure, add a dependency, or deviate from the spec
- The sanity check numbers don't match (e.g., calorie fraction is 50% instead of 17-21%)
- You're about to implement something from the "Planned next additions" or "Stretch additions" sections — those are explicitly out of scope

**DO NOT silently fix issues.** If something seems off, flag it. Michael can adjust the spec or clarify the intent. The spec was carefully designed with KB data — a "fix" that changes the behavior might break the overall balance.

### After each phase

After completing each phase, provide:
1. What was built (files created/modified)
2. Test results (pass/fail with key numbers)
3. Any concerns or deviations from the spec
4. What's next

---

## Engineering standards

### Code quality

- **Type hints everywhere.** Every function signature, every variable where the type isn't obvious. Use `str | None` not `Optional[str]`.
- **Docstrings on every public function.** One-liner for simple functions, multi-line with Args/Returns for complex ones.
- **No magic numbers in code.** Every number comes from `config.py`. If you need a threshold, put it in config.
- **Descriptive names.** `water_consumption_per_sol` not `wc`. `calculate_growth_efficiency` not `calc`.
- **Small functions.** If a function is longer than ~30 lines, split it. Each function does one thing.
- **Immutable where possible.** Config is frozen dataclasses. State mutations happen in clearly defined places (the tick loop), not scattered across utility functions.

### Module boundaries

Each module has a clear responsibility and a clean interface:

```
config.py       → exports constants and config dataclasses (no logic)
models.py       → exports state dataclasses + Pydantic API models (no logic)
environment.py  → exports update_environment() (reads Environment + Events, mutates Environment)
events.py       → exports roll_events(), update_active_events() (reads/mutates Event list)
resources.py    → exports consume_resources(), recycle_resources() (mutates ResourcePool)
crops.py        → exports grow_crop(), detect_stress(), apply_stress(), harvest_crop() (mutates Crop)
zones.py        → exports fill_zone(), auto_replant(), set_zone_plan() (mutates Zone)
feeding.py      → exports feed_crew() (mutates FoodSupply + StoredFood, returns nutrition dict)
simulation.py   → exports simulate_tick(), create_initial_state() (orchestrates everything)
main.py         → exports FastAPI app (thin wrapper around simulation.py)
```

**Rule: modules only import downward.** `simulation.py` imports everything. `crops.py` imports `config` and `models`. `config.py` imports nothing from our code.

### Error handling

- **Validate inputs at the API boundary** (in `main.py` using Pydantic). Don't validate deep inside the simulation loop — it's too slow.
- **Clamp, don't crash.** If water goes negative, clamp to 0. If health exceeds 100, clamp to 100. If growth exceeds 100, clamp to 100. Log a warning but don't raise an exception.
- **Invalid actions get skipped and logged.** If the agent tries to plant in a full zone, skip the action and add it to the daily log's `warnings` list. Don't crash the simulation.
- **Division by zero protection.** Always use `max(denominator, 0.001)` or check before dividing. This applies especially in feeding.py and growth calculations.

### State management

- **The engine is stateless between calls.** Each `/simulate/tick` receives the full state as JSON, deserializes it, runs the loop, serializes and returns the new state. No global variables, no class instances persisting between requests.
- **Deep copy state at the start of tick.** If the tick fails partway through, we don't want a partially mutated state. Copy first, mutate the copy, return the copy.
- **State serialization must round-trip perfectly.** `dict_to_state(state_to_dict(state))` must produce an identical state. Write a test for this.

---

## Testing strategy

### Test philosophy

Every module gets its own test file. Tests serve two purposes:
1. **Correctness:** Does the math match the spec?
2. **Sanity:** Do the outputs make physical/biological sense?

Tests should be fast (no API calls, no network). Use deterministic RNG seeds.

### Test structure per module

```python
# tests/test_crops.py
import pytest
from src.config import CROPS
from src.models import Crop, Environment, ResourcePool, Zone
from src.crops import grow_crop, detect_stress, apply_stress, is_harvestable, harvest_crop

class TestGrowth:
    """Crop growth under various conditions."""
    
    def test_potato_reaches_harvest_under_optimal_conditions(self):
        """A potato should reach 95% growth in 70-120 days with perfect water, light, temp."""
        # Arrange
        crop = Crop(id="test_001", type="potato", zone_id=1, footprint_m2=2.0, 
                    planted_day=0, growth_cycle_days=90)
        env = Environment(solar_hours=12, internal_temp=18.0)  # optimal for potato
        resources = ResourcePool(water=10_000, nutrients=5_000)
        zone = Zone(id=1, artificial_light=True, water_allocation=1.0)
        
        # Act
        for day in range(120):
            grow_crop(crop, env, resources, zone)
        
        # Assert
        assert crop.growth >= 95.0, f"Potato should be harvestable by day 120, got {crop.growth}%"
    
    def test_growth_slows_under_heat_stress(self):
        """Lettuce above 25°C should grow slower than optimal."""
        # ... compare growth rate at 20°C vs 27°C
    
    def test_zero_water_means_zero_growth(self):
        """With no water, growth should not advance."""
        # ...

class TestStress:
    """Stress detection under various conditions."""
    
    def test_drought_detected_when_water_factor_low(self):
        """Water factor below 0.5 should trigger drought stress."""
        # ...
    
    def test_heat_detected_above_threshold(self):
        """Temperature above heat_stress_threshold should trigger heat stress."""
        # ...
    
    def test_no_stress_under_optimal_conditions(self):
        """All factors within range should return None stress."""
        # ...

class TestHarvest:
    """Harvest conditions and yield calculation."""
    
    def test_harvest_yield_matches_spec(self):
        """Yield should be yield_per_m2 * footprint * health/100."""
        # ...
    
    def test_unhealthy_crop_not_harvestable(self):
        """Crop with health <= 20 should not be harvestable even at 100% growth."""
        # ...
```

### What to test per module

**`test_config.py`** — Sanity checks on config values:
- All crop growth cycles are positive
- All footprints fit within zone area
- Micronutrient map covers all 7 nutrients
- Stress severity map covers all 7 stress types

**`test_models.py`** — Serialization roundtrip:
- Create GreenhouseState → `state_to_dict()` → `dict_to_state()` → compare equality
- Test with populated state (crops in zones, active events, food in stockpile)

**`test_environment.py`** — Sine curve sanity:
- Solar hours at day 0 ≈ 12, day 172 ≈ 15 (summer peak), day 344 ≈ 9 (winter low)
- Outside temp follows same seasonal pattern
- Energy deficit appears in winter (high heating cost + low solar generation)
- Temperature failure event shifts internal temp by ±5°C

**`test_crops.py`** — Growth and stress:
- Each crop type reaches 95% growth within its cycle range under optimal conditions
- Growth rate is proportional to efficiency (half water = roughly half growth rate)
- All 7 stress types can be triggered by appropriate conditions
- Health recovers by +1/day when no stress, drops by severity when stressed
- Harvest yield = yield_per_m2 × footprint × health/100

**`test_zones.py`** — Zone plan filling and rounding:
- 100% potato on 15m² → 7 plantings (14m²), 1m² wasted
- 100% lettuce on 15m² → 30 plantings (15m²), 0 wasted
- 50/50 potato/beans → verify pass 2 fills remaining space
- Auto-replant after harvest: same crop type, same footprint
- Zone plan change: existing crops keep growing, new plantings follow new plan

**`test_resources.py`** — Consumption and recycling:
- Net water loss per day with N crops at known water demands
- Recycling recovers 90% of water used
- Water never goes negative (clamped to 0)

**`test_events.py`** — Event system:
- With seed, events fire at approximately 1% rate over 1000 rolls
- Same event type doesn't fire twice simultaneously
- Water recycling event gradually recovers over duration
- Temperature event auto-resolves after duration
- Expired events get removed

**`test_feeding.py`** — Nutrition fractions:
- Empty stockpile → calorie_gh_fraction = 0, all from stored food
- Stockpile with known kg → verify exact calorie and protein fractions
- Stored food decreases by correct amount
- Micronutrients covered matches crop types consumed

**`test_simulation.py`** — Integration tests:
- **30-day smoke test:** Init → set zone plans → tick 30 days → verify crops exist and grew
- **450-day full run:** Init → set KB-recommended zone plan → tick 450 days (no early stops disabled) → verify:
  - Average calorie fraction 15-25%
  - Average protein fraction 10-20%
  - Micronutrient coverage 4-7
  - Water remaining > 0
  - Total harvested > 0 kg
  - Some crops were lost to stress (>0, proves stress works)
- **Early stop test:** Init → tick 30 days with injected event on day 10 → verify stopped_early=True, days_simulated=10
- **Empty greenhouse test:** Init → tick 30 days with NO zone plans → verify calorie fraction = 0%, stored food depletes normally

### Running tests

```bash
cd simulation/
source ../.venv/bin/activate
pip install pytest
python -m pytest tests/ -v
```

### When a test fails

1. Check if the test expectation is wrong (compare to spec)
2. Check if the implementation diverges from the spec
3. If the spec seems wrong, **ask Michael** before changing either the test or the implementation

---

## Evaluation loop: does the simulation make sense?

After the full simulation is working, run these sanity checks:

### Biological sanity
- Do potatoes take ~70-120 days to harvest? (not 10, not 500)
- Does lettuce harvest faster than potatoes? (it should — 30-45 vs 70-120)
- Do crops die under extreme stress? (heat 30°C+ for lettuce, drought for days)
- Do crops recover when stress is removed? (health should climb back)

### Resource sanity
- Does water slowly deplete over 450 days? (net loss ~10% of daily consumption)
- Is the 10,000L enough to last 450 days? (should be, with 90% recycling)
- Does energy deficit appear in winter months? (low solar + high heating)

### Nutritional sanity
- First 30 days: calorie fraction ≈ 0% (nothing harvested yet)
- Days 30-60: fraction starts climbing (first lettuce/radish harvests)
- Days 70-120: fraction jumps (first potato harvests)
- Steady state: ~17-21% calorie fraction (matches our sanity math from the spec)
- Protein fraction should be lower than calorie fraction (crops are carb-heavy, beans are the main protein)

### Event sanity
- Over 450 days with 1%/sol probability, expect ~4-5 water recycling events and ~4-5 temperature events
- Water recycling events should cause temporary water depletion acceleration
- Temperature events should cause stress on sensitive crops

### If numbers are way off

| Problem | Likely cause |
|---------|-------------|
| Calorie fraction >50% | Yield per m² too high, or growth cycle too fast |
| Calorie fraction <5% | Yield too low, growth too slow, or harvest condition too strict |
| Water runs out before day 200 | Recycling rate not applied, or water consumption formula wrong |
| No crops ever stressed | Stress thresholds too generous, or temp/water always within range |
| All crops die immediately | Stress severity too harsh, or initial conditions outside all optimal ranges |
| Stored food goes negative | Feeding logic not clamping, or consumption exceeds reserves |

**If any of these happen, STOP and tell Michael.** Don't silently adjust numbers to make it work — the spec values were calibrated together.

---

## Architecture: data flow

```
POST /simulate/tick
│
├─ Deserialize request → GreenhouseState + actions + days + inject_events
│
├─ Deep copy state (safety net)
│
├─ FOR each day:
│   ├─ apply_actions()          ← zones.py (set_zone_plan, fill, remove)
│   │                             resources.py (water_adjust)
│   │                             environment (set_temperature, light_toggle)
│   │
│   ├─ update_environment()     ← environment.py (sine curves, energy budget)
│   │
│   ├─ roll_events()            ← events.py (random, inject, apply)
│   ├─ update_active_events()   ← events.py (expire, recover)
│   │
│   ├─ for each crop:
│   │   ├─ grow_crop()          ← crops.py (efficiency → growth)
│   │   ├─ detect_stress()      ← crops.py (which factor is wrong?)
│   │   └─ apply_stress()       ← crops.py (health += or -=)
│   │
│   ├─ remove dead crops        ← zones.py (auto_replant)
│   │
│   ├─ consume_resources()      ← resources.py (water, nutrients)
│   ├─ recycle_resources()      ← resources.py (90% water, 70% nutrients)
│   │
│   ├─ auto_harvest()           ← crops.py (growth ≥ 95, health > 20)
│   │   └─ auto_replant()       ← zones.py (same type per plan)
│   │
│   ├─ feed_crew()              ← feeding.py (stockpile → stored food → fractions)
│   │
│   ├─ build_daily_log()        ← log all changes, harvests, stress, warnings
│   │
│   └─ check_early_stop()       ← event fired? threshold breached?
│
├─ Serialize state → TickResponse
│
└─ Return { final_state, daily_log, days_simulated, stopped_early, stop_reason }
```

---

## File structure

```
simulation/
├── SIMULATION-SPEC.md          ← Spec (source of truth for formulas)
├── SETUP.md                    ← This file (implementation guide)
├── IMPLEMENTATION-NOTES.md     ← Zone rounding fix, edge cases
├── kb_data/                    ← Cached KB responses (reference only)
│
├── src/
│   ├── __init__.py
│   ├── main.py                 ← FastAPI app: 3 endpoints
│   ├── config.py               ← All constants, crop params, thresholds
│   ├── models.py               ← Dataclasses + Pydantic models + serialization
│   ├── environment.py          ← Mars environment: solar, temp, energy budget
│   ├── crops.py                ← Crop growth, stress detection, harvest logic
│   ├── zones.py                ← Zone plans, area management, auto-fill, auto-replant
│   ├── resources.py            ← Water, nutrients, energy consumption + recycling
│   ├── events.py               ← Random event rolling, event application, active tracking
│   ├── feeding.py              ← Crew feeding: stockpile → stored food → nutrition fractions
│   └── simulation.py           ← The tick function: wires day loop together
│
└── tests/
    ├── conftest.py             ← Shared fixtures (default state, default zone plan, seeded rng)
    ├── test_config.py          ← Config value sanity checks
    ├── test_models.py          ← Serialization roundtrip
    ├── test_environment.py     ← Sine curves, energy budget
    ├── test_crops.py           ← Growth, stress, harvest
    ├── test_zones.py           ← Zone filling, rounding, auto-replant
    ├── test_resources.py       ← Consumption, recycling
    ├── test_events.py          ← Event rolling, gradual recovery
    ├── test_feeding.py         ← Nutrition fractions
    └── test_simulation.py      ← Integration: 30-day, 450-day, early stop
```

---

## Build order

### Phase 1: Foundation

**1a. `config.py`** — All constants from the spec. Frozen dataclasses. Single source of truth.

**1b. `models.py`** — State dataclasses + Pydantic API models + `state_to_dict()` / `dict_to_state()`.

**1c. `tests/conftest.py`** — Shared fixtures: `default_state()`, `default_rng()`, `optimal_environment()`.

**1d. `tests/test_config.py` + `tests/test_models.py`** — Sanity checks + serialization roundtrip.

→ **Checkpoint: tell Michael what was built, test results, any concerns.**

### Phase 2: Independent components

**2a. `environment.py` + `tests/test_environment.py`**
**2b. `events.py` + `tests/test_events.py`**
**2c. `resources.py` + `tests/test_resources.py`**

→ **Checkpoint: all phase 2 tests pass, key numbers reported.**

### Phase 3: Crop and zone logic

**3a. `crops.py` + `tests/test_crops.py`**
**3b. `zones.py` + `tests/test_zones.py`** — use two-pass fill from `IMPLEMENTATION-NOTES.md`

→ **Checkpoint: potato grows to harvest in ~90 days, zone filling is correct with rounding.**

### Phase 4: Feeding

**4. `feeding.py` + `tests/test_feeding.py`**

→ **Checkpoint: nutrition fractions correct for known stockpile amounts.**

### Phase 5: Wire together

**5a. `simulation.py` + `tests/test_simulation.py`** — Integration tests.
**5b. `main.py`** — FastAPI endpoints.

→ **Final checkpoint: 450-day run produces 17-21% calorie fraction. Report full metrics.**

### Phase 6: API smoke test

Start the server, call all 3 endpoints with curl or httpx, verify responses match expected schema.

---

## Implementation notes

### Randomness
`random.Random(seed)` with seed based on mission_day. Pass rng through all functions. Never use `random.random()` directly — always the instance.

### Crop IDs
`f"crop_{zone_id}_{counter}"` with incrementing counter. Store `next_crop_id` in state so it persists across ticks.

### Water factor
Global availability × zone multiplier. If total water is low, all zones get proportionally less.

### Energy deficit effect
Auto-reduce light effectiveness when deficit exists (up to 50% penalty). Immediate mechanical impact while agent plans response.

### Metrics
Running averages: `new_avg = old_avg + (new_val - old_avg) / n`.

### Edge cases to handle
- Zone plan percentages that don't sum to 1.0 → normalize them
- Zone plan with crop type not in config → skip and warn
- Empty zone plan → no planting, zone stays empty
- Negative water/nutrients → clamp to 0
- Health > 100 or < 0 → clamp to range
- Growth > 100 → clamp to 100
- No crops in any zone → calorie fraction = 0, all from stored food
- Stored food goes to 0 → calorie fraction capped at what greenhouse provides

---

## Dependencies

```bash
source .venv/bin/activate
pip install fastapi uvicorn pydantic pytest
```

No other dependencies. The simulation is pure Python math + standard library (math, random, dataclasses, copy).

---

## Prompt for Claude Code

> Read these simulation docs in order:
> 1. `simulation/SETUP.md` — implementation guide, engineering standards, testing strategy
> 2. `simulation/SIMULATION-SPEC.md` — formulas, parameters, state schema
> 3. `simulation/IMPLEMENTATION-NOTES.md` — zone plan rounding fix
>
> Build the simulation engine following the phases in SETUP.md.
>
> **Engineering rules:**
> - Python 3.13, type hints everywhere, docstrings on all public functions
> - Dataclasses for state, Pydantic for API models, FastAPI for server
> - All constants in config.py — no magic numbers in code
> - One responsibility per file, modules only import downward
> - Write tests for each module BEFORE moving to the next phase
> - Clamp values instead of crashing (water ≥ 0, health 0-100, growth 0-100)
>
> **Working with me (Michael):**
> - After each phase, report: what was built, test results, any concerns
> - If a formula produces unrealistic results, STOP and ask me
> - If the spec seems contradictory, STOP and ask me
> - If the 450-day sanity check doesn't hit 17-21% calorie fraction, STOP and ask me
> - Do NOT implement anything from the additions sections unless I say so
>
> **Critical:** Use the two-pass fill algorithm from IMPLEMENTATION-NOTES.md for zone filling. Crops have fixed footprints — you can't plant half a potato.
>
> Start with Phase 1: config.py, models.py, conftest.py, and their tests.

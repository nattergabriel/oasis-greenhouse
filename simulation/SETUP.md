# Simulation — Setup & Coding Guidelines

## Project setup

```bash
cd simulation/
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install requests
```

No other dependencies needed for the core simulation. It's pure Python with standard library (math, random, json, dataclasses).

## File structure

```
simulation/
├── SIMULATION-SPEC.md          ← Specification (source of truth)
├── SETUP.md                    ← This file
├── query_mcp.py                ← MCP knowledge base query script
├── kb_data/                    ← Cached KB responses (gitignore the raw JSON)
│
├── src/                        ← Simulation engine code
│   ├── __init__.py
│   ├── config.py               ← All constants, crop params, astronaut params
│   ├── environment.py          ← Mars environment (solar, temp, seasons)
│   ├── crops.py                ← Crop class (growth, stress, infection, harvest)
│   ├── astronauts.py           ← Astronaut class (nutrition, mood, health)
│   ├── resources.py            ← Resource pool (water, nutrients, energy)
│   ├── events.py               ← Random event system
│   ├── zones.py                ← Greenhouse zones
│   ├── food_supply.py          ← Harvested food storage
│   ├── simulation.py           ← Main simulation loop (orchestrator)
│   └── state.py                ← State snapshot builder (JSON output)
│
├── tests/                      ← Quick sanity tests
│   ├── test_crops.py
│   ├── test_environment.py
│   └── test_simulation.py
│
└── run.py                      ← Entry point: run a simulation
```

## Coding conventions

- **Python 3.10+** — use dataclasses, type hints, f-strings
- **One class per file** — keep it simple, easy to navigate
- **Config in one place** — all magic numbers go in `config.py`, not scattered in code
- **Deterministic + seed** — `random.seed(42)` at start for reproducible runs during dev
- **State as dict** — each tick produces a plain dict (JSON-serializable), no special objects
- **No external ML/AI libs in simulation** — the simulation is pure math. The agent is separate.
- **Print progress** — `print(f"Day {day}/450 ...")` so you can see it running

## Config file approach

All parameters in `config.py` as frozen dataclasses or plain dicts. This makes it easy to:
- Override for different simulation runs
- Compare against KB data
- Pass to the admin panel for configuration

```python
# Example config.py structure
from dataclasses import dataclass

@dataclass(frozen=True)
class CropConfig:
    name: str
    growth_cycle_days: tuple[int, int]  # (min, max)
    optimal_temp: tuple[float, float]   # (low, high)
    heat_stress_threshold: float
    light_need_par: tuple[int, int]     # µmol/m²/s (min, max)
    water_demand: str                   # "low", "moderate", "high"
    yield_per_m2: tuple[float, float]   # kg/m² per cycle
    kcal_per_100g: float
    protein_per_100g: float
    key_nutrients: list[str]
    mission_role: str
    sensitivities: dict[str, str]       # stress_type → severity

# Populated from KB data
CROPS = {
    "lettuce": CropConfig(...),
    "potato": CropConfig(...),
    "radish": CropConfig(...),
    "beans_peas": CropConfig(...),
    "herbs": CropConfig(...),
}
```

## Build order (recommended)

1. **`config.py`** — all parameters from KB data
2. **`environment.py`** — simplest component, no dependencies
3. **`crops.py`** — needs environment for growth calc
4. **`resources.py`** — needs crops for consumption
5. **`astronauts.py`** — needs food supply
6. **`events.py`** — standalone random event generator
7. **`zones.py`** — thin wrapper grouping crops
8. **`food_supply.py`** — buffer between crops and astronauts
9. **`state.py`** — assembles the JSON snapshot
10. **`simulation.py`** — the loop that wires everything together
11. **`run.py`** — entry point, print results

Each component can be tested independently before wiring together.

## Testing approach

Not full unit tests — just quick scripts that verify:
- A crop grows from 0% to 100% in the expected number of days under optimal conditions
- An astronaut's health degrades when underfed for 10+ days
- Resources deplete correctly and recycling works
- A 450-day run completes without crashing

```bash
python -m pytest tests/ -v
# or just
python tests/test_crops.py
```

## State output

The simulation emits one JSON per tick. For development, write to a file:

```python
# In run.py
import json
states = simulation.run(days=450)
with open("output/run_001.json", "w") as f:
    json.dump(states, f, indent=2)
```

The frontend will later read this via API. For now, just files.

## What the simulation does NOT include

- No LLM calls (agent is separate, in `backend/`)
- No database writes (just JSON files for now)
- No API endpoints (backend team adds these)
- No frontend rendering
- No MCP queries during simulation (KB data is pre-loaded into config)

The simulation is a pure, fast, deterministic engine. The intelligence comes from the agent that reads its output and sends actions back.

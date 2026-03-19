"""All simulation constants. Single source of truth for every number in the engine.

Data sources:
  (KB)  = Syngenta MCP Knowledge Base
  (SIM) = Our simulation mechanic
  (NASA) = External research
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field


# ---------------------------------------------------------------------------
# Mars environment constants (KB)
# ---------------------------------------------------------------------------
GRAVITY_MS2: float = 3.721                    # 0.38g
ATMOSPHERIC_PRESSURE_PA: float = 610.0        # 6.1 mbar
SOLAR_IRRADIANCE_PEAK_WM2: float = 590.0      # 43% of Earth
AVERAGE_SURFACE_TEMP_C: float = -63.0
MARTIAN_YEAR_SOLS: int = 687
BASE_SOLAR_HOURS: float = 12.0                 # SIM
SEASONAL_AMPLITUDE_HOURS: float = 3.0          # SIM: ±3h over Martian year
SEASONAL_TEMP_AMPLITUDE_C: float = 20.0        # SIM: ±20°C over Martian year
OPTIMAL_CO2_PPM: float = 1000.0               # KB: 800-1200 optimal

# Greenhouse targets (derived from KB crop requirements)
DEFAULT_INTERNAL_TEMP_C: float = 22.0          # SIM
DEFAULT_CO2_LEVEL_PPM: float = 1000.0          # KB

# Energy budget (SIM)
HEATING_COST_FACTOR: float = 0.5               # energy units per °C difference
SOLAR_PANEL_EFFICIENCY: float = 4.5            # energy units per solar hour (SIM)
# Calibrated so equinox (12h) has small surplus, winter (9h) has deficit:
#   Equinox: 12*4.5=54 gen vs ~51.5 need → surplus 2.5
#   Winter:  9*4.5=40.5 gen vs ~61.5 need → deficit 21
#   Summer: 15*4.5=67.5 gen vs ~41.5 need → surplus 26
LIGHTING_COST_PER_ZONE: float = 2.0            # energy units per lit zone (SIM)
PUMP_COST: float = 1.0                         # energy units baseline (SIM)


# ---------------------------------------------------------------------------
# Crew constants (KB)
# ---------------------------------------------------------------------------
CREW_SIZE: int = 4
CALORIES_PER_PERSON_PER_DAY: int = 3000       # KB: planning average
PROTEIN_PER_PERSON_PER_DAY_G: int = 100        # KB: 1.2-1.8 g/kg at ~75kg avg
WATER_PER_PERSON_PER_DAY_L: float = 2.5        # KB: 2.1-2.5

TOTAL_DAILY_CALORIES: int = CREW_SIZE * CALORIES_PER_PERSON_PER_DAY    # 12,000
TOTAL_DAILY_PROTEIN_G: int = CREW_SIZE * PROTEIN_PER_PERSON_PER_DAY_G  # 400


# ---------------------------------------------------------------------------
# Stored food (SIM, grounded in KB mission calories)
# ---------------------------------------------------------------------------
STORED_FOOD_TOTAL_KCAL: float = 5_400_000.0    # 450 × 12,000 (KB)


# ---------------------------------------------------------------------------
# Resource pool starting values (SIM)
# ---------------------------------------------------------------------------
STARTING_WATER_L: float = 10_000.0
STARTING_NUTRIENTS: float = 5_000.0

# Recycling rates
WATER_RECYCLING_RATE: float = 0.90             # KB: 85-95%, we use 90%
NUTRIENT_RECYCLING_RATE: float = 0.70          # SIM estimate

# Degraded recycling (during water recycling event)
DEGRADED_WATER_RECYCLING_MIN: float = 0.70     # KB scenario 6.3
DEGRADED_WATER_RECYCLING_MAX: float = 0.80

# Nutrient consumption and critical threshold
NUTRIENT_CONSUMPTION_PER_CROP_PER_SOL: float = 0.5  # SIM: calibrated so 5000 lasts 450 days
NUTRIENT_CRITICAL_THRESHOLD: float = 500.0     # SIM: below this → nutrient_deficiency stress


# ---------------------------------------------------------------------------
# Greenhouse sizing (SIM + NASA)
# ---------------------------------------------------------------------------
GREENHOUSE_TOTAL_AREA_M2: float = 60.0         # 4 zones × 15 m²
NUM_ZONES: int = 4
ZONE_AREA_M2: float = 15.0                     # per zone


# ---------------------------------------------------------------------------
# Crop configuration (KB unless noted)
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class CropConfig:
    """Immutable configuration for a crop type."""

    name: str
    growth_cycle_days: int           # midpoint of KB range
    water_per_sol_l: float           # SIM estimate (KB gives qualitative only)
    light_need_hours: float          # SIM estimate
    optimal_temp_min_c: float        # KB
    optimal_temp_max_c: float        # KB
    heat_stress_threshold_c: float   # KB
    yield_per_m2_kg: float           # midpoint of KB range
    kcal_per_100g: float             # KB
    protein_per_100g: float          # KB
    footprint_m2: float              # SIM
    micronutrients: tuple[str, ...]  # KB


CROPS: dict[str, CropConfig] = {
    "lettuce": CropConfig(
        name="lettuce",
        growth_cycle_days=37,        # KB: 30-45, midpoint ~37
        water_per_sol_l=2.0,
        light_need_hours=10.0,
        optimal_temp_min_c=15.0,
        optimal_temp_max_c=22.0,
        heat_stress_threshold_c=25.0,
        yield_per_m2_kg=4.0,         # KB: 3-5
        kcal_per_100g=15.0,
        protein_per_100g=1.4,
        footprint_m2=0.5,
        micronutrients=("vitamin_a", "vitamin_k", "folate"),
    ),
    "potato": CropConfig(
        name="potato",
        growth_cycle_days=90,        # KB: 70-120, midpoint ~90
        water_per_sol_l=4.0,
        light_need_hours=8.0,
        optimal_temp_min_c=16.0,
        optimal_temp_max_c=20.0,
        heat_stress_threshold_c=26.0,  # KB: 25-28, midpoint ~26
        yield_per_m2_kg=6.0,         # KB: 4-8
        kcal_per_100g=77.0,
        protein_per_100g=2.0,
        footprint_m2=2.0,
        micronutrients=("vitamin_c", "potassium"),
    ),
    "radish": CropConfig(
        name="radish",
        growth_cycle_days=25,        # KB: 21-30, midpoint ~25
        water_per_sol_l=1.5,
        light_need_hours=8.0,
        optimal_temp_min_c=15.0,
        optimal_temp_max_c=22.0,
        heat_stress_threshold_c=26.0,
        yield_per_m2_kg=3.0,         # KB: 2-4
        kcal_per_100g=16.0,
        protein_per_100g=0.7,
        footprint_m2=0.5,
        micronutrients=("vitamin_c",),
    ),
    "beans_peas": CropConfig(
        name="beans_peas",
        growth_cycle_days=60,        # KB: 50-70, midpoint ~60
        water_per_sol_l=3.0,
        light_need_hours=10.0,
        optimal_temp_min_c=18.0,
        optimal_temp_max_c=25.0,
        heat_stress_threshold_c=30.0,
        yield_per_m2_kg=3.0,         # KB: 2-4
        kcal_per_100g=100.0,         # KB: 80-120, midpoint 100
        protein_per_100g=7.0,        # KB: 5-9, midpoint 7
        footprint_m2=1.5,
        micronutrients=("iron", "folate", "potassium", "magnesium"),
    ),
    "herbs": CropConfig(
        name="herbs",
        growth_cycle_days=30,        # SIM estimate (KB: "short")
        water_per_sol_l=1.0,
        light_need_hours=8.0,
        optimal_temp_min_c=18.0,
        optimal_temp_max_c=24.0,
        heat_stress_threshold_c=28.0,  # SIM estimate
        yield_per_m2_kg=1.5,         # SIM: KB says "low"
        kcal_per_100g=15.0,          # SIM estimate
        protein_per_100g=1.0,        # SIM estimate
        footprint_m2=0.3,
        micronutrients=("vitamin_a", "vitamin_c", "vitamin_k"),
    ),
}

CROP_FOOTPRINT: dict[str, float] = {name: c.footprint_m2 for name, c in CROPS.items()}


# ---------------------------------------------------------------------------
# All 7 critical micronutrients (KB Domain 5)
# ---------------------------------------------------------------------------
ALL_MICRONUTRIENTS: tuple[str, ...] = (
    "vitamin_a",
    "vitamin_c",
    "vitamin_k",
    "folate",
    "iron",
    "potassium",
    "magnesium",
)


# ---------------------------------------------------------------------------
# Stress system (KB Domain 4)
# ---------------------------------------------------------------------------
STRESS_TYPES: tuple[str, ...] = (
    "drought",
    "overwatering",
    "heat",
    "cold",
    "nutrient_deficiency",
    "light_insufficient",
    "co2_imbalance",
)

STRESS_SEVERITY: dict[str, int] = {
    "drought": 5,
    "nutrient_deficiency": 4,
    "heat": 4,
    "cold": 3,
    "overwatering": 3,
    "light_insufficient": 2,
    "co2_imbalance": 2,
}

HEALTH_RECOVERY_PER_SOL: float = 1.0          # when no stress
HEALTH_MIN: float = 0.0
HEALTH_MAX: float = 100.0
GROWTH_MIN: float = 0.0
GROWTH_MAX: float = 100.0

# Stress detection thresholds (SIM)
DROUGHT_WATER_FACTOR_THRESHOLD: float = 0.5
OVERWATERING_WATER_FACTOR_THRESHOLD: float = 1.3
LIGHT_INSUFFICIENT_FACTOR_THRESHOLD: float = 0.4

# Temperature curve falloff distance (SIM)
TEMP_CURVE_FALLOFF_DISTANCE: float = 15.0


# ---------------------------------------------------------------------------
# Harvest conditions (SIM)
# ---------------------------------------------------------------------------
HARVEST_GROWTH_THRESHOLD: float = 95.0
HARVEST_HEALTH_THRESHOLD: float = 20.0


# ---------------------------------------------------------------------------
# Random events (KB-backed)
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class EventConfig:
    """Immutable configuration for a random event type."""

    name: str
    probability_per_sol: float
    duration_min_sols: int
    duration_max_sols: int
    description: str


EVENTS: dict[str, EventConfig] = {
    "water_recycling_degradation": EventConfig(
        name="water_recycling_degradation",
        probability_per_sol=0.01,    # 1%/sol
        duration_min_sols=5,
        duration_max_sols=15,
        description="Water recycling efficiency drops to 70-80%",
    ),
    "temperature_control_failure": EventConfig(
        name="temperature_control_failure",
        probability_per_sol=0.01,    # 1%/sol
        duration_min_sols=1,
        duration_max_sols=3,
        description="Internal temperature drifts ±5°C from target",
    ),
}

TEMP_FAILURE_DRIFT_C: float = 5.0              # KB scenario 6.6


# ---------------------------------------------------------------------------
# Energy deficit effect (SIM)
# ---------------------------------------------------------------------------
MAX_LIGHT_PENALTY_FROM_DEFICIT: float = 0.5    # up to 50% light reduction


# ---------------------------------------------------------------------------
# Early stop thresholds (SIM — triggers return control to orchestrator)
# ---------------------------------------------------------------------------
EARLY_STOP_CROP_HEALTH_THRESHOLD: float = 30.0   # any crop below this
EARLY_STOP_WATER_THRESHOLD_L: float = 1_500.0     # 15% of starting 10,000
EARLY_STOP_ENERGY_DEFICIT_STREAK: int = 3          # consecutive days


# ---------------------------------------------------------------------------
# Simulation loop
# ---------------------------------------------------------------------------
MISSION_DURATION_SOLS: int = 450

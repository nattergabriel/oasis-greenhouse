"""Shared test fixtures for the simulation engine."""

from __future__ import annotations

import random

import pytest

from src import config
from src.models import (
    ActiveEvent,
    Crop,
    DailyNutrition,
    Environment,
    FoodItem,
    FoodSupply,
    GreenhouseState,
    Metrics,
    ResourcePool,
    StoredFood,
    Zone,
)


@pytest.fixture
def default_rng() -> random.Random:
    """Deterministic RNG with fixed seed."""
    return random.Random(42)


@pytest.fixture
def default_environment() -> Environment:
    """Environment at optimal conditions (day ~0)."""
    return Environment(
        solar_hours=12.0,
        outside_temp=-63.0,
        internal_temp=22.0,
        target_temp=22.0,
        co2_level=1000.0,
        co2_event_active=False,
        energy_generated=42.0,
        energy_needed=38.0,
        energy_deficit=0.0,
        light_penalty=0.0,
    )


@pytest.fixture
def optimal_potato_environment() -> Environment:
    """Environment optimal for potatoes (16-20°C)."""
    return Environment(
        solar_hours=12.0,
        outside_temp=-63.0,
        internal_temp=18.0,
        target_temp=18.0,
        co2_level=1000.0,
    )


@pytest.fixture
def default_resources() -> ResourcePool:
    """Fresh resource pool at starting values."""
    return ResourcePool()


@pytest.fixture
def default_zone() -> Zone:
    """Empty zone with default 15 m² area."""
    return Zone(id=1, area_m2=config.ZONE_AREA_M2, crops=[])


@pytest.fixture
def default_zones() -> list[Zone]:
    """4 empty zones."""
    return [Zone(id=i, area_m2=config.ZONE_AREA_M2, crops=[]) for i in range(1, 5)]


@pytest.fixture
def default_stored_food() -> StoredFood:
    """Full stored food reserve."""
    return StoredFood()


@pytest.fixture
def empty_food_supply() -> FoodSupply:
    """Empty greenhouse food supply."""
    return FoodSupply()


@pytest.fixture
def sample_crop() -> Crop:
    """A fresh potato crop in zone 1."""
    return Crop(
        id="crop_1_1",
        type="potato",
        zone_id=1,
        footprint_m2=config.CROPS["potato"].footprint_m2,
        planted_day=0,
        age=0,
        health=100.0,
        growth=0.0,
        active_stress=None,
        growth_cycle_days=config.CROPS["potato"].growth_cycle_days,
    )


@pytest.fixture
def default_state(default_zones: list[Zone]) -> GreenhouseState:
    """Initial simulation state with 4 empty zones."""
    return GreenhouseState(
        day=0,
        environment=Environment(),
        zones=default_zones,
        resources=ResourcePool(),
        food_supply=FoodSupply(),
        stored_food=StoredFood(),
        active_events=[],
        daily_nutrition=DailyNutrition(),
        metrics=Metrics(),
        next_crop_id=1,
        seed=42,
    )


@pytest.fixture
def populated_state() -> GreenhouseState:
    """State with crops, food, events — for serialization roundtrip tests."""
    potato = Crop(
        id="crop_1_1",
        type="potato",
        zone_id=1,
        footprint_m2=2.0,
        planted_day=10,
        age=45,
        health=87.0,
        growth=50.0,
        active_stress=None,
        growth_cycle_days=90,
    )
    lettuce = Crop(
        id="crop_2_1",
        type="lettuce",
        zone_id=2,
        footprint_m2=0.5,
        planted_day=20,
        age=15,
        health=92.0,
        growth=40.5,
        active_stress="heat",
        growth_cycle_days=37,
    )
    zone1 = Zone(id=1, area_m2=15.0, crops=[potato], artificial_light=True,
                 water_allocation=1.0, crop_plan={"potato": 0.6, "beans_peas": 0.4})
    zone2 = Zone(id=2, area_m2=15.0, crops=[lettuce], artificial_light=False,
                 water_allocation=0.8, crop_plan={"lettuce": 1.0})
    zone3 = Zone(id=3, area_m2=15.0, crops=[], crop_plan={})
    zone4 = Zone(id=4, area_m2=15.0, crops=[], crop_plan={})

    food_supply = FoodSupply(items={
        "potato": FoodItem(kg=12.0, kcal=9240.0, protein_g=240.0),
        "lettuce": FoodItem(kg=4.5, kcal=675.0, protein_g=63.0),
    })

    event = ActiveEvent(
        type="water_recycling_degradation",
        started_day=50,
        duration_sols=10,
        remaining_sols=5,
        degraded_recycling=0.75,
    )

    return GreenhouseState(
        day=55,
        environment=Environment(
            solar_hours=13.2,
            outside_temp=-52.0,
            internal_temp=22.0,
            target_temp=22.0,
            co2_level=1000.0,
            energy_generated=45.0,
            energy_needed=38.0,
            energy_deficit=0.0,
        ),
        zones=[zone1, zone2, zone3, zone4],
        resources=ResourcePool(water=8423.0, nutrients=3891.0, water_availability=0.95),
        food_supply=food_supply,
        stored_food=StoredFood(remaining_calories=4_800_000.0),
        active_events=[event],
        daily_nutrition=DailyNutrition(
            calorie_gh_fraction=0.21,
            protein_gh_fraction=0.15,
            micronutrients_covered=["vitamin_a", "vitamin_c", "vitamin_k", "folate", "potassium"],
            micronutrient_count=5,
            gh_kcal=2520.0,
            gh_protein_g=60.0,
            stored_kcal_consumed=9480.0,
        ),
        metrics=Metrics(
            avg_calorie_gh_fraction=0.19,
            avg_protein_gh_fraction=0.14,
            avg_micronutrient_coverage=4.8,
            total_harvested_kg=285.0,
            crops_lost=4,
            days_simulated=55,
        ),
        next_crop_id=15,
        seed=42,
    )

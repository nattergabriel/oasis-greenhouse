"""Resource consumption and recycling: water, nutrients, energy.

Water and nutrients are consumed by crops and crew each tick,
then partially recovered through recycling. Values are clamped to ≥ 0.
"""

from __future__ import annotations

from . import config
from .models import Crop, ResourcePool


def consume_resources(
    resources: ResourcePool,
    crops: list[Crop],
    crew_size: int = config.CREW_SIZE,
) -> None:
    """Consume water and nutrients for this sol.

    Water: sum of each crop's water need + crew drinking water.
    Nutrients: sum of each crop's nutrient need (1 unit per crop per sol, simplified).

    Args:
        resources: Resource pool to mutate.
        crops: All active crops consuming resources.
        crew_size: Number of crew members.
    """
    # Water consumption
    crop_water = sum(
        config.CROPS[c.type].water_per_sol_l
        for c in crops
        if c.type in config.CROPS
    )
    crew_water = crew_size * config.WATER_PER_PERSON_PER_DAY_L
    total_water = crop_water + crew_water
    resources.water = max(0.0, resources.water - total_water)

    # Nutrient consumption: configurable rate per crop per sol
    nutrient_consumption = len(crops) * config.NUTRIENT_CONSUMPTION_PER_CROP_PER_SOL
    resources.nutrients = max(0.0, resources.nutrients - nutrient_consumption)


def recycle_resources(
    resources: ResourcePool,
    crops: list[Crop],
    crew_size: int = config.CREW_SIZE,
) -> None:
    """Recycle water and nutrients after consumption.

    Water recovery uses the current recycling rate (may be degraded by events).
    Nutrient recovery uses a fixed rate.

    Must be called AFTER consume_resources in the same tick.

    Args:
        resources: Resource pool to mutate.
        crops: All active crops (used to compute what was consumed).
        crew_size: Number of crew members.
    """
    # Recalculate what was consumed this tick (same formula as consume)
    crop_water = sum(
        config.CROPS[c.type].water_per_sol_l
        for c in crops
        if c.type in config.CROPS
    )
    crew_water = crew_size * config.WATER_PER_PERSON_PER_DAY_L
    total_water_consumed = crop_water + crew_water

    nutrient_consumed = len(crops) * config.NUTRIENT_CONSUMPTION_PER_CROP_PER_SOL

    # Recycle
    resources.water += total_water_consumed * resources.water_recycling_rate
    resources.nutrients += nutrient_consumed * config.NUTRIENT_RECYCLING_RATE

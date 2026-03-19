"""Zone management: crop plans, two-pass fill, auto-replant.

Zone plans are percentage allocations ({crop_type: fraction}).
Crops have fixed footprints — you can't plant half a potato.
Two-pass fill algorithm from IMPLEMENTATION-NOTES.md minimizes wasted space.
"""

from __future__ import annotations

import random as random_module
import logging

from . import config
from .models import Crop, Zone

logger = logging.getLogger(__name__)


def _next_crop_id(zone_id: int, counter: int) -> str:
    """Generate a unique crop ID."""
    return f"crop_{zone_id}_{counter}"


def create_crop(
    crop_type: str,
    zone_id: int,
    day: int,
    crop_id: str,
) -> Crop | None:
    """Create a new crop instance from config.

    Args:
        crop_type: Must be a key in config.CROPS.
        zone_id: Which zone this crop belongs to.
        day: Current mission day (planted_day).
        crop_id: Unique ID for this crop.

    Returns:
        New Crop instance, or None if crop_type is unknown.
    """
    crop_cfg = config.CROPS.get(crop_type)
    if crop_cfg is None:
        logger.warning("Unknown crop type '%s', skipping", crop_type)
        return None

    return Crop(
        id=crop_id,
        type=crop_type,
        zone_id=zone_id,
        footprint_m2=crop_cfg.footprint_m2,
        planted_day=day,
        age=0,
        health=100.0,
        growth=0.0,
        active_stress=None,
        growth_cycle_days=crop_cfg.growth_cycle_days,
    )


def normalize_plan(plan: dict[str, float]) -> dict[str, float]:
    """Normalize a zone plan so fractions sum to 1.0.

    Filters out unknown crop types and warns. If all types are unknown
    or all fractions are zero, returns empty dict.

    Args:
        plan: Raw crop plan {crop_type: fraction}.

    Returns:
        Normalized plan with fractions summing to 1.0, or empty dict.
    """
    valid: dict[str, float] = {}
    for crop_type, fraction in plan.items():
        if crop_type not in config.CROPS:
            logger.warning("Unknown crop type '%s' in zone plan, skipping", crop_type)
            continue
        if fraction <= 0:
            continue
        valid[crop_type] = fraction

    if not valid:
        return {}

    total = sum(valid.values())
    if total <= 0:
        return {}

    return {k: v / total for k, v in valid.items()}


def set_zone_plan(zone: Zone, plan: dict[str, float]) -> None:
    """Set a zone's crop plan. Normalizes fractions.

    Existing crops keep growing — the plan only affects new plantings
    (initial fill and auto-replant).

    Args:
        zone: Zone to update.
        plan: Crop allocation {crop_type: fraction}.
    """
    zone.crop_plan = normalize_plan(plan)


def fill_zone(
    zone: Zone,
    day: int,
    next_crop_id_counter: int,
) -> tuple[list[Crop], int]:
    """Fill empty area in a zone according to its crop plan.

    Two-pass algorithm from IMPLEMENTATION-NOTES.md:
      Pass 1: Fill each type up to its target area (rounds DOWN naturally).
      Pass 2: Fill remaining space with whichever plan crop has the biggest
              deficit from its target percentage (greedy, best-effort).

    Args:
        zone: Zone to fill (crops list mutated in place).
        day: Current mission day (for planted_day).
        next_crop_id_counter: Starting counter for crop IDs.

    Returns:
        Tuple of (list of newly planted crops, updated counter).
    """
    if not zone.crop_plan:
        return [], next_crop_id_counter

    new_crops: list[Crop] = []
    counter = next_crop_id_counter

    # Pass 1: fill each type up to its target area
    for crop_type, fraction in zone.crop_plan.items():
        target_area = zone.area_m2 * fraction
        footprint = config.CROP_FOOTPRINT.get(crop_type)
        if footprint is None:
            continue

        current_area = sum(c.footprint_m2 for c in zone.crops if c.type == crop_type)

        while (
            current_area + footprint <= target_area
            and zone.available_area() >= footprint
        ):
            crop_id = _next_crop_id(zone.id, counter)
            counter += 1
            crop = create_crop(crop_type, zone.id, day, crop_id)
            if crop is None:
                break
            zone.crops.append(crop)
            new_crops.append(crop)
            current_area += footprint

    # Pass 2: fill remaining space with the type that has the biggest deficit
    while zone.available_area() > 0:
        best_type: str | None = None
        best_deficit: float = -1.0

        for crop_type, fraction in zone.crop_plan.items():
            footprint = config.CROP_FOOTPRINT.get(crop_type)
            if footprint is None or footprint > zone.available_area():
                continue

            actual_fraction = (
                sum(c.footprint_m2 for c in zone.crops if c.type == crop_type)
                / zone.area_m2
            )
            deficit = fraction - actual_fraction
            if deficit > best_deficit:
                best_deficit = deficit
                best_type = crop_type

        if best_type is None:
            break  # nothing fits in remaining space

        crop_id = _next_crop_id(zone.id, counter)
        counter += 1
        crop = create_crop(best_type, zone.id, day, crop_id)
        if crop is None:
            break
        zone.crops.append(crop)
        new_crops.append(crop)

    return new_crops, counter


def auto_replant(
    zone: Zone,
    harvested_type: str,
    day: int,
    next_crop_id_counter: int,
) -> tuple[Crop | None, int]:
    """Auto-replant after harvest: same crop type in the same spot.

    Per IMPLEMENTATION-NOTES.md: auto-replant uses the same type that was
    harvested (it fits since it has the same footprint). If the zone plan
    has changed, future harvests will naturally transition the zone toward
    the new plan as auto-replant picks the plan's types for new plantings.

    However, if the harvested type is no longer in the zone plan, replant
    with the plan type that has the biggest deficit instead.

    Args:
        zone: Zone where replanting happens.
        harvested_type: Crop type that was just harvested.
        day: Current mission day.
        next_crop_id_counter: Counter for crop IDs.

    Returns:
        Tuple of (new Crop or None, updated counter).
    """
    if not zone.crop_plan:
        return None, next_crop_id_counter

    # If harvested type is still in the plan, replant same type
    if harvested_type in zone.crop_plan:
        replant_type = harvested_type
    else:
        # Pick the plan type with the biggest deficit that fits
        best_type: str | None = None
        best_deficit: float = -1.0
        for crop_type, fraction in zone.crop_plan.items():
            footprint = config.CROP_FOOTPRINT.get(crop_type)
            if footprint is None or footprint > zone.available_area():
                continue
            actual_fraction = (
                sum(c.footprint_m2 for c in zone.crops if c.type == crop_type)
                / zone.area_m2
            )
            deficit = fraction - actual_fraction
            if deficit > best_deficit:
                best_deficit = deficit
                best_type = crop_type
        if best_type is None:
            return None, next_crop_id_counter
        replant_type = best_type

    footprint = config.CROP_FOOTPRINT.get(replant_type)
    if footprint is None or footprint > zone.available_area():
        return None, next_crop_id_counter

    crop_id = _next_crop_id(zone.id, next_crop_id_counter)
    counter = next_crop_id_counter + 1
    crop = create_crop(replant_type, zone.id, day, crop_id)
    if crop is None:
        return None, next_crop_id_counter

    zone.crops.append(crop)
    return crop, counter

"""Slot management: crop assignment, fill, auto-replant.

Each slot holds one crop type. The engine fills slots to capacity
and auto-replants after harvest.
"""

from __future__ import annotations

import logging

from . import config
from .models import Crop, Slot

logger = logging.getLogger(__name__)


def create_crop(
    crop_type: str,
    slot_id: int,
    day: int,
    crop_id: str,
) -> Crop | None:
    """Create a new crop instance from config.

    Args:
        crop_type: Must be a key in config.CROPS.
        slot_id: Which slot this crop belongs to.
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
        slot_id=slot_id,
        footprint_m2=crop_cfg.footprint_m2,
        planted_day=day,
        age=0,
        health=100.0,
        growth=0.0,
        active_stress=None,
        growth_cycle_days=crop_cfg.growth_cycle_days,
    )


def fill_slot(
    slot: Slot,
    day: int,
    next_crop_id_counter: int,
) -> tuple[list[Crop], int]:
    """Fill empty area in a slot with its assigned crop type.

    Plants as many crops as will fit in the available area.

    Args:
        slot: Slot to fill (crops list mutated in place).
        day: Current mission day (for planted_day).
        next_crop_id_counter: Starting counter for crop IDs.

    Returns:
        Tuple of (list of newly planted crops, updated counter).
    """
    if not slot.crop_type:
        return [], next_crop_id_counter

    footprint = config.CROP_FOOTPRINT.get(slot.crop_type)
    if not footprint or footprint <= 0:
        return [], next_crop_id_counter

    new_crops: list[Crop] = []
    counter = next_crop_id_counter

    while slot.available_area() >= footprint:
        crop_id = f"crop_{slot.id}_{counter}"
        counter += 1
        crop = create_crop(slot.crop_type, slot.id, day, crop_id)
        if crop is None:
            break
        slot.crops.append(crop)
        new_crops.append(crop)

    return new_crops, counter


def auto_replant(
    slot: Slot,
    harvested_type: str,
    day: int,
    next_crop_id_counter: int,
) -> tuple[Crop | None, int]:
    """Auto-replant after harvest: same crop type if slot still assigned.

    Args:
        slot: Slot where replanting happens.
        harvested_type: Crop type that was just harvested.
        day: Current mission day.
        next_crop_id_counter: Counter for crop IDs.

    Returns:
        Tuple of (new Crop or None, updated counter).
    """
    replant_type = slot.crop_type
    if not replant_type:
        return None, next_crop_id_counter

    footprint = config.CROP_FOOTPRINT.get(replant_type)
    if footprint is None or footprint > slot.available_area():
        return None, next_crop_id_counter

    crop_id = f"crop_{slot.id}_{next_crop_id_counter}"
    counter = next_crop_id_counter + 1
    crop = create_crop(replant_type, slot.id, day, crop_id)
    if crop is None:
        return None, next_crop_id_counter

    slot.crops.append(crop)
    return crop, counter

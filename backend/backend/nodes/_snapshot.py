"""Shared snapshot helper used by multiple nodes."""
from ..models.state import (
    GreenhouseState,
    DailySnapshot,
    SlotSnapshot,
    CropSnapshot,
)


def create_snapshot(greenhouse: GreenhouseState) -> DailySnapshot:
    """Create a lightweight daily snapshot from greenhouse state."""
    slot_snapshots = []
    for slot in greenhouse.slots:
        crop_snapshots = [
            CropSnapshot(
                id=crop.id,
                type=crop.type,
                footprint_m2=crop.footprint_m2,
                age=crop.age,
                health=crop.health,
                growth=crop.growth,
                active_stress=crop.active_stress,
            )
            for crop in slot.crops
        ]
        slot_snapshots.append(
            SlotSnapshot(
                id=slot.id,
                row=slot.row,
                col=slot.col,
                area_m2=slot.area_m2,
                used_area_m2=slot.used_area(),
                available_area_m2=slot.available_area(),
                crop_type=slot.crop_type,
                artificial_light=slot.artificial_light,
                water_allocation=slot.water_allocation,
                crops=crop_snapshots,
            )
        )

    return DailySnapshot(
        day=greenhouse.day,
        slots=slot_snapshots,
        environment=greenhouse.environment,
        resources=greenhouse.resources,
        food_supply=greenhouse.food_supply,
        stored_food=greenhouse.stored_food,
        daily_nutrition=greenhouse.daily_nutrition,
        active_events=greenhouse.active_events,
    )

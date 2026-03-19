"""Shared snapshot helper used by multiple nodes."""
from ..models.state import (
    GreenhouseState,
    DailySnapshot,
    ZoneSnapshot,
    CropSnapshot,
)


def create_snapshot(greenhouse: GreenhouseState) -> DailySnapshot:
    """Create a lightweight daily snapshot from greenhouse state."""
    zone_snapshots = []
    for zone in greenhouse.zones:
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
            for crop in zone.crops
        ]
        zone_snapshots.append(
            ZoneSnapshot(
                id=zone.id,
                area_m2=zone.area_m2,
                used_area_m2=zone.used_area(),
                available_area_m2=zone.available_area(),
                artificial_light=zone.artificial_light,
                water_allocation=zone.water_allocation,
                crop_plan=zone.crop_plan,
                crops=crop_snapshots,
            )
        )

    return DailySnapshot(
        mission_day=greenhouse.mission_day,
        zones=zone_snapshots,
        environment=greenhouse.environment,
        resources=greenhouse.resources,
        mars=greenhouse.mars,
        food_supply=greenhouse.food_supply,
        stored_food=greenhouse.stored_food,
        daily_nutrition=greenhouse.daily_nutrition,
        active_events=greenhouse.active_events,
    )

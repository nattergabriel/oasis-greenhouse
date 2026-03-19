"""State dataclasses and Pydantic API models.

State classes are mutable dataclasses (mutated during tick).
API models are Pydantic BaseModel (for request/response validation).
Serialization: state_to_dict() / dict_to_state() for round-trip JSON.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from pydantic import BaseModel, Field

from . import config


# ===========================================================================
# State dataclasses (mutable — mutated during simulation tick)
# ===========================================================================

@dataclass
class Crop:
    """A single crop planting in a slot."""

    id: str
    type: str
    slot_id: int
    footprint_m2: float
    planted_day: int
    age: int = 0
    health: float = 100.0
    growth: float = 0.0
    active_stress: str | None = None
    growth_cycle_days: int = 0

    def __post_init__(self) -> None:
        if self.growth_cycle_days == 0:
            crop_cfg = config.CROPS.get(self.type)
            if crop_cfg:
                self.growth_cycle_days = crop_cfg.growth_cycle_days


@dataclass
class Slot:
    """A 2×2m greenhouse slot in the grid."""

    id: int
    row: int = 0
    col: int = 0
    area_m2: float = config.SLOT_AREA_M2
    crop_type: str | None = None
    crops: list[Crop] = field(default_factory=list)
    artificial_light: bool = True
    water_allocation: float = 1.0

    def used_area(self) -> float:
        """Total area occupied by crops in this slot."""
        return sum(c.footprint_m2 for c in self.crops)

    def available_area(self) -> float:
        """Remaining plantable area in m²."""
        return self.area_m2 - self.used_area()

    def can_plant(self, crop_type: str) -> bool:
        """Check if there's enough area to plant one unit of crop_type."""
        footprint = config.CROP_FOOTPRINT.get(crop_type)
        if footprint is None:
            return False
        return self.available_area() >= footprint


@dataclass
class ResourcePool:
    """Water, nutrients, and energy state."""

    water: float = config.STARTING_WATER_L
    nutrients: float = config.STARTING_NUTRIENTS
    energy_generated: float = 0.0
    energy_needed: float = 0.0
    energy_deficit: float = 0.0
    water_recycling_rate: float = config.WATER_RECYCLING_RATE
    water_availability: float = 1.0  # 0.0-1.0, global factor set by simulation loop


@dataclass
class StoredFood:
    """Pre-packaged food the crew brought from Earth."""

    total_calories: float = config.STORED_FOOD_TOTAL_KCAL
    remaining_calories: float = config.STORED_FOOD_TOTAL_KCAL


@dataclass
class FoodItem:
    """Stockpile entry for a single crop type."""

    kg: float = 0.0
    kcal: float = 0.0
    protein_g: float = 0.0


@dataclass
class FoodSupply:
    """Harvested greenhouse food available for consumption."""

    items: dict[str, FoodItem] = field(default_factory=dict)

    def total_kg(self) -> float:
        """Total food mass in stockpile."""
        return sum(item.kg for item in self.items.values())

    def total_kcal(self) -> float:
        """Total calories in stockpile."""
        return sum(item.kcal for item in self.items.values())

    def total_protein_g(self) -> float:
        """Total protein in stockpile."""
        return sum(item.protein_g for item in self.items.values())


@dataclass
class ActiveEvent:
    """A random event currently affecting the greenhouse."""

    type: str
    started_day: int
    duration_sols: int
    remaining_sols: int
    temp_drift_c: float = 0.0       # for temperature_control_failure
    degraded_recycling: float = 0.0  # for water_recycling_degradation


@dataclass
class Environment:
    """Mars environment state for current tick."""

    solar_hours: float = config.BASE_SOLAR_HOURS
    outside_temp: float = config.AVERAGE_SURFACE_TEMP_C
    internal_temp: float = config.DEFAULT_INTERNAL_TEMP_C
    target_temp: float = config.DEFAULT_INTERNAL_TEMP_C
    co2_level: float = config.DEFAULT_CO2_LEVEL_PPM
    co2_event_active: bool = False
    energy_generated: float = 0.0
    energy_needed: float = 0.0
    energy_deficit: float = 0.0
    light_penalty: float = 0.0       # 0.0-1.0, from energy deficit

    @property
    def effective_solar(self) -> float:
        """Solar hours adjusted for energy-deficit light penalty."""
        return self.solar_hours * (1.0 - self.light_penalty)


@dataclass
class DailyNutrition:
    """Nutrition results for a single day."""

    calorie_gh_fraction: float = 0.0
    protein_gh_fraction: float = 0.0
    micronutrients_covered: list[str] = field(default_factory=list)
    micronutrient_count: int = 0
    gh_kcal: float = 0.0
    gh_protein_g: float = 0.0
    stored_kcal_consumed: float = 0.0


@dataclass
class Metrics:
    """Running simulation metrics."""

    avg_calorie_gh_fraction: float = 0.0
    avg_protein_gh_fraction: float = 0.0
    avg_micronutrient_coverage: float = 0.0
    unique_micronutrients_seen: list[str] = field(default_factory=list)
    total_harvested_kg: float = 0.0
    crops_lost: int = 0
    days_simulated: int = 0

    def update_averages(self, daily: DailyNutrition) -> None:
        """Update running averages with new daily result using incremental formula."""
        n = self.days_simulated  # already incremented before calling
        if n <= 0:
            return
        self.avg_calorie_gh_fraction += (
            daily.calorie_gh_fraction - self.avg_calorie_gh_fraction
        ) / n
        self.avg_protein_gh_fraction += (
            daily.protein_gh_fraction - self.avg_protein_gh_fraction
        ) / n
        self.avg_micronutrient_coverage += (
            daily.micronutrient_count - self.avg_micronutrient_coverage
        ) / n
        # Track unique micronutrients seen across entire mission
        for nutrient in daily.micronutrients_covered:
            if nutrient not in self.unique_micronutrients_seen:
                self.unique_micronutrients_seen.append(nutrient)


@dataclass
class GreenhouseState:
    """Complete simulation state. Serialized between ticks."""

    day: int = 0
    environment: Environment = field(default_factory=Environment)
    slots: list[Slot] = field(default_factory=list)
    resources: ResourcePool = field(default_factory=ResourcePool)
    food_supply: FoodSupply = field(default_factory=FoodSupply)
    stored_food: StoredFood = field(default_factory=StoredFood)
    active_events: list[ActiveEvent] = field(default_factory=list)
    daily_nutrition: DailyNutrition = field(default_factory=DailyNutrition)
    metrics: Metrics = field(default_factory=Metrics)
    next_crop_id: int = 1
    seed: int = 42
    consecutive_energy_deficit_days: int = 0
    rng_state: tuple | None = None  # saved Random.getstate() for determinism across ticks


# ===========================================================================
# Serialization: state ↔ dict
# ===========================================================================

def _crop_to_dict(crop: Crop) -> dict[str, Any]:
    return {
        "id": crop.id,
        "type": crop.type,
        "slot_id": crop.slot_id,
        "footprint_m2": crop.footprint_m2,
        "planted_day": crop.planted_day,
        "age": crop.age,
        "health": crop.health,
        "growth": crop.growth,
        "active_stress": crop.active_stress,
        "growth_cycle_days": crop.growth_cycle_days,
    }


def _dict_to_crop(d: dict[str, Any]) -> Crop:
    return Crop(
        id=d["id"],
        type=d["type"],
        slot_id=d["slot_id"],
        footprint_m2=d["footprint_m2"],
        planted_day=d["planted_day"],
        age=d["age"],
        health=d["health"],
        growth=d["growth"],
        active_stress=d.get("active_stress"),
        growth_cycle_days=d["growth_cycle_days"],
    )


def _slot_to_dict(slot: Slot) -> dict[str, Any]:
    return {
        "id": slot.id,
        "row": slot.row,
        "col": slot.col,
        "area_m2": slot.area_m2,
        "crop_type": slot.crop_type,
        "crops": [_crop_to_dict(c) for c in slot.crops],
        "artificial_light": slot.artificial_light,
        "water_allocation": slot.water_allocation,
    }


def _dict_to_slot(d: dict[str, Any]) -> Slot:
    return Slot(
        id=d["id"],
        row=d.get("row", 0),
        col=d.get("col", 0),
        area_m2=d["area_m2"],
        crop_type=d.get("crop_type"),
        crops=[_dict_to_crop(c) for c in d["crops"]],
        artificial_light=d["artificial_light"],
        water_allocation=d["water_allocation"],
    )


def _resource_pool_to_dict(rp: ResourcePool) -> dict[str, Any]:
    return {
        "water": rp.water,
        "nutrients": rp.nutrients,
        "energy_generated": rp.energy_generated,
        "energy_needed": rp.energy_needed,
        "energy_deficit": rp.energy_deficit,
        "water_recycling_rate": rp.water_recycling_rate,
        "water_availability": rp.water_availability,
    }


def _dict_to_resource_pool(d: dict[str, Any]) -> ResourcePool:
    return ResourcePool(
        water=d["water"],
        nutrients=d["nutrients"],
        energy_generated=d.get("energy_generated", 0.0),
        energy_needed=d.get("energy_needed", 0.0),
        energy_deficit=d.get("energy_deficit", 0.0),
        water_recycling_rate=d.get("water_recycling_rate", config.WATER_RECYCLING_RATE),
        water_availability=d.get("water_availability", 1.0),
    )


def _food_item_to_dict(item: FoodItem) -> dict[str, Any]:
    return {"kg": item.kg, "kcal": item.kcal, "protein_g": item.protein_g}


def _dict_to_food_item(d: dict[str, Any]) -> FoodItem:
    return FoodItem(kg=d["kg"], kcal=d["kcal"], protein_g=d["protein_g"])


def _food_supply_to_dict(fs: FoodSupply) -> dict[str, Any]:
    return {
        "items": {name: _food_item_to_dict(item) for name, item in fs.items.items()},
    }


def _dict_to_food_supply(d: dict[str, Any]) -> FoodSupply:
    return FoodSupply(
        items={name: _dict_to_food_item(item) for name, item in d["items"].items()},
    )


def _stored_food_to_dict(sf: StoredFood) -> dict[str, Any]:
    return {
        "total_calories": sf.total_calories,
        "remaining_calories": sf.remaining_calories,
    }


def _dict_to_stored_food(d: dict[str, Any]) -> StoredFood:
    return StoredFood(
        total_calories=d["total_calories"],
        remaining_calories=d["remaining_calories"],
    )


def _event_to_dict(event: ActiveEvent) -> dict[str, Any]:
    return {
        "type": event.type,
        "started_day": event.started_day,
        "duration_sols": event.duration_sols,
        "remaining_sols": event.remaining_sols,
        "temp_drift_c": event.temp_drift_c,
        "degraded_recycling": event.degraded_recycling,
    }


def _dict_to_event(d: dict[str, Any]) -> ActiveEvent:
    return ActiveEvent(
        type=d["type"],
        started_day=d["started_day"],
        duration_sols=d["duration_sols"],
        remaining_sols=d["remaining_sols"],
        temp_drift_c=d.get("temp_drift_c", 0.0),
        degraded_recycling=d.get("degraded_recycling", 0.0),
    )


def _environment_to_dict(env: Environment) -> dict[str, Any]:
    return {
        "solar_hours": env.solar_hours,
        "outside_temp": env.outside_temp,
        "internal_temp": env.internal_temp,
        "target_temp": env.target_temp,
        "co2_level": env.co2_level,
        "co2_event_active": env.co2_event_active,
        "energy_generated": env.energy_generated,
        "energy_needed": env.energy_needed,
        "energy_deficit": env.energy_deficit,
        "light_penalty": env.light_penalty,
    }


def _dict_to_environment(d: dict[str, Any]) -> Environment:
    return Environment(
        solar_hours=d["solar_hours"],
        outside_temp=d["outside_temp"],
        internal_temp=d["internal_temp"],
        target_temp=d.get("target_temp", config.DEFAULT_INTERNAL_TEMP_C),
        co2_level=d.get("co2_level", config.DEFAULT_CO2_LEVEL_PPM),
        co2_event_active=d.get("co2_event_active", False),
        energy_generated=d.get("energy_generated", 0.0),
        energy_needed=d.get("energy_needed", 0.0),
        energy_deficit=d.get("energy_deficit", 0.0),
        light_penalty=d.get("light_penalty", 0.0),
    )


def _daily_nutrition_to_dict(dn: DailyNutrition) -> dict[str, Any]:
    return {
        "calorie_gh_fraction": dn.calorie_gh_fraction,
        "protein_gh_fraction": dn.protein_gh_fraction,
        "micronutrients_covered": dn.micronutrients_covered,
        "micronutrient_count": dn.micronutrient_count,
        "gh_kcal": dn.gh_kcal,
        "gh_protein_g": dn.gh_protein_g,
        "stored_kcal_consumed": dn.stored_kcal_consumed,
    }


def _dict_to_daily_nutrition(d: dict[str, Any]) -> DailyNutrition:
    return DailyNutrition(
        calorie_gh_fraction=d["calorie_gh_fraction"],
        protein_gh_fraction=d["protein_gh_fraction"],
        micronutrients_covered=d["micronutrients_covered"],
        micronutrient_count=d["micronutrient_count"],
        gh_kcal=d.get("gh_kcal", 0.0),
        gh_protein_g=d.get("gh_protein_g", 0.0),
        stored_kcal_consumed=d.get("stored_kcal_consumed", 0.0),
    )


def _metrics_to_dict(m: Metrics) -> dict[str, Any]:
    return {
        "avg_calorie_gh_fraction": m.avg_calorie_gh_fraction,
        "avg_protein_gh_fraction": m.avg_protein_gh_fraction,
        "avg_micronutrient_coverage": m.avg_micronutrient_coverage,
        "unique_micronutrients_seen": m.unique_micronutrients_seen,
        "total_harvested_kg": m.total_harvested_kg,
        "crops_lost": m.crops_lost,
        "days_simulated": m.days_simulated,
    }


def _dict_to_metrics(d: dict[str, Any]) -> Metrics:
    return Metrics(
        avg_calorie_gh_fraction=d["avg_calorie_gh_fraction"],
        avg_protein_gh_fraction=d["avg_protein_gh_fraction"],
        avg_micronutrient_coverage=d["avg_micronutrient_coverage"],
        unique_micronutrients_seen=d.get("unique_micronutrients_seen", []),
        total_harvested_kg=d["total_harvested_kg"],
        crops_lost=d["crops_lost"],
        days_simulated=d["days_simulated"],
    )


def state_to_dict(state: GreenhouseState) -> dict[str, Any]:
    """Serialize full greenhouse state to a JSON-compatible dict."""
    return {
        "day": state.day,
        "environment": _environment_to_dict(state.environment),
        "slots": [_slot_to_dict(s) for s in state.slots],
        "resources": _resource_pool_to_dict(state.resources),
        "food_supply": _food_supply_to_dict(state.food_supply),
        "stored_food": _stored_food_to_dict(state.stored_food),
        "active_events": [_event_to_dict(e) for e in state.active_events],
        "daily_nutrition": _daily_nutrition_to_dict(state.daily_nutrition),
        "metrics": _metrics_to_dict(state.metrics),
        "next_crop_id": state.next_crop_id,
        "seed": state.seed,
        "consecutive_energy_deficit_days": state.consecutive_energy_deficit_days,
        "rng_state": list(state.rng_state) if state.rng_state else None,
    }


def dict_to_state(d: dict[str, Any]) -> GreenhouseState:
    """Deserialize a dict back into a GreenhouseState."""
    return GreenhouseState(
        day=d["day"],
        environment=_dict_to_environment(d["environment"]),
        slots=[_dict_to_slot(s) for s in d["slots"]],
        resources=_dict_to_resource_pool(d["resources"]),
        food_supply=_dict_to_food_supply(d["food_supply"]),
        stored_food=_dict_to_stored_food(d["stored_food"]),
        active_events=[_dict_to_event(e) for e in d["active_events"]],
        daily_nutrition=_dict_to_daily_nutrition(d["daily_nutrition"]),
        metrics=_dict_to_metrics(d["metrics"]),
        next_crop_id=d["next_crop_id"],
        seed=d["seed"],
        consecutive_energy_deficit_days=d.get("consecutive_energy_deficit_days", 0),
        rng_state=tuple(d["rng_state"]) if d.get("rng_state") else None,
    )


# ===========================================================================
# Pydantic API models (request/response validation)
# ===========================================================================

class InitRequest(BaseModel):
    """Request to create initial simulation state."""

    seed: int = 42
    crop_assignments: dict[int, str] = Field(
        default_factory=dict,
        description="Slot ID → crop_type. Assigns one crop type per slot.",
    )


class TickRequest(BaseModel):
    """Request to advance simulation by N days."""

    state: dict[str, Any]
    days: int = Field(default=1, ge=1, le=450)
    actions: list[dict[str, Any]] = Field(default_factory=list)
    inject_events: list[dict[str, Any]] = Field(default_factory=list)


class InjectEventRequest(BaseModel):
    """Request to inject a crisis event into state."""

    state: dict[str, Any]
    event_type: str
    duration_sols: int | None = None


class SimulationResponse(BaseModel):
    """Response from tick or init endpoint."""

    state: dict[str, Any]
    daily_logs: list[dict[str, Any]] = Field(default_factory=list)
    days_simulated: int = 0
    stopped_early: bool = False
    stop_reason: dict[str, Any] | None = None

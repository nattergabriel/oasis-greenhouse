"""Crop growth, stress detection, health, and harvest logic.

Each tick: grow → detect stress → apply stress → check harvestable.
All formulas from SIMULATION-SPEC.md Component 2.
"""

from __future__ import annotations

from . import config
from .models import Crop, Environment, FoodItem, ResourcePool, Slot


def calculate_growth_efficiency(
    crop: Crop,
    env: Environment,
    resources: ResourcePool,
    slot: Slot,
) -> float:
    """Calculate growth efficiency (0.0-1.0) from water, light, and temperature.

    Args:
        crop: The crop to evaluate.
        env: Current environment state.
        resources: Current resource pool.
        slot: The slot containing this crop.

    Returns:
        Efficiency factor between 0.0 and 1.0.
    """
    crop_cfg = config.CROPS.get(crop.type)
    if crop_cfg is None:
        return 0.0

    # Water factor: global availability × slot allocation
    # resources.water_availability is computed by simulation.py each tick
    # based on total demand vs supply (0.0-1.0)
    water_factor = min(1.0, resources.water_availability * slot.water_allocation)

    # Light factor: effective solar hours vs crop need
    light_need = max(crop_cfg.light_need_hours, 0.001)
    effective_solar = env.effective_solar
    if not slot.artificial_light:
        effective_solar *= 0.5  # no artificial supplement halves effective light
    light_factor = min(1.0, effective_solar / light_need)

    # Temperature factor: curve from spec
    temp_factor = temperature_curve(
        env.internal_temp,
        crop_cfg.optimal_temp_min_c,
        crop_cfg.optimal_temp_max_c,
    )

    return water_factor * light_factor * temp_factor


def temperature_curve(actual: float, optimal_min: float, optimal_max: float) -> float:
    """Temperature efficiency curve from spec.

    Returns 1.0 within optimal range, linearly falling to 0.0 at ±15°C outside.

    Args:
        actual: Current internal temperature in °C.
        optimal_min: Lower bound of optimal range.
        optimal_max: Upper bound of optimal range.

    Returns:
        Temperature factor between 0.0 and 1.0.
    """
    if optimal_min <= actual <= optimal_max:
        return 1.0
    if actual < optimal_min:
        distance = optimal_min - actual
    else:
        distance = actual - optimal_max
    return max(0.0, 1.0 - distance / config.TEMP_CURVE_FALLOFF_DISTANCE)


def grow_crop(
    crop: Crop,
    env: Environment,
    resources: ResourcePool,
    slot: Slot,
) -> None:
    """Advance crop growth for one sol.

    Growth rate = (100 / cycle_days) × efficiency. Clamped to [0, 100].

    Args:
        crop: Crop to grow (mutated in place).
        env: Current environment.
        resources: Current resources.
        slot: Slot containing this crop.
    """
    crop.age += 1

    if crop.growth_cycle_days <= 0:
        return

    efficiency = calculate_growth_efficiency(crop, env, resources, slot)
    daily_growth = (config.GROWTH_MAX / crop.growth_cycle_days) * efficiency
    crop.growth = min(config.GROWTH_MAX, crop.growth + daily_growth)


def detect_stress(
    crop: Crop,
    env: Environment,
    resources: ResourcePool,
    slot: Slot,
) -> str | None:
    """Detect the most severe stress condition affecting a crop.

    Checks conditions in priority order (KB Domain 4: water deficit and
    nutrient deficiency are HIGH risk). Returns the first match.

    Args:
        crop: Crop to evaluate.
        env: Current environment.
        resources: Current resources.
        slot: Slot containing this crop.

    Returns:
        Stress type string, or None if no stress detected.
    """
    crop_cfg = config.CROPS.get(crop.type)
    if crop_cfg is None:
        return None

    # Water factor for this slot: global availability × slot allocation
    water_factor = resources.water_availability * slot.water_allocation

    # Light factor
    light_need = max(crop_cfg.light_need_hours, 0.001)
    effective_solar = env.effective_solar
    if not slot.artificial_light:
        effective_solar *= 0.5
    light_factor = effective_solar / light_need

    temp = env.internal_temp

    # Check in priority order (highest severity first)
    if water_factor < config.DROUGHT_WATER_FACTOR_THRESHOLD:
        return "drought"
    if water_factor > config.OVERWATERING_WATER_FACTOR_THRESHOLD:
        return "overwatering"
    if temp > crop_cfg.heat_stress_threshold_c:
        return "heat"
    if temp < crop_cfg.optimal_temp_min_c:
        return "cold"
    if resources.nutrients <= config.NUTRIENT_CRITICAL_THRESHOLD:
        return "nutrient_deficiency"
    if light_factor < config.LIGHT_INSUFFICIENT_FACTOR_THRESHOLD:
        return "light_insufficient"
    if env.co2_event_active:
        return "co2_imbalance"

    return None


def apply_stress(crop: Crop) -> None:
    """Apply health change based on current stress state.

    No stress → recover +1 health/sol.
    Stressed → lose health by severity value.
    Health clamped to [0, 100].

    Args:
        crop: Crop to update (mutated in place).
    """
    if crop.active_stress is None:
        crop.health = min(
            config.HEALTH_MAX,
            crop.health + config.HEALTH_RECOVERY_PER_SOL,
        )
    else:
        severity = config.STRESS_SEVERITY.get(crop.active_stress, 0)
        crop.health = max(config.HEALTH_MIN, crop.health - severity)


def is_harvestable(crop: Crop) -> bool:
    """Check if a crop is ready for harvest.

    Requires growth ≥ 95% and health > 20.

    Args:
        crop: Crop to check.

    Returns:
        True if crop can be harvested.
    """
    return (
        crop.growth >= config.HARVEST_GROWTH_THRESHOLD
        and crop.health > config.HARVEST_HEALTH_THRESHOLD
    )


def is_dead(crop: Crop) -> bool:
    """Check if a crop has died (health ≤ 0).

    Args:
        crop: Crop to check.

    Returns:
        True if crop is dead and should be removed.
    """
    return crop.health <= config.HEALTH_MIN


def harvest_crop(crop: Crop) -> FoodItem:
    """Harvest a crop and return its food yield.

    Yield formula (from spec):
        yield_kg = yield_per_m2 × footprint_m2 × (health / 100)
        yield_kcal = yield_kg × 10 × kcal_per_100g
        yield_protein_g = yield_kg × 10 × protein_per_100g

    Args:
        crop: Crop to harvest.

    Returns:
        FoodItem with kg, kcal, and protein_g.
    """
    crop_cfg = config.CROPS.get(crop.type)
    if crop_cfg is None:
        return FoodItem()

    yield_kg = crop_cfg.yield_per_m2_kg * crop.footprint_m2 * (crop.health / config.HEALTH_MAX)
    yield_kcal = yield_kg * 10.0 * crop_cfg.kcal_per_100g
    yield_protein_g = yield_kg * 10.0 * crop_cfg.protein_per_100g

    return FoodItem(kg=yield_kg, kcal=yield_kcal, protein_g=yield_protein_g)


def get_micronutrients(crop_type: str) -> list[str]:
    """Get the micronutrients provided by a crop type.

    Args:
        crop_type: Name of the crop type.

    Returns:
        List of micronutrient names, or empty list if unknown type.
    """
    crop_cfg = config.CROPS.get(crop_type)
    if crop_cfg is None:
        return []
    return list(crop_cfg.micronutrients)

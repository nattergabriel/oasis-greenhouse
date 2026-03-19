"""Tests for crop growth, stress detection, health, and harvest."""

from __future__ import annotations

import pytest

from src import config
from src.crops import (
    apply_stress,
    calculate_growth_efficiency,
    detect_stress,
    get_micronutrients,
    grow_crop,
    harvest_crop,
    is_dead,
    is_harvestable,
    temperature_curve,
)
from src.models import Crop, Environment, FoodItem, ResourcePool, Zone


def _make_crop(crop_type: str, **overrides) -> Crop:
    """Helper: create a crop with config defaults and optional overrides."""
    cfg = config.CROPS[crop_type]
    kwargs = dict(
        id=f"test_{crop_type}",
        type=crop_type,
        zone_id=1,
        footprint_m2=cfg.footprint_m2,
        planted_day=0,
        age=0,
        health=100.0,
        growth=0.0,
        active_stress=None,
        growth_cycle_days=cfg.growth_cycle_days,
    )
    kwargs.update(overrides)
    return Crop(**kwargs)


def _optimal_env_for(crop_type: str) -> Environment:
    """Helper: environment at the midpoint of a crop's optimal temp range."""
    cfg = config.CROPS[crop_type]
    mid_temp = (cfg.optimal_temp_min_c + cfg.optimal_temp_max_c) / 2.0
    return Environment(
        solar_hours=12.0,
        internal_temp=mid_temp,
        target_temp=mid_temp,
        light_penalty=0.0,
    )


def _full_resources() -> ResourcePool:
    return ResourcePool(water=10_000.0, nutrients=5_000.0, water_availability=1.0)


def _optimal_zone() -> Zone:
    return Zone(id=1, artificial_light=True, water_allocation=1.0)


# ===================================================================
# Temperature curve
# ===================================================================

class TestTemperatureCurve:
    """temperature_curve() from spec."""

    def test_within_range_returns_one(self) -> None:
        assert temperature_curve(18.0, 15.0, 22.0) == 1.0
        assert temperature_curve(15.0, 15.0, 22.0) == 1.0  # boundary
        assert temperature_curve(22.0, 15.0, 22.0) == 1.0  # boundary

    def test_below_range_linear_falloff(self) -> None:
        # 5°C below optimal_min of 15 → distance=5, factor = 1 - 5/15 = 0.667
        result = temperature_curve(10.0, 15.0, 22.0)
        assert result == pytest.approx(1.0 - 5.0 / 15.0, abs=0.001)

    def test_above_range_linear_falloff(self) -> None:
        # 3°C above optimal_max of 22 → distance=3, factor = 1 - 3/15 = 0.8
        result = temperature_curve(25.0, 15.0, 22.0)
        assert result == pytest.approx(1.0 - 3.0 / 15.0, abs=0.001)

    def test_far_below_clamps_to_zero(self) -> None:
        # 20°C below → distance=20, factor = 1 - 20/15 = -0.333 → clamped to 0
        assert temperature_curve(-5.0, 15.0, 22.0) == 0.0

    def test_far_above_clamps_to_zero(self) -> None:
        assert temperature_curve(40.0, 15.0, 22.0) == 0.0


# ===================================================================
# Growth efficiency
# ===================================================================

class TestGrowthEfficiency:
    """calculate_growth_efficiency() combines water, light, temp factors."""

    def test_optimal_conditions_return_one(self) -> None:
        crop = _make_crop("potato")
        env = _optimal_env_for("potato")
        eff = calculate_growth_efficiency(crop, env, _full_resources(), _optimal_zone())
        assert eff == pytest.approx(1.0, abs=0.01)

    def test_no_water_returns_zero(self) -> None:
        crop = _make_crop("potato")
        env = _optimal_env_for("potato")
        resources = ResourcePool(water=0.0, nutrients=5_000.0, water_availability=0.0)
        eff = calculate_growth_efficiency(crop, env, resources, _optimal_zone())
        assert eff == 0.0

    def test_low_light_reduces_efficiency(self) -> None:
        crop = _make_crop("lettuce")  # needs 10h
        env = Environment(solar_hours=5.0, internal_temp=18.0, light_penalty=0.0)
        eff = calculate_growth_efficiency(crop, env, _full_resources(), _optimal_zone())
        # light_factor = 5/10 = 0.5; water=1.0, temp≈1.0 → eff≈0.5
        assert eff == pytest.approx(0.5, abs=0.05)

    def test_no_artificial_light_halves_solar(self) -> None:
        crop = _make_crop("lettuce")
        env = Environment(solar_hours=12.0, internal_temp=18.0, light_penalty=0.0)
        zone_lit = Zone(id=1, artificial_light=True, water_allocation=1.0)
        zone_dark = Zone(id=1, artificial_light=False, water_allocation=1.0)
        eff_lit = calculate_growth_efficiency(crop, env, _full_resources(), zone_lit)
        eff_dark = calculate_growth_efficiency(crop, env, _full_resources(), zone_dark)
        assert eff_dark < eff_lit

    def test_heat_stress_reduces_efficiency(self) -> None:
        crop = _make_crop("lettuce")
        env_ok = Environment(solar_hours=12.0, internal_temp=20.0, light_penalty=0.0)
        env_hot = Environment(solar_hours=12.0, internal_temp=28.0, light_penalty=0.0)
        eff_ok = calculate_growth_efficiency(crop, env_ok, _full_resources(), _optimal_zone())
        eff_hot = calculate_growth_efficiency(crop, env_hot, _full_resources(), _optimal_zone())
        assert eff_hot < eff_ok

    def test_unknown_crop_type_returns_zero(self) -> None:
        crop = Crop(id="x", type="alien", zone_id=1, footprint_m2=1.0, planted_day=0)
        eff = calculate_growth_efficiency(crop, Environment(), _full_resources(), _optimal_zone())
        assert eff == 0.0


# ===================================================================
# Growth over time
# ===================================================================

class TestGrowth:
    """Crop growth over multiple ticks."""

    def test_potato_reaches_harvest_in_cycle(self) -> None:
        """Potato at optimal conditions should reach 95% growth within 90 days."""
        crop = _make_crop("potato")
        env = _optimal_env_for("potato")
        for _ in range(90):
            grow_crop(crop, env, _full_resources(), _optimal_zone())
        assert crop.growth >= 95.0, f"Potato at {crop.growth}% after 90 days"

    def test_lettuce_reaches_harvest_in_cycle(self) -> None:
        crop = _make_crop("lettuce")
        env = _optimal_env_for("lettuce")
        for _ in range(37):
            grow_crop(crop, env, _full_resources(), _optimal_zone())
        assert crop.growth >= 95.0, f"Lettuce at {crop.growth}% after 37 days"

    def test_radish_reaches_harvest_in_cycle(self) -> None:
        crop = _make_crop("radish")
        env = _optimal_env_for("radish")
        for _ in range(25):
            grow_crop(crop, env, _full_resources(), _optimal_zone())
        assert crop.growth >= 95.0, f"Radish at {crop.growth}% after 25 days"

    def test_beans_reach_harvest_in_cycle(self) -> None:
        crop = _make_crop("beans_peas")
        env = _optimal_env_for("beans_peas")
        for _ in range(60):
            grow_crop(crop, env, _full_resources(), _optimal_zone())
        assert crop.growth >= 95.0, f"Beans at {crop.growth}% after 60 days"

    def test_herbs_reach_harvest_in_cycle(self) -> None:
        crop = _make_crop("herbs")
        env = _optimal_env_for("herbs")
        for _ in range(30):
            grow_crop(crop, env, _full_resources(), _optimal_zone())
        assert crop.growth >= 95.0, f"Herbs at {crop.growth}% after 30 days"

    def test_growth_capped_at_100(self) -> None:
        crop = _make_crop("radish")
        env = _optimal_env_for("radish")
        for _ in range(100):  # way beyond cycle
            grow_crop(crop, env, _full_resources(), _optimal_zone())
        assert crop.growth == 100.0

    def test_zero_water_no_growth(self) -> None:
        crop = _make_crop("potato")
        env = _optimal_env_for("potato")
        resources = ResourcePool(water=0.0, nutrients=5_000.0, water_availability=0.0)
        grow_crop(crop, env, resources, _optimal_zone())
        assert crop.growth == 0.0
        assert crop.age == 1

    def test_half_efficiency_roughly_half_growth(self) -> None:
        """50% light → ~50% growth rate."""
        crop_full = _make_crop("lettuce", id="full")
        crop_half = _make_crop("lettuce", id="half")
        env_full = Environment(solar_hours=12.0, internal_temp=18.0, light_penalty=0.0)
        env_half = Environment(solar_hours=5.0, internal_temp=18.0, light_penalty=0.0)
        for _ in range(20):
            grow_crop(crop_full, env_full, _full_resources(), _optimal_zone())
            grow_crop(crop_half, env_half, _full_resources(), _optimal_zone())
        ratio = crop_half.growth / max(crop_full.growth, 0.001)
        assert 0.4 <= ratio <= 0.6, f"Half light ratio: {ratio}"

    def test_lettuce_faster_than_potato(self) -> None:
        """Lettuce should grow faster than potato (shorter cycle)."""
        lettuce = _make_crop("lettuce", id="l")
        potato = _make_crop("potato", id="p")
        env = Environment(solar_hours=12.0, internal_temp=18.0, light_penalty=0.0)
        for _ in range(30):
            grow_crop(lettuce, env, _full_resources(), _optimal_zone())
            grow_crop(potato, env, _full_resources(), _optimal_zone())
        assert lettuce.growth > potato.growth


# ===================================================================
# Stress detection
# ===================================================================

class TestStressDetection:
    """detect_stress() returns the right stress type for each condition."""

    def test_no_stress_at_optimal(self) -> None:
        crop = _make_crop("potato")
        env = _optimal_env_for("potato")
        stress = detect_stress(crop, env, _full_resources(), _optimal_zone())
        assert stress is None

    def test_drought_when_water_factor_low(self) -> None:
        crop = _make_crop("potato")
        env = _optimal_env_for("potato")
        zone = Zone(id=1, water_allocation=0.3)  # below 0.5 threshold
        stress = detect_stress(crop, env, _full_resources(), zone)
        assert stress == "drought"

    def test_overwatering_when_water_factor_high(self) -> None:
        crop = _make_crop("potato")
        env = _optimal_env_for("potato")
        zone = Zone(id=1, water_allocation=1.4)  # above 1.3 threshold
        stress = detect_stress(crop, env, _full_resources(), zone)
        assert stress == "overwatering"

    def test_heat_stress_above_threshold(self) -> None:
        crop = _make_crop("lettuce")
        env = Environment(solar_hours=12.0, internal_temp=27.0)  # > 25°C
        stress = detect_stress(crop, env, _full_resources(), _optimal_zone())
        assert stress == "heat"

    def test_cold_stress_below_optimal(self) -> None:
        crop = _make_crop("beans_peas")
        env = Environment(solar_hours=12.0, internal_temp=10.0)  # < 18°C
        stress = detect_stress(crop, env, _full_resources(), _optimal_zone())
        assert stress == "cold"

    def test_nutrient_deficiency_when_low(self) -> None:
        crop = _make_crop("potato")
        env = _optimal_env_for("potato")
        resources = ResourcePool(water=10_000.0, nutrients=100.0, water_availability=1.0)
        stress = detect_stress(crop, env, resources, _optimal_zone())
        assert stress == "nutrient_deficiency"

    def test_light_insufficient_when_dark(self) -> None:
        crop = _make_crop("lettuce")  # needs 10h light
        # Very low solar + no artificial light → light_factor < 0.4
        env = Environment(solar_hours=3.0, internal_temp=18.0, light_penalty=0.0)
        zone = Zone(id=1, artificial_light=False, water_allocation=1.0)
        # effective = 3.0 * 0.5 = 1.5, factor = 1.5/10 = 0.15 < 0.4
        stress = detect_stress(crop, env, _full_resources(), zone)
        assert stress == "light_insufficient"

    def test_co2_imbalance_when_event_active(self) -> None:
        crop = _make_crop("potato")
        env = _optimal_env_for("potato")
        env.co2_event_active = True
        stress = detect_stress(crop, env, _full_resources(), _optimal_zone())
        assert stress == "co2_imbalance"

    def test_drought_takes_priority_over_heat(self) -> None:
        """Drought is checked before heat — higher priority."""
        crop = _make_crop("lettuce")
        env = Environment(solar_hours=12.0, internal_temp=30.0)  # heat stress
        zone = Zone(id=1, water_allocation=0.3)  # also drought
        stress = detect_stress(crop, env, _full_resources(), zone)
        assert stress == "drought"  # drought checked first

    def test_no_water_triggers_drought(self) -> None:
        crop = _make_crop("potato")
        env = _optimal_env_for("potato")
        resources = ResourcePool(water=0.0, nutrients=5_000.0, water_availability=0.0)
        stress = detect_stress(crop, env, resources, _optimal_zone())
        assert stress == "drought"


# ===================================================================
# Stress → health
# ===================================================================

class TestApplyStress:
    """apply_stress() modifies health based on active_stress."""

    def test_no_stress_recovers_health(self) -> None:
        crop = _make_crop("potato", health=90.0)
        crop.active_stress = None
        apply_stress(crop)
        assert crop.health == 91.0

    def test_recovery_capped_at_100(self) -> None:
        crop = _make_crop("potato", health=100.0)
        crop.active_stress = None
        apply_stress(crop)
        assert crop.health == 100.0

    def test_drought_severity_5(self) -> None:
        crop = _make_crop("potato", health=50.0)
        crop.active_stress = "drought"
        apply_stress(crop)
        assert crop.health == 45.0

    def test_heat_severity_4(self) -> None:
        crop = _make_crop("lettuce", health=50.0)
        crop.active_stress = "heat"
        apply_stress(crop)
        assert crop.health == 46.0

    def test_health_clamped_at_zero(self) -> None:
        crop = _make_crop("potato", health=3.0)
        crop.active_stress = "drought"  # severity 5
        apply_stress(crop)
        assert crop.health == 0.0

    def test_sustained_stress_kills_crop(self) -> None:
        """20 days of drought (severity 5) from 100 → 0."""
        crop = _make_crop("potato")
        crop.active_stress = "drought"
        for _ in range(20):
            apply_stress(crop)
        assert crop.health == 0.0
        assert is_dead(crop)


# ===================================================================
# Harvest
# ===================================================================

class TestHarvest:
    """Harvest conditions and yield calculation."""

    def test_harvestable_at_95_growth_and_good_health(self) -> None:
        crop = _make_crop("potato", growth=95.0, health=80.0)
        assert is_harvestable(crop)

    def test_not_harvestable_below_95_growth(self) -> None:
        crop = _make_crop("potato", growth=94.9, health=80.0)
        assert not is_harvestable(crop)

    def test_not_harvestable_at_low_health(self) -> None:
        crop = _make_crop("potato", growth=100.0, health=20.0)
        assert not is_harvestable(crop)

    def test_potato_harvest_yield_at_full_health(self) -> None:
        """Potato: 6 kg/m² × 2.0 m² × 100% health = 12 kg."""
        crop = _make_crop("potato", growth=100.0, health=100.0)
        food = harvest_crop(crop)
        assert food.kg == pytest.approx(12.0)
        # 12 kg × 10 × 77 kcal = 9240 kcal
        assert food.kcal == pytest.approx(9240.0)
        # 12 kg × 10 × 2.0 g = 240 g protein
        assert food.protein_g == pytest.approx(240.0)

    def test_harvest_yield_scales_with_health(self) -> None:
        """Half health → half yield."""
        crop = _make_crop("potato", growth=100.0, health=50.0)
        food = harvest_crop(crop)
        assert food.kg == pytest.approx(6.0)
        assert food.kcal == pytest.approx(4620.0)

    def test_lettuce_harvest_yield(self) -> None:
        """Lettuce: 4 kg/m² × 0.5 m² × 100% = 2.0 kg."""
        crop = _make_crop("lettuce", growth=100.0, health=100.0)
        food = harvest_crop(crop)
        assert food.kg == pytest.approx(2.0)
        assert food.kcal == pytest.approx(300.0)  # 2.0 × 10 × 15

    def test_beans_harvest_yield(self) -> None:
        """Beans: 3 kg/m² × 1.5 m² × 100% = 4.5 kg."""
        crop = _make_crop("beans_peas", growth=100.0, health=100.0)
        food = harvest_crop(crop)
        assert food.kg == pytest.approx(4.5)
        assert food.kcal == pytest.approx(4500.0)  # 4.5 × 10 × 100
        assert food.protein_g == pytest.approx(315.0)  # 4.5 × 10 × 7

    def test_unknown_crop_yields_nothing(self) -> None:
        crop = Crop(id="x", type="alien", zone_id=1, footprint_m2=1.0,
                    planted_day=0, growth=100.0, health=100.0)
        food = harvest_crop(crop)
        assert food.kg == 0.0


# ===================================================================
# Micronutrients
# ===================================================================

class TestMicronutrients:
    """get_micronutrients() returns correct nutrients per crop."""

    def test_potato_provides_vitamin_c_and_potassium(self) -> None:
        assert set(get_micronutrients("potato")) == {"vitamin_c", "potassium"}

    def test_beans_provide_four_nutrients(self) -> None:
        assert set(get_micronutrients("beans_peas")) == {
            "iron", "folate", "potassium", "magnesium"
        }

    def test_unknown_crop_empty(self) -> None:
        assert get_micronutrients("alien") == []

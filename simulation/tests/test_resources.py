"""Tests for resource consumption and recycling."""

from __future__ import annotations

import pytest

from src import config
from src.models import Crop, ResourcePool
from src.resources import consume_resources, recycle_resources


def _make_crop(crop_type: str) -> Crop:
    """Helper: create a minimal crop for resource testing."""
    cfg = config.CROPS[crop_type]
    return Crop(
        id=f"test_{crop_type}",
        type=crop_type,
        slot_id=1,
        footprint_m2=cfg.footprint_m2,
        planted_day=0,
        growth_cycle_days=cfg.growth_cycle_days,
    )


class TestConsumeResources:
    """Water and nutrient consumption."""

    def test_empty_greenhouse_only_crew_water(self) -> None:
        """No crops → only crew drinks water."""
        resources = ResourcePool(water=10_000.0, nutrients=5_000.0)
        consume_resources(resources, crops=[])
        expected_water = 10_000.0 - (config.CREW_SIZE * config.WATER_PER_PERSON_PER_DAY_L)
        assert resources.water == pytest.approx(expected_water)
        assert resources.nutrients == 5_000.0  # no crops → no nutrient use

    def test_one_potato_consumes_correct_water(self) -> None:
        resources = ResourcePool(water=10_000.0, nutrients=5_000.0)
        potato = _make_crop("potato")
        consume_resources(resources, crops=[potato])
        # 4.0 L (potato) + 4 * 2.5 (crew) = 14.0 L
        expected_water = 10_000.0 - 14.0
        assert resources.water == pytest.approx(expected_water)
        # 1 crop × 0.5 units/crop = 0.5 units nutrients
        expected_nutrients = 5_000.0 - config.NUTRIENT_CONSUMPTION_PER_CROP_PER_SOL
        assert resources.nutrients == pytest.approx(expected_nutrients)

    def test_multiple_crops_sum_water(self) -> None:
        resources = ResourcePool(water=10_000.0, nutrients=5_000.0)
        crops = [_make_crop("potato"), _make_crop("lettuce"), _make_crop("beans_peas")]
        consume_resources(resources, crops=crops)
        # Water: 4.0 + 2.0 + 3.0 + 10.0 (crew) = 19.0
        expected_water = 10_000.0 - 19.0
        assert resources.water == pytest.approx(expected_water)
        # Nutrients: 3 crops × 0.5 = 1.5
        expected_nutrients = 5_000.0 - 3 * config.NUTRIENT_CONSUMPTION_PER_CROP_PER_SOL
        assert resources.nutrients == pytest.approx(expected_nutrients)

    def test_water_clamps_to_zero(self) -> None:
        resources = ResourcePool(water=5.0, nutrients=5_000.0)
        crops = [_make_crop("potato")]  # needs 14L total (4 + crew 10)
        consume_resources(resources, crops=crops)
        assert resources.water == 0.0

    def test_nutrients_clamp_to_zero(self) -> None:
        resources = ResourcePool(water=10_000.0, nutrients=0.1)
        crops = [_make_crop("potato")]  # 0.5 units
        consume_resources(resources, crops=crops)
        assert resources.nutrients == 0.0


class TestRecycleResources:
    """Water and nutrient recycling."""

    def test_recycling_with_no_crops(self) -> None:
        """Only crew water is recycled."""
        resources = ResourcePool(water=9_990.0, nutrients=5_000.0)
        recycle_resources(resources, crops=[])
        crew_water = config.CREW_SIZE * config.WATER_PER_PERSON_PER_DAY_L
        expected_water = 9_990.0 + crew_water * config.WATER_RECYCLING_RATE
        assert resources.water == pytest.approx(expected_water)

    def test_recycling_with_one_potato(self) -> None:
        resources = ResourcePool(water=9_986.0, nutrients=4_999.5)
        potato = _make_crop("potato")
        recycle_resources(resources, crops=[potato])
        # Total consumed: 4.0 + 10.0 = 14.0 L water, 0.5 units nutrient
        water_recovered = 14.0 * config.WATER_RECYCLING_RATE  # 12.6
        nutrient_consumed = config.NUTRIENT_CONSUMPTION_PER_CROP_PER_SOL
        nutrient_recovered = nutrient_consumed * config.NUTRIENT_RECYCLING_RATE
        assert resources.water == pytest.approx(9_986.0 + water_recovered)
        assert resources.nutrients == pytest.approx(4_999.5 + nutrient_recovered)

    def test_degraded_recycling_rate(self) -> None:
        """During water recycling event, rate is lower."""
        resources = ResourcePool(water=9_986.0, nutrients=4_999.0,
                                 water_recycling_rate=0.75)
        potato = _make_crop("potato")
        recycle_resources(resources, crops=[potato])
        water_recovered = 14.0 * 0.75  # 10.5 instead of 12.6
        assert resources.water == pytest.approx(9_986.0 + water_recovered)


class TestNetWaterLoss:
    """Water should slowly deplete over time (net loss = 10% of consumption)."""

    def test_net_loss_per_sol_with_crops(self) -> None:
        """Net water loss = consumption * (1 - recycling_rate)."""
        resources = ResourcePool(water=10_000.0, nutrients=5_000.0)
        crops = [_make_crop("potato"), _make_crop("lettuce")]
        # Water consumed: 4.0 + 2.0 + 10.0 = 16.0
        consume_resources(resources, crops=crops)
        recycle_resources(resources, crops=crops)
        net_loss = 16.0 * (1.0 - config.WATER_RECYCLING_RATE)  # 1.6 L/sol
        expected = 10_000.0 - net_loss
        assert resources.water == pytest.approx(expected)

    def test_water_lasts_450_days_with_moderate_crops(self) -> None:
        """10,000L with 90% recycling should last the full mission."""
        resources = ResourcePool(water=10_000.0, nutrients=5_000.0)
        # 5 potato (5×4=20L) + 10 lettuce (10×2=20L) + crew (4×2.5=10L) = 50L/sol
        crops = [_make_crop("potato") for _ in range(5)] + [_make_crop("lettuce") for _ in range(10)]
        for _ in range(450):
            consume_resources(resources, crops=crops)
            recycle_resources(resources, crops=crops)
        # Net loss per sol: 50 * 0.10 = 5.0 L → 450 * 5 = 2,250L total
        # Starting 10,000 - 2,250 = 7,750 expected
        assert resources.water > 0, "Water should last 450 days with 90% recycling"
        assert resources.water == pytest.approx(7_750.0, rel=0.01)

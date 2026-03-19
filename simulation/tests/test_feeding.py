"""Tests for crew feeding: greenhouse fractions, stored food depletion, micronutrients."""

from __future__ import annotations

import pytest

from src import config
from src.feeding import feed_crew
from src.models import DailyNutrition, FoodItem, FoodSupply, StoredFood


def _supply_with(**items: dict) -> FoodSupply:
    """Helper: create a FoodSupply from {crop_type: (kg, kcal, protein_g)}."""
    return FoodSupply(items={
        name: FoodItem(kg=vals[0], kcal=vals[1], protein_g=vals[2])
        for name, vals in items.items()
    })


class TestEmptyGreenhouse:
    """No greenhouse food — everything from stored food."""

    def test_fractions_are_zero(self) -> None:
        result = feed_crew(FoodSupply(), StoredFood())
        assert result.calorie_gh_fraction == 0.0
        assert result.protein_gh_fraction == 0.0
        assert result.gh_kcal == 0.0
        assert result.gh_protein_g == 0.0

    def test_stored_food_covers_full_need(self) -> None:
        stored = StoredFood()
        result = feed_crew(FoodSupply(), stored)
        assert result.stored_kcal_consumed == pytest.approx(config.TOTAL_DAILY_CALORIES)
        expected_remaining = config.STORED_FOOD_TOTAL_KCAL - config.TOTAL_DAILY_CALORIES
        assert stored.remaining_calories == pytest.approx(expected_remaining)

    def test_no_micronutrients_covered(self) -> None:
        result = feed_crew(FoodSupply(), StoredFood())
        assert result.micronutrient_count == 0
        assert result.micronutrients_covered == []

    def test_stored_food_depletes_over_450_days(self) -> None:
        """Full mission with no greenhouse → stored food hits exactly 0."""
        stored = StoredFood()
        for _ in range(450):
            feed_crew(FoodSupply(), stored)
        assert stored.remaining_calories == pytest.approx(0.0, abs=1.0)


class TestKnownStockpile:
    """Verify exact fractions with known greenhouse food amounts."""

    def test_potato_only_stockpile(self) -> None:
        """12 kg potato = 9240 kcal. Daily need = 12000. Fraction = 0.77."""
        supply = _supply_with(potato=(12.0, 9240.0, 240.0))
        stored = StoredFood()
        result = feed_crew(supply, stored)

        assert result.gh_kcal == pytest.approx(9240.0)
        assert result.calorie_gh_fraction == pytest.approx(9240.0 / 12000.0)
        assert result.gh_protein_g == pytest.approx(240.0)
        assert result.protein_gh_fraction == pytest.approx(240.0 / 400.0)

        # Stored food covers remainder
        assert result.stored_kcal_consumed == pytest.approx(12000.0 - 9240.0)

        # Stockpile should be emptied (took 100% of 9240 < 12000 need)
        assert supply.total_kcal() == pytest.approx(0.0, abs=0.01)

    def test_more_food_than_needed(self) -> None:
        """Stockpile has 15000 kcal > 12000 need. Only consume 12000/15000 fraction."""
        supply = _supply_with(potato=(20.0, 15000.0, 400.0))
        stored = StoredFood()
        result = feed_crew(supply, stored)

        assert result.gh_kcal == pytest.approx(12000.0)
        assert result.calorie_gh_fraction == pytest.approx(1.0)
        assert result.stored_kcal_consumed == pytest.approx(0.0)

        # Stockpile should have leftover
        assert supply.total_kcal() == pytest.approx(3000.0, rel=0.01)

    def test_mixed_crops_micronutrients(self) -> None:
        """Potato + beans → vitamin_c, potassium, iron, folate, magnesium."""
        supply = _supply_with(
            potato=(5.0, 3850.0, 100.0),
            beans_peas=(3.0, 3000.0, 210.0),
        )
        result = feed_crew(supply, StoredFood())
        expected_nutrients = {"vitamin_c", "potassium", "iron", "folate", "magnesium"}
        assert set(result.micronutrients_covered) == expected_nutrients
        assert result.micronutrient_count == 5

    def test_all_five_crops_cover_all_seven_micronutrients(self) -> None:
        """All crop types present → all 7 micronutrients covered."""
        supply = _supply_with(
            lettuce=(1.0, 150.0, 14.0),
            potato=(1.0, 770.0, 20.0),
            radish=(1.0, 160.0, 7.0),
            beans_peas=(1.0, 1000.0, 70.0),
            herbs=(1.0, 150.0, 10.0),
        )
        result = feed_crew(supply, StoredFood())
        assert result.micronutrient_count == 7
        assert set(result.micronutrients_covered) == set(config.ALL_MICRONUTRIENTS)


class TestStoredFoodEdgeCases:
    """Edge cases around stored food depletion."""

    def test_stored_food_at_zero(self) -> None:
        """No stored food left, no greenhouse → deficit (fractions stay 0)."""
        stored = StoredFood(remaining_calories=0.0)
        result = feed_crew(FoodSupply(), stored)
        assert result.calorie_gh_fraction == 0.0
        assert result.stored_kcal_consumed == 0.0
        assert stored.remaining_calories == 0.0

    def test_stored_food_partial_coverage(self) -> None:
        """Stored food has only 5000 kcal left, need 12000."""
        stored = StoredFood(remaining_calories=5000.0)
        result = feed_crew(FoodSupply(), stored)
        assert result.stored_kcal_consumed == pytest.approx(5000.0)
        assert stored.remaining_calories == pytest.approx(0.0)

    def test_stored_food_never_goes_negative(self) -> None:
        stored = StoredFood(remaining_calories=100.0)
        feed_crew(FoodSupply(), stored)
        assert stored.remaining_calories >= 0.0


class TestProportionalConsumption:
    """Stockpile consumption is proportional across crop types."""

    def test_half_and_half_consumed_equally(self) -> None:
        """Two crops with equal kcal — both depleted equally."""
        supply = _supply_with(
            potato=(5.0, 3000.0, 100.0),
            beans_peas=(3.0, 3000.0, 210.0),
        )
        # Total = 6000 kcal < 12000 need → consume_fraction = 1.0 (take all)
        result = feed_crew(supply, StoredFood())
        assert supply.items["potato"].kcal == pytest.approx(0.0, abs=0.01)
        assert supply.items["beans_peas"].kcal == pytest.approx(0.0, abs=0.01)

    def test_surplus_consumed_proportionally(self) -> None:
        """More than needed — each type loses the same fraction."""
        supply = _supply_with(
            potato=(10.0, 7700.0, 200.0),
            lettuce=(10.0, 1500.0, 140.0),
            beans_peas=(5.0, 5000.0, 350.0),
        )
        # Total = 14200 kcal > 12000 need → fraction = 12000/14200 ≈ 0.845
        total_before = supply.total_kcal()
        result = feed_crew(supply, StoredFood())

        fraction = 12000.0 / 14200.0
        assert supply.items["potato"].kcal == pytest.approx(7700.0 * (1 - fraction), rel=0.01)
        assert supply.items["lettuce"].kcal == pytest.approx(1500.0 * (1 - fraction), rel=0.01)
        assert supply.items["beans_peas"].kcal == pytest.approx(5000.0 * (1 - fraction), rel=0.01)


class TestDailyNutritionValues:
    """Verify the DailyNutrition return values are consistent."""

    def test_gh_and_stored_sum_to_daily_need(self) -> None:
        """gh_kcal + stored_kcal should equal daily need when both sources available."""
        supply = _supply_with(potato=(5.0, 3850.0, 100.0))
        stored = StoredFood()
        result = feed_crew(supply, stored)
        total = result.gh_kcal + result.stored_kcal_consumed
        assert total == pytest.approx(config.TOTAL_DAILY_CALORIES, abs=1.0)

    def test_fraction_between_zero_and_one(self) -> None:
        supply = _supply_with(potato=(5.0, 3850.0, 100.0))
        result = feed_crew(supply, StoredFood())
        assert 0.0 <= result.calorie_gh_fraction <= 1.0
        assert 0.0 <= result.protein_gh_fraction <= 1.0

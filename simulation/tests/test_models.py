"""Tests for state dataclasses and serialization roundtrip."""

from src import config
from src.models import (
    Crop,
    DailyNutrition,
    Environment,
    FoodItem,
    FoodSupply,
    GreenhouseState,
    Metrics,
    ResourcePool,
    StoredFood,
    Slot,
    dict_to_state,
    state_to_dict,
)


class TestSerializationRoundtrip:
    """state_to_dict → dict_to_state must produce identical state."""

    def test_empty_state_roundtrip(self, default_state: GreenhouseState) -> None:
        d = state_to_dict(default_state)
        restored = dict_to_state(d)

        assert restored.day == default_state.day
        assert restored.seed == default_state.seed
        assert restored.next_crop_id == default_state.next_crop_id
        assert len(restored.slots) == len(default_state.slots)
        assert restored.resources.water == default_state.resources.water
        assert restored.stored_food.remaining_calories == default_state.stored_food.remaining_calories

    def test_populated_state_roundtrip(self, populated_state: GreenhouseState) -> None:
        d = state_to_dict(populated_state)
        restored = dict_to_state(d)

        # Top-level fields
        assert restored.day == populated_state.day
        assert restored.seed == populated_state.seed
        assert restored.next_crop_id == populated_state.next_crop_id

        # Environment
        assert restored.environment.solar_hours == populated_state.environment.solar_hours
        assert restored.environment.internal_temp == populated_state.environment.internal_temp
        assert restored.environment.outside_temp == populated_state.environment.outside_temp
        assert restored.environment.energy_deficit == populated_state.environment.energy_deficit

        # Slots and crops
        assert len(restored.slots) == 4
        assert len(restored.slots[0].crops) == 1
        assert restored.slots[0].crops[0].id == "crop_0_1"
        assert restored.slots[0].crops[0].type == "potato"
        assert restored.slots[0].crops[0].age == 45
        assert restored.slots[0].crops[0].health == 87.0
        assert restored.slots[0].crops[0].growth == 50.0
        assert restored.slots[0].crops[0].active_stress is None
        assert restored.slots[0].crop_type == "potato"
        assert restored.slots[0].row == 0
        assert restored.slots[0].col == 0

        assert len(restored.slots[1].crops) == 1
        assert restored.slots[1].crops[0].active_stress == "heat"
        assert restored.slots[1].artificial_light is False
        assert restored.slots[1].water_allocation == 0.8

        # Resources
        assert restored.resources.water == 8423.0
        assert restored.resources.nutrients == 3891.0

        # Food supply
        assert "potato" in restored.food_supply.items
        assert restored.food_supply.items["potato"].kg == 12.0
        assert restored.food_supply.items["potato"].kcal == 9240.0
        assert "lettuce" in restored.food_supply.items

        # Stored food
        assert restored.stored_food.remaining_calories == 4_800_000.0

        # Events
        assert len(restored.active_events) == 1
        assert restored.active_events[0].type == "water_recycling_degradation"
        assert restored.active_events[0].remaining_sols == 5
        assert restored.active_events[0].degraded_recycling == 0.75

        # Daily nutrition
        assert restored.daily_nutrition.calorie_gh_fraction == 0.21
        assert restored.daily_nutrition.micronutrient_count == 5
        assert len(restored.daily_nutrition.micronutrients_covered) == 5

        # Metrics
        assert restored.metrics.avg_calorie_gh_fraction == 0.19
        assert restored.metrics.total_harvested_kg == 285.0
        assert restored.metrics.crops_lost == 4
        assert restored.metrics.days_simulated == 55

    def test_double_roundtrip(self, populated_state: GreenhouseState) -> None:
        """Two roundtrips should produce identical dicts."""
        d1 = state_to_dict(populated_state)
        s1 = dict_to_state(d1)
        d2 = state_to_dict(s1)
        assert d1 == d2


class TestSlotMethods:
    """Slot area calculations."""

    def test_empty_slot_full_area_available(self) -> None:
        slot = Slot(id=0, area_m2=4.0, crops=[])
        assert slot.used_area() == 0.0
        assert slot.available_area() == 4.0

    def test_used_area_sums_footprints(self) -> None:
        potato = Crop(id="c1", type="potato", slot_id=0, footprint_m2=2.0,
                      planted_day=0, growth_cycle_days=90)
        lettuce = Crop(id="c2", type="lettuce", slot_id=0, footprint_m2=0.5,
                       planted_day=0, growth_cycle_days=37)
        slot = Slot(id=0, area_m2=4.0, crops=[potato, lettuce])
        assert slot.used_area() == 2.5
        assert slot.available_area() == 1.5

    def test_can_plant_checks_available_area(self) -> None:
        slot = Slot(id=0, area_m2=2.0, crops=[])
        assert slot.can_plant("potato") is True    # 2.0 m² fits in 2.0
        assert slot.can_plant("lettuce") is True   # 0.5 fits
        # Fill it with a potato
        slot.crops.append(Crop(id="c1", type="potato", slot_id=0,
                               footprint_m2=2.0, planted_day=0, growth_cycle_days=90))
        assert slot.can_plant("potato") is False   # 0.0 left
        assert slot.can_plant("herbs") is False    # 0.3 > 0.0

    def test_can_plant_unknown_crop_returns_false(self) -> None:
        slot = Slot(id=0, area_m2=4.0, crops=[])
        assert slot.can_plant("alien_fruit") is False


class TestFoodSupply:
    """FoodSupply aggregation methods."""

    def test_empty_supply_totals_zero(self) -> None:
        fs = FoodSupply()
        assert fs.total_kg() == 0.0
        assert fs.total_kcal() == 0.0
        assert fs.total_protein_g() == 0.0

    def test_totals_sum_items(self) -> None:
        fs = FoodSupply(items={
            "potato": FoodItem(kg=10.0, kcal=7700.0, protein_g=200.0),
            "lettuce": FoodItem(kg=5.0, kcal=750.0, protein_g=70.0),
        })
        assert fs.total_kg() == 15.0
        assert fs.total_kcal() == 8450.0
        assert fs.total_protein_g() == 270.0


class TestCropDefaults:
    """Crop auto-populates growth_cycle_days from config."""

    def test_growth_cycle_from_config(self) -> None:
        crop = Crop(id="c1", type="potato", slot_id=1, footprint_m2=2.0, planted_day=0)
        assert crop.growth_cycle_days == config.CROPS["potato"].growth_cycle_days

    def test_explicit_growth_cycle_preserved(self) -> None:
        crop = Crop(id="c1", type="potato", slot_id=1, footprint_m2=2.0,
                    planted_day=0, growth_cycle_days=100)
        assert crop.growth_cycle_days == 100

    def test_unknown_crop_type_keeps_zero(self) -> None:
        crop = Crop(id="c1", type="alien", slot_id=1, footprint_m2=1.0, planted_day=0)
        assert crop.growth_cycle_days == 0


class TestMetricsUpdate:
    """Running average calculation."""

    def test_first_day_average_equals_value(self) -> None:
        m = Metrics(days_simulated=1)
        daily = DailyNutrition(calorie_gh_fraction=0.20, protein_gh_fraction=0.15,
                               micronutrient_count=5)
        m.update_averages(daily)
        assert abs(m.avg_calorie_gh_fraction - 0.20) < 1e-9
        assert abs(m.avg_protein_gh_fraction - 0.15) < 1e-9

    def test_running_average_converges(self) -> None:
        m = Metrics()
        for i in range(1, 11):
            m.days_simulated = i
            daily = DailyNutrition(calorie_gh_fraction=0.20, protein_gh_fraction=0.10,
                                   micronutrient_count=5)
            m.update_averages(daily)
        assert abs(m.avg_calorie_gh_fraction - 0.20) < 1e-9
        assert abs(m.avg_protein_gh_fraction - 0.10) < 1e-9


class TestEnvironmentEffectiveSolar:
    """effective_solar property."""

    def test_no_penalty(self) -> None:
        env = Environment(solar_hours=12.0, light_penalty=0.0)
        assert env.effective_solar == 12.0

    def test_half_penalty(self) -> None:
        env = Environment(solar_hours=12.0, light_penalty=0.5)
        assert env.effective_solar == 6.0

    def test_full_penalty(self) -> None:
        env = Environment(solar_hours=12.0, light_penalty=1.0)
        assert env.effective_solar == 0.0

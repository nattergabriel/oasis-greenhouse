"""Sanity checks on config values — catches typos and spec drift."""

from src import config


class TestCropConfigs:
    """Verify crop parameters are within reasonable ranges."""

    def test_all_growth_cycles_positive(self) -> None:
        for name, crop in config.CROPS.items():
            assert crop.growth_cycle_days > 0, f"{name} has non-positive growth cycle"

    def test_all_footprints_fit_in_slot(self) -> None:
        for name, crop in config.CROPS.items():
            assert crop.footprint_m2 <= config.SLOT_AREA_M2, (
                f"{name} footprint {crop.footprint_m2} exceeds slot area {config.SLOT_AREA_M2}"
            )

    def test_all_footprints_positive(self) -> None:
        for name, crop in config.CROPS.items():
            assert crop.footprint_m2 > 0, f"{name} has non-positive footprint"

    def test_all_yields_positive(self) -> None:
        for name, crop in config.CROPS.items():
            assert crop.yield_per_m2_kg > 0, f"{name} has non-positive yield"

    def test_all_calories_non_negative(self) -> None:
        for name, crop in config.CROPS.items():
            assert crop.kcal_per_100g >= 0, f"{name} has negative calories"

    def test_all_optimal_temp_ranges_valid(self) -> None:
        for name, crop in config.CROPS.items():
            assert crop.optimal_temp_min_c < crop.optimal_temp_max_c, (
                f"{name} has invalid temp range: {crop.optimal_temp_min_c}-{crop.optimal_temp_max_c}"
            )

    def test_heat_stress_above_optimal_max(self) -> None:
        for name, crop in config.CROPS.items():
            assert crop.heat_stress_threshold_c >= crop.optimal_temp_max_c, (
                f"{name} heat stress {crop.heat_stress_threshold_c} is below optimal max {crop.optimal_temp_max_c}"
            )

    def test_five_crop_types(self) -> None:
        assert len(config.CROPS) == 5
        expected = {"lettuce", "potato", "radish", "beans_peas", "herbs"}
        assert set(config.CROPS.keys()) == expected

    def test_crop_footprint_dict_matches(self) -> None:
        for name, crop in config.CROPS.items():
            assert config.CROP_FOOTPRINT[name] == crop.footprint_m2


class TestMicronutrients:
    """Verify micronutrient coverage is complete."""

    def test_seven_micronutrients_defined(self) -> None:
        assert len(config.ALL_MICRONUTRIENTS) == 7

    def test_all_micronutrients_covered_by_at_least_one_crop(self) -> None:
        covered = set()
        for crop in config.CROPS.values():
            covered.update(crop.micronutrients)
        for nutrient in config.ALL_MICRONUTRIENTS:
            assert nutrient in covered, f"{nutrient} not provided by any crop"

    def test_crop_micronutrients_are_valid(self) -> None:
        valid = set(config.ALL_MICRONUTRIENTS)
        for name, crop in config.CROPS.items():
            for nutrient in crop.micronutrients:
                assert nutrient in valid, (
                    f"{name} provides unknown micronutrient: {nutrient}"
                )


class TestStressSystem:
    """Verify stress config is complete and consistent."""

    def test_seven_stress_types(self) -> None:
        assert len(config.STRESS_TYPES) == 7

    def test_severity_covers_all_stress_types(self) -> None:
        for stress in config.STRESS_TYPES:
            assert stress in config.STRESS_SEVERITY, (
                f"Missing severity for stress type: {stress}"
            )

    def test_all_severities_positive(self) -> None:
        for stress, severity in config.STRESS_SEVERITY.items():
            assert severity > 0, f"{stress} has non-positive severity"


class TestEventConfigs:
    """Verify event parameters are reasonable."""

    def test_two_event_types(self) -> None:
        assert len(config.EVENTS) == 2
        assert "water_recycling_degradation" in config.EVENTS
        assert "temperature_control_failure" in config.EVENTS

    def test_event_durations_valid(self) -> None:
        for name, event in config.EVENTS.items():
            assert event.duration_min_sols > 0, f"{name} has non-positive min duration"
            assert event.duration_max_sols >= event.duration_min_sols, (
                f"{name} max duration < min duration"
            )

    def test_event_probabilities_in_range(self) -> None:
        for name, event in config.EVENTS.items():
            assert 0 < event.probability_per_sol <= 1.0, (
                f"{name} probability {event.probability_per_sol} out of range"
            )


class TestGlobalConstants:
    """Verify key global constants match spec."""

    def test_crew_size(self) -> None:
        assert config.CREW_SIZE == 4

    def test_total_daily_calories(self) -> None:
        assert config.TOTAL_DAILY_CALORIES == 12_000

    def test_total_daily_protein(self) -> None:
        assert config.TOTAL_DAILY_PROTEIN_G == 400

    def test_stored_food_covers_full_mission(self) -> None:
        days = config.STORED_FOOD_TOTAL_KCAL / config.TOTAL_DAILY_CALORIES
        assert days == 450.0

    def test_grid_dimensions(self) -> None:
        assert config.GREENHOUSE_ROWS == 2
        assert config.GREENHOUSE_COLS == 2
        assert config.SLOT_AREA_M2 == 4.0

    def test_total_area_is_grid_times_slot_area(self) -> None:
        expected = config.GREENHOUSE_ROWS * config.GREENHOUSE_COLS * config.SLOT_AREA_M2
        assert config.GREENHOUSE_TOTAL_AREA_M2 == expected

    def test_water_recycling_in_kb_range(self) -> None:
        assert 0.85 <= config.WATER_RECYCLING_RATE <= 0.95

    def test_mission_duration(self) -> None:
        assert config.MISSION_DURATION_SOLS == 450

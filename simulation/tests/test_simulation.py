"""Integration tests for the simulation tick loop.

Tests the full pipeline: init → tick → verify state.
The 450-day run is the key sanity check.
"""

from __future__ import annotations

import pytest

from src import config
from src.models import state_to_dict
from src.simulation import create_initial_state, simulate_tick


# Assign crops across 16 slots (4×4 grid):
# 6 potato, 4 beans, 3 lettuce, 2 herbs, 1 radish
CROP_ASSIGNMENTS = {
    0: "potato",
    1: "potato",
    2: "potato",
    3: "potato",
    4: "potato",
    5: "potato",
    6: "beans_peas",
    7: "beans_peas",
    8: "beans_peas",
    9: "beans_peas",
    10: "lettuce",
    11: "lettuce",
    12: "lettuce",
    13: "herbs",
    14: "herbs",
    15: "radish",
}


class TestInitialState:
    """create_initial_state() produces valid starting state."""

    def test_empty_init(self) -> None:
        state = create_initial_state(seed=42)
        assert state.day == 0
        assert len(state.slots) == 16
        assert all(len(s.crops) == 0 for s in state.slots)
        assert state.stored_food.remaining_calories == config.STORED_FOOD_TOTAL_KCAL
        assert state.resources.water == config.STARTING_WATER_L

    def test_slots_have_grid_positions(self) -> None:
        state = create_initial_state(seed=42)
        positions = [(s.row, s.col) for s in state.slots]
        expected = [(r, c) for r in range(4) for c in range(4)]
        assert positions == expected

    def test_slot_ids_are_sequential(self) -> None:
        state = create_initial_state(seed=42)
        ids = [s.id for s in state.slots]
        assert ids == list(range(16))

    def test_init_with_crop_assignments(self) -> None:
        state = create_initial_state(seed=42, crop_assignments=CROP_ASSIGNMENTS)
        assert state.day == 0
        total_crops = sum(len(s.crops) for s in state.slots)
        assert total_crops > 0, "Crop assignments should produce crops on init"
        # Verify slots have crop types set
        assert state.slots[0].crop_type == "potato"
        assert state.slots[6].crop_type == "beans_peas"
        # Verify area is used
        for slot in state.slots:
            if slot.crop_type:
                assert slot.used_area() > 0

    def test_init_serialization_roundtrip(self) -> None:
        state = create_initial_state(seed=42, crop_assignments=CROP_ASSIGNMENTS)
        d = state_to_dict(state)
        from src.models import dict_to_state
        restored = dict_to_state(d)
        d2 = state_to_dict(restored)
        assert d == d2


class TestSmoke30Day:
    """30-day smoke test: verify basic simulation loop works."""

    def test_30_day_crops_grow(self) -> None:
        state = create_initial_state(seed=42, crop_assignments=CROP_ASSIGNMENTS)
        current = state_to_dict(state)

        total_days = 0
        for _ in range(30):
            result = simulate_tick(current, days=1)
            current = result["state"]
            total_days += result["days_simulated"]

        assert total_days == 30

        final = current
        all_crops = [c for s in final["slots"] for c in s["crops"]]
        assert len(all_crops) > 0
        assert any(c["growth"] > 0 for c in all_crops), "Some crops should have grown"
        assert final["resources"]["water"] < config.STARTING_WATER_L
        assert final["stored_food"]["remaining_calories"] < config.STORED_FOOD_TOTAL_KCAL

    def test_30_day_daily_logs_structure(self) -> None:
        state = create_initial_state(seed=42, crop_assignments=CROP_ASSIGNMENTS)
        result = simulate_tick(state_to_dict(state), days=30)
        log = result["daily_logs"][0]
        assert "day" in log
        assert "harvests" in log
        assert "deaths" in log
        assert "warnings" in log
        assert "calorie_gh_fraction" in log
        assert "water_remaining" in log


class TestEmptyGreenhouse:
    """No crops planted → greenhouse fraction stays 0."""

    def test_empty_30_days(self) -> None:
        state = create_initial_state(seed=42)  # no crop assignments
        current = state_to_dict(state)
        all_logs: list[dict] = []

        for _ in range(30):
            result = simulate_tick(current, days=1)
            all_logs.extend(result["daily_logs"])
            current = result["state"]

        total_crops = sum(len(s["crops"]) for s in current["slots"])
        assert total_crops == 0

        for log in all_logs:
            assert log["calorie_gh_fraction"] == 0.0

        expected = config.STORED_FOOD_TOTAL_KCAL - (30 * config.TOTAL_DAILY_CALORIES)
        assert current["stored_food"]["remaining_calories"] == pytest.approx(expected, abs=1.0)


class TestEventInjection:
    """Events can be injected and affect the simulation."""

    def test_injected_water_event_degrades_recycling(self) -> None:
        state = create_initial_state(seed=42, crop_assignments=CROP_ASSIGNMENTS)
        current = state_to_dict(state)
        result = simulate_tick(
            current, days=1,
            inject_events=[{"event_type": "water_recycling_degradation", "duration_sols": 5}],
        )
        assert "water_recycling_degradation" in result["daily_logs"][0]["events_started"]
        current = result["state"]
        found_end = False
        for _ in range(9):
            result = simulate_tick(current, days=1)
            current = result["state"]
            if result["daily_logs"] and "water_recycling_degradation" in result["daily_logs"][0].get("events_ended", []):
                found_end = True
                break
        assert found_end, "Water event should end within 10 days"

    def test_injected_temp_event_appears_in_state(self) -> None:
        state = create_initial_state(seed=42, crop_assignments=CROP_ASSIGNMENTS)
        result = simulate_tick(
            state_to_dict(state),
            days=5,
            inject_events=[{"event_type": "temperature_control_failure", "duration_sols": 3}],
        )
        assert "temperature_control_failure" in result["daily_logs"][0]["events_started"]
        found_end = False
        for log in result["daily_logs"]:
            if "temperature_control_failure" in log.get("events_ended", []):
                found_end = True
                break
        assert found_end, "Temp event should end within 3 days"


class TestActions:
    """Agent actions are applied correctly."""

    def test_set_crop_action(self) -> None:
        state = create_initial_state(seed=42)
        result = simulate_tick(
            state_to_dict(state),
            days=1,
            actions=[{
                "action": "set_crop",
                "slot_id": 0,
                "crop_type": "potato",
            }],
        )
        slot0 = result["state"]["slots"][0]
        assert slot0["crop_type"] == "potato"
        potatoes = [c for c in slot0["crops"] if c["type"] == "potato"]
        assert len(potatoes) == 2  # 4 m² / 2.0 m² = 2

    def test_set_crop_clears_existing(self) -> None:
        """Setting a new crop type should clear existing crops."""
        state = create_initial_state(seed=42, crop_assignments={0: "lettuce"})
        state_dict = state_to_dict(state)
        # Slot 0 has lettuce, now switch to potato
        result = simulate_tick(
            state_dict,
            days=1,
            actions=[{"action": "set_crop", "slot_id": 0, "crop_type": "potato"}],
        )
        slot0 = result["state"]["slots"][0]
        assert slot0["crop_type"] == "potato"
        assert all(c["type"] == "potato" for c in slot0["crops"])

    def test_water_adjust_action(self) -> None:
        state = create_initial_state(seed=42, crop_assignments=CROP_ASSIGNMENTS)
        result = simulate_tick(
            state_to_dict(state),
            days=1,
            actions=[{"action": "water_adjust", "slot_id": 1, "multiplier": 0.5}],
        )
        slot1 = result["state"]["slots"][1]
        assert slot1["water_allocation"] == 0.5

    def test_invalid_action_logged_as_warning(self) -> None:
        state = create_initial_state(seed=42)
        result = simulate_tick(
            state_to_dict(state),
            days=1,
            actions=[{"action": "plant", "crop_type": "alien", "slot_id": 0}],
        )
        assert any("alien" in w for w in result["daily_logs"][0]["warnings"])

    def test_set_temperature_action(self) -> None:
        state = create_initial_state(seed=42)
        result = simulate_tick(
            state_to_dict(state),
            days=1,
            actions=[{"action": "set_temperature", "target_temp": 18.0}],
        )
        assert result["state"]["environment"]["target_temp"] == 18.0


def _run_full_mission(seed: int = 42) -> dict:
    """Run a full 450-day mission, resuming after each early stop."""
    state = create_initial_state(seed=seed, crop_assignments=CROP_ASSIGNMENTS)
    current_state = state_to_dict(state)
    all_logs: list[dict] = []
    total_stops = 0

    while current_state["day"] < 450:
        remaining = 450 - current_state["day"]
        result = simulate_tick(current_state, days=remaining)
        all_logs.extend(result["daily_logs"])
        current_state = result["state"]
        if result["stopped_early"]:
            total_stops += 1
        else:
            break

    return {
        "state": current_state,
        "daily_logs": all_logs,
        "total_stops": total_stops,
    }


class TestFullMission:
    """450-day full simulation — the critical sanity check."""

    def test_450_day_calorie_fraction_in_range(self) -> None:
        """Average calorie greenhouse fraction should be meaningful.

        64 m² greenhouse (16 slots) with potato-heavy assignment:
        - 6 potato slots × 2 plants × 12kg/harvest ≈ 144 kg per cycle
        - Plus beans, lettuce, herbs, radish
        """
        result = _run_full_mission(seed=42)
        final = result["state"]
        metrics = final["metrics"]

        assert metrics["days_simulated"] == 450

        avg_cal = metrics["avg_calorie_gh_fraction"]
        avg_prot = metrics["avg_protein_gh_fraction"]
        total_kg = metrics["total_harvested_kg"]
        crops_lost = metrics["crops_lost"]
        water = final["resources"]["water"]

        print(f"\n{'='*60}")
        print(f"450-DAY SIMULATION RESULTS")
        print(f"{'='*60}")
        print(f"Avg calorie GH fraction:   {avg_cal:.1%}")
        print(f"Avg protein GH fraction:   {avg_prot:.1%}")
        print(f"Unique micronutrients:     {len(metrics.get('unique_micronutrients_seen', []))} / 7")
        print(f"Total harvested:           {total_kg:.1f} kg")
        print(f"Crops lost:                {crops_lost}")
        print(f"Water remaining:           {water:.0f} L")
        print(f"Stored food remaining:     {final['stored_food']['remaining_calories']:.0f} kcal")
        print(f"Early stops:               {result['total_stops']}")
        print(f"{'='*60}")

        assert 0.02 <= avg_cal <= 0.60, (
            f"Calorie fraction {avg_cal:.1%} outside 2-60% range"
        )
        assert 0.01 <= avg_prot <= 0.60, (
            f"Protein fraction {avg_prot:.1%} outside 1-60% range"
        )
        unique_micro = len(metrics.get("unique_micronutrients_seen", []))
        assert unique_micro >= 5, (
            f"Unique micronutrients {unique_micro} too low (expected ≥5 of 7)"
        )
        assert water > 0, "Water should not run out"
        assert total_kg > 0, "Should have harvested something"

    def test_450_day_stored_food_not_exhausted(self) -> None:
        result = _run_full_mission(seed=42)
        remaining = result["state"]["stored_food"]["remaining_calories"]
        assert remaining > 0, "Stored food should not be exhausted"

    def test_450_day_harvests_occur(self) -> None:
        result = _run_full_mission(seed=42)
        first_harvest_day = None
        for log in result["daily_logs"]:
            if log["harvests"]:
                first_harvest_day = log["day"]
                break
        assert first_harvest_day is not None, "Should have at least one harvest"
        assert first_harvest_day <= 50, (
            f"First harvest on day {first_harvest_day}, expected ≤50"
        )

    def test_450_day_calorie_fraction_ramps_up(self) -> None:
        result = _run_full_mission(seed=42)
        early_fractions = [
            log["calorie_gh_fraction"] for log in result["daily_logs"][:20]
        ]
        assert all(f < 0.05 for f in early_fractions), (
            "First 20 days should have <5% calorie fraction"
        )


class TestEarlyStop:
    """Early stop triggers: events, crop health, water, energy deficit."""

    def test_random_event_triggers_early_stop(self) -> None:
        state = create_initial_state(seed=42, crop_assignments=CROP_ASSIGNMENTS)
        current = state_to_dict(state)
        found_event_stop = False
        for _ in range(50):
            result = simulate_tick(current, days=30)
            current = result["state"]
            if result["stopped_early"] and result["stop_reason"]["type"] == "event_fired":
                found_event_stop = True
                assert result["days_simulated"] < 30
                assert len(result["stop_reason"]["events"]) > 0
                break
            if current["day"] >= 450:
                break
        assert found_event_stop, "Expected at least one event_fired early stop in 50 batches"

    def test_event_on_first_day_does_not_stop(self) -> None:
        state = create_initial_state(seed=42, crop_assignments=CROP_ASSIGNMENTS)
        result = simulate_tick(
            state_to_dict(state),
            days=1,
            inject_events=[{"event_type": "water_recycling_degradation", "duration_sols": 5}],
        )
        assert result["days_simulated"] == 1
        assert "water_recycling_degradation" in result["daily_logs"][0]["events_started"]

    def test_crop_health_threshold_stops(self) -> None:
        state = create_initial_state(seed=42, crop_assignments=CROP_ASSIGNMENTS)
        state_dict = state_to_dict(state)
        state_dict["slots"][0]["crops"][0]["health"] = 25.0
        result = simulate_tick(state_dict, days=10)
        assert result["stopped_early"]
        assert result["stop_reason"]["type"] == "threshold_breach"
        assert result["stop_reason"]["trigger"] == "crop_health_low"
        assert result["days_simulated"] == 1

    def test_water_threshold_stops(self) -> None:
        state = create_initial_state(seed=42, crop_assignments=CROP_ASSIGNMENTS)
        state_dict = state_to_dict(state)
        state_dict["resources"]["water"] = 5_900.0
        result = simulate_tick(state_dict, days=10)
        assert result["stopped_early"]
        assert result["stop_reason"]["type"] == "threshold_breach"
        assert result["stop_reason"]["trigger"] == "water_low"
        assert result["days_simulated"] == 1

    def test_energy_deficit_streak_stops(self) -> None:
        state = create_initial_state(seed=42, crop_assignments=CROP_ASSIGNMENTS)
        state_dict = state_to_dict(state)
        state_dict["environment"]["target_temp"] = 50.0
        result = simulate_tick(state_dict, days=10)
        assert result["stopped_early"]
        assert result["stop_reason"]["type"] == "threshold_breach"
        assert result["stop_reason"]["trigger"] == "energy_deficit_streak"
        assert result["days_simulated"] == 3

    def test_early_stop_returns_valid_state(self) -> None:
        state = create_initial_state(seed=42, crop_assignments=CROP_ASSIGNMENTS)
        state_dict = state_to_dict(state)
        state_dict["resources"]["water"] = 5_900.0
        result = simulate_tick(state_dict, days=10)
        assert result["stopped_early"]
        from src.models import dict_to_state
        restored = dict_to_state(result["state"])
        d2 = state_to_dict(restored)
        assert d2 == result["state"]


class TestMultiTickConsistency:
    """Running 1 day at a time vs N days should produce same result."""

    def test_single_day_ticks_are_deterministic(self) -> None:
        state = create_initial_state(seed=42, crop_assignments=CROP_ASSIGNMENTS)
        state_dict = state_to_dict(state)

        result_a = simulate_tick(state_dict, days=1)
        result_b = simulate_tick(state_dict, days=1)

        assert result_a["state"]["day"] == result_b["state"]["day"]
        assert result_a["state"]["resources"]["water"] == pytest.approx(
            result_b["state"]["resources"]["water"], abs=0.01
        )
        assert result_a["state"]["stored_food"]["remaining_calories"] == pytest.approx(
            result_b["state"]["stored_food"]["remaining_calories"], abs=1.0
        )
        assert result_a["state"]["metrics"]["total_harvested_kg"] == pytest.approx(
            result_b["state"]["metrics"]["total_harvested_kg"], abs=0.01
        )

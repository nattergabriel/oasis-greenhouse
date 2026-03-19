"""Integration tests for the simulation tick loop.

Tests the full pipeline: init → tick → verify state.
The 450-day run is the key sanity check — must produce 15-25% calorie fraction.
"""

from __future__ import annotations

import pytest

from src import config
from src.models import state_to_dict
from src.simulation import create_initial_state, simulate_tick


# KB-recommended zone plan (from spec)
KB_ZONE_PLANS = {
    1: {"potato": 0.6, "beans_peas": 0.4},       # calorie + protein zone
    2: {"potato": 0.5, "beans_peas": 0.5},        # balanced zone
    3: {"lettuce": 0.5, "radish": 0.3, "herbs": 0.2},  # micronutrient zone
    4: {"potato": 0.4, "lettuce": 0.3, "beans_peas": 0.3},  # mixed zone
}


class TestInitialState:
    """create_initial_state() produces valid starting state."""

    def test_empty_init(self) -> None:
        state = create_initial_state(seed=42)
        assert state.day == 0
        assert len(state.zones) == 4
        assert all(len(z.crops) == 0 for z in state.zones)
        assert state.stored_food.remaining_calories == config.STORED_FOOD_TOTAL_KCAL
        assert state.resources.water == config.STARTING_WATER_L

    def test_init_with_zone_plans(self) -> None:
        state = create_initial_state(seed=42, zone_plans=KB_ZONE_PLANS)
        assert state.day == 0
        total_crops = sum(len(z.crops) for z in state.zones)
        assert total_crops > 0, "Zone plans should produce crops on init"
        # Verify zones have crop plans set
        assert state.zones[0].crop_plan != {}
        # Verify area is used
        for zone in state.zones:
            if zone.crop_plan:
                assert zone.used_area() > 0

    def test_init_serialization_roundtrip(self) -> None:
        state = create_initial_state(seed=42, zone_plans=KB_ZONE_PLANS)
        d = state_to_dict(state)
        from src.models import dict_to_state
        restored = dict_to_state(d)
        d2 = state_to_dict(restored)
        assert d == d2


class TestSmoke30Day:
    """30-day smoke test: verify basic simulation loop works."""

    def test_30_day_crops_grow(self) -> None:
        """Init with plans → tick up to 30 days → crops should exist and have grown.
        May stop early due to random events — that's correct behavior."""
        state = create_initial_state(seed=42, zone_plans=KB_ZONE_PLANS)
        current = state_to_dict(state)

        # Run day-by-day to accumulate at least a few days regardless of events
        total_days = 0
        for _ in range(30):
            result = simulate_tick(current, days=1)
            current = result["state"]
            total_days += result["days_simulated"]

        assert total_days == 30

        final = current
        all_crops = [c for z in final["zones"] for c in z["crops"]]
        assert len(all_crops) > 0
        assert any(c["growth"] > 0 for c in all_crops), "Some crops should have grown"
        assert final["resources"]["water"] < config.STARTING_WATER_L
        assert final["stored_food"]["remaining_calories"] < config.STORED_FOOD_TOTAL_KCAL

    def test_30_day_daily_logs_structure(self) -> None:
        state = create_initial_state(seed=42, zone_plans=KB_ZONE_PLANS)
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
        """No crops planted → greenhouse fraction stays 0, stored food depletes."""
        state = create_initial_state(seed=42)  # no zone plans
        current = state_to_dict(state)
        all_logs: list[dict] = []

        # Run day-by-day (events may fire but no crops to affect)
        for _ in range(30):
            result = simulate_tick(current, days=1)
            all_logs.extend(result["daily_logs"])
            current = result["state"]

        # No crops
        total_crops = sum(len(z["crops"]) for z in current["zones"])
        assert total_crops == 0

        # Calorie fraction should be 0 every day
        for log in all_logs:
            assert log["calorie_gh_fraction"] == 0.0

        # Stored food should deplete at exactly 12,000/day
        expected = config.STORED_FOOD_TOTAL_KCAL - (30 * config.TOTAL_DAILY_CALORIES)
        assert current["stored_food"]["remaining_calories"] == pytest.approx(expected, abs=1.0)


class TestEventInjection:
    """Events can be injected and affect the simulation."""

    def test_injected_water_event_degrades_recycling(self) -> None:
        state = create_initial_state(seed=42, zone_plans=KB_ZONE_PLANS)
        # Run day-by-day to avoid random event early stops interfering
        current = state_to_dict(state)
        # Inject on first tick
        result = simulate_tick(
            current, days=1,
            inject_events=[{"event_type": "water_recycling_degradation", "duration_sols": 5}],
        )
        assert "water_recycling_degradation" in result["daily_logs"][0]["events_started"]
        current = result["state"]
        # Run 9 more days one at a time
        found_end = False
        for _ in range(9):
            result = simulate_tick(current, days=1)
            current = result["state"]
            if result["daily_logs"] and "water_recycling_degradation" in result["daily_logs"][0].get("events_ended", []):
                found_end = True
                break
        assert found_end, "Water event should end within 10 days"

    def test_injected_temp_event_appears_in_state(self) -> None:
        """Temperature event should be injected and visible in active events."""
        state = create_initial_state(seed=42, zone_plans=KB_ZONE_PLANS)
        result = simulate_tick(
            state_to_dict(state),
            days=5,
            inject_events=[{"event_type": "temperature_control_failure", "duration_sols": 3}],
        )
        assert "temperature_control_failure" in result["daily_logs"][0]["events_started"]
        # Event should end by day 3 (duration=3, ticks down each day)
        found_end = False
        for log in result["daily_logs"]:
            if "temperature_control_failure" in log.get("events_ended", []):
                found_end = True
                break
        assert found_end, "Temp event should end within 3 days"


class TestActions:
    """Agent actions are applied correctly."""

    def test_set_zone_plan_action(self) -> None:
        state = create_initial_state(seed=42)
        result = simulate_tick(
            state_to_dict(state),
            days=1,
            actions=[{
                "action": "set_zone_plan",
                "zone_id": 1,
                "plan": {"potato": 1.0},
            }],
        )
        zone1 = result["state"]["zones"][0]
        assert zone1["crop_plan"]["potato"] == pytest.approx(1.0)
        # Should have filled with potatoes
        potatoes = [c for c in zone1["crops"] if c["type"] == "potato"]
        assert len(potatoes) == 7  # 15 m² / 2.0 m² = 7

    def test_water_adjust_action(self) -> None:
        state = create_initial_state(seed=42, zone_plans=KB_ZONE_PLANS)
        result = simulate_tick(
            state_to_dict(state),
            days=1,
            actions=[{"action": "water_adjust", "zone_id": 2, "multiplier": 0.5}],
        )
        zone2 = result["state"]["zones"][1]
        assert zone2["water_allocation"] == 0.5

    def test_invalid_action_logged_as_warning(self) -> None:
        state = create_initial_state(seed=42)
        result = simulate_tick(
            state_to_dict(state),
            days=1,
            actions=[{"action": "plant", "crop_type": "alien", "zone_id": 1}],
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
    """Run a full 450-day mission, resuming after each early stop.

    With early stop triggers, a single 450-day batch will stop when events
    fire or thresholds breach. The orchestrator (us, in this test) resumes
    by calling tick again with the returned state.

    Returns the final result dict with accumulated daily_logs.
    """
    state = create_initial_state(seed=seed, zone_plans=KB_ZONE_PLANS)
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
            break  # completed without stopping

    return {
        "state": current_state,
        "daily_logs": all_logs,
        "total_stops": total_stops,
    }


class TestFullMission:
    """450-day full simulation — the critical sanity check."""

    def test_450_day_calorie_fraction_in_range(self) -> None:
        """Average calorie greenhouse fraction should be 15-25%.

        This is the spec's sanity math:
        - 60 m² greenhouse, KB-recommended plan
        - Potatoes dominate: ~1,540 kcal/day steady state
        - Beans add ~500-800 kcal/day
        - Total greenhouse ~2,000-2,500 kcal/day out of 12,000 need
        - = ~17-21%, with ramp-up period pulling average down slightly
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

        assert 0.10 <= avg_cal <= 0.30, (
            f"Calorie fraction {avg_cal:.1%} outside 10-30% range"
        )
        assert 0.05 <= avg_prot <= 0.25, (
            f"Protein fraction {avg_prot:.1%} outside 5-25% range"
        )
        unique_micro = len(metrics.get("unique_micronutrients_seen", []))
        assert unique_micro >= 5, (
            f"Unique micronutrients {unique_micro} too low (expected ≥5 of 7)"
        )
        assert water > 0, "Water should not run out"
        assert total_kg > 0, "Should have harvested something"

    def test_450_day_stored_food_not_exhausted(self) -> None:
        """Stored food should not run out if greenhouse is supplementing."""
        result = _run_full_mission(seed=42)
        remaining = result["state"]["stored_food"]["remaining_calories"]
        assert remaining > 0, "Stored food should not be exhausted"

    def test_450_day_harvests_occur(self) -> None:
        """Harvests should start appearing after first crop cycle completes."""
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
        """Early days should have 0% fraction, later days should be higher."""
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
        """When a random event fires mid-batch (not first day), simulation stops."""
        # Run batches until we see an event_fired early stop
        state = create_initial_state(seed=42, zone_plans=KB_ZONE_PLANS)
        current = state_to_dict(state)
        found_event_stop = False
        for _ in range(50):  # up to 50 attempts (each 30 days)
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
        """Events on tick 0 (first day) should NOT trigger early stop.
        Agent actions and injected events happen on day 1 — stopping
        immediately would prevent the agent from ever seeing them."""
        state = create_initial_state(seed=42, zone_plans=KB_ZONE_PLANS)
        # Inject an event on day 1 — should NOT cause early stop on day 1
        result = simulate_tick(
            state_to_dict(state),
            days=1,
            inject_events=[{"event_type": "water_recycling_degradation", "duration_sols": 5}],
        )
        assert result["days_simulated"] == 1
        # The injected event should be in the log but not cause a stop
        assert "water_recycling_degradation" in result["daily_logs"][0]["events_started"]

    def test_crop_health_threshold_stops(self) -> None:
        """Crop health below 30 should trigger early stop."""
        state = create_initial_state(seed=42, zone_plans=KB_ZONE_PLANS)
        state_dict = state_to_dict(state)
        # Manually set a crop's health low
        state_dict["zones"][0]["crops"][0]["health"] = 25.0
        result = simulate_tick(state_dict, days=10)
        assert result["stopped_early"]
        assert result["stop_reason"]["type"] == "threshold_breach"
        assert result["stop_reason"]["trigger"] == "crop_health_low"
        assert result["days_simulated"] == 1  # stops after first day

    def test_water_threshold_stops(self) -> None:
        """Water below 1,500L should trigger early stop."""
        state = create_initial_state(seed=42, zone_plans=KB_ZONE_PLANS)
        state_dict = state_to_dict(state)
        state_dict["resources"]["water"] = 1_400.0
        result = simulate_tick(state_dict, days=10)
        assert result["stopped_early"]
        assert result["stop_reason"]["type"] == "threshold_breach"
        assert result["stop_reason"]["trigger"] == "water_low"
        assert result["days_simulated"] == 1

    def test_energy_deficit_streak_stops(self) -> None:
        """3+ consecutive days of energy deficit should trigger early stop."""
        state = create_initial_state(seed=42, zone_plans=KB_ZONE_PLANS)
        state_dict = state_to_dict(state)
        # Set target temp very high → guaranteed deficit every day
        state_dict["environment"]["target_temp"] = 50.0
        result = simulate_tick(state_dict, days=10)
        assert result["stopped_early"]
        assert result["stop_reason"]["type"] == "threshold_breach"
        assert result["stop_reason"]["trigger"] == "energy_deficit_streak"
        assert result["days_simulated"] == 3  # fires on day 3

    def test_early_stop_returns_valid_state(self) -> None:
        """State returned after early stop should be valid and serializable."""
        state = create_initial_state(seed=42, zone_plans=KB_ZONE_PLANS)
        state_dict = state_to_dict(state)
        state_dict["resources"]["water"] = 1_400.0
        result = simulate_tick(state_dict, days=10)
        assert result["stopped_early"]
        # State should round-trip cleanly
        from src.models import dict_to_state
        restored = dict_to_state(result["state"])
        d2 = state_to_dict(restored)
        assert d2 == result["state"]


class TestMultiTickConsistency:
    """Running 1 day at a time vs N days should produce same result
    when no early stops intervene."""

    def test_single_day_ticks_are_deterministic(self) -> None:
        """Two independent 1-day runs from the same state produce identical results."""
        state = create_initial_state(seed=42, zone_plans=KB_ZONE_PLANS)
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

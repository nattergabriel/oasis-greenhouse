"""Tests for random event system: rolling, applying, expiring."""

from __future__ import annotations

import random

import pytest

from src import config
from src.events import apply_events, roll_events, update_active_events
from src.models import ActiveEvent, Environment, ResourcePool


class TestRollEvents:
    """Event rolling with deterministic RNG."""

    def test_no_events_when_rng_above_threshold(self) -> None:
        """With a seed that produces high rolls, no events should fire."""
        # Try multiple seeds to find one that doesn't fire on first roll
        found_quiet_seed = False
        for seed in range(100):
            rng = random.Random(seed)
            events = roll_events(day=1, active_events=[], rng=rng)
            if len(events) == 0:
                found_quiet_seed = True
                break
        assert found_quiet_seed, "Could not find a seed that produces no events"

    def test_events_fire_at_approximate_rate(self) -> None:
        """Over 1000 rolls, each 1% event should fire roughly 10 times."""
        rng = random.Random(12345)
        fire_counts: dict[str, int] = {name: 0 for name in config.EVENTS}

        for day in range(1, 1001):
            new_events = roll_events(day=day, active_events=[], rng=rng)
            for event in new_events:
                fire_counts[event.type] += 1

        for event_type, count in fire_counts.items():
            # 1% over 1000 → expect ~10, allow 2-25 range
            assert 2 <= count <= 25, (
                f"{event_type} fired {count} times in 1000 rolls (expected ~10)"
            )

    def test_duplicate_event_type_blocked(self) -> None:
        """Same event type should not fire if already active."""
        rng = random.Random(42)
        existing = [ActiveEvent(
            type="water_recycling_degradation",
            started_day=1, duration_sols=10, remaining_sols=5,
            degraded_recycling=0.75,
        )]
        # Roll many times — water_recycling should never appear
        for day in range(1, 200):
            new_events = roll_events(day=day, active_events=existing, rng=rng)
            for event in new_events:
                assert event.type != "water_recycling_degradation"

    def test_water_event_has_degraded_rate(self) -> None:
        """Water recycling event should set degraded_recycling in [0.70, 0.80]."""
        rng = random.Random(42)
        # Force-fire by trying many seeds
        for seed in range(1000):
            rng = random.Random(seed)
            events = roll_events(day=1, active_events=[], rng=rng)
            water_events = [e for e in events if e.type == "water_recycling_degradation"]
            if water_events:
                event = water_events[0]
                assert config.DEGRADED_WATER_RECYCLING_MIN <= event.degraded_recycling <= config.DEGRADED_WATER_RECYCLING_MAX
                assert event.duration_sols >= config.EVENTS["water_recycling_degradation"].duration_min_sols
                assert event.duration_sols <= config.EVENTS["water_recycling_degradation"].duration_max_sols
                return
        pytest.fail("Could not trigger water_recycling_degradation in 1000 seeds")

    def test_temperature_event_has_drift(self) -> None:
        """Temperature event should set temp_drift_c to ±5."""
        for seed in range(1000):
            rng = random.Random(seed)
            events = roll_events(day=1, active_events=[], rng=rng)
            temp_events = [e for e in events if e.type == "temperature_control_failure"]
            if temp_events:
                event = temp_events[0]
                assert abs(event.temp_drift_c) == config.TEMP_FAILURE_DRIFT_C
                return
        pytest.fail("Could not trigger temperature_control_failure in 1000 seeds")


class TestApplyEvents:
    """Event effects on environment and resources."""

    def test_no_events_resets_to_defaults(self) -> None:
        env = Environment(target_temp=22.0, internal_temp=27.0)
        resources = ResourcePool(water_recycling_rate=0.75)
        apply_events([], env, resources)
        assert env.internal_temp == 22.0
        assert resources.water_recycling_rate == config.WATER_RECYCLING_RATE

    def test_water_recycling_event_degrades_rate(self) -> None:
        event = ActiveEvent(
            type="water_recycling_degradation",
            started_day=1, duration_sols=10, remaining_sols=5,
            degraded_recycling=0.75,
        )
        env = Environment(target_temp=22.0)
        resources = ResourcePool()
        apply_events([event], env, resources)
        assert resources.water_recycling_rate == 0.75

    def test_temperature_event_shifts_internal_temp(self) -> None:
        event = ActiveEvent(
            type="temperature_control_failure",
            started_day=1, duration_sols=3, remaining_sols=2,
            temp_drift_c=5.0,
        )
        env = Environment(target_temp=22.0)
        resources = ResourcePool()
        apply_events([event], env, resources)
        assert env.internal_temp == 27.0

    def test_negative_temp_drift(self) -> None:
        event = ActiveEvent(
            type="temperature_control_failure",
            started_day=1, duration_sols=3, remaining_sols=2,
            temp_drift_c=-5.0,
        )
        env = Environment(target_temp=22.0)
        resources = ResourcePool()
        apply_events([event], env, resources)
        assert env.internal_temp == 17.0

    def test_both_events_simultaneously(self) -> None:
        water_event = ActiveEvent(
            type="water_recycling_degradation",
            started_day=1, duration_sols=10, remaining_sols=5,
            degraded_recycling=0.72,
        )
        temp_event = ActiveEvent(
            type="temperature_control_failure",
            started_day=2, duration_sols=2, remaining_sols=1,
            temp_drift_c=-5.0,
        )
        env = Environment(target_temp=22.0)
        resources = ResourcePool()
        apply_events([water_event, temp_event], env, resources)
        assert resources.water_recycling_rate == 0.72
        assert env.internal_temp == 17.0


class TestUpdateActiveEvents:
    """Event expiration and removal."""

    def test_event_ticks_down(self) -> None:
        event = ActiveEvent(
            type="water_recycling_degradation",
            started_day=1, duration_sols=10, remaining_sols=5,
        )
        still_active = update_active_events([event])
        assert len(still_active) == 1
        assert still_active[0].remaining_sols == 4

    def test_event_removed_when_expired(self) -> None:
        event = ActiveEvent(
            type="water_recycling_degradation",
            started_day=1, duration_sols=10, remaining_sols=1,
        )
        still_active = update_active_events([event])
        assert len(still_active) == 0

    def test_mixed_expiration(self) -> None:
        expiring = ActiveEvent(
            type="water_recycling_degradation",
            started_day=1, duration_sols=5, remaining_sols=1,
        )
        continuing = ActiveEvent(
            type="temperature_control_failure",
            started_day=3, duration_sols=3, remaining_sols=3,
        )
        still_active = update_active_events([expiring, continuing])
        assert len(still_active) == 1
        assert still_active[0].type == "temperature_control_failure"
        assert still_active[0].remaining_sols == 2

    def test_empty_list_returns_empty(self) -> None:
        assert update_active_events([]) == []

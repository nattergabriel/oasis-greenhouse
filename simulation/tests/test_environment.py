"""Tests for Mars environment: sine curves, energy budget, light penalty."""

from __future__ import annotations

import math

import pytest

from src import config
from src.environment import update_environment
from src.models import Environment, Slot


def _make_slots(num_lit: int = 4) -> list[Slot]:
    """Helper: create slots with a given number of lit ones."""
    total = config.GREENHOUSE_ROWS * config.GREENHOUSE_COLS
    return [
        Slot(id=i, artificial_light=(i < num_lit))
        for i in range(total)
    ]


class TestSolarHours:
    """Seasonal solar hour sine curve."""

    def test_day_0_near_baseline(self) -> None:
        env = Environment()
        update_environment(env, day=0, slots=_make_slots())
        # sin(0) = 0 → solar_hours ≈ 12
        assert abs(env.solar_hours - 12.0) < 0.01

    def test_summer_peak(self) -> None:
        """Quarter year (~172 sols) should be near summer peak (15h)."""
        env = Environment()
        peak_day = config.MARTIAN_YEAR_SOLS // 4  # ~172
        update_environment(env, day=peak_day, slots=_make_slots())
        assert env.solar_hours > 14.5, f"Expected ~15h at summer peak, got {env.solar_hours}"

    def test_winter_low(self) -> None:
        """Three-quarter year (~515 sols) should be near winter low (9h)."""
        env = Environment()
        low_day = 3 * config.MARTIAN_YEAR_SOLS // 4  # ~515
        update_environment(env, day=low_day, slots=_make_slots())
        assert env.solar_hours < 9.5, f"Expected ~9h at winter low, got {env.solar_hours}"

    def test_solar_hours_range_over_year(self) -> None:
        """Solar hours should stay within 9-15 range over a full Martian year."""
        env = Environment()
        min_hours = 99.0
        max_hours = 0.0
        for day in range(config.MARTIAN_YEAR_SOLS):
            update_environment(env, day=day, slots=_make_slots())
            min_hours = min(min_hours, env.solar_hours)
            max_hours = max(max_hours, env.solar_hours)
        assert min_hours >= 8.9
        assert max_hours <= 15.1


class TestOutsideTemp:
    """Seasonal outside temperature sine curve."""

    def test_day_0_near_average(self) -> None:
        env = Environment()
        update_environment(env, day=0, slots=_make_slots())
        assert abs(env.outside_temp - (-63.0)) < 0.1

    def test_summer_warmest(self) -> None:
        env = Environment()
        peak_day = config.MARTIAN_YEAR_SOLS // 4
        update_environment(env, day=peak_day, slots=_make_slots())
        assert env.outside_temp > -45.0, f"Expected ~-43°C at summer, got {env.outside_temp}"

    def test_winter_coldest(self) -> None:
        env = Environment()
        low_day = 3 * config.MARTIAN_YEAR_SOLS // 4
        update_environment(env, day=low_day, slots=_make_slots())
        assert env.outside_temp < -80.0, f"Expected ~-83°C at winter, got {env.outside_temp}"


class TestEnergyBudget:
    """Energy generation, consumption, and deficit."""

    def test_no_deficit_at_baseline(self) -> None:
        """Day 0 with all 4 lit slots should have manageable energy budget."""
        env = Environment()
        update_environment(env, day=0, slots=_make_slots())
        # energy_generated = 12 * 4.5 = 54
        assert env.energy_generated == pytest.approx(54.0, abs=0.5)
        assert env.energy_deficit == pytest.approx(0.0, abs=1.0)

    def test_deficit_in_winter(self) -> None:
        """Deep winter: low solar + high heating = energy deficit expected."""
        env = Environment()
        low_day = 3 * config.MARTIAN_YEAR_SOLS // 4
        update_environment(env, day=low_day, slots=_make_slots())
        # solar ~9h → generated ~40.5
        # heating: 0.5 * (22 - (-83)) ≈ 52.5
        # lighting: 4 * 2.0 = 8
        # pumps: 1.0
        # needed ≈ 61.5 → deficit ≈ 21
        assert env.energy_deficit > 0, "Expected energy deficit in winter"
        assert env.energy_generated < env.energy_needed

    def test_no_deficit_in_summer(self) -> None:
        """Summer: high solar, easier to break even or surplus."""
        env = Environment()
        peak_day = config.MARTIAN_YEAR_SOLS // 4
        update_environment(env, day=peak_day, slots=_make_slots())
        # solar ~15h → generated ~67.5
        # heating: 0.5 * (22 - (-43)) ≈ 32.5
        # lighting: 4 * 2.0 = 8, pumps: 1 → needed ≈ 41.5
        # Should have surplus
        assert env.energy_deficit == pytest.approx(0.0, abs=1.0)

    def test_fewer_lit_slots_reduces_energy_cost(self) -> None:
        env_all = Environment()
        env_half = Environment()
        update_environment(env_all, day=0, slots=_make_slots(num_lit=4))
        update_environment(env_half, day=0, slots=_make_slots(num_lit=2))
        assert env_half.energy_needed < env_all.energy_needed
        diff = env_all.energy_needed - env_half.energy_needed
        assert diff == pytest.approx(2 * config.LIGHTING_COST_PER_SLOT, abs=0.01)

    def test_heating_cost_zero_if_colder_inside(self) -> None:
        """Edge case: if internal temp < outside temp, no heating needed."""
        env = Environment(target_temp=-90.0, internal_temp=-90.0)
        update_environment(env, day=0, slots=_make_slots(num_lit=0))
        # heating cost should be 0, only pump cost
        assert env.energy_needed == pytest.approx(config.PUMP_COST, abs=0.01)


class TestLightPenalty:
    """Energy deficit → light penalty feedback."""

    def test_no_penalty_when_no_deficit(self) -> None:
        env = Environment()
        peak_day = config.MARTIAN_YEAR_SOLS // 4
        update_environment(env, day=peak_day, slots=_make_slots())
        assert env.light_penalty == 0.0

    def test_penalty_appears_in_winter(self) -> None:
        env = Environment()
        low_day = 3 * config.MARTIAN_YEAR_SOLS // 4
        update_environment(env, day=low_day, slots=_make_slots())
        assert env.light_penalty > 0.0
        assert env.light_penalty <= config.MAX_LIGHT_PENALTY_FROM_DEFICIT

    def test_penalty_capped_at_max(self) -> None:
        """Even extreme deficit shouldn't exceed MAX_LIGHT_PENALTY_FROM_DEFICIT."""
        env = Environment(target_temp=50.0)  # absurdly high → huge heating cost
        update_environment(env, day=0, slots=_make_slots())
        assert env.light_penalty <= config.MAX_LIGHT_PENALTY_FROM_DEFICIT

    def test_effective_solar_reduced_by_penalty(self) -> None:
        env = Environment()
        low_day = 3 * config.MARTIAN_YEAR_SOLS // 4
        update_environment(env, day=low_day, slots=_make_slots())
        assert env.effective_solar < env.solar_hours
        assert env.effective_solar == env.solar_hours * (1.0 - env.light_penalty)

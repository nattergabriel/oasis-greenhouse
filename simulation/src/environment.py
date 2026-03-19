"""Mars environment: solar hours, temperature, energy budget.

Updates per-tick seasonal variables using sine curves over the Martian year.
Applies energy deficit → light penalty feedback loop.
"""

from __future__ import annotations

import math

from . import config
from .models import Environment, Zone


def update_environment(env: Environment, day: int, zones: list[Zone]) -> None:
    """Update environment for the given sol.

    Computes seasonal solar hours and outside temperature via sine curves,
    then calculates energy budget (generation vs heating + lighting + pumps).
    Sets light_penalty when energy deficit exists.

    Args:
        env: Environment state to mutate in place.
        day: Current mission day (1-450).
        zones: List of zones (needed to count lit zones for energy cost).
    """
    seasonal_angle = 2.0 * math.pi * day / config.MARTIAN_YEAR_SOLS

    # Seasonal solar hours: 9-15h over Martian year
    env.solar_hours = (
        config.BASE_SOLAR_HOURS
        + config.SEASONAL_AMPLITUDE_HOURS * math.sin(seasonal_angle)
    )

    # Seasonal outside temperature: -83 to -43°C
    env.outside_temp = (
        config.AVERAGE_SURFACE_TEMP_C
        + config.SEASONAL_TEMP_AMPLITUDE_C * math.sin(seasonal_angle)
    )

    # Internal temp = target + any active event drift (set by events.py before this call)
    # events.py sets env.internal_temp directly; here we just keep it as-is

    # Energy budget
    env.energy_generated = env.solar_hours * config.SOLAR_PANEL_EFFICIENCY

    lit_zones = sum(1 for z in zones if z.artificial_light)
    lighting_cost = lit_zones * config.LIGHTING_COST_PER_ZONE
    heating_cost = config.HEATING_COST_FACTOR * (env.internal_temp - env.outside_temp)
    heating_cost = max(0.0, heating_cost)  # no cost if greenhouse is colder than outside

    env.energy_needed = heating_cost + lighting_cost + config.PUMP_COST
    env.energy_deficit = max(0.0, env.energy_needed - env.energy_generated)

    # Light penalty from energy deficit: proportional reduction up to 50%
    if env.energy_needed > 0.0:
        deficit_fraction = env.energy_deficit / env.energy_needed
        env.light_penalty = min(
            deficit_fraction * config.MAX_LIGHT_PENALTY_FROM_DEFICIT,
            config.MAX_LIGHT_PENALTY_FROM_DEFICIT,
        )
    else:
        env.light_penalty = 0.0

"""Random event system: rolling, applying effects, expiring.

Two KB-backed event types:
  - water_recycling_degradation: recycling drops to 70-80% for 5-15 sols
  - temperature_control_failure: internal temp drifts ±5°C for 1-3 sols
"""

from __future__ import annotations

import random as random_module

from . import config
from .models import ActiveEvent, Environment, ResourcePool


def roll_events(
    day: int,
    active_events: list[ActiveEvent],
    rng: random_module.Random,
) -> list[ActiveEvent]:
    """Roll for new random events this sol.

    Each event type rolls independently. An event type cannot fire if one
    of the same type is already active.

    Args:
        day: Current mission day.
        active_events: Currently active events (checked for duplicates).
        rng: Deterministic RNG instance.

    Returns:
        List of newly created events (may be empty).
    """
    active_types = {e.type for e in active_events}
    new_events: list[ActiveEvent] = []

    for event_type, event_cfg in config.EVENTS.items():
        if event_type in active_types:
            continue
        if rng.random() < event_cfg.probability_per_sol:
            duration = rng.randint(event_cfg.duration_min_sols, event_cfg.duration_max_sols)
            event = ActiveEvent(
                type=event_type,
                started_day=day,
                duration_sols=duration,
                remaining_sols=duration,
            )
            # Set event-specific parameters
            if event_type == "water_recycling_degradation":
                event.degraded_recycling = rng.uniform(
                    config.DEGRADED_WATER_RECYCLING_MIN,
                    config.DEGRADED_WATER_RECYCLING_MAX,
                )
            elif event_type == "temperature_control_failure":
                direction = rng.choice([-1, 1])
                event.temp_drift_c = direction * config.TEMP_FAILURE_DRIFT_C

            new_events.append(event)

    return new_events


def apply_events(
    active_events: list[ActiveEvent],
    env: Environment,
    resources: ResourcePool,
) -> None:
    """Apply effects of all active events to environment and resources.

    Called once per tick, before crop growth. Modifies environment and
    resource pool in place.

    Args:
        active_events: Currently active events.
        env: Environment to modify.
        resources: Resource pool to modify.
    """
    # Reset event-driven state to defaults before applying
    env.internal_temp = env.target_temp
    env.co2_event_active = False
    resources.water_recycling_rate = config.WATER_RECYCLING_RATE

    for event in active_events:
        if event.type == "water_recycling_degradation":
            resources.water_recycling_rate = event.degraded_recycling
        elif event.type == "temperature_control_failure":
            env.internal_temp = env.target_temp + event.temp_drift_c


def update_active_events(active_events: list[ActiveEvent]) -> list[ActiveEvent]:
    """Tick down remaining sols and remove expired events.

    Args:
        active_events: List of active events to update.

    Returns:
        List of events still active after this tick (expired ones removed).
    """
    still_active: list[ActiveEvent] = []
    for event in active_events:
        event.remaining_sols -= 1
        if event.remaining_sols > 0:
            still_active.append(event)
    return still_active

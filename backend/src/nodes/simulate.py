"""Simulate node — execute actions via sim engine and track metrics."""
import logging
from typing import Any

from ..models.state import AgentState, GreenhouseState
from ..sim_client import sim_client
from ._snapshot import create_snapshot

logger = logging.getLogger(__name__)


async def simulate_node(state: AgentState) -> dict[str, Any]:
    """Execute planned actions through the sim engine."""
    gh: GreenhouseState = state["greenhouse"]
    mission_day = gh.day
    sim_info = state.get("sim_result") or {}

    actions = sim_info.get("planned_actions", [])
    plan_horizon = sim_info.get("plan_horizon", 30)

    # Filter inject_events whose target day falls within this batch window.
    # Note: the sim engine applies all inject_events on the first day of the
    # tick, so the "day" field is only used for filtering, not scheduling.
    inject_events = state.get("inject_events") or []
    batch_events = [
        {"event_type": e["event_type"], "duration_sols": e.get("duration_sols")}
        for e in inject_events
        if mission_day < e.get("day", 0) <= mission_day + plan_horizon
    ]

    logger.info(
        "[SIMULATE] Running %d days from day %d (%d actions, %d injected events)",
        plan_horizon, mission_day, len(actions), len(batch_events),
    )

    result = await sim_client.tick(
        state=gh,
        actions=actions,
        days=plan_horizon,
        inject_events=batch_events,
    )

    new_gh: GreenhouseState = result["state"]
    days_simulated = result["days_simulated"]
    stopped_early = result.get("stopped_early", False)

    logger.info(
        "[SIMULATE] Simulated %d days → day %d (stopped_early=%s)",
        days_simulated, new_gh.day, stopped_early,
    )

    # Accumulate metrics from daily logs
    daily_logs = result.get("daily_logs", [])
    calorie_fractions = list(state.get("calorie_fractions", []))
    protein_fractions = list(state.get("protein_fractions", []))
    micronutrient_counts = list(state.get("micronutrient_counts", []))
    total_harvested_kg = state.get("total_harvested_kg", 0.0)
    crops_lost = state.get("crops_lost", 0)

    for day_entry in daily_logs:
        calorie_fractions.append(day_entry.get("calorie_gh_fraction", 0.0))
        protein_fractions.append(day_entry.get("protein_gh_fraction", 0.0))
        micronutrient_counts.append(day_entry.get("micronutrient_count", 0))

        for harvest in day_entry.get("harvests", []):
            total_harvested_kg += harvest.get("kg", 0.0)

        crops_lost += len(day_entry.get("deaths", []))

    # Build snapshot
    snapshots = list(state.get("daily_snapshots", []))
    snapshots.append(create_snapshot(new_gh))

    return {
        "greenhouse": new_gh,
        "sim_result": result,
        "daily_snapshots": snapshots,
        "calorie_fractions": calorie_fractions,
        "protein_fractions": protein_fractions,
        "micronutrient_counts": micronutrient_counts,
        "total_harvested_kg": total_harvested_kg,
        "crops_lost": crops_lost,
        "loop_iterations": state.get("loop_iterations", 0) + 1,
    }

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
    mission_day = gh.mission_day
    sim_info = state.get("sim_result") or {}

    actions = sim_info.get("planned_actions", [])
    plan_horizon = sim_info.get("plan_horizon", 30)

    # Filter inject_events for this batch window
    inject_events = state.get("inject_events") or []
    batch_events = []
    for event in inject_events:
        event_day = event.get("day", 0)
        if mission_day < event_day <= mission_day + plan_horizon:
            batch_event = dict(event)
            batch_event["day"] = event_day - mission_day  # relative to batch start
            batch_events.append(batch_event)

    logger.info(
        "[SIMULATE] Running %d days from day %d (%d actions, %d injected events)",
        plan_horizon, mission_day, len(actions), len(batch_events),
    )

    # Call sim engine
    result = await sim_client.tick(
        state=gh,
        actions=actions,
        days=plan_horizon,
        inject_events=batch_events,
    )

    new_gh: GreenhouseState = result["final_state"]
    days_simulated = result["days_simulated"]
    stopped_early = result.get("stopped_early", False)

    logger.info(
        "[SIMULATE] Simulated %d days → day %d (stopped_early=%s)",
        days_simulated, new_gh.mission_day, stopped_early,
    )

    # Accumulate metrics from daily log
    daily_log = result.get("daily_log", [])
    calorie_fractions = list(state.get("calorie_fractions", []))
    protein_fractions = list(state.get("protein_fractions", []))
    micronutrient_counts = list(state.get("micronutrient_counts", []))
    total_harvested_kg = state.get("total_harvested_kg", 0.0)
    crops_lost = state.get("crops_lost", 0)

    for day_entry in daily_log:
        # Nutrition metrics from daily_nutrition in the day entry if present,
        # otherwise use final state (sim engine may include per-day nutrition)
        nutrition = day_entry.get("daily_nutrition")
        if nutrition:
            cal_frac = nutrition.get("calorie_gh_fraction", 0.0)
            prot_frac = nutrition.get("protein_gh_fraction", 0.0)
            micro_count = nutrition.get("micronutrient_count", 0)
        else:
            cal_frac = new_gh.daily_nutrition.calorie_gh_fraction
            prot_frac = new_gh.daily_nutrition.protein_gh_fraction
            micro_count = new_gh.daily_nutrition.micronutrient_count

        calorie_fractions.append(cal_frac)
        protein_fractions.append(prot_frac)
        micronutrient_counts.append(micro_count)

        # Track harvests
        for harvest in day_entry.get("harvests", []):
            total_harvested_kg += harvest.get("yield_kg", 0.0)

        # Track crop losses (health dropped to 0)
        for change in day_entry.get("crop_stress_changes", []):
            if change.get("health", 100) <= 0:
                crops_lost += 1

    # Build snapshots
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
    }

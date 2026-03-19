"""Plan node — review metrics and set actions for next batch."""
import json
import logging
from typing import Any

from backend.models.state import AgentState, AgentAction
from backend.agent.llm import bedrock_client
from backend.agent.prompts import SYSTEM_PROMPT, build_plan_prompt

logger = logging.getLogger(__name__)


async def plan_node(state: AgentState) -> dict[str, Any]:
    """Plan actions for the next ~30-day batch."""
    gh = state["greenhouse"]
    mission_day = gh.mission_day

    logger.info("[PLAN] Planning for day %d", mission_day)

    # Build summaries
    zone_summary = _build_zone_summary(gh.zones)
    food_supply_summary = _build_food_supply_summary(gh.food_supply)
    state_json = json.dumps(gh.model_dump(), indent=2, default=str)

    # Plan horizon: min(30, days remaining)
    days_remaining = 450 - mission_day
    plan_horizon = min(30, days_remaining)

    # Build prompt
    user_prompt = build_plan_prompt(
        strategy_doc=state["strategy_doc"],
        mission_day=mission_day,
        state_json=state_json,
        calorie_gh_fraction=gh.daily_nutrition.calorie_gh_fraction,
        protein_gh_fraction=gh.daily_nutrition.protein_gh_fraction,
        micronutrients_covered=gh.daily_nutrition.micronutrients_covered,
        micronutrient_count=gh.daily_nutrition.micronutrient_count,
        stored_food_remaining=gh.stored_food.remaining_calories,
        stored_food_days_left=gh.daily_nutrition.stored_food_days_left,
        water=gh.resources.water,
        nutrients=gh.resources.nutrients,
        water_recycling_efficiency=gh.resources.water_recycling_efficiency,
        nutrient_recycling_efficiency=gh.resources.nutrient_recycling_efficiency,
        energy_generated=gh.environment.energy_generated,
        energy_needed=gh.environment.energy_needed,
        energy_deficit=gh.environment.energy_deficit,
        zone_summary=zone_summary,
        food_supply_summary=food_supply_summary,
        plan_horizon=plan_horizon,
    )

    # Call LLM
    response = await bedrock_client.call(SYSTEM_PROMPT, user_prompt)

    reasoning = response.get("reasoning", "No reasoning provided")
    actions = response.get("actions", [])

    logger.info("[PLAN] %d actions planned", len(actions))

    # Log decision
    decision = AgentAction(
        day=mission_day,
        node="plan",
        reasoning=reasoning,
        actions=actions,
    )

    decisions = list(state.get("agent_decisions", []))
    decisions.append(decision)

    return {
        "agent_decisions": decisions,
        "sim_result": {
            "planned_actions": actions,
            "plan_horizon": plan_horizon,
        },
    }


def _build_zone_summary(zones: list) -> str:
    """Build readable zone summary with current plans."""
    lines = []
    for zone in zones:
        used = zone.used_area()
        available = zone.available_area()
        plan_str = ", ".join(
            f"{crop}: {pct * 100:.0f}%" for crop, pct in zone.crop_plan.items()
        )
        if not plan_str:
            plan_str = "No plan set"

        lines.append(f"Zone {zone.id}: {used:.1f}m² used / {available:.1f}m² available")
        lines.append(f"  Plan: {plan_str}")
        lines.append(f"  Light: {'ON' if zone.artificial_light else 'OFF'}, Water: {zone.water_allocation:.1f}x")
        lines.append(f"  Crops: {len(zone.crops)} active")
    return "\n".join(lines)


def _build_food_supply_summary(food_supply) -> str:
    """Build readable food stockpile summary."""
    lines = [
        f"Total: {food_supply.total_kg:.1f} kg, "
        f"{food_supply.total_kcal:.0f} kcal, "
        f"{food_supply.total_protein_g:.0f}g protein",
        "By crop type:",
    ]
    for crop_type, stock in food_supply.by_type.items():
        lines.append(
            f"  {crop_type}: {stock.kg:.1f} kg "
            f"({stock.kcal:.0f} kcal, {stock.protein_g:.0f}g protein)"
        )
    if not food_supply.by_type:
        lines.append("  (empty)")
    return "\n".join(lines)

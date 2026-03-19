"""Plan node — review metrics and set actions for next batch."""
import json
import logging
from typing import Any

from ..models.state import AgentState, AgentAction
from ..agent.llm import bedrock_client
from ..agent.prompts import SYSTEM_PROMPT, build_plan_prompt

logger = logging.getLogger(__name__)


async def plan_node(state: AgentState) -> dict[str, Any]:
    """Plan actions for the next ~30-day batch."""
    gh = state["greenhouse"]
    mission_day = gh.day

    logger.info("[PLAN] Planning for day %d", mission_day)

    slot_summary = _build_slot_summary(gh.slots)
    food_supply_summary = _build_food_supply_summary(gh.food_supply)
    state_json = json.dumps(gh.model_dump(), indent=2, default=str)

    days_remaining = 450 - mission_day
    plan_horizon = min(30, days_remaining)

    user_prompt = build_plan_prompt(
        strategy_doc=state["strategy_doc"],
        mission_day=mission_day,
        state_json=state_json,
        calorie_gh_fraction=gh.daily_nutrition.calorie_gh_fraction,
        protein_gh_fraction=gh.daily_nutrition.protein_gh_fraction,
        micronutrients_covered=gh.daily_nutrition.micronutrients_covered,
        micronutrient_count=gh.daily_nutrition.micronutrient_count,
        stored_food_remaining=gh.stored_food.remaining_calories,
        water=gh.resources.water,
        nutrients=gh.resources.nutrients,
        water_recycling_rate=gh.resources.water_recycling_rate,
        energy_generated=gh.environment.energy_generated,
        energy_needed=gh.environment.energy_needed,
        energy_deficit=gh.environment.energy_deficit,
        slot_summary=slot_summary,
        food_supply_summary=food_supply_summary,
        plan_horizon=plan_horizon,
    )

    response = await bedrock_client.call(SYSTEM_PROMPT, user_prompt)

    reasoning = response.get("reasoning", "No reasoning provided")
    actions = response.get("actions", [])

    logger.info("[PLAN] %d actions planned", len(actions))

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


def _build_slot_summary(slots: list) -> str:
    """Build readable slot summary."""
    lines = []
    for slot in slots:
        used = slot.used_area()
        available = slot.available_area()
        crop_str = slot.crop_type or "No crop assigned"

        lines.append(f"Slot {slot.id} (row {slot.row}, col {slot.col}): {used:.1f}m² used / {available:.1f}m² available")
        lines.append(f"  Crop type: {crop_str}")
        lines.append(f"  Light: {'ON' if slot.artificial_light else 'OFF'}, Water: {slot.water_allocation:.1f}x")
        lines.append(f"  Crops: {len(slot.crops)} active")
    return "\n".join(lines)


def _build_food_supply_summary(food_supply) -> str:
    """Build readable food stockpile summary."""
    lines = [
        f"Total: {food_supply.total_kg:.1f} kg, "
        f"{food_supply.total_kcal:.0f} kcal, "
        f"{food_supply.total_protein_g:.0f}g protein",
        "By crop type:",
    ]
    for crop_type, stock in food_supply.items.items():
        lines.append(
            f"  {crop_type}: {stock.kg:.1f} kg "
            f"({stock.kcal:.0f} kcal, {stock.protein_g:.0f}g protein)"
        )
    if not food_supply.items:
        lines.append("  (empty)")
    return "\n".join(lines)

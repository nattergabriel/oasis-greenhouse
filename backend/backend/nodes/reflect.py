"""Reflect node — rewrite strategy document after simulation."""
import logging
from typing import Any

from ..models.state import AgentState
from ..agent.llm import bedrock_client
from ..agent.prompts import SYSTEM_PROMPT, build_reflect_prompt
from ..strategy.store import strategy_store

logger = logging.getLogger(__name__)


async def reflect_node(state: AgentState) -> dict[str, Any]:
    """Reflect on completed simulation and rewrite strategy."""
    gh = state["greenhouse"]

    logger.info("[REFLECT] Reflecting on completed mission (day %d)", gh.mission_day)

    # Calculate final averages
    cal_fracs = state.get("calorie_fractions", [])
    prot_fracs = state.get("protein_fractions", [])
    micro_counts = state.get("micronutrient_counts", [])

    avg_cal = sum(cal_fracs) / len(cal_fracs) if cal_fracs else 0.0
    avg_prot = sum(prot_fracs) / len(prot_fracs) if prot_fracs else 0.0
    avg_micro = sum(micro_counts) / len(micro_counts) if micro_counts else 0.0

    stored_pct = (
        (gh.stored_food.remaining_calories / gh.stored_food.total_calories) * 100
        if gh.stored_food.total_calories > 0
        else 0.0
    )

    events_summary = _build_events_summary(gh.active_events)
    decisions_log = _build_decisions_log(state.get("agent_decisions", []))

    user_prompt = build_reflect_prompt(
        strategy_doc=state["strategy_doc"],
        avg_calorie_gh_fraction=avg_cal,
        avg_protein_gh_fraction=avg_prot,
        avg_micronutrient_coverage=avg_micro,
        stored_food_remaining_pct=stored_pct,
        total_kg=state.get("total_harvested_kg", 0.0),
        crops_lost=state.get("crops_lost", 0),
        events_summary=events_summary,
        decisions_log=decisions_log,
    )

    response = await bedrock_client.call(SYSTEM_PROMPT, user_prompt)

    new_strategy = response.get("strategy_document", state["strategy_doc"])

    # Save rewritten strategy
    strategy_store.write(new_strategy)
    logger.info("[REFLECT] Strategy document saved (%d chars)", len(new_strategy))

    return {"strategy_doc": new_strategy}


def _build_events_summary(events: list) -> str:
    if not events:
        return "No major events encountered"
    lines = []
    for e in events:
        status = "resolved" if e.resolved else "active"
        lines.append(
            f"- {e.type} (severity {e.severity:.1f}) day {e.day_triggered} "
            f"[{status}]: {e.details}"
        )
    return "\n".join(lines)


def _build_decisions_log(decisions: list) -> str:
    if not decisions:
        return "No decisions recorded"
    lines = []
    for d in decisions:
        lines.append(f"\nDay {d.day} ({d.node.upper()}):")
        lines.append(f"Reasoning: {d.reasoning[:300]}")
        lines.append(f"Actions: {len(d.actions)} actions taken")
    return "\n".join(lines)

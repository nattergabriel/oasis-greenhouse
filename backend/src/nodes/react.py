"""React node — respond to events and threshold breaches."""
import json
import logging
from typing import Any

from backend.models.state import AgentState, AgentAction
from backend.agent.llm import bedrock_client
from backend.agent.prompts import SYSTEM_PROMPT, build_react_prompt
from backend.kb.client import kb_client

logger = logging.getLogger(__name__)


async def react_node(state: AgentState) -> dict[str, Any]:
    """React to an event or threshold breach."""
    gh = state["greenhouse"]
    mission_day = gh.mission_day
    sim_result = state.get("sim_result") or {}
    stop_reason = sim_result.get("stop_reason", {})
    stop_type = stop_reason.get("type", "unknown")

    logger.info("[REACT] Alert at day %d — %s", mission_day, stop_type)

    # Build stop details string
    stop_details = _format_stop_details(stop_type, stop_reason)

    # Query KB for scenario guidance (live, not cached)
    kb_guidance = await _get_kb_guidance(stop_type, stop_reason)

    state_json = json.dumps(gh.model_dump(), indent=2, default=str)
    days_remaining = 450 - mission_day

    user_prompt = build_react_prompt(
        strategy_doc=state["strategy_doc"],
        event_day=mission_day,
        stop_type=stop_type,
        stop_details=stop_details,
        kb_scenario_guidance=kb_guidance,
        state_json=state_json,
        water=gh.resources.water,
        water_recycling_efficiency=gh.resources.water_recycling_efficiency,
        nutrients=gh.resources.nutrients,
        energy_generated=gh.environment.energy_generated,
        energy_needed=gh.environment.energy_needed,
        energy_deficit=gh.environment.energy_deficit,
        days_remaining=days_remaining,
    )

    response = await bedrock_client.call(SYSTEM_PROMPT, user_prompt)

    diagnosis = response.get("diagnosis", "No diagnosis provided")
    actions = response.get("immediate_actions", [])
    monitoring_plan = response.get("monitoring_plan", "")
    revised_horizon = response.get("revised_plan_horizon", 10)

    logger.info("[REACT] %d immediate actions, horizon=%d", len(actions), revised_horizon)

    decision = AgentAction(
        day=mission_day,
        node="react",
        reasoning=f"{diagnosis}\n\nMonitoring: {monitoring_plan}",
        actions=actions,
    )

    decisions = list(state.get("agent_decisions", []))
    decisions.append(decision)

    return {
        "agent_decisions": decisions,
        "sim_result": {
            "planned_actions": actions,
            "plan_horizon": revised_horizon,
        },
    }


def _format_stop_details(stop_type: str, stop_reason: dict) -> str:
    """Build a human-readable stop details string."""
    if stop_type == "event_fired":
        event = stop_reason.get("event", {})
        return (
            f"Event: {event.get('type', 'unknown')} "
            f"(severity {event.get('severity', 0):.1f})\n"
            f"{event.get('details', 'No details')}"
        )
    if stop_type == "threshold_breach":
        breach = stop_reason.get("breach", {})
        return (
            f"Threshold breach: {breach.get('type', 'unknown')}\n"
            f"Current value: {breach.get('value', 'unknown')}"
        )
    return str(stop_reason)


async def _get_kb_guidance(stop_type: str, stop_reason: dict) -> str:
    """Query KB for relevant guidance based on the stop reason."""
    try:
        if stop_type == "event_fired":
            event_type = stop_reason.get("event", {}).get("type", "")
            if "water" in event_type:
                return await kb_client.query_operational_scenario("water_recycling")
            if "temperature" in event_type:
                return await kb_client.query_operational_scenario("temperature_failure")
            return await kb_client.query_operational_scenario(event_type)

        if stop_type == "threshold_breach":
            breach_type = stop_reason.get("breach", {}).get("type", "")
            if "health" in breach_type:
                return await kb_client.query_stress_response("crop health decline")
            if "water" in breach_type:
                return await kb_client.query_stress_response("drought")
            if "energy" in breach_type:
                return await kb_client.query_operational_scenario("energy deficit")
            return await kb_client.query(f"greenhouse {breach_type} response")
    except Exception as e:
        logger.warning("[REACT] KB query failed: %s", e)

    return "No specific guidance available for this scenario."

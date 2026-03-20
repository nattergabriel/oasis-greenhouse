"""React node — respond to events and threshold breaches."""
import json
import logging
from typing import Any

from ..models.state import AgentState, AgentAction
from ..agent.llm import bedrock_client
from ..agent.prompts import SYSTEM_PROMPT, build_react_prompt
from ..kb.client import kb_client

logger = logging.getLogger(__name__)


async def react_node(state: AgentState) -> dict[str, Any]:
    """React to an event or threshold breach."""
    gh = state["greenhouse"]
    mission_day = gh.day
    sim_result = state.get("sim_result") or {}
    stop_reason = sim_result.get("stop_reason", {})
    stop_type = stop_reason.get("type", "unknown")

    logger.info("[REACT] Alert at day %d — %s", mission_day, stop_type)

    stop_details = stop_reason.get("detail", str(stop_reason))

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
        water_recycling_rate=gh.resources.water_recycling_rate,
        nutrients=gh.resources.nutrients,
        energy_generated=gh.environment.energy_generated,
        energy_needed=gh.environment.energy_needed,
        energy_deficit=gh.environment.energy_deficit,
        days_remaining=days_remaining,
    )

    response = await bedrock_client.call(SYSTEM_PROMPT, user_prompt)

    # Extract fields matching the prompt format
    reasoning = response.get("reasoning", "No reasoning provided")
    actions = response.get("actions", [])

    logger.info("[REACT] %d actions taken", len(actions))

    decision = AgentAction(
        day=mission_day,
        node="react",
        reasoning=reasoning,
        actions=actions,
    )

    decisions = list(state.get("agent_decisions", []))
    decisions.append(decision)

    return {
        "agent_decisions": decisions,
        "sim_result": {
            "planned_actions": actions,
            "plan_horizon": 10,  # Default horizon for react
        },
    }


async def _get_kb_guidance(stop_type: str, stop_reason: dict) -> str:
    """Query KB for relevant guidance based on the stop reason."""
    try:
        if stop_type == "event_fired":
            events = stop_reason.get("events", [])
            for event_type in events:
                if "water" in event_type:
                    return await kb_client.query_operational_scenario("water_recycling")
                if "temperature" in event_type:
                    return await kb_client.query_operational_scenario("temperature_failure")
            if events:
                return await kb_client.query_operational_scenario(events[0])

        if stop_type == "threshold_breach":
            trigger = stop_reason.get("trigger", "")
            if "crop_health" in trigger:
                return await kb_client.query_stress_response("crop health decline")
            if "water" in trigger:
                return await kb_client.query_stress_response("drought")
            if "energy" in trigger:
                return await kb_client.query_operational_scenario("energy deficit")
            if "starvation" in trigger:
                return await kb_client.query_operational_scenario("food shortage")
    except Exception as e:
        logger.warning("[REACT] KB query failed: %s", e)

    return "No specific guidance available for this scenario."

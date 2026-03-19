"""LangGraph state machine for the Mars greenhouse agent."""
from typing import Literal

from langgraph.graph import StateGraph, END

from .models.state import AgentState
from .nodes.init import init_node
from .nodes.plan import plan_node
from .nodes.simulate import simulate_node
from .nodes.react import react_node
from .nodes.reflect import reflect_node


def route_after_simulate(state: AgentState) -> Literal["reflect", "react", "plan"]:
    """Route after simulate based on mission status."""
    gh = state.get("greenhouse")
    if gh and gh.mission_day >= 450:
        return "reflect"

    sim_result = state.get("sim_result") or {}
    if sim_result.get("stopped_early", False):
        return "react"

    return "plan"


def build_graph() -> StateGraph:
    """Build and compile the LangGraph state machine."""
    workflow = StateGraph(AgentState)

    workflow.add_node("init", init_node)
    workflow.add_node("plan", plan_node)
    workflow.add_node("simulate", simulate_node)
    workflow.add_node("react", react_node)
    workflow.add_node("reflect", reflect_node)

    workflow.set_entry_point("init")
    workflow.add_edge("init", "plan")
    workflow.add_edge("plan", "simulate")
    workflow.add_conditional_edges(
        "simulate",
        route_after_simulate,
        {"reflect": "reflect", "react": "react", "plan": "plan"},
    )
    workflow.add_edge("react", "simulate")
    workflow.add_edge("reflect", END)

    return workflow.compile()


# Global graph instance
graph = build_graph()

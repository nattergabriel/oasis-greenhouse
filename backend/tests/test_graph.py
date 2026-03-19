"""Tests for LangGraph wiring — route_after_simulate + build_graph."""
import pytest

from src.graph import route_after_simulate, build_graph


class TestRouteAfterSimulate:
    def test_mission_complete_returns_reflect(self, sample_greenhouse):
        """When day >= 450, route to reflect."""
        gh = sample_greenhouse.model_copy(update={"day": 450})
        state = {"greenhouse": gh, "sim_result": {}}
        assert route_after_simulate(state) == "reflect"

    def test_mission_past_complete_returns_reflect(self, sample_greenhouse):
        """day > 450 should also route to reflect."""
        gh = sample_greenhouse.model_copy(update={"day": 460})
        state = {"greenhouse": gh, "sim_result": {}}
        assert route_after_simulate(state) == "reflect"

    def test_stopped_early_returns_react(self, sample_greenhouse):
        """When sim stopped_early, route to react."""
        state = {
            "greenhouse": sample_greenhouse,
            "sim_result": {"stopped_early": True},
        }
        assert route_after_simulate(state) == "react"

    def test_normal_returns_plan(self, sample_greenhouse):
        """Normal case: route back to plan."""
        state = {
            "greenhouse": sample_greenhouse,
            "sim_result": {"stopped_early": False},
        }
        assert route_after_simulate(state) == "plan"

    def test_no_greenhouse_returns_plan(self):
        """If greenhouse is None, should return plan (not reflect)."""
        state = {"greenhouse": None, "sim_result": {}}
        assert route_after_simulate(state) == "plan"

    def test_no_sim_result_returns_plan(self, sample_greenhouse):
        """If sim_result is None/empty, should return plan."""
        state = {"greenhouse": sample_greenhouse, "sim_result": None}
        assert route_after_simulate(state) == "plan"

    def test_empty_state(self):
        """Minimal state should default to plan."""
        state = {}
        assert route_after_simulate(state) == "plan"


class TestBuildGraph:
    def test_returns_compiled_graph(self):
        """build_graph should return a compiled LangGraph."""
        compiled = build_graph()
        assert hasattr(compiled, "ainvoke")
        assert callable(compiled.ainvoke)

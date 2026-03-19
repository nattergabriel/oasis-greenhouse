"""Tests for LangGraph node functions."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from backend.models.state import AgentAction, GreenhouseState


class TestInitNode:
    @pytest.mark.asyncio
    async def test_init_node_returns_expected_keys(self, sample_greenhouse):
        """init_node should initialise greenhouse, load KB, load strategy."""
        with (
            patch("backend.nodes.init.sim_client") as mock_sim,
            patch("backend.nodes.init.kb_cache") as mock_kb_cache,
            patch("backend.nodes.init.strategy_store") as mock_strategy,
        ):
            mock_sim.init = AsyncMock(return_value=sample_greenhouse)
            mock_kb_cache.load = AsyncMock()
            mock_kb_cache.get_crop_profiles_text.return_value = "crop profiles"
            mock_kb_cache.get_nutrition_targets_text.return_value = "nutrition targets"
            mock_strategy.read.return_value = "# Strategy"

            from backend.nodes.init import init_node

            state = {"run_id": "test-123", "config": {}}
            result = await init_node(state)

        assert result["greenhouse"] is sample_greenhouse
        assert result["strategy_doc"] == "# Strategy"
        assert result["kb_crop_profiles"] == "crop profiles"
        assert result["kb_nutrition_targets"] == "nutrition targets"
        assert len(result["daily_snapshots"]) == 1
        assert result["agent_decisions"] == []
        assert result["total_harvested_kg"] == 0.0
        assert result["crops_lost"] == 0


class TestPlanNode:
    @pytest.mark.asyncio
    async def test_plan_node_calls_llm(self, sample_greenhouse, mock_llm_plan_response):
        """plan_node should build prompt, call LLM, and return decisions."""
        with patch("backend.nodes.plan.bedrock_client") as mock_llm:
            mock_llm.call = AsyncMock(return_value=mock_llm_plan_response)

            from backend.nodes.plan import plan_node

            state = {
                "greenhouse": sample_greenhouse,
                "strategy_doc": "# Strategy",
                "agent_decisions": [],
            }
            result = await plan_node(state)

        mock_llm.call.assert_awaited_once()
        assert len(result["agent_decisions"]) == 1
        decision = result["agent_decisions"][0]
        assert isinstance(decision, AgentAction)
        assert decision.node == "plan"
        assert decision.reasoning == "We should plant more potatoes"
        assert "sim_result" in result
        assert result["sim_result"]["planned_actions"] == mock_llm_plan_response["actions"]

    @pytest.mark.asyncio
    async def test_plan_node_appends_to_existing_decisions(self, sample_greenhouse, mock_llm_plan_response):
        """plan_node should append to existing decisions list."""
        existing = AgentAction(day=0, node="plan", reasoning="initial", actions=[])

        with patch("backend.nodes.plan.bedrock_client") as mock_llm:
            mock_llm.call = AsyncMock(return_value=mock_llm_plan_response)

            from backend.nodes.plan import plan_node

            state = {
                "greenhouse": sample_greenhouse,
                "strategy_doc": "# Strategy",
                "agent_decisions": [existing],
            }
            result = await plan_node(state)

        assert len(result["agent_decisions"]) == 2


class TestSimulateNode:
    @pytest.mark.asyncio
    async def test_simulate_node(self, sample_greenhouse):
        """simulate_node should call sim engine tick and accumulate metrics."""
        gh_after = sample_greenhouse.model_copy(update={"mission_day": 30})
        tick_result = {
            "final_state": gh_after,
            "days_simulated": 30,
            "stopped_early": False,
            "stop_reason": {},
            "daily_log": [
                {
                    "daily_nutrition": {
                        "calorie_gh_fraction": 0.05,
                        "protein_gh_fraction": 0.03,
                        "micronutrient_count": 2,
                    },
                    "harvests": [{"yield_kg": 1.5}],
                    "crop_stress_changes": [],
                },
            ],
        }

        with patch("backend.nodes.simulate.sim_client") as mock_sim:
            mock_sim.tick = AsyncMock(return_value=tick_result)

            from backend.nodes.simulate import simulate_node

            state = {
                "greenhouse": sample_greenhouse,
                "sim_result": {"planned_actions": [], "plan_horizon": 30},
                "inject_events": [],
                "daily_snapshots": [],
                "calorie_fractions": [],
                "protein_fractions": [],
                "micronutrient_counts": [],
                "total_harvested_kg": 0.0,
                "crops_lost": 0,
            }
            result = await simulate_node(state)

        assert result["greenhouse"].mission_day == 30
        assert result["total_harvested_kg"] == 1.5
        assert len(result["calorie_fractions"]) == 1
        assert result["calorie_fractions"][0] == 0.05
        assert len(result["daily_snapshots"]) == 1

    @pytest.mark.asyncio
    async def test_simulate_node_tracks_crop_losses(self, sample_greenhouse):
        """simulate_node should count crops with health <= 0."""
        gh_after = sample_greenhouse.model_copy(update={"mission_day": 30})
        tick_result = {
            "final_state": gh_after,
            "days_simulated": 30,
            "stopped_early": False,
            "daily_log": [
                {
                    "harvests": [],
                    "crop_stress_changes": [{"health": 0}],  # dead crop
                },
            ],
        }

        with patch("backend.nodes.simulate.sim_client") as mock_sim:
            mock_sim.tick = AsyncMock(return_value=tick_result)

            from backend.nodes.simulate import simulate_node

            state = {
                "greenhouse": sample_greenhouse,
                "sim_result": {"planned_actions": [], "plan_horizon": 30},
                "inject_events": [],
                "daily_snapshots": [],
                "calorie_fractions": [],
                "protein_fractions": [],
                "micronutrient_counts": [],
                "total_harvested_kg": 0.0,
                "crops_lost": 0,
            }
            result = await simulate_node(state)

        assert result["crops_lost"] == 1


class TestReactNode:
    @pytest.mark.asyncio
    async def test_react_node(self, sample_greenhouse, mock_llm_react_response):
        """react_node should query KB and call LLM."""
        with (
            patch("backend.nodes.react.bedrock_client") as mock_llm,
            patch("backend.nodes.react.kb_client") as mock_kb,
        ):
            mock_llm.call = AsyncMock(return_value=mock_llm_react_response)
            mock_kb.query_operational_scenario = AsyncMock(return_value="Water guidance")

            from backend.nodes.react import react_node

            state = {
                "greenhouse": sample_greenhouse,
                "strategy_doc": "# Strategy",
                "sim_result": {
                    "stop_reason": {
                        "type": "event_fired",
                        "event": {"type": "water_leak", "severity": 0.7, "details": "Pipe burst"},
                    },
                },
                "agent_decisions": [],
            }
            result = await react_node(state)

        mock_llm.call.assert_awaited_once()
        assert len(result["agent_decisions"]) == 1
        decision = result["agent_decisions"][0]
        assert decision.node == "react"
        assert "Water leak" in decision.reasoning
        assert result["sim_result"]["plan_horizon"] == 10


class TestReflectNode:
    @pytest.mark.asyncio
    async def test_reflect_node(self, sample_greenhouse, mock_llm_reflect_response):
        """reflect_node should call LLM and save strategy."""
        with (
            patch("backend.nodes.reflect.bedrock_client") as mock_llm,
            patch("backend.nodes.reflect.strategy_store") as mock_strategy,
        ):
            mock_llm.call = AsyncMock(return_value=mock_llm_reflect_response)
            mock_strategy.write = MagicMock()

            from backend.nodes.reflect import reflect_node

            state = {
                "greenhouse": sample_greenhouse,
                "strategy_doc": "# Old Strategy",
                "calorie_fractions": [0.10, 0.15, 0.20],
                "protein_fractions": [0.05, 0.08, 0.10],
                "micronutrient_counts": [3, 4, 5],
                "total_harvested_kg": 200.0,
                "crops_lost": 1,
                "agent_decisions": [],
            }
            result = await reflect_node(state)

        mock_llm.call.assert_awaited_once()
        mock_strategy.write.assert_called_once_with("# Updated Strategy\n\nPlant more potatoes early.")
        assert result["strategy_doc"] == "# Updated Strategy\n\nPlant more potatoes early."

"""Tests for FastAPI endpoints."""
import json
import pytest
from pathlib import Path
from unittest.mock import patch, AsyncMock, MagicMock

from fastapi.testclient import TestClient

from src.main import app
from src.models.state import (
    SimulationMetrics,
    SimulationResult,
    GreenhouseState,
)


@pytest.fixture
def client():
    return TestClient(app)


class TestRootEndpoint:
    def test_health_check(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "mars-greenhouse-agent"


class TestTrainingRunEndpoint:
    def test_run_training(self, client, sample_greenhouse):
        """POST /api/training/run should invoke graph and return metrics."""
        gh_final = sample_greenhouse.model_copy(update={"day": 450})

        final_state = {
            "greenhouse": gh_final,
            "strategy_doc": "# New Strategy",
            "daily_snapshots": [],
            "agent_decisions": [],
            "calorie_fractions": [0.10, 0.15],
            "protein_fractions": [0.05, 0.08],
            "micronutrient_counts": [3, 4],
            "total_harvested_kg": 300.0,
            "crops_lost": 2,
        }

        with (
            patch("src.main.graph") as mock_graph,
            patch("src.main.strategy_store") as mock_strategy,
            patch("src.main._save_simulation_result"),
        ):
            mock_graph.ainvoke = AsyncMock(return_value=final_state)
            mock_strategy.read.return_value = "# Old Strategy"

            response = client.post(
                "/api/training/run",
                json={"inject_events": []},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert "id" in data
        assert "metrics" in data
        assert data["metrics"]["total_harvested_kg"] == 300.0

    def test_run_training_error(self, client):
        """POST /api/training/run should return 500 on graph error."""
        with (
            patch("src.main.graph") as mock_graph,
            patch("src.main.strategy_store") as mock_strategy,
        ):
            mock_graph.ainvoke = AsyncMock(side_effect=RuntimeError("LLM failed"))
            mock_strategy.read.return_value = "# Strategy"

            response = client.post(
                "/api/training/run",
                json={},
            )

        assert response.status_code == 500


class TestListSimulationsEndpoint:
    def test_list_empty(self, client, tmp_path):
        with patch("src.main.settings") as mock_settings:
            mock_settings.simulations_dir = str(tmp_path / "empty_sims")
            response = client.get("/api/simulations")

        assert response.status_code == 200
        assert response.json() == []

    def test_list_with_results(self, client, tmp_path):
        sim_dir = tmp_path / "sims"
        sim_dir.mkdir()

        metrics = {
            "avg_calorie_gh_fraction": 0.15,
            "avg_protein_gh_fraction": 0.10,
            "avg_micronutrient_coverage": 4.5,
            "total_harvested_kg": 500.0,
            "crops_lost": 3,
            "stored_food_remaining_pct": 60.0,
            "resource_efficiency": 0.85,
            "events_handled": 2,
        }
        sim_data = {
            "id": "test-sim-1",
            "daily_snapshots": [],
            "agent_decisions": [],
            "events": [],
            "final_metrics": metrics,
            "strategy_doc_before": "before",
            "strategy_doc_after": "after",
        }

        (sim_dir / "test-sim-1.json").write_text(json.dumps(sim_data))

        with patch("src.main.settings") as mock_settings:
            mock_settings.simulations_dir = str(sim_dir)
            response = client.get("/api/simulations")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == "test-sim-1"


class TestGetSimulationEndpoint:
    def test_get_existing(self, client, tmp_path):
        sim_dir = tmp_path / "sims"
        sim_dir.mkdir()

        metrics = {
            "avg_calorie_gh_fraction": 0.15,
            "avg_protein_gh_fraction": 0.10,
            "avg_micronutrient_coverage": 4.5,
            "total_harvested_kg": 500.0,
            "crops_lost": 3,
            "stored_food_remaining_pct": 60.0,
            "resource_efficiency": 0.85,
            "events_handled": 2,
        }
        sim_data = {
            "id": "test-sim-1",
            "daily_snapshots": [],
            "agent_decisions": [],
            "events": [],
            "final_metrics": metrics,
            "strategy_doc_before": "before",
            "strategy_doc_after": "after",
        }

        (sim_dir / "test-sim-1.json").write_text(json.dumps(sim_data))

        with patch("src.main.settings") as mock_settings:
            mock_settings.simulations_dir = str(sim_dir)
            response = client.get("/api/simulations/test-sim-1")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "test-sim-1"
        assert data["final_metrics"]["total_harvested_kg"] == 500.0

    def test_get_nonexistent(self, client, tmp_path):
        sim_dir = tmp_path / "sims"
        sim_dir.mkdir()

        with patch("src.main.settings") as mock_settings:
            mock_settings.simulations_dir = str(sim_dir)
            response = client.get("/api/simulations/nonexistent-id")

        assert response.status_code == 404


class TestGetStrategyEndpoint:
    def test_get_strategy(self, client):
        with patch("src.main.strategy_store") as mock_strategy:
            mock_strategy.read.return_value = "# Current Strategy\nPlant potatoes."

            response = client.get("/api/strategy")

        assert response.status_code == 200
        data = response.json()
        assert data["strategy_document"] == "# Current Strategy\nPlant potatoes."
        assert data["length"] == len("# Current Strategy\nPlant potatoes.")

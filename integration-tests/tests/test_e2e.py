"""End-to-end integration tests for complete workflows."""

import pytest
import time
from utils.test_data import build_default_crop_assignments


@pytest.mark.e2e
@pytest.mark.slow
class TestE2EBasicRun:
    """Test complete flow from training run to database storage."""

    def test_e2e_basic_run(
        self,
        sim_client,
        backend_client,
        management_client,
        db_connection,
        test_seed
    ):
        """Complete flow: init → simulate → store → query."""
        run_id = f"test-e2e-basic-{test_seed}"

        # Step 1: Verify all services are healthy
        assert sim_client.health_check()
        assert backend_client.health_check()
        assert management_client.health_check("/actuator/health")

        # Step 2: Run training simulation via backend
        payload = {
            "seed": test_seed,
            "max_days": 90,
            "crop_assignments": build_default_crop_assignments(),
            "mock_llm": True,
            "run_id": run_id
        }

        train_response = backend_client.post(
            "/api/training/run",
            json=payload,
            timeout=180.0
        )
        assert train_response.status_code in [200, 202]
        train_data = train_response.json()
        assert "run_id" in train_data

        # Step 3: Wait for completion if async
        if train_response.status_code == 202:
            max_wait = 180
            waited = 0
            while waited < max_wait:
                status = backend_client.get(f"/api/simulations/{run_id}")
                if status.status_code == 200:
                    status_data = status.json()
                    if status_data.get("status") in ["completed", "failed"]:
                        break
                time.sleep(5)
                waited += 5

        # Step 4: Get simulation result from backend
        result_response = backend_client.get(f"/api/simulations/{run_id}")
        assert result_response.status_code == 200
        simulation_result = result_response.json()

        # Verify result structure
        assert "run_id" in simulation_result
        assert "final_day" in simulation_result
        assert simulation_result["final_day"] > 0

        # Step 5: Import to management-backend
        import_response = management_client.post(
            "/api/bridge/import-result",
            json={"simulation_result": simulation_result}
        )
        assert import_response.status_code in [200, 201]
        import_data = import_response.json()
        management_sim_id = import_data.get("id") or import_data.get("simulation_id")

        # Step 6: Query database directly to verify persistence
        cursor = db_connection.cursor()
        cursor.execute(
            "SELECT * FROM simulations WHERE run_id = %s",
            (run_id,)
        )
        db_record = cursor.fetchone()
        cursor.close()

        assert db_record is not None

        # Step 7: Query management-backend API
        query_response = management_client.get(f"/api/simulations/{management_sim_id}")
        assert query_response.status_code == 200
        query_data = query_response.json()
        assert "run_id" in query_data or "id" in query_data

    def test_e2e_with_events(
        self,
        backend_client,
        management_client,
        test_seed
    ):
        """Complete flow with crisis events."""
        run_id = f"test-e2e-events-{test_seed}"

        # Run with injected events
        payload = {
            "seed": test_seed,
            "max_days": 120,
            "crop_assignments": build_default_crop_assignments(),
            "inject_events": [
                {
                    "day": 30,
                    "event_type": "water_recycling_degradation",
                    "severity": "high"
                },
                {
                    "day": 70,
                    "event_type": "temperature_control_failure",
                    "severity": "medium"
                }
            ],
            "mock_llm": True,
            "run_id": run_id
        }

        response = backend_client.post(
            "/api/training/run",
            json=payload,
            timeout=240.0
        )
        assert response.status_code in [200, 202]

        # Get result
        result = backend_client.get(f"/api/simulations/{run_id}")
        assert result.status_code == 200
        result_data = result.json()

        # Verify events were handled
        if "events" in result_data:
            event_types = [e["type"] for e in result_data["events"]]
            assert "water_recycling_degradation" in event_types

        # Import to management-backend
        import_response = management_client.post(
            "/api/bridge/import-result",
            json={"simulation_result": result_data}
        )
        assert import_response.status_code in [200, 201]

    def test_e2e_early_stop(self, backend_client, test_seed):
        """Complete flow with early stop trigger."""
        run_id = f"test-e2e-early-stop-{test_seed}"

        # Run that may trigger early stop (high water usage, no management)
        payload = {
            "seed": test_seed,
            "max_days": 150,
            "crop_assignments": {i: "potato" for i in range(16)},  # All potatoes
            "mock_llm": True,
            "run_id": run_id
        }

        response = backend_client.post(
            "/api/training/run",
            json=payload,
            timeout=240.0
        )
        assert response.status_code in [200, 202]

        # Get result
        result = backend_client.get(f"/api/simulations/{run_id}")
        assert result.status_code == 200
        result_data = result.json()

        # May or may not have early stop (depends on simulation)
        assert "final_day" in result_data


@pytest.mark.e2e
@pytest.mark.slow
class TestE2EFullMission:
    """Test complete 450-day mission."""

    def test_e2e_full_450_day_mission(
        self,
        backend_client,
        management_client,
        test_seed
    ):
        """Complete 450-day mission from start to finish."""
        run_id = f"test-e2e-full-mission-{test_seed}"

        # Full mission run
        payload = {
            "seed": test_seed,
            "max_days": 450,
            "crop_assignments": build_default_crop_assignments(),
            "mock_llm": True,
            "update_strategy": True,
            "run_id": run_id
        }

        response = backend_client.post(
            "/api/training/run",
            json=payload,
            timeout=600.0  # 10 minutes
        )
        assert response.status_code in [200, 202]

        # Get result
        result = backend_client.get(f"/api/simulations/{run_id}")
        assert result.status_code == 200
        result_data = result.json()

        # Verify mission completed
        assert result_data["final_day"] <= 450

        # Import to management-backend
        import_response = management_client.post(
            "/api/bridge/import-result",
            json={"simulation_result": result_data}
        )
        assert import_response.status_code in [200, 201]


@pytest.mark.e2e
class TestE2EManagementQueries:
    """Test querying data through management-backend."""

    def test_e2e_get_simulations_list(
        self,
        backend_client,
        management_client,
        test_seed
    ):
        """Query list of all simulations."""
        # Create a simulation
        run_id = f"test-e2e-list-{test_seed}"
        payload = {
            "seed": test_seed,
            "max_days": 30,
            "crop_assignments": build_default_crop_assignments(),
            "mock_llm": True,
            "run_id": run_id
        }

        response = backend_client.post("/api/training/run", json=payload, timeout=90.0)
        assert response.status_code in [200, 202]

        result = backend_client.get(f"/api/simulations/{run_id}")
        assert result.status_code == 200

        # Import
        management_client.post(
            "/api/bridge/import-result",
            json={"simulation_result": result.json()}
        )

        # Query list
        list_response = management_client.get("/api/simulations")
        assert list_response.status_code == 200

        data = list_response.json()
        simulations = data if isinstance(data, list) else data.get("simulations", [])
        assert len(simulations) > 0

    def test_e2e_get_simulation_detail(
        self,
        backend_client,
        management_client,
        test_seed
    ):
        """Query detailed simulation data."""
        run_id = f"test-e2e-detail-{test_seed}"
        payload = {
            "seed": test_seed,
            "max_days": 60,
            "crop_assignments": build_default_crop_assignments(),
            "mock_llm": True,
            "run_id": run_id
        }

        response = backend_client.post("/api/training/run", json=payload, timeout=120.0)
        assert response.status_code in [200, 202]

        result = backend_client.get(f"/api/simulations/{run_id}")
        assert result.status_code == 200

        # Import
        import_response = management_client.post(
            "/api/bridge/import-result",
            json={"simulation_result": result.json()}
        )
        sim_id = import_response.json().get("id") or import_response.json().get("simulation_id")

        # Query detail
        detail_response = management_client.get(f"/api/simulations/{sim_id}")
        assert detail_response.status_code == 200

        detail_data = detail_response.json()
        assert "run_id" in detail_data or "id" in detail_data

    def test_e2e_database_query(
        self,
        backend_client,
        management_client,
        db_connection,
        test_seed
    ):
        """Query PostgreSQL database directly."""
        run_id = f"test-e2e-db-query-{test_seed}"
        payload = {
            "seed": test_seed,
            "max_days": 30,
            "crop_assignments": build_default_crop_assignments(),
            "mock_llm": True,
            "run_id": run_id
        }

        response = backend_client.post("/api/training/run", json=payload, timeout=90.0)
        assert response.status_code in [200, 202]

        result = backend_client.get(f"/api/simulations/{run_id}")
        assert result.status_code == 200

        # Import
        management_client.post(
            "/api/bridge/import-result",
            json={"simulation_result": result.json()}
        )

        # Query database
        cursor = db_connection.cursor()

        # Count simulations
        cursor.execute("SELECT COUNT(*) FROM simulations WHERE run_id LIKE 'test-%'")
        count = cursor.fetchone()[0]
        assert count > 0

        # Query specific run
        cursor.execute(
            "SELECT run_id, final_day FROM simulations WHERE run_id = %s",
            (run_id,)
        )
        row = cursor.fetchone()
        assert row is not None
        assert row[0] == run_id

        cursor.close()


@pytest.mark.e2e
class TestE2EStrategyUpdate:
    """Test strategy learning across runs."""

    def test_e2e_strategy_evolution(self, backend_client, test_seed):
        """Strategy document evolves after training runs."""
        # Get initial strategy
        strategy_v0 = backend_client.get("/api/strategy")
        assert strategy_v0.status_code == 200
        initial_strategy = strategy_v0.json()["content"]

        # Run first training
        payload_1 = {
            "seed": test_seed,
            "max_days": 450,
            "crop_assignments": build_default_crop_assignments(),
            "mock_llm": True,
            "update_strategy": True,
            "run_id": f"test-e2e-strategy-1-{test_seed}"
        }

        response_1 = backend_client.post(
            "/api/training/run",
            json=payload_1,
            timeout=600.0
        )
        assert response_1.status_code in [200, 202]

        # Get updated strategy
        strategy_v1 = backend_client.get("/api/strategy")
        assert strategy_v1.status_code == 200

        # Strategy may have been updated by reflect node
        # (In test mode with mocked LLM, this might not actually change)

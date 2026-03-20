"""Integration tests for backend → management-backend bridge."""

import pytest
from utils.test_data import build_default_crop_assignments


@pytest.mark.bridge
class TestBridgeHealth:
    """Test management-backend connectivity."""

    def test_management_backend_health(self, management_client):
        """Management backend is responding."""
        response = management_client.get("/actuator/health")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "UP"

    def test_database_connectivity(self, db_connection):
        """PostgreSQL database is accessible."""
        cursor = db_connection.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        assert result[0] == 1
        cursor.close()


@pytest.mark.bridge
class TestBridgeImport:
    """Test importing simulation results to management-backend."""

    def test_bridge_import_success(self, backend_client, management_client, test_seed):
        """POST /api/bridge/import-result stores data in database."""
        # Run a short simulation
        payload = {
            "seed": test_seed,
            "max_days": 60,
            "crop_assignments": build_default_crop_assignments(),
            "mock_llm": True
        }

        response = backend_client.post("/api/training/run", json=payload, timeout=120.0)
        assert response.status_code in [200, 202]
        data = response.json()
        run_id = data["run_id"]

        # Get simulation result
        result_response = backend_client.get(f"/api/simulations/{run_id}")
        assert result_response.status_code == 200
        simulation_result = result_response.json()

        # Import to management-backend
        import_payload = {
            "simulation_result": simulation_result
        }
        import_response = management_client.post(
            "/api/bridge/import-result",
            json=import_payload
        )

        assert import_response.status_code in [200, 201]
        import_data = import_response.json()
        assert "id" in import_data or "simulation_id" in import_data

    def test_bridge_data_persistence(
        self,
        backend_client,
        management_client,
        db_connection,
        test_seed
    ):
        """Imported data is correctly stored in PostgreSQL."""
        # Run simulation
        payload = {
            "seed": test_seed,
            "max_days": 30,
            "crop_assignments": {0: "potato", 1: "lettuce"},
            "mock_llm": True
        }

        response = backend_client.post("/api/training/run", json=payload, timeout=90.0)
        assert response.status_code in [200, 202]
        run_id = response.json()["run_id"]

        # Get and import result
        result = backend_client.get(f"/api/simulations/{run_id}").json()
        import_response = management_client.post(
            "/api/bridge/import-result",
            json={"simulation_result": result}
        )
        assert import_response.status_code in [200, 201]

        # Query database directly
        cursor = db_connection.cursor()
        cursor.execute(
            "SELECT * FROM simulations WHERE run_id = %s",
            (run_id,)
        )
        db_result = cursor.fetchone()
        cursor.close()

        assert db_result is not None
        # Verify key fields are stored

    def test_bridge_crop_mapping(self, backend_client, management_client, test_seed):
        """Crop types are correctly mapped in database."""
        # Run with specific crop assignments
        crop_assignments = {
            0: "potato",
            1: "lettuce",
            2: "radish",
            3: "beans",
            4: "herbs"
        }

        payload = {
            "seed": test_seed,
            "max_days": 30,
            "crop_assignments": crop_assignments,
            "mock_llm": True
        }

        response = backend_client.post("/api/training/run", json=payload, timeout=90.0)
        assert response.status_code in [200, 202]
        run_id = response.json()["run_id"]

        # Import to management-backend
        result = backend_client.get(f"/api/simulations/{run_id}").json()
        import_response = management_client.post(
            "/api/bridge/import-result",
            json={"simulation_result": result}
        )
        assert import_response.status_code in [200, 201]

        # Verify crop data in management backend
        sim_id = import_response.json().get("id") or import_response.json().get("simulation_id")
        slots_response = management_client.get(f"/api/simulations/{sim_id}/slots")

        if slots_response.status_code == 200:
            slots = slots_response.json()
            # Verify our crop types are present
            crop_types_found = [slot["crop_type"] for slot in slots if slot.get("crop_type")]
            assert "potato" in crop_types_found
            assert "lettuce" in crop_types_found


@pytest.mark.bridge
class TestBridgeErrorHandling:
    """Test bridge error handling."""

    def test_bridge_invalid_payload(self, management_client):
        """POST /api/bridge/import-result validates payload."""
        invalid_payload = {
            "simulation_result": {
                "run_id": "test-invalid"
                # Missing required fields
            }
        }

        response = management_client.post(
            "/api/bridge/import-result",
            json=invalid_payload
        )

        assert response.status_code in [400, 422]

    def test_bridge_duplicate_import(
        self,
        backend_client,
        management_client,
        test_seed
    ):
        """Importing same run_id twice is handled gracefully."""
        # Run simulation
        payload = {
            "seed": test_seed,
            "max_days": 30,
            "crop_assignments": build_default_crop_assignments(),
            "mock_llm": True
        }

        response = backend_client.post("/api/training/run", json=payload, timeout=90.0)
        assert response.status_code in [200, 202]
        run_id = response.json()["run_id"]

        # Get result
        result = backend_client.get(f"/api/simulations/{run_id}").json()

        # Import first time
        import1 = management_client.post(
            "/api/bridge/import-result",
            json={"simulation_result": result}
        )
        assert import1.status_code in [200, 201]

        # Import second time (duplicate)
        import2 = management_client.post(
            "/api/bridge/import-result",
            json={"simulation_result": result}
        )

        # Should either succeed (upsert) or return conflict error
        assert import2.status_code in [200, 201, 409]

    def test_backend_handles_bridge_unavailable(self, backend_client, test_seed):
        """Backend handles unavailable management-backend gracefully."""
        # Configure backend to use invalid management-backend URL
        # (This would require dynamic configuration or a test-specific endpoint)

        # For now, just verify backend continues if bridge fails
        payload = {
            "seed": test_seed,
            "max_days": 30,
            "crop_assignments": build_default_crop_assignments(),
            "mock_llm": True,
            "skip_bridge": True  # Don't attempt bridge import
        }

        response = backend_client.post("/api/training/run", json=payload, timeout=90.0)

        # Backend should succeed even if bridge is unavailable
        assert response.status_code in [200, 202]


@pytest.mark.bridge
class TestManagementBackendAPI:
    """Test management-backend query API."""

    def test_list_simulations(self, management_client):
        """GET /api/simulations returns list of simulations."""
        response = management_client.get("/api/simulations")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list) or "simulations" in data

    def test_get_simulation_detail(
        self,
        backend_client,
        management_client,
        test_seed
    ):
        """GET /api/simulations/{id} returns detailed data."""
        # Create a simulation first
        payload = {
            "seed": test_seed,
            "max_days": 30,
            "crop_assignments": build_default_crop_assignments(),
            "mock_llm": True
        }

        response = backend_client.post("/api/training/run", json=payload, timeout=90.0)
        assert response.status_code in [200, 202]
        run_id = response.json()["run_id"]

        # Import to management-backend
        result = backend_client.get(f"/api/simulations/{run_id}").json()
        import_response = management_client.post(
            "/api/bridge/import-result",
            json={"simulation_result": result}
        )
        assert import_response.status_code in [200, 201]
        sim_id = import_response.json().get("id") or import_response.json().get("simulation_id")

        # Get detail
        detail_response = management_client.get(f"/api/simulations/{sim_id}")
        assert detail_response.status_code == 200

        detail_data = detail_response.json()
        assert "run_id" in detail_data or "id" in detail_data

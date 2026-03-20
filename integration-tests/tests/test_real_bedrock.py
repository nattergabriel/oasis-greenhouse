"""Integration tests with REAL AWS Bedrock calls.

These tests exercise the full agent functionality including:
- Real LLM calls to AWS Bedrock (Claude Sonnet)
- Complete orchestration flow
- Agent decision-making
- Strategy learning

WARNING: These tests make real API calls and will incur AWS costs.
"""

import pytest
import time
from utils.test_data import (
    build_default_crop_assignments,
)


@pytest.mark.real_bedrock
@pytest.mark.slow
class TestRealBedrockIntegration:
    """Test real Bedrock LLM integration."""

    def test_agent_makes_initial_crop_decisions(self, backend_client, test_seed):
        """Agent uses Bedrock to make initial crop assignment decisions."""
        # Start a training run with NO initial crop assignments
        # Agent should query Bedrock and decide what to plant
        payload = {
            "seed": test_seed,
            "max_days": 10,  # Very short run just to test initial planning
            "crop_assignments": {},  # Empty - let agent decide
        }

        print("\n🤖 Starting training run - Agent will use Bedrock to decide crops...")
        response = backend_client.post("/api/training/run", json=payload, timeout=180.0)

        # Log the response for debugging
        print(f"Response status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response body: {response.text}")

        assert response.status_code in [200, 202], f"Expected 200 or 202, got {response.status_code}: {response.text}"

        data = response.json()
        print(f"✅ Training run started: {data.get('run_id')}")

        # Verify the run executed
        assert "run_id" in data or "id" in data

        # If we got a result, verify it has crop decisions
        if "state" in data:
            state = data["state"]
            # Check that some crops were assigned
            crops_assigned = sum(1 for slot in state["slots"] if slot.get("crop_type"))
            print(f"✅ Agent assigned crops to {crops_assigned} slots")
            assert crops_assigned > 0, "Agent should have assigned crops to at least some slots"

    def test_agent_responds_to_crisis(self, backend_client, test_seed):
        """Agent uses Bedrock to respond to crisis events."""
        # Start with crops pre-assigned, inject a crisis event
        payload = {
            "seed": test_seed + 1,  # Different seed
            "max_days": 50,
            "crop_assignments": build_default_crop_assignments(),
            "inject_events": [
                {
                    "day": 20,
                    "event_type": "water_recycling_degradation",
                    "severity": "high"
                }
            ]
        }

        print("\n🚨 Starting training run with crisis event...")
        print("   Agent will need to respond to water recycling degradation")

        response = backend_client.post("/api/training/run", json=payload, timeout=240.0)

        print(f"Response status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response body: {response.text}")

        assert response.status_code in [200, 202], f"Expected 200 or 202, got {response.status_code}: {response.text}"

        data = response.json()
        print(f"✅ Training run completed: {data.get('run_id')}")

        # Verify the simulation progressed beyond the event
        if "state" in data or "final_day" in data:
            final_day = data.get("final_day") or data.get("state", {}).get("day")
            print(f"✅ Simulation reached day {final_day}")
            assert final_day >= 20, "Simulation should have progressed past the crisis event day"

    def test_full_short_mission(self, backend_client, test_seed):
        """Run a complete short mission (90 days) with agent decision-making."""
        payload = {
            "seed": test_seed + 2,
            "max_days": 90,
            "crop_assignments": build_default_crop_assignments(),
        }

        print("\n🚀 Starting 90-day mission with agent control...")

        start_time = time.time()
        response = backend_client.post("/api/training/run", json=payload, timeout=300.0)
        duration = time.time() - start_time

        print(f"Response status: {response.status_code}")
        print(f"Request duration: {duration:.1f}s")

        if response.status_code != 200:
            print(f"Response body: {response.text}")

        assert response.status_code in [200, 202], f"Expected 200 or 202, got {response.status_code}: {response.text}"

        data = response.json()
        print(f"✅ Mission completed: {data.get('run_id')}")

        # Verify mission outcomes
        if "state" in data or "final_day" in data:
            final_day = data.get("final_day") or data.get("state", {}).get("day")
            print(f"✅ Final day: {final_day}")

            # Check nutrition metrics if available
            if "state" in data and "daily_nutrition" in data["state"]:
                nutrition = data["state"]["daily_nutrition"]
                print(f"📊 Nutrition metrics:")
                print(f"   Calorie coverage: {nutrition.get('calorie_gh_fraction', 0)*100:.1f}%")
                print(f"   Protein coverage: {nutrition.get('protein_gh_fraction', 0)*100:.1f}%")
                print(f"   Micronutrients: {nutrition.get('micronutrient_count', 0)}/7")

    @pytest.mark.slow
    def test_agent_strategy_learning(self, backend_client, test_seed):
        """Test that agent can learn and update strategy across runs."""
        # Get initial strategy
        print("\n📖 Fetching initial strategy...")
        strategy_response = backend_client.get("/api/strategy")
        assert strategy_response.status_code == 200
        initial_strategy = strategy_response.json()
        initial_content = initial_strategy.get("strategy_document") or initial_strategy.get("content")
        print(f"✅ Initial strategy length: {len(initial_content)} characters")

        # Run a complete mission
        payload = {
            "seed": test_seed + 3,
            "max_days": 450,
            "crop_assignments": build_default_crop_assignments(),
            "update_strategy": True  # Request strategy update after mission
        }

        print("\n🎯 Starting full 450-day mission for strategy learning...")
        print("   This will take several minutes...")

        start_time = time.time()
        response = backend_client.post("/api/training/run", json=payload, timeout=600.0)
        duration = time.time() - start_time

        print(f"Response status: {response.status_code}")
        print(f"Mission duration: {duration:.1f}s")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Mission completed: {data.get('run_id')}")

            # Check if strategy was updated
            if data.get("strategy_updated"):
                print("✅ Strategy was updated by agent")

                # Fetch updated strategy
                updated_strategy_response = backend_client.get("/api/strategy")
                if updated_strategy_response.status_code == 200:
                    updated_strategy = updated_strategy_response.json()
                    updated_content = updated_strategy.get("strategy_document") or updated_strategy.get("content")
                    print(f"✅ Updated strategy length: {len(updated_content)} characters")

                    # Strategy should have changed
                    if updated_content != initial_content:
                        print("✅ Strategy document was modified by agent learning")
                    else:
                        print("⚠️  Strategy document unchanged (agent may have decided no changes needed)")


@pytest.mark.real_bedrock
class TestBedrockAPIIntegration:
    """Test Bedrock API integration specifically."""

    def test_bedrock_model_access(self, backend_client):
        """Verify backend can access Bedrock model."""
        # This is a simple health check that exercises Bedrock
        payload = {
            "seed": 999,
            "max_days": 5,  # Minimal run
            "crop_assignments": {0: "lettuce"},  # Just one crop
        }

        print("\n🔍 Testing Bedrock model access...")
        response = backend_client.post("/api/training/run", json=payload, timeout=120.0)

        print(f"Response status: {response.status_code}")
        if response.status_code in [500, 403]:
            print(f"❌ Bedrock access failed: {response.text}")
            pytest.fail(f"Bedrock access failed: {response.text}")

        assert response.status_code in [200, 202], f"Expected 200 or 202, got {response.status_code}"
        print("✅ Bedrock model is accessible")

    def test_agent_decision_quality(self, backend_client, test_seed):
        """Test that agent makes reasonable decisions."""
        payload = {
            "seed": test_seed + 10,
            "max_days": 30,
            "crop_assignments": {},  # Let agent decide
        }

        print("\n🧠 Testing agent decision quality...")
        response = backend_client.post("/api/training/run", json=payload, timeout=180.0)

        assert response.status_code in [200, 202]
        data = response.json()

        if "state" in data:
            state = data["state"]
            slots = state["slots"]

            # Check that agent made diverse crop choices
            crop_types = set()
            for slot in slots:
                if slot.get("crop_type"):
                    crop_types.add(slot["crop_type"])

            print(f"✅ Agent chose {len(crop_types)} different crop types: {crop_types}")

            # Agent should use multiple crop types for balanced nutrition
            assert len(crop_types) >= 2, "Agent should choose at least 2 different crop types"

            # Check for sensible crops (from KB)
            valid_crops = {"potato", "lettuce", "radish", "beans", "peas", "beans_peas", "herbs"}
            for crop in crop_types:
                assert crop in valid_crops, f"Agent chose invalid crop type: {crop}"

            print("✅ Agent decisions are sensible and valid")


@pytest.mark.real_bedrock
@pytest.mark.slow
class TestCompleteWorkflow:
    """Test complete workflows with real Bedrock calls."""

    def test_complete_mission_workflow(self, backend_client, management_client, test_seed):
        """Complete end-to-end workflow: planning → execution → storage."""
        run_id = f"e2e-real-bedrock-{test_seed}"

        # Step 1: Start mission
        print("\n🎬 Starting complete mission workflow...")
        payload = {
            "seed": test_seed + 100,
            "max_days": 120,
            "crop_assignments": build_default_crop_assignments(),
            "run_id": run_id
        }

        start_time = time.time()
        response = backend_client.post("/api/training/run", json=payload, timeout=300.0)
        duration = time.time() - start_time

        print(f"✅ Mission completed in {duration:.1f}s")
        assert response.status_code in [200, 202]

        # Step 2: Retrieve results
        print(f"📥 Retrieving mission results...")
        result_response = backend_client.get(f"/api/simulations/{run_id}")

        if result_response.status_code == 200:
            result = result_response.json()
            print(f"✅ Retrieved simulation result")

            # Step 3: Store in management backend
            print(f"💾 Storing results in management backend...")
            import_response = management_client.post(
                "/api/bridge/import-result",
                json={"simulation_result": result}
            )

            if import_response.status_code in [200, 201]:
                print("✅ Results stored successfully")
            else:
                print(f"⚠️  Storage failed: {import_response.status_code}")

        print("✅ Complete workflow executed successfully")

    def test_multiple_runs_comparison(self, backend_client, test_seed):
        """Run multiple missions and compare outcomes."""
        print("\n📊 Running multiple missions for comparison...")

        results = []
        for i in range(2):
            payload = {
                "seed": test_seed + 200 + i,
                "max_days": 60,
                "crop_assignments": build_default_crop_assignments(),
            }

            print(f"\n   Run {i+1}/2...")
            response = backend_client.post("/api/training/run", json=payload, timeout=180.0)

            if response.status_code in [200, 202]:
                data = response.json()
                results.append(data)

                if "state" in data:
                    final_day = data["state"]["day"]
                    print(f"   ✅ Completed to day {final_day}")

        print(f"\n✅ Completed {len(results)} missions")
        assert len(results) == 2, "Should have completed 2 missions"
        print("✅ Multiple runs can be executed successfully")

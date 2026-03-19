"""Shared fixtures for Mars Greenhouse tests."""
import pytest
from backend.models.state import (
    Crop,
    Zone,
    GreenhouseState,
    EnvironmentState,
    Resources,
    MarsConditions,
    FoodSupply,
    StoredFood,
    DailyNutrition,
    AgentAction,
    DailySnapshot,
    SimulationMetrics,
    SimEngineConfig,
)


# ---------------------------------------------------------------------------
# Domain model fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_crop():
    return Crop(
        id="potato-z1-1",
        type="potato",
        zone_id=1,
        footprint_m2=2.0,
        planted_day=0,
        age=10,
        health=95.0,
        growth=30.0,
    )


@pytest.fixture
def sample_crop_stressed():
    return Crop(
        id="lettuce-z2-1",
        type="lettuce",
        zone_id=2,
        footprint_m2=0.5,
        planted_day=5,
        age=5,
        health=40.0,
        growth=10.0,
        active_stress="drought",
    )


@pytest.fixture
def sample_zone(sample_crop):
    return Zone(
        id=1,
        area_m2=15.0,
        crops=[sample_crop],
        artificial_light=True,
        water_allocation=1.0,
        crop_plan={"potato": 0.6, "beans_peas": 0.4},
    )


@pytest.fixture
def sample_environment():
    return EnvironmentState(
        solar_hours=6.0,
        outside_temp=-60.0,
        internal_temp=22.0,
        energy_generated=500.0,
        energy_needed=450.0,
        energy_deficit=0.0,
    )


@pytest.fixture
def sample_resources():
    return Resources(
        water=8000.0,
        nutrients=4000.0,
        water_recycling_efficiency=0.90,
        nutrient_recycling_efficiency=0.70,
    )


@pytest.fixture
def sample_mars():
    return MarsConditions(solar_hours=6.0, outside_temp=-60.0)


@pytest.fixture
def sample_food_supply():
    return FoodSupply(
        total_kg=0.0,
        total_kcal=0.0,
        total_protein_g=0.0,
        by_type={},
    )


@pytest.fixture
def sample_stored_food():
    return StoredFood(total_calories=5_400_000.0, remaining_calories=5_400_000.0)


@pytest.fixture
def sample_daily_nutrition():
    return DailyNutrition(
        calorie_gh_fraction=0.0,
        protein_gh_fraction=0.0,
        micronutrients_covered=[],
        micronutrient_count=0,
        stored_food_remaining=5_400_000.0,
        stored_food_days_left=450.0,
    )


@pytest.fixture
def sample_greenhouse(
    sample_zone,
    sample_environment,
    sample_resources,
    sample_mars,
    sample_food_supply,
    sample_stored_food,
    sample_daily_nutrition,
):
    """A complete GreenhouseState with one zone."""
    return GreenhouseState(
        mission_day=0,
        zones=[sample_zone],
        environment=sample_environment,
        resources=sample_resources,
        mars=sample_mars,
        food_supply=sample_food_supply,
        stored_food=sample_stored_food,
        daily_nutrition=sample_daily_nutrition,
        active_events=[],
    )


# ---------------------------------------------------------------------------
# Mock response fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_sim_init_response(sample_greenhouse):
    """Sim engine /simulate/init response JSON-serialisable dict."""
    return sample_greenhouse.model_dump()


@pytest.fixture
def mock_sim_tick_response(sample_greenhouse):
    """Sim engine /simulate/tick response dict."""
    gh = sample_greenhouse.model_copy(update={"mission_day": 30})
    return {
        "final_state": gh.model_dump(),
        "days_simulated": 30,
        "stopped_early": False,
        "stop_reason": {},
        "daily_log": [],
    }


@pytest.fixture
def mock_llm_plan_response():
    return {
        "reasoning": "We should plant more potatoes",
        "actions": [
            {"action": "set_zone_plan", "zone_id": 1, "plan": {"potato": 0.7, "beans_peas": 0.3}},
        ],
    }


@pytest.fixture
def mock_llm_react_response():
    return {
        "diagnosis": "Water leak detected",
        "immediate_actions": [
            {"action": "water_adjust", "zone_id": 1, "value": 0.8},
        ],
        "monitoring_plan": "Check water levels daily",
        "revised_plan_horizon": 10,
    }


@pytest.fixture
def mock_llm_reflect_response():
    return {
        "strategy_document": "# Updated Strategy\n\nPlant more potatoes early."
    }

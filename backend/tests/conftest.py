"""Shared fixtures for Mars Greenhouse tests."""
import pytest
from backend.models.state import (
    Crop,
    Slot,
    GreenhouseState,
    EnvironmentState,
    Resources,
    FoodSupply,
    StoredFood,
    DailyNutrition,
    Metrics,
    AgentAction,
    DailySnapshot,
    SimulationMetrics,
)


# ---------------------------------------------------------------------------
# Domain model fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_crop():
    return Crop(
        id="potato-s0-1",
        type="potato",
        slot_id=0,
        footprint_m2=2.0,
        planted_day=0,
        age=10,
        health=95.0,
        growth=30.0,
        growth_cycle_days=90,
    )


@pytest.fixture
def sample_crop_stressed():
    return Crop(
        id="lettuce-s1-1",
        type="lettuce",
        slot_id=1,
        footprint_m2=0.5,
        planted_day=5,
        age=5,
        health=40.0,
        growth=10.0,
        active_stress="drought",
        growth_cycle_days=37,
    )


@pytest.fixture
def sample_slot(sample_crop):
    return Slot(
        id=0,
        row=0,
        col=0,
        area_m2=4.0,
        crop_type="potato",
        crops=[sample_crop],
        artificial_light=True,
        water_allocation=1.0,
    )


@pytest.fixture
def sample_environment():
    return EnvironmentState(
        solar_hours=6.0,
        outside_temp=-60.0,
        internal_temp=22.0,
        target_temp=22.0,
        co2_level=1000.0,
        co2_event_active=False,
        energy_generated=500.0,
        energy_needed=450.0,
        energy_deficit=0.0,
        light_penalty=0.0,
    )


@pytest.fixture
def sample_resources():
    return Resources(
        water=8000.0,
        nutrients=4000.0,
        water_recycling_rate=0.90,
        water_availability=1.0,
    )


@pytest.fixture
def sample_food_supply():
    return FoodSupply(items={})


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
        gh_kcal=0.0,
        gh_protein_g=0.0,
        stored_kcal_consumed=0.0,
    )


@pytest.fixture
def sample_greenhouse(
    sample_slot,
    sample_environment,
    sample_resources,
    sample_food_supply,
    sample_stored_food,
    sample_daily_nutrition,
):
    """A complete GreenhouseState with one slot."""
    return GreenhouseState(
        day=0,
        slots=[sample_slot],
        environment=sample_environment,
        resources=sample_resources,
        food_supply=sample_food_supply,
        stored_food=sample_stored_food,
        daily_nutrition=sample_daily_nutrition,
        active_events=[],
        metrics=Metrics(),
        next_crop_id=1,
        seed=42,
        consecutive_energy_deficit_days=0,
    )


# ---------------------------------------------------------------------------
# Mock response fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_sim_init_response(sample_greenhouse):
    """Sim engine /simulate/init response JSON-serialisable dict."""
    return {
        "state": sample_greenhouse.model_dump(),
        "daily_logs": [],
        "days_simulated": 0,
        "stopped_early": False,
        "stop_reason": None,
    }


@pytest.fixture
def mock_sim_tick_response(sample_greenhouse):
    """Sim engine /simulate/tick response dict."""
    gh = sample_greenhouse.model_copy(update={"day": 30})
    return {
        "state": gh.model_dump(),
        "daily_logs": [],
        "days_simulated": 30,
        "stopped_early": False,
        "stop_reason": None,
    }


@pytest.fixture
def mock_llm_plan_response():
    return {
        "reasoning": "We should plant more potatoes",
        "actions": [
            {"action": "set_crop", "slot_id": 0, "crop_type": "potato"},
        ],
    }


@pytest.fixture
def mock_llm_react_response():
    return {
        "diagnosis": "Water recycling degradation detected",
        "immediate_actions": [
            {"action": "water_adjust", "slot_id": 0, "multiplier": 0.8},
        ],
        "monitoring_plan": "Check water levels daily",
        "revised_plan_horizon": 10,
    }


@pytest.fixture
def mock_llm_reflect_response():
    return {
        "strategy_document": "# Updated Strategy\n\nPlant more potatoes early."
    }

"""Tests for Pydantic domain models and TypedDicts."""
from backend.models.state import (
    Crop,
    Zone,
    GreenhouseState,
    AgentAction,
    DailySnapshot,
    SimulationMetrics,
    SimulationResult,
    AgentState,
    SimEngineConfig,
    EnvironmentState,
    Resources,
    MarsConditions,
    FoodSupply,
    StoredFood,
    DailyNutrition,
    Event,
    ZoneSnapshot,
    CropSnapshot,
)


class TestCrop:
    def test_creation(self, sample_crop):
        assert sample_crop.id == "potato-z1-1"
        assert sample_crop.type == "potato"
        assert sample_crop.zone_id == 1
        assert sample_crop.footprint_m2 == 2.0
        assert sample_crop.health == 95.0
        assert sample_crop.active_stress is None

    def test_with_stress(self, sample_crop_stressed):
        assert sample_crop_stressed.active_stress == "drought"
        assert sample_crop_stressed.health == 40.0


class TestZone:
    def test_used_area(self, sample_zone):
        # Zone has one crop with footprint 2.0
        assert sample_zone.used_area() == 2.0

    def test_available_area(self, sample_zone):
        assert sample_zone.available_area() == 15.0 - 2.0

    def test_empty_zone(self):
        z = Zone(id=2, area_m2=15.0)
        assert z.used_area() == 0.0
        assert z.available_area() == 15.0
        assert z.crops == []
        assert z.crop_plan == {}

    def test_multiple_crops(self):
        crops = [
            Crop(id="c1", type="potato", zone_id=1, footprint_m2=3.0, planted_day=0, age=0, health=100, growth=0),
            Crop(id="c2", type="lettuce", zone_id=1, footprint_m2=0.5, planted_day=0, age=0, health=100, growth=0),
        ]
        z = Zone(id=1, area_m2=15.0, crops=crops)
        assert z.used_area() == 3.5
        assert z.available_area() == 11.5


class TestGreenhouseState:
    def test_creation(self, sample_greenhouse):
        assert sample_greenhouse.mission_day == 0
        assert len(sample_greenhouse.zones) == 1
        assert sample_greenhouse.active_events == []

    def test_with_events(self, sample_greenhouse):
        event = Event(
            type="dust_storm",
            severity=0.7,
            day_triggered=10,
            duration=5,
            details="Major dust storm reducing solar output",
        )
        gh = sample_greenhouse.model_copy(update={"active_events": [event]})
        assert len(gh.active_events) == 1
        assert gh.active_events[0].type == "dust_storm"


class TestAgentAction:
    def test_creation(self):
        action = AgentAction(
            day=10,
            node="plan",
            reasoning="Need more protein",
            actions=[{"action": "set_zone_plan", "zone_id": 1}],
        )
        assert action.day == 10
        assert action.node == "plan"
        assert len(action.actions) == 1


class TestDailySnapshot:
    def test_creation(self):
        snap = DailySnapshot(
            mission_day=5,
            zones=[],
            environment=EnvironmentState(
                solar_hours=6, outside_temp=-60, internal_temp=22,
                energy_generated=500, energy_needed=450, energy_deficit=0,
            ),
            resources=Resources(water=8000, nutrients=4000),
            mars=MarsConditions(solar_hours=6, outside_temp=-60),
            food_supply=FoodSupply(),
            stored_food=StoredFood(total_calories=5_400_000, remaining_calories=5_400_000),
            daily_nutrition=DailyNutrition(),
            active_events=[],
        )
        assert snap.mission_day == 5


class TestSimulationMetrics:
    def test_creation(self):
        m = SimulationMetrics(
            avg_calorie_gh_fraction=0.15,
            avg_protein_gh_fraction=0.10,
            avg_micronutrient_coverage=4.5,
            total_harvested_kg=500.0,
            crops_lost=3,
            stored_food_remaining_pct=60.0,
            resource_efficiency=0.85,
            events_handled=2,
        )
        assert m.avg_calorie_gh_fraction == 0.15
        assert m.crops_lost == 3


class TestSimulationResult:
    def test_creation(self):
        metrics = SimulationMetrics(
            avg_calorie_gh_fraction=0.15,
            avg_protein_gh_fraction=0.10,
            avg_micronutrient_coverage=4.5,
            total_harvested_kg=500.0,
            crops_lost=3,
            stored_food_remaining_pct=60.0,
            resource_efficiency=0.85,
            events_handled=2,
        )
        result = SimulationResult(
            id="test-run-1",
            daily_snapshots=[],
            agent_decisions=[],
            events=[],
            final_metrics=metrics,
            strategy_doc_before="before",
            strategy_doc_after="after",
        )
        assert result.id == "test-run-1"
        assert result.strategy_doc_before == "before"


class TestAgentState:
    def test_is_dict(self):
        """AgentState is a TypedDict — it's just a dict at runtime."""
        state: AgentState = {
            "greenhouse": None,
            "strategy_doc": "test",
            "run_id": "abc",
        }
        assert isinstance(state, dict)
        assert state["strategy_doc"] == "test"


class TestSimEngineConfig:
    def test_defaults(self):
        config = SimEngineConfig()
        assert config.num_zones == 4
        assert config.zone_area_m2 == 15.0
        assert config.mission_duration_days == 450
        assert config.crew_size == 4
        assert config.initial_resources["water"] == 10000
        assert config.initial_resources["nutrients"] == 5000
        assert config.initial_resources["water_recycling_efficiency"] == 0.90
        assert config.initial_resources["nutrient_recycling_efficiency"] == 0.70

    def test_custom(self):
        config = SimEngineConfig(num_zones=6, zone_area_m2=20.0, crew_size=6)
        assert config.num_zones == 6
        assert config.zone_area_m2 == 20.0
        assert config.crew_size == 6

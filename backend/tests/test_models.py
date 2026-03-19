"""Tests for Pydantic domain models and TypedDicts."""
from backend.models.state import (
    Crop,
    Slot,
    GreenhouseState,
    AgentAction,
    DailySnapshot,
    SimulationMetrics,
    SimulationResult,
    AgentState,
    EnvironmentState,
    Resources,
    FoodSupply,
    CropStock,
    StoredFood,
    DailyNutrition,
    ActiveEvent,
    SlotSnapshot,
    CropSnapshot,
    Metrics,
)


class TestCrop:
    def test_creation(self, sample_crop):
        assert sample_crop.id == "potato-s0-1"
        assert sample_crop.type == "potato"
        assert sample_crop.slot_id == 0
        assert sample_crop.footprint_m2 == 2.0
        assert sample_crop.health == 95.0
        assert sample_crop.active_stress is None
        assert sample_crop.growth_cycle_days == 90

    def test_with_stress(self, sample_crop_stressed):
        assert sample_crop_stressed.active_stress == "drought"
        assert sample_crop_stressed.health == 40.0


class TestSlot:
    def test_used_area(self, sample_slot):
        assert sample_slot.used_area() == 2.0

    def test_available_area(self, sample_slot):
        assert sample_slot.available_area() == 4.0 - 2.0

    def test_empty_slot(self):
        s = Slot(id=1, row=0, col=1, area_m2=4.0)
        assert s.used_area() == 0.0
        assert s.available_area() == 4.0
        assert s.crops == []
        assert s.crop_type is None

    def test_multiple_crops(self):
        crops = [
            Crop(id="c1", type="potato", slot_id=0, footprint_m2=2.0, planted_day=0, age=0, health=100, growth=0, growth_cycle_days=90),
            Crop(id="c2", type="herbs", slot_id=0, footprint_m2=0.3, planted_day=0, age=0, health=100, growth=0, growth_cycle_days=30),
        ]
        s = Slot(id=0, area_m2=4.0, crops=crops)
        assert s.used_area() == 2.3
        assert abs(s.available_area() - 1.7) < 1e-9


class TestFoodSupply:
    def test_empty(self):
        fs = FoodSupply()
        assert fs.total_kg == 0.0
        assert fs.total_kcal == 0.0
        assert fs.total_protein_g == 0.0

    def test_with_items(self):
        fs = FoodSupply(items={
            "potato": CropStock(kg=10.0, kcal=7700.0, protein_g=200.0),
            "lettuce": CropStock(kg=5.0, kcal=750.0, protein_g=70.0),
        })
        assert fs.total_kg == 15.0
        assert fs.total_kcal == 8450.0
        assert fs.total_protein_g == 270.0


class TestGreenhouseState:
    def test_creation(self, sample_greenhouse):
        assert sample_greenhouse.day == 0
        assert len(sample_greenhouse.slots) == 1
        assert sample_greenhouse.active_events == []
        assert sample_greenhouse.seed == 42
        assert sample_greenhouse.next_crop_id == 1

    def test_with_events(self, sample_greenhouse):
        event = ActiveEvent(
            type="water_recycling_degradation",
            started_day=10,
            duration_sols=10,
            remaining_sols=8,
            degraded_recycling=0.75,
        )
        gh = sample_greenhouse.model_copy(update={"active_events": [event]})
        assert len(gh.active_events) == 1
        assert gh.active_events[0].type == "water_recycling_degradation"


class TestAgentAction:
    def test_creation(self):
        action = AgentAction(
            day=10,
            node="plan",
            reasoning="Need more protein",
            actions=[{"action": "set_crop", "slot_id": 1, "crop_type": "beans_peas"}],
        )
        assert action.day == 10
        assert action.node == "plan"
        assert len(action.actions) == 1


class TestDailySnapshot:
    def test_creation(self):
        snap = DailySnapshot(
            day=5,
            slots=[],
            environment=EnvironmentState(),
            resources=Resources(),
            food_supply=FoodSupply(),
            stored_food=StoredFood(),
            daily_nutrition=DailyNutrition(),
            active_events=[],
        )
        assert snap.day == 5


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
        state: AgentState = {
            "greenhouse": None,
            "strategy_doc": "test",
            "run_id": "abc",
        }
        assert isinstance(state, dict)
        assert state["strategy_doc"] == "test"


class TestTrainingRunRequest:
    def test_defaults(self):
        from backend.models.state import TrainingRunRequest
        req = TrainingRunRequest()
        assert req.seed == 42
        assert req.crop_assignments == {}
        assert req.inject_events == []

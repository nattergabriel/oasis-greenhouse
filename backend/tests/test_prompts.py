"""Tests for prompt builders."""
from backend.agent.prompts import (
    SYSTEM_PROMPT,
    build_plan_prompt,
    build_react_prompt,
    build_reflect_prompt,
)


class TestSystemPrompt:
    def test_exists_and_nonempty(self):
        assert isinstance(SYSTEM_PROMPT, str)
        assert len(SYSTEM_PROMPT) > 100

    def test_contains_key_elements(self):
        assert "Mars" in SYSTEM_PROMPT
        assert "greenhouse" in SYSTEM_PROMPT
        assert "potato" in SYSTEM_PROMPT
        assert "set_crop" in SYSTEM_PROMPT
        assert "JSON" in SYSTEM_PROMPT
        assert "4 slots" in SYSTEM_PROMPT
        assert "4 m²" in SYSTEM_PROMPT


class TestBuildPlanPrompt:
    def test_returns_string(self):
        result = build_plan_prompt(
            strategy_doc="# Strategy",
            mission_day=10,
            state_json='{"day": 10}',
            calorie_gh_fraction=0.05,
            protein_gh_fraction=0.03,
            micronutrients_covered=["vitamin_a", "vitamin_c"],
            micronutrient_count=2,
            stored_food_remaining=5_000_000.0,
            water=8000.0,
            nutrients=4000.0,
            water_recycling_rate=0.90,
            energy_generated=500.0,
            energy_needed=450.0,
            energy_deficit=0.0,
            slot_summary="Slot 0: ...",
            food_supply_summary="Total: 0 kg",
        )
        assert isinstance(result, str)
        assert "day 10" in result
        assert "# Strategy" in result
        assert "vitamin_a" in result
        assert "8000" in result

    def test_custom_plan_horizon(self):
        result = build_plan_prompt(
            strategy_doc="x",
            mission_day=440,
            state_json="{}",
            calorie_gh_fraction=0.0,
            protein_gh_fraction=0.0,
            micronutrients_covered=[],
            micronutrient_count=0,
            stored_food_remaining=0,
            water=0,
            nutrients=0,
            water_recycling_rate=0,
            energy_generated=0,
            energy_needed=0,
            energy_deficit=0,
            slot_summary="",
            food_supply_summary="",
            plan_horizon=10,
        )
        assert "10 days" in result

    def test_empty_micronutrients(self):
        result = build_plan_prompt(
            strategy_doc="x",
            mission_day=0,
            state_json="{}",
            calorie_gh_fraction=0.0,
            protein_gh_fraction=0.0,
            micronutrients_covered=[],
            micronutrient_count=0,
            stored_food_remaining=0,
            water=0,
            nutrients=0,
            water_recycling_rate=0,
            energy_generated=0,
            energy_needed=0,
            energy_deficit=0,
            slot_summary="",
            food_supply_summary="",
        )
        assert "none" in result


class TestBuildReactPrompt:
    def test_returns_string(self):
        result = build_react_prompt(
            strategy_doc="# Strategy",
            event_day=50,
            stop_type="event_fired",
            stop_details="Water recycling degradation detected",
            kb_scenario_guidance="Reduce water usage",
            state_json='{"day": 50}',
            water=7000.0,
            water_recycling_rate=0.90,
            nutrients=3500.0,
            energy_generated=300.0,
            energy_needed=450.0,
            energy_deficit=150.0,
            days_remaining=400,
        )
        assert isinstance(result, str)
        assert "day 50" in result
        assert "event_fired" in result
        assert "Water recycling" in result
        assert "Reduce water usage" in result
        assert "400" in result


class TestBuildReflectPrompt:
    def test_returns_string(self):
        result = build_reflect_prompt(
            strategy_doc="# Old Strategy",
            avg_calorie_gh_fraction=0.15,
            avg_protein_gh_fraction=0.10,
            avg_micronutrient_coverage=4.5,
            stored_food_remaining_pct=65.0,
            total_kg=450.0,
            crops_lost=2,
            events_summary="Water recycling degradation x1",
            decisions_log="Day 0: set crops",
        )
        assert isinstance(result, str)
        assert "# Old Strategy" in result
        assert "15.0%" in result
        assert "450.0 kg" in result
        assert "2" in result
        assert "Water recycling degradation x1" in result

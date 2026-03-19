"""Pydantic models for Mars greenhouse state.

Aligned with simulation engine's actual state structure.
The sim engine uses dataclasses internally; these Pydantic models
mirror the JSON shape produced by state_to_dict() / dict_to_state().
"""
from __future__ import annotations

from typing import Any, Optional
from typing_extensions import TypedDict

from pydantic import BaseModel, Field


# ============================================================================
# Core Domain Models (match sim engine's serialized state)
# ============================================================================

class Crop(BaseModel):
    """Individual crop instance in a slot."""
    id: str
    type: str  # "potato", "lettuce", "radish", "beans_peas", "herbs"
    slot_id: int
    footprint_m2: float
    planted_day: int
    age: int = 0
    health: float = 100.0  # 0-100
    growth: float = 0.0  # 0-100%
    active_stress: Optional[str] = None
    growth_cycle_days: int = 0


class Slot(BaseModel):
    """A 2x2m greenhouse slot in the grid."""
    id: int
    row: int = 0
    col: int = 0
    area_m2: float = 4.0  # 2m x 2m per slot
    crop_type: Optional[str] = None  # single crop type assigned to this slot
    crops: list[Crop] = Field(default_factory=list)
    artificial_light: bool = True
    water_allocation: float = 1.0  # multiplier 0.0-1.5

    def used_area(self) -> float:
        return sum(c.footprint_m2 for c in self.crops)

    def available_area(self) -> float:
        return self.area_m2 - self.used_area()


class EnvironmentState(BaseModel):
    """Environmental state of the greenhouse."""
    solar_hours: float = 12.0
    outside_temp: float = -63.0
    internal_temp: float = 22.0
    target_temp: float = 22.0
    co2_level: float = 1000.0
    co2_event_active: bool = False
    energy_generated: float = 0.0
    energy_needed: float = 0.0
    energy_deficit: float = 0.0
    light_penalty: float = 0.0


class Resources(BaseModel):
    """Finite resources for the greenhouse."""
    water: float = 10000.0
    nutrients: float = 5000.0
    energy_generated: float = 0.0
    energy_needed: float = 0.0
    energy_deficit: float = 0.0
    water_recycling_rate: float = 0.90
    water_availability: float = 1.0


class CropStock(BaseModel):
    """Stockpile of a single crop type."""
    kg: float = 0.0
    kcal: float = 0.0
    protein_g: float = 0.0


class FoodSupply(BaseModel):
    """Accumulated harvested food stockpile."""
    items: dict[str, CropStock] = Field(default_factory=dict)

    @property
    def total_kg(self) -> float:
        return sum(item.kg for item in self.items.values())

    @property
    def total_kcal(self) -> float:
        return sum(item.kcal for item in self.items.values())

    @property
    def total_protein_g(self) -> float:
        return sum(item.protein_g for item in self.items.values())


class StoredFood(BaseModel):
    """Packaged food from Earth."""
    total_calories: float = 5_400_000.0
    remaining_calories: float = 5_400_000.0


class DailyNutrition(BaseModel):
    """Daily nutrition metrics."""
    calorie_gh_fraction: float = 0.0
    protein_gh_fraction: float = 0.0
    micronutrients_covered: list[str] = Field(default_factory=list)
    micronutrient_count: int = 0
    gh_kcal: float = 0.0
    gh_protein_g: float = 0.0
    stored_kcal_consumed: float = 0.0


class ActiveEvent(BaseModel):
    """Crisis event currently affecting the greenhouse."""
    type: str
    started_day: int
    duration_sols: int
    remaining_sols: int
    temp_drift_c: float = 0.0
    degraded_recycling: float = 0.0


class Metrics(BaseModel):
    """Running simulation metrics."""
    avg_calorie_gh_fraction: float = 0.0
    avg_protein_gh_fraction: float = 0.0
    avg_micronutrient_coverage: float = 0.0
    unique_micronutrients_seen: list[str] = Field(default_factory=list)
    total_harvested_kg: float = 0.0
    crops_lost: int = 0
    days_simulated: int = 0


class GreenhouseState(BaseModel):
    """Top-level greenhouse state. Mirrors sim engine's serialized state."""
    day: int = 0
    environment: EnvironmentState = Field(default_factory=EnvironmentState)
    slots: list[Slot] = Field(default_factory=list)
    resources: Resources = Field(default_factory=Resources)
    food_supply: FoodSupply = Field(default_factory=FoodSupply)
    stored_food: StoredFood = Field(default_factory=StoredFood)
    active_events: list[ActiveEvent] = Field(default_factory=list)
    daily_nutrition: DailyNutrition = Field(default_factory=DailyNutrition)
    metrics: Metrics = Field(default_factory=Metrics)
    next_crop_id: int = 1
    seed: int = 42
    consecutive_energy_deficit_days: int = 0


# ============================================================================
# Agent Action Models
# ============================================================================

class AgentAction(BaseModel):
    """Agent decision logged for playback."""
    day: int
    node: str  # "plan", "react"
    reasoning: str
    actions: list[dict[str, Any]]


# ============================================================================
# Snapshot Models (for frontend playback)
# ============================================================================

class CropSnapshot(BaseModel):
    """Lightweight crop snapshot."""
    id: str
    type: str
    footprint_m2: float
    age: int
    health: float
    growth: float
    active_stress: Optional[str] = None


class SlotSnapshot(BaseModel):
    """Lightweight slot snapshot."""
    id: int
    row: int = 0
    col: int = 0
    area_m2: float
    used_area_m2: float
    available_area_m2: float
    crop_type: Optional[str] = None
    artificial_light: bool
    water_allocation: float
    crops: list[CropSnapshot]


class DailySnapshot(BaseModel):
    """Daily state snapshot for frontend playback."""
    day: int
    slots: list[SlotSnapshot]
    environment: EnvironmentState
    resources: Resources
    food_supply: FoodSupply
    stored_food: StoredFood
    daily_nutrition: DailyNutrition
    active_events: list[ActiveEvent]


# ============================================================================
# Simulation Result Models
# ============================================================================

class SimulationMetrics(BaseModel):
    """Final metrics for a completed simulation."""
    avg_calorie_gh_fraction: float
    avg_protein_gh_fraction: float
    avg_micronutrient_coverage: float
    total_harvested_kg: float
    crops_lost: int
    stored_food_remaining_pct: float
    resource_efficiency: float
    events_handled: int


class SimulationResult(BaseModel):
    """Complete simulation result for frontend playback."""
    id: str
    daily_snapshots: list[DailySnapshot]
    agent_decisions: list[AgentAction]
    events: list[ActiveEvent]
    final_metrics: SimulationMetrics
    strategy_doc_before: str
    strategy_doc_after: str


# ============================================================================
# LangGraph State (TypedDict — required by LangGraph's StateGraph)
# ============================================================================

class AgentState(TypedDict, total=False):
    """LangGraph state passed between nodes. Must be TypedDict."""
    greenhouse: Optional[GreenhouseState]
    strategy_doc: str
    kb_crop_profiles: str
    kb_nutrition_targets: str
    run_id: str
    config: dict[str, Any]
    inject_events: list[dict[str, Any]]
    agent_decisions: list[AgentAction]
    daily_snapshots: list[DailySnapshot]
    sim_result: Optional[dict[str, Any]]
    total_harvested_kg: float
    crops_lost: int
    calorie_fractions: list[float]
    protein_fractions: list[float]
    micronutrient_counts: list[int]
    loop_iterations: int


# ============================================================================
# API Request/Response Models
# ============================================================================

class TrainingRunRequest(BaseModel):
    """Request to run a training simulation."""
    seed: int = 42
    crop_assignments: dict[int, str] = Field(default_factory=dict)
    inject_events: list[dict[str, Any]] = Field(default_factory=list)


class SimulationListItem(BaseModel):
    """Simulation list item for GET /api/simulations."""
    id: str
    final_metrics: SimulationMetrics
    timestamp: str

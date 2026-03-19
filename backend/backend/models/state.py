"""Pydantic models for Mars greenhouse state."""
from __future__ import annotations

from typing import Any, Optional
from typing_extensions import TypedDict

from pydantic import BaseModel, Field


# ============================================================================
# Core Domain Models (Pydantic — used by sim engine, API, etc.)
# ============================================================================

class Crop(BaseModel):
    """Individual crop instance in a zone."""
    id: str
    type: str  # "potato", "lettuce", "radish", "beans_peas", "herbs"
    zone_id: int
    footprint_m2: float
    planted_day: int
    age: int
    health: float  # 0-100
    growth: float  # 0-100%
    active_stress: Optional[str] = None


class Zone(BaseModel):
    """A growing zone in the greenhouse."""
    id: int
    area_m2: float
    crops: list[Crop] = Field(default_factory=list)
    artificial_light: bool = True
    water_allocation: float = 1.0  # multiplier 0.0-1.5
    crop_plan: dict[str, float] = Field(default_factory=dict)

    def used_area(self) -> float:
        return sum(c.footprint_m2 for c in self.crops)

    def available_area(self) -> float:
        return self.area_m2 - self.used_area()


class EnvironmentState(BaseModel):
    """Environmental state of the greenhouse."""
    solar_hours: float
    outside_temp: float
    internal_temp: float
    energy_generated: float
    energy_needed: float
    energy_deficit: float


class Resources(BaseModel):
    """Finite resources for the greenhouse."""
    water: float
    nutrients: float
    water_recycling_efficiency: float = 0.90
    nutrient_recycling_efficiency: float = 0.70


class MarsConditions(BaseModel):
    """External Mars environmental conditions."""
    solar_hours: float
    outside_temp: float


class CropStock(BaseModel):
    """Stockpile of a single crop type."""
    kg: float = 0.0
    kcal: float = 0.0
    protein_g: float = 0.0


class FoodSupply(BaseModel):
    """Accumulated harvested food stockpile."""
    total_kg: float = 0.0
    total_kcal: float = 0.0
    total_protein_g: float = 0.0
    by_type: dict[str, CropStock] = Field(default_factory=dict)


class StoredFood(BaseModel):
    """Packaged food from Earth."""
    total_calories: float
    remaining_calories: float


class DailyNutrition(BaseModel):
    """Daily nutrition metrics."""
    calorie_gh_fraction: float = 0.0
    protein_gh_fraction: float = 0.0
    micronutrients_covered: list[str] = Field(default_factory=list)
    micronutrient_count: int = 0
    stored_food_remaining: float = 0.0
    stored_food_days_left: float = 0.0


class Event(BaseModel):
    """Crisis event."""
    type: str
    severity: float  # 0-1
    day_triggered: int
    duration: int  # sols
    details: str
    resolved: bool = False


class GreenhouseState(BaseModel):
    """Top-level greenhouse state."""
    mission_day: int = 0
    zones: list[Zone]
    environment: EnvironmentState
    resources: Resources
    mars: MarsConditions
    food_supply: FoodSupply
    stored_food: StoredFood
    daily_nutrition: DailyNutrition
    active_events: list[Event] = Field(default_factory=list)


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


class ZoneSnapshot(BaseModel):
    """Lightweight zone snapshot."""
    id: int
    area_m2: float
    used_area_m2: float
    available_area_m2: float
    artificial_light: bool
    water_allocation: float
    crop_plan: dict[str, float]
    crops: list[CropSnapshot]


class DailySnapshot(BaseModel):
    """Daily state snapshot for frontend playback."""
    mission_day: int
    zones: list[ZoneSnapshot]
    environment: EnvironmentState
    resources: Resources
    mars: MarsConditions
    food_supply: FoodSupply
    stored_food: StoredFood
    daily_nutrition: DailyNutrition
    active_events: list[Event]


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
    events: list[Event]
    final_metrics: SimulationMetrics
    strategy_doc_before: str
    strategy_doc_after: str


# ============================================================================
# LangGraph State (TypedDict — required by LangGraph's StateGraph)
# ============================================================================

class AgentState(TypedDict, total=False):
    """LangGraph state passed between nodes. Must be TypedDict."""
    # Core greenhouse state
    greenhouse: Optional[GreenhouseState]

    # Strategy document
    strategy_doc: str

    # Cached KB data (loaded once at init)
    kb_crop_profiles: str
    kb_nutrition_targets: str

    # Simulation control
    run_id: str
    config: dict[str, Any]
    inject_events: list[dict[str, Any]]

    # Agent decisions log
    agent_decisions: list[AgentAction]

    # Daily snapshots for playback
    daily_snapshots: list[DailySnapshot]

    # Latest sim engine result
    sim_result: Optional[dict[str, Any]]

    # Metrics accumulation
    total_harvested_kg: float
    crops_lost: int
    calorie_fractions: list[float]
    protein_fractions: list[float]
    micronutrient_counts: list[int]


# ============================================================================
# API Request/Response Models
# ============================================================================

class TrainingRunRequest(BaseModel):
    """Request to run a training simulation."""
    config: Optional[dict[str, Any]] = None
    inject_events: list[dict[str, Any]] = Field(default_factory=list)


class SimulationListItem(BaseModel):
    """Simulation list item for GET /api/simulations."""
    id: str
    final_metrics: SimulationMetrics
    timestamp: str


class SimEngineConfig(BaseModel):
    """Configuration for sim engine initialization."""
    num_zones: int = 4
    zone_area_m2: float = 15.0
    mission_duration_days: int = 450
    crew_size: int = 4
    initial_resources: dict[str, Any] = Field(default_factory=lambda: {
        "water": 10000,
        "nutrients": 5000,
        "water_recycling_efficiency": 0.90,
        "nutrient_recycling_efficiency": 0.70,
    })

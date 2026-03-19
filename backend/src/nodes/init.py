"""Init node — initialize greenhouse and load KB data."""
import logging
from typing import Any

from backend.models.state import (
    AgentState,
    GreenhouseState,
    SimEngineConfig,
)
from backend.sim_client import sim_client
from backend.kb.cache import kb_cache
from backend.strategy.store import strategy_store
from backend.nodes._snapshot import create_snapshot

logger = logging.getLogger(__name__)


async def init_node(state: AgentState) -> dict[str, Any]:
    """Initialize the greenhouse and load cached data."""
    run_id = state.get("run_id", "unknown")
    logger.info("[INIT] Starting initialization for run %s", run_id)

    # Build config from state dict
    config_dict = state.get("config") or {}
    config = SimEngineConfig(**config_dict) if config_dict else SimEngineConfig()

    # Initialize greenhouse via sim engine
    greenhouse = await sim_client.init(config)

    # Load KB cache (crop profiles + nutrition targets)
    await kb_cache.load()

    # Load strategy document
    strategy_doc = strategy_store.read()

    # Create initial snapshot
    snapshot = create_snapshot(greenhouse)

    logger.info("[INIT] Greenhouse initialized at day %d", greenhouse.mission_day)

    return {
        "greenhouse": greenhouse,
        "strategy_doc": strategy_doc,
        "kb_crop_profiles": kb_cache.get_crop_profiles_text(),
        "kb_nutrition_targets": kb_cache.get_nutrition_targets_text(),
        "daily_snapshots": [snapshot],
        "agent_decisions": [],
        "calorie_fractions": [],
        "protein_fractions": [],
        "micronutrient_counts": [],
        "total_harvested_kg": 0.0,
        "crops_lost": 0,
    }

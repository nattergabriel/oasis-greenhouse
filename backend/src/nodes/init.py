"""Init node — initialize greenhouse and load KB data."""
import logging
from typing import Any

from ..models.state import AgentState
from ..sim_client import sim_client
from ..kb.cache import kb_cache
from ..strategy.store import strategy_store
from ._snapshot import create_snapshot

logger = logging.getLogger(__name__)


async def init_node(state: AgentState) -> dict[str, Any]:
    """Initialize the greenhouse and load cached data."""
    run_id = state.get("run_id", "unknown")
    logger.info("[INIT] Starting initialization for run %s", run_id)

    config = state.get("config") or {}
    seed = config.get("seed", 42)
    crop_assignments = config.get("crop_assignments")

    # Initialize greenhouse via sim engine
    greenhouse = await sim_client.init(
        seed=seed,
        crop_assignments=crop_assignments,
    )

    # Load KB cache (crop profiles + nutrition targets)
    await kb_cache.load()

    # Load strategy document
    strategy_doc = strategy_store.read()

    # Create initial snapshot
    snapshot = create_snapshot(greenhouse)

    logger.info("[INIT] Greenhouse initialized at day %d", greenhouse.day)

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

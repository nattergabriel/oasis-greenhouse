"""FastAPI application for Mars greenhouse agent."""
import json
import logging
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .graph import graph
from .models.state import (
    AgentAction,
    SimulationListItem,
    SimulationMetrics,
    SimulationResult,
    TrainingRunRequest,
)
from .bridge_client import bridge_client
from .strategy.store import strategy_store

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Mars Greenhouse Agent API",
    description="Backend API for autonomous Mars greenhouse management",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict:
    """Health check."""
    return {"status": "ok", "service": "mars-greenhouse-agent"}


@app.post("/api/training/run")
async def run_training_simulation(request: TrainingRunRequest) -> dict:
    """Run a training simulation and improve strategy."""
    run_id = request.simulation_id or str(uuid.uuid4())
    logger.info("Starting training run: %s", run_id)

    strategy_before = strategy_store.read()

    initial_state = {
        "greenhouse": None,
        "strategy_doc": "",
        "kb_crop_profiles": "",
        "kb_nutrition_targets": "",
        "run_id": run_id,
        "config": {
            "seed": request.seed,
            "crop_assignments": request.crop_assignments or None,
        },
        "inject_events": request.inject_events,
        "agent_decisions": [],
        "daily_snapshots": [],
        "sim_result": None,
        "total_harvested_kg": 0.0,
        "crops_lost": 0,
        "calorie_fractions": [],
        "protein_fractions": [],
        "micronutrient_counts": [],
    }

    try:
        final_state = await graph.ainvoke(initial_state)

        metrics = _calculate_metrics(final_state)
        gh = final_state["greenhouse"]

        result = SimulationResult(
            id=run_id,
            daily_snapshots=final_state.get("daily_snapshots", []),
            agent_decisions=final_state.get("agent_decisions", []),
            events=gh.active_events if gh else [],
            final_metrics=metrics,
            strategy_doc_before=strategy_before,
            strategy_doc_after=final_state.get("strategy_doc", ""),
        )

        _save_simulation_result(result)

        # Forward result to management-backend for DB persistence + frontend access
        bridge_resp = await bridge_client.import_result(run_id, result)
        logger.info("Bridge response: %s", bridge_resp)

        logger.info("Training run complete: %s", run_id)
        return {"id": run_id, "status": "completed", "metrics": metrics.model_dump()}

    except Exception as e:
        logger.exception("Error during training run %s", run_id)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/simulations")
async def list_simulations() -> list[SimulationListItem]:
    """List all past simulation runs."""
    sim_dir = Path(settings.simulations_dir)
    if not sim_dir.exists():
        return []

    results = []
    for fp in sim_dir.glob("*.json"):
        try:
            data = json.loads(fp.read_text(encoding="utf-8"))
            ts = datetime.fromtimestamp(fp.stat().st_mtime, tz=timezone.utc).isoformat()
            results.append(
                SimulationListItem(
                    id=data["id"],
                    final_metrics=SimulationMetrics(**data["final_metrics"]),
                    timestamp=ts,
                )
            )
        except Exception as e:
            logger.warning("Error loading %s: %s", fp, e)

    results.sort(key=lambda x: x.timestamp, reverse=True)
    return results


@app.get("/api/simulations/{simulation_id}")
async def get_simulation(simulation_id: str) -> SimulationResult:
    """Get full simulation result by ID."""
    if not re.match(r'^[a-zA-Z0-9\-]+$', simulation_id):
        raise HTTPException(status_code=400, detail="Invalid simulation ID")
    fp = Path(settings.simulations_dir) / f"{simulation_id}.json"
    if not fp.exists():
        raise HTTPException(status_code=404, detail="Simulation not found")
    try:
        data = json.loads(fp.read_text(encoding="utf-8"))
        return SimulationResult(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading simulation: {e}")


@app.get("/api/strategy")
async def get_strategy() -> dict:
    """Get current strategy document."""
    try:
        doc = strategy_store.read()
        return {"strategy_document": doc, "length": len(doc)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _calculate_metrics(state: dict) -> SimulationMetrics:
    """Calculate final metrics from agent state dict."""
    cal = state.get("calorie_fractions", [])
    prot = state.get("protein_fractions", [])
    micro = state.get("micronutrient_counts", [])

    avg_cal = sum(cal) / len(cal) if cal else 0.0
    avg_prot = sum(prot) / len(prot) if prot else 0.0
    avg_micro = sum(micro) / len(micro) if micro else 0.0

    gh = state.get("greenhouse")
    if gh:
        stored_pct = (
            (gh.stored_food.remaining_calories / gh.stored_food.total_calories) * 100
            if gh.stored_food.total_calories > 0
            else 0.0
        )
        res_eff = (gh.resources.water / 40000 + gh.resources.nutrients / 20000) / 2
        events_handled = len(gh.active_events)
    else:
        stored_pct = 0.0
        res_eff = 0.0
        events_handled = 0

    return SimulationMetrics(
        avg_calorie_gh_fraction=avg_cal,
        avg_protein_gh_fraction=avg_prot,
        avg_micronutrient_coverage=avg_micro,
        total_harvested_kg=state.get("total_harvested_kg", 0.0),
        crops_lost=state.get("crops_lost", 0),
        stored_food_remaining_pct=stored_pct,
        resource_efficiency=res_eff,
        events_handled=events_handled,
    )


def _save_simulation_result(result: SimulationResult) -> None:
    """Save simulation result to disk as JSON."""
    sim_dir = Path(settings.simulations_dir)
    sim_dir.mkdir(parents=True, exist_ok=True)
    fp = sim_dir / f"{result.id}.json"
    fp.write_text(json.dumps(result.model_dump(), indent=2, default=str), encoding="utf-8")
    logger.info("Simulation result saved to %s", fp)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

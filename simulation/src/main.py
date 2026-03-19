"""FastAPI server: 3 endpoints for the Mars greenhouse simulation.

Stateless REST API. Each call receives full state, runs simulation logic,
returns updated state. The backend orchestrator manages state persistence.
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException

from .models import (
    InitRequest,
    InjectEventRequest,
    SimulationResponse,
    TickRequest,
    state_to_dict,
)
from .simulation import create_initial_state, inject_event, simulate_tick

app = FastAPI(
    title="Mars Greenhouse Simulation Engine",
    description="Stateless simulation engine for a Martian greenhouse. "
                "Receives state + actions, runs physics, returns updated state.",
    version="0.1.0",
)


@app.post("/simulate/init", response_model=SimulationResponse)
def init_simulation(request: InitRequest) -> SimulationResponse:
    """Create initial simulation state.

    Optionally provide crop_assignments to pre-fill slots with crops on day 0.
    """
    state = create_initial_state(
        seed=request.seed,
        crop_assignments=request.crop_assignments if request.crop_assignments else None,
    )
    return SimulationResponse(
        state=state_to_dict(state),
        daily_logs=[],
        days_simulated=0,
        stopped_early=False,
        stop_reason=None,
    )


@app.post("/simulate/tick", response_model=SimulationResponse)
def tick_simulation(request: TickRequest) -> SimulationResponse:
    """Advance simulation by N days.

    Receives full state, agent actions (applied on first day), and optional
    event injections. Returns updated state with daily logs.
    """
    if request.days < 1 or request.days > 450:
        raise HTTPException(status_code=400, detail="days must be 1-450")

    result = simulate_tick(
        state_dict=request.state,
        days=request.days,
        actions=request.actions if request.actions else None,
        inject_events=request.inject_events if request.inject_events else None,
    )

    return SimulationResponse(
        state=result["state"],
        daily_logs=result["daily_logs"],
        days_simulated=result["days_simulated"],
        stopped_early=result["stopped_early"],
        stop_reason=result["stop_reason"],
    )


@app.post("/simulate/inject-event", response_model=SimulationResponse)
def inject_event_endpoint(request: InjectEventRequest) -> SimulationResponse:
    """Inject a crisis event into the current state.

    Does not advance the simulation — just adds the event to active_events.
    Call /simulate/tick afterwards to see the effect.
    """
    from .models import dict_to_state

    state = dict_to_state(request.state)
    event = inject_event(
        state,
        event_type=request.event_type,
        duration_sols=request.duration_sols,
    )

    if event is None:
        raise HTTPException(
            status_code=400,
            detail=f"Could not inject event '{request.event_type}' "
                   f"(unknown type or already active)",
        )

    return SimulationResponse(
        state=state_to_dict(state),
        daily_logs=[],
        days_simulated=0,
        stopped_early=False,
        stop_reason=None,
    )

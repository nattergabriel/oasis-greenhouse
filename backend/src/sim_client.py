"""HTTP client for the simulation engine."""
from typing import Any

import httpx

from .config import settings
from .models.state import GreenhouseState


class SimEngineClient:
    """Client for the simulation engine HTTP API."""

    def __init__(self, base_url: str | None = None) -> None:
        self.base_url = base_url or settings.sim_engine_url
        self._client = httpx.AsyncClient(timeout=120.0)

    async def close(self) -> None:
        await self._client.aclose()

    async def init(
        self,
        seed: int = 42,
        crop_assignments: dict[int, str] | None = None,
    ) -> GreenhouseState:
        """Initialize a new greenhouse state via sim engine.

        Args:
            seed: RNG seed for deterministic simulation.
            crop_assignments: Optional {slot_id: crop_type} initial assignments.

        Returns:
            Initial greenhouse state at day 0.
        """
        payload: dict[str, Any] = {"seed": seed}
        if crop_assignments:
            payload["crop_assignments"] = crop_assignments

        response = await self._client.post(
            f"{self.base_url}/simulate/init",
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        return GreenhouseState(**data["state"])

    async def tick(
        self,
        state: GreenhouseState,
        actions: list[dict[str, Any]],
        days: int = 30,
        inject_events: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Advance simulation by N days with actions.

        Returns:
            Dict with state (GreenhouseState), daily_logs, days_simulated,
            stopped_early, stop_reason.
        """
        response = await self._client.post(
            f"{self.base_url}/simulate/tick",
            json={
                "state": state.model_dump(),
                "actions": actions,
                "days": days,
                "inject_events": inject_events or [],
            },
        )
        response.raise_for_status()
        result = response.json()
        result["state"] = GreenhouseState(**result["state"])
        return result

    async def inject_event(
        self,
        state: GreenhouseState,
        event_type: str,
        duration_sols: int | None = None,
    ) -> dict[str, Any]:
        """Manually inject an event into the current state.

        Returns:
            Dict with updated state.
        """
        payload: dict[str, Any] = {
            "state": state.model_dump(),
            "event_type": event_type,
        }
        if duration_sols is not None:
            payload["duration_sols"] = duration_sols

        response = await self._client.post(
            f"{self.base_url}/simulate/inject-event",
            json=payload,
        )
        response.raise_for_status()
        result = response.json()
        result["state"] = GreenhouseState(**result["state"])
        return result


# Global client instance
sim_client = SimEngineClient()

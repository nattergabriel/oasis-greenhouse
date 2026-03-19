"""HTTP client for the simulation engine."""
from typing import Any

import httpx

from backend.config import settings
from backend.models.state import GreenhouseState, SimEngineConfig


class SimEngineClient:
    """Client for the simulation engine HTTP API."""

    def __init__(self, base_url: str | None = None) -> None:
        """Initialize the client.

        Args:
            base_url: Base URL of the sim engine (defaults to settings).
        """
        self.base_url = base_url or settings.sim_engine_url
        self._client = httpx.AsyncClient(timeout=120.0)

    async def close(self) -> None:
        """Close the underlying HTTP client."""
        await self._client.aclose()

    async def init(self, config: SimEngineConfig | None = None) -> GreenhouseState:
        """Initialize a new greenhouse state.

        Args:
            config: Configuration for the greenhouse.

        Returns:
            Initial greenhouse state at day 0.
        """
        if config is None:
            config = SimEngineConfig()

        response = await self._client.post(
            f"{self.base_url}/simulate/init",
            json={"config": config.model_dump()},
        )
        response.raise_for_status()
        return GreenhouseState(**response.json())

    async def tick(
        self,
        state: GreenhouseState,
        actions: list[dict[str, Any]],
        days: int = 30,
        inject_events: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Advance simulation by N days with actions.

        Args:
            state: Current greenhouse state.
            actions: List of actions to apply.
            days: Number of days to simulate.
            inject_events: Optional events to inject at specific days.

        Returns:
            Dict with final_state, days_simulated, stopped_early,
            stop_reason, daily_log.
        """
        if inject_events is None:
            inject_events = []

        response = await self._client.post(
            f"{self.base_url}/simulate/tick",
            json={
                "state": state.model_dump(),
                "actions": actions,
                "days": days,
                "inject_events": inject_events,
            },
        )
        response.raise_for_status()
        result = response.json()
        result["final_state"] = GreenhouseState(**result["final_state"])
        return result

    async def inject_event(
        self,
        state: GreenhouseState,
        event: dict[str, Any],
    ) -> dict[str, Any]:
        """Manually inject an event into the current state.

        Args:
            state: Current greenhouse state.
            event: Event to inject (type, severity).

        Returns:
            Dict with updated state and impact details.
        """
        response = await self._client.post(
            f"{self.base_url}/simulate/inject-event",
            json={
                "state": state.model_dump(),
                "event": event,
            },
        )
        response.raise_for_status()
        result = response.json()
        result["state"] = GreenhouseState(**result["state"])
        return result


# Global client instance
sim_client = SimEngineClient()

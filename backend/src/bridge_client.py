"""HTTP client for the management-backend bridge."""
import logging
from typing import Any

import httpx

from .config import settings
from .models.state import SimulationResult

logger = logging.getLogger(__name__)


class BridgeClient:
    """Posts simulation results to the management-backend bridge endpoint."""

    def __init__(self, base_url: str | None = None) -> None:
        self.base_url = base_url or settings.management_backend_url
        self._client = httpx.AsyncClient(timeout=60.0)

    async def close(self) -> None:
        await self._client.aclose()

    async def import_result(self, simulation_id: str, result: SimulationResult) -> dict[str, Any]:
        """POST simulation result to management-backend bridge.

        Args:
            simulation_id: The simulation run ID.
            result: Complete simulation result from the agent run.

        Returns:
            Response dict from the bridge controller.
        """
        url = f"{self.base_url}/api/bridge/import-result/{simulation_id}"
        payload = result.model_dump(mode="json")

        try:
            response = await self._client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            logger.info("Bridge import succeeded for sim=%s: %s", simulation_id, data)
            return data
        except httpx.HTTPStatusError as e:
            logger.error(
                "Bridge import failed for sim=%s: %s %s",
                simulation_id, e.response.status_code, e.response.text,
            )
            raise
        except httpx.ConnectError:
            logger.warning(
                "Could not connect to management-backend at %s — "
                "result saved to disk but not imported into DB.",
                self.base_url,
            )
            return {"status": "skipped", "reason": "management-backend unreachable"}


# Global client instance
bridge_client = BridgeClient()

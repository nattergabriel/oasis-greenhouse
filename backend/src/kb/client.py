"""MCP Knowledge Base query client."""
from typing import Any

import httpx

from ..config import settings


class KnowledgeBaseClient:
    """Client for querying the MCP Knowledge Base."""

    def __init__(self) -> None:
        """Initialize the KB client."""
        self.endpoint = settings.kb_endpoint
        self.tool_name = settings.kb_tool_name
        self._client = httpx.AsyncClient(timeout=30.0)

    async def close(self) -> None:
        """Close the underlying HTTP client."""
        await self._client.aclose()

    async def query(self, query_text: str, max_results: int = 5) -> list[dict[str, Any]]:
        """Query the knowledge base.

        Args:
            query_text: Natural language query.
            max_results: Maximum number of results to return.

        Returns:
            List of knowledge base results with text and metadata.
        """
        response = await self._client.post(
            self.endpoint,
            json={
                "tool": self.tool_name,
                "arguments": {
                    "query": query_text,
                    "maxResults": max_results,
                },
            },
        )
        response.raise_for_status()
        data = response.json()

        if "results" in data:
            return data["results"]
        if "content" in data:
            return [{"text": data["content"]}]
        return []

    async def query_crop_profiles(self) -> str:
        """Query for crop profiles (doc 03)."""
        results = await self.query(
            "crop profiles growth cycles yields nutritional values environmental thresholds",
            max_results=10,
        )
        return self._format_results(results)

    async def query_nutrition_targets(self) -> str:
        """Query for nutritional targets (doc 05)."""
        results = await self.query(
            "human nutritional requirements daily needs micronutrients astronauts",
            max_results=5,
        )
        return self._format_results(results)

    async def query_stress_response(self, stress_type: str) -> str:
        """Query for stress response guidance (doc 04).

        Args:
            stress_type: Type of stress (e.g., "drought", "heat", "cold").
        """
        results = await self.query(
            f"plant stress {stress_type} symptoms mitigations response",
            max_results=5,
        )
        return self._format_results(results)

    async def query_operational_scenario(self, scenario_type: str) -> str:
        """Query for operational scenario guidance (doc 06).

        Args:
            scenario_type: Type of scenario (e.g., "water_recycling").
        """
        results = await self.query(
            f"greenhouse operational scenario {scenario_type} failure response",
            max_results=5,
        )
        return self._format_results(results)

    def _format_results(self, results: list[dict[str, Any]]) -> str:
        """Format KB results as a readable string."""
        if not results:
            return "No relevant information found in knowledge base."

        formatted = []
        for i, result in enumerate(results, 1):
            text = result.get("text", result.get("content", ""))
            formatted.append(f"[Result {i}]\n{text}\n")

        return "\n".join(formatted)


# Global KB client instance
kb_client = KnowledgeBaseClient()

"""MCP Knowledge Base query client (JSON-RPC 2.0 / Streamable HTTP)."""
import json
import logging
from typing import Any

import httpx

from ..config import settings

logger = logging.getLogger(__name__)

_request_id = 0


def _next_id() -> int:
    global _request_id
    _request_id += 1
    return _request_id


class KnowledgeBaseClient:
    """Client for querying the MCP Knowledge Base via JSON-RPC 2.0."""

    def __init__(self) -> None:
        """Initialize the KB client."""
        self.endpoint = settings.kb_endpoint
        self.tool_name = settings.kb_tool_name
        self._client = httpx.AsyncClient(timeout=30.0)
        self._initialized = False

    async def close(self) -> None:
        """Close the underlying HTTP client."""
        await self._client.aclose()

    async def _ensure_initialized(self) -> None:
        """Send MCP initialize + initialized handshake if not done yet."""
        if self._initialized:
            return
        try:
            await self._client.post(
                self.endpoint,
                json={
                    "jsonrpc": "2.0",
                    "method": "initialize",
                    "params": {
                        "protocolVersion": "2025-03-26",
                        "capabilities": {},
                        "clientInfo": {"name": "mars-greenhouse-backend", "version": "1.0.0"},
                    },
                    "id": _next_id(),
                },
            )
            # Send initialized notification (no id = notification)
            await self._client.post(
                self.endpoint,
                json={
                    "jsonrpc": "2.0",
                    "method": "notifications/initialized",
                },
            )
            self._initialized = True
        except Exception:
            logger.warning("MCP initialize handshake failed, proceeding anyway")
            self._initialized = True

    async def query(self, query_text: str, max_results: int = 5) -> list[dict[str, Any]]:
        """Query the knowledge base via MCP tools/call.

        Args:
            query_text: Natural language query.
            max_results: Maximum number of results to return.

        Returns:
            List of knowledge base results with text and metadata.
        """
        await self._ensure_initialized()

        response = await self._client.post(
            self.endpoint,
            json={
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": self.tool_name,
                    "arguments": {
                        "query": query_text,
                        "max_results": max_results,
                    },
                },
                "id": _next_id(),
            },
        )
        response.raise_for_status()
        data = response.json()

        return self._parse_response(data)

    def _parse_response(self, data: dict[str, Any]) -> list[dict[str, Any]]:
        """Parse JSON-RPC 2.0 response from MCP gateway."""
        # JSON-RPC 2.0 envelope: {"jsonrpc": "2.0", "result": {...}, "id": ...}
        result = data.get("result", data)

        # MCP tools/call result: {"content": [{"type": "text", "text": "..."}]}
        content = result.get("content")
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict) and item.get("type") == "text":
                    text = item.get("text", "")
                    return self._extract_chunks_from_text(text)
        elif isinstance(content, str):
            # Legacy format: {"content": "plain text"}
            return [{"text": content}]

        # Fallback: direct results format
        if "results" in data:
            return data["results"]

        return []

    def _extract_chunks_from_text(self, text: str) -> list[dict[str, Any]]:
        """Extract retrieved chunks from the nested JSON text response."""
        try:
            parsed = json.loads(text)
            # Format: {"statusCode": 200, "body": "{\"retrieved_chunks\": [...]}"}
            if "body" in parsed:
                body = json.loads(parsed["body"]) if isinstance(parsed["body"], str) else parsed["body"]
                if "retrieved_chunks" in body:
                    return [{"text": chunk.get("content", "")} for chunk in body["retrieved_chunks"]]
            # Direct chunks
            if "retrieved_chunks" in parsed:
                return [{"text": chunk.get("content", "")} for chunk in parsed["retrieved_chunks"]]
        except (json.JSONDecodeError, KeyError, TypeError):
            # If parsing fails, return the raw text as a single result
            if text:
                return [{"text": text}]
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

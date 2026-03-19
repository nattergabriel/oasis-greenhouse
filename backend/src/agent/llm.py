"""AWS Bedrock LLM client wrapper."""
import asyncio
import json
import logging
from typing import Any

import boto3
from botocore.exceptions import ClientError

from backend.config import settings

logger = logging.getLogger(__name__)


class BedrockClient:
    """Simple wrapper for AWS Bedrock converse API."""

    def __init__(self) -> None:
        self.client = boto3.client(
            service_name="bedrock-runtime",
            region_name=settings.aws_region,
        )
        self.model_id = settings.bedrock_model_id

    async def call(
        self,
        system_prompt: str,
        user_prompt: str,
        max_retries: int = 3,
    ) -> dict[str, Any]:
        """Call Bedrock converse API and return parsed JSON.

        Retries on throttling with exponential backoff.
        """
        for attempt in range(max_retries):
            try:
                response = await asyncio.to_thread(
                    self.client.converse,
                    modelId=self.model_id,
                    messages=[
                        {"role": "user", "content": [{"text": user_prompt}]},
                    ],
                    system=[{"text": system_prompt}],
                    inferenceConfig={"maxTokens": 4096, "temperature": 0.7},
                )

                text = response["output"]["message"]["content"][0]["text"]
                return self._parse_json(text)

            except ClientError as e:
                code = e.response.get("Error", {}).get("Code", "")
                if code == "ThrottlingException" and attempt < max_retries - 1:
                    wait = 2 ** (attempt + 1)
                    logger.warning("Throttled, retrying in %ds...", wait)
                    await asyncio.sleep(wait)
                    continue
                raise

            except Exception:
                if attempt < max_retries - 1:
                    logger.warning("Attempt %d failed, retrying...", attempt + 1)
                    await asyncio.sleep(2)
                    continue
                raise

        raise RuntimeError("LLM call failed after max retries")

    @staticmethod
    def _parse_json(text: str) -> dict[str, Any]:
        """Parse JSON from LLM response, handling common wrappers."""
        # Try direct parse first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try extracting from ```json ... ``` blocks
        if "```json" in text:
            start = text.find("```json") + 7
            end = text.find("```", start)
            if end != -1:
                return json.loads(text[start:end].strip())

        # Try extracting from ``` ... ``` blocks
        if "```" in text:
            start = text.find("```") + 3
            end = text.find("```", start)
            if end != -1:
                return json.loads(text[start:end].strip())

        # Final fallback: find first '{' and last '}' to extract embedded JSON
        first_brace = text.find("{")
        last_brace = text.rfind("}")
        if first_brace != -1 and last_brace > first_brace:
            try:
                return json.loads(text[first_brace:last_brace + 1])
            except json.JSONDecodeError:
                pass

        raise ValueError(f"Could not parse JSON from LLM response: {text[:200]}")


# Global client instance
bedrock_client = BedrockClient()

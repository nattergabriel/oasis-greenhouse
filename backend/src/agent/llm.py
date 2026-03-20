"""AWS Bedrock LLM client wrapper."""
import asyncio
import json
import logging
from typing import Any

import boto3
from botocore.exceptions import ClientError
import httpx

from ..config import settings

logger = logging.getLogger(__name__)


class BedrockClient:
    """Simple wrapper for AWS Bedrock converse API."""

    def __init__(self) -> None:
        self.model_id = settings.bedrock_model_id
        self.bearer_token = settings.aws_bearer_token_bedrock

        if self.bearer_token and self.bearer_token.strip():
            logger.info("Using bearer token authentication for Bedrock")
            self.use_bearer = True
            self.http_client = httpx.AsyncClient(timeout=60.0)
        else:
            logger.info("Using AWS credentials for Bedrock")
            self.use_bearer = False
            self.client = boto3.client(
                service_name="bedrock-runtime",
                region_name=settings.aws_region,
            )

    async def close(self) -> None:
        """Close HTTP client if using bearer token."""
        if self.use_bearer and hasattr(self, 'http_client'):
            await self.http_client.aclose()

    async def call(
        self,
        system_prompt: str,
        user_prompt: str,
        max_retries: int = 3,
    ) -> dict[str, Any]:
        """Call Bedrock converse API and return parsed JSON.

        Retries on throttling with exponential backoff.
        """
        if self.use_bearer:
            return await self._call_with_bearer_token(system_prompt, user_prompt, max_retries)
        else:
            return await self._call_with_boto3(system_prompt, user_prompt, max_retries)

    async def _call_with_bearer_token(
        self,
        system_prompt: str,
        user_prompt: str,
        max_retries: int = 3,
    ) -> dict[str, Any]:
        """Call Bedrock using bearer token (Workshop Studio)."""
        url = f"https://bedrock-runtime.{settings.aws_region}.amazonaws.com/model/{self.model_id}/converse"

        headers = {
            "Authorization": f"Bearer {self.bearer_token}",
            "Content-Type": "application/json",
        }

        payload = {
            "messages": [
                {"role": "user", "content": [{"text": user_prompt}]}
            ],
            "system": [{"text": system_prompt}],
            "inferenceConfig": {
                "maxTokens": 4096,
                "temperature": 0.7
            }
        }

        for attempt in range(max_retries):
            try:
                response = await self.http_client.post(url, json=payload, headers=headers)
                response.raise_for_status()

                data = response.json()
                text = data["output"]["message"]["content"][0]["text"]
                return self._parse_json(text)

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429 and attempt < max_retries - 1:
                    wait = 2 ** (attempt + 1)
                    logger.warning("Throttled, retrying in %ds...", wait)
                    await asyncio.sleep(wait)
                    continue
                logger.error("HTTP error: %s - %s", e.response.status_code, e.response.text)
                raise

            except Exception as e:
                if attempt < max_retries - 1:
                    logger.warning("Attempt %d failed: %s, retrying...", attempt + 1, e)
                    await asyncio.sleep(2)
                    continue
                raise

        raise RuntimeError("LLM call failed after max retries")

    async def _call_with_boto3(
        self,
        system_prompt: str,
        user_prompt: str,
        max_retries: int = 3,
    ) -> dict[str, Any]:
        """Call Bedrock using boto3 with AWS credentials."""
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

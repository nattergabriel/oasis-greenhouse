"""Tests for BedrockClient — JSON parsing + mocked call()."""
import json
import pytest
from unittest.mock import patch, MagicMock, AsyncMock

from src.agent.llm import BedrockClient


class TestParseJson:
    def test_plain_json(self):
        text = '{"key": "value", "num": 42}'
        result = BedrockClient._parse_json(text)
        assert result == {"key": "value", "num": 42}

    def test_json_code_block(self):
        text = 'Some preamble\n```json\n{"key": "value"}\n```\nSome epilogue'
        result = BedrockClient._parse_json(text)
        assert result == {"key": "value"}

    def test_plain_code_block(self):
        text = 'Here is the result:\n```\n{"actions": [1, 2]}\n```\nDone.'
        result = BedrockClient._parse_json(text)
        assert result == {"actions": [1, 2]}

    def test_invalid_input_raises(self):
        with pytest.raises(ValueError, match="Could not parse JSON"):
            BedrockClient._parse_json("This is not JSON at all")

    def test_nested_json(self):
        data = {"reasoning": "test", "actions": [{"type": "set_zone_plan", "zone": 1}]}
        text = json.dumps(data)
        result = BedrockClient._parse_json(text)
        assert result == data

    def test_json_block_with_whitespace(self):
        text = '```json\n  { "a": 1 }  \n```'
        result = BedrockClient._parse_json(text)
        assert result == {"a": 1}

    def test_json_with_surrounding_text(self):
        """Fallback should extract JSON when text surrounds braces."""
        text = 'Here is my response:\n{"key": "value", "num": 42}\nHope that helps!'
        result = BedrockClient._parse_json(text)
        assert result == {"key": "value", "num": 42}

    def test_json_with_preamble_only(self):
        """Fallback should handle text before JSON only."""
        text = 'Sure, here you go: {"actions": [1, 2, 3]}'
        result = BedrockClient._parse_json(text)
        assert result == {"actions": [1, 2, 3]}

    def test_brace_fallback_invalid_still_raises(self):
        """Braces present but not valid JSON should still raise."""
        with pytest.raises(ValueError, match="Could not parse JSON"):
            BedrockClient._parse_json("Some text {not json} end")


class TestBedrockClientCall:
    @pytest.mark.asyncio
    async def test_call_success(self):
        """call() should invoke boto3 converse and parse JSON response."""
        mock_boto_client = MagicMock()
        mock_boto_client.converse.return_value = {
            "output": {
                "message": {
                    "content": [{"text": '{"reasoning": "test", "actions": []}'}]
                }
            }
        }

        with patch("src.agent.llm.boto3.client", return_value=mock_boto_client):
            client = BedrockClient()

        result = await client.call("system prompt", "user prompt")
        assert result == {"reasoning": "test", "actions": []}
        mock_boto_client.converse.assert_called_once()

    @pytest.mark.asyncio
    async def test_call_with_code_block_response(self):
        """call() should handle LLM responses wrapped in code blocks."""
        mock_boto_client = MagicMock()
        mock_boto_client.converse.return_value = {
            "output": {
                "message": {
                    "content": [{"text": '```json\n{"reasoning": "ok"}\n```'}]
                }
            }
        }

        with patch("src.agent.llm.boto3.client", return_value=mock_boto_client):
            client = BedrockClient()

        result = await client.call("sys", "usr")
        assert result == {"reasoning": "ok"}

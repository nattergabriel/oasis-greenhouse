"""Tests for KnowledgeBaseClient with respx-mocked HTTP."""
import pytest
import respx
import httpx

from src.kb.client import KnowledgeBaseClient


@pytest.fixture
def kb_client_instance():
    """Create a KB client; we'll mock its endpoint via respx."""
    client = KnowledgeBaseClient()
    return client


class TestKBQuery:
    @respx.mock
    @pytest.mark.asyncio
    async def test_query_with_results(self, kb_client_instance):
        route = respx.post(kb_client_instance.endpoint).mock(
            return_value=httpx.Response(200, json={
                "results": [
                    {"text": "Potatoes grow best at 20°C"},
                    {"text": "Lettuce needs 12h light"},
                ]
            })
        )

        results = await kb_client_instance.query("crop growing conditions")
        assert route.called
        assert len(results) == 2
        assert results[0]["text"] == "Potatoes grow best at 20°C"

    @respx.mock
    @pytest.mark.asyncio
    async def test_query_with_content_format(self, kb_client_instance):
        respx.post(kb_client_instance.endpoint).mock(
            return_value=httpx.Response(200, json={
                "content": "Alternative response format"
            })
        )

        results = await kb_client_instance.query("test query")
        assert len(results) == 1
        assert results[0]["text"] == "Alternative response format"

    @respx.mock
    @pytest.mark.asyncio
    async def test_query_empty_response(self, kb_client_instance):
        respx.post(kb_client_instance.endpoint).mock(
            return_value=httpx.Response(200, json={})
        )

        results = await kb_client_instance.query("test query")
        assert results == []


class TestKBQueryCropProfiles:
    @respx.mock
    @pytest.mark.asyncio
    async def test_query_crop_profiles(self, kb_client_instance):
        respx.post(kb_client_instance.endpoint).mock(
            return_value=httpx.Response(200, json={
                "results": [{"text": "Potato profile data"}]
            })
        )

        result = await kb_client_instance.query_crop_profiles()
        assert isinstance(result, str)
        assert "Potato profile data" in result


class TestKBQueryNutritionTargets:
    @respx.mock
    @pytest.mark.asyncio
    async def test_query_nutrition_targets(self, kb_client_instance):
        respx.post(kb_client_instance.endpoint).mock(
            return_value=httpx.Response(200, json={
                "results": [{"text": "Crew needs 12000 kcal/day"}]
            })
        )

        result = await kb_client_instance.query_nutrition_targets()
        assert isinstance(result, str)
        assert "12000 kcal" in result


class TestKBQueryStressResponse:
    @respx.mock
    @pytest.mark.asyncio
    async def test_query_stress_response(self, kb_client_instance):
        respx.post(kb_client_instance.endpoint).mock(
            return_value=httpx.Response(200, json={
                "results": [{"text": "Drought mitigation: reduce watering"}]
            })
        )

        result = await kb_client_instance.query_stress_response("drought")
        assert isinstance(result, str)
        assert "Drought" in result


class TestKBQueryOperationalScenario:
    @respx.mock
    @pytest.mark.asyncio
    async def test_query_operational_scenario(self, kb_client_instance):
        respx.post(kb_client_instance.endpoint).mock(
            return_value=httpx.Response(200, json={
                "results": [{"text": "Water recycling failure protocol"}]
            })
        )

        result = await kb_client_instance.query_operational_scenario("water_recycling")
        assert isinstance(result, str)
        assert "Water recycling" in result


class TestFormatResults:
    def test_format_results_empty(self, kb_client_instance):
        result = kb_client_instance._format_results([])
        assert "No relevant information" in result

    def test_format_results_multiple(self, kb_client_instance):
        results = [
            {"text": "Result one"},
            {"text": "Result two"},
        ]
        formatted = kb_client_instance._format_results(results)
        assert "[Result 1]" in formatted
        assert "[Result 2]" in formatted
        assert "Result one" in formatted
        assert "Result two" in formatted

    def test_format_results_content_key(self, kb_client_instance):
        results = [{"content": "Content-keyed result"}]
        formatted = kb_client_instance._format_results(results)
        assert "Content-keyed result" in formatted

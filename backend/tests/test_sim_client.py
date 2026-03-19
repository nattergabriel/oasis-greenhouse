"""Tests for SimEngineClient with respx-mocked HTTP."""
import pytest
import respx
import httpx

from src.models.state import GreenhouseState
from src.sim_client import SimEngineClient


@pytest.fixture
def sim_client():
    return SimEngineClient(base_url="http://testengine:8001")


class TestSimEngineInit:
    @respx.mock
    @pytest.mark.asyncio
    async def test_init_default(self, sim_client, mock_sim_init_response):
        route = respx.post("http://testengine:8001/simulate/init").mock(
            return_value=httpx.Response(200, json=mock_sim_init_response)
        )

        result = await sim_client.init()
        assert isinstance(result, GreenhouseState)
        assert result.day == 0
        assert route.called

    @respx.mock
    @pytest.mark.asyncio
    async def test_init_with_assignments(self, sim_client, mock_sim_init_response):
        route = respx.post("http://testengine:8001/simulate/init").mock(
            return_value=httpx.Response(200, json=mock_sim_init_response)
        )

        result = await sim_client.init(seed=123, crop_assignments={0: "potato", 1: "lettuce"})
        assert isinstance(result, GreenhouseState)
        import json
        body = json.loads(route.calls[0].request.content)
        assert body["seed"] == 123
        assert body["crop_assignments"]["0"] == "potato"


class TestSimEngineTick:
    @respx.mock
    @pytest.mark.asyncio
    async def test_tick_basic(self, sim_client, sample_greenhouse, mock_sim_tick_response):
        route = respx.post("http://testengine:8001/simulate/tick").mock(
            return_value=httpx.Response(200, json=mock_sim_tick_response)
        )

        result = await sim_client.tick(
            state=sample_greenhouse,
            actions=[{"action": "set_crop", "slot_id": 0, "crop_type": "potato"}],
            days=30,
        )
        assert route.called
        assert isinstance(result["state"], GreenhouseState)
        assert result["days_simulated"] == 30
        assert result["stopped_early"] is False

    @respx.mock
    @pytest.mark.asyncio
    async def test_tick_with_inject_events(self, sim_client, sample_greenhouse, mock_sim_tick_response):
        route = respx.post("http://testengine:8001/simulate/tick").mock(
            return_value=httpx.Response(200, json=mock_sim_tick_response)
        )

        events = [{"event_type": "water_recycling_degradation", "duration_sols": 10}]
        result = await sim_client.tick(
            state=sample_greenhouse,
            actions=[],
            days=30,
            inject_events=events,
        )
        assert route.called
        import json
        body = json.loads(route.calls[0].request.content)
        assert len(body["inject_events"]) == 1

    @respx.mock
    @pytest.mark.asyncio
    async def test_tick_http_error(self, sim_client, sample_greenhouse):
        respx.post("http://testengine:8001/simulate/tick").mock(
            return_value=httpx.Response(500, json={"error": "internal"})
        )

        with pytest.raises(httpx.HTTPStatusError):
            await sim_client.tick(state=sample_greenhouse, actions=[], days=30)

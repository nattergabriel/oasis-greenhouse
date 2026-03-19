"""Tests for SimEngineClient with respx-mocked HTTP."""
import pytest
import respx
import httpx

from backend.models.state import GreenhouseState, SimEngineConfig
from backend.sim_client import SimEngineClient


@pytest.fixture
def sim_client():
    return SimEngineClient(base_url="http://testengine:8001")


class TestSimEngineInit:
    @respx.mock
    @pytest.mark.asyncio
    async def test_init_default_config(self, sim_client, mock_sim_init_response):
        route = respx.post("http://testengine:8001/simulate/init").mock(
            return_value=httpx.Response(200, json=mock_sim_init_response)
        )

        result = await sim_client.init()
        assert isinstance(result, GreenhouseState)
        assert result.mission_day == 0
        assert route.called

    @respx.mock
    @pytest.mark.asyncio
    async def test_init_custom_config(self, sim_client, mock_sim_init_response):
        route = respx.post("http://testengine:8001/simulate/init").mock(
            return_value=httpx.Response(200, json=mock_sim_init_response)
        )

        config = SimEngineConfig(num_zones=6, zone_area_m2=20.0)
        result = await sim_client.init(config)
        assert isinstance(result, GreenhouseState)
        # Verify request body includes our config
        request_body = route.calls[0].request.content
        import json
        body = json.loads(request_body)
        assert body["config"]["num_zones"] == 6
        assert body["config"]["zone_area_m2"] == 20.0


class TestSimEngineTick:
    @respx.mock
    @pytest.mark.asyncio
    async def test_tick_basic(self, sim_client, sample_greenhouse, mock_sim_tick_response):
        route = respx.post("http://testengine:8001/simulate/tick").mock(
            return_value=httpx.Response(200, json=mock_sim_tick_response)
        )

        result = await sim_client.tick(
            state=sample_greenhouse,
            actions=[{"action": "set_zone_plan", "zone_id": 1}],
            days=30,
        )
        assert route.called
        assert isinstance(result["final_state"], GreenhouseState)
        assert result["days_simulated"] == 30
        assert result["stopped_early"] is False

    @respx.mock
    @pytest.mark.asyncio
    async def test_tick_with_inject_events(self, sim_client, sample_greenhouse, mock_sim_tick_response):
        route = respx.post("http://testengine:8001/simulate/tick").mock(
            return_value=httpx.Response(200, json=mock_sim_tick_response)
        )

        events = [{"type": "dust_storm", "day": 5, "severity": 0.8}]
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

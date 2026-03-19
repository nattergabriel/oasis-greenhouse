"""Tests for backend.config — Settings defaults."""
import os
from unittest.mock import patch


def test_settings_defaults():
    """Settings should load with sane defaults even without .env."""
    # Reimport with clean env to get defaults
    with patch.dict(os.environ, {}, clear=False):
        from src.config import Settings
        s = Settings()

    assert s.sim_engine_url == "http://localhost:8001"
    assert s.aws_region == "us-west-2"
    assert "anthropic" in s.bedrock_model_id or "claude" in s.bedrock_model_id
    assert s.kb_endpoint.startswith("https://")
    assert s.strategy_file_path == "strategy/current_strategy.md"
    assert s.initial_strategy_path == "docs/STRATEGY-INITIAL.md"
    assert s.simulations_dir == "data/simulations"


def test_settings_env_override():
    """Settings should pick up env var overrides."""
    with patch.dict(os.environ, {"SIM_ENGINE_URL": "http://test:9999"}):
        from src.config import Settings
        s = Settings()
    assert s.sim_engine_url == "http://test:9999"

"""Configuration and environment variables."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Sim engine
    sim_engine_url: str = "http://localhost:8001"

    # Management backend (bridge)
    management_backend_url: str = "http://localhost:8080"
    agent_token: str = "14f4c3d9a9c7f2389927510a5461e46a974bc74c2f673f065dffaf0ee7f9bd5c"
    system_token: str = "ef6b0e8afb0c29c478c1b6665f252814b734aac242915f9364bb6df8a429e051"

    # AWS Bedrock
    aws_region: str = "us-west-2"
    bedrock_model_id: str = "us.anthropic.claude-sonnet-4-20250514-v1:0"

    # MCP Knowledge Base
    kb_endpoint: str = (
        "https://kb-start-hack-gateway-buyjtibfpg"
        ".gateway.bedrock-agentcore.us-east-2.amazonaws.com/mcp"
    )
    kb_tool_name: str = "kb-start-hack-target___knowledge_base_retrieve"

    # Strategy document path (relative to project root)
    strategy_file_path: str = "strategy/current_strategy.md"
    initial_strategy_path: str = "docs/STRATEGY-INITIAL.md"

    # Simulation results storage (relative to project root)
    simulations_dir: str = "data/simulations"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


# Global settings instance
settings = Settings()

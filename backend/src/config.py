"""Configuration and environment variables."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Sim engine
    sim_engine_url: str = "http://localhost:8001"

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

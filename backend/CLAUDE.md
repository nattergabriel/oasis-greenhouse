# CLAUDE.md — Mars Greenhouse Backend

## Project Overview
Build the **backend only** for an autonomous Mars greenhouse AI agent. No frontend code.

Read ALL files in `docs/` before writing any code — they are the complete spec.

## Key Design Decisions
- **Python 3.12 + FastAPI** for the API server
- **LangGraph** for the agent state machine
- **AWS Bedrock** (boto3) for LLM calls — use `us-west-2` region, model `us.anthropic.claude-sonnet-4-20250514-v1:0`
- **MCP Knowledge Base** for crop/environmental data via the endpoint in ARCHITECTURE.md
- **Separate sim engine** — we only build an HTTP client to talk to it, NOT the sim engine itself
- Use **Pydantic v2** for all models
- Use **httpx** (async) for HTTP clients

## Architecture
```
backend/
├── main.py                  # FastAPI app, endpoints
├── graph.py                 # LangGraph state machine
├── nodes/
│   ├── init.py
│   ├── plan.py
│   ├── simulate.py
│   ├── react.py
│   └── reflect.py
├── agent/
│   ├── prompts.py           # Prompt templates
│   └── llm.py               # Bedrock client wrapper
├── kb/
│   ├── client.py            # MCP KB query client
│   └── cache.py             # Cached crop/nutrition data
├── models/
│   └── state.py             # Pydantic models
├── sim_client.py            # HTTP client for sim engine
├── strategy/
│   └── store.py             # Read/write strategy document
├── config.py                # Settings/env vars
└── requirements.txt
```

## Code Principles
1. **Simple and clean** — no over-engineering. Readability over cleverness.
2. **Modular** — each file has one clear responsibility. Small files.
3. **Best practices** — type hints everywhere, async where it makes sense, proper error handling.
4. **No unnecessary abstractions** — don't add layers that aren't needed.
5. **Follow the docs exactly** — the state model, API, prompts are all specified in `docs/`.

## What to Build
1. **Pydantic models** (`models/state.py`) — match STATE-MODEL.md exactly
2. **Config** (`config.py`) — env vars for sim engine URL, Bedrock region, KB endpoint, etc.
3. **Bedrock LLM client** (`agent/llm.py`) — simple wrapper, JSON output parsing
4. **Prompt templates** (`agent/prompts.py`) — from PROMPTS.md
5. **Sim engine HTTP client** (`sim_client.py`) — calls init/tick/inject-event per SIM-ENGINE-API.md
6. **MCP KB client** (`kb/client.py`) — queries the MCP knowledge base
7. **KB cache** (`kb/cache.py`) — caches crop profiles + nutrition targets at startup
8. **Strategy store** (`strategy/store.py`) — read/write the strategy markdown file
9. **LangGraph nodes** (`nodes/`) — init, plan, simulate, react, reflect per ARCHITECTURE.md
10. **LangGraph graph** (`graph.py`) — wires the nodes together with routing
11. **FastAPI endpoints** (`main.py`) — the 4 API endpoints from ARCHITECTURE.md
12. **requirements.txt** — all dependencies with pinned versions

## What NOT to Build
- No frontend code
- No sim engine (it's a separate server built by a teammate)
- No Docker/deployment files
- No test files (keep it lean)

## Sim Engine
The sim engine is a **separate server**. We build an HTTP client (`sim_client.py`) that calls its 3 endpoints. The sim engine URL comes from config/env vars. Default to `http://localhost:8001`.

## LLM Calls
Use boto3 bedrock-runtime `converse` API directly. Keep it simple:
- System prompt + user prompt → get JSON response
- Parse the JSON from the response
- Handle retries on throttling

## Strategy Document
Store as a markdown file on disk (`strategy/current_strategy.md`). The initial strategy is in `docs/STRATEGY-INITIAL.md`. Copy it as the starting point if no strategy file exists.

## Simulation Results Storage
Store simulation results as JSON files in a `data/simulations/` directory. Use UUID for run IDs.

## Important: The Agent Does NOT Plant/Harvest
The agent sets **zone plans** (percentage-based crop allocations). The sim engine handles planting, harvesting, and replanting automatically. Read BACKEND-SUMMARY.md carefully.

## Run Command
The app should run with: `uvicorn backend.main:app --host 0.0.0.0 --port 8000`

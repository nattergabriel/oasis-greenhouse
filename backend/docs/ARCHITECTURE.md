# Backend Architecture

## Stack

- **Python + FastAPI** — orchestrator, API for frontend
- **LangGraph** — agent state machine
- **AWS Bedrock** (boto3, Claude Sonnet) — LLM calls
- **MCP Knowledge Base** — Syngenta-provided crop/environmental data
- **Separate sim engine server** — stateless, built by teammate

## Two Modes

**Training mode**: Run simulations to improve the strategy document. No frontend. Backend-only loop.

**Demo mode**: Frontend loads a pre-computed SimulationResult and plays it back on a timeline. No live simulation.

## API

```
POST /api/training/run              Run simulation + improve strategy
GET  /api/simulations               List past simulation runs
GET  /api/simulations/{id}          Get full result (for playback)
GET  /api/strategy                  Current strategy document
```

## LangGraph State Machine

```
init → plan → simulate → plan       (batch done, days remaining)
                       → react      (event/threshold) → simulate
                       → reflect    (day 450 or max iterations) → done
```

Cycle guard: max 30 iterations before forcing reflect.

### Nodes

**`init`** — Calls sim engine `/simulate/init`. Loads strategy doc. Caches KB crop profiles + nutrition targets.

**`plan`** — Sends state + strategy + KB data to LLM. Gets back crop assignments per slot, environment settings, and water allocations for ~30 days.

**`simulate`** — Sends state + actions to sim engine `/simulate/tick`. Routes to `react` on early stop, `plan` if more days remain, or `reflect` at day 450.

**`react`** — Crisis response. Queries KB live for stress/scenario guidance. LLM outputs response actions. Routes back to `simulate`.

**`reflect`** — Post-mission. LLM rewrites strategy document based on run results.

## KB Integration

**Cached at startup** (reused across all runs):
- Crop profiles (domain 3): growth cycles, yields, nutritional values
- Nutritional targets (domain 5): daily requirements for 4 astronauts

**Live queries during `react`**:
- Stress response guides (domain 4)
- Operational scenarios (domain 6)

MCP endpoint: `https://kb-start-hack-gateway-buyjtibfpg.gateway.bedrock-agentcore.us-east-2.amazonaws.com/mcp`

## Project Structure

```
backend/src/
├── main.py              # FastAPI app, 4 endpoints
├── config.py            # Settings from env vars
├── graph.py             # LangGraph state machine + routing
├── models/
│   └── state.py         # Pydantic models + AgentState TypedDict
├── nodes/
│   ├── init.py          # Initialize greenhouse + load KB + strategy
│   ├── plan.py          # LLM planning (~30 day batches)
│   ├── simulate.py      # Execute via sim engine, track metrics
│   ├── react.py         # LLM crisis response
│   └── reflect.py       # LLM strategy rewrite
├── agent/
│   ├── prompts.py       # Prompt templates (plan/react/reflect)
│   └── llm.py           # Bedrock client wrapper
├── kb/
│   ├── client.py        # MCP KB query client
│   └── cache.py         # Cached crop/nutrition data
├── sim_client.py        # HTTP client for sim engine
└── strategy/
    └── store.py         # Read/write strategy document
```

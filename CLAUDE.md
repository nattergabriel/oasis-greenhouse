# Project: Martian Greenhouse AI Agent

Syngenta + AWS hackathon (START Hack 2026, St. Gallen). Building an autonomous AI agent system to manage a Martian greenhouse for a 450-day mission with 4 astronauts.

## Team & Roles

| Role | Person | Workspace | Tools |
|------|--------|-----------|-------|
| PM / Design / Demo Lead | Michael | `product/`, `simulation/` | Claude Desktop + Claude Code |
| Backend Dev | — | `backend/`, `simulation/` | — |
| Frontend Dev | — | `frontend/` | — |
| Full-Stack / Integration | — | `shared/`, `contracts/` | — |

## Directory Structure

```
simulation/   → Greenhouse simulation engine (stateless REST server)
product/      → PM/Design workspace: features, research, brand, pitch
frontend/     → Frontend app (Next.js + Tailwind + shadcn)
backend/      → Backend orchestrator + agent logic
shared/       → Shared constants, types
contracts/    → API contract (frontend↔backend interface)
docs/         → Team-wide docs
```

## Write Rules — Prevent Merge Conflicts

Each person only writes to their own workspace. Read anything for context.

- **Michael (PM/Design/Simulation):** writes to `product/` and `simulation/`
- **Frontend Dev:** writes to `frontend/`
- **Backend Dev:** writes to `backend/` and `simulation/`
- **Full-Stack:** writes to `shared/`, `contracts/`, `docs/`

## Simulation Engine — How It Works

**Source of truth:** `simulation/docs/SIMULATION-SPEC.md`

The simulation engine is a **stateless REST server** with 3 endpoints:
- `POST /simulate/init` — create initial empty greenhouse state
- `POST /simulate/tick` — advance N days with agent actions, return updated state
- `POST /simulate/inject-event` — manually inject a crisis event

### Key design decisions
- **5 crop types** (all KB-backed): lettuce, potato, radish, beans/peas, herbs
- **16 slots × 4 m²** = 64 m² total greenhouse area (4×4 grid of 2m×2m slots)
- **Single crop per slot**: agent assigns one crop type per slot via `set_crop`. Engine fills the slot and auto-replants after harvest.
- **Auto-harvest + auto-replant**: crops harvest automatically at ≥95% growth. Engine replants same crop type. Agent does not control harvest timing.
- **Batch execution**: agent plans ~30 days ahead. Sim runs the batch, stops early on events or threshold breaches, returns control to orchestrator for agent reaction.
- **2 core events**: `water_recycling_degradation` (KB 6.3) and `temperature_control_failure` (KB 6.6).
- **Stored food**: crew arrives with 5.4M kcal. Greenhouse supplements it. Crew never starves.
- **Success metrics**: calorie greenhouse fraction, protein greenhouse fraction, micronutrient coverage (0-7), plus resource efficiency and crop loss.
- **No health/mood/death** in core. Crew wellbeing = greenhouse fraction metrics.

### Agent actions
| Action | What it does |
|--------|-------------|
| `set_crop` | Assign a crop type to a slot (clears + refills) |
| `plant` | Add one crop to a slot if space available |
| `remove` | Remove a specific crop |
| `water_adjust` | Set slot water multiplier (0-1.5) |
| `light_toggle` | Toggle slot artificial lighting |
| `set_temperature` | Adjust greenhouse temperature |

### Agent triggers (~20-25 LLM calls per 450-day run)
- Day 0: initial crop assignments
- Every ~30 days: scheduled review
- Event fires: reactive response
- Threshold breaches: crop health <30, water <15%, energy deficit 3+ days

## Backend Architecture

The **backend orchestrator** manages the agent loop:
1. Calls `/simulate/init` → gets empty state
2. Sends state to agent (LLM) → gets crop assignments + settings
3. Calls `/simulate/tick` with actions for ~30 days
4. If early stop → sends state to agent → gets reactive actions → calls tick again
5. Repeat until day 450 (max 30 iterations as safety guard)
6. Post-run: LLM analyzes run, rewrites strategy document

See `backend/docs/LEARNING-SYSTEM.md` for how the agent learns across runs.

## Frontend↔Backend API

`contracts/API.md` is the frontend's working contract. It is more detailed than the sim engine output — the backend translates sim output into the rich API format (slots → grid positions, environment → sensor readings, nutrition fractions → granular entries, stress types → alerts).

The frontend builds against `contracts/API.md` with mock data. The backend implements those endpoints using sim engine output.

## MCP Knowledge Base

```
Endpoint: https://kb-start-hack-gateway-buyjtibfpg.gateway.bedrock-agentcore.us-east-2.amazonaws.com/mcp
Protocol: Streamable HTTP (JSON-RPC 2.0)
```

7 domains: Mars environment, controlled agriculture, crop profiles, plant stress, human nutrition, operational scenarios, Mars-to-Earth innovation.

Raw KB source documents: `backend/docs/Mars-Crop-Data/`
Cached KB query responses: `simulation/kb_data/`

## Key Context Files

| File | Purpose | Status |
|------|---------|--------|
| `simulation/docs/SIMULATION-SPEC.md` | Full simulation spec — SOURCE OF TRUTH | ✅ Current |
| `backend/docs/ARCHITECTURE.md` | Backend architecture + LangGraph flow | ✅ Current |
| `backend/docs/SIM-ENGINE-API.md` | Sim engine REST API reference | ✅ Current |
| `backend/docs/LEARNING-SYSTEM.md` | Agent learning approach | ✅ Current |
| `contracts/API.md` | Frontend↔backend API contract | Needs minor updates |
| `product/FEATURES.md` | Agreed feature list | ✅ Current |
| `product/research/CASE-BRIEF.md` | Syngenta challenge brief | ✅ Current |
| `product/research/TECH-STACK.md` | MCP config, AWS infra, architecture | ✅ Current |

## Tech Stack

- **Frontend:** Next.js + Tailwind + shadcn/ui
- **Agent:** Strands Agents SDK (Python) on Amazon Bedrock AgentCore
- **Simulation:** Python (FastAPI REST server)
- **Database:** DynamoDB (state, logs, run history)
- **Knowledge Base:** Amazon Bedrock KB via AgentCore Gateway (MCP)

## Conventions

- Commit early and often with descriptive messages.
- Working > clean. It's a hackathon.
- The demo IS the product — invest in what's visible.

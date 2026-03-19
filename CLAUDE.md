# Project: Martian Greenhouse AI Agent

Syngenta + AWS hackathon. Building an autonomous AI agent system to manage a Martian greenhouse for a 450-day mission with 4 astronauts.

## Team & Roles

| Role | Person | Workspace | Tools |
|------|--------|-----------|-------|
| PM / Design / Demo Lead | Michael | `product/`, `simulation/` | Claude Desktop |
| Frontend Dev | — | `frontend/` | — |
| Backend Dev | — | `backend/` | — |
| Full-Stack / Integration | — | `shared/`, `contracts/` | — |

Michael is working simultaneously in **Claude Desktop** (product/design/simulation spec) and **Claude Code in VS Code** (simulation engine code). Both should be aware of each other's scope.

## Directory Structure

```
simulation/   → Greenhouse simulation engine (Michael + backend dev)
product/      → PM/Design workspace: features, research, brand, pitch (Michael)
frontend/     → Frontend app
backend/      → Backend API + agent
shared/       → Shared constants, types, validation schemas
contracts/    → API contract (source of truth for frontend↔backend)
docs/         → Team-wide docs (timeline, roles, feature list)
```

## Write Rules — Prevent Merge Conflicts

Each person only writes to their own workspace. Read anything for context.

- **Michael (PM/Design/Simulation):** writes to `product/` and `simulation/`
- **Frontend Dev:** writes to `frontend/`
- **Backend Dev:** writes to `backend/`
- **Full-Stack:** writes to `shared/`, `contracts/`, `docs/`

**Do not write outside your workspace unless explicitly told to.**

## Simulation Engine

The simulation is the core deliverable. See `simulation/SIMULATION-SPEC.md` for the full specification.

Key points:
- Day-by-day loop simulating 450 sols on Mars
- Components: Mars environment, crops (6 types, 4 zones), astronauts (4), resource pool, random events
- Agent reads simulation state each tick and takes actions (plant, harvest, adjust water/light/temp)
- Agent queries Syngenta knowledge base via MCP endpoint for decision support
- Learning system: agent maintains a "strategy document" that evolves across runs (see `backend/docs/LEARNING-SYSTEM.md`)
- State emitted as JSON per tick — consumed by frontend dashboard and agent

## MCP Knowledge Base

```
Endpoint: https://kb-start-hack-gateway-buyjtibfpg.gateway.bedrock-agentcore.us-east-2.amazonaws.com/mcp
Protocol: Streamable HTTP (JSON-RPC 2.0)
```

7 domains: Mars environment, controlled agriculture, crop profiles, plant stress, human nutrition, operational scenarios, Mars-to-Earth innovation.

The simulation parameters and agent decisions should both reference this source so they stay consistent.

## Key Context Files

| File | Purpose |
|------|---------|
| `simulation/SIMULATION-SPEC.md` | Full simulation spec (parameters, formulas, state schema) |
| `product/FEATURES.md` | Agreed feature list |
| `product/research/CASE-BRIEF.md` | Syngenta challenge brief |
| `product/research/TECH-STACK.md` | MCP config, AWS architecture, all reference links |
| `backend/docs/LEARNING-SYSTEM.md` | Agent learning approach |
| `product/Instruction Docs/README.md` | Official hackathon getting started guide |
| `product/Instruction Docs/Challenge.md` | Official challenge description |

## Tech Stack

- **Frontend:** AWS Amplify Gen2 (React)
- **Agent:** Strands Agents SDK (Python) on Amazon Bedrock AgentCore
- **Simulation:** Python
- **Database:** DynamoDB (state, logs, run history)
- **Knowledge Base:** Amazon Bedrock KB via AgentCore Gateway (MCP)
- **IDE:** Kiro (with Strands SDK + Amplify powers enabled)

## Contracts

- `contracts/API.md` is the single source of truth for the API. Both frontend and backend must match it.
- Update it when anything changes.
- All request/response bodies are JSON. Use standard HTTP status codes.

## Conventions

- Commit early and often with descriptive messages.
- Check in with the team every ~2 hours.
- Working > clean. It's a hackathon.
- The demo IS the product — invest in what's visible.

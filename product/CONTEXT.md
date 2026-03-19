# Product Context — Updated Day 2

## Role
**Michael** — PM / Design / Demo Lead

## Current Phase
**Day 2 of hackathon.** Simulation engine complete. Backend integrated. Grid being updated to 4×4. Moving to presentation and brand.

## What Exists Right Now

| Component | Status | What it does |
|---|---|---|
| Simulation engine | ✅ Complete (192 tests) | Stateless physics: crops grow, stress, harvest, resources, feeding |
| Backend orchestrator | ✅ Built + integrated | LangGraph agent: plan → simulate → react → reflect |
| AI agent | ✅ Working | Claude Sonnet via Bedrock, KB queries, strategy learning |
| Frontend | 🔨 In progress | Next.js dashboard, adapting to slot model |
| Management backend | 🔨 Built, needs bridging | Java Spring Boot, serves frontend API |
| Presentation | 🚧 Starting now | 7-slide pitch, brand identity defined |

## The Current Design (Source of Truth)

**Greenhouse:** 4×4 grid of 4 m² slots = 64 m² total (being updated from 2×2). Each slot holds one crop type. Agent assigns crops to slots. Engine auto-fills and auto-replants.

**Crops (5, all KB-backed):** potato, lettuce, radish, beans_peas, herbs

**Agent actions:** assign crop type to slot, water_adjust, light_toggle, set_temperature, remove

**Agent loop:** init → plan (LLM) → simulate (30 days) → [react if crisis / plan if batch done / reflect if day 450]

**Learning:** Strategy document rewritten after each 450-day run. Gets sharper, not longer.

## Key Source Files

| Document | Location | Purpose |
|---|---|---|
| **Sim spec** | `simulation/docs/SIMULATION-SPEC.md` | Full simulation specification |
| **Sim config** | `simulation/src/config.py` | All constants (crops, stress, events, thresholds) |
| **Sim models** | `simulation/src/models.py` | State dataclasses + API models |
| **Backend agent** | `backend/src/graph.py` | LangGraph state machine |
| **Backend models** | `backend/src/models/state.py` | Pydantic models (aligned with sim) |
| **Backend sim client** | `backend/src/sim_client.py` | HTTP client for sim engine |

## Key Product Documents

| Document | Location | Purpose |
|---|---|---|
| **Product index** | `product/INDEX.md` | Map of everything in product/ |
| **Project Definition** | `product/PROJECT-DEFINITION.md` | What the project is, how to talk about it |
| **Pitch Script** | `product/pitch/PITCH-SCRIPT.md` | 7-slide, 3-minute pitch with exact words |
| **Brand Identity** | `product/brand/IDENTITY.md` | Colors, fonts, design guidelines |
| **Business Case** | `product/research/BUSINESS-CASE.md` | Why this matters commercially |
| **Partner Analysis** | `product/research/PARTNER-ANALYSIS.md` | Syngenta deep dive |
| **Case Brief** | `product/research/CASE-BRIEF.md` | Original challenge requirements |

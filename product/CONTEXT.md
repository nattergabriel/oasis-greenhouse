# Product Context — Updated Day 2

## Role
**Michael** — PM / Design / Demo Lead

## Current Phase
**Day 2 of hackathon.** Simulation engine complete. Backend integrated. Moving to presentation and brand.

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

**Greenhouse:** Grid of 2×2m slots (configurable). Each slot holds one crop type. Agent assigns crops to slots. Engine auto-fills and auto-replants.

**Crops (5, all KB-backed):** potato, lettuce, radish, beans_peas, herbs

**Agent actions:** assign crop to slot, water_adjust, light_toggle, set_temperature, remove

**Agent loop:** init → plan (LLM) → simulate (30 days) → [react if crisis / plan if batch done / reflect if day 450]

**Learning:** Strategy document rewritten after each 450-day run. Gets sharper, not longer.

## Key Product Documents

| Document | Location | Purpose |
|---|---|---|
| **Project Definition** | `product/PROJECT-DEFINITION.md` | What the project is, how to talk about it |
| **Pitch Script** | `product/pitch/PITCH-SCRIPT.md` | 7-slide, 3-minute pitch with exact words |
| **Brand Identity** | `product/brand/IDENTITY.md` | Colors, fonts, design guidelines |
| **Business Case** | `product/research/BUSINESS-CASE.md` | Why this matters commercially |
| **Partner Analysis** | `product/research/PARTNER-ANALYSIS.md` | Syngenta deep dive |
| **Market Fit** | `product/research/MARKET-FIT.md` | Competitive landscape, value prop |
| **Value Roadmap** | `product/research/VALUE-ROADMAP.md` | Hackathon → pilot → scale |
| **Case Brief** | `product/research/CASE-BRIEF.md` | Original challenge requirements |
| **Sim API Reference** | `simulation/API-REFERENCE.md` | Exact JSON schemas |

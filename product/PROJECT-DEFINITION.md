# Project Definition — Mars Greenhouse AI Agent

> **This is the single source of truth for what our project is, what it does, and how to talk about it.**
> Updated: Day 2 of hackathon. All other product docs reference this.

---

## The One-Liner

An autonomous AI agent that manages a Martian greenhouse to feed 4 astronauts over 450 days — learning from each simulation run and applying the same technology to Earth's $108 billion controlled environment agriculture industry.

## Project Name

**TERRA NOVA** — "New Earth"

The name works on two levels: building a new agricultural world on Mars, and bringing that technology back to transform agriculture on Earth. It echoes Syngenta's vision of "Agricultural Intelligence" and the Mars-to-Earth technology transfer story.

Tagline: **"From Mars to Earth, one harvest at a time."**

---

## What We Built

### The Simulation Engine
A scientifically accurate, KB-grounded greenhouse simulation that models:
- **5 crop types** from Syngenta's Knowledge Base: potato, lettuce, radish, beans/peas, herbs
- **Seasonal Mars environment**: solar hours (9-15h), temperature (-83 to -43°C), energy budget
- **Resource management**: 10,000L water with 90% recycling, nutrient cycling
- **7 stress types** from KB Domain 4: drought, overwatering, heat, cold, nutrient deficiency, light insufficient, CO₂ imbalance
- **2 crisis events** from KB Domain 6: water recycling degradation, temperature control failure
- **Auto-harvest and auto-replant** per agent-defined crop assignments
- **Crew feeding**: greenhouse food first, stored food fills gap, tracking calorie fraction, protein fraction, and 7 critical micronutrients

192 tests. 450-day simulation verified at ~17% average calorie greenhouse fraction.

### The AI Agent
A LangGraph-based autonomous agent that:
- **Plans** crop allocations using Syngenta's MCP Knowledge Base + a learned strategy document
- **Executes** plans through the simulation in 30-day batches
- **Reacts** to crises (events, threshold breaches) with live KB-guided responses
- **Learns** by rewriting its strategy document after each simulation run — keeping what works, dropping what doesn't
- Uses **Claude Sonnet via AWS Bedrock** for decision-making

~20-25 LLM calls per 450-day simulation. The agent improves with every run.

### The Dashboard
A real-time visualization showing:
- Greenhouse grid with individual crop status (health, growth, stress)
- Environmental gauges (temperature, solar, energy budget)
- Resource levels and depletion forecasts
- Nutrition tracking (calorie/protein fractions, micronutrient coverage)
- Agent activity log with reasoning chains
- Crisis alerts and agent responses
- Simulation playback at variable speed

---

## How It Connects to Syngenta

### Direct alignment with Syngenta's vision

| Syngenta initiative | Our project demonstrates |
|---|---|
| **Cropwise Open Platform** (APIs for developers to build on Cropwise) | We built an AI agent that could plug into the Cropwise ecosystem — zone-level crop management, automated decision-making, KB-driven advice |
| **Agricultural Intelligence** (AI as the 4th agricultural revolution) | Our agent uses KB data + learned strategy to make autonomous crop decisions, exactly the "personal digital agronomist" Syngenta envisions |
| **GenAI Chatbot** (2M+ farmers in India, 95% accuracy) | Our agent's react node queries the KB live for crisis guidance — same pattern as the Cropwise Grower chatbot |
| **IPSOS "Hidden AI"** (farmers use AI without knowing it) | Our dashboard shows the agent's reasoning transparently — building the trust Syngenta's research says is essential |
| **5 Pillars of Equitable AI** | Our system delivers: proof of returns (measurable calorie fraction), simplification (auto-harvest/replant), local solutions (KB-grounded parameters), trust (transparent reasoning) |
| **AI Manifesto** (human oversight, not black boxes) | Our admin panel lets operators inject events, adjust parameters, and review all agent decisions with full reasoning chains |

### The Mars-to-Earth story

This is not just a Mars demo. The technology we built is directly applicable to:

- **Controlled Environment Agriculture** — $108B market in 2025, growing to $420B by 2035
- **Vertical farming** — $9.6B market, 19.3% CAGR, built on NASA technology (LED lighting, hydroponics, aeroponics)
- **Syngenta's Cropwise platform** — our AI agent architecture could integrate as a decision-support module for Cropwise Operations

NASA's Kennedy Space Center Biomass Production Chamber (1988-2000) was the first vertical farm. Their LED lighting research, Nutrient Film Technique, and closed-loop systems are now used by Plenty (360× yield), AeroFarms (95% less water), and Bowery Farming. Our simulation applies the same principles — and our AI agent adds the autonomous decision layer that these companies are building toward.

**Jeff Rowe, Syngenta CEO (Davos 2026):** "Farmers today are navigating one of the most complex periods in modern agriculture, facing pressures that demand urgent action and real solutions."

**Feroz Sheikh, Syngenta CDO:** "AI can be the great equalizer in agriculture — but only if it's accessible, affordable, and trusted."

Our project demonstrates exactly this: AI that makes complex agricultural decisions accessible through transparent reasoning and KB-grounded recommendations.

---

## Tech Stack

| Component | Technology | Role |
|---|---|---|
| Simulation engine | Python FastAPI (stateless) | Physics math: growth, stress, resources, feeding |
| AI agent | LangGraph + AWS Bedrock (Claude Sonnet) | Autonomous decision loop: plan → execute → react → learn |
| Knowledge Base | Syngenta MCP via AWS AgentCore Gateway | Crop profiles, stress guides, operational scenarios, nutrition strategy |
| Frontend | Next.js + Tailwind + shadcn/ui | Dashboard visualization |
| Management API | Java Spring Boot | Frontend CRUD, database, slot grid display |

---

## Judging Criteria Alignment

| Criterion (25% each) | How we score |
|---|---|
| **Creativity** | AI agent that learns across simulation runs (strategy document rewriting). Mars-to-Earth value proposition. Autonomous decision-making with transparent reasoning. |
| **Functional accuracy** | All simulation parameters grounded in Syngenta KB data. 7 stress types, 5 crop profiles, 2 event scenarios directly from KB. NASA-validated cultivation principles. |
| **Visual design** | Real-time greenhouse dashboard with crop health visualization, environmental gauges, nutrition heatmaps, agent activity log. Clean, Mars-themed dark UI. |
| **Presentation quality** | Live demo of simulation running. Clear 3-minute pitch: problem → solution → demo → Mars-to-Earth → what's next. |

---

## Key Numbers for the Pitch

| Metric | Value | Source |
|---|---|---|
| Greenhouse calorie fraction | ~17% avg over 450 days | Our simulation (verified) |
| Micronutrient coverage | 7/7 critical nutrients | Our simulation (KB Domain 5) |
| KB domains used | All 7 | Syngenta MCP |
| LLM calls per simulation | ~20-25 | Batch execution model |
| CEA market size | $108B (2025) → $420B (2035) | Research Nester |
| Vertical farming market | $9.6B (2025), 19.3% CAGR | Grand View Research |
| Cropwise coverage | 70M+ hectares, 30+ countries | Syngenta corporate |
| NASA potato yield advantage | 2× world record (175K vs 89K lbs/acre) | NASA CELSS program |
| Water savings (CEA vs field) | Up to 95% less | AeroFarms, Plenty |

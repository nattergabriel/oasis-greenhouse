# Features — What We Actually Built

> Updated to reflect the real, integrated system as of Day 2.

---

## Core System

### Simulation Engine (complete)
- 5 KB-backed crop types with full growth models (lettuce, potato, radish, beans_peas, herbs)
- Seasonal Mars environment (solar 9-15h, temperature -83 to -43°C)
- Energy budget with solar panel generation vs heating/lighting/pump costs
- Water (10,000L, 90% recycling) and nutrient (5,000 units, 70% recycling) management
- 7 stress types from KB Domain 4 with priority-based detection
- 2 crisis events from KB Domain 6 (water recycling degradation, temperature control failure)
- Auto-harvest at ≥95% growth, auto-replant per slot assignment
- Crew feeding: greenhouse-first, stored food fills gap
- Calorie fraction, protein fraction, micronutrient coverage (7 critical nutrients from KB Domain 5)
- 5 early stop triggers for agent reactive decisions
- 192 passing tests, 450-day simulation verified

### AI Agent (complete)
- LangGraph state machine: init → plan → simulate → react/reflect
- AWS Bedrock (Claude Sonnet) for all decisions
- Syngenta MCP Knowledge Base integration (live queries during react)
- Strategy document learning: rewritten after each 450-day run
- ~20-25 LLM calls per simulation (15 scheduled + 5-10 reactive)
- Transparent reasoning logged for every decision

### Dashboard (in progress)
- Greenhouse grid visualization with per-slot crop status
- Environmental gauges (temperature, solar hours, energy balance)
- Resource level indicators (water, nutrients)
- Nutrition tracking (calorie/protein fractions, micronutrient coverage heatmap)
- Agent activity log with reasoning chains
- Crisis event alerts with agent diagnosis
- Simulation playback controls

### Admin Panel (in progress)
- Start/configure simulation runs
- Inject crisis events mid-simulation
- View past simulation results and agent decisions
- Compare strategy documents across runs

---

## Success Metrics (from KB Domain 5)

| Metric | Target | How we measure |
|---|---|---|
| Calorie greenhouse fraction | 15-25% | Daily: greenhouse kcal / 12,000 crew need |
| Protein greenhouse fraction | 10-20% | Daily: greenhouse protein / 400g crew need |
| Micronutrient coverage | 7/7 | Mission-level: unique nutrients ever produced |
| Water conservation | Last 450 days | 10,000L with 90% recycling |
| Crop survival | Minimize losses | Stress-related deaths tracked |
| Resource efficiency | Optimize | Water + nutrient remaining at day 450 |

---

## Not Implemented (intentional scope cuts)

- Dust storms, crop disease events (KB-backed, planned additions)
- Individual astronaut health/mood/death mechanics
- Food spoilage / expiry
- Per-plant environmental controls (humidity, pH, EC, dissolved oxygen)
- Weather forecast / prediction system
- Astronaut personas or variable crew sizes

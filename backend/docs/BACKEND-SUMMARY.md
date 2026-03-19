# Backend Plan Summary

## What it is

An autonomous AI agent managing a Martian greenhouse over a 450-day mission. It sets crop strategies per zone, controls the environment, handles crises, and improves its strategy through repeated simulations. Built with Python, FastAPI, LangGraph, and AWS Bedrock.

Two servers: the **orchestrator** (AI agent + frontend API) and the **simulation engine** (stateless growth/physics simulator, built by teammate). The orchestrator sends state + actions to the sim engine over HTTP, gets back updated state.

## The agent loop

Four LangGraph nodes in a cycle. Estimated ~20-25 LLM calls per 450-day run (15 scheduled reviews + 5-10 reactive).

**Init** sets up a fresh greenhouse (4 zones, 15m² each, 60m² total), loads cached KB data (crop profiles, nutritional targets), and loads the strategy document.

**Plan** sends the greenhouse state, strategy doc, and KB data to the LLM. The LLM outputs zone plans (percentage-based crop allocations per zone) and environment settings. The agent doesn't plant or harvest individual crops — it sets strategy via zone plans, and the sim engine fills zones and auto-replants after every harvest or crop death. The agent can also adjust water allocation per zone, toggle lights, set temperature, and remove specific crops.

**Simulate** sends those actions to the sim engine. The engine runs day by day, growing crops, depleting resources, auto-harvesting ready crops, and auto-replanting per zone plans. It stops early and hands control back when: a random event fires (water recycling decline, temperature failure), or a critical threshold is breached (crop health below 30, water below 15%, energy deficit for 3+ consecutive days). If nothing triggers, it runs the full ~30-day batch and routes back to plan.

**React** handles early stops. The LLM receives the alert details (event or threshold breach) plus live KB guidance, diagnoses the problem, and outputs response actions — adjusting zone plans, water, lights, or temperature. Routes back to simulate.

At day 450, the agent enters **reflect**. The LLM receives the full run metrics, decision log, and the strategy document. It rewrites the strategy from scratch — keeps what worked, drops what didn't.

## Learning

No fine-tuning. The agent maintains a **living strategy document** (2-3 pages) that gets rewritten after each simulation. Read-only during a run, rewritten after. Gets sharper each iteration, never longer.

Two knowledge sources feed every LLM call: the **MCP knowledge base** (static facts like "beans need 18-25C") and the **strategy document** (learned wisdom like "zone 1 should be pure potato, zone 4 needs 70% beans for protein coverage").

## Simulation engine interface

Three endpoints: init (create greenhouse), tick (advance N days with actions), inject-event (apply crisis manually).

The orchestrator sends the current state plus a batch of actions to tick. The sim engine handles all growth, resource depletion, auto-harvesting, auto-replanting, and yield calculations internally. It returns the updated state, a daily log (with harvests, replants, stress changes), and whether it stopped early.

The engine stops early for two reasons: **events** (water recycling decline at 1%/sol, temperature failure at 1%/sol) and **threshold breaches** (crop health < 30, water < 15%, energy deficit 3+ consecutive days). Both hand control back to the agent.

## Zone plans

The core agent action is `set_zone_plan` — a percentage-based crop allocation per zone (e.g. `{"potato": 0.6, "beans_peas": 0.4}`). The engine translates percentages into actual plantings based on crop footprints, fills empty area, and auto-replants the same crop type after every harvest or death.

When a plan changes, existing crops grow to completion before being replaced. The `remove` action lets the agent force-remove a crop for faster transitions.

This solves the batch execution problem: the agent doesn't need to predict harvest timing or schedule individual plantings. It sets strategy, the engine maintains production.

## Greenhouse model

4 zones, 15m² each. Crop footprints: potato 2.0m², beans 1.5m², lettuce 0.5m², radish 0.5m², herbs 0.3m².

Starting resources: 10,000L water (90% recycling), 5,000 nutrient units (70% recycling). Energy is solar-dependent and seasonal. Crew drinks 10L water/day on top of irrigation.

Crops grow 0-100%, auto-harvested at >=95% with health >20. Health is 0-100, degrades under stress, recovers when conditions improve. Seven stress types from the KB: drought, overwatering, heat, cold, nutrient deficiency, light insufficient, CO2 imbalance.

The greenhouse supplements packaged food. Crew needs 12,000 kcal/day; packaged food starts at 5.4M kcal (exactly 450 days). Harvested food accumulates in a stockpile (no spoilage); crew eats from it daily, packaged food fills the gap. The greenhouse calorie fraction is the primary metric.

## State model

A single GreenhouseState flows between orchestrator and sim engine: mission day, 4 zones (each with area, crops list, crop plan, light toggle, water allocation), environment (solar, temps, energy balance), resources (water + nutrients with recycling rates), Mars conditions (seasonal solar/temp), food supply stockpile (by crop type), stored food (remaining packaged calories), daily nutrition (calorie/protein fractions, micronutrient count out of 7), and active events.

For frontend playback, days compress into DailySnapshots. A SimulationResult bundles 450 snapshots, ~20-25 agent decisions with reasoning, all events, final metrics, and pre/post strategy documents.

## Initial strategy

Zone plans: zone 1 pure potato (calories), zone 2 potato/beans mix (calories + protein), zone 3 lettuce/radish/herbs (micronutrients + diversity), zone 4 beans/herbs (protein + morale). Temperature 20C, all lights on, default water allocation.

Crisis priorities: human safety, then water, then potatoes, then beans, then short-cycle crops. Nutritional correction by shifting zone plans toward the needed crop type.

## API

Four endpoints: POST /api/training/run (run simulation + improve strategy), GET /api/simulations (list runs), GET /api/simulations/{id} (full result for playback), GET /api/strategy (current strategy doc).

## Prompts

Three templates sharing a system prompt (agent identity, prioritized objectives, crop stats with footprints, zone plan concept, available actions, JSON output). Plan prompt: strategy + state + nutrition + resources + zones with current plans + food stockpile. React prompt: alert details + live KB guidance + priority reminder. Reflect prompt: previous strategy + run metrics + decision log, rewrite to 2-3 pages.

## Operating modes

**Training**: backend-only simulation loop, improving strategy each run. No frontend.

**Demo**: frontend loads a pre-computed SimulationResult and plays it back on a timeline. No live simulation.

## Frontend (for context)

**Astronaut Panel**: zone layout with crop plans and individual crops, environment, resources, agent log with reasoning, nutrition fractions, micronutrient coverage (0-7), packaged food runway, projections, alerts with response plans. **Mission Planner Panel**: run simulations, inject events, configure priority weights, review outcomes and strategy evolution.

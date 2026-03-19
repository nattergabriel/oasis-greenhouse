# Features

## Problem

4 astronauts spend 450 days on Mars. They carry packaged food but need fresh produce from a greenhouse to supplement their diet. Limited resources, no resupply, failures cascade into nutritional gaps.

## Goal

An autonomous AI agent that manages the greenhouse end-to-end — deciding what to plant, controlling the environment, responding to crises, and ensuring nutritional coverage. The agent learns and improves through simulated runs.

---

## Astronaut Panel

### Greenhouse Overview
- 4 slots (4 m² each) showing crop assignments and individual crop status
- Per-crop health (healthy / stressed / critical / ready to harvest)
- Environment readings (temperature, solar hours, energy balance)
- Resource levels (water, nutrients)

### Agent Activity
- Action log: what the agent did, when, and why
- Suggestion queue: physical tasks (harvest, inspect, repair) with urgency

### Nutrition
- Greenhouse fraction: % of daily crew needs covered (calories, protein)
- Micronutrient coverage: 0-7 critical nutrients supplied
- Packaged food: remaining reserves and projected depletion
- Coverage gaps: which nutrients are under target

### Alerts
- Plant stress alerts with agent diagnosis
- Resource warnings (low water, nutrient depletion)
- Crisis events with agent response plan

---

## Mission Planner Panel

### Simulation
- Run 450-day simulations with configurable parameters
- Inject crisis events mid-simulation
- Fast-forward, pause, inspect state

### Results
- Run summary (calorie/protein fraction, micronutrient coverage, resource efficiency, crops lost)
- Strategy document that improves with each run

# Features

## Problem

A crew of 4 astronauts will spend 450 days on Mars. They carry packaged food, but need fresh produce from an on-site greenhouse to supplement their diet. Growing crops on Mars means dealing with limited resources, no resupply, and an environment where any failure can cascade into nutritional gaps.

## Goal

An autonomous AI agent that manages the greenhouse end-to-end — deciding what to plant, controlling the environment, responding to problems, and ensuring the crew's nutritional needs are covered across the entire mission. The agent learns and improves its strategy through simulated mission runs before deployment.

---

## Astronaut Panel

### Greenhouse Overview
- 4 zones (15 m² each), showing per-zone crop layout with footprint usage
- Per-crop status (healthy / stressed / critical / ready to harvest)
- Environment readings (temperature, solar hours, energy balance)
- Resource levels (water, nutrients)
- Mars external conditions

### Agent Activity
- Action log: what the agent did, when, and why
- Suggestion queue: physical tasks the agent can't do itself (harvest, inspect, replant, repair) with urgency level and context

### Crop Management
- Zone plans: current crop allocation per zone, area used vs available, auto-replant status
- Harvest tracker: auto-harvest log and current food stockpile by crop type

### Nutrition
- Greenhouse fraction: what percentage of daily crew needs the greenhouse is producing (calories, protein)
- Micronutrient coverage: which of 7 critical nutrients are being supplied (0-7)
- Packaged food status: remaining reserves and projected depletion date at current greenhouse output
- Coverage gaps: which nutrients are under target and which crops would fix it

### Forecasting
- Resource projections over upcoming mission days
- Mission timeline: day count, upcoming harvests, critical milestones

### Alerts
- Plant stress alerts with agent diagnosis and recommended action
- Resource warnings (low water, nutrient depletion approaching)
- Crisis events (water recycling decline, temperature failure) with agent response plan
- Threshold alerts (crop health critical, water critical, persistent energy deficit) with agent response

---

## Mission Planner Panel

### Simulation
- Run 450-day simulations with configurable parameters
- Fast-forward through days, pause, inspect state at any point
- Inject crisis events mid-simulation (water recycling decline, temperature failure)

### Agent Configuration
- Hybrid autonomy: agent acts autonomously on environment controls, surfaces physical tasks (harvest, inspect, repair) as suggestions to the crew
- Adjust priority weights (yield vs. diversity vs. resource conservation)

### Results
- Run outcome summary (calorie/protein greenhouse fraction, micronutrient coverage, resource efficiency, crops lost)
- Agent learning: strategy document that improves with each run

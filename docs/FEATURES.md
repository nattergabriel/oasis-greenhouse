# Features

## Problem

A crew of 4 astronauts will spend 450 days on Mars. They carry packaged food, but need fresh produce from an on-site greenhouse to supplement their diet. Growing crops on Mars means dealing with limited resources, no resupply, and an environment where any failure can cascade into nutritional gaps.

## Goal

An autonomous AI agent that manages the greenhouse end-to-end — deciding what to plant, controlling the environment, responding to problems, and ensuring the crew's nutritional needs are covered across the entire mission. The agent learns and improves its strategy through simulated mission runs before deployment.

---

## Astronaut Panel

### Greenhouse Overview
- Per-zone crop status (healthy / stressed / critical / ready to harvest)
- Environment readings (temperature, humidity, light, CO2, water flow)
- Resource levels (water reserves, nutrient reserves, energy)
- Mars external conditions

### Agent Activity
- Action log: what the agent did, when, and why
- Suggestion queue: physical tasks the agent can't do itself (harvest, inspect, replant, repair) with urgency level and context

### Crop Management
- Planting calendar: what's planted, what's coming up, what the agent recommends next
- Harvest tracker: what's been harvested and current stockpile

### Nutrition
- Daily production vs. crew requirements (calories, protein, vitamins, minerals)
- Coverage gaps: which nutrients are under target and which crops would fix it

### Forecasting
- Resource projections over upcoming mission days
- Mission timeline: day count, upcoming harvests, critical milestones

### Alerts
- Plant stress alerts with agent diagnosis and recommended action
- Resource warnings (low water, nutrient depletion approaching)
- Crisis events (equipment failure, dust storm) with agent response plan

---

## Mission Planner Panel

### Simulation
- Run 450-day simulations with configurable parameters (crew size, resource budget, mission duration)
- Fast-forward through days, pause, inspect state at any point
- Inject crisis events mid-simulation (water leak, disease outbreak, dust storm, equipment failure)

### Agent Configuration
- Set autonomy level (fully autonomous / suggest-only / hybrid)
- Adjust priority weights (yield vs. diversity vs. resource conservation)

### Results
- Run outcome summary (nutrition coverage, resource efficiency, crop survival)
- Compare across simulation runs
- Agent learning: strategy document that improves with each run


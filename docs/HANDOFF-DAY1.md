# Handoff Notes — End of Day 1 (Final)

> **Read this before doing anything tomorrow.**
> Updated at end of night session. Simulation engine is complete. Backend is integrated but has state model mismatches to fix.

---

## What happened today

**Michael (PM):** Full day designing and finalizing the simulation specification. Deep KB analysis, cross-referencing all docs, aligning with backend teammate's API doc. Then supervised Claude Code building the simulation engine across 6 phases.

**Backend dev:** Built the full LangGraph orchestrator, agent prompts, KB client, sim engine HTTP client, strategy store, and FastAPI API. Integrated with simulation engine architecture.

**Frontend dev:** Building against `contracts/API.md` with mock data (status unknown — check with them).

---

## What's built and working

### Simulation Engine — COMPLETE ✅
`simulation/src/` — 10 Python modules, 192 tests passing.

Stateless FastAPI REST server with 3 endpoints:
- `POST /simulate/init` — creates empty greenhouse state
- `POST /simulate/tick` — advances N days with agent actions, returns state + daily_logs
- `POST /simulate/inject-event` — manually injects a crisis event

**450-day results verified:** 16.9% avg calorie fraction (spec target 15-25%), 17.1% protein fraction, 7/7 micronutrients, 1,770 kg harvested, water lasts full mission.

5 early stop triggers: random event fired, crop health <30, water <1,500L, energy deficit 3+ days, starvation.

Run with: `cd simulation && uvicorn src.main:app --port 8001`

### Backend Orchestrator — BUILT, needs state model fix
`backend/src/` — LangGraph state machine with 5 nodes:

```
init → plan → simulate → [route]
                            ├→ reflect (day 450 → rewrite strategy)
                            ├→ react (stopped_early → respond to event)
                            └→ plan (batch complete → plan next 30 days)
react → simulate (loop back)
```

- Agent uses Claude Sonnet via AWS Bedrock
- KB queried live during react node for scenario guidance
- Strategy document loaded at init, rewritten at reflect
- Simulation results saved as JSON files

Run with: `cd backend && uvicorn backend.main:app --port 8000`

---

## CRITICAL: State model mismatch between sim engine and backend

The backend's Pydantic models don't match the sim engine's output format. This will cause deserialization errors. **Must be fixed before the two can talk.**

### Field name differences

| Sim engine output | Backend expects | Fix needed |
|---|---|---|
| `day` | `mission_day` | Rename in backend model |
| `resources.water_recycling_rate` | `resources.water_recycling_efficiency` | Rename |
| `resources.water_availability` | (not in backend model) | Add field |
| `food_supply.items` (dict of FoodItem) | `food_supply.by_type` (dict of CropStock) + `total_kg`, `total_kcal`, `total_protein_g` | Restructure |
| `stored_food.total_calories`, `stored_food.remaining_calories` | Same ✅ | — |
| `daily_nutrition.gh_kcal`, `gh_protein_g`, `stored_kcal_consumed` | `stored_food_remaining`, `stored_food_days_left` | Different fields |
| `active_events[].started_day`, `duration_sols`, `remaining_sols`, `temp_drift_c`, `degraded_recycling` | `active_events[].severity`, `day_triggered`, `duration`, `details`, `resolved` | Different structure |
| `metrics` (inside state) | (accumulated separately in LangGraph state) | Backend ignores sim metrics, computes own |
| `next_crop_id`, `seed`, `consecutive_energy_deficit_days` | (not in backend model) | Add or ignore |
| `environment.target_temp`, `co2_level`, `co2_event_active`, `light_penalty` | (not in backend model) | Add |
| (no `mars` object) | `mars: MarsConditions` | Remove from backend or derive from environment |
| `crops[].growth_cycle_days` | (not in backend Crop model) | Add |

### sim_client.py request format mismatches

| Endpoint | Backend sends | Sim engine expects |
|---|---|---|
| `/simulate/init` | `{"config": {"num_zones": 4, ...}}` | `{"seed": 42, "zone_plans": {...}}` |
| `/simulate/tick` | `{"state": {...}, "actions": [...], "days": 30}` | Same structure ✅ but field names inside state don't match |
| `/simulate/tick` response | Reads `daily_log` (singular) | Sim returns `daily_logs` (plural) |
| `/simulate/tick` response | Reads `stop_reason.event.type` | Sim returns `stop_reason.trigger`, `stop_reason.events` |
| `/simulate/tick` response | Reads `final_state` | Sim returns `state` |

### Recommended fix approach

**Fastest path:** Update `backend/src/models/state.py` and `backend/src/sim_client.py` to match the sim engine's actual output. The sim engine has 192 tests — don't change it. Adapt the backend.

Specific steps:
1. Update `GreenhouseState` fields to match sim output exactly
2. Update `sim_client.py` init request to send `{"seed": 42, "zone_plans": {...}}`
3. Update `sim_client.py` tick response parsing: `result["state"]` not `result["final_state"]`, `result["daily_logs"]` not `result["daily_log"]`
4. Remove `MarsConditions` (solar_hours and outside_temp are in `environment`)
5. Update `Event`/`ActiveEvent` model to match sim's structure
6. Add missing fields to `Crop` (`growth_cycle_days`), `ResourcePool` (`water_availability`), `Environment` (`target_temp`, `light_penalty`, etc.)

---

## What each person should do tomorrow

### Backend dev (priority 1: fix state models)
1. **Fix state model mismatch** — see table above. Update `models/state.py` and `sim_client.py` to match sim engine output.
2. **Test the integration** — start sim engine on port 8001, start backend on port 8000, run a training simulation via `POST /api/training/run`
3. **The LangGraph flow is correct** — init → plan → simulate → route → react/plan/reflect. Don't change the architecture, just fix the data format.

### Frontend dev
1. **Continue building against `contracts/API.md`** with mock data
2. **Fix crop references** — SVG components should be: lettuce, potato, radish, beans_peas, herbs (not tomato/spinach/soybean/wheat)
3. **The backend will eventually serve the API** — but for now, mock data is fine
4. **Key data the frontend will receive:** daily snapshots with zones, crops, environment, nutrition fractions, events, agent decisions

### Michael (PM) — tomorrow
1. **Verify backend-sim integration** works after state model fix
2. **Start pitch/brand work** — the simulation is done, the demo needs presentation
3. **Product docs** that are still empty: brand identity, pitch deck, wireframes

---

## Architecture: how it all connects

```
┌─────────────────┐     ┌──────────────────────────┐     ┌─────────────────────┐
│    Frontend      │     │    Backend (port 8000)    │     │  Sim Engine (8001)  │
│  Next.js app     │────▶│  LangGraph orchestrator   │────▶│  FastAPI server     │
│  Mock data now   │     │  Agent (Claude Sonnet)    │     │  Pure Python math   │
│                  │◀────│  KB client (MCP)          │◀────│  192 tests passing  │
│                  │     │  Strategy store            │     │  Stateless          │
└─────────────────┘     └──────────────────────────┘     └─────────────────────┘
         │                         │                              │
         │                         ▼                              │
         │                  ┌─────────────┐                       │
         │                  │ AWS Bedrock  │                       │
         │                  │ Claude LLM   │                       │
         │                  └─────────────┘                       │
         │                         │                              │
         │                         ▼                              │
         │                  ┌─────────────┐                       │
         │                  │  MCP KB      │                       │
         │                  │  (Syngenta)  │                       │
         │                  └─────────────┘                       │
         │                                                        │
         └── contracts/API.md (frontend ←→ backend interface) ────┘
                    Backend translates sim output → rich API
```

### Simulation run flow (what happens when you click "Run Training")

```
1. Frontend: POST /api/training/run → Backend
2. Backend init_node: POST /simulate/init → Sim Engine → empty state
3. Backend init_node: loads KB cache + strategy document
4. Backend plan_node: sends state to Claude LLM → gets zone plans + actions
5. Backend simulate_node: POST /simulate/tick (30 days) → Sim Engine
6. Sim Engine: runs day loop, maybe stops early on event
7. Backend route: if stopped_early → react_node, if day 450 → reflect_node, else → plan_node
8. Backend react_node: queries KB for guidance, sends to LLM → gets reactive actions
9. Backend simulate_node: POST /simulate/tick (remaining days) → Sim Engine
10. Repeat 4-9 until day 450
11. Backend reflect_node: LLM rewrites strategy document
12. Backend: saves results, returns metrics to frontend
```

---

## Quick reference: what's where

| Need to know... | Read this |
|---|---|
| How the simulation works | `simulation/SIMULATION-SPEC.md` |
| How to call the sim engine | `simulation/src/main.py` (3 endpoints) |
| How the backend orchestrator works | `backend/src/graph.py` (LangGraph flow) |
| What the agent sees in prompts | `backend/src/agent/prompts.py` |
| How the frontend API works | `contracts/API.md` |
| What state mismatches need fixing | This file (table above) |
| How the agent learns | `backend/docs/LEARNING-SYSTEM.md` |
| What features we're building | `product/FEATURES.md` |
| What the case requires | `product/research/CASE-BRIEF.md` |
| How everything connects | `CLAUDE.md` (updated) |

---

## Known issues (non-blocking unless noted)

| Issue | Who | Priority | Blocking? |
|---|---|---|---|
| **State model mismatch sim↔backend** | Backend dev | **HIGH** | **YES — must fix before integration works** |
| Event type naming (`water_recycling_degradation` vs `water_recycling_decline`) | Backend dev + sim | Low | No (cosmetic) |
| `contracts/API.md` ScenarioType enum missing our 2 event types | Full-stack | Medium | No |
| Frontend crop SVGs reference wrong crops | Frontend dev | Medium | No |
| `product/FEATURES.md` simulation objectives use old terminology | Michael | Low | No |
| Brand identity, pitch, wireframes not started | Michael | Medium | No (for demo prep) |

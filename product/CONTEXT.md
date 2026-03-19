# Product Context

## Who I Am

**Role:** PM / Design / Demo Lead
**Name:** Michael

---

## Current Phase

**Hackathon live.** Simulation spec is finalized. Implementation starting in Claude Code.
Product/UI work (brand, pitch, wireframes) resumes after simulation engine is functional.

---

## Workspace Map

| Location | Purpose | Status |
|----------|---------|--------|
| `simulation/SIMULATION-SPEC.md` | Simulation spec (source of truth) | **✅ Finalized** |
| `simulation/` | Simulation engine code (to be built) | **Next** |
| `product/` | PM/Design workspace | Paused until sim works |
| `product/research/` | Challenge brief, tech stack | ✅ Done |
| `product/brand/` | Identity kit | Not started |
| `product/pitch/` | Demo script, slides | Not started |
| `product/wireframes/` | Dashboard mockups | Not started |
| `contracts/API.md` | Frontend↔backend API contract | Needs minor updates |
| `backend/docs/` | Learning system + raw KB source docs | ✅ Done |

---

## Key Decisions Made

| # | Decision | Date |
|---|----------|------|
| 1 | 5 crop types (KB-backed): lettuce, potato, radish, beans/peas, herbs | Day 1 |
| 2 | 4 zones × 15 m² = 60 m² greenhouse (NASA-grounded) | Day 1 |
| 3 | Zone plans: agent sets % allocation, engine auto-fills and auto-replants | Day 1 |
| 4 | Batch execution: agent plans ~30 days, sim runs with early stop on events/thresholds | Day 1 |
| 5 | Success metrics: calorie fraction, protein fraction, micronutrient coverage (0-7) | Day 1 |
| 6 | Stored food: 5.4M kcal, greenhouse supplements, crew never starves | Day 1 |
| 7 | 2 core events: water_recycling_decline, temperature_failure (both KB-backed) | Day 1 |
| 8 | No health/mood/death in core — moved to stretch additions | Day 1 |
| 9 | Auto-harvest at ≥95% growth — agent doesn't control harvest timing | Day 1 |
| 10 | Stateless REST server for sim engine (init, tick, inject-event) | Day 1 |

---

## Next Steps

1. **Build simulation engine** — Claude Code implements the spec as a FastAPI server
2. **Teammate commits** his simulation API doc to `simulation/API.md`
3. **Update `contracts/API.md`** — add missing ScenarioType values, minor alignment
4. **Frontend crop SVGs** — need to reference our 5 crops, not the old 6
5. **Product work** — brand, pitch, wireframes once sim is running

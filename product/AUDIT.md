# Project Audit — Day 2

> Last updated: Day 2 afternoon, after backend integration and product documentation rewrite.

---

## Build Status

| Component | Status | Notes |
|-----------|--------|-------|
| Simulation engine | ✅ Complete | Stateless FastAPI, 3 endpoints, 192 tests. Slots model (was zones). |
| Backend orchestrator | ✅ Built + integrated | LangGraph flow working. State models aligned with sim engine. |
| Backend ↔ sim integration | ✅ Aligned | sim_client.py sends correct formats, reads correct fields. |
| Frontend | 🔨 In progress | Building against contracts/API.md with mock data. Will adapt to slot model. |
| Management backend | 🔨 Built, not bridged | Java Spring Boot serves contracts/API.md. Not yet connected to Python backend/sim. |
| Product docs | ✅ Complete rewrite | PROJECT-DEFINITION, PITCH-SCRIPT, IDENTITY, all research docs done. |
| Presentation slides | 🚧 Starting now | 7-slide structure defined. Building in Figma. |
| Brand identity | ✅ Defined | Dark Mars theme, Space Grotesk + Inter, CSS variables ready. |

## Pending Actions

| Priority | Action | Owner |
|----------|--------|-------|
| 🔴 | Increase grid to 4×4 (update config.py, rebalance energy) | Backend dev |
| 🔴 | Run 50 simulation runs for demo data + strategy evolution | Backend dev / Michael |
| 🔴 | Build presentation slides (Figma) | Michael |
| 🟡 | Frontend adaptation to slot model + brand colors | Frontend dev |
| 🟡 | Management-backend bridging to Python backend | Backend dev / Frontend dev |
| 🟡 | Update root README.md | Anyone |
| ⚪ | Update backend/CLAUDE.md (still references zones) | Backend dev |
| ⚪ | Clean stale docs (docs/STATE-MODEL-ALIGNMENT.md, docs/INTEGRATION-NOTES.md) | Anyone |

## What's Changed Since Day 1

1. **Zones → Slots refactor**: Backend dev renamed zones to slots throughout simulation and backend. Each slot holds one crop type (not percentage-based mix). Grid-based with row/col positions.
2. **Greenhouse sizing**: Was 4×15m²=60m², now slot grid (currently 2×2 at 4m²=16m², being updated to 4×4=64m²).
3. **Backend state model alignment**: All Pydantic models in backend now match sim engine dataclasses exactly. sim_client.py sends correct formats.
4. **Sim folder restructured**: Docs moved to `simulation/docs/`. Old files (API-REFERENCE.md, SETUP.md, IMPLEMENTATION-NOTES.md, SPEC-ADDITIONS.md) removed.
5. **Backend folder restructured**: Was `backend/backend/`, now `backend/src/`. Some docs removed (BACKEND-SUMMARY.md, PROMPTS.md, STATE-MODEL.md).
6. **Product docs complete rewrite**: All 9 product documents rewritten with Syngenta research, NASA research, pitch design research. Brand identity defined.

## Architecture (current)

```
Frontend (Next.js, :3000)
    ↕ contracts/API.md
Management Backend (Java Spring Boot)
    ↕ (not yet bridged)
Backend (FastAPI + LangGraph, :8000)
    ↕ sim_client.py
Sim Engine (FastAPI, :8001)

Backend also connects to:
    → AWS Bedrock (Claude Sonnet) for agent decisions
    → MCP KB (Syngenta) for crop/scenario guidance
    → Strategy file (disk) for learned strategy
```

## Simulation Numbers

⚠️ **Do not cite specific numbers until we run the 4×4 grid simulation.** The previously validated numbers (16.9% calorie fraction, 1770 kg harvested) were from the old 60 m² zone-based design. The new slot model with 64 m² (4×4 grid) should produce similar results but needs verification.

## Document Status

| Document | Location | Status |
|----------|----------|--------|
| Root CLAUDE.md | `CLAUDE.md` | ✅ Updated (Day 2, slots, 4×4 grid) |
| Sim spec | `simulation/docs/SIMULATION-SPEC.md` | ✅ Updated by backend dev (slots) |
| Backend CLAUDE.md | `backend/CLAUDE.md` | ⚠️ Still references zones, deleted docs |
| Product INDEX | `product/INDEX.md` | ✅ Current |
| Product docs | `product/` | ✅ All rewritten Day 2 |
| Frontend docs | `frontend/doc/` | ⚠️ Stale (old feature list, old design) |
| contracts/API.md | `contracts/API.md` | ⚠️ Different model than sim engine (frontend dev's domain) |
| docs/ folder | `docs/` | ⚠️ STATE-MODEL-ALIGNMENT.md and INTEGRATION-NOTES.md are stale |

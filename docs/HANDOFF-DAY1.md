# Handoff Notes — End of Day 1

> Read this before working on anything tomorrow.

---

## What happened today

Michael (PM) spent the full day finalizing the simulation specification with deep KB analysis, cross-referencing all documentation, and aligning with the backend teammate's API doc. No code was written — today was design.

## What's ready

### Simulation spec — DONE ✅
`simulation/SIMULATION-SPEC.md` is the source of truth. It defines everything: day loop, crop growth, stress detection, zone plans, resources, events, feeding logic, success metrics. All formulas are there. All KB sources are marked.

### Architecture — DECIDED ✅
- Sim engine = stateless FastAPI REST server (3 endpoints: init, tick, inject-event)
- Backend orchestrator manages agent loop (calls sim engine + LLM)
- Agent plans ~30 days ahead using zone plans, sim runs batches with early stop
- Frontend replays daily_log at chosen speed for live dashboard
- Backend translates simple sim output into rich frontend API format

### Team alignment — DONE ✅
- `CLAUDE.md` updated with current architecture
- `product/CONTEXT.md` updated with decisions log
- `product/AUDIT.md` updated with document status and architecture diagram

---

## What each person should do next

### Backend dev (your friend)
1. **Commit his simulation API doc** to `simulation/API.md`
2. **Build the simulation engine** from `simulation/SIMULATION-SPEC.md` — FastAPI server, pure Python math, no LLM calls
3. **Key things to implement first:** config (crop params from KB), environment (sine curves), crop growth formula, zone plans with auto-replant, the tick endpoint
4. **His API doc and the spec are aligned** — no contradictions between them after today's session
5. He should also update `contracts/API.md` ScenarioType enum to include `WATER_RECYCLING_DECLINE` and `TEMPERATURE_FAILURE`

### Frontend dev
1. **Continue building against `contracts/API.md`** with mock data — this is still the frontend contract
2. **Fix crop references:** their SVG components reference tomato, spinach, soybean, wheat — should be lettuce, potato, radish, beans_peas, herbs
3. **The API contract stays rich** — the backend will translate simple sim output into the detailed format the frontend expects. No changes to frontend architecture needed.
4. **For the greenhouse visualization:** our sim has 4 zones × 15 m², each zone has a crop plan with percentage allocations. The frontend renders this as a grid of slots. The mapping: each zone = a section of the grid, slots within a zone show the individual crop plantings.

### Michael (PM)
1. **Start simulation implementation** in Claude Code using the spec
2. **Product work after sim runs:** brand identity, pitch structure, wireframes
3. **The pitch should highlight:** zone plan optimization, KB-grounded decisions, 3-tier nutrition tracking, stored food depletion, learning across runs

---

## Known issues to resolve (non-blocking)

| Issue | Who | Priority |
|-------|-----|----------|
| `contracts/API.md` ScenarioType enum missing our 2 event types | Backend dev or Full-stack | Medium |
| Frontend crop SVGs reference wrong crops | Frontend dev | Medium |
| `product/FEATURES.md` simulation objectives use old terminology | Michael | Low |
| `backend/docs/LEARNING-SYSTEM.md` has "soybeans" in example | Backend dev | Low |
| `product/PREP-PLAN.md` is completely stale | Michael | Low (delete or ignore) |
| Feature list exists in 3 places (`product/`, `docs/`, `frontend/doc/`) | Team | Low (product/ is canonical) |

---

## Quick reference: what's where

| Need to know... | Read this |
|-----------------|-----------|
| How the simulation works | `simulation/SIMULATION-SPEC.md` |
| How to call the sim engine | Teammate's API doc (→ `simulation/API.md`) |
| How the frontend API works | `contracts/API.md` |
| How the agent learns | `backend/docs/LEARNING-SYSTEM.md` |
| What features we're building | `product/FEATURES.md` |
| What the case requires | `product/research/CASE-BRIEF.md` |
| How everything connects | `CLAUDE.md` (updated) |
| Raw KB source documents | `backend/docs/Mars-Crop-Data/` |
| Cached KB query responses | `simulation/kb_data/` |

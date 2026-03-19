# Project Audit — End of Day 1

> Last updated: end of design session, day 1.

---

## Document alignment status

| Document | Location | Status | Notes |
|----------|----------|--------|-------|
| Simulation spec | `simulation/SIMULATION-SPEC.md` | ✅ Current | Source of truth for sim engine |
| Teammate's sim API doc | Not committed yet | ✅ Aligned | Needs to go to `simulation/API.md` |
| CLAUDE.md | root | ✅ Just updated | Reflects current architecture |
| Learning system | `backend/docs/LEARNING-SYSTEM.md` | ✅ Aligned | Minor: "soybeans" in example |
| Case brief | `product/research/CASE-BRIEF.md` | ✅ Current | No changes needed |
| Tech stack | `product/research/TECH-STACK.md` | ✅ Current | No changes needed |
| Feature list | `product/FEATURES.md` | ⚠️ Minor | Simulation objectives use old terminology |
| Frontend↔backend API | `contracts/API.md` | ⚠️ Needs updates | See below |
| Frontend impl plan | `frontend/doc/IMPLEMENTATION_PLAN.md` | ⚠️ Stale crops | References tomato/spinach/soybean/wheat |
| Product context | `product/CONTEXT.md` | ✅ Just updated | |
| Prep plan | `product/PREP-PLAN.md` | ❌ Stale | Pre-hackathon, no longer relevant |

## `contracts/API.md` — what needs updating

The frontend API contract is richer than what the sim produces. The backend translates between them. These specific items need updating:

1. **ScenarioType enum**: Add `WATER_RECYCLING_DECLINE`, `TEMPERATURE_FAILURE`. Current values (`WATER_LEAK`, `SOLAR_PANEL_FAILURE`, `DUST_STORM`, `DISEASE_OUTBREAK`, `EQUIPMENT_MALFUNCTION`) can stay as stretch/display-only options.

2. **CropCategory enum**: `GRAIN` is empty since wheat was dropped. Can keep for future extensibility or remove.

3. **Crop data**: API crop catalog should match our 5 crops. Frontend SVG plant components reference wrong crops (tomato, spinach, soybean, wheat should be potato, radish, beans_peas, herbs).

4. **StressType enum**: API has 12 types, sim produces 7. The extra 5 (NUTRIENT_DEFICIENCY_N/K/FE, SALINITY, LIGHT_EXCESSIVE, ROOT_HYPOXIA) are from the KB but not modeled in our core sim. Backend can map our generic `nutrient_deficiency` to the specific N/K/Fe types based on context, or these can be stretch additions.

5. **Agent action types**: API uses descriptive names (`IRRIGATION_ADJUSTED`, `LIGHT_CYCLE_MODIFIED`). Sim uses action names (`water_adjust`, `light_toggle`). Backend maps between them.

6. **Zone plans not in API**: The `set_zone_plan` action exists in the sim but has no API equivalent. Backend handles this internally — it receives zone plan from agent, translates to slot-level updates for the frontend API.

## Architecture: how sim → backend → frontend

```
Simulation Engine (simple)          Backend (translates)         Frontend (rich)
─────────────────────────          ────────────────────         ────────────────
Zone plans + crop states    →→→    Slot grid positions     →→→  Animated greenhouse
Environment (solar, temp)   →→→    Sensor readings         →→→  Live gauges
Nutrition fractions         →→→    Daily nutrition entries  →→→  Nutrition dashboard
Stress type per crop        →→→    Alerts with diagnosis    →→→  Alert cards
Events (2 core types)       →→→    Scenario injections      →→→  Crisis management
Daily log per tick batch    →→→    Timeline events          →→→  Live replay at speed
```

The backend is the translation layer. The sim stays simple. The frontend stays rich.

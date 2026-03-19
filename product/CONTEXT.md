# Product Context

## Who I Am

**Role:** PM / Design / Demo Lead
**Name:** Michael

---

## Current Phase

**Hackathon live.** Currently focused on simulation engine design and build.
Product/UI work resumes after simulation is functional.

---

## Workspace Map

| Location | Purpose | Status |
|----------|---------|--------|
| `simulation/` | Greenhouse simulation engine (shared workspace) | **Active** |
| `product/` | PM/Design workspace | Paused until simulation done |
| `product/research/` | Challenge brief, tech stack, business case | Updated |
| `product/brand/` | Identity kit (colors, fonts, logo) | Not started |
| `product/pitch/` | Demo script, slides, submission | Not started |
| `product/wireframes/` | Dashboard mockups | Not started |
| `product/Instruction Docs/` | Official hackathon instructions (read reference) |  |

---

## Key Reference Files

| File | What it contains |
|------|-----------------|
| `simulation/SIMULATION-SPEC.md` | Full simulation specification |
| `product/FEATURES.md` | Agreed feature list |
| `product/research/CASE-BRIEF.md` | Syngenta challenge (complete) |
| `product/research/TECH-STACK.md` | MCP endpoint, AWS infra, architecture, links |
| `backend/docs/LEARNING-SYSTEM.md` | Agent learning approach (read-only) |
| `product/Instruction Docs/README.md` | Official getting started guide |
| `CLAUDE.md` | Repo conventions (read-only) |

---

## Critical: MCP Endpoint

```
https://kb-start-hack-gateway-buyjtibfpg.gateway.bedrock-agentcore.us-east-2.amazonaws.com/mcp
```

This is the Syngenta knowledge base. The simulation parameters AND the agent decisions both reference this source. They must be consistent.

---

## Decisions Log

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 1 | Product folder structure (brand, design-system, wireframes, pitch, research) | Layered prep approach | 2026-03-18 |
| 2 | Simulation as top-level `/simulation/` directory | Shared across team, not product-specific | 2026-03-19 |
| 3 | Hybrid simulation approach (Python math + LLM agent + LLM flavor) | Fast, reliable, demo-friendly | 2026-03-19 |
| 4 | Learning system: summary injection + rules extraction across runs | Visible learning arc for demo | 2026-03-19 |
| 5 | 6 crop types, 4 zones, 4 astronauts, day-by-day tick | Manageable scope for hackathon | 2026-03-19 |

---

## Next Steps

1. **Query the MCP endpoint** — extract real crop data, environmental constants, nutritional targets
2. **Validate/update simulation spec** with KB data
3. **Build simulation engine** in Python
4. **Connect agent** to AgentCore gateway
5. Then: UI wireframes, brand, pitch

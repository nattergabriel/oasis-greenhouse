# Value Roadmap — From Hackathon to Product

---

## Phase 0 — Hackathon MVP (now)

**Goal:** Prove the concept works and the science is real.

- ✅ Simulation engine grounded in all 7 KB domains (192 tests)
- ✅ AI agent loop: plan → execute → react → learn (LangGraph + Bedrock)
- ✅ 450-day simulation with verified results (~17% calorie fraction)
- ✅ Live dashboard with greenhouse visualization
- ✅ Strategy document learning across simulation runs

**Key proof point:** "An AI agent can autonomously manage a closed-environment greenhouse using Syngenta's Knowledge Base, learn from each run, and produce scientifically plausible results."

---

## Phase 1 — Pilot (months 1-3)

**Goal:** Validate with real CEA operators.

- Deploy in 3-5 commercial CEA facilities (vertical farms, greenhouse operations)
- Replace simulated environment data with real sensor data (temperature, humidity, PAR, CO₂)
- Connect to Cropwise Operations via Open Platform APIs for field data integration
- Expand crop library using Cropwise's full agronomic models (80,000+ crop growth stages)
- A/B test agent recommendations against human expert decisions

**Key milestone:** First commercial greenhouse operator uses agent recommendations to adjust crop allocation and sees measurable yield improvement.

---

## Phase 2 — Scale (months 4-8)

**Goal:** Integrate into Syngenta's ecosystem.

- Publish as a module on the Cropwise Open Platform
- Multi-crop, multi-facility support (managing 10+ greenhouses simultaneously)
- Integration with Syngenta's predictive pest/disease outbreak system (launching 2026)
- Taranis computer vision integration for automated plant health assessment
- Regional localization (different crops, climates, regulatory environments)

**Key milestone:** 50+ facilities using the system, measurable improvement in resource efficiency across the portfolio.

---

## Phase 3 — Agricultural Intelligence (months 9-12)

**Goal:** Become the autonomous decision layer for CEA.

- Full integration with Cropwise Grower chatbot (agent communicates recommendations in natural language to farmers)
- Cross-facility learning (strategy documents shared and adapted across similar operations)
- Predictive resource forecasting using historical simulation data
- Compliance and sustainability reporting integration (Cropwise Financials & Sustainability module)

**Key milestone:** The agent manages end-to-end crop operations autonomously, with human oversight for high-stakes decisions only — exactly the "hybrid autonomy" model in Syngenta's AI Manifesto.

---

## Visualization

```
[Hackathon]      [Pilot: 1-3mo]      [Scale: 4-8mo]       [AI Layer: 9-12mo]
  Prove it    →    Test it with    →    Integrate into   →    Become the
  on Mars          real CEA ops         Cropwise              decision layer
                                        ecosystem             for global CEA
```

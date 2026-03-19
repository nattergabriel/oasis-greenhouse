# Business Case — Mars Greenhouse AI → Earth CEA

---

## The Problem in Business Terms

### On Mars (the demo)
Feeding 4 astronauts for 450 days with limited water, energy, and space. Pre-packaged food degrades nutritionally over time. A greenhouse supplement is essential but requires autonomous management — no Mission Control call back is possible with 20-minute signal delay.

### On Earth (the real opportunity)
- Traditional agriculture faces climate volatility, water scarcity, soil degradation, and labor shortages
- The CEA industry is booming ($108B in 2025 → $420B by 2035) but lacks autonomous decision-support systems
- Syngenta's IPSOS research shows a widening digital divide: large farms adopt AI, small farms get left behind
- The "Hidden AI" phenomenon: farmers already use AI (GPS tractors, smart irrigation) but resist anything labeled "AI"

**Syngenta's CDO:** "The agriculture sector stands at a tipping point. Climate pressures, global market volatility, and the urgent need to promote sustainable farming practices mean that technology adoption can no longer be optional."

---

## Our Solution's Value

### Direct value
- **Autonomous greenhouse management** — reduces human decision-making overhead by 80%+ (agent makes ~20-25 decisions per 450-day run vs constant manual monitoring)
- **KB-grounded recommendations** — every decision backed by Syngenta's agronomic data, not guesswork
- **Learning system** — strategy improves with each simulation run without retraining models

### For Syngenta specifically
- **Cropwise Open Platform integration** — our agent architecture could be a module on the Open Platform
- **Demonstrates "Agricultural Intelligence"** — the exact vision Jeff Rowe presented at Davos
- **IPSOS alignment** — delivers all 5 pillars of equitable AI (proof of returns, simplification, local solutions, pride, trust)
- **Transparent AI** — agent logs every decision with reasoning, matching Syngenta's AI Manifesto on human oversight

---

## Market Opportunity

| Market | 2025 Value | Projected Value | CAGR |
|---|---|---|---|
| Controlled Environment Agriculture | $108B | $420B (2035) | 14.5% |
| Vertical Farming (subset) | $9.6B | $39B (2033) | 19.3% |
| Cropwise platform reach | 70M hectares | Growing | — |

The autonomous decision layer is the missing piece. Current CEA operations use sensors and automation but lack integrated AI that plans, reacts to crises, and learns from outcomes. That's what we built.

---

## Monetization Path (for Syngenta)

| Model | How it works | Fit |
|---|---|---|
| **Cropwise module** | Integrate as "Cropwise Greenhouse AI" — decision-support for CEA operators | ★★★★★ |
| **Embedded in Cropwise Operations** | Add autonomous planning to existing farm management dashboards | ★★★★ |
| **Open Platform API** | Expose the agent architecture as an API for third-party CEA developers | ★★★★ |
| **Training/simulation tool** | Sell the simulation as a training environment for agronomists | ★★★ |

---

## Implementation Feasibility

- **KB already exists** — Syngenta's MCP Knowledge Base has all 7 domains needed
- **AWS infrastructure ready** — Bedrock for LLM, AgentCore for agent hosting
- **Cropwise Open Platform** — APIs already available for developer integration
- **No new data required** — the agent learns from simulation runs, not new datasets
- **Scalable** — stateless simulation engine, LangGraph agent loop, standard cloud deployment

---

## Key Metrics (what Syngenta would measure)

| Metric | What it proves |
|---|---|
| Calorie greenhouse fraction improvement per run | Agent learning works |
| KB query accuracy (agent uses relevant KB data) | AgentCore integration works |
| Crisis response time (how fast agent reacts to events) | Autonomous management works |
| Strategy document quality (measured by subsequent run performance) | Learning system works |
| Resource efficiency (water/nutrient conservation) | Sustainability value |

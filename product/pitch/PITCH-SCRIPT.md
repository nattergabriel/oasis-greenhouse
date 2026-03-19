# Pitch Script — 3-Minute Presentation

> Format: Live 3-minute pitch with PowerPoint slides + demo video
> ~400 words spoken, ~27 sentences
> Visual design: brand/IDENTITY.md (cinematic + content hybrid)
> Updated: post-mentor feedback (Mars value, AWS deployment, self-learning, data flow)

---

## Slide-by-slide breakdown

### SLIDE 1 — Hook (0:00 – 0:15) [Presentation quality]

**Visual:** Mode A — Cinematic. Full-bleed Mars greenhouse hero image (round dome with 4×4 grid visible, green plants on red terrain, starry sky). Dark gradient overlay on left for text. TERRA NOVA logo bottom-left.

**Spoken (~40 words):**
"4 astronauts. 450 days on Mars. One greenhouse standing between them and complete dependence on packaged food. Can an AI agent learn to keep them fed — and could that same technology transform how we grow food on Earth?"

---

### SLIDE 2 — The Challenge (0:15 – 0:40) [Functional accuracy]

**Visual:** Mode B — Content. Dark navy background (#0A1628). Section label "THE CHALLENGE" in green. Two side-by-side cards: Mars Constraints (terracotta accent) and Syngenta Knowledge Base (green accent). Icons for each data point.

**Spoken (~65 words):**
"Pre-packaged food degrades over months — vitamins deplete, nutrition drops. By day 300, the crew needs fresh food. That's why the greenhouse isn't a luxury — it's a lifeline. Syngenta's Knowledge Base gave us the real science: 5 crop types, their growth cycles, stress responses, and nutritional profiles. We built a simulation grounded entirely in this data to maximize what the greenhouse can produce."

---

### SLIDE 3 — Our Solution: The AI Agent (0:40 – 1:10) [Creativity]

**Visual:** Mode B — Content. Dark navy background. **System architecture diagram** (NOT just a process flow) showing:
- **AWS Cloud wrapper** around the entire system (with AWS logo)
- **AI Agent loop**: PLAN → SIMULATE → REACT → LEARN with a curved arrow from LEARN back to PLAN labeled "strategy improves each run"
- **Three data sources feeding in**: Syngenta MCP KB (via AWS AgentCore Gateway), Strategy Document (persistent, evolving), Simulation Engine (environment data)
- Below: 2-column feature strip (KB-Grounded, Self-Improving)

**Spoken (~75 words):**
"Terra Nova is an autonomous AI agent that manages a Martian greenhouse. It doesn't just follow rules — it learns. Every 30 days it reviews the greenhouse state, queries Syngenta's Knowledge Base through AWS AgentCore, and sets crop allocations. When a crisis hits — a water recycling failure, a temperature spike — the agent reacts with KB-guided interventions. After each 450-day mission, it rewrites its own strategy document. Run after run, it gets smarter."

---

### SLIDE 4 — Demo Video (1:10 – 1:50) [Visual design + Functional accuracy]

**Visual:** Mode C — Transition to cinematic demo video (60-90 sec, but only ~40 sec shown live). Epic ambient music. Mission briefing opening → dashboard → crisis → resolution → results.

**Spoken (~80 words, narrating over the video):**
"Let me show you the mission. Sol 1 — the greenhouse comes online. The agent assigns crops to a 4×4 grid: potatoes for calories, beans for protein, lettuce and herbs for micronutrients. Watch them grow... [fast forward] ...sol 47, a water recycling event fires. The agent detects it, queries the KB, protects the high-calorie crops. Crisis managed. By sol 450, the greenhouse provides [X]% of the crew's calories and all 7 critical micronutrients are covered."

---

### SLIDE 5 — Mars to Earth (1:50 – 2:20) [Creativity]

**Visual:** Mode A — Cinematic. Mars-to-Earth transition image (Mars terrain left, Earth vertical farm right). Big market numbers overlaid. Callout box at bottom with terracotta accent border.

**Spoken (~80 words):**
"But this isn't just about Mars. NASA's space farming research already powers a $108 billion industry on Earth. Their LED lighting, hydroponics, and closed-loop systems are used by Plenty, AeroFarms, and Bowery Farming. What's missing is the autonomous decision layer. Train the agent in simulation. Deploy it to real environments. The learning loop transfers. Our AI agent — grounded in Syngenta's knowledge base — is exactly the technology Syngenta is building toward with Cropwise AI. Agricultural Intelligence, from Mars to Earth."

---

### SLIDE 6 — Tech Stack & What's Next (2:20 – 2:45) [Functional accuracy]

**Visual:** Mode B — Content. Dark navy background. Left: tech stack items in cards with **AWS prominently branded** (AWS logo visible, AWS Bedrock and AgentCore highlighted). Right: vertical timeline roadmap (NOW → 1-3 MO → 4-8 MO). Syngenta + AWS logos at bottom.

**Spoken (~50 words):**
"Deployed on AWS — Bedrock for the agent, AgentCore Gateway for Syngenta's MCP Knowledge Base. LangGraph for the decision loop. Stateless simulation engine with 192 tests. Next: integrate with Cropwise Open Platform APIs. Deploy as a decision-support module for real greenhouse operators. The agent that learned on Mars can help farmers on Earth."

---

### SLIDE 7 — Close (2:45 – 3:00) [Presentation quality]

**Visual:** Mode A — Cinematic. Same Mars greenhouse hero image (or variant — dome interior with thriving 4×4 grid). TERRA NOVA centered large. Tagline in green. Team names. Partner logos (Syngenta + AWS).

**Spoken (~20 words):**
"Terra Nova. An AI that learns to farm on Mars — and brings that intelligence back to Earth. One harvest at a time."

---

## Total: ~410 words, 7 slides, 3 minutes

---

## Key changes from mentor feedback

| Mentor point | Where addressed | How |
|---|---|---|
| State the goal: reduce food dependence | Slide 2 | "Pre-packaged food degrades... the greenhouse is a lifeline" |
| Mars-to-Earth translation | Slide 5 | Already strong, kept + added "learning loop transfers" |
| Show AWS deployment | Slide 3 diagram + Slide 6 | AWS Cloud wrapper in architecture, "Deployed on AWS" in slide 6 |
| Self-learning + adaptability | Slide 3 diagram | Curved arrow LEARN→PLAN with "strategy improves each run" label |
| Data flow (MCP → learning → sim) | Slide 3 diagram | Three data sources visually feeding into agent loop |
| 50 runs / learning evidence | Q&A backup slide | Not in main pitch — available if judges ask |

---

## Q&A Prep (backup slides ready)

**"How accurate is the simulation?"**
All crop parameters from Syngenta KB: growth cycles, yields, temperatures, stress responses, nutritional content. 7 stress types from KB Domain 4. 2 event scenarios from KB Domain 6. Nutrition targets from KB Domain 5. 192 passing tests.

**"How does the agent learn?"**
Living strategy document — 2-3 pages of text. Rewritten after each 450-day run. The agent keeps what worked, drops what didn't. No fine-tuning, no separate training. Just a text document that gets sharper with every run. [Show learning evidence backup slide if available: Run 1 vs Run N comparison.]

**"How does this connect to Syngenta?"**
Directly uses their MCP Knowledge Base for every agent decision via AWS AgentCore Gateway. Architecture maps to Cropwise AI (GenAI chatbot pattern, precision optimization). Could integrate via Cropwise Open Platform APIs. Addresses all 5 pillars of equitable AI from the IPSOS research.

**"What's the AWS architecture?"**
Claude Sonnet via AWS Bedrock for all LLM calls. Syngenta MCP KB accessed through AWS AgentCore Gateway. Simulation engine and backend deployed on AWS infrastructure. The entire system runs on AWS end-to-end.

**"What about the Mars-to-Earth connection?"**
NASA's Biomass Production Chamber (1988) was the first vertical farm. Their LED and hydroponic research now powers companies like Plenty (360× yield, <1% water) and AeroFarms (95% less water). Our learning loop is environment-agnostic: train in simulation, deploy to real greenhouses. CEA market: $108B → $420B by 2035.

**"Why not just use pre-packaged food?"**
KB Domain 5: vitamins degrade in storage over 450+ days, psychological satisfaction matters for crew morale, greenhouse supplements reduce Earth-dependence. Our simulation demonstrates that a well-managed greenhouse meaningfully supplements the crew diet — and the agent learns to maximize that output.

**"What's the business model?"**
Integrate as a Cropwise module — decision-support for CEA operators. Phase 1: pilot with real greenhouse operators (1-3 months). Phase 2: Cropwise Open Platform integration (4-8 months). The agent architecture is modular and platform-ready.

**"Does the agent actually improve over runs?"**
[Backup slide with learning evidence] Yes. The strategy document starts generic ("plant a mix of crops") and evolves into specific, data-driven guidance ("stagger potato planting every 30 days for continuous harvest, prioritize calorie-dense crops in slots with best light exposure"). We can show strategy snapshots across runs.

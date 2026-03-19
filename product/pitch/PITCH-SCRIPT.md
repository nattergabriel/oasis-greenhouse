# Pitch Structure — 3-Minute Presentation

> Format: Live 3-minute PowerPoint + working demo
> ~400 words spoken, ~27 sentences
> Every second mapped to judging criteria

---

## Slide-by-slide breakdown

### SLIDE 1 — Hook (0:00 - 0:15) [Presentation quality]

**Visual:** Dark Mars landscape. Simple text.

**Spoken (3 sentences, ~40 words):**
"4 astronauts. 450 days on Mars. One greenhouse standing between them and complete dependence on packaged food. Can an AI agent learn to keep them fed — and could that same technology transform how we grow food on Earth?"

### SLIDE 2 — The Challenge (0:15 - 0:40) [Functional accuracy]

**Visual:** Split screen — Mars surface (left) vs Earth farm under drought (right). Key numbers overlaid.

**Spoken (~60 words):**
"Feeding astronauts on Mars isn't just a space problem — it's an extreme version of the exact challenges facing agriculture on Earth today. Climate volatility. Water scarcity. Limited resources. Syngenta's Knowledge Base gave us the real science: 5 crop types, their growth cycles, stress responses, and nutritional profiles. We built a simulation grounded entirely in this data."

### SLIDE 3 — Our Solution: The AI Agent (0:40 - 1:10) [Creativity]

**Visual:** Architecture diagram — Agent loop (plan → simulate → react → learn). Show the LangGraph flow.

**Spoken (~75 words):**
"Terra Nova is an autonomous AI agent that manages a Martian greenhouse. It doesn't just follow rules — it learns. Every 30 days it reviews the greenhouse state, queries Syngenta's Knowledge Base, and sets crop allocations. When a crisis hits — a water recycling failure, a temperature spike — the simulation stops and the agent reacts with KB-guided interventions. After each 450-day run, it rewrites its own strategy document. Run after run, it gets smarter."

### SLIDE 4 — Live Demo (1:10 - 1:50) [Visual design + Functional accuracy]

**Visual:** Switch to live dashboard. Show simulation running.

**Spoken (~80 words):**
"Let me show you. Here's the greenhouse on sol 1 — empty. The agent assigns crops to each slot based on KB recommendations: potatoes for calories, beans for protein, lettuce for micronutrients. Watch the crops grow... [fast forward] ...day 47, a water recycling event fires. The agent detects it, queries the KB for guidance, reduces water to low-priority crops, protects the potatoes. Crisis managed. By day 450, our greenhouse provides 17% of the crew's calories and covers all 7 critical micronutrients."

### SLIDE 5 — Mars to Earth (1:50 - 2:20) [Creativity]

**Visual:** Transition visual — Mars greenhouse morphing into Earth vertical farm. Market numbers.

**Spoken (~75 words):**
"But this isn't just about Mars. NASA's space farming research already powers a $108 billion industry on Earth. Their LED lighting, hydroponics, and closed-loop systems are used by Plenty, AeroFarms, and Bowery Farming. What's missing is the autonomous decision layer. Our AI agent — grounded in Syngenta's agronomic knowledge base — is exactly the technology Syngenta is building toward with Cropwise AI and the Open Platform. Agricultural Intelligence, from Mars to Earth."

### SLIDE 6 — Tech Stack & What's Next (2:20 - 2:45) [Functional accuracy]

**Visual:** Clean tech stack diagram. Syngenta + AWS logos. Roadmap timeline.

**Spoken (~50 words):**
"Built on AWS Bedrock with Syngenta's MCP Knowledge Base. LangGraph for the agent loop. Stateless simulation engine with 192 tests. Next: integrate with Cropwise Open Platform APIs. Deploy as a decision-support module for Cropwise Operations. The agent that learned to farm on Mars can help farmers on Earth."

### SLIDE 7 — Close (2:45 - 3:00) [Presentation quality]

**Visual:** Project name + tagline. Team. Simple and strong.

**Spoken (~20 words):**
"Terra Nova. An AI that learns to farm on Mars — and brings that intelligence back to Earth. One harvest at a time."

---

## Total: ~400 words, 7 slides, 3 minutes

## Speaker notes for Q&A prep

**"How accurate is the simulation?"**
All crop parameters from Syngenta KB: growth cycles, yields, temperatures, stress responses, nutritional content. 7 stress types from KB Domain 4. 2 event scenarios from KB Domain 6. Nutrition targets from KB Domain 5. 192 passing tests.

**"How does the agent learn?"**
Living strategy document — 2-3 pages. Rewritten after each 450-day run. The agent keeps what worked, drops what didn't. No fine-tuning, no separate training. Just a text document that gets sharper.

**"How does this connect to Syngenta?"**
Directly uses their MCP Knowledge Base. Architecture maps to Cropwise's AI capabilities (GenAI chatbot, predictive intelligence, precision optimization). Could integrate via Cropwise Open Platform APIs. Addresses all 5 pillars of equitable AI from the IPSOS research.

**"What about the Mars-to-Earth connection?"**
NASA's Biomass Production Chamber (1988) was the first vertical farm. Their LED, NFT, and aeroponics research powers the $9.6B vertical farming industry. Our simulation uses the same principles. Our AI agent adds the autonomous decision layer. CEA market growing at 14.5% CAGR to $420B by 2035.

**"Why not just use pre-packaged food?"**
KB Domain 5: vitamins degrade in storage, psychological satisfaction matters, greenhouse supplements reduce dependence. Our simulation shows 17% calorie fraction is achievable with 60m² and proper crop allocation.

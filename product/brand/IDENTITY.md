# Brand Identity — Terra Nova

> **Final design system for presentation, frontend, and all project materials.**
> Updated: Day 2 — post design audit + mentor feedback.

---

## Name & Tagline

**Name:** TERRA NOVA
**Tagline:** "From Mars to Earth, one harvest at a time."

---

## Design Philosophy

**Cinematic realism meets clean data.** We draw directly from the Syngenta/AWS enablement session's visual language: photorealistic Mars greenhouse imagery for emotional hero moments, paired with clean dark layouts for data and architecture slides.

Two modes:
- **Cinematic slides** (1, 5, 7): Full-bleed Mars greenhouse imagery, atmospheric, emotional. Dark starry sky blending into red Martian terrain with green plants visible inside a dome. This image *is* the brand — it bridges Mars and agriculture without needing to choose between orange and green.
- **Content slides** (2, 3, 4, 6): Dark navy backgrounds with card panels. Clean, structured, readable. Green accents for life/growth, terracotta for Mars/alerts.

---

## Color Palette

### Core palette (4 colors + 2 text)

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| **Background** | Dark Navy | `#0A1628` | Content slide backgrounds, primary canvas |
| **Card / Panel** | Slate Blue | `#122240` | Cards, panels, elevated content areas |
| **Primary accent** | Greenhouse Green | `#4CAF50` | Brand color. Logo, headlines, positive metrics, KB indicators, growth |
| **Secondary accent** | Terracotta | `#E2725B` | Mars references, key data highlights, alerts, CTA buttons |
| **Text primary** | Off-white | `#F0E7E7` | All primary text |
| **Text muted** | Muted Lavender | `#A0A0C0` | Captions, secondary text, labels |

### Extended palette (dashboard / charts only)

| Role | Color | Hex |
|------|-------|-----|
| Data highlight | `#FDA600` |
| Alert/warning | `#B7410E` |
| Muted green | `#A9B8A8` |
| Syngenta Blue | `#36398E` |
| Syngenta Green | `#009F3C` |

### CSS Variables (for frontend)

```css
:root {
  --bg-deep: #0A1628;
  --bg-card: #122240;
  --accent-green: #4CAF50;
  --accent-terra: #E2725B;
  --text-primary: #F0E7E7;
  --text-muted: #A0A0C0;
}
```

---

## Typography

### Font pairing: Space Grotesk + Inter

| Role | Font | Weight | Size (slides) |
|------|------|--------|---------------|
| Hero numbers | Space Grotesk | Bold (700) | 72pt+ |
| Slide titles | Space Grotesk | Bold (700) | 36-44pt |
| Section labels | Space Grotesk | Semi-bold (600) | 12pt, UPPERCASE, letter-spaced |
| Body text | Inter | Regular (400) | 16-20pt |
| Captions | Inter | Regular (400) | 10-12pt |
| Data / Mono | Space Mono | Regular (400) | 14pt |

---

## Logo

"TERRA NOVA" in Space Grotesk Bold, all caps, generous letter-spacing. Small stylized leaf icon to the left in Greenhouse Green (#4CAF50).

Variants: green text on dark, white text on image. Leaf always green.

---

## Slide-by-slide spec

### SLIDE 1 — Hook (Mode A: Cinematic)
- Background: Mars greenhouse hero image (round dome, 4×4 grid visible, red terrain, starry sky)
- Left side: dark gradient overlay for text readability
- "4 astronauts. 450 days. One greenhouse." — 38-42pt, off-white
- "Can an AI agent learn to keep them fed — and transform how we grow food on Earth?" — 20pt, muted
- TERRA NOVA logo bottom-left, tagline in italic

### SLIDE 2 — The Challenge (Mode B: Content)
- Section label: "THE CHALLENGE" in green
- Headline: "An extreme test for agriculture — on Mars and Earth"
- Two cards side by side:
  - Left: "MARS CONSTRAINTS" (terracotta) — temp, water, energy, crew data with icons
  - Right: "SYNGENTA KNOWLEDGE BASE" (green) — 7 domains, 5 crops, 7 stress types, 7 micronutrients
- Bottom italic: "Pre-packaged food degrades. The greenhouse isn't a luxury — it's a lifeline."

### SLIDE 3 — The AI Agent (Mode B: Content) ⭐ KEY SLIDE — UPDATED
- Section label: "THE AI AGENT" in green
- Headline: "An autonomous agent that learns to farm"
- **System architecture diagram** (not just a process flow):

```
┌──────────────── AWS Cloud (Bedrock + AgentCore) ────────────────┐
│                                                                   │
│   Syngenta MCP KB ──→ ┌──────────────────────────┐              │
│   (via AgentCore)      │      AI AGENT LOOP       │              │
│                        │  PLAN → SIMULATE → REACT  │ ←── Simulation
│   Strategy Doc ──────→ │         ↓                 │     Engine
│   (persistent,         │       LEARN               │    (env data)
│    evolves) ←──────────│   ↗ "strategy improves"   │              │
│                        └──────────────────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

  - **AWS Cloud** as a wrapper around the entire system (AWS logo visible)
  - **Three data sources** feeding the agent: Syngenta MCP KB (static knowledge, via AgentCore), Strategy Document (learned knowledge, persistent), Simulation Engine (environment data)
  - **Learning loop arrow** from LEARN back to Strategy Document back to PLAN — with subtle label "strategy improves each run"
  - The diagram communicates: AWS deployment, data flow, self-learning, and the complete architecture in one visual

- Below diagram: 2-column feature strip:
  - "KB-Grounded" — every decision backed by Syngenta's 7-domain Knowledge Base
  - "Self-Improving" — strategy document evolves with each mission

### SLIDE 4 — Demo Video (Mode C: Demo)
- "LIVE DEMO" title card or switch directly to video
- Dashboard showing circular greenhouse + 4×4 grid
- Narrate: mission start → crop growth → crisis → resolution → final metrics

### SLIDE 5 — Mars to Earth (Mode A: Cinematic)
- Background: Mars-to-Earth transition image
- Headline: "The same technology powers a $108B industry"
- Big numbers: "$108B → $420B" (CEA) + "$9.6B / 19.3% CAGR" (vertical farming)
- Callout box: "What's missing is the autonomous decision layer. Train in simulation. Deploy to real environments."

### SLIDE 6 — Tech Stack & What's Next (Mode B: Content)
- Section label: "DEPLOYED ON AWS" in green (not just "BUILT WITH")
- Left: tech stack cards with **AWS prominently branded**:
  - AWS Bedrock — Claude Sonnet for agent decisions
  - AWS AgentCore Gateway — Syngenta MCP Knowledge Base
  - LangGraph — Agent decision loop
  - Simulation Engine — Stateless FastAPI, 192 tests
  - Next.js + shadcn — Real-time dashboard
- Right: "WHAT'S NEXT" timeline (NOW → 1-3 MO → 4-8 MO)
- Syngenta + AWS logos prominent at bottom

### SLIDE 7 — Close (Mode A: Cinematic)
- Background: Mars greenhouse image (variant or interior view)
- "TERRA NOVA" centered, 52pt, off-white
- "An AI that learns to farm on Mars — and brings that intelligence back to Earth."
- Tagline in green italic
- Team names, Syngenta + AWS logos

---

## Demo Video Concept

60-90 seconds. Cinematic mission briefing → dashboard → crisis → results.

- 0:00-0:10: Epic music. "Mars Surface Mission — Day 1."
- 0:10-0:30: Agent assigns crops, fast-forward growth
- 0:30-0:50: Crisis. Agent reacts with KB guidance.
- 0:50-1:10: Day 450 results. Mission complete.
- 1:10-1:20: TERRA NOVA logo.

---

## Image Assets Needed

| Asset | Source | Used on |
|---|---|---|
| Mars dome greenhouse | Midjourney | Slides 1, 7 |
| Mars-to-Earth transition | Midjourney | Slide 5 |
| Dashboard screenshot | Running frontend | Slide 4 / video |
| TERRA NOVA logo | Build in Figma | All slides |
| Syngenta + AWS logos | Brand assets | Slides 6, 7 |

---

## Tone & Voice

Professional but not corporate. Scientific but accessible. "Smart scientist who explains complex things simply." We say "AI that learns to farm" not "machine learning optimization pipeline."

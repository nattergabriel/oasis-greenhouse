# Figma Implementation Guide — Terra Nova Pitch Deck

> **The step-by-step playbook.** Follow this in order. Every step has the exact action, where to click, and what to type.
> Updated: Day 2, post design audit + research + mentor feedback.

---

## Decision: Use Figma Design files (NOT Figma Slides)

Figma Slides breaks custom fonts (Space Grotesk reverts to Arial on export), flattens gradients, and limits layout control. For our cinematic deck with precise typography and full-bleed imagery, standard Figma Design is superior. We use the **Pitchdeck plugin** to handle export to PPTX/PDF.

**Free Figma Starter plan works for everything we need.** No paid plan required.

---

## STEP 1: Find and duplicate a dark template (15 min)

Don't build from scratch — it takes 2+ hours just for infrastructure. Start from a community template and override its tokens.

**Go to:** figma.com/community → search "dark pitch deck template"

**Recommended templates to try:**
- "Free Pitch Deck Template 2025 — Modern Startup Presentation (Dark Theme)" — 15+ slides, dark, auto-layout
- "Depu Pitch Deck Template" — 50+ slides, dark mode, 100% color customizable
- "Minimal Slide Deck Presentation Template" — light + dark themes, auto-layout, master styles

**What to look for in a template:**
- ✅ Dark background already
- ✅ Uses Auto Layout on frames
- ✅ Has defined color styles or variables
- ✅ 1920×1080 frame size (or easy to resize)
- ✅ Has card components, text styles, basic layouts
- ❌ Skip templates that are image-heavy with baked-in photos (hard to override)
- ❌ Skip templates without auto layout (manual pixel pushing)

**Action:** Duplicate the template to your drafts → rename to "Terra Nova — Pitch Deck"

---

## STEP 2: Override the color system (10 min)

Open the duplicated file. Now replace the template's colors with ours.

### If the template uses Local Variables:
1. Click the **Local Variables** icon (filter icon, right panel) or press the variables shortcut
2. Find the template's color collection
3. Edit each variable's hex value:

| Template variable (find the equivalent) | Our hex value |
|---|---|
| Background / Surface dark | `#0A1628` |
| Card / Surface elevated | `#122240` |
| Primary / Accent | `#4CAF50` |
| Secondary / Accent 2 | `#E2725B` |
| Text / Primary | `#F0E7E7` |
| Text / Secondary | `#A0A0C0` |

4. Every element using those variables will update instantly across all slides

### If the template uses Color Styles (older method):
1. Open the left sidebar → click the **Styles** panel (or search styles)
2. Find and edit each color style, replacing the hex value
3. Same mapping as above

### If the template has neither:
Create your own variables from scratch:
1. Open Local Variables → Create Collection → name it "Terra Nova Colors"
2. Add 6 color variables with the names and hex values above
3. Apply them to elements as you build

---

## STEP 3: Override the typography (5 min)

1. Open **Text Styles** in the left panel
2. For each heading style → change font to **Space Grotesk**, weight Bold
3. For each body style → change font to **Inter**, weight Regular
4. Create or update these specific styles:

| Style name | Font | Weight | Size |
|---|---|---|---|
| Hero Number | Space Grotesk | Bold | 72px |
| Slide Title | Space Grotesk | Bold | 40px |
| Section Label | Space Grotesk | Semibold | 14px (+ UPPERCASE + 3px letter spacing) |
| Body | Inter | Regular | 18px |
| Caption | Inter | Regular | 12px |

**Note:** If Space Grotesk isn't available, make sure you've added it from Google Fonts in Figma's font picker. Search "Space Grotesk" — it should appear if you have Google Fonts enabled.

---

## STEP 4: Install plugins (3 min)

Open Resources (Shift+I) → Plugins tab → search and install:

1. **Pitchdeck Presentation Studio** — for PPTX/PDF export
2. **Iconify** — 200,000+ icons searchable in Figma
3. **UX Pilot** — AI layout generation from text prompts (for content slides)
4. **Unsplash** — stock photos (Mars landscapes as backup)
5. **Noise & Texture** — subtle grain overlays for depth

Optional but useful:
- **Stark** — contrast accessibility checker
- **TinyImage** — compress images for smaller exports

---

## STEP 5: Generate the Mars greenhouse hero image (10 min, do this NOW)

This runs in parallel while you work on slides. Open **Midjourney** (Discord or web) in another tab.

**Primary prompt (exterior shot for slides 1 + 7):**
```
A hyper-realistic wide-angle photograph of a futuristic circular geodesic 
glass greenhouse dome on the rugged dusty red surface of Mars. Inside the 
transparent dome, a 4x4 grid of hydroponic planting beds is visible, growing 
vibrant green lettuce, potato plants, bean vines, and herbs under 
bioluminescent LED grow lights. Two astronauts in detailed modern white EVA 
suits stand outside near the dome entrance. Background features towering 
jagged Martian mountains under a dark star-filled cosmic sky. Volumetric 
golden hour sunlight pierces through Martian dust casting long dramatic 
shadows. Shot on Sony A7RV, 24mm lens, f/8, depth of field, 8k resolution, 
cinematic lighting, NASA concept art style --ar 16:9 --style raw --v 6
```

**Interior view prompt (slide 7 variant):**
```
Interior view looking across a circular Mars greenhouse dome. A 4x4 grid of 
hydroponic planting slots on the floor, each growing different crops — lush 
green lettuce, potato plants, climbing bean vines, fresh herbs. Purple-red 
LED grow lights illuminate from above. Curved glass dome ceiling reveals 
Martian sky with stars and red horizon. Warm hopeful atmosphere, clean 
futuristic agricultural facility. Shot on Sony A7RV, 35mm lens, f/4, 
photorealistic, cinematic --ar 16:9 --style raw --v 6
```

**Mars-to-Earth transition (slide 5):**
```
Split composition, left half shows a circular glass dome greenhouse on red 
Martian surface with 4x4 crop grid visible inside and astronauts nearby, 
right half shows a modern Earth vertical farm facility with stacked LED-lit 
shelves of green plants in a clean white warehouse. Seamless visual 
transition blending the two environments in center. Cinematic, photorealistic 
--ar 16:9 --style raw --v 6
```

**While Midjourney generates:** Continue to Step 6. Come back to import the images when they're ready.

---

## STEP 6: Set up the 7 slide frames (5 min)

Delete or hide the template's existing slides. Create 7 fresh frames:

1. Press **F** to create a frame → set to 1920 × 1080
2. Name it `01_Hook`
3. Duplicate it 6 times (Cmd+D)
4. Rename: `02_Challenge`, `03_Agent`, `04_Demo`, `05_MarsToEarth`, `06_TechStack`, `07_Close`
5. Set all backgrounds to `#0A1628` (our dark navy)
6. Arrange them in a row on the canvas for easy navigation

---

## STEP 7: Build SLIDE 1 — The Hook (15 min)

**Layout: Mode A — Cinematic**

1. **Place the Midjourney hero image** as a fill on the frame. Set it to "Fill" sizing so it covers the full 1920×1080.
2. **Add a gradient overlay:** Create a rectangle 1920×1080 on top of the image. Fill it with a linear gradient: left side `#0A1628` at 90% opacity → right side `#0A1628` at 0% opacity.
3. **Add the hook text (left side):**
   - "4 astronauts. 450 days." — Space Grotesk Bold, 42px, `#F0E7E7`
   - "One greenhouse." — Space Grotesk Bold, 42px, `#F0E7E7` (new line)
   - Below: "Can an AI agent learn to keep them fed — and transform how we grow food on Earth?" — Inter Regular, 20px, `#A0A0C0`
4. **Add TERRA NOVA logo** bottom-left: "TERRA NOVA" in Space Grotesk Bold, 16px, `#4CAF50`, letter-spacing 3px. Small leaf icon from Iconify to the left.
5. **Add tagline** below logo: "From Mars to Earth, one harvest at a time." — Inter Italic, 11px, `#A0A0C0`

---

## STEP 8: Build SLIDE 7 — The Close (10 min)

1. Use the same hero image (or the interior variant) as background with a darker overlay (70-80% opacity)
2. Center: "TERRA NOVA" — Space Grotesk Bold, 56px, `#F0E7E7`, letter-spacing 6px
3. Below: "An AI that learns to farm on Mars — and brings that intelligence back to Earth." — Inter Regular, 18px, `#A0A0C0`
4. Below: "From Mars to Earth, one harvest at a time." — Inter Italic, 16px, `#4CAF50`
5. Bottom: "Team: [Names]" — Inter 11px, `#A0A0C0`
6. Bottom: Syngenta + AWS logos

---

## STEP 9: Build SLIDE 2 — The Challenge (15 min)

**Layout: Mode B — Content**

1. Background: `#0A1628`
2. Section label: "THE CHALLENGE" — 14px, Space Grotesk Semibold, `#4CAF50`, UPPERCASE
3. Title: "An extreme test for agriculture — on Mars and Earth" — 40px, Space Grotesk Bold, `#F0E7E7`
4. **Two cards side by side** (`#122240`, 12px corner radius):
   - **Left — "MARS CONSTRAINTS"** (terracotta label): thermometer → "-63°C average", water → "10,000L water, 90% recycled", lightning → "Solar-only energy", seedling → "12,000 kcal/day for 4 crew". Bottom: "450 days. No resupply." in `#E2725B`
   - **Right — "SYNGENTA KNOWLEDGE BASE"** (green label): database → "7 scientific domains", leaf → "5 KB-backed crop types", warning → "7 stress types, 2 crisis events", flask → "7 critical micronutrients". Bottom: "All science from the KB." in `#4CAF50`
5. Bottom italic: "Pre-packaged food degrades. The greenhouse isn't a luxury — it's a lifeline." — 11px, `#A0A0C0`

**Use Iconify plugin** for icons: thermometer, water, bolt, seedling, database, leaf, alert-triangle, flask.

---

## STEP 10: Build SLIDE 3 — The AI Agent (20 min) ⭐ KEY SLIDE

**Layout: Mode B — Content. This slide shows the system architecture, AWS deployment, data flow, AND the learning loop in one visual.**

1. Section label: "THE AI AGENT" in green
2. Title: "An autonomous agent that learns to farm"
3. **System architecture diagram:**
   - **Outer boundary:** Rounded rectangle labeled "AWS Cloud" (with AWS logo) wrapping the system
   - **Inside, center:** Agent loop as 4 connected boxes: PLAN → SIMULATE → REACT → LEARN
     - Each box: `#122240` background, colored top bar (green for PLAN/SIMULATE, terracotta for REACT/LEARN), icon + label
     - **Curved arrow from LEARN back toward PLAN** with label "strategy improves each run"
   - **Three data sources feeding in:**
     - Left: "Syngenta MCP KB" (via AWS AgentCore) → feeds PLAN and REACT — green + database icon
     - Bottom-left: "Strategy Document" (persistent, evolves) → feeds PLAN, rewritten by LEARN — orange + document icon
     - Right: "Simulation Engine" (environment data) → feeds SIMULATE — terracotta + flask icon
4. **Below: 2-column feature strip** (`#122240`):
   - "KB-Grounded" — "Every decision backed by Syngenta's 7-domain Knowledge Base"
   - "Self-Improving" — "Strategy document evolves with each mission"

**UX Pilot prompt:** "Generate a system architecture diagram on dark background showing an AWS cloud wrapper containing an AI agent loop (PLAN, SIMULATE, REACT, LEARN) with three external data sources feeding in: a knowledge base, a strategy document, and a simulation engine"

---

## STEP 11: Build SLIDE 4 — Demo transition (5 min)

1. Background: `#0A1628`
2. Center: "LIVE DEMO" — Space Grotesk Bold, 48px, `#4CAF50`
3. Below: "Mars Surface Mission — 450 Days" — Inter, 20px, `#A0A0C0`
4. Optional: dashboard screenshot preview in a card
5. Presenter notes: "Switch to demo video / live dashboard here"

---

## STEP 12: Build SLIDE 5 — Mars to Earth (15 min)

**Layout: Mode A — Cinematic**

1. Mars-to-Earth transition image as background
2. Section label: "MARS TO EARTH" in green
3. Title: "The same technology powers a $108B industry"
4. **Two number cards:**
   - "CEA MARKET" — "$108B → $420B" (72px), "2025 → 2035 | 14.5% CAGR"
   - "VERTICAL FARMING" — "$9.6B" (72px) + "19.3% CAGR" in orange
5. **Bottom callout** (terracotta left border):
   - "What's missing is the autonomous decision layer."
   - "Train in simulation. Deploy to real environments. The learning loop transfers."

---

## STEP 13: Build SLIDE 6 — Tech Stack & Roadmap (15 min)

**Layout: Mode B — Content**

1. Section label: "DEPLOYED ON AWS" in green — not just "built with"
2. **Left — 5 tech cards** (`#122240`), **AWS items first and prominent:**
   - AWS Bedrock → "Claude Sonnet for agent decisions" (AWS logo)
   - AWS AgentCore Gateway → "Syngenta MCP Knowledge Base access" (AWS logo)
   - LangGraph → "Agent decision loop (plan → sim → react → learn)"
   - Sim Engine → "Stateless FastAPI, 192 tests"
   - Next.js + shadcn → "Real-time dashboard"
3. **Right — "WHAT'S NEXT"** vertical timeline:
   - NOW (terracotta) → "Hackathon MVP"
   - 1-3 MO (orange) → "Pilot with real CEA operators"
   - 4-8 MO (green) → "Cropwise Integration"
4. Syngenta + AWS logos **prominent** at bottom

---

## STEP 14: Polish pass (20 min)

- [ ] All colors consistent (variables applied, no rogue hex codes)
- [ ] All headings Space Grotesk Bold, all body Inter Regular
- [ ] Section labels consistent position across content slides
- [ ] Cards: 12px corner radius, consistent shadow
- [ ] Text contrast sufficient on dark backgrounds
- [ ] Hero images: smooth gradient overlays, no harsh edges
- [ ] Syngenta + AWS logos on slides 6 and 7
- [ ] TERRA NOVA logo on slides 1 and 7
- [ ] Content matches PITCH-SCRIPT.md

---

## STEP 15: Add presenter notes (5 min)

Paste spoken script from PITCH-SCRIPT.md into each frame's notes. Pitchdeck plugin carries these over to PPTX export.

---

## STEP 16: Export (10 min)

**Primary — Figma prototype mode:**
1. Select all 7 frames → Prototype tab → "On click" → next frame → "Dissolve" 300ms
2. Present fullscreen: Cmd+\

**Backup — PDF:**
Select all frames → Export → PDF

**If PPTX required — Pitchdeck plugin:**
1. Right-click → Plugins → Pitchdeck Presentation Studio
2. Choose **"Text as Images"** mode (guarantees font fidelity)
3. Enable image compression → Export → test on presentation laptop

---

## Timeline

| Time | What |
|---|---|
| 0:00-0:15 | Find template, duplicate, override colors + fonts |
| 0:15-0:25 | Install plugins, start Midjourney generation |
| 0:25-0:40 | Build Slide 1 (Hook) + Slide 7 (Close) |
| 0:40-0:55 | Build Slide 2 (Challenge) |
| 0:55-1:15 | Build Slide 3 (Agent architecture) ⭐ |
| 1:15-1:30 | Build Slide 5 (Mars to Earth) + Slide 6 (Tech) |
| 1:30-1:35 | Build Slide 4 (Demo transition) |
| 1:35-1:50 | Polish pass |
| 1:50-2:00 | Export + test |

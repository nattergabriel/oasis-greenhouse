# Product Folder Index

> **Read this first.** This is the map of everything in `product/`. Every file has one job.
> Last updated: Day 2 of hackathon (March 19, 2026).

---

## Top-level docs

| File | Purpose | Read when... |
|---|---|---|
| `PROJECT-DEFINITION.md` | **Start here.** What the project is, what we built, how it connects to Syngenta, key numbers for the pitch. The single source of truth. | You need to understand or explain the project. |
| `FEATURES.md` | What we actually built — simulation engine, AI agent, dashboard. Updated to match real integrated system. | You need specifics on what's implemented vs not. |
| `CONTEXT.md` | Current project state, who does what, document map. | You need to orient yourself in the repo. |
| `AUDIT.md` | Project status tracker — what's done, what's pending. | You need to check what still needs work. |

---

## brand/

| File | Purpose | Read when... |
|---|---|---|
| `IDENTITY.md` | **Complete design system.** Colors (Mars dark theme: #070B34 base, #E2725B terracotta accents, #6B911B bio-green). Fonts (Space Grotesk + Inter). Slide design rules. CSS variables. Syngenta brand alignment. | You're designing slides, building frontend UI, or choosing any visual element. |

---

## pitch/

| File | Purpose | Read when... |
|---|---|---|
| `PITCH-SCRIPT.md` | **The 3-minute pitch.** 7 slides with exact spoken words (~400 words total). Timing per slide. Q&A prep with answers to expected judge questions. | You're building slides, rehearsing, or refining the pitch. |

---

## research/

| File | Purpose | Read when... |
|---|---|---|
| `CASE-BRIEF.md` | Official challenge requirements extracted from organizer docs. Judging criteria, deliverables, contacts, prize info. | You need to check what the judges expect. |
| `TECH-STACK.md` | MCP endpoint, AWS setup, recommended tools, key links. Extracted from organizer getting-started guide. | You need the KB endpoint URL or AWS config. |
| `PARTNER-ANALYSIS.md` | Syngenta deep dive: Cropwise platform (70M hectares, GenAI chatbot, Open Platform), executive quotes, IPSOS research, their language/terminology. | You're writing pitch content or aligning with Syngenta's vision. |
| `BUSINESS-CASE.md` | Mars-to-Earth value proposition. CEA market ($108B → $420B). Monetization path for Syngenta. Why this matters commercially. | You need to argue business value or answer "so what?" |
| `VALUE-ROADMAP.md` | Hackathon → Pilot (3mo) → Cropwise integration (8mo) → Agricultural Intelligence layer (12mo). | You need to show judges what comes after the hackathon. |
| `MARKET-FIT.md` | Target users, value proposition, competitive landscape, outside-the-box angle. | You need to explain who this is for and why it's different. |
| `Syngenta_Cropwise_Platform_Deep_Dive.pdf` | Source research: 24-page deep dive on Cropwise, Open Platform, IPSOS, WEF Davos quotes. | You need raw data or exact quotes. |
| `NASA_Space_Farming_Benefits_Earth_Agriculture.pdf` | Source research: 17-page Mars-to-Earth tech transfer story. NASA BPC, LED revolution, market numbers. | You need the NASA-to-commercial-farming narrative. |
| `Hackathon_Pitch_Deck_Design_Inspiration.pdf` | Source research: 19-page analysis of winning pitch decks, color palettes, font pairings, Syngenta brand identity. | You need design inspiration or brand reference. |

---

## Instruction Docs/

| File | Purpose | Read when... |
|---|---|---|
| `Challenge.md` | **Original organizer case document** — verbatim challenge description. Kept as reference. Content extracted into CASE-BRIEF.md. | You need the exact original wording from the organizers. |
| `README.md` | **Original getting-started guide** — AWS setup, Kiro, Amplify instructions. Kept as reference. Content extracted into TECH-STACK.md. | You need the original setup steps or troubleshooting tips. |

---

## Quick reference: what to read for each task

| Task | Read these |
|---|---|
| **Build the slides** | PROJECT-DEFINITION.md → PITCH-SCRIPT.md → brand/IDENTITY.md |
| **Rehearse the pitch** | PITCH-SCRIPT.md (has exact words + Q&A) |
| **Write any copy** | PARTNER-ANALYSIS.md (Syngenta language), PROJECT-DEFINITION.md (our story) |
| **Design the frontend** | brand/IDENTITY.md (CSS variables, colors, fonts) |
| **Answer judge questions** | PITCH-SCRIPT.md (Q&A section), BUSINESS-CASE.md, VALUE-ROADMAP.md |
| **Check what's built** | FEATURES.md, CONTEXT.md |
| **Find a specific number** | PROJECT-DEFINITION.md (key numbers table at bottom) |

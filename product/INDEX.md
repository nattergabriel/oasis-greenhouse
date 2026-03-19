# Product Folder Index

> **Read this first.** This is the map of everything in `product/`. Every file has one job.
> Last updated: Day 2, post design audit + Figma guide.

---

## Top-level docs

| File | Purpose | Read when... |
|---|---|---|
| `PROJECT-DEFINITION.md` | **Start here.** What the project is, what we built, how it connects to Syngenta, key numbers for the pitch. | You need to understand or explain the project. |
| `FEATURES.md` | What we actually built — simulation engine, AI agent, dashboard. | You need specifics on what's implemented vs not. |
| `CONTEXT.md` | Current project state, who does what, key source file paths. | You need to orient yourself in the repo. |
| `AUDIT.md` | Project status tracker — what's done, what's pending. | You need to check what still needs work. |

---

## brand/

| File | Purpose | Read when... |
|---|---|---|
| `IDENTITY.md` | **Design system.** Colors, fonts, slide-by-slide visual spec, logo concept, demo video concept. | You need the visual spec for any design work. |
| `FIGMA-GUIDE.md` | **Step-by-step Figma build guide.** 16 steps from template to export. Plugin list, Midjourney prompts, timeline. | You're about to open Figma and start building slides. |
| `DESIGN-AUDIT.md` | Design audit results — research findings, before/after decisions, rationale. | You want to understand WHY we made specific design choices. |

---

## pitch/

| File | Purpose | Read when... |
|---|---|---|
| `PITCH-SCRIPT.md` | **The 3-minute pitch.** 7 slides with exact spoken words (~400 words). Visual mode per slide (cinematic vs content). Timing. Q&A prep. | You're building slides, rehearsing, or refining the pitch. |

---

## research/

| File | Purpose | Read when... |
|---|---|---|
| `CASE-BRIEF.md` | Official challenge requirements. Judging criteria, deliverables, contacts, prize. | You need to check what the judges expect. |
| `TECH-STACK.md` | MCP endpoint, AWS setup, recommended tools, key links. | You need the KB endpoint URL or AWS config. |
| `PARTNER-ANALYSIS.md` | Syngenta deep dive: Cropwise, Open Platform, IPSOS, executive quotes. | You're writing pitch content or aligning with Syngenta. |
| `BUSINESS-CASE.md` | Mars-to-Earth value prop. CEA market ($108B → $420B). Monetization. | You need to argue business value. |
| `VALUE-ROADMAP.md` | Hackathon → Pilot → Cropwise integration → AI layer. | You need to show what comes after the hackathon. |
| `MARKET-FIT.md` | Target users, value proposition, competitive landscape. | You need to explain who this is for. |
| `*.pdf` (3 files) | Source research: Syngenta deep dive, NASA Mars-to-Earth, Pitch design. | You need raw data or exact quotes. |

---

## Instruction Docs/

| File | Purpose | Read when... |
|---|---|---|
| `Challenge.md` | Original organizer case document (verbatim). | You need the exact original wording. |
| `README.md` | Original getting-started guide. | You need setup steps or troubleshooting. |

---

## Quick reference

| Task | Read these (in order) |
|---|---|
| **Build slides in Figma** | brand/FIGMA-GUIDE.md (step-by-step) + PITCH-SCRIPT.md (content per slide) |
| **Rehearse the pitch** | PITCH-SCRIPT.md (exact words + Q&A) |
| **Design the frontend** | brand/IDENTITY.md (CSS variables, colors, fonts) |
| **Answer judge questions** | PITCH-SCRIPT.md (Q&A), BUSINESS-CASE.md, VALUE-ROADMAP.md |
| **Understand the project** | PROJECT-DEFINITION.md → FEATURES.md |
| **Check project status** | AUDIT.md → CONTEXT.md |

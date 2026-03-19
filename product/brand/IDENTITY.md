# Brand Identity — Terra Nova

> Design system for presentation, frontend, and all project materials.

---

## Name & Tagline

**Name:** TERRA NOVA
**Tagline:** "From Mars to Earth, one harvest at a time."

---

## Design Philosophy

We blend two worlds: the harsh, futuristic reality of Mars with the organic, grounded nature of agriculture. The design must feel scientifically credible but approachable — matching Syngenta's own brand philosophy of making complex technology feel human.

**Dark theme (primary):** For the presentation and dashboard. Mars night sky with terracotta accents.
**Light accents:** Agricultural greens for growth indicators and health states.

---

## Color Palette

### Primary palette (Mars dark theme)

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background Deep | Royal Dark Blue | `#070B34` | Deepest background, slide base |
| Background Card | Blue Zodiac | `#102849` | Cards, panels, modular content |
| Surface Elevated | Champion Blue | `#161B36` | Navigation, modals, elevated surfaces |
| Accent Primary | Terracotta | `#E2725B` | Primary CTA buttons, key highlights |
| Accent Warning | Rust Orange | `#B7410E` | Warning states, critical thresholds |
| Accent Data | Vibrant Orange | `#FDA600` | Data peaks, chart highlights |
| Text Primary | Pale Martian | `#F0E7E7` | Primary text (off-white, no halation) |
| Text Secondary | Muted Lavender | `#A0A0C0` | Secondary text, captions |

### Biological indicators (agriculture accents)

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Growth/Healthy | Chlorophyll | `#6B911B` | Healthy crop states, positive metrics |
| Secondary Bio | Desert Aloe | `#A9B8A8` | Inactive states, borders, secondary elements |
| Crop Health Good | Garlic Green | `#869F39` | Progress bars, growth indicators |

### Syngenta alignment

| Syngenta Color | Hex | How we reference it |
|---|---|---|
| King Blue | `#36398E` | Used subtly in gradient overlays and "powered by" sections |
| Super Green | `#009F3C` | Used in Syngenta logo placement and KB reference indicators |

### CSS Variables

```css
:root {
  --bg-deep: #070B34;
  --bg-card: #102849;
  --bg-surface: #161B36;
  --accent-primary: #E2725B;
  --accent-warning: #B7410E;
  --accent-data: #FDA600;
  --text-primary: #F0E7E7;
  --text-secondary: #A0A0C0;
  --bio-healthy: #6B911B;
  --bio-secondary: #A9B8A8;
  --bio-growth: #869F39;
  --syngenta-blue: #36398E;
  --syngenta-green: #009F3C;
}
```

---

## Typography

### Font pairing: Space Grotesk + Inter

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display / Headings | Space Grotesk | Bold (700) | Slide titles, section headers, big numbers |
| Subheadings | Space Grotesk | Semi-bold (600) | Card titles, labels, metric names |
| Body text | Inter | Regular (400) | Paragraphs, descriptions, explanations |
| Data / Mono | Space Mono | Regular (400) | Code blocks, data values, terminal output |
| Small / Caption | Inter | Regular (400), 12px | Axis labels, timestamps, footnotes |

**Why this pairing:**
- Space Grotesk: mechanical, slightly quirky geometric sans-serif. Based on Space Mono. Feels technical and futuristic without being unreadable. Perfect for Mars/space-tech.
- Inter: the standard for UI data presentation. Tall x-height, clinical geometry, zero ambiguity for numbers. Lets the data speak.

**Google Fonts import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
```

---

## Slide Design Guidelines (for Figma / PowerPoint)

### Layout rules
- **Dark backgrounds only** for slides — never white
- **One idea per slide** — no walls of text
- **Big numbers** in Space Grotesk Bold, 72pt+ — let data breathe
- **Minimal text** — 3-5 bullet points max per slide, short phrases not sentences
- **Full-bleed images** where possible — Mars landscape, greenhouse visualization
- **Consistent margins** — 80px from edges in Figma

### Visual hierarchy
1. **Hero number or visual** — the first thing the eye sees
2. **Headline** — Space Grotesk Bold, 1 line
3. **Supporting text** — Inter Regular, 2-3 lines max
4. **Source/footnote** — Inter 12px, text-secondary color

### Charts and data
- Use terracotta (#E2725B) for primary data series
- Use chlorophyll (#6B911B) for growth/positive metrics
- Use vibrant orange (#FDA600) for secondary data or peaks
- Background of charts: Blue Zodiac (#102849)
- Grid lines: very subtle, 10% opacity white
- Labels: Inter 12px, text-secondary

### Logo placement
- Our logo (if we make one): top-left of first and last slide
- Syngenta + AWS logos: bottom of tech stack slide and last slide
- "Powered by Syngenta Knowledge Base + AWS Bedrock": small text near logos

---

## Tone & Voice

| Attribute | Our voice |
|-----------|-----------|
| Formality | Professional but not corporate. Scientific but accessible. |
| Energy | Confident, forward-looking, grounded in data. |
| Personality | "Smart scientist who can explain complex things simply." |
| We say | "AI that learns to farm" not "machine learning optimization pipeline" |
| We avoid | Jargon overload. "Neural networks." "Algorithmic optimization." (Per IPSOS: this triggers resistance.) |

---

## Assets Checklist

- [ ] Slide deck (Figma or PowerPoint), 7 slides
- [ ] Project logo / wordmark (text-based is fine)
- [ ] Color palette exported as CSS variables
- [ ] Font imports ready
- [ ] Syngenta + AWS partner logos for credit slide
- [ ] Demo screenshots / recording as backup
- [ ] Architecture diagram (clean, for slide 3)

# Brand Identity Kit

> Fill this in before or at the very start of the hackathon. Everything downstream — UI, pitch, website — pulls from here.

---

## Project Name

- **Name:** _TBD (decide during ideation)_
- **Tagline:** _One sentence that explains what it does_
- **Domain / URL:** _If applicable_

---

## Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | | `#` | Main buttons, links, key actions |
| Primary Dark | | `#` | Hover states, headers |
| Secondary | | `#` | Accents, highlights |
| Background | | `#` | Page background |
| Surface | | `#` | Cards, modals, elevated elements |
| Text Primary | | `#` | Body text |
| Text Secondary | | `#` | Muted text, captions |
| Success | | `#` | Positive states |
| Warning | | `#` | Caution states |
| Error | | `#` | Error states, destructive actions |

### CSS Variables (copy to frontend)

```css
:root {
  --color-primary: #;
  --color-primary-dark: #;
  --color-secondary: #;
  --color-bg: #;
  --color-surface: #;
  --color-text: #;
  --color-text-muted: #;
  --color-success: #;
  --color-warning: #;
  --color-error: #;
}
```

---

## Typography

| Role | Font | Weight | Size | Usage |
|------|------|--------|------|-------|
| Headings | | Bold (700) | | Page titles, section headers |
| Subheadings | | Semi-bold (600) | | Card titles, labels |
| Body | | Regular (400) | | Paragraphs, descriptions |
| Code / Mono | | Regular (400) | | Code blocks, data |

**Font source:** _Google Fonts / self-hosted / system fonts_

```css
/* Import line for frontend */
@import url('https://fonts.googleapis.com/css2?family=...');
```

---

## Logo & Mark

- **Logo file:** `brand/assets/logo.svg` (or .png)
- **Icon / Favicon:** `brand/assets/icon.svg`
- **Style notes:** _Minimal? Playful? Geometric? Describe the vibe._

---

## Tone & Voice

| Attribute | Our voice |
|-----------|-----------|
| Formality | _Casual / Professional / Somewhere in between_ |
| Energy | _Calm / Energetic / Urgent_ |
| Personality | _Friendly / Authoritative / Playful / Nerdy_ |
| Example sentence | _"We help you X by doing Y."_ |

---

## Application

### Website / Landing Page
- Hero: name + tagline + primary CTA
- Colors: primary for CTA, background for page, surface for cards
- Font pairing: heading font + body font

### In-App UI
- Primary color for interactive elements
- Surface color for cards/containers
- Consistent border-radius and spacing (see design-system/)

### Pitch Deck
- Slide backgrounds: background color or white
- Accent: primary color for highlights
- Font: heading font for titles, body font for content

---

## Assets Checklist

- [ ] Logo (SVG + PNG)
- [ ] Favicon / app icon
- [ ] Social preview image (1200×630 for Open Graph)
- [ ] Color palette exported (CSS variables, Tailwind config, or both)
- [ ] Font files or import links ready

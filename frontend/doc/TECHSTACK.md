# Tech Stack

## Core

| Tool | Role |
|------|------|
| **Next.js** | Framework — routing, SSR/SSG, API routes |
| **React** | UI components and state management |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Pre-built accessible components (buttons, dialogs, dropdowns, tabs, cards, tooltips) |

## Visualization & Animation

| Tool | Role |
|------|------|
| **Framer Motion** | State-driven animations and transitions |
| **Recharts** | Charts, graphs, gauges, heatmaps |
| **SVG** | Custom illustrations, icons, interactive diagrams |
| **CSS @keyframes** | Ambient looping effects (particles, shimmer, pulse) |

## Usage Examples

### Framer Motion
Animate between states declaratively. When data changes, the UI transitions smoothly.
```jsx
<motion.div animate={{ scale: status === 'active' ? 1 : 0.9, opacity: status === 'active' ? 1 : 0.5 }} transition={{ duration: 0.4 }} />
```
Good for: element state transitions, SVG morphing, layout animations, enter/exit, drag interactions.

### Recharts
Drop-in React charts driven by data arrays.
```jsx
<AreaChart data={data}>
  <Area dataKey="value" stroke="#e45858" fill="#e4585833" />
  <XAxis dataKey="day" />
  <Tooltip />
</AreaChart>
```
Good for: line/area/bar charts, radial gauges, stacked breakdowns, sparklines.

### SVG + Framer Motion
Animate individual SVG elements by swapping or morphing between states.
```jsx
<motion.path d={isGrown ? grownPath : sproutPath} transition={{ duration: 1.2 }} />
```
Good for: custom scenes with layered animated elements, interactive diagrams, illustrated views.

### CSS @keyframes
Lightweight infinite loops without JS overhead.
```css
@keyframes drift {
  from { transform: translateX(-100%); opacity: 0; }
  50% { opacity: 0.6; }
  to { transform: translateX(100vw); opacity: 0; }
}
.particle { animation: drift 8s linear infinite; }
```
Good for: background particles, pulsing indicators, scrolling textures, glow effects.

### shadcn/ui + Tailwind
Pre-styled accessible components, customized via Tailwind classes.
```jsx
<Card className="bg-zinc-900 border-zinc-800">
  <CardHeader>
    <CardTitle className="text-amber-100">Zone 3</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```
Good for: all standard UI (cards, dialogs, forms, tabs, dropdowns, tooltips, toasts) without building from scratch.

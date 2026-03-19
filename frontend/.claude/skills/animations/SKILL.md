---
name: animations
description: Animation patterns for Mars Greenhouse Command Center including CSS keyframes, transitions, Framer Motion (React), and greenhouse-specific animations. Dark theme optimized. Use when adding animations, transitions, hover effects, loading spinners, skeleton loaders, page transitions, plant growth effects, sensor transitions, status indicators, or any motion/animation work.
---

# Animations Quick Reference

## Theme Colors
```css
/* Mars Dark Theme */
--background: #0f0e0c      /* Main background */
--card: #1a1917            /* Card background */
--secondary: #2e2b27       /* Secondary elements */
--elevated: #3a3530        /* Elevated surfaces */
--border: #2e2b27          /* Borders */
--muted-foreground: #9e968b /* Muted text */
--foreground: #e8e2d9      /* Primary text */

/* Status Colors */
--success: #4ade80         /* Healthy/optimal */
--warning: #fbbf24         /* Warning states */
--critical: #ef4444        /* Critical/danger */
--info: #3b82f6            /* Info states */
```

## CSS Animations (No Library)

### Keyframe Animations
```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale in */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Bounce */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Spin */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Shake */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Shimmer (for data loading) */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Usage */
.element {
  animation: fadeIn 0.3s ease-out;
  animation: slideUp 0.5s ease-out forwards;
  animation: bounce 1s infinite;
}
```

### Staggered Children (Pure CSS)
```css
.stagger-container > * {
  opacity: 0;
  animation: slideUp 0.5s ease-out forwards;
}

.stagger-container > *:nth-child(1) { animation-delay: 0ms; }
.stagger-container > *:nth-child(2) { animation-delay: 100ms; }
.stagger-container > *:nth-child(3) { animation-delay: 200ms; }
.stagger-container > *:nth-child(4) { animation-delay: 300ms; }
.stagger-container > *:nth-child(5) { animation-delay: 400ms; }
```

### Hover Transitions
```css
/* Smooth hover (dark theme) */
.card {
  transition: all 0.3s ease;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.4);
  border-color: hsl(var(--muted-foreground) / 0.3);
}

/* Button press */
.button {
  transition: transform 0.1s ease;
}
.button:active {
  transform: scale(0.95);
}

/* Underline slide */
.link {
  position: relative;
}
.link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: currentColor;
  transition: width 0.3s ease;
}
.link:hover::after {
  width: 100%;
}
```

---

## Framer Motion (React)

### Installation
```bash
npm install framer-motion
```

### Simple Animations
```jsx
import { motion, AnimatePresence } from 'framer-motion';

// Fade in on mount
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>

// Slide up
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
/>

// Hover & Tap
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Click me
</motion.button>
```

### Exit Animations (AnimatePresence)
```jsx
<AnimatePresence>
  {isVisible && (
    <motion.div
      key="modal"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      Modal content
    </motion.div>
  )}
</AnimatePresence>
```

### Staggered Children
```jsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(i => (
    <motion.li key={i.id} variants={item}>
      {i.name}
    </motion.li>
  ))}
</motion.ul>
```

### Spring Physics
```jsx
// Bouncy
transition={{ type: "spring", stiffness: 300, damping: 10 }}

// Smooth
transition={{ type: "spring", stiffness: 100, damping: 20 }}

// Snappy
transition={{ type: "spring", stiffness: 500, damping: 30 }}
```

For page transitions, scroll-triggered animations, drag, layout animations, parallax, and more recipes, see [reference.md](reference.md).

---

## Greenhouse-Specific Animations

### Plant Growth Animation
```jsx
// Simulates plant sprouting and growing
<motion.div
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{
    type: "spring",
    stiffness: 100,
    damping: 15,
    duration: 2
  }}
  className="origin-bottom"
>
  🌱
</motion.div>

// Multi-stage growth
const growthStages = {
  seed: { scale: 0.3, opacity: 0.5 },
  sprout: { scale: 0.6, opacity: 0.8 },
  mature: { scale: 1, opacity: 1 }
};

<motion.div
  variants={growthStages}
  initial="seed"
  animate="mature"
  transition={{ duration: 3, ease: "easeOut" }}
  className="origin-bottom"
/>
```

### Sensor Value Transition
```jsx
// Smooth number counting animation
import { useSpring, animated } from '@react-spring/web';

function SensorValue({ value }) {
  const props = useSpring({
    number: value,
    from: { number: 0 },
    config: { tension: 50, friction: 20 }
  });

  return (
    <animated.span className="text-2xl font-mono text-foreground">
      {props.number.to(n => n.toFixed(1))}
    </animated.span>
  );
}

// Framer Motion variant
<motion.span
  key={value}
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
  className="text-2xl font-mono text-foreground"
>
  {value}
</motion.span>
```

### Status Dot Pulse
```jsx
// Warning pulse
<span className="relative flex h-3 w-3">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75" />
  <span className="relative inline-flex rounded-full h-3 w-3 bg-warning" />
</span>

// Critical pulse (faster)
@keyframes pulseCritical {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.1); }
}

<span
  className="inline-flex h-3 w-3 rounded-full bg-critical"
  style={{ animation: 'pulseCritical 1s ease-in-out infinite' }}
/>

// Status with label
<div className="flex items-center gap-2">
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
  </span>
  <span className="text-sm text-muted-foreground">Optimal</span>
</div>
```

### Weather Particle Drift
```jsx
// Dust storm particle effect
@keyframes dustDrift {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translate(100vw, 50vh) rotate(180deg);
    opacity: 0;
  }
}

<div className="absolute inset-0 pointer-events-none overflow-hidden">
  {[...Array(20)].map((_, i) => (
    <div
      key={i}
      className="absolute w-1 h-1 bg-warning/30 rounded-full"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `dustDrift ${8 + Math.random() * 4}s linear infinite`,
        animationDelay: `${Math.random() * 5}s`
      }}
    />
  ))}
</div>

// Framer Motion variant
<motion.div
  animate={{
    x: ['0vw', '100vw'],
    y: ['0vh', '50vh'],
    rotate: [0, 180],
    opacity: [0, 0.6, 0.3, 0]
  }}
  transition={{
    duration: 10,
    repeat: Infinity,
    ease: "linear",
    times: [0, 0.1, 0.9, 1]
  }}
  className="absolute w-1 h-1 bg-warning/30 rounded-full"
/>
```

### Light Ray Sweep
```jsx
// Ambient greenhouse lighting effect
@keyframes lightSweep {
  0% {
    transform: translateX(-100%) skewX(-20deg);
    opacity: 0;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    transform: translateX(200%) skewX(-20deg);
    opacity: 0;
  }
}

<div className="relative overflow-hidden">
  <div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-success/10 to-transparent"
    style={{ animation: 'lightSweep 8s ease-in-out infinite' }}
  />
  {/* Your content */}
</div>

// Pulsing grow light indicator
@keyframes growLightPulse {
  0%, 100% { opacity: 0.4; filter: brightness(1); }
  50% { opacity: 0.8; filter: brightness(1.3); }
}

<div
  className="h-1 bg-gradient-to-r from-transparent via-success to-transparent"
  style={{ animation: 'growLightPulse 3s ease-in-out infinite' }}
/>
```

---

## Animation Recipes

### Loading Spinner
```jsx
// CSS (dark theme)
<div className="w-8 h-8 border-4 border-secondary border-t-foreground rounded-full animate-spin" />

// Framer Motion
<motion.div
  className="w-8 h-8 border-4 border-secondary border-t-foreground rounded-full"
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
/>
```

### Skeleton Loader
```jsx
// Dark theme skeleton
<div className="animate-pulse space-y-2">
  <div className="h-4 bg-secondary rounded w-3/4" />
  <div className="h-4 bg-secondary rounded w-1/2" />
</div>

// Elevated variant (for cards)
<div className="animate-pulse space-y-3 p-4 bg-card border border-border rounded-lg">
  <div className="h-6 bg-elevated rounded w-1/3" />
  <div className="h-4 bg-elevated rounded w-2/3" />
  <div className="h-4 bg-elevated rounded w-1/2" />
</div>

// Shimmer effect
<div className="relative overflow-hidden bg-secondary rounded h-4">
  <div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent"
    style={{
      backgroundSize: '200% 100%',
      animation: 'shimmer 2s infinite'
    }}
  />
</div>
```

### Notification Badge Ping
```jsx
// Critical alert (dark theme)
<span className="relative flex h-3 w-3">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-critical opacity-75" />
  <span className="relative inline-flex rounded-full h-3 w-3 bg-critical" />
</span>

// Warning badge
<span className="relative flex h-3 w-3">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75" />
  <span className="relative inline-flex rounded-full h-3 w-3 bg-warning" />
</span>
```

### Modal Overlay
```jsx
// Dark theme modal
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed top-1/2 left-1/2 z-50 bg-card border border-border rounded-xl p-6 shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {children}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

---

## Performance Tips

1. **Use `transform` and `opacity`** - These are GPU-accelerated
2. **Avoid animating `width`, `height`, `top`, `left`** - Causes layout thrashing
3. **Use `will-change` sparingly** - Only for complex animations
4. **Prefer CSS transitions for simple hover states**
5. **Use `AnimatePresence mode="wait"`** for sequential page transitions

## Easing Functions Reference

```
linear        - Constant speed
ease          - Slow start/end, fast middle (default)
ease-in       - Slow start
ease-out      - Slow end
ease-in-out   - Slow start and end

/* Framer Motion */
"easeIn" | "easeOut" | "easeInOut"
"circIn" | "circOut" | "circInOut"
"backIn" | "backOut" | "backInOut"
"anticipate"  - Pulls back before moving

/* Custom cubic-bezier */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

---
name: animations
description: Animation patterns for web apps including CSS keyframes, transitions, Framer Motion (React), and common animation recipes. Use when adding animations, transitions, hover effects, loading spinners, skeleton loaders, page transitions, scroll-triggered animations, parallax, or any motion/animation work.
---

# Animations Quick Reference

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
/* Smooth hover */
.card {
  transition: all 0.3s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
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

## Animation Recipes

### Loading Spinner
```jsx
// CSS
<div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />

// Framer Motion
<motion.div
  className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
/>
```

### Skeleton Loader
```jsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
  <div className="h-4 bg-gray-200 rounded w-1/2" />
</div>
```

### Notification Badge Ping
```jsx
<span className="relative flex h-3 w-3">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
</span>
```

### Modal Overlay
```jsx
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        className="fixed inset-0 bg-black/50 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed top-1/2 left-1/2 z-50 bg-white rounded-xl p-6"
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

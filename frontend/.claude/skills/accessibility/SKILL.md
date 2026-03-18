---
name: accessibility
description: Accessibility (a11y) patterns and best practices for web apps. Use when building UI components, forms, modals, dropdowns, tabs, toggles, or any interactive elements. Also use when the user mentions ARIA, screen readers, keyboard navigation, focus management, color contrast, or accessible HTML.
---

# Accessibility (A11y) Quick Reference

## Essential Rules

### 1. Semantic HTML
```html
<!-- BAD -->
<div onclick="handleClick()">Click me</div>
<div class="header">Title</div>

<!-- GOOD -->
<button onclick="handleClick()">Click me</button>
<h1>Title</h1>

<!-- Proper structure -->
<header>
  <nav>...</nav>
</header>
<main>
  <article>
    <h1>Title</h1>
    <section>...</section>
  </article>
  <aside>...</aside>
</main>
<footer>...</footer>
```

### 2. Images - Alt Text
```jsx
// Informative image
<img src="chart.png" alt="Sales increased 40% in Q3" />

// Decorative image (no alt needed)
<img src="decoration.png" alt="" role="presentation" />

// Complex image
<figure>
  <img src="complex-diagram.png" alt="Network architecture diagram" />
  <figcaption>
    Detailed description of the network architecture...
  </figcaption>
</figure>

// Icon buttons need labels
<button aria-label="Close modal">
  <XIcon />
</button>
```

### 3. Form Labels
```jsx
// Always associate labels with inputs
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Or wrap the input
<label>
  Email
  <input type="email" />
</label>

// With error messages
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : undefined}
/>
{error && <span id="email-error" role="alert">{error}</span>}
```

### 4. Focus Management
```css
/* Never remove focus outline without replacement */
/* BAD */
*:focus { outline: none; }

/* GOOD - Custom focus style */
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Skip link for keyboard users */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: 8px 16px;
  background: #000;
  color: #fff;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
<!-- ... navigation ... -->
<main id="main-content" tabindex="-1">...</main>
```

---

## ARIA Attributes

### Roles
```jsx
// Landmark roles (prefer semantic HTML)
<div role="banner">Header content</div>
<div role="navigation">Nav content</div>
<div role="main">Main content</div>
<div role="complementary">Sidebar</div>
<div role="contentinfo">Footer</div>

// Widget roles
<div role="button" tabindex="0">Custom button</div>
<div role="dialog" aria-modal="true">Modal</div>
<ul role="listbox">
  <li role="option">Option 1</li>
</ul>
<div role="alert">Error message</div>
<div role="status">Status update</div>
```

### Common ARIA Attributes
```jsx
// Labeling
aria-label="Close"              // Label when no visible text
aria-labelledby="heading-id"    // Reference another element
aria-describedby="description"  // Additional description

// State
aria-expanded="false"           // Collapsible content
aria-selected="true"            // Selection state
aria-checked="true"             // Checkbox/toggle state
aria-pressed="false"            // Toggle button
aria-disabled="true"            // Disabled state
aria-hidden="true"              // Hide from screen readers
aria-invalid="true"             // Form validation

// Live regions
aria-live="polite"              // Announce changes (wait)
aria-live="assertive"           // Announce immediately
aria-atomic="true"              // Announce entire region

// Relationships
aria-controls="panel-id"        // Element controls another
aria-owns="child-id"            // Parent-child relationship
aria-haspopup="menu"            // Has popup (menu, dialog, etc.)
```

---

For accessible component patterns (modals, dropdowns, tabs, toggles), keyboard navigation, color contrast, live regions, and reduced motion support, see [reference.md](reference.md).

## Quick Checklist

```markdown
- All images have alt text (or alt="" for decorative)
- All form inputs have associated labels
- Focus is visible on all interactive elements
- Color is not the only means of conveying information
- Text has sufficient contrast (4.5:1 minimum)
- Page has logical heading structure (h1 > h2 > h3)
- Interactive elements are keyboard accessible
- Modals trap focus and return focus when closed
- Error messages are associated with inputs
- Page content is in a landmark region
- Skip link available for keyboard users
- No keyboard traps
- Motion can be paused/reduced (prefers-reduced-motion)
```

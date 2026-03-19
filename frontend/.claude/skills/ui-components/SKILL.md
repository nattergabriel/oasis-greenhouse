---
name: ui-components
description: Ready-to-use React UI component implementations for Mars Greenhouse Command Center. Uses shadcn/ui as the primary component library with Tailwind CSS dark theme. Includes reference for shadcn Dialog, DropdownMenu, Tabs, and custom patterns like PillTabs for metric selectors and toast notifications.
---

# UI Components Quick Reference

> **Note:** This project uses shadcn/ui as the primary component library. Prefer shadcn components over custom implementations. Import from `@/components/ui/`.

## Modal / Dialog

**Use shadcn Dialog component instead of custom implementations.**

```jsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function MyDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button>Open Dialog</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            Dialog description or content goes here.
          </DialogDescription>
        </DialogHeader>
        {/* Additional dialog content */}
      </DialogContent>
    </Dialog>
  )
}
```

For controlled dialogs:
```jsx
const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    {/* ... */}
  </DialogContent>
</Dialog>
```

---

## Dropdown / Select

**Use shadcn DropdownMenu component instead of custom implementations.**

```jsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function MyDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button>Open Menu</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => console.log('Item 1')}>
          Item 1
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => console.log('Item 2')}>
          Item 2
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## Tabs

**Use shadcn Tabs component instead of custom implementations.**

```jsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function MyTabs() {
  return (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        Content for Tab 1
      </TabsContent>
      <TabsContent value="tab2">
        Content for Tab 2
      </TabsContent>
      <TabsContent value="tab3">
        Content for Tab 3
      </TabsContent>
    </Tabs>
  )
}
```

### Pill Tabs (Custom Pattern)

For metric selectors or compact toggle groups (e.g., switching between temperature units, time ranges):

```jsx
function PillTabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-secondary rounded-lg">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            value === tab.id
              ? 'bg-card border border-border text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// Usage:
<PillTabs
  tabs={[
    { id: 'celsius', label: '°C' },
    { id: 'fahrenheit', label: '°F' },
  ]}
  value={tempUnit}
  onChange={setTempUnit}
/>
```

---

## Toast / Notifications

Custom toast implementation using dark Mars theme:

```jsx
const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const toast = {
    info: (msg) => addToast(msg, 'info'),
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
  };

  const colors = {
    info: 'bg-primary border-primary',
    success: 'bg-green-600 border-green-600',
    error: 'bg-red-600 border-red-600',
    warning: 'bg-yellow-600 border-yellow-600',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${colors[t.type]} text-white px-4 py-3 rounded-lg border`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
```

---

## Dark Mars Theme Color Reference

Use these Tailwind classes for consistent dark theme styling:

| Purpose | Class |
|---------|-------|
| Card/panel background | `bg-card` |
| Secondary background | `bg-secondary` |
| Body text | `text-foreground` |
| Muted/secondary text | `text-muted-foreground` |
| Borders | `border-border` |
| Primary accent | `text-primary` or `bg-primary` |
| Hover state | `hover:bg-secondary` |

**Important:** Avoid light theme classes:
- ~~bg-white~~ → `bg-card`
- ~~bg-gray-100~~ → `bg-secondary`
- ~~text-gray-500~~ → `text-muted-foreground`
- ~~text-gray-900~~ → `text-foreground`
- ~~border-gray-200~~ → `border-border`
- ~~shadow-lg~~ → use borders instead: `border border-border`

---

## Component Examples

### Card with Dark Theme
```jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card className="border border-border">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground">Card content goes here</p>
  </CardContent>
</Card>
```

### Button Variants
```jsx
import { Button } from "@/components/ui/button"

<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
```

### Badge
```jsx
import { Badge } from "@/components/ui/badge"

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Alert</Badge>
```

---

For additional components (tooltip, scroll-area, separator), refer to shadcn/ui documentation or check installed components in `/components/ui/`.

---
name: react-patterns
description: React hooks, component patterns, and best practices. Use when writing React components, using hooks (useState, useEffect, useRef, useMemo, useCallback, useReducer), creating custom hooks, implementing context/global state, compound components, render props, HOCs, or handling events and list rendering.
---

# React Patterns Quick Reference

## Essential Hooks

### useState - State Management
```jsx
const [value, setValue] = useState(initialValue);
const [items, setItems] = useState([]);
const [form, setForm] = useState({ name: '', email: '' });

// Update object state (preserve other fields)
setForm(prev => ({ ...prev, name: 'New Name' }));

// Update array state
setItems(prev => [...prev, newItem]);           // Add
setItems(prev => prev.filter(i => i.id !== id)); // Remove
setItems(prev => prev.map(i => i.id === id ? {...i, done: true} : i)); // Update
```

### useEffect - Side Effects
```jsx
// Run once on mount
useEffect(() => { fetchData(); }, []);

// Run when dependency changes
useEffect(() => { fetchUser(userId); }, [userId]);

// Cleanup (subscriptions, timers)
useEffect(() => {
  const timer = setInterval(() => tick(), 1000);
  return () => clearInterval(timer);
}, []);
```

### useRef - DOM & Mutable Values
```jsx
const inputRef = useRef(null);
const countRef = useRef(0); // Mutable value, no re-render

inputRef.current?.focus();
<input ref={inputRef} />
```

### useMemo & useCallback - Performance
```jsx
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.price - b.price);
}, [items]);

const handleClick = useCallback((id) => {
  setSelected(id);
}, []);
```

### useReducer - Complex State
```jsx
const reducer = (state, action) => {
  switch (action.type) {
    case 'INCREMENT': return { ...state, count: state.count + 1 };
    case 'SET_NAME': return { ...state, name: action.payload };
    case 'RESET': return initialState;
    default: return state;
  }
};

const [state, dispatch] = useReducer(reducer, { count: 0, name: '' });
dispatch({ type: 'INCREMENT' });
dispatch({ type: 'SET_NAME', payload: 'Alice' });
```

---

## Custom Hooks

### useLocalStorage
```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
```

### useDebounce
```jsx
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### useToggle
```jsx
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle, setValue];
}
```

### useClickOutside
```jsx
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}
```

---

## Component Patterns

### Compound Components
```jsx
const TabsContext = createContext();

const Tabs = ({ children, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
};

Tabs.List = ({ children }) => <div className="tab-list">{children}</div>;

Tabs.Tab = ({ id, children }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  return (
    <button className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>
      {children}
    </button>
  );
};

Tabs.Panel = ({ id, children }) => {
  const { activeTab } = useContext(TabsContext);
  return activeTab === id ? <div>{children}</div> : null;
};

// Usage
<Tabs defaultTab="tab1">
  <Tabs.List>
    <Tabs.Tab id="tab1">First</Tabs.Tab>
    <Tabs.Tab id="tab2">Second</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="tab1">Content 1</Tabs.Panel>
  <Tabs.Panel id="tab2">Content 2</Tabs.Panel>
</Tabs>
```

### Context Pattern (Global State)
```jsx
const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');

  const value = {
    user, setUser,
    theme, setTheme,
    isLoggedIn: !!user,
    logout: () => setUser(null),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
```

### Higher-Order Components (HOC)
```jsx
function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { user, loading } = useAuth();
    if (loading) return <Spinner />;
    if (!user) return <Navigate to="/login" />;
    return <Component {...props} user={user} />;
  };
}
```

---

## List Rendering & Event Handling

```jsx
// Basic with key
{items.map(item => <Card key={item.id} {...item} />)}

// Grouped lists
{Object.entries(groupedItems).map(([category, items]) => (
  <div key={category}>
    <h3>{category}</h3>
    {items.map(item => <Card key={item.id} {...item} />)}
  </div>
))}

// Pass data to handler
<button onClick={() => handleClick(item.id)}>Click</button>

// Event delegation
const handleListClick = (e) => {
  const itemId = e.target.closest('[data-id]')?.dataset.id;
  if (itemId) selectItem(itemId);
};
<ul onClick={handleListClick}>...</ul>
```

---

## Loading & Error States

```jsx
function DataComponent() {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    fetchData()
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: null, loading: false, error }));
  }, []);

  if (state.loading) return <Skeleton />;
  if (state.error) return <ErrorMessage error={state.error} />;
  if (!state.data) return <EmptyState />;

  return <DataDisplay data={state.data} />;
}
```

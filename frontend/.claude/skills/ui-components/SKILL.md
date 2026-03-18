---
name: ui-components
description: Ready-to-use React UI component implementations including modals, dropdowns, tabs, accordions, toasts, tooltips, sidebars, search autocomplete, avatar groups, badges, empty states, and confirmation dialogs. Use when building common UI components or need copy-paste-ready component code for React with Tailwind CSS.
---

# UI Components Quick Reference

## Modal / Dialog

```jsx
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            ✕
          </button>
          {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
          {children}
        </div>
      </div>
    </div>
  );
}
```

### Modal with Portal
```jsx
import { createPortal } from 'react-dom';

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6">
        {children}
      </div>
    </div>,
    document.body
  );
}
```

---

## Dropdown / Select

```jsx
function Dropdown({ trigger, items, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>{trigger}</button>
      {isOpen && (
        <div className="absolute top-full mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { onSelect(item); setIsOpen(false); }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Tabs

```jsx
function Tabs({ tabs, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].id);
  const activeContent = tabs.find(t => t.id === activeTab)?.content;

  return (
    <div>
      <div className="flex border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4">{activeContent}</div>
    </div>
  );
}
```

### Pill Tabs
```jsx
function PillTabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            value === tab.id
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

---

## Toast / Notifications

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
    info: 'bg-blue-500', success: 'bg-green-500',
    error: 'bg-red-500', warning: 'bg-yellow-500',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`${colors[t.type]} text-white px-4 py-3 rounded-lg shadow-lg`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
```

For accordion, tooltip, sidebar/drawer, search autocomplete, avatar group, badge, empty state, and confirmation dialog, see [reference.md](reference.md).

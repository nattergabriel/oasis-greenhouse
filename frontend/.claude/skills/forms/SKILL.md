---
name: forms
description: Form handling patterns for React apps including controlled/uncontrolled inputs, validation, common input components, file uploads, drag-and-drop, multi-step forms, and submission patterns. Use when building forms, handling user input, implementing validation, creating file upload UIs, or working with form state.
---

# Forms Quick Reference

## Basic Form Handling

### Controlled Inputs
```jsx
function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />
      <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" />
      <textarea name="message" value={form.message} onChange={handleChange} placeholder="Message" />
      <button type="submit">Send</button>
    </form>
  );
}
```

### FormData API (Native)
```jsx
const handleSubmit = (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  console.log(data);
};
```

---

## Input Types Reference

```jsx
// Text inputs
<input type="text" />
<input type="email" />
<input type="password" />
<input type="tel" />
<input type="url" />
<input type="search" />

// Number inputs
<input type="number" min="0" max="100" step="1" />
<input type="range" min="0" max="100" />

// Date/Time
<input type="date" />
<input type="time" />
<input type="datetime-local" />

// Selection
<input type="checkbox" />
<input type="radio" name="group" />

// Files
<input type="file" accept="image/*" />
<input type="file" multiple accept=".pdf,.doc" />

// Other
<input type="color" />
<input type="hidden" name="csrf" value="token" />
```

---

## Custom Validation Hook

```jsx
function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    if (validate) setErrors(validate(values));
  };

  const handleSubmit = (onSubmit) => async (e) => {
    e.preventDefault();
    const validationErrors = validate ? validate(values) : {};
    setErrors(validationErrors);
    setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      await onSubmit(values);
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values, errors, touched, isSubmitting,
    handleChange, handleBlur, handleSubmit, reset
  };
}

// Example validator
const validateLogin = (values) => {
  const errors = {};
  if (!values.email) errors.email = 'Email is required';
  else if (!/\S+@\S+\.\S+/.test(values.email)) errors.email = 'Invalid email format';
  if (!values.password) errors.password = 'Password is required';
  else if (values.password.length < 8) errors.password = 'Password must be at least 8 characters';
  return errors;
};
```

---

## Common Input Components

### Text Input with Label & Error
```jsx
function Input({ label, error, ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</label>
      )}
      <input
        className={`w-full px-4 py-2 bg-secondary border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring
          ${error ? 'border-destructive' : 'border-input'}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
```

### Select Dropdown
```jsx
function Select({ label, options, error, ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</label>
      )}
      <select
        className={`w-full px-4 py-2 bg-secondary border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring
          ${error ? 'border-destructive' : 'border-input'}`}
        {...props}
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
```

### Toggle Switch
```jsx
function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-11 h-6 bg-border rounded-full peer-checked:bg-primary transition-colors" />
        <div className="absolute left-1 top-1 w-4 h-4 bg-foreground rounded-full transition-transform peer-checked:translate-x-5" />
      </div>
      {label && <span className="text-sm text-foreground">{label}</span>}
    </label>
  );
}
```

For checkbox, radio group, textarea with character count, file upload (basic and drag-and-drop), multi-step forms, and submission patterns, see [reference.md](reference.md).

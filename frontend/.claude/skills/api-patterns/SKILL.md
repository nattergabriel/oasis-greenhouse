---
name: api-patterns
description: API integration patterns for React and JavaScript apps. Use when making HTTP requests, building API clients, implementing data fetching hooks, handling loading/error states, pagination, infinite scroll, caching, optimistic updates, file uploads, WebSockets, SSE, polling, or authentication flows.
---

# API Patterns Quick Reference

## Fetch API Basics

### GET Request
```jsx
const fetchData = async () => {
  try {
    const response = await fetch('https://api.example.com/data');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};
```

### POST Request
```jsx
const createItem = async (data) => {
  const response = await fetch('https://api.example.com/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};
```

### PUT / PATCH / DELETE
```jsx
// PUT - Replace entire resource
const updateItem = async (id, data) => {
  const response = await fetch(`/api/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

// PATCH - Partial update
const patchItem = async (id, updates) => {
  const response = await fetch(`/api/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return response.json();
};

// DELETE
const deleteItem = async (id) => {
  const response = await fetch(`/api/items/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Delete failed');
  return true;
};
```

### Query Parameters
```jsx
const fetchWithParams = async (filters) => {
  const params = new URLSearchParams({
    page: filters.page,
    limit: filters.limit,
    search: filters.search,
    sort: filters.sort,
  });

  const response = await fetch(`/api/items?${params}`);
  return response.json();
};
```

---

## React Data Fetching Hooks

### Basic Fetch Hook
```jsx
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('Request failed');
        const json = await response.json();
        setData(json);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}

// Usage
function UserList() {
  const { data: users, loading, error } = useFetch('/api/users');

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

### Fetch with Refetch & Mutation
```jsx
function useAPI(url) {
  const [state, setState] = useState({
    data: null, loading: true, error: null,
  });

  const fetchData = useCallback(async () => {
    try {
      setState(s => ({ ...s, loading: true }));
      const response = await fetch(url);
      const data = await response.json();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error.message });
    }
  }, [url]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const mutate = useCallback(async (method, body) => {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setState(s => ({ ...s, data }));
    return data;
  }, [url]);

  return { ...state, refetch: fetchData, mutate };
}
```

---

## Loading & Error States

### Component Pattern
```jsx
function DataLoader({ loading, error, data, children }) {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;
  return children(data);
}

<DataLoader loading={loading} error={error} data={users}>
  {(users) => (
    <ul>
      {users.map(user => <UserCard key={user.id} user={user} />)}
    </ul>
  )}
</DataLoader>
```

### Error Boundary
```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
          <p className="text-gray-600 mt-2">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## API Service Layer

### Base API Class
```jsx
const BASE_URL = process.env.REACT_APP_API_URL || '/api';

class APIClient {
  constructor(baseURL = BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  get(endpoint, params) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`${endpoint}${query}`);
  }

  post(endpoint, data) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) });
  }

  put(endpoint, data) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new APIClient();
```

For infinite scroll, pagination, caching, optimistic updates, real-time data (polling, WebSocket, SSE), file uploads, and auth patterns, see [reference.md](reference.md).

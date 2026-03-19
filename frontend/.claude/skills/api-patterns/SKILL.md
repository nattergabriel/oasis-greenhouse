---
name: api-patterns
description: Mock-first API pattern with centralized client for Mars Greenhouse Command Center. Shows namespaced API object, mock-to-real switching, data fetching hooks, loading/error states, and simulation polling. No auth needed (single-operator system).
---

# API Patterns for Mars Greenhouse Command Center

## Core Principles

- **Mock-first development**: Start with mock data, swap to real API when backend is ready
- **Centralized client**: Single `api.ts` file maps 1:1 to contract endpoints
- **No authentication**: Single-operator system (no tokens/auth needed)
- **Base URL**: `http://localhost:<PORT>/api`
- **JSON everywhere**: All request/response bodies are JSON
- **Standard status codes**: 200, 201, 400, 404, 500, etc.
- **ISO 8601 timestamps**: All dates/times use ISO 8601 format
- **UUID identifiers**: All IDs are UUIDs

---

## Centralized API Client (`src/lib/api.ts`)

### Mock-to-Real Switching Pattern
```typescript
// Feature flag to toggle between mock and real API
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Helper for real API calls
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}
```

### API Object Structure
```typescript
export const api = {
  greenhouses: {
    list: async () => {
      if (USE_MOCK_DATA) return mockData.greenhouses;
      return fetchAPI<Greenhouse[]>('/greenhouses');
    },

    get: async (id: string) => {
      if (USE_MOCK_DATA) {
        return mockData.greenhouses.find(g => g.id === id) || null;
      }
      return fetchAPI<Greenhouse>(`/greenhouses/${id}`);
    },

    create: async (body: CreateGreenhouseRequest) => {
      if (USE_MOCK_DATA) {
        const newGreenhouse = { id: crypto.randomUUID(), ...body };
        mockData.greenhouses.push(newGreenhouse);
        return newGreenhouse;
      }
      return fetchAPI<Greenhouse>('/greenhouses', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },

    sensorsLatest: async (id: string) => {
      if (USE_MOCK_DATA) return mockData.sensorReadings;
      return fetchAPI<SensorReading[]>(`/greenhouses/${id}/sensors/latest`);
    },

    sensorsHistory: async (id: string, params: { start: string; end: string; interval?: string }) => {
      if (USE_MOCK_DATA) return mockData.sensorHistory;
      const query = new URLSearchParams(params as any);
      return fetchAPI<SensorReading[]>(`/greenhouses/${id}/sensors/history?${query}`);
    },
  },

  slots: {
    get: async (slotId: string) => {
      if (USE_MOCK_DATA) return mockData.slots.find(s => s.id === slotId);
      return fetchAPI<Slot>(`/slots/${slotId}`);
    },

    update: async (slotId: string, body: UpdateSlotRequest) => {
      if (USE_MOCK_DATA) {
        const slot = mockData.slots.find(s => s.id === slotId);
        if (slot) Object.assign(slot, body);
        return slot;
      }
      return fetchAPI<Slot>(`/slots/${slotId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    },

    history: async (slotId: string) => {
      if (USE_MOCK_DATA) return mockData.slotHistory;
      return fetchAPI<SlotHistory[]>(`/slots/${slotId}/history`);
    },
  },

  weather: {
    current: async () => {
      if (USE_MOCK_DATA) return mockData.weather;
      return fetchAPI<WeatherData>('/weather/current');
    },
  },

  agent: {
    log: async (params?: { limit?: number; offset?: number }) => {
      if (USE_MOCK_DATA) return mockData.agentLog;
      const query = params ? `?${new URLSearchParams(params as any)}` : '';
      return fetchAPI<AgentLog>(`/agent/log${query}`);
    },

    recommendations: async () => {
      if (USE_MOCK_DATA) return mockData.recommendations;
      return fetchAPI<Recommendation[]>('/agent/recommendations');
    },

    approveRecommendation: async (id: string) => {
      if (USE_MOCK_DATA) {
        const rec = mockData.recommendations.find(r => r.id === id);
        if (rec) rec.status = 'approved';
        return rec;
      }
      return fetchAPI<Recommendation>(`/agent/recommendations/${id}/approve`, {
        method: 'POST',
      });
    },

    dismissRecommendation: async (id: string, reason?: string) => {
      if (USE_MOCK_DATA) {
        const rec = mockData.recommendations.find(r => r.id === id);
        if (rec) rec.status = 'dismissed';
        return rec;
      }
      return fetchAPI<Recommendation>(`/agent/recommendations/${id}/dismiss`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },

    config: async () => {
      if (USE_MOCK_DATA) return mockData.agentConfig;
      return fetchAPI<AgentConfig>('/agent/config');
    },

    updateConfig: async (body: UpdateAgentConfigRequest) => {
      if (USE_MOCK_DATA) {
        Object.assign(mockData.agentConfig, body);
        return mockData.agentConfig;
      }
      return fetchAPI<AgentConfig>('/agent/config', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    },
  },

  simulations: {
    list: async () => {
      if (USE_MOCK_DATA) return mockData.simulations;
      return fetchAPI<Simulation[]>('/simulations');
    },

    create: async (body: CreateSimulationRequest) => {
      if (USE_MOCK_DATA) {
        const newSim = {
          id: crypto.randomUUID(),
          status: 'running',
          createdAt: new Date().toISOString(),
          ...body,
        };
        mockData.simulations.push(newSim);
        return newSim;
      }
      return fetchAPI<Simulation>('/simulations', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },

    get: async (id: string) => {
      if (USE_MOCK_DATA) {
        return mockData.simulations.find(s => s.id === id);
      }
      return fetchAPI<Simulation>(`/simulations/${id}`);
    },

    pause: async (id: string) => {
      if (USE_MOCK_DATA) {
        const sim = mockData.simulations.find(s => s.id === id);
        if (sim) sim.status = 'paused';
        return sim;
      }
      return fetchAPI<Simulation>(`/simulations/${id}/pause`, { method: 'POST' });
    },

    resume: async (id: string) => {
      if (USE_MOCK_DATA) {
        const sim = mockData.simulations.find(s => s.id === id);
        if (sim) sim.status = 'running';
        return sim;
      }
      return fetchAPI<Simulation>(`/simulations/${id}/resume`, { method: 'POST' });
    },

    stop: async (id: string) => {
      if (USE_MOCK_DATA) {
        const sim = mockData.simulations.find(s => s.id === id);
        if (sim) sim.status = 'stopped';
        return sim;
      }
      return fetchAPI<Simulation>(`/simulations/${id}/stop`, { method: 'POST' });
    },
  },
};
```

---

## React Hooks for API Calls

### Basic Data Fetching Hook
```typescript
function useAPIData<T>(
  fetcher: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetcher();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, dependencies);

  return { data, loading, error };
}

// Usage
function GreenhouseList() {
  const { data: greenhouses, loading, error } = useAPIData(
    () => api.greenhouses.list(),
    []
  );

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading greenhouses...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-destructive">Error: {error}</div>;
  }

  return (
    <div className="space-y-2">
      {greenhouses?.map(gh => (
        <GreenhouseCard key={gh.id} greenhouse={gh} />
      ))}
    </div>
  );
}
```

### Hook with Refetch
```typescript
function useAPIDataWithRefetch<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Usage
function AgentRecommendations() {
  const { data: recommendations, loading, error, refetch } = useAPIDataWithRefetch(
    () => api.agent.recommendations()
  );

  const handleApprove = async (id: string) => {
    await api.agent.approveRecommendation(id);
    refetch(); // Refresh list after approval
  };

  // ... render logic
}
```

---

## Simulation Polling Pattern

```typescript
function useSimulationPolling(simulationId: string | null, intervalMs = 2000) {
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!simulationId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const data = await api.simulations.get(simulationId);
        if (!cancelled) {
          setSimulation(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Polling failed');
        }
      }
    };

    // Initial fetch
    setLoading(true);
    poll().finally(() => setLoading(false));

    // Poll only if simulation is still active
    const shouldPoll = () => {
      return simulation?.status === 'running' || simulation?.status === 'paused';
    };

    const interval = setInterval(() => {
      if (shouldPoll()) {
        poll();
      }
    }, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [simulationId, intervalMs, simulation?.status]);

  return { simulation, loading, error };
}

// Usage
function SimulationMonitor({ simulationId }: { simulationId: string }) {
  const { simulation, loading } = useSimulationPolling(simulationId, 3000);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Status</span>
        <span className="font-mono text-sm">{simulation?.status || 'unknown'}</span>
      </div>
      {simulation?.status === 'running' && (
        <div className="mt-2 text-xs text-muted-foreground">
          Polling every 3 seconds...
        </div>
      )}
    </div>
  );
}
```

---

## Loading & Error States

### Inline Pattern (Dark Theme)
```tsx
function DataView({ data, loading, error, children }: any) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-card p-4 text-destructive">
        <p className="font-semibold">Error loading data</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-dashed bg-card p-8 text-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return children(data);
}
```

### Skeleton Loading Pattern
```tsx
function GreenhouseSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-lg border bg-card p-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function GreenhouseList() {
  const { data, loading, error } = useAPIData(() => api.greenhouses.list());

  if (loading) return <GreenhouseSkeleton />;
  if (error) return <ErrorAlert message={error} />;

  return <div>{/* render greenhouses */}</div>;
}
```

---

## Environment Variables

```bash
# .env.local
VITE_USE_MOCK_DATA=true           # Set to 'false' to use real API
VITE_API_BASE_URL=http://localhost:3000/api
```

Toggle between mock and real API by changing `VITE_USE_MOCK_DATA` without modifying code.

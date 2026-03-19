import type {
  GreenhouseSummary,
  GreenhouseDetail,
  PlantSlot,
  SensorSnapshot,
  SensorHistoryReading,
  MarsWeather,
  AgentLogEntry,
  Recommendation,
  AgentConfig,
  Alert,
  Crop,
  PlantingQueueItem,
  HarvestEntry,
  StockpileItem,
  StoredFood,
  DailyNutritionEntry,
  CoverageHeatmap,
  ResourceProjection,
  MissionTimeline,
  SimulationSummary,
  SimulationDetail,
  Scenario,
  AgentPerformance,
  OnboardingStatus,
  ScenarioInjection,
  TimelineEvent,
  SlotHistorySnapshot,
  SimulationStatus,
} from "./types";

import { useState, useEffect } from "react";

// Static export: calls API Gateway directly with X-API-Key header
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Hook: returns fallback immediately, swaps to real data when API responds.
// Pass skip=true to defer the fetch (e.g. waiting for a valid ID).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useApi<T>(fetcher: () => Promise<T>, fallback: T, deps: any[] = [], skip = false): T {
  const [data, setData] = useState<T>(fallback);
  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    fetcher()
      .then((result) => { if (!cancelled) setData(result); })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, skip]);
  return data;
}

// Like useApi but also exposes a loading flag so callers can
// distinguish "still fetching" from "fetched but empty."
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useApiState<T>(fetcher: () => Promise<T>, fallback: T, deps: any[] = [], skip = false): { data: T; loading: boolean } {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(!skip);
  useEffect(() => {
    if (skip) { setLoading(false); return; }
    setLoading(true);
    let cancelled = false;
    fetcher()
      .then((result) => { if (!cancelled) { setData(result); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, skip]);
  return { data, loading };
}

// --- HTTP helpers ---

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { ...extra };
  if (API_KEY) h["X-API-Key"] = API_KEY;
  return h;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v != null) as [string, string | number][];
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}

async function get<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function post<T>(endpoint: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function put<T>(endpoint: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function patchReq<T>(endpoint: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function del<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function delVoid(endpoint: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${endpoint}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
}

// === API Client ===

export const api = {
  greenhouses: {
    list: (): Promise<{ greenhouses: GreenhouseSummary[] }> => get("/api/greenhouses"),
    get: (id: string, slotStatus?: string): Promise<GreenhouseDetail> => get(`/api/greenhouses/${id}${qs({ slotStatus })}`),
    create: (body: { name: string; description?: string; rows: number; cols: number }) => post<{ id: string; name: string; description: string | null; rows: number; cols: number; totalSlots: number; createdAt: string }>("/api/greenhouses", body),
    update: (id: string, body: { name?: string; description?: string; rows?: number; cols?: number }) => put<{ id: string; name: string; description: string | null; rows: number; cols: number; totalSlots: number; overallStatus: string; createdAt: string }>(`/api/greenhouses/${id}`, body),
    delete: (id: string): Promise<void> => delVoid(`/api/greenhouses/${id}`),
    sensorsLatest: (id: string): Promise<SensorSnapshot> => get(`/api/greenhouses/${id}/sensors/latest`),
    sensorsHistory: (id: string, params: { from: string; to: string; interval: string }): Promise<{ from: string; to: string; interval: string; readings: SensorHistoryReading[] }> => get(`/api/greenhouses/${id}/sensors/history${qs(params)}`),
  },

  slots: {
    get: (greenhouseId: string, slotId: string): Promise<PlantSlot> => get(`/api/greenhouses/${greenhouseId}/slots/${slotId}`),
    update: (greenhouseId: string, slotId: string, body: { cropId?: string; plantedAt?: string; growthStagePercent?: number; activeStressTypes?: string[]; estimatedYieldKg?: number }): Promise<PlantSlot> => patchReq(`/api/greenhouses/${greenhouseId}/slots/${slotId}`, body),
    history: (greenhouseId: string, slotId: string, params?: { from?: string; to?: string; interval?: string }): Promise<{ slotId: string; cropId: string | null; cropName: string | null; from: string; to: string; interval: string; snapshots: SlotHistorySnapshot[] }> => get(`/api/greenhouses/${greenhouseId}/slots/${slotId}/history${qs({ from: params?.from, to: params?.to, interval: params?.interval })}`),
  },

  weather: {
    current: (): Promise<MarsWeather> => get("/api/weather/current"),
  },

  agent: {
    log: (params?: { page?: number; pageSize?: number; simulationId?: string }): Promise<{ total: number; page: number; pageSize: number; entries: AgentLogEntry[] }> => get(`/api/agent/log${qs({ page: params?.page, pageSize: params?.pageSize, simulationId: params?.simulationId })}`),
    recommendations: (params?: { status?: string; page?: number; pageSize?: number }): Promise<{ total: number; page: number; pageSize: number; recommendations: Recommendation[] }> => get(`/api/agent/recommendations${qs({ status: params?.status, page: params?.page, pageSize: params?.pageSize })}`),
    approveRecommendation: (id: string) => post<{ id: string; status: string; executedAt: string }>(`/api/agent/recommendations/${id}/approve`),
    dismissRecommendation: (id: string, reason?: string) => post<{ id: string; status: string }>(`/api/agent/recommendations/${id}/dismiss`, { reason }),
    config: (): Promise<AgentConfig> => get("/api/agent/config"),
    updateConfig: (body: AgentConfig): Promise<AgentConfig> => put("/api/agent/config", body),
  },

  alerts: {
    list: (params?: { status?: string; page?: number; pageSize?: number }): Promise<{ total: number; page: number; pageSize: number; alerts: Alert[] }> => get(`/api/alerts${qs({ status: params?.status, page: params?.page, pageSize: params?.pageSize })}`),
    get: (id: string): Promise<Alert> => get(`/api/alerts/${id}`),
    acknowledge: (id: string, body?: { operatorNote?: string }) => post<{ id: string; status: string }>(`/api/alerts/${id}/acknowledge`, body ?? {}),
    resolve: (id: string, resolution: string) => post<{ id: string; status: string; resolvedAt: string }>(`/api/alerts/${id}/resolve`, { resolution }),
  },

  crops: {
    list: (): Promise<{ crops: Crop[] }> => get("/api/crops"),
    plantingQueue: (greenhouseId?: string): Promise<{ queue: PlantingQueueItem[] }> => get(`/api/crops/planting-queue${qs({ greenhouseId })}`),
    harvestJournal: (params?: { page?: number; pageSize?: number; greenhouseId?: string; cropId?: string }): Promise<{ total: number; page: number; pageSize: number; harvests: HarvestEntry[] }> => get(`/api/crops/harvest-journal${qs({ page: params?.page, pageSize: params?.pageSize, greenhouseId: params?.greenhouseId, cropId: params?.cropId })}`),
    logHarvest: (body: { cropId: string; slotId: string; yieldKg: number; harvestedAt: string; notes?: string }): Promise<HarvestEntry> => post("/api/crops/harvest-journal", body),
    updateHarvest: (id: string, body: { yieldKg?: number; notes?: string }): Promise<HarvestEntry> => patchReq(`/api/crops/harvest-journal/${id}`, body),
    stockpile: (): Promise<{ updatedAt: string; items: StockpileItem[]; totalEstimatedCalories: number; totalDaysOfSupply: number }> => get("/api/crops/stockpile"),
  },

  nutrition: {
    consumption: (from: string, to: string): Promise<{ from: string; to: string; crewSize: number; dailyEntries: DailyNutritionEntry[] }> => get(`/api/nutrition/consumption${qs({ from, to })}`),
    logConsumption: (body: { date: string; cropId: string; quantityKg: number }) => post<{ id: string; caloriesLogged: number }>("/api/nutrition/consumption", body),
    coverageHeatmap: (params?: { fromDay?: number; toDay?: number }): Promise<CoverageHeatmap> => get(`/api/nutrition/coverage-heatmap${qs({ fromDay: params?.fromDay, toDay: params?.toDay })}`),
    storedFood: (): Promise<StoredFood> => get("/api/nutrition/stored-food"),
  },

  forecast: {
    resources: (days?: number): Promise<{ generatedAt: string; forecastDays: number; projections: ResourceProjection[] }> => get(`/api/forecast/resources${qs({ days })}`),
    missionTimeline: (): Promise<MissionTimeline> => get("/api/forecast/mission-timeline"),
    setMissionDates: (body: { missionStartDate: string; missionEndDate: string }) => put<{ missionStartDate: string; missionEndDate: string; totalMissionDays: number }>("/api/forecast/mission-timeline", body),
  },

  simulations: {
    list: (): Promise<{ simulations: SimulationSummary[] }> => get("/api/simulations"),
    get: (id: string): Promise<SimulationDetail> => get(`/api/simulations/${id}`),
    create: (body: { name: string; learningGoal: string; missionDuration: number; crewSize: number; yieldTarget: number; resourceAvailability: { waterLiters: number; nutrientKg: number; energyKwh: number }; agentConfig: AgentConfig }) => post<{ id: string; status: SimulationStatus; createdAt: string }>("/api/simulations", body),
    update: (id: string, body: { name?: string; learningGoal?: string }) => patchReq<{ id: string; name: string; learningGoal: string }>(`/api/simulations/${id}`, body),
    pause: (id: string) => post<{ id: string; status: SimulationStatus }>(`/api/simulations/${id}/pause`),
    resume: (id: string) => post<{ id: string; status: SimulationStatus }>(`/api/simulations/${id}/resume`),
    stop: (id: string) => post<{ id: string; status: SimulationStatus; completedAt: string; outcomeScore: number }>(`/api/simulations/${id}/stop`),
    timeline: (id: string, params?: { from?: string; to?: string; types?: string; page?: number; pageSize?: number }): Promise<{ simulationId: string; total: number; page: number; pageSize: number; events: TimelineEvent[] }> => get(`/api/simulations/${id}/timeline${qs({ from: params?.from, to: params?.to, types: params?.types, page: params?.page, pageSize: params?.pageSize })}`),
    injections: {
      list: (simId: string): Promise<{ injections: ScenarioInjection[] }> => get(`/api/simulations/${simId}/injections`),
      inject: (simId: string, body: { scenarioId: string; intensity: number; durationMinutes?: number }) => post<{ id: string; scenarioId: string; triggeredAt: string; estimatedResolutionAt: string | null; status: string }>(`/api/simulations/${simId}/injections`, body),
      cancel: (simId: string, injectionId: string) => post<{ id: string; status: string; resolvedAt: string }>(`/api/simulations/${simId}/injections/${injectionId}/cancel`),
    },
  },

  scenarios: {
    list: (): Promise<{ scenarios: Scenario[] }> => get("/api/scenarios"),
  },

  analytics: {
    agentPerformance: (simulationId?: string): Promise<AgentPerformance> => get(`/api/analytics/agent-performance${qs({ simulationId })}`),
  },

  onboarding: {
    status: (): Promise<OnboardingStatus> => get("/api/onboarding/status"),
    complete: () => post<{ completed: boolean; completedAt: string }>("/api/onboarding/complete"),
    completeStep: (stepKey: string) => post<{ stepKey: string; completedSteps: string[]; allCompleted: boolean }>(`/api/onboarding/steps/${stepKey}/complete`),
    reset: (): Promise<void> => delVoid("/api/onboarding/status"),
  },

  admin: {
    seedAll: () => post<Record<string, string>>("/api/admin/seed/all"),
    seedGreenhouse: () => post<Record<string, string>>("/api/admin/seed/greenhouse"),
    seedCrops: () => post<Record<string, string>>("/api/admin/seed/crops"),
    seedMissionConfig: () => post<Record<string, string>>("/api/admin/seed/mission-config"),
    clearAll: () => del<Record<string, string>>("/api/admin/seed/clear"),
  },
};

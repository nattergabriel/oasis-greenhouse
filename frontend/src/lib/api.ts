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
import {
  mockGreenhouses,
  mockGreenhouseDetails,
  mockSensorSnapshot,
  mockSensorHistory,
  mockWeather,
  mockAgentLog,
  mockRecommendations,
  mockAgentConfig,
  mockAlerts,
  mockCrops,
  mockPlantingQueue,
  mockHarvestJournal,
  mockStockpile,
  mockStoredFood,
  mockNutritionEntries,
  mockCoverageHeatmap,
  mockResourceForecast,
  mockMissionTimeline,
  mockSimulations,
  mockSimulationDetail,
  mockScenarios,
  mockAgentPerformance,
  mockSlotHistory,
  mockTimelineEvents,
  mockInjections,
} from "./mock-data";

import { useState, useEffect, useRef } from "react";

// Toggle this to switch between mock and real API
const USE_MOCK = false;
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

// Hook: returns fallback immediately, swaps to real data when API responds.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useApi<T>(fetcher: () => Promise<T>, fallback: T, deps: any[] = []): T {
  const [data, setData] = useState<T>(fallback);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    fetcher().then((result) => { if (mounted.current) setData(result); }).catch(() => {});
    return () => { mounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return data;
}

// --- HTTP helpers ---

function qs(params: Record<string, string | number | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v != null) as [string, string | number][];
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}

async function get<T>(endpoint: string): Promise<T> {
  const headers: HeadersInit = {};
  if (API_KEY) headers["X-API-Key"] = API_KEY;
  const res = await fetch(`${BASE_URL}${endpoint}`, { headers });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function post<T>(endpoint: string, body?: unknown): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (API_KEY) headers["X-API-Key"] = API_KEY;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function put<T>(endpoint: string, body?: unknown): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (API_KEY) headers["X-API-Key"] = API_KEY;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PUT",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function patchReq<T>(endpoint: string, body?: unknown): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (API_KEY) headers["X-API-Key"] = API_KEY;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PATCH",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function del<T>(endpoint: string): Promise<T> {
  const headers: HeadersInit = {};
  if (API_KEY) headers["X-API-Key"] = API_KEY;
  const res = await fetch(`${BASE_URL}${endpoint}`, { method: "DELETE", headers });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function delVoid(endpoint: string): Promise<void> {
  const headers: HeadersInit = {};
  if (API_KEY) headers["X-API-Key"] = API_KEY;
  const res = await fetch(`${BASE_URL}${endpoint}`, { method: "DELETE", headers });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
}

// === API Client ===

export const api = {
  // --- Greenhouse Controller ---
  greenhouses: {
    list: async (): Promise<{ greenhouses: GreenhouseSummary[] }> => {
      if (USE_MOCK) return { greenhouses: mockGreenhouses };
      return get("/api/greenhouses");
    },
    get: async (id: string, slotStatus?: string): Promise<GreenhouseDetail> => {
      if (USE_MOCK) return mockGreenhouseDetails[id] ?? mockGreenhouseDetails[Object.keys(mockGreenhouseDetails)[0]];
      return get(`/api/greenhouses/${id}${qs({ slotStatus })}`);
    },
    create: async (body: { name: string; description?: string; rows: number; cols: number }): Promise<{ id: string; name: string; description: string | null; rows: number; cols: number; totalSlots: number; createdAt: string }> => {
      if (USE_MOCK) return { id: crypto.randomUUID(), name: body.name, description: body.description ?? null, rows: body.rows, cols: body.cols, totalSlots: body.rows * body.cols, createdAt: new Date().toISOString() };
      return post("/api/greenhouses", body);
    },
    update: async (id: string, body: { name?: string; description?: string; rows?: number; cols?: number }): Promise<{ id: string; name: string; description: string | null; rows: number; cols: number; totalSlots: number; overallStatus: string; createdAt: string }> => {
      if (USE_MOCK) {
        const gh = mockGreenhouses[0];
        return { id, name: body.name ?? gh.name, description: body.description ?? gh.description, rows: body.rows ?? gh.rows, cols: body.cols ?? gh.cols, totalSlots: gh.totalSlots, overallStatus: gh.overallStatus, createdAt: new Date().toISOString() };
      }
      return put(`/api/greenhouses/${id}`, body);
    },
    delete: async (id: string): Promise<void> => {
      if (USE_MOCK) return;
      return delVoid(`/api/greenhouses/${id}`);
    },
    sensorsLatest: async (id: string): Promise<SensorSnapshot> => {
      if (USE_MOCK) return mockSensorSnapshot;
      return get(`/api/greenhouses/${id}/sensors/latest`);
    },
    sensorsHistory: async (id: string, params: { from: string; to: string; interval: string }): Promise<{ from: string; to: string; interval: string; readings: SensorHistoryReading[] }> => {
      if (USE_MOCK) return { from: params.from, to: params.to, interval: params.interval, readings: mockSensorHistory };
      return get(`/api/greenhouses/${id}/sensors/history${qs(params)}`);
    },
  },

  // --- Slot Controller ---
  slots: {
    get: async (greenhouseId: string, slotId: string): Promise<PlantSlot> => {
      if (USE_MOCK) {
        const detail = mockGreenhouseDetails[Object.keys(mockGreenhouseDetails)[0]];
        return detail.slots.find(s => s.id === slotId) ?? detail.slots[0];
      }
      return get(`/api/greenhouses/${greenhouseId}/slots/${slotId}`);
    },
    update: async (greenhouseId: string, slotId: string, body: { cropId?: string; plantedAt?: string; growthStagePercent?: number; activeStressTypes?: string[]; estimatedYieldKg?: number }): Promise<PlantSlot> => {
      if (USE_MOCK) {
        const detail = mockGreenhouseDetails[Object.keys(mockGreenhouseDetails)[0]];
        const slot = detail.slots.find(s => s.id === slotId) ?? detail.slots[0];
        return { ...slot, ...body } as PlantSlot;
      }
      return patchReq(`/api/greenhouses/${greenhouseId}/slots/${slotId}`, body);
    },
    history: async (greenhouseId: string, slotId: string, params?: { from?: string; to?: string; interval?: string }): Promise<{ slotId: string; cropId: string | null; cropName: string | null; from: string; to: string; interval: string; snapshots: SlotHistorySnapshot[] }> => {
      if (USE_MOCK) {
        const detail = mockGreenhouseDetails[Object.keys(mockGreenhouseDetails)[0]];
        const slot = detail.slots.find(s => s.id === slotId) ?? detail.slots[0];
        return { slotId, cropId: slot.cropId, cropName: slot.cropName, from: params?.from ?? "2026-06-02T00:00:00Z", to: params?.to ?? "2026-06-15T00:00:00Z", interval: params?.interval ?? "1d", snapshots: mockSlotHistory };
      }
      return get(`/api/greenhouses/${greenhouseId}/slots/${slotId}/history${qs({ from: params?.from, to: params?.to, interval: params?.interval })}`);
    },
  },

  // --- Weather Controller ---
  weather: {
    current: async (): Promise<MarsWeather> => {
      if (USE_MOCK) return mockWeather;
      return get("/api/weather/current");
    },
  },

  // --- Agent Controller ---
  agent: {
    log: async (params?: { page?: number; pageSize?: number; simulationId?: string }): Promise<{ total: number; page: number; pageSize: number; entries: AgentLogEntry[] }> => {
      if (USE_MOCK) {
        const page = params?.page ?? 1;
        const pageSize = params?.pageSize ?? 20;
        return { entries: mockAgentLog, total: mockAgentLog.length, page, pageSize };
      }
      return get(`/api/agent/log${qs({ page: params?.page, pageSize: params?.pageSize, simulationId: params?.simulationId })}`);
    },
    recommendations: async (params?: { status?: string; page?: number; pageSize?: number }): Promise<{ total: number; page: number; pageSize: number; recommendations: Recommendation[] }> => {
      if (USE_MOCK) {
        const page = params?.page ?? 1;
        const pageSize = params?.pageSize ?? 20;
        return { recommendations: mockRecommendations, total: mockRecommendations.length, page, pageSize };
      }
      return get(`/api/agent/recommendations${qs({ status: params?.status, page: params?.page, pageSize: params?.pageSize })}`);
    },
    approveRecommendation: async (id: string): Promise<{ id: string; status: string; executedAt: string }> => {
      if (USE_MOCK) return { id, status: "APPROVED", executedAt: new Date().toISOString() };
      return post(`/api/agent/recommendations/${id}/approve`);
    },
    dismissRecommendation: async (id: string, reason?: string): Promise<{ id: string; status: string }> => {
      if (USE_MOCK) return { id, status: "DISMISSED" };
      return post(`/api/agent/recommendations/${id}/dismiss`, { reason });
    },
    config: async (): Promise<AgentConfig> => {
      if (USE_MOCK) return mockAgentConfig;
      return get("/api/agent/config");
    },
    updateConfig: async (body: AgentConfig): Promise<AgentConfig> => {
      if (USE_MOCK) return body;
      return put("/api/agent/config", body);
    },
  },

  // --- Alert Controller ---
  alerts: {
    list: async (params?: { status?: string; page?: number; pageSize?: number }): Promise<{ total: number; page: number; pageSize: number; alerts: Alert[] }> => {
      if (USE_MOCK) {
        const page = params?.page ?? 1;
        const pageSize = params?.pageSize ?? 20;
        return { alerts: mockAlerts, total: mockAlerts.length, page, pageSize };
      }
      return get(`/api/alerts${qs({ status: params?.status, page: params?.page, pageSize: params?.pageSize })}`);
    },
    get: async (id: string): Promise<Alert> => {
      if (USE_MOCK) return mockAlerts.find((a) => a.id === id) ?? mockAlerts[0];
      return get(`/api/alerts/${id}`);
    },
    acknowledge: async (id: string, body?: { operatorNote?: string }): Promise<{ id: string; status: string }> => {
      if (USE_MOCK) return { id, status: "ACKNOWLEDGED" };
      return post(`/api/alerts/${id}/acknowledge`, body ?? {});
    },
    resolve: async (id: string, resolution: string): Promise<{ id: string; status: string; resolvedAt: string }> => {
      if (USE_MOCK) return { id, status: "RESOLVED", resolvedAt: new Date().toISOString() };
      return post(`/api/alerts/${id}/resolve`, { resolution });
    },
  },

  // --- Crop Controller ---
  crops: {
    list: async (): Promise<{ crops: Crop[] }> => {
      if (USE_MOCK) return { crops: mockCrops };
      return get("/api/crops");
    },
    plantingQueue: async (greenhouseId?: string): Promise<{ queue: PlantingQueueItem[] }> => {
      if (USE_MOCK) return { queue: mockPlantingQueue };
      return get(`/api/crops/planting-queue${qs({ greenhouseId })}`);
    },
    harvestJournal: async (params?: { page?: number; pageSize?: number; greenhouseId?: string; cropId?: string }): Promise<{ total: number; page: number; pageSize: number; harvests: HarvestEntry[] }> => {
      if (USE_MOCK) {
        const page = params?.page ?? 1;
        const pageSize = params?.pageSize ?? 20;
        return { harvests: mockHarvestJournal, total: mockHarvestJournal.length, page, pageSize };
      }
      return get(`/api/crops/harvest-journal${qs({ page: params?.page, pageSize: params?.pageSize, greenhouseId: params?.greenhouseId, cropId: params?.cropId })}`);
    },
    logHarvest: async (body: { cropId: string; slotId: string; yieldKg: number; harvestedAt: string; notes?: string }): Promise<HarvestEntry> => {
      if (USE_MOCK) return { ...mockHarvestJournal[0], ...body } as HarvestEntry;
      return post("/api/crops/harvest-journal", body);
    },
    updateHarvest: async (id: string, body: { yieldKg?: number; notes?: string }): Promise<HarvestEntry> => {
      if (USE_MOCK) {
        const entry = mockHarvestJournal.find(h => h.id === id) ?? mockHarvestJournal[0];
        return { ...entry, ...body };
      }
      return patchReq(`/api/crops/harvest-journal/${id}`, body);
    },
    stockpile: async (): Promise<{ updatedAt: string; items: StockpileItem[]; totalEstimatedCalories: number; totalDaysOfSupply: number }> => {
      if (USE_MOCK) {
        const totalCal = mockStockpile.reduce((s, i) => s + i.estimatedCalories, 0);
        return { updatedAt: new Date().toISOString(), items: mockStockpile, totalEstimatedCalories: totalCal, totalDaysOfSupply: +(totalCal / 10000).toFixed(1) };
      }
      return get("/api/crops/stockpile");
    },
  },

  // --- Nutrition Controller ---
  nutrition: {
    consumption: async (from: string, to: string): Promise<{ from: string; to: string; crewSize: number; dailyEntries: DailyNutritionEntry[] }> => {
      if (USE_MOCK) return { from, to, dailyEntries: mockNutritionEntries, crewSize: 4 };
      return get(`/api/nutrition/consumption${qs({ from, to })}`);
    },
    logConsumption: async (body: { date: string; cropId: string; quantityKg: number }): Promise<{ id: string; caloriesLogged: number }> => {
      if (USE_MOCK) return { id: crypto.randomUUID(), caloriesLogged: body.quantityKg * 77 };
      return post("/api/nutrition/consumption", body);
    },
    coverageHeatmap: async (params?: { fromDay?: number; toDay?: number }): Promise<CoverageHeatmap> => {
      if (USE_MOCK) return mockCoverageHeatmap;
      return get(`/api/nutrition/coverage-heatmap${qs({ fromDay: params?.fromDay, toDay: params?.toDay })}`);
    },
    storedFood: async (): Promise<StoredFood> => {
      if (USE_MOCK) return mockStoredFood;
      return get("/api/nutrition/stored-food");
    },
  },

  // --- Forecast Controller ---
  forecast: {
    resources: async (days?: number): Promise<{ generatedAt: string; forecastDays: number; projections: ResourceProjection[] }> => {
      if (USE_MOCK) {
        const d = days ?? 30;
        return { generatedAt: new Date().toISOString(), forecastDays: d, projections: mockResourceForecast.slice(0, d) };
      }
      return get(`/api/forecast/resources${qs({ days })}`);
    },
    missionTimeline: async (): Promise<MissionTimeline> => {
      if (USE_MOCK) return mockMissionTimeline;
      return get("/api/forecast/mission-timeline");
    },
    setMissionDates: async (body: { missionStartDate: string; missionEndDate: string }): Promise<{ missionStartDate: string; missionEndDate: string; totalMissionDays: number }> => {
      if (USE_MOCK) {
        const start = new Date(body.missionStartDate);
        const end = new Date(body.missionEndDate);
        const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return { ...body, totalMissionDays: totalDays };
      }
      return put("/api/forecast/mission-timeline", body);
    },
  },

  // --- Simulation Controller ---
  simulations: {
    list: async (): Promise<{ simulations: SimulationSummary[] }> => {
      if (USE_MOCK) return { simulations: mockSimulations };
      return get("/api/simulations");
    },
    get: async (id: string): Promise<SimulationDetail> => {
      if (USE_MOCK) return mockSimulationDetail;
      return get(`/api/simulations/${id}`);
    },
    create: async (body: { name: string; learningGoal: string; missionDuration: number; crewSize: number; yieldTarget: number; resourceAvailability: { waterLiters: number; nutrientKg: number; energyKwh: number }; agentConfig: AgentConfig }): Promise<{ id: string; status: SimulationStatus; createdAt: string }> => {
      if (USE_MOCK) return { id: crypto.randomUUID(), status: "RUNNING", createdAt: new Date().toISOString() };
      return post("/api/simulations", body);
    },
    update: async (id: string, body: { name?: string; learningGoal?: string }): Promise<{ id: string; name: string; learningGoal: string }> => {
      if (USE_MOCK) return { id, name: body.name ?? mockSimulations[0].name, learningGoal: body.learningGoal ?? mockSimulations[0].learningGoal };
      return patchReq(`/api/simulations/${id}`, body);
    },
    pause: async (id: string): Promise<{ id: string; status: SimulationStatus }> => {
      if (USE_MOCK) return { id, status: "PAUSED" };
      return post(`/api/simulations/${id}/pause`);
    },
    resume: async (id: string): Promise<{ id: string; status: SimulationStatus }> => {
      if (USE_MOCK) return { id, status: "RUNNING" };
      return post(`/api/simulations/${id}/resume`);
    },
    stop: async (id: string): Promise<{ id: string; status: SimulationStatus; completedAt: string; outcomeScore: number }> => {
      if (USE_MOCK) return { id, status: "COMPLETED", completedAt: new Date().toISOString(), outcomeScore: 74.5 };
      return post(`/api/simulations/${id}/stop`);
    },
    timeline: async (id: string, params?: { from?: string; to?: string; types?: string; page?: number; pageSize?: number }): Promise<{ simulationId: string; total: number; page: number; pageSize: number; events: TimelineEvent[] }> => {
      if (USE_MOCK) {
        const page = params?.page ?? 1;
        const pageSize = params?.pageSize ?? 50;
        return { simulationId: id, total: mockTimelineEvents.length, page, pageSize, events: mockTimelineEvents };
      }
      return get(`/api/simulations/${id}/timeline${qs({ from: params?.from, to: params?.to, types: params?.types, page: params?.page, pageSize: params?.pageSize })}`);
    },
    injections: {
      list: async (simId: string): Promise<{ injections: ScenarioInjection[] }> => {
        if (USE_MOCK) return { injections: mockInjections };
        return get(`/api/simulations/${simId}/injections`);
      },
      inject: async (simId: string, body: { scenarioId: string; intensity: number; durationMinutes?: number }): Promise<{ id: string; scenarioId: string; triggeredAt: string; estimatedResolutionAt: string | null; status: string }> => {
        if (USE_MOCK) return { id: crypto.randomUUID(), scenarioId: body.scenarioId, triggeredAt: new Date().toISOString(), estimatedResolutionAt: null, status: "ACTIVE" };
        return post(`/api/simulations/${simId}/injections`, body);
      },
      cancel: async (simId: string, injectionId: string): Promise<{ id: string; status: string; resolvedAt: string }> => {
        if (USE_MOCK) return { id: injectionId, status: "RESOLVED", resolvedAt: new Date().toISOString() };
        return post(`/api/simulations/${simId}/injections/${injectionId}/cancel`);
      },
    },
  },

  // --- Scenario Controller ---
  scenarios: {
    list: async (): Promise<{ scenarios: Scenario[] }> => {
      if (USE_MOCK) return { scenarios: mockScenarios };
      return get("/api/scenarios");
    },
  },

  // --- Analytics Controller ---
  analytics: {
    agentPerformance: async (simulationId?: string): Promise<AgentPerformance> => {
      if (USE_MOCK) return mockAgentPerformance;
      return get(`/api/analytics/agent-performance${qs({ simulationId })}`);
    },
  },

  // --- Onboarding Controller ---
  onboarding: {
    status: async (): Promise<OnboardingStatus> => {
      if (USE_MOCK) return { completed: false, completedSteps: [], totalSteps: 7 };
      return get("/api/onboarding/status");
    },
    complete: async (): Promise<{ completed: boolean; completedAt: string }> => {
      if (USE_MOCK) return { completed: true, completedAt: new Date().toISOString() };
      return post("/api/onboarding/complete");
    },
    completeStep: async (stepKey: string): Promise<{ stepKey: string; completedSteps: string[]; allCompleted: boolean }> => {
      if (USE_MOCK) return { stepKey, completedSteps: [stepKey], allCompleted: false };
      return post(`/api/onboarding/steps/${stepKey}/complete`);
    },
    reset: async (): Promise<void> => {
      if (USE_MOCK) return;
      return delVoid("/api/onboarding/status");
    },
  },

  // --- Admin Seeder Controller ---
  admin: {
    seedAll: async (): Promise<Record<string, string>> => {
      if (USE_MOCK) return { status: "seeded" };
      return post("/api/admin/seed/all");
    },
    seedGreenhouse: async (): Promise<Record<string, string>> => {
      if (USE_MOCK) return { status: "seeded" };
      return post("/api/admin/seed/greenhouse");
    },
    seedCrops: async (): Promise<Record<string, string>> => {
      if (USE_MOCK) return { status: "seeded" };
      return post("/api/admin/seed/crops");
    },
    seedMissionConfig: async (): Promise<Record<string, string>> => {
      if (USE_MOCK) return { status: "seeded" };
      return post("/api/admin/seed/mission-config");
    },
    clearAll: async (): Promise<Record<string, string>> => {
      if (USE_MOCK) return { status: "cleared" };
      return del("/api/admin/seed/clear");
    },
  },
};

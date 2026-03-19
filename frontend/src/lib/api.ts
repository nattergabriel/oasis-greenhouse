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
  DailyNutritionEntry,
  CoverageHeatmap,
  ResourceProjection,
  MissionTimeline,
  SimulationSummary,
  SimulationDetail,
  Scenario,
  AgentPerformance,
  OnboardingStatus,
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
  mockNutritionEntries,
  mockCoverageHeatmap,
  mockResourceForecast,
  mockMissionTimeline,
  mockSimulations,
  mockSimulationDetail,
  mockScenarios,
  mockAgentPerformance,
} from "./mock-data";

// Toggle this to switch between mock and real API
const USE_MOCK = true;
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function get<T>(endpoint: string): Promise<T> {
  if (USE_MOCK) throw new Error("Should not reach real API in mock mode");
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function post<T>(endpoint: string, body?: unknown): Promise<T> {
  if (USE_MOCK) throw new Error("Should not reach real API in mock mode");
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

// === API Client ===
// Each method returns mock data for now.
// When backend is ready, flip USE_MOCK to false and methods will call real endpoints.

export const api = {
  greenhouses: {
    list: async (): Promise<{ greenhouses: GreenhouseSummary[] }> => {
      return { greenhouses: mockGreenhouses };
    },
    get: async (id: string): Promise<GreenhouseDetail> => {
      return mockGreenhouseDetails[id] ?? mockGreenhouseDetails[Object.keys(mockGreenhouseDetails)[0]];
    },
    sensorsLatest: async (_id: string): Promise<SensorSnapshot> => {
      return mockSensorSnapshot;
    },
    sensorsHistory: async (_id: string, _params: { from: string; to: string; interval: string }): Promise<{ readings: SensorHistoryReading[] }> => {
      return { readings: mockSensorHistory };
    },
  },

  weather: {
    current: async (): Promise<MarsWeather> => {
      return mockWeather;
    },
  },

  agent: {
    log: async (_params?: { page?: number; pageSize?: number }): Promise<{ entries: AgentLogEntry[]; total: number }> => {
      return { entries: mockAgentLog, total: mockAgentLog.length };
    },
    recommendations: async (_params?: { status?: string }): Promise<{ recommendations: Recommendation[]; total: number }> => {
      return { recommendations: mockRecommendations, total: mockRecommendations.length };
    },
    approveRecommendation: async (id: string): Promise<{ id: string; status: string }> => {
      return { id, status: "APPROVED" };
    },
    dismissRecommendation: async (id: string, _reason?: string): Promise<{ id: string; status: string }> => {
      return { id, status: "DISMISSED" };
    },
    config: async (): Promise<AgentConfig> => {
      return mockAgentConfig;
    },
    updateConfig: async (body: AgentConfig): Promise<AgentConfig> => {
      return body;
    },
  },

  alerts: {
    list: async (_params?: { status?: string; page?: number }): Promise<{ alerts: Alert[]; total: number }> => {
      return { alerts: mockAlerts, total: mockAlerts.length };
    },
    get: async (id: string): Promise<Alert> => {
      return mockAlerts.find((a) => a.id === id) ?? mockAlerts[0];
    },
    acknowledge: async (id: string): Promise<{ id: string; status: string }> => {
      return { id, status: "ACKNOWLEDGED" };
    },
    resolve: async (id: string, _resolution: string): Promise<{ id: string; status: string }> => {
      return { id, status: "RESOLVED" };
    },
  },

  crops: {
    list: async (): Promise<{ crops: Crop[] }> => {
      return { crops: mockCrops };
    },
    plantingQueue: async (_greenhouseId?: string): Promise<{ queue: PlantingQueueItem[] }> => {
      return { queue: mockPlantingQueue };
    },
    harvestJournal: async (_params?: { page?: number; greenhouseId?: string; cropId?: string }): Promise<{ harvests: HarvestEntry[]; total: number }> => {
      return { harvests: mockHarvestJournal, total: mockHarvestJournal.length };
    },
    logHarvest: async (body: Partial<HarvestEntry>): Promise<HarvestEntry> => {
      return { ...mockHarvestJournal[0], ...body } as HarvestEntry;
    },
    stockpile: async (): Promise<{ items: StockpileItem[]; totalEstimatedCalories: number; totalDaysOfSupply: number }> => {
      const totalCal = mockStockpile.reduce((s, i) => s + i.estimatedCalories, 0);
      return { items: mockStockpile, totalEstimatedCalories: totalCal, totalDaysOfSupply: +(totalCal / 10000).toFixed(1) };
    },
  },

  nutrition: {
    consumption: async (_from: string, _to: string): Promise<{ dailyEntries: DailyNutritionEntry[]; crewSize: number }> => {
      return { dailyEntries: mockNutritionEntries, crewSize: 4 };
    },
    coverageHeatmap: async (): Promise<CoverageHeatmap> => {
      return mockCoverageHeatmap;
    },
  },

  forecast: {
    resources: async (_days?: number): Promise<{ projections: ResourceProjection[] }> => {
      return { projections: mockResourceForecast };
    },
    missionTimeline: async (): Promise<MissionTimeline> => {
      return mockMissionTimeline;
    },
  },

  simulations: {
    list: async (): Promise<{ simulations: SimulationSummary[] }> => {
      return { simulations: mockSimulations };
    },
    get: async (_id: string): Promise<SimulationDetail> => {
      return mockSimulationDetail;
    },
  },

  scenarios: {
    list: async (): Promise<{ scenarios: Scenario[] }> => {
      return { scenarios: mockScenarios };
    },
  },

  analytics: {
    agentPerformance: async (_simulationId?: string): Promise<AgentPerformance> => {
      return mockAgentPerformance;
    },
  },

  onboarding: {
    status: async (): Promise<OnboardingStatus> => {
      return { completed: false, completedSteps: [], totalSteps: 7 };
    },
    complete: async (): Promise<{ completed: boolean }> => {
      return { completed: true };
    },
    completeStep: async (stepKey: string): Promise<{ stepKey: string; allCompleted: boolean }> => {
      return { stepKey, allCompleted: false };
    },
    reset: async (): Promise<void> => {},
  },
};

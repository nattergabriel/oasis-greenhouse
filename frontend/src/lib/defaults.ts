import type {
  SensorSnapshot,
  SensorHistoryReading,
  MarsWeather,
  StoredFood,
  DailyNutritionEntry,
  CoverageHeatmap,
  ResourceProjection,
  MissionTimeline,
  SimulationDetail,
  AgentConfig,
  AgentPerformance,
  SimulationState,
} from "./types";

const sv = (v = 0) => ({ value: v, status: "NORMAL" as const });

export const emptySensorSnapshot: SensorSnapshot = {
  timestamp: "",
  temperature: sv(),
  humidity: sv(),
  lightIntensity: sv(),
  par: sv(),
  lightCyclePhase: "DAY",
  co2: sv(),
  waterFlowRate: sv(),
  waterRecyclingEfficiency: sv(),
  nutrientSolution: { ph: sv(), ec: sv(), dissolvedOxygen: sv() },
};

export const emptyWeather: MarsWeather = {
  timestamp: "",
  solarIrradiance: 0,
  dustStormIndex: 0,
  externalTemperature: 0,
  atmosphericPressure: 0,
  forecast: [],
};

export const emptyStoredFood: StoredFood = {
  totalCalories: 1,
  remainingCalories: 0,
};

export const emptyNutritionEntry: DailyNutritionEntry = {
  date: "",
  totalCalories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
  targetCalories: 0,
  coveragePercent: 0,
  micronutrients: {
    vitaminAMcg: 0,
    vitaminCMg: 0,
    vitaminKMcg: 0,
    folateMcg: 0,
    ironMg: 0,
    potassiumMg: 0,
    magnesiumMg: 0,
  },
  calorieGhFraction: 0,
  proteinGhFraction: 0,
  micronutrientsCovered: 0,
};

export const emptyCoverageHeatmap: CoverageHeatmap = {
  nutrients: ["Vitamin A", "Vitamin C", "Vitamin K", "Folate", "Iron", "Potassium", "Magnesium"],
  missionDays: [],
  coverage: [[], [], [], [], [], [], []],
};

export const emptyResourceProjection: ResourceProjection = {
  missionDay: 0,
  waterReservePercent: 0,
  nutrientReservePercent: 0,
  energyReservePercent: 0,
  riskLevel: "LOW",
};

export const emptyMissionTimeline: MissionTimeline = {
  missionStartDate: "",
  missionEndDate: "",
  currentMissionDay: 0,
  totalMissionDays: 1,
  milestones: [],
};

export const emptyAgentConfig: AgentConfig = {
  autonomyLevel: "HYBRID",
  certaintyThreshold: 0.7,
  riskTolerance: "MODERATE",
  priorityWeights: { yield: 0.4, diversity: 0.3, resourceConservation: 0.3 },
};

export const emptySimulationDetail: SimulationDetail = {
  id: "",
  name: "-",
  learningGoal: "",
  status: "PAUSED",
  createdAt: "",
  completedAt: null,
  missionDuration: 0,
  crewSize: 0,
  yieldTarget: 0,
  outcomeScore: null,
  autonomyLevel: "HYBRID",
  riskTolerance: "MODERATE",
  resourceAvailability: { waterLiters: 0, nutrientKg: 0, energyKwh: 0 },
  agentConfig: emptyAgentConfig,
  currentMetrics: {
    missionDay: 0,
    waterReservePercent: 0,
    nutrientReservePercent: 0,
    energyReservePercent: 0,
    totalYieldKg: 0,
  },
};

export const emptyAgentPerformance: AgentPerformance = {
  simulationId: "",
  simulationName: "-",
  status: "PAUSED",
  decisionAccuracyPercent: 0,
  avgResponseTimeMs: 0,
  resourceEfficiencyScore: 0,
  nutritionalTargetHitRate: 0,
  diversityScore: 0,
  autonomousActionsCount: 0,
  humanOverridesCount: 0,
  crisisResponseScore: 0,
};

export const initialSimulationState: SimulationState = {
  currentMissionDay: 0,
  totalMissionDays: 0,
  speed: 0,
  isRunning: false,
  greenhouses: [],
  selectedGreenhouseId: null,
  resources: { waterReservePercent: 0, nutrientReservePercent: 0, energyReservePercent: 0 },
  weather: emptyWeather,
  alerts: [],
  agentLog: [],
  recommendations: [],
};

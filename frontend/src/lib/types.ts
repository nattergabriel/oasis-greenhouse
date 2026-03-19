// === Enums (match contracts/API.md exactly) ===

export type GreenhouseStatus = "HEALTHY" | "NEEDS_ATTENTION" | "CRITICAL";
export type SlotStatus = "EMPTY" | "HEALTHY" | "NEEDS_ATTENTION" | "CRITICAL";
export type SensorStatus = "NORMAL" | "WARNING" | "CRITICAL";
export type LightCyclePhase = "DAY" | "NIGHT";
export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AlertType =
  | "NUTRIENT_DEFICIENCY"
  | "DISEASE"
  | "ENVIRONMENTAL_STRESS"
  | "EQUIPMENT_FAILURE"
  | "OTHER";
export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
export type AgentOutcome = "SUCCESS" | "PENDING" | "FAILED";
export type RecommendationStatus = "PENDING" | "APPROVED" | "DISMISSED";
export type Urgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AutonomyLevel =
  | "FULLY_AUTONOMOUS"
  | "SUGGEST_ONLY"
  | "HYBRID";
export type RiskTolerance = "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";
export type SimulationStatus = "RUNNING" | "PAUSED" | "COMPLETED";
export type ScenarioType =
  | "WATER_LEAK"
  | "SOLAR_PANEL_FAILURE"
  | "DISEASE_OUTBREAK"
  | "DUST_STORM"
  | "EQUIPMENT_MALFUNCTION";
export type ScenarioSeverity = "LOW" | "MEDIUM" | "HIGH" | "CATASTROPHIC";
export type InjectionStatus = "ACTIVE" | "RESOLVED";
export type CropCategory = "VEGETABLE" | "LEGUME" | "GRAIN" | "HERB";
export type WaterRequirement = "LOW" | "MEDIUM" | "HIGH";
export type StressType =
  | "DROUGHT"
  | "OVERWATERING"
  | "HEAT"
  | "COLD"
  | "NUTRIENT_DEFICIENCY_N"
  | "NUTRIENT_DEFICIENCY_K"
  | "NUTRIENT_DEFICIENCY_FE"
  | "SALINITY"
  | "LIGHT_INSUFFICIENT"
  | "LIGHT_EXCESSIVE"
  | "CO2_IMBALANCE"
  | "ROOT_HYPOXIA";
export type TimelineEventType =
  | "SENSOR_SNAPSHOT"
  | "SLOT_SNAPSHOT"
  | "AGENT_ACTION"
  | "STRESS_DETECTED"
  | "STRESS_RESOLVED"
  | "SCENARIO_INJECTED"
  | "HARVEST";
export type MilestoneType =
  | "HARVEST_WINDOW"
  | "PLANTING_DEADLINE"
  | "RESOURCE_CRITICAL"
  | "TRIP_END";

// === Interfaces ===

// Shared sensor value shape
export interface SensorValue {
  value: number;
  status: SensorStatus;
}

// GreenhouseController
export interface GreenhouseSummary {
  id: string;
  name: string;
  description: string | null;
  rows: number;
  cols: number;
  totalSlots: number;
  occupiedSlots: number;
  overallStatus: GreenhouseStatus;
}

export interface PlantSlot {
  id: string;
  position: { row: number; col: number };
  cropId: string | null;
  cropName: string | null;
  status: SlotStatus;
  growthStagePercent: number;
  daysUntilHarvest: number | null;
  plantedAt: string | null;
  activeStressTypes: StressType[];
  estimatedYieldKg: number | null;
}

export interface GreenhouseResources {
  waterReservePercent: number;
  nutrientReservePercent: number;
  energyReservePercent: number;
}

export interface GreenhouseDetail {
  id: string;
  name: string;
  description: string | null;
  rows: number;
  cols: number;
  overallStatus: GreenhouseStatus;
  slots: PlantSlot[];
  resources: GreenhouseResources;
}

export interface NutrientSolution {
  ph: SensorValue;
  ec: SensorValue;
  dissolvedOxygen: SensorValue;
}

export interface SensorSnapshot {
  timestamp: string;
  temperature: SensorValue;
  humidity: SensorValue;
  lightIntensity: SensorValue;
  par: SensorValue;
  lightCyclePhase: LightCyclePhase;
  co2: SensorValue;
  waterFlowRate: SensorValue;
  waterRecyclingEfficiency: SensorValue;
  nutrientSolution: NutrientSolution;
}

export interface SensorHistoryReading {
  timestamp: string;
  temperature: number;
  humidity: number;
  lightIntensity: number;
  par: number;
  co2: number;
  waterFlowRate: number;
  waterRecyclingEfficiency: number;
  nutrientSolutionPh: number;
  nutrientSolutionEc: number;
  nutrientSolutionDissolvedOxygen: number;
}

// WeatherController
export interface WeatherForecastDay {
  missionDay: number;
  dustStormRisk: RiskLevel;
  solarIrradiance: number;
}

export interface MarsWeather {
  timestamp: string;
  solarIrradiance: number;
  dustStormIndex: number;
  externalTemperature: number;
  atmosphericPressure: number;
  forecast: WeatherForecastDay[];
}

// AgentController
export interface AgentLogEntry {
  id: string;
  timestamp: string;
  actionType: string;
  description: string;
  reasoning: string;
  knowledgeBaseSource: string | null;
  outcome: AgentOutcome;
}

export interface Recommendation {
  id: string;
  createdAt: string;
  actionType: string;
  description: string;
  reasoning: string;
  confidence: number;
  urgency: Urgency;
  expiresAt: string | null;
  status: RecommendationStatus;
}

export interface AgentConfig {
  autonomyLevel: AutonomyLevel;
  certaintyThreshold: number;
  riskTolerance: RiskTolerance;
  priorityWeights: {
    yield: number;
    diversity: number;
    resourceConservation: number;
  };
}

// AlertController
export interface Alert {
  id: string;
  createdAt: string;
  resolvedAt: string | null;
  severity: AlertSeverity;
  type: AlertType;
  cropId: string | null;
  slotId: string | null;
  greenhouseId: string | null;
  diagnosis: string;
  confidence: number;
  status: AlertStatus;
  escalatedToHuman: boolean;
  suggestedAction: string;
}

// CropController
export interface Micronutrients {
  vitaminAMcg: number | null;
  vitaminCMg: number | null;
  vitaminKMcg: number | null;
  folateMcg: number | null;
  ironMg: number | null;
  potassiumMg: number | null;
  magnesiumMg: number | null;
}

export interface NutritionalProfile {
  caloriesPer100g: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  micronutrients: Micronutrients;
}

export interface EnvironmentalRequirements {
  optimalTempMinC: number;
  optimalTempMaxC: number;
  heatStressThresholdC: number;
  optimalHumidityMinPct: number;
  optimalHumidityMaxPct: number;
  lightRequirementParMin: number;
  lightRequirementParMax: number;
  optimalCo2PpmMin: number;
  optimalCo2PpmMax: number;
  optimalPhMin: number;
  optimalPhMax: number;
}

export interface Crop {
  id: string;
  name: string;
  category: CropCategory;
  growthDays: number;
  harvestIndex: number;
  typicalYieldPerM2Kg: number;
  waterRequirement: WaterRequirement;
  environmentalRequirements: EnvironmentalRequirements;
  stressSensitivities: StressType[];
  nutritionalProfile: NutritionalProfile;
}

export interface PlantingQueueItem {
  rank: number;
  cropId: string;
  cropName: string;
  greenhouseId: string;
  recommendedPlantDate: string;
  missionDay: number;
  reason: string;
  nutritionalGapsAddressed: string[];
}

export interface HarvestEntry {
  id: string;
  harvestedAt: string;
  missionDay: number;
  cropId: string;
  cropName: string;
  yieldKg: number;
  slotId: string;
  greenhouseId: string;
  notes: string | null;
}

export interface StockpileItem {
  cropId: string;
  cropName: string;
  quantityKg: number;
  estimatedCalories: number;
  daysOfSupply: number;
  expiresInDays: number | null;
}

// NutritionController
export interface DailyNutritionEntry {
  date: string;
  totalCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  targetCalories: number;
  coveragePercent: number;
  micronutrients: Micronutrients;
}

export interface CoverageHeatmap {
  nutrients: string[];
  missionDays: number[];
  coverage: number[][];
}

// ForecastController
export interface ResourceProjection {
  missionDay: number;
  waterReservePercent: number;
  nutrientReservePercent: number;
  energyReservePercent: number;
  riskLevel: RiskLevel;
}

export interface Milestone {
  missionDay: number;
  date: string;
  type: MilestoneType;
  label: string;
  cropId: string | null;
}

export interface MissionTimeline {
  missionStartDate: string;
  missionEndDate: string;
  currentMissionDay: number;
  totalMissionDays: number;
  milestones: Milestone[];
}

// SimulationController
export interface SimulationSummary {
  id: string;
  name: string;
  learningGoal: string;
  status: SimulationStatus;
  createdAt: string;
  completedAt: string | null;
  missionDuration: number;
  crewSize: number;
  yieldTarget: number;
  outcomeScore: number | null;
  autonomyLevel: AutonomyLevel;
  riskTolerance: RiskTolerance;
}

export interface SimulationDetail extends SimulationSummary {
  resourceAvailability: {
    waterLiters: number;
    nutrientKg: number;
    energyKwh: number;
  };
  agentConfig: AgentConfig;
  currentMetrics: {
    missionDay: number;
    waterReservePercent: number;
    nutrientReservePercent: number;
    energyReservePercent: number;
    totalYieldKg: number;
  };
}

export interface ScenarioInjection {
  id: string;
  scenarioId: string;
  scenarioName: string;
  triggeredAt: string;
  resolvedAt: string | null;
  intensity: number;
  status: InjectionStatus;
}

// ScenarioController
export interface Scenario {
  id: string;
  name: string;
  type: ScenarioType;
  description: string;
  severity: ScenarioSeverity;
  defaultDurationMinutes: number | null;
}

// AnalyticsController
export interface AgentPerformance {
  simulationId: string;
  simulationName: string;
  status: SimulationStatus;
  decisionAccuracyPercent: number;
  avgResponseTimeMs: number;
  resourceEfficiencyScore: number;
  nutritionalTargetHitRate: number;
  diversityScore: number;
  autonomousActionsCount: number;
  humanOverridesCount: number;
  crisisResponseScore: number;
}

// OnboardingController
export interface OnboardingStatus {
  completed: boolean;
  completedSteps: string[];
  totalSteps: number;
}

// TimelineController
export interface TimelineEvent {
  id: string;
  timestamp: string;
  missionDay: number;
  type: TimelineEventType;
  summary: string;
  payload: Record<string, unknown>;
}

// === Simulation State (frontend-only, wraps API data) ===

export interface SimulationState {
  currentMissionDay: number;
  totalMissionDays: number;
  speed: 0 | 1 | 10;
  isRunning: boolean;
  greenhouses: GreenhouseSummary[];
  selectedGreenhouseId: string | null;
  resources: GreenhouseResources;
  weather: MarsWeather;
  alerts: Alert[];
  agentLog: AgentLogEntry[];
  recommendations: Recommendation[];
}

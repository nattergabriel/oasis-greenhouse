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
  SimulationState,
  Zone,
  SlotHistorySnapshot,
  ScenarioInjection,
  TimelineEvent,
} from "./types";

// === Helper ===
const uuid = () => crypto.randomUUID();

// Single greenhouse (spec: 1 greenhouse, 4 zones × 15 m²)
const GH_ID = "a1000000-0000-0000-0000-000000000001";
const SIM_ID = "b1000000-0000-0000-0000-000000000001";

// 5 spec crops (all KB-backed)
const CROP_IDS = {
  lettuce: "c1000000-0000-0000-0000-000000000001",
  potato: "c1000000-0000-0000-0000-000000000002",
  radish: "c1000000-0000-0000-0000-000000000003",
  beans_peas: "c1000000-0000-0000-0000-000000000004",
  herbs: "c1000000-0000-0000-0000-000000000005",
};

// === Crops (spec-accurate: SIMULATION-SPEC.md) ===
export const mockCrops: Crop[] = [
  {
    id: CROP_IDS.lettuce,
    name: "Lettuce",
    category: "VEGETABLE",
    growthDays: 30,
    harvestIndex: 0.85,
    typicalYieldPerM2Kg: 4.0,
    waterRequirement: "HIGH",
    environmentalRequirements: {
      optimalTempMinC: 15, optimalTempMaxC: 22, heatStressThresholdC: 25,
      optimalHumidityMinPct: 50, optimalHumidityMaxPct: 70,
      lightRequirementParMin: 150, lightRequirementParMax: 250,
      optimalCo2PpmMin: 800, optimalCo2PpmMax: 1200,
      optimalPhMin: 5.5, optimalPhMax: 6.5,
    },
    stressSensitivities: ["HEAT", "DROUGHT", "NUTRIENT_DEFICIENCY_N"],
    nutritionalProfile: {
      caloriesPer100g: 15, proteinG: 1.4, carbsG: 2.9, fatG: 0.2, fiberG: 1.3,
      micronutrients: { vitaminAMcg: 370, vitaminCMg: 9.2, vitaminKMcg: 126, folateMcg: 38, ironMg: 0.9, potassiumMg: 194, magnesiumMg: 13 },
    },
  },
  {
    id: CROP_IDS.potato,
    name: "Potato",
    category: "VEGETABLE",
    growthDays: 90,
    harvestIndex: 0.75,
    typicalYieldPerM2Kg: 6.0,
    waterRequirement: "MEDIUM",
    environmentalRequirements: {
      optimalTempMinC: 16, optimalTempMaxC: 20, heatStressThresholdC: 28,
      optimalHumidityMinPct: 60, optimalHumidityMaxPct: 80,
      lightRequirementParMin: 200, lightRequirementParMax: 400,
      optimalCo2PpmMin: 800, optimalCo2PpmMax: 1200,
      optimalPhMin: 5.5, optimalPhMax: 6.0,
    },
    stressSensitivities: ["DROUGHT", "HEAT", "OVERWATERING"],
    nutritionalProfile: {
      caloriesPer100g: 77, proteinG: 2.0, carbsG: 17, fatG: 0.1, fiberG: 2.2,
      micronutrients: { vitaminAMcg: 0, vitaminCMg: 19.7, vitaminKMcg: 2, folateMcg: 15, ironMg: 0.8, potassiumMg: 421, magnesiumMg: 23 },
    },
  },
  {
    id: CROP_IDS.radish,
    name: "Radish",
    category: "VEGETABLE",
    growthDays: 25,
    harvestIndex: 0.7,
    typicalYieldPerM2Kg: 3.0,
    waterRequirement: "LOW",
    environmentalRequirements: {
      optimalTempMinC: 15, optimalTempMaxC: 22, heatStressThresholdC: 26,
      optimalHumidityMinPct: 40, optimalHumidityMaxPct: 60,
      lightRequirementParMin: 200, lightRequirementParMax: 400,
      optimalCo2PpmMin: 800, optimalCo2PpmMax: 1200,
      optimalPhMin: 6.0, optimalPhMax: 7.0,
    },
    stressSensitivities: ["HEAT", "DROUGHT"],
    nutritionalProfile: {
      caloriesPer100g: 16, proteinG: 0.7, carbsG: 3.4, fatG: 0.1, fiberG: 1.6,
      micronutrients: { vitaminAMcg: 7, vitaminCMg: 14.8, vitaminKMcg: 1.3, folateMcg: 25, ironMg: 0.3, potassiumMg: 233, magnesiumMg: 10 },
    },
  },
  {
    id: CROP_IDS.beans_peas,
    name: "Beans & Peas",
    category: "LEGUME",
    growthDays: 55,
    harvestIndex: 0.55,
    typicalYieldPerM2Kg: 3.0,
    waterRequirement: "MEDIUM",
    environmentalRequirements: {
      optimalTempMinC: 18, optimalTempMaxC: 25, heatStressThresholdC: 30,
      optimalHumidityMinPct: 60, optimalHumidityMaxPct: 80,
      lightRequirementParMin: 300, lightRequirementParMax: 600,
      optimalCo2PpmMin: 800, optimalCo2PpmMax: 1200,
      optimalPhMin: 6.0, optimalPhMax: 6.8,
    },
    stressSensitivities: ["DROUGHT", "COLD", "NUTRIENT_DEFICIENCY_FE"],
    nutritionalProfile: {
      caloriesPer100g: 100, proteinG: 7.0, carbsG: 15.0, fatG: 1.5, fiberG: 5.0,
      micronutrients: { vitaminAMcg: 1, vitaminCMg: 6, vitaminKMcg: 47, folateMcg: 375, ironMg: 15.7, potassiumMg: 1797, magnesiumMg: 280 },
    },
  },
  {
    id: CROP_IDS.herbs,
    name: "Herbs",
    category: "HERB",
    growthDays: 28,
    harvestIndex: 0.8,
    typicalYieldPerM2Kg: 1.5,
    waterRequirement: "LOW",
    environmentalRequirements: {
      optimalTempMinC: 18, optimalTempMaxC: 24, heatStressThresholdC: 28,
      optimalHumidityMinPct: 50, optimalHumidityMaxPct: 70,
      lightRequirementParMin: 250, lightRequirementParMax: 500,
      optimalCo2PpmMin: 800, optimalCo2PpmMax: 1200,
      optimalPhMin: 5.5, optimalPhMax: 6.5,
    },
    stressSensitivities: ["COLD", "DROUGHT"],
    nutritionalProfile: {
      caloriesPer100g: 15, proteinG: 1.0, carbsG: 2.7, fatG: 0.6, fiberG: 1.6,
      micronutrients: { vitaminAMcg: 264, vitaminCMg: 18, vitaminKMcg: 415, folateMcg: 68, ironMg: 3.2, potassiumMg: 295, magnesiumMg: 64 },
    },
  },
];

// === Slots (4 zones × 4 cols = 16 slots) ===
function makeSlot(row: number, col: number, cropKey?: keyof typeof CROP_IDS, growth?: number, stress?: string[]): PlantSlot {
  const crop = cropKey ? mockCrops.find(c => c.id === CROP_IDS[cropKey]) : null;
  const growthPct = growth ?? 0;
  const daysUntilHarvest = crop ? Math.round(crop.growthDays * (1 - growthPct / 100)) : null;

  return {
    id: `s1-${row}-${col}`,
    position: { row, col },
    cropId: crop?.id ?? null,
    cropName: crop?.name ?? null,
    status: !crop ? "EMPTY" : (stress && stress.length > 0) ? "NEEDS_ATTENTION" : "HEALTHY",
    growthStagePercent: cropKey ? growthPct : 0,
    daysUntilHarvest,
    plantedAt: cropKey ? "2026-01-25T08:00:00Z" : null,
    activeStressTypes: (stress ?? []) as PlantSlot["activeStressTypes"],
    estimatedYieldKg: crop ? +(crop.typicalYieldPerM2Kg * 0.5 * (growthPct / 100)).toFixed(2) : null,
  };
}

// Zone 1 (row 0): 60% potato, 40% beans_peas
// Zone 2 (row 1): 50% lettuce, 30% radish, 20% herbs
// Zone 3 (row 2): 40% beans_peas, 40% potato, 20% radish
// Zone 4 (row 3): 50% herbs, 30% lettuce, 20% radish
const greenhouseSlots: PlantSlot[] = [
  makeSlot(0, 0, "potato", 72), makeSlot(0, 1, "potato", 68),
  makeSlot(0, 2, "beans_peas", 45), makeSlot(0, 3, "beans_peas", 42, ["DROUGHT"]),
  makeSlot(1, 0, "lettuce", 85), makeSlot(1, 1, "lettuce", 78),
  makeSlot(1, 2, "radish", 70), makeSlot(1, 3, "herbs", 90),
  makeSlot(2, 0, "beans_peas", 30), makeSlot(2, 1, "potato", 28),
  makeSlot(2, 2, "potato", 25), makeSlot(2, 3, "radish", 55),
  makeSlot(3, 0, "herbs", 88), makeSlot(3, 1, "herbs", 82),
  makeSlot(3, 2, "lettuce", 60), makeSlot(3, 3),
];

// === Zones ===
const mockZones: Zone[] = [
  { id: 1, areaM2: 15, cropPlan: { potato: 0.6, beans_peas: 0.4 }, artificialLight: true, waterAllocation: 1.2 },
  { id: 2, areaM2: 15, cropPlan: { lettuce: 0.5, radish: 0.3, herbs: 0.2 }, artificialLight: true, waterAllocation: 1.0 },
  { id: 3, areaM2: 15, cropPlan: { beans_peas: 0.4, potato: 0.4, radish: 0.2 }, artificialLight: false, waterAllocation: 0.8 },
  { id: 4, areaM2: 15, cropPlan: { herbs: 0.5, lettuce: 0.3, radish: 0.2 }, artificialLight: true, waterAllocation: 1.0 },
];

// === Greenhouse (single — spec: 4 zones × 15 m² = 60 m²) ===
export const mockGreenhouses: GreenhouseSummary[] = [
  {
    id: GH_ID,
    name: "Mars Greenhouse",
    description: "4 zones x 15 m2 — 60 m2 total growing area",
    rows: 4, cols: 4, totalSlots: 16,
    occupiedSlots: greenhouseSlots.filter(s => s.cropId).length,
    overallStatus: "NEEDS_ATTENTION",
  },
];

export const mockGreenhouseDetails: Record<string, GreenhouseDetail> = {
  [GH_ID]: {
    ...mockGreenhouses[0],
    slots: greenhouseSlots,
    resources: { waterReservePercent: 73, nutrientReservePercent: 58, energyReservePercent: 84 },
    zones: mockZones,
  },
};

// === Sensors ===
export const mockSensorSnapshot: SensorSnapshot = {
  timestamp: "2026-06-15T14:32:00Z",
  temperature: { value: 20.0, status: "NORMAL" },
  humidity: { value: 62, status: "NORMAL" },
  lightIntensity: { value: 18500, status: "NORMAL" },
  par: { value: 320, status: "NORMAL" },
  lightCyclePhase: "DAY",
  co2: { value: 1000, status: "NORMAL" },
  waterFlowRate: { value: 2.4, status: "NORMAL" },
  waterRecyclingEfficiency: { value: 90, status: "NORMAL" },
  nutrientSolution: {
    ph: { value: 6.1, status: "NORMAL" },
    ec: { value: 2.1, status: "WARNING" },
    dissolvedOxygen: { value: 7.2, status: "NORMAL" },
  },
};

// Deterministic pseudo-random noise per index (avoids SSR hydration mismatch)
const _sensorNoise = [0.31,0.72,0.15,0.88,0.44,0.63,0.27,0.95,0.51,0.38,0.69,0.12,0.84,0.56,0.33,0.77,0.48,0.91,0.22,0.65,0.41,0.73,0.18,0.86];
export const mockSensorHistory: SensorHistoryReading[] = Array.from({ length: 24 }, (_, i) => {
  const n = _sensorNoise[i];
  return {
    timestamp: new Date(Date.UTC(2026, 5, 15, i)).toISOString(),
    temperature: 19 + Math.sin(i / 4) * 1.5 + n * 0.5,
    humidity: 60 + Math.sin(i / 6) * 5 + n * 2,
    lightIntensity: i >= 6 && i <= 18 ? 15000 + n * 5000 : 200 + n * 100,
    par: i >= 6 && i <= 18 ? 280 + n * 80 : 10 + n * 5,
    co2: 980 + Math.sin(i / 3) * 40 + n * 20,
    waterFlowRate: 2.2 + n * 0.5,
    waterRecyclingEfficiency: 88 + n * 4,
    nutrientSolutionPh: 6.0 + n * 0.3,
    nutrientSolutionEc: 1.9 + n * 0.4,
    nutrientSolutionDissolvedOxygen: 7.0 + n * 0.5,
  };
});

// === Weather ===
export const mockWeather: MarsWeather = {
  timestamp: "2026-06-15T14:32:00Z",
  solarIrradiance: 590,
  dustStormIndex: 2.1,
  externalTemperature: -63,
  atmosphericPressure: 650,
  forecast: [
    { missionDay: 143, dustStormRisk: "LOW", solarIrradiance: 580 },
    { missionDay: 144, dustStormRisk: "LOW", solarIrradiance: 575 },
    { missionDay: 145, dustStormRisk: "MODERATE", solarIrradiance: 520 },
    { missionDay: 146, dustStormRisk: "HIGH", solarIrradiance: 380 },
    { missionDay: 147, dustStormRisk: "HIGH", solarIrradiance: 350 },
    { missionDay: 148, dustStormRisk: "MODERATE", solarIrradiance: 450 },
    { missionDay: 149, dustStormRisk: "LOW", solarIrradiance: 560 },
  ],
};

// === Agent Log (real action types: set_zone_plan, water_adjust, light_toggle, set_temperature, remove) ===
export const mockAgentLog: AgentLogEntry[] = [
  {
    id: uuid(), timestamp: "2026-06-15T14:30:00Z", actionType: "water_adjust",
    description: "Increased water multiplier to 1.3x for Zone 2 — lettuce showing early drought stress",
    reasoning: "Lettuce at 85% growth requires increased water uptake. KB Crop Profiles: lettuce at harvest stage is sensitive to drought. Zone 2 water allocation adjusted from 1.0 to 1.3.",
    knowledgeBaseSource: "Crop Profiles — Lettuce hydration requirements", outcome: "SUCCESS",
  },
  {
    id: uuid(), timestamp: "2026-06-15T13:15:00Z", actionType: "light_toggle",
    description: "Enabled artificial lighting for Zone 3 — beans & peas below PAR minimum",
    reasoning: "Beans & peas in Zone 3 at 30% growth receiving PAR 280 umol/m2/s, below optimal 300 minimum. Enabling artificial lighting to supplement solar irradiance during low-light season.",
    knowledgeBaseSource: "Crop Profiles — Beans/Peas light requirements", outcome: "SUCCESS",
  },
  {
    id: uuid(), timestamp: "2026-06-15T11:00:00Z", actionType: "set_zone_plan",
    description: "Adjusted Zone 4 plan: increased lettuce from 20% to 30%, reduced radish from 30% to 20%",
    reasoning: "Micronutrient analysis shows vitamin A and K coverage dropping below 60%. Lettuce is the primary source for both. Reallocating Zone 4 to prioritize lettuce over radish.",
    knowledgeBaseSource: "Human Nutritional Strategy — Micronutrient targets", outcome: "PENDING",
  },
  {
    id: uuid(), timestamp: "2026-06-15T08:00:00Z", actionType: "set_temperature",
    description: "Adjusted greenhouse temperature target from 22C to 20C",
    reasoning: "Energy deficit detected for 2 consecutive days. Reducing temperature target by 2C lowers heating cost. All crops within optimal range at 20C. KB: potato optimal 16-20C, beans 18-25C.",
    knowledgeBaseSource: null, outcome: "SUCCESS",
  },
  {
    id: uuid(), timestamp: "2026-06-14T22:00:00Z", actionType: "remove",
    description: "Removed severely stressed beans_peas crop in Zone 1 (crop_1_4)",
    reasoning: "Crop health at 22%, below recovery threshold of 30. Prolonged drought stress has irreversibly damaged the plant. Removing to free space for auto-replant per zone plan.",
    knowledgeBaseSource: "Plant Stress Guide — Recovery thresholds", outcome: "SUCCESS",
  },
];

// === Recommendations (real action types) ===
export const mockRecommendations: Recommendation[] = [
  {
    id: uuid(), createdAt: "2026-06-15T14:00:00Z", actionType: "set_zone_plan",
    description: "Consider reallocating Zone 1 to 70% potato, 30% beans_peas for calorie boost",
    reasoning: "Calorie greenhouse fraction at 16.9%, near lower bound of 15-25% target. Increasing potato allocation in Zone 1 could raise fraction to ~19%. However, this reduces protein from beans_peas.",
    confidence: 0.62, urgency: "MEDIUM", expiresAt: "2026-06-16T14:00:00Z", status: "PENDING",
  },
  {
    id: uuid(), createdAt: "2026-06-15T12:00:00Z", actionType: "water_adjust",
    description: "Increase water multiplier to 1.4x for Zone 1 ahead of dust storm",
    reasoning: "Forecast indicates dust storm approaching on SOL 146-147. Pre-hydrating potato zone provides buffer against potential water recycling degradation event.",
    confidence: 0.55, urgency: "LOW", expiresAt: "2026-06-17T12:00:00Z", status: "PENDING",
  },
  {
    id: uuid(), createdAt: "2026-06-15T10:00:00Z", actionType: "light_toggle",
    description: "Disable artificial lighting in Zone 4 during peak solar hours to conserve energy",
    reasoning: "Energy reserves at 84% but dust storm forecast may reduce solar generation. Herbs and lettuce in Zone 4 can tolerate reduced light for 6-hour window. Saves ~2.5 kWh/day.",
    confidence: 0.48, urgency: "LOW", expiresAt: "2026-06-18T10:00:00Z", status: "PENDING",
  },
];

// === Alerts ===
export const mockAlerts: Alert[] = [
  {
    id: uuid(), createdAt: "2026-06-15T13:45:00Z", resolvedAt: null,
    severity: "WARNING", type: "NUTRIENT_DEFICIENCY", cropId: CROP_IDS.beans_peas,
    slotId: "s1-0-3", greenhouseId: GH_ID,
    diagnosis: "Drought stress detected in beans & peas at Zone 1 slot 0-3. Soil moisture below 40% threshold. Water allocation may be insufficient for current growth stage.",
    confidence: 0.82, status: "OPEN", escalatedToHuman: false,
    suggestedAction: "Increase Zone 1 water multiplier from 1.2x to 1.4x. Monitor for 24 hours.",
  },
  {
    id: uuid(), createdAt: "2026-06-15T11:20:00Z", resolvedAt: null,
    severity: "INFO", type: "ENVIRONMENTAL_STRESS", cropId: CROP_IDS.herbs,
    slotId: "s1-3-0", greenhouseId: GH_ID,
    diagnosis: "Herbs in Zone 4 showing minor cold stress. Internal temperature at 18C after overnight temperature adjustment. Within acceptable range but suboptimal for herbs (optimal 18-24C).",
    confidence: 0.91, status: "OPEN", escalatedToHuman: false,
    suggestedAction: "Monitor — temperature target already at 20C, should recover during solar hours.",
  },
  {
    id: uuid(), createdAt: "2026-06-14T16:00:00Z", resolvedAt: "2026-06-14T18:30:00Z",
    severity: "CRITICAL", type: "EQUIPMENT_FAILURE", cropId: null,
    slotId: null, greenhouseId: GH_ID,
    diagnosis: "Water recycling rate dropped from 90% to 75%. Water recycling degradation event active since SOL 139. Gradual recovery underway.",
    confidence: 0.74, status: "RESOLVED", escalatedToHuman: true,
    suggestedAction: "Reduce water consumption across all zones. Agent decreased water multipliers automatically.",
  },
];

// === Agent Config ===
export const mockAgentConfig: AgentConfig = {
  autonomyLevel: "HYBRID",
  certaintyThreshold: 0.7,
  riskTolerance: "MODERATE",
  priorityWeights: { yield: 0.4, diversity: 0.3, resourceConservation: 0.3 },
};

// === Planting Queue ===
export const mockPlantingQueue: PlantingQueueItem[] = [
  { rank: 1, cropId: CROP_IDS.radish, cropName: "Radish", greenhouseId: GH_ID, recommendedPlantDate: "2026-06-16T08:00:00Z", missionDay: 143, reason: "Fast 25-day cycle fills vitamin C gap before dust storm window", nutritionalGapsAddressed: ["Vitamin C"] },
  { rank: 2, cropId: CROP_IDS.beans_peas, cropName: "Beans & Peas", greenhouseId: GH_ID, recommendedPlantDate: "2026-06-18T08:00:00Z", missionDay: 145, reason: "Protein greenhouse fraction at 15%, below 20% target. Beans/peas are the highest protein density crop available.", nutritionalGapsAddressed: ["Protein", "Iron", "Folate"] },
  { rank: 3, cropId: CROP_IDS.lettuce, cropName: "Lettuce", greenhouseId: GH_ID, recommendedPlantDate: "2026-06-20T08:00:00Z", missionDay: 147, reason: "Vitamin A and K coverage dropping. Lettuce provides both plus folate. Fast 30-day cycle fits before next review.", nutritionalGapsAddressed: ["Vitamin A", "Vitamin K", "Folate"] },
];

// === Harvest Journal ===
export const mockHarvestJournal: HarvestEntry[] = [
  { id: uuid(), harvestedAt: "2026-06-10T10:00:00Z", missionDay: 137, cropId: CROP_IDS.lettuce, cropName: "Lettuce", yieldKg: 1.8, slotId: "s1-1-0", greenhouseId: GH_ID, notes: "Excellent quality, no stress indicators" },
  { id: uuid(), harvestedAt: "2026-06-08T10:00:00Z", missionDay: 135, cropId: CROP_IDS.radish, cropName: "Radish", yieldKg: 0.9, slotId: "s1-2-3", greenhouseId: GH_ID, notes: null },
  { id: uuid(), harvestedAt: "2026-06-05T10:00:00Z", missionDay: 132, cropId: CROP_IDS.herbs, cropName: "Herbs", yieldKg: 0.6, slotId: "s1-3-0", greenhouseId: GH_ID, notes: "Good aroma, crew appreciated fresh herbs in meals" },
  { id: uuid(), harvestedAt: "2026-06-01T10:00:00Z", missionDay: 128, cropId: CROP_IDS.beans_peas, cropName: "Beans & Peas", yieldKg: 2.1, slotId: "s1-0-2", greenhouseId: GH_ID, notes: "First beans harvest of this cycle, good protein contribution" },
  { id: uuid(), harvestedAt: "2026-05-28T10:00:00Z", missionDay: 124, cropId: CROP_IDS.lettuce, cropName: "Lettuce", yieldKg: 1.6, slotId: "s1-1-1", greenhouseId: GH_ID, notes: null },
];

// === Stockpile (greenhouse-harvested food in storage) ===
export const mockStockpile: StockpileItem[] = [
  { cropId: CROP_IDS.potato, cropName: "Potato", quantityKg: 12.4, estimatedCalories: 9548, daysOfSupply: 4.2, expiresInDays: 30 },
  { cropId: CROP_IDS.beans_peas, cropName: "Beans & Peas", quantityKg: 5.2, estimatedCalories: 5200, daysOfSupply: 2.3, expiresInDays: 14 },
  { cropId: CROP_IDS.lettuce, cropName: "Lettuce", quantityKg: 3.4, estimatedCalories: 510, daysOfSupply: 0.2, expiresInDays: 5 },
  { cropId: CROP_IDS.radish, cropName: "Radish", quantityKg: 1.5, estimatedCalories: 240, daysOfSupply: 0.1, expiresInDays: 7 },
  { cropId: CROP_IDS.herbs, cropName: "Herbs", quantityKg: 0.8, estimatedCalories: 120, daysOfSupply: 0.05, expiresInDays: 3 },
];

// === Stored Food (crew arrives with 5.4M kcal, consumed daily) ===
export const mockStoredFood: StoredFood = {
  totalCalories: 5400000,
  remainingCalories: 4200000,
};

// === Nutrition (crew of 4, 12,000 kcal/day target) ===
// Deterministic data — no Math.random() to avoid SSR hydration mismatch
const _nutritionSeed = [0.42, 0.67, 0.23, 0.81, 0.55, 0.34, 0.73];
export const mockNutritionEntries: DailyNutritionEntry[] = _nutritionSeed.map((s, i) => {
  const ghFraction = +(0.15 + s * 0.08).toFixed(3);
  return {
    date: new Date(2026, 5, 9 + i).toISOString(),
    totalCalories: 12000,
    proteinG: Math.round(380 + s * 40),
    carbsG: Math.round(1200 + s * 200),
    fatG: Math.round(380 + s * 60),
    fiberG: Math.round(90 + s * 30),
    targetCalories: 12000,
    coveragePercent: 100,
    micronutrients: {
      vitaminAMcg: Math.round(2400 + s * 1200),
      vitaminCMg: Math.round(240 + s * 120),
      vitaminKMcg: Math.round(320 + s * 160),
      folateMcg: Math.round(1200 + s * 400),
      ironMg: Math.round(50 + s * 22),
      potassiumMg: Math.round(10000 + s * 3600),
      magnesiumMg: Math.round(1200 + s * 400),
    },
    calorieGhFraction: ghFraction,
    proteinGhFraction: +(0.12 + s * 0.08).toFixed(3),
    micronutrientsCovered: s > 0.3 ? 7 : 5 + Math.floor(s * 2),
  };
});

// === Coverage Heatmap (7 micronutrients × 14 days) ===
export const mockCoverageHeatmap: CoverageHeatmap = {
  nutrients: ["Vitamin A", "Vitamin C", "Vitamin K", "Folate", "Iron", "Potassium", "Magnesium"],
  missionDays: Array.from({ length: 14 }, (_, i) => 129 + i),
  coverage: [
    [88, 92, 85, 95, 90, 87, 84, 93, 89, 86, 83, 91, 94, 89],
    [52, 48, 55, 61, 57, 50, 45, 58, 54, 49, 46, 53, 59, 55],
    [90, 94, 87, 96, 92, 89, 85, 95, 91, 88, 84, 93, 97, 92],
    [70, 65, 72, 78, 74, 68, 63, 76, 72, 67, 64, 71, 77, 73],
    [45, 42, 48, 55, 50, 44, 40, 52, 47, 43, 41, 49, 54, 48],
    [78, 82, 75, 88, 84, 80, 76, 86, 82, 79, 77, 83, 87, 83],
    [60, 55, 62, 68, 64, 58, 54, 66, 61, 57, 53, 63, 67, 62],
  ],
};

// === Forecast ===
const _forecastNoise = [0.4,0.7,0.2,0.9,0.5,0.6,0.3,0.8,0.1,0.75,0.45,0.65,0.35,0.85,0.55,0.25,0.95,0.15,0.78,0.42,0.68,0.32,0.88,0.52,0.62,0.28,0.82,0.48,0.72,0.38];
export const mockResourceForecast: ResourceProjection[] = Array.from({ length: 30 }, (_, i) => {
  const day = 142 + i;
  const stormDip = (day >= 146 && day <= 148) ? 8 : 0;
  const n = _forecastNoise[i];
  return {
    missionDay: day,
    waterReservePercent: Math.max(20, 73 - i * 0.8 - stormDip + n * 2),
    nutrientReservePercent: Math.max(15, 58 - i * 0.6 + n * 2),
    energyReservePercent: Math.max(25, 84 - i * 0.5 - stormDip * 1.5 + n * 2),
    riskLevel: i > 25 ? "HIGH" : i > 15 ? "MODERATE" : "LOW",
  };
});

export const mockMissionTimeline: MissionTimeline = {
  missionStartDate: "2026-01-25T00:00:00Z",
  missionEndDate: "2027-04-19T00:00:00Z",
  currentMissionDay: 142,
  totalMissionDays: 450,
  milestones: [
    { missionDay: 145, date: "2026-06-18T00:00:00Z", type: "HARVEST_WINDOW", label: "Lettuce harvest window (Zone 2)", cropId: CROP_IDS.lettuce },
    { missionDay: 148, date: "2026-06-21T00:00:00Z", type: "HARVEST_WINDOW", label: "Herbs harvest ready (Zone 4)", cropId: CROP_IDS.herbs },
    { missionDay: 155, date: "2026-06-28T00:00:00Z", type: "HARVEST_WINDOW", label: "Radish harvest (Zone 2, Zone 3)", cropId: CROP_IDS.radish },
    { missionDay: 165, date: "2026-07-08T00:00:00Z", type: "HARVEST_WINDOW", label: "Beans & peas harvest (Zone 1, Zone 3)", cropId: CROP_IDS.beans_peas },
    { missionDay: 200, date: "2026-08-12T00:00:00Z", type: "RESOURCE_CRITICAL", label: "Water reserves projected below 30%", cropId: null },
    { missionDay: 360, date: "2026-12-20T00:00:00Z", type: "PLANTING_DEADLINE", label: "Last planting window for 90-day potato crop", cropId: CROP_IDS.potato },
    { missionDay: 450, date: "2027-04-19T00:00:00Z", type: "TRIP_END", label: "Mission end — surface departure", cropId: null },
  ],
};

// === Simulations ===
export const mockSimulations: SimulationSummary[] = [
  {
    id: SIM_ID, name: "Baseline Run — Balanced Config", learningGoal: "Establish baseline performance with default agent settings",
    status: "RUNNING", createdAt: "2026-06-01T08:00:00Z", completedAt: null,
    missionDuration: 450, crewSize: 4, yieldTarget: 500,
    outcomeScore: null, autonomyLevel: "HYBRID", riskTolerance: "MODERATE",
  },
];

export const mockSimulationDetail: SimulationDetail = {
  ...mockSimulations[0],
  resourceAvailability: { waterLiters: 10000, nutrientKg: 500, energyKwh: 50000 },
  agentConfig: mockAgentConfig,
  currentMetrics: {
    missionDay: 142, waterReservePercent: 73, nutrientReservePercent: 58,
    energyReservePercent: 84, totalYieldKg: 42.8,
  },
};

// === Scenarios (2 core events from sim engine) ===
export const mockScenarios: Scenario[] = [
  { id: uuid(), name: "Water Recycling Degradation", type: "WATER_RECYCLING_DEGRADATION", description: "Water recycling efficiency drops to 70-80% for 5-15 sols. Tests agent water conservation and crop prioritization under resource constraints.", severity: "HIGH", defaultDurationMinutes: null },
  { id: uuid(), name: "Temperature Control Failure", type: "TEMPERATURE_FAILURE", description: "Internal temperature drifts +/-5C from target for 1-3 sols. Agent must manage crop stress thresholds and energy allocation for heating.", severity: "MEDIUM", defaultDurationMinutes: null },
];

// === Analytics ===
export const mockAgentPerformance: AgentPerformance = {
  simulationId: SIM_ID, simulationName: "Baseline Run — Balanced Config",
  status: "RUNNING", decisionAccuracyPercent: 87, avgResponseTimeMs: 1200,
  resourceEfficiencyScore: 74, nutritionalTargetHitRate: 0.82,
  diversityScore: 68, autonomousActionsCount: 342, humanOverridesCount: 18,
  crisisResponseScore: 79,
};

// === Slot History (mock snapshots for slot s1-1-0, lettuce at 85%) ===
export const mockSlotHistory: SlotHistorySnapshot[] = Array.from({ length: 14 }, (_, i) => ({
  timestamp: new Date(2026, 5, 2 + i).toISOString(),
  missionDay: 129 + i,
  status: (i < 10 ? "HEALTHY" : "NEEDS_ATTENTION") as SlotHistorySnapshot["status"],
  growthStagePercent: Math.min(100, 20 + i * 5),
  estimatedYieldKg: +(0.2 + i * 0.12).toFixed(2),
  activeStressTypes: i >= 10 ? (["DROUGHT"] as SlotHistorySnapshot["activeStressTypes"]) : [],
}));

// === Timeline Events (simulation event log) ===
export const mockTimelineEvents: TimelineEvent[] = [
  { id: uuid(), timestamp: "2026-06-15T14:30:00Z", missionDay: 142, type: "AGENT_ACTION", summary: "Agent adjusted water multiplier for Zone 2", payload: { actionType: "water_adjust", zone: 2, value: 1.3 } },
  { id: uuid(), timestamp: "2026-06-15T13:15:00Z", missionDay: 142, type: "AGENT_ACTION", summary: "Agent enabled artificial lighting for Zone 3", payload: { actionType: "light_toggle", zone: 3, enabled: true } },
  { id: uuid(), timestamp: "2026-06-15T12:00:00Z", missionDay: 142, type: "SENSOR_SNAPSHOT", summary: "Sensor readings recorded", payload: { temperature: 20.0, humidity: 62, co2: 1000 } },
  { id: uuid(), timestamp: "2026-06-15T08:00:00Z", missionDay: 142, type: "STRESS_DETECTED", summary: "Drought stress detected in slot s1-0-3", payload: { slotId: "s1-0-3", stressType: "DROUGHT", cropName: "Beans & Peas" } },
  { id: uuid(), timestamp: "2026-06-14T22:00:00Z", missionDay: 141, type: "HARVEST", summary: "Lettuce harvested from slot s1-1-0 (1.8 kg)", payload: { slotId: "s1-1-0", cropName: "Lettuce", yieldKg: 1.8 } },
  { id: uuid(), timestamp: "2026-06-14T16:00:00Z", missionDay: 141, type: "SCENARIO_INJECTED", summary: "Water recycling degradation event triggered", payload: { scenarioType: "WATER_RECYCLING_DEGRADATION", intensity: 0.7 } },
  { id: uuid(), timestamp: "2026-06-14T10:00:00Z", missionDay: 141, type: "STRESS_RESOLVED", summary: "Cold stress resolved in slot s1-3-0", payload: { slotId: "s1-3-0", stressType: "COLD", cropName: "Herbs" } },
  { id: uuid(), timestamp: "2026-06-14T06:00:00Z", missionDay: 141, type: "SLOT_SNAPSHOT", summary: "Slot snapshots recorded for all 16 slots", payload: { totalSlots: 16, healthy: 13, needsAttention: 2, empty: 1 } },
];

// === Scenario Injections (active/past injections for current sim) ===
export const mockInjections: ScenarioInjection[] = [
  { id: uuid(), scenarioId: mockScenarios[0]?.id ?? uuid(), scenarioName: "Water Recycling Degradation", triggeredAt: "2026-06-14T16:00:00Z", resolvedAt: "2026-06-14T18:30:00Z", intensity: 0.7, status: "RESOLVED" },
];

// === Initial Simulation State ===
export const initialSimulationState: SimulationState = {
  currentMissionDay: 142,
  totalMissionDays: 450,
  speed: 0,
  isRunning: false,
  greenhouses: mockGreenhouses,
  selectedGreenhouseId: GH_ID,
  resources: { waterReservePercent: 73, nutrientReservePercent: 58, energyReservePercent: 84 },
  weather: mockWeather,
  alerts: mockAlerts,
  agentLog: mockAgentLog,
  recommendations: mockRecommendations,
};

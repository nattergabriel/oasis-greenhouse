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
  SimulationState,
} from "./types";

// === Helper ===
const uuid = () => crypto.randomUUID();

// Pre-generated stable IDs
const GH_ALPHA_ID = "a1000000-0000-0000-0000-000000000001";
const GH_BETA_ID = "a1000000-0000-0000-0000-000000000002";
const SIM_ID = "b1000000-0000-0000-0000-000000000001";

// Crop IDs
const CROP_IDS = {
  lettuce: "c1000000-0000-0000-0000-000000000001",
  tomato: "c1000000-0000-0000-0000-000000000002",
  potato: "c1000000-0000-0000-0000-000000000003",
  spinach: "c1000000-0000-0000-0000-000000000004",
  soybean: "c1000000-0000-0000-0000-000000000005",
  wheat: "c1000000-0000-0000-0000-000000000006",
  radish: "c1000000-0000-0000-0000-000000000007",
  basil: "c1000000-0000-0000-0000-000000000008",
};

// === Crops ===
export const mockCrops: Crop[] = [
  {
    id: CROP_IDS.lettuce,
    name: "Lettuce",
    category: "VEGETABLE",
    growthDays: 30,
    harvestIndex: 0.85,
    typicalYieldPerM2Kg: 3.2,
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
    id: CROP_IDS.tomato,
    name: "Tomato",
    category: "VEGETABLE",
    growthDays: 80,
    harvestIndex: 0.65,
    typicalYieldPerM2Kg: 8.5,
    waterRequirement: "HIGH",
    environmentalRequirements: {
      optimalTempMinC: 20, optimalTempMaxC: 28, heatStressThresholdC: 35,
      optimalHumidityMinPct: 60, optimalHumidityMaxPct: 80,
      lightRequirementParMin: 300, lightRequirementParMax: 600,
      optimalCo2PpmMin: 800, optimalCo2PpmMax: 1200,
      optimalPhMin: 5.5, optimalPhMax: 6.8,
    },
    stressSensitivities: ["COLD", "NUTRIENT_DEFICIENCY_K"],
    nutritionalProfile: {
      caloriesPer100g: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2, fiberG: 1.2,
      micronutrients: { vitaminAMcg: 42, vitaminCMg: 14, vitaminKMcg: 7.9, folateMcg: 15, ironMg: 0.3, potassiumMg: 237, magnesiumMg: 11 },
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
    id: CROP_IDS.spinach,
    name: "Spinach",
    category: "VEGETABLE",
    growthDays: 35,
    harvestIndex: 0.9,
    typicalYieldPerM2Kg: 2.8,
    waterRequirement: "MEDIUM",
    environmentalRequirements: {
      optimalTempMinC: 10, optimalTempMaxC: 20, heatStressThresholdC: 25,
      optimalHumidityMinPct: 45, optimalHumidityMaxPct: 65,
      lightRequirementParMin: 200, lightRequirementParMax: 400,
      optimalCo2PpmMin: 800, optimalCo2PpmMax: 1200,
      optimalPhMin: 6.0, optimalPhMax: 7.0,
    },
    stressSensitivities: ["HEAT", "LIGHT_EXCESSIVE"],
    nutritionalProfile: {
      caloriesPer100g: 23, proteinG: 2.9, carbsG: 3.6, fatG: 0.4, fiberG: 2.2,
      micronutrients: { vitaminAMcg: 469, vitaminCMg: 28, vitaminKMcg: 483, folateMcg: 194, ironMg: 2.7, potassiumMg: 558, magnesiumMg: 79 },
    },
  },
  {
    id: CROP_IDS.soybean,
    name: "Soybean",
    category: "LEGUME",
    growthDays: 60,
    harvestIndex: 0.55,
    typicalYieldPerM2Kg: 3.0,
    waterRequirement: "MEDIUM",
    environmentalRequirements: {
      optimalTempMinC: 18, optimalTempMaxC: 25, heatStressThresholdC: 32,
      optimalHumidityMinPct: 60, optimalHumidityMaxPct: 80,
      lightRequirementParMin: 300, lightRequirementParMax: 600,
      optimalCo2PpmMin: 800, optimalCo2PpmMax: 1200,
      optimalPhMin: 6.0, optimalPhMax: 6.8,
    },
    stressSensitivities: ["DROUGHT", "COLD"],
    nutritionalProfile: {
      caloriesPer100g: 100, proteinG: 7.0, carbsG: 15.0, fatG: 1.5, fiberG: 5.0,
      micronutrients: { vitaminAMcg: 1, vitaminCMg: 6, vitaminKMcg: 47, folateMcg: 375, ironMg: 15.7, potassiumMg: 1797, magnesiumMg: 280 },
    },
  },
  {
    id: CROP_IDS.wheat,
    name: "Wheat",
    category: "GRAIN",
    growthDays: 120,
    harvestIndex: 0.4,
    typicalYieldPerM2Kg: 3.5,
    waterRequirement: "LOW",
    environmentalRequirements: {
      optimalTempMinC: 15, optimalTempMaxC: 24, heatStressThresholdC: 32,
      optimalHumidityMinPct: 40, optimalHumidityMaxPct: 60,
      lightRequirementParMin: 300, lightRequirementParMax: 600,
      optimalCo2PpmMin: 800, optimalCo2PpmMax: 1200,
      optimalPhMin: 6.0, optimalPhMax: 7.0,
    },
    stressSensitivities: ["DROUGHT", "NUTRIENT_DEFICIENCY_N"],
    nutritionalProfile: {
      caloriesPer100g: 340, proteinG: 13.2, carbsG: 72, fatG: 2.5, fiberG: 10.7,
      micronutrients: { vitaminAMcg: 0, vitaminCMg: 0, vitaminKMcg: 1.9, folateMcg: 38, ironMg: 3.2, potassiumMg: 363, magnesiumMg: 126 },
    },
  },
  {
    id: CROP_IDS.radish,
    name: "Radish",
    category: "VEGETABLE",
    growthDays: 25,
    harvestIndex: 0.7,
    typicalYieldPerM2Kg: 3.0,
    waterRequirement: "MEDIUM",
    environmentalRequirements: {
      optimalTempMinC: 15, optimalTempMaxC: 22, heatStressThresholdC: 25,
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
    id: CROP_IDS.basil,
    name: "Basil",
    category: "HERB",
    growthDays: 28,
    harvestIndex: 0.8,
    typicalYieldPerM2Kg: 1.5,
    waterRequirement: "MEDIUM",
    environmentalRequirements: {
      optimalTempMinC: 20, optimalTempMaxC: 28, heatStressThresholdC: 35,
      optimalHumidityMinPct: 50, optimalHumidityMaxPct: 70,
      lightRequirementParMin: 250, lightRequirementParMax: 500,
      optimalCo2PpmMin: 800, optimalCo2PpmMax: 1200,
      optimalPhMin: 5.5, optimalPhMax: 6.5,
    },
    stressSensitivities: ["COLD", "DROUGHT"],
    nutritionalProfile: {
      caloriesPer100g: 23, proteinG: 3.2, carbsG: 2.7, fatG: 0.6, fiberG: 1.6,
      micronutrients: { vitaminAMcg: 264, vitaminCMg: 18, vitaminKMcg: 415, folateMcg: 68, ironMg: 3.2, potassiumMg: 295, magnesiumMg: 64 },
    },
  },
];

// === Slots for Greenhouse Alpha (4x6 = 24 slots) ===
function makeSlot(row: number, col: number, cropKey?: keyof typeof CROP_IDS, growth?: number, stress?: string[]): PlantSlot {
  const crop = cropKey ? mockCrops.find(c => c.id === CROP_IDS[cropKey]) : null;
  const growthPct = growth ?? 0;
  const daysUntilHarvest = crop ? Math.round(crop.growthDays * (1 - growthPct / 100)) : null;

  return {
    id: `s1-${row}-${col}`,
    position: { row, col },
    cropId: crop?.id ?? null,
    cropName: crop?.name ?? null,
    status: !crop ? "EMPTY" : (stress && stress.length > 0) ? "NEEDS_ATTENTION" : growthPct > 90 ? "HEALTHY" : "HEALTHY",
    growthStagePercent: cropKey ? growthPct : 0,
    daysUntilHarvest,
    plantedAt: cropKey ? "2026-01-15T08:00:00Z" : null,
    activeStressTypes: (stress ?? []) as PlantSlot["activeStressTypes"],
    estimatedYieldKg: crop ? +(crop.typicalYieldPerM2Kg * 0.5 * (growthPct / 100)).toFixed(2) : null,
  };
}

const alphaSlots: PlantSlot[] = [
  makeSlot(0, 0, "lettuce", 85), makeSlot(0, 1, "lettuce", 78), makeSlot(0, 2, "spinach", 62),
  makeSlot(0, 3, "spinach", 55), makeSlot(0, 4, "basil", 90), makeSlot(0, 5, "basil", 88),
  makeSlot(1, 0, "tomato", 45), makeSlot(1, 1, "tomato", 42, ["NUTRIENT_DEFICIENCY_K"]),
  makeSlot(1, 2, "tomato", 40), makeSlot(1, 3, "tomato", 38), makeSlot(1, 4, "radish", 70),
  makeSlot(1, 5, "radish", 65),
  makeSlot(2, 0, "potato", 30), makeSlot(2, 1, "potato", 28), makeSlot(2, 2, "potato", 25),
  makeSlot(2, 3, "soybean", 20), makeSlot(2, 4, "soybean", 18), makeSlot(2, 5),
  makeSlot(3, 0, "wheat", 15), makeSlot(3, 1, "wheat", 12), makeSlot(3, 2, "wheat", 10),
  makeSlot(3, 3, "wheat", 8), makeSlot(3, 4), makeSlot(3, 5),
];

const betaSlots: PlantSlot[] = [
  makeSlot(0, 0, "lettuce", 95), makeSlot(0, 1, "spinach", 80, ["LIGHT_INSUFFICIENT"]),
  makeSlot(0, 2, "radish", 50), makeSlot(0, 3, "basil", 70),
  makeSlot(1, 0, "tomato", 60), makeSlot(1, 1, "soybean", 35),
  makeSlot(1, 2, "potato", 45), makeSlot(1, 3),
  makeSlot(2, 0, "wheat", 25), makeSlot(2, 1, "wheat", 22),
  makeSlot(2, 2), makeSlot(2, 3),
].map(s => ({ ...s, id: s.id.replace("s1-", "s2-") }));

// === Greenhouses ===
export const mockGreenhouses: GreenhouseSummary[] = [
  {
    id: GH_ALPHA_ID,
    name: "Greenhouse Alpha",
    description: "Primary growing facility — mixed crops",
    rows: 4, cols: 6, totalSlots: 24,
    occupiedSlots: alphaSlots.filter(s => s.cropId).length,
    overallStatus: "NEEDS_ATTENTION",
  },
  {
    id: GH_BETA_ID,
    name: "Greenhouse Beta",
    description: "Secondary facility — fast-cycle crops",
    rows: 3, cols: 4, totalSlots: 12,
    occupiedSlots: betaSlots.filter(s => s.cropId).length,
    overallStatus: "NEEDS_ATTENTION",
  },
];

export const mockGreenhouseDetails: Record<string, GreenhouseDetail> = {
  [GH_ALPHA_ID]: {
    ...mockGreenhouses[0],
    slots: alphaSlots,
    resources: { waterReservePercent: 73, nutrientReservePercent: 58, energyReservePercent: 84 },
  },
  [GH_BETA_ID]: {
    ...mockGreenhouses[1],
    slots: betaSlots,
    resources: { waterReservePercent: 68, nutrientReservePercent: 62, energyReservePercent: 79 },
  },
};

// === Sensors ===
export const mockSensorSnapshot: SensorSnapshot = {
  timestamp: "2026-06-15T14:32:00Z",
  temperature: { value: 24.2, status: "NORMAL" },
  humidity: { value: 68, status: "NORMAL" },
  lightIntensity: { value: 18500, status: "NORMAL" },
  par: { value: 420, status: "NORMAL" },
  lightCyclePhase: "DAY",
  co2: { value: 1050, status: "NORMAL" },
  waterFlowRate: { value: 2.4, status: "NORMAL" },
  waterRecyclingEfficiency: { value: 94, status: "NORMAL" },
  nutrientSolution: {
    ph: { value: 6.1, status: "NORMAL" },
    ec: { value: 2.1, status: "WARNING" },
    dissolvedOxygen: { value: 7.2, status: "NORMAL" },
  },
};

export const mockSensorHistory: SensorHistoryReading[] = Array.from({ length: 24 }, (_, i) => ({
  timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
  temperature: 23 + Math.sin(i / 4) * 2 + Math.random() * 0.5,
  humidity: 65 + Math.sin(i / 6) * 5 + Math.random() * 2,
  lightIntensity: i >= 6 && i <= 18 ? 15000 + Math.random() * 5000 : 200 + Math.random() * 100,
  par: i >= 6 && i <= 18 ? 380 + Math.random() * 80 : 10 + Math.random() * 5,
  co2: 1000 + Math.sin(i / 3) * 100 + Math.random() * 30,
  waterFlowRate: 2.2 + Math.random() * 0.5,
  waterRecyclingEfficiency: 93 + Math.random() * 2,
  nutrientSolutionPh: 6.0 + Math.random() * 0.3,
  nutrientSolutionEc: 1.9 + Math.random() * 0.4,
  nutrientSolutionDissolvedOxygen: 7.0 + Math.random() * 0.5,
}));

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

// === Agent Log ===
export const mockAgentLog: AgentLogEntry[] = [
  {
    id: uuid(), timestamp: "2026-06-15T14:30:00Z", actionType: "IRRIGATION_ADJUSTED",
    description: "Increased water flow to Zone 1 by 12% — lettuce showing early drought indicators",
    reasoning: "Sensor EC reading 2.1 mS/cm exceeds optimal 1.8 for lettuce at 85% growth. KB #3 Crop Profiles: lettuce at harvest stage requires increased water uptake. Increasing flow to compensate.",
    knowledgeBaseSource: "Crop Profiles — Lettuce hydration requirements", outcome: "SUCCESS",
  },
  {
    id: uuid(), timestamp: "2026-06-15T13:15:00Z", actionType: "LIGHT_CYCLE_MODIFIED",
    description: "Extended day cycle by 30 minutes for tomato section",
    reasoning: "Tomato growth at 42% is 3 days behind projected schedule. PAR readings averaging 380 µmol/m²/s, below optimal 450 for fruiting stage. Extending photoperiod to compensate.",
    knowledgeBaseSource: "Crop Profiles — Tomato light requirements", outcome: "SUCCESS",
  },
  {
    id: uuid(), timestamp: "2026-06-15T11:00:00Z", actionType: "NUTRIENT_DOSED",
    description: "Added potassium supplement to tomato section nutrient feed",
    reasoning: "Slot 1-1 tomato showing potassium deficiency stress. Leaf edge browning detected at sensor zone. KB #4: K deficiency in tomatoes requires immediate supplementation at 150ppm K₂O.",
    knowledgeBaseSource: "Plant Stress Guide — Potassium deficiency", outcome: "PENDING",
  },
  {
    id: uuid(), timestamp: "2026-06-15T08:00:00Z", actionType: "IRRIGATION_ADJUSTED",
    description: "Morning irrigation cycle — standard routine adjustment for all zones",
    reasoning: "Daily morning irrigation based on overnight evapotranspiration calculations. All zones within normal parameters. Standard 2.4 L/min flow rate maintained.",
    knowledgeBaseSource: null, outcome: "SUCCESS",
  },
  {
    id: uuid(), timestamp: "2026-06-14T22:00:00Z", actionType: "LIGHT_CYCLE_MODIFIED",
    description: "Switched all zones to night cycle — LEDs off, UV supplementation standby",
    reasoning: "Standard 16h/8h photoperiod schedule. Solar irradiance below threshold at 22:00 Mars local time. Switching to night mode.",
    knowledgeBaseSource: null, outcome: "SUCCESS",
  },
];

// === Recommendations ===
export const mockRecommendations: Recommendation[] = [
  {
    id: uuid(), createdAt: "2026-06-15T14:00:00Z", actionType: "CROP_REMOVAL_SUGGESTED",
    description: "Consider harvesting lettuce in slots 0-0 and 0-1 early — growth at 85% and 78%",
    reasoning: "Dust storm forecast for days 146-147 may reduce energy reserves. Harvesting now locks in ~2.7kg yield rather than risking stress damage during storm. However, waiting 3 more days could add 0.4kg yield if storm passes quickly.",
    confidence: 0.62, urgency: "MEDIUM", expiresAt: "2026-06-16T14:00:00Z", status: "PENDING",
  },
  {
    id: uuid(), createdAt: "2026-06-15T12:00:00Z", actionType: "IRRIGATION_INCREASE",
    description: "Increase base irrigation rate by 8% for next 48 hours",
    reasoning: "Forecast indicates dust storm approaching. Reduced solar irradiance will lower greenhouse temperature, but crops may need pre-hydration buffer. Confidence is below threshold because the storm severity is uncertain.",
    confidence: 0.55, urgency: "LOW", expiresAt: "2026-06-17T12:00:00Z", status: "PENDING",
  },
  {
    id: uuid(), createdAt: "2026-06-15T10:00:00Z", actionType: "PLANTING_SUGGESTED",
    description: "Plant radish in empty slots 2-5 and 3-4 — fast harvest before storm window",
    reasoning: "Radish has 25-day growth cycle. If planted now, harvest by SOL 167. This fills a vitamin C gap identified in nutritional analysis. However, planting during pre-storm period carries resource risk.",
    confidence: 0.48, urgency: "LOW", expiresAt: "2026-06-18T10:00:00Z", status: "PENDING",
  },
];

// === Alerts ===
export const mockAlerts: Alert[] = [
  {
    id: uuid(), createdAt: "2026-06-15T13:45:00Z", resolvedAt: null,
    severity: "WARNING", type: "NUTRIENT_DEFICIENCY", cropId: CROP_IDS.tomato,
    slotId: "s1-1-1", greenhouseId: GH_ALPHA_ID,
    diagnosis: "Potassium deficiency detected in tomato at slot 1-1. Leaf edge browning and weak stem development observed. EC reading 2.1 mS/cm indicates nutrient imbalance.",
    confidence: 0.82, status: "OPEN", escalatedToHuman: false,
    suggestedAction: "Apply potassium supplement at 150ppm K₂O concentration. Monitor EC levels for 24 hours.",
  },
  {
    id: uuid(), createdAt: "2026-06-15T11:20:00Z", resolvedAt: null,
    severity: "INFO", type: "ENVIRONMENTAL_STRESS", cropId: CROP_IDS.spinach,
    slotId: "s2-0-1", greenhouseId: GH_BETA_ID,
    diagnosis: "Spinach in Beta greenhouse slot 0-1 receiving suboptimal light. PAR reading 180 µmol/m²/s, below minimum 200 for spinach.",
    confidence: 0.91, status: "OPEN", escalatedToHuman: false,
    suggestedAction: "Reposition supplemental LED panel or swap slot with less light-sensitive crop.",
  },
  {
    id: uuid(), createdAt: "2026-06-14T16:00:00Z", resolvedAt: "2026-06-14T18:30:00Z",
    severity: "CRITICAL", type: "EQUIPMENT_FAILURE", cropId: null,
    slotId: null, greenhouseId: GH_ALPHA_ID,
    diagnosis: "Water flow sensor in Alpha greenhouse reported intermittent readings. Flow rate oscillating between 0 and 4.8 L/min — possible pump cavitation or sensor malfunction.",
    confidence: 0.74, status: "RESOLVED", escalatedToHuman: true,
    suggestedAction: "Inspect pump intake for debris. Recalibrate flow sensor. If sensor fault, switch to backup.",
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
  { rank: 1, cropId: CROP_IDS.radish, cropName: "Radish", greenhouseId: GH_ALPHA_ID, recommendedPlantDate: "2026-06-16T08:00:00Z", missionDay: 143, reason: "Fast 25-day cycle fills vitamin C gap before dust storm window", nutritionalGapsAddressed: ["Vitamin C"] },
  { rank: 2, cropId: CROP_IDS.spinach, cropName: "Spinach", greenhouseId: GH_ALPHA_ID, recommendedPlantDate: "2026-06-18T08:00:00Z", missionDay: 145, reason: "Iron and folate coverage dropping below 60%. Spinach is the highest-density source available.", nutritionalGapsAddressed: ["Iron", "Folate", "Vitamin K"] },
  { rank: 3, cropId: CROP_IDS.soybean, cropName: "Soybean", greenhouseId: GH_BETA_ID, recommendedPlantDate: "2026-06-20T08:00:00Z", missionDay: 147, reason: "Protein intake projected to fall below target by SOL 200. Soybean provides 36g protein per 100g.", nutritionalGapsAddressed: ["Protein", "Iron"] },
];

// === Harvest Journal ===
export const mockHarvestJournal: HarvestEntry[] = [
  { id: uuid(), harvestedAt: "2026-06-10T10:00:00Z", missionDay: 137, cropId: CROP_IDS.lettuce, cropName: "Lettuce", yieldKg: 1.8, slotId: "s1-0-4", greenhouseId: GH_ALPHA_ID, notes: "Excellent quality, no stress indicators" },
  { id: uuid(), harvestedAt: "2026-06-08T10:00:00Z", missionDay: 135, cropId: CROP_IDS.radish, cropName: "Radish", yieldKg: 0.9, slotId: "s2-0-2", greenhouseId: GH_BETA_ID, notes: null },
  { id: uuid(), harvestedAt: "2026-06-05T10:00:00Z", missionDay: 132, cropId: CROP_IDS.spinach, cropName: "Spinach", yieldKg: 1.4, slotId: "s1-0-2", greenhouseId: GH_ALPHA_ID, notes: "Slight iron deficiency signs in older leaves" },
  { id: uuid(), harvestedAt: "2026-06-01T10:00:00Z", missionDay: 128, cropId: CROP_IDS.basil, cropName: "Basil", yieldKg: 0.6, slotId: "s2-0-3", greenhouseId: GH_BETA_ID, notes: null },
  { id: uuid(), harvestedAt: "2026-05-28T10:00:00Z", missionDay: 124, cropId: CROP_IDS.lettuce, cropName: "Lettuce", yieldKg: 1.6, slotId: "s1-0-0", greenhouseId: GH_ALPHA_ID, notes: null },
];

// === Stockpile ===
export const mockStockpile: StockpileItem[] = [
  { cropId: CROP_IDS.potato, cropName: "Potato", quantityKg: 12.4, estimatedCalories: 9548, daysOfSupply: 4.2, expiresInDays: 30 },
  { cropId: CROP_IDS.wheat, cropName: "Wheat", quantityKg: 8.6, estimatedCalories: 29240, daysOfSupply: 12.8, expiresInDays: 180 },
  { cropId: CROP_IDS.soybean, cropName: "Soybean", quantityKg: 5.2, estimatedCalories: 23192, daysOfSupply: 10.1, expiresInDays: 120 },
  { cropId: CROP_IDS.lettuce, cropName: "Lettuce", quantityKg: 3.4, estimatedCalories: 510, daysOfSupply: 0.2, expiresInDays: 5 },
  { cropId: CROP_IDS.spinach, cropName: "Spinach", quantityKg: 2.1, estimatedCalories: 483, daysOfSupply: 0.2, expiresInDays: 4 },
  { cropId: CROP_IDS.radish, cropName: "Radish", quantityKg: 1.5, estimatedCalories: 240, daysOfSupply: 0.1, expiresInDays: 7 },
];

// === Nutrition ===
export const mockNutritionEntries: DailyNutritionEntry[] = Array.from({ length: 7 }, (_, i) => {
  const day = 136 + i;
  const baseCalories = 8500 + Math.random() * 2500;
  return {
    date: new Date(2026, 5, 9 + i).toISOString(),
    totalCalories: Math.round(baseCalories),
    proteinG: Math.round(50 + Math.random() * 40),
    carbsG: Math.round(200 + Math.random() * 100),
    fatG: Math.round(30 + Math.random() * 20),
    fiberG: Math.round(20 + Math.random() * 10),
    targetCalories: 10000,
    coveragePercent: Math.round(baseCalories / 100),
    micronutrients: {
      vitaminAMcg: Math.round(600 + Math.random() * 300),
      vitaminCMg: Math.round(50 + Math.random() * 40),
      vitaminKMcg: Math.round(80 + Math.random() * 40),
      folateMcg: Math.round(200 + Math.random() * 200),
      ironMg: Math.round(10 + Math.random() * 8),
      potassiumMg: Math.round(2000 + Math.random() * 1500),
      magnesiumMg: Math.round(200 + Math.random() * 150),
    },
  };
});

export const mockCoverageHeatmap: CoverageHeatmap = {
  nutrients: ["Calories", "Protein", "Vitamin A", "Vitamin C", "Vitamin K", "Folate", "Iron", "Potassium", "Magnesium"],
  missionDays: Array.from({ length: 14 }, (_, i) => 129 + i),
  coverage: [
    [82, 85, 78, 91, 88, 84, 79, 92, 87, 83, 80, 86, 90, 85],
    [65, 70, 58, 72, 68, 64, 60, 75, 71, 66, 62, 69, 73, 68],
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
export const mockResourceForecast: ResourceProjection[] = Array.from({ length: 30 }, (_, i) => {
  const day = 142 + i;
  const stormDip = (day >= 146 && day <= 148) ? 8 : 0;
  return {
    missionDay: day,
    waterReservePercent: Math.max(20, 73 - i * 0.8 - stormDip + Math.random() * 2),
    nutrientReservePercent: Math.max(15, 58 - i * 0.6 + Math.random() * 2),
    energyReservePercent: Math.max(25, 84 - i * 0.5 - stormDip * 1.5 + Math.random() * 2),
    riskLevel: i > 25 ? "HIGH" : i > 15 ? "MODERATE" : "LOW",
  };
});

export const mockMissionTimeline: MissionTimeline = {
  missionStartDate: "2026-01-25T00:00:00Z",
  missionEndDate: "2027-04-19T00:00:00Z",
  currentMissionDay: 142,
  totalMissionDays: 450,
  milestones: [
    { missionDay: 145, date: "2026-06-18T00:00:00Z", type: "HARVEST_WINDOW", label: "Lettuce harvest window (Alpha 0-0, 0-1)", cropId: CROP_IDS.lettuce },
    { missionDay: 148, date: "2026-06-21T00:00:00Z", type: "HARVEST_WINDOW", label: "Basil harvest ready (Alpha 0-4, 0-5)", cropId: CROP_IDS.basil },
    { missionDay: 155, date: "2026-06-28T00:00:00Z", type: "HARVEST_WINDOW", label: "Radish harvest (Alpha 1-4, 1-5)", cropId: CROP_IDS.radish },
    { missionDay: 170, date: "2026-07-13T00:00:00Z", type: "PLANTING_DEADLINE", label: "Last wheat planting for pre-mission-end harvest", cropId: CROP_IDS.wheat },
    { missionDay: 200, date: "2026-08-12T00:00:00Z", type: "RESOURCE_CRITICAL", label: "Water reserves projected below 30%", cropId: null },
    { missionDay: 330, date: "2026-12-20T00:00:00Z", type: "PLANTING_DEADLINE", label: "Last planting window for any 120-day crop", cropId: null },
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

// === Scenarios ===
export const mockScenarios: Scenario[] = [
  { id: uuid(), name: "Water Leak", type: "WATER_LEAK", description: "Sudden loss of water reserves from pipe rupture or seal failure. Tests agent water conservation triage.", severity: "HIGH", defaultDurationMinutes: 120 },
  { id: uuid(), name: "Solar Panel Failure", type: "SOLAR_PANEL_FAILURE", description: "Energy input drops significantly. Agent must manage lighting and heating priorities.", severity: "HIGH", defaultDurationMinutes: 480 },
  { id: uuid(), name: "Disease Outbreak", type: "DISEASE_OUTBREAK", description: "Pathogen spreading through crop zone. Agent must decide: quarantine, treat, or destroy and replant.", severity: "MEDIUM", defaultDurationMinutes: 1440 },
  { id: uuid(), name: "Dust Storm", type: "DUST_STORM", description: "Extended period of reduced solar energy and increased heating demand from Mars dust storm.", severity: "MEDIUM", defaultDurationMinutes: 2880 },
  { id: uuid(), name: "Equipment Malfunction", type: "EQUIPMENT_MALFUNCTION", description: "Sensor or actuation hardware failure requiring workaround.", severity: "LOW", defaultDurationMinutes: 60 },
];

// === Analytics ===
export const mockAgentPerformance: AgentPerformance = {
  simulationId: SIM_ID, simulationName: "Baseline Run — Balanced Config",
  status: "RUNNING", decisionAccuracyPercent: 87, avgResponseTimeMs: 1200,
  resourceEfficiencyScore: 74, nutritionalTargetHitRate: 0.82,
  diversityScore: 68, autonomousActionsCount: 342, humanOverridesCount: 18,
  crisisResponseScore: 79,
};

// === Initial Simulation State ===
export const initialSimulationState: SimulationState = {
  currentMissionDay: 142,
  totalMissionDays: 450,
  speed: 0,
  isRunning: false,
  greenhouses: mockGreenhouses,
  selectedGreenhouseId: GH_ALPHA_ID,
  resources: { waterReservePercent: 73, nutrientReservePercent: 58, energyReservePercent: 84 },
  weather: mockWeather,
  alerts: mockAlerts,
  agentLog: mockAgentLog,
  recommendations: mockRecommendations,
};

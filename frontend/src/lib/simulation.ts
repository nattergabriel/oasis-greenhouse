import type { SimulationState, PlantSlot, GreenhouseSummary, Alert } from "./types";

export function simulationTick(state: SimulationState): SimulationState {
  const nextDay = state.currentMissionDay + 1;
  if (nextDay > state.totalMissionDays) {
    return { ...state, isRunning: false, speed: 0 };
  }

  // Advance crop growth in all greenhouses
  const greenhouses = state.greenhouses.map((gh) => advanceGreenhouse(gh));

  // Slowly deplete resources
  const resources = {
    waterReservePercent: Math.max(0, state.resources.waterReservePercent - 0.15 - Math.random() * 0.1),
    nutrientReservePercent: Math.max(0, state.resources.nutrientReservePercent - 0.1 - Math.random() * 0.05),
    energyReservePercent: Math.max(0, state.resources.energyReservePercent - 0.08 - Math.random() * 0.05),
  };

  // Occasionally generate a new alert (~5% chance per tick)
  let alerts = state.alerts;
  if (Math.random() < 0.05) {
    alerts = [generateRandomAlert(state), ...alerts].slice(0, 20);
  }

  return {
    ...state,
    currentMissionDay: nextDay,
    greenhouses,
    resources,
    alerts,
  };
}

function advanceGreenhouse(gh: GreenhouseSummary): GreenhouseSummary {
  // Simple status rotation based on random chance
  const hasIssue = Math.random() < 0.1;
  return {
    ...gh,
    overallStatus: hasIssue ? "NEEDS_ATTENTION" : "HEALTHY",
  };
}

function generateRandomAlert(state: SimulationState): Alert {
  const types = [
    { type: "NUTRIENT_DEFICIENCY" as const, severity: "WARNING" as const, diagnosis: "Nutrient levels below optimal threshold in growing zone" },
    { type: "ENVIRONMENTAL_STRESS" as const, severity: "INFO" as const, diagnosis: "Environmental parameter drifting outside optimal range" },
    { type: "EQUIPMENT_FAILURE" as const, severity: "CRITICAL" as const, diagnosis: "Sensor reading anomaly detected — possible hardware fault" },
  ];
  const pick = types[Math.floor(Math.random() * types.length)];
  const gh = state.greenhouses[Math.floor(Math.random() * state.greenhouses.length)];

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    severity: pick.severity,
    type: pick.type,
    cropId: null,
    slotId: null,
    greenhouseId: gh.id,
    diagnosis: `SOL ${state.currentMissionDay}: ${pick.diagnosis}`,
    confidence: 0.6 + Math.random() * 0.35,
    status: "OPEN",
    escalatedToHuman: Math.random() < 0.3,
    suggestedAction: "Investigate and take corrective action as needed.",
  };
}

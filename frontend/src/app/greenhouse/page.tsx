"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSimulation } from "@/providers/simulation-provider";
import {
  mockGreenhouseDetails,
  mockSensorSnapshot,
  mockSensorHistory,
} from "@/lib/mock-data";
import { GreenhouseCrossSection } from "@/components/greenhouse-cross-section";
import type { PlantSlot, SensorStatus } from "@/lib/types";
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { Droplet, Zap, Beaker, Thermometer, Wind, Leaf } from "lucide-react";

const STATUS_COLORS = {
  HEALTHY: "#4ead6b",
  NEEDS_ATTENTION: "#d4aa30",
  CRITICAL: "#c75a3a",
  EMPTY: "#6b6560",
};

const SENSOR_STATUS_COLORS = {
  NORMAL: "#4ead6b",
  WARNING: "#d4aa30",
  CRITICAL: "#c75a3a",
};

type MetricMode = "status" | "growth" | "yield";

function statusColor(status: string) {
  if (status === "NORMAL") return SENSOR_STATUS_COLORS.NORMAL;
  if (status === "WARNING") return SENSOR_STATUS_COLORS.WARNING;
  return SENSOR_STATUS_COLORS.CRITICAL;
}

export default function GreenhousePage() {
  const { state, dispatch } = useSimulation();
  const [metricMode, setMetricMode] = useState<MetricMode>("status");

  const selectedGhId = state.selectedGreenhouseId;
  if (!selectedGhId) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Greenhouse Environment
        </h1>
        <Card className="p-8 text-center text-muted-foreground">
          No greenhouse selected
        </Card>
      </div>
    );
  }

  const greenhouseDetail = mockGreenhouseDetails[selectedGhId];
  if (!greenhouseDetail) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Greenhouse Environment
        </h1>
        <Card className="p-8 text-center text-muted-foreground">
          Greenhouse data not found
        </Card>
      </div>
    );
  }

  const { name, rows, cols, slots, resources } = greenhouseDetail;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header with greenhouse selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Greenhouse Environment
        </h1>
        {state.greenhouses.length > 1 && (
          <div className="flex gap-2">
            {state.greenhouses.map((gh) => (
              <button
                key={gh.id}
                onClick={() =>
                  dispatch({ type: "SELECT_GREENHOUSE", id: gh.id })
                }
                className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                  gh.id === selectedGhId
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-accent"
                }`}
              >
                {gh.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cross-section visualization */}
      <GreenhouseCrossSection />

      {/* Top-down Grid + Resources side by side */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Top-down grid (compact) — 2/3 */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {name} — Top View ({rows}×{cols})
              </span>
              <div className="flex gap-1">
                {(["status", "growth", "yield"] as MetricMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setMetricMode(mode)}
                    className={`rounded border px-2.5 py-0.5 text-xs transition-colors ${
                      metricMode === mode
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: rows }, (_, rowIdx) =>
                Array.from({ length: cols }, (_, colIdx) => {
                  const slot = slots.find(
                    (s) => s.position.row === rowIdx && s.position.col === colIdx
                  );
                  return slot ? (
                    <PlantSlotCell
                      key={slot.id}
                      slot={slot}
                      mode={metricMode}
                    />
                  ) : (
                    <div
                      key={`empty-${rowIdx}-${colIdx}`}
                      className="aspect-square rounded border border-border bg-card/50"
                    />
                  );
                })
              )}
            </div>

            {/* Compact legend */}
            <div className="mt-2 flex flex-wrap gap-3 text-[10px]">
              {metricMode === "status" && (
                <>
                  {Object.entries(STATUS_COLORS).map(([key, color]) => (
                    <div key={key} className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded" style={{ backgroundColor: color }} />
                      <span className="text-muted-foreground">{key.replace("_", " ").toLowerCase()}</span>
                    </div>
                  ))}
                </>
              )}
              {metricMode === "growth" && (
                <span className="text-muted-foreground">Intensity = growth stage (0–100%)</span>
              )}
              {metricMode === "yield" && (
                <span className="text-muted-foreground">Estimated yield (kg)</span>
              )}
            </div>
          </Card>
        </div>

        {/* Resources — 1/3 */}
        <div>
          <Card className="p-4">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Resource Reserves
            </span>
            <div className="mt-4 space-y-4">
              <ResourceBar label="Water" percent={resources.waterReservePercent} icon={<Droplet className="h-4 w-4" />} />
              <ResourceBar label="Nutrients" percent={resources.nutrientReservePercent} icon={<Beaker className="h-4 w-4" />} />
              <ResourceBar label="Energy" percent={resources.energyReservePercent} icon={<Zap className="h-4 w-4" />} />
            </div>
          </Card>
        </div>
      </div>

      {/* Sensor Readouts */}
      <Card className="p-4">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Environmental Sensors
        </span>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <SensorGauge label="Temperature" value={mockSensorSnapshot.temperature.value} unit="°C" status={mockSensorSnapshot.temperature.status} icon={<Thermometer className="h-4 w-4" />} history={mockSensorHistory.map((h) => h.temperature)} />
          <SensorGauge label="Humidity" value={mockSensorSnapshot.humidity.value} unit="% RH" status={mockSensorSnapshot.humidity.status} icon={<Droplet className="h-4 w-4" />} history={mockSensorHistory.map((h) => h.humidity)} />
          <SensorGauge label="CO₂" value={mockSensorSnapshot.co2.value} unit="ppm" status={mockSensorSnapshot.co2.status} icon={<Wind className="h-4 w-4" />} history={mockSensorHistory.map((h) => h.co2)} />
          <SensorGauge label="PAR" value={mockSensorSnapshot.par.value} unit="µmol" status={mockSensorSnapshot.par.status} icon={<Leaf className="h-4 w-4" />} history={mockSensorHistory.map((h) => h.par)} />
          <SensorGauge label="pH" value={mockSensorSnapshot.nutrientSolution.ph.value} unit="" status={mockSensorSnapshot.nutrientSolution.ph.status} icon={<Beaker className="h-4 w-4" />} history={mockSensorHistory.map((h) => h.nutrientSolutionPh)} />
          <SensorGauge label="EC" value={mockSensorSnapshot.nutrientSolution.ec.value} unit="mS/cm" status={mockSensorSnapshot.nutrientSolution.ec.status} icon={<Zap className="h-4 w-4" />} history={mockSensorHistory.map((h) => h.nutrientSolutionEc)} />
        </div>
      </Card>
    </div>
  );
}

function PlantSlotCell({ slot, mode }: { slot: PlantSlot; mode: MetricMode }) {
  const getCellColor = () => {
    if (mode === "status") {
      return STATUS_COLORS[slot.status];
    } else if (mode === "growth") {
      if (!slot.cropId) return STATUS_COLORS.EMPTY;
      const intensity = slot.growthStagePercent / 100;
      const r = Math.round(90 + (154 - 90) * intensity);
      const g = Math.round(154 + (106 - 154) * intensity);
      const b = Math.round(107 + (107 - 107) * intensity);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      return STATUS_COLORS[slot.status];
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger
        className="relative aspect-square cursor-pointer rounded border border-border transition-all hover:border-primary text-left"
        style={{
          backgroundColor: getCellColor(),
          opacity: slot.status === "EMPTY" ? 0.4 : 1,
        }}
      >
        <div className="flex h-full flex-col items-center justify-center gap-0.5 p-1 text-center">
          {slot.cropName && (
            <>
              <span className="text-[9px] font-medium leading-tight text-white/90 line-clamp-1">
                {slot.cropName}
              </span>
              {mode === "yield" && slot.estimatedYieldKg !== null ? (
                <span className="font-mono text-[10px] tabular-nums text-white/90">
                  {slot.estimatedYieldKg.toFixed(1)}kg
                </span>
              ) : (
                <span className="font-mono text-[10px] tabular-nums text-white/90">
                  {slot.growthStagePercent}%
                </span>
              )}
              {slot.activeStressTypes.length > 0 && (
                <div className="flex gap-0.5">
                  {slot.activeStressTypes.map((_, idx) => (
                    <div key={idx} className="h-1 w-1 rounded-full bg-destructive" />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Position:</span>
            <span className="font-mono">[{slot.position.row}, {slot.position.col}]</span>
          </div>
          {slot.cropName ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Crop:</span>
                <span className="font-medium">{slot.cropName}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className="text-[10px]" style={{ borderColor: STATUS_COLORS[slot.status], color: STATUS_COLORS[slot.status] }}>
                  {slot.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Growth:</span>
                <span className="font-mono">{slot.growthStagePercent}%</span>
              </div>
              {slot.daysUntilHarvest !== null && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Harvest in:</span>
                  <span className="font-mono">{slot.daysUntilHarvest}d</span>
                </div>
              )}
              {slot.estimatedYieldKg !== null && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Est. Yield:</span>
                  <span className="font-mono">{slot.estimatedYieldKg.toFixed(2)} kg</span>
                </div>
              )}
              {slot.activeStressTypes.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-border pt-2">
                  <span className="text-muted-foreground">Active Stresses:</span>
                  {slot.activeStressTypes.map((stress) => (
                    <div key={stress} className="text-destructive">• {stress.replace(/_/g, " ")}</div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-muted-foreground">Empty slot</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function SensorGauge({
  label, value, unit, status, icon, history,
}: {
  label: string; value: number; unit: string; status: SensorStatus; icon: React.ReactNode; history: number[];
}) {
  const statusCol = statusColor(status);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="text-muted-foreground">{icon}</div>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        </div>
        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusCol }} />
      </div>
      <div className="font-mono text-xl tabular-nums">
        {value.toFixed(label === "pH" ? 1 : 0)}
        <span className="ml-1 text-xs text-muted-foreground">{unit}</span>
      </div>
      <div className="h-6 -mx-1">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={history.map((v, i) => ({ i, v }))}>
            <Line type="monotone" dataKey="v" stroke={statusCol} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ResourceBar({ label, percent, icon }: { label: string; percent: number; icon: React.ReactNode }) {
  const color =
    percent > 50 ? STATUS_COLORS.HEALTHY : percent > 25 ? STATUS_COLORS.NEEDS_ATTENTION : STATUS_COLORS.CRITICAL;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="text-muted-foreground">{icon}</div>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        </div>
        <span className="font-mono text-sm tabular-nums">{Math.round(percent)}%</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-card border border-border">
        <div className="h-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

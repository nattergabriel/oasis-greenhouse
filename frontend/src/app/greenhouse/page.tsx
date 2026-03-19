"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useSimulation } from "@/providers/simulation-provider";
import { emptySensorSnapshot } from "@/lib/defaults";
import { api, useApi } from "@/lib/api";
import { GreenhouseCrossSection } from "@/components/greenhouse-cross-section";
import type { PlantSlot, SensorStatus } from "@/lib/types";
import { fmt, fmtInt } from "@/lib/utils";
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

function sensorStatusColor(status: string) {
  if (status === "NORMAL") return SENSOR_STATUS_COLORS.NORMAL;
  if (status === "WARNING") return SENSOR_STATUS_COLORS.WARNING;
  return SENSOR_STATUS_COLORS.CRITICAL;
}

function getCellColor(slot: PlantSlot, mode: MetricMode): string {
  if (mode === "status") {
    return STATUS_COLORS[slot.status];
  }
  if (mode === "growth") {
    if (!slot.cropId) return STATUS_COLORS.EMPTY;
    const t = slot.growthStagePercent / 100;
    return `rgb(${Math.round(199 - 120 * t)}, ${Math.round(90 + 64 * t)}, ${Math.round(58 + 49 * t)})`;
  }
  return STATUS_COLORS[slot.status];
}

function getCropDotColor(name: string) {
  if (name === "Lettuce") return "#4ead6b";
  if (name === "Potato") return "#d4aa30";
  if (name === "Radish") return "#c75a6a";
  if (name === "Beans & Peas") return "#8a9a44";
  if (name === "Herbs") return "#7c6aad";
  return "#9c9488";
}

export default function GreenhousePage() {
  const { state, dispatch, hydrated } = useSimulation();
  const [metricMode, setMetricMode] = useState<MetricMode>("status");
  const selectedGhId = state.selectedGreenhouseId;
  const skip = !hydrated || !selectedGhId;

  const greenhouseDetail = useApi(() => api.greenhouses.get(selectedGhId!), null, [selectedGhId], skip);
  const sensors = useApi(() => api.greenhouses.sensorsLatest(selectedGhId!), emptySensorSnapshot, [selectedGhId], skip);
  const sensorHistory = useApi(() => api.greenhouses.sensorsHistory(selectedGhId!, { from: new Date(Date.now() - 86400000).toISOString(), to: new Date().toISOString(), interval: "1h" }).then(r => r.readings), [] as import("@/lib/types").SensorHistoryReading[], [selectedGhId], skip);

  if (!selectedGhId || !greenhouseDetail) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Greenhouse Environment
        </h1>
        <Card className="p-8 text-center text-muted-foreground">
          {!selectedGhId ? "No greenhouse selected" : "Loading greenhouse data…"}
        </Card>
      </div>
    );
  }

  const { name, rows, cols, slots, resources } = greenhouseDetail;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header */}
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

      {/* Cross-section visualization + Resource Reserves */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GreenhouseCrossSection />
        </div>
        <Card className="p-4 flex flex-col overflow-hidden">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Resource Reserves
          </span>
          <div className="mt-4 space-y-6">
            <ResourceBar label="Water" percent={resources.waterReservePercent} icon={<Droplet className="h-4 w-4" />} />
            <ResourceBar label="Nutrients" percent={resources.nutrientReservePercent} icon={<Beaker className="h-4 w-4" />} />
            <ResourceBar label="Energy" percent={resources.energyReservePercent} icon={<Zap className="h-4 w-4" />} />
          </div>

          <div className="mt-6 border-t border-border pt-4 flex-1 min-h-0 flex flex-col">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Plants
            </span>
            <div className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-2">
              {(() => {
                const cropCounts: Record<string, { count: number; avgGrowth: number }> = {};
                for (const s of slots) {
                  if (!s.cropName) continue;
                  if (!cropCounts[s.cropName]) cropCounts[s.cropName] = { count: 0, avgGrowth: 0 };
                  cropCounts[s.cropName].count++;
                  cropCounts[s.cropName].avgGrowth += s.growthStagePercent;
                }
                return Object.entries(cropCounts).map(([name, { count, avgGrowth }]) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: getCropDotColor(name) }} />
                      <span className="truncate">{name}</span>
                    </div>
                    <span className="font-mono tabular-nums text-muted-foreground shrink-0 ml-2">
                      {count} <span className="text-xs">× {Math.round(avgGrowth / count)}%</span>
                    </span>
                  </div>
                ));
              })()}
              <div className="mt-1 pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>{slots.filter(s => s.cropId).length} / {slots.length} slots</span>
                <span className="font-mono tabular-nums">{Math.round((slots.filter(s => s.cropId).length / slots.length) * 100)}% full</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Environmental Sensors */}
      <Card className="p-4">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Environmental Sensors
        </span>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <SensorGauge label="Temperature" value={sensors.temperature.value} unit="°C" status={sensors.temperature.status} icon={<Thermometer className="h-4 w-4" />} history={sensorHistory.map((h) => h.temperature)} />
          <SensorGauge label="Humidity" value={sensors.humidity.value} unit="% RH" status={sensors.humidity.status} icon={<Droplet className="h-4 w-4" />} history={sensorHistory.map((h) => h.humidity)} />
          <SensorGauge label="CO₂" value={sensors.co2.value} unit="ppm" status={sensors.co2.status} icon={<Wind className="h-4 w-4" />} history={sensorHistory.map((h) => h.co2)} />
          <SensorGauge label="PAR" value={sensors.par.value} unit="µmol" status={sensors.par.status} icon={<Leaf className="h-4 w-4" />} history={sensorHistory.map((h) => h.par)} />
          <SensorGauge label="pH" value={sensors.nutrientSolution.ph.value} unit="" status={sensors.nutrientSolution.ph.status} icon={<Beaker className="h-4 w-4" />} history={sensorHistory.map((h) => h.nutrientSolutionPh)} />
          <SensorGauge label="EC" value={sensors.nutrientSolution.ec.value} unit="mS/cm" status={sensors.nutrientSolution.ec.status} icon={<Zap className="h-4 w-4" />} history={sensorHistory.map((h) => h.nutrientSolutionEc)} />
        </div>
      </Card>

      {/* Circular Top-Down View */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {name} — Top View
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

        <CircularTopView slots={slots} rows={rows} cols={cols} metricMode={metricMode} />

        {/* Legend */}
        <TopViewLegend metricMode={metricMode} slots={slots} />
      </Card>
    </div>
  );
}

/* ── Circular Top-Down View ─────────────────────────────── */

function CircularTopView({
  slots,
  rows,
  cols,
  metricMode,
}: {
  slots: PlantSlot[];
  rows: number;
  cols: number;
  metricMode: MetricMode;
}) {
  const svgSize = 500;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const outerR = 220;

  // Inset from circle edge so cells never touch the border
  const circlePadding = 28;
  const usableR = outerR - circlePadding;

  // Determine the largest square inscribed in the usable circle
  const inscribedSide = usableR * Math.sqrt(2);

  // Gap between cells scales with grid density
  const maxDim = Math.max(rows, cols);
  const gap = Math.max(4, Math.min(12, Math.round(inscribedSide / (maxDim * 6))));

  // Calculate cell size to fill the inscribed area with gaps
  const cellW = (inscribedSide - gap * (cols - 1)) / cols;
  const cellH = (inscribedSide - gap * (rows - 1)) / rows;
  const cellSize = Math.floor(Math.min(cellW, cellH));

  // Actual grid dimensions
  const gridW = cellSize * cols + gap * (cols - 1);
  const gridH = cellSize * rows + gap * (rows - 1);
  const gridX0 = cx - gridW / 2;
  const gridY0 = cy - gridH / 2;

  // Dynamic font sizes based on cell size
  const labelFontSize = Math.max(7, Math.min(11, Math.round(cellSize / 7.5)));
  const valueFontSize = Math.max(8, Math.min(12, Math.round(cellSize / 6.5)));
  const cornerRadius = Math.max(4, Math.min(10, Math.round(cellSize / 10)));
  const stressDotR = Math.max(2, Math.min(4, Math.round(cellSize / 24)));

  return (
    <div className="flex justify-center py-2">
      <svg
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="w-full max-w-2xl"
        style={{ display: "block" }}
      >
        <defs>
          <clipPath id="topview-clip">
            <circle cx={cx} cy={cy} r={outerR - 1} />
          </clipPath>
          <radialGradient id="topview-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#7c6aad" stopOpacity={0.04} />
            <stop offset="100%" stopColor="#7c6aad" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Outer circle */}
        <circle cx={cx} cy={cy} r={outerR} fill="#0a0908" stroke="#2e2b27" strokeWidth={2} />

        {/* Subtle depth rings */}
        <circle cx={cx} cy={cy} r={outerR * 0.7} fill="none" stroke="#2e2b27" strokeWidth={0.5} opacity={0.2} />
        <circle cx={cx} cy={cy} r={outerR * 0.4} fill="none" stroke="#2e2b27" strokeWidth={0.5} opacity={0.12} />

        {/* Ambient glow */}
        <circle cx={cx} cy={cy} r={outerR * 0.9} fill="url(#topview-glow)" />

        {/* Clipped content */}
        <g clipPath="url(#topview-clip)">
          {/* Zone divider lines */}
          {Array.from({ length: rows - 1 }, (_, i) => {
            const y = gridY0 + (i + 1) * cellSize + i * gap + gap / 2;
            return (
              <line
                key={i}
                x1={0}
                y1={y}
                x2={svgSize}
                y2={y}
                stroke="#2e2b27"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Slot cells */}
          {Array.from({ length: rows }, (_, r) =>
            Array.from({ length: cols }, (_, c) => {
              const slot = slots.find(
                (s) => s.position.row === r && s.position.col === c
              );
              const x = gridX0 + c * (cellSize + gap);
              const y = gridY0 + r * (cellSize + gap);
              const color = slot ? getCellColor(slot, metricMode) : "#1a1917";
              const isEmpty = !slot || slot.status === "EMPTY";

              return (
                <g key={`${r}-${c}`} opacity={isEmpty ? 0.4 : 1}>
                  <title>
                    {slot?.cropName
                      ? `${slot.cropName} — ${slot.growthStagePercent}% — ${slot.status}`
                      : `Zone ${r + 1} — Empty`}
                  </title>
                  <rect
                    x={x}
                    y={y}
                    width={cellSize}
                    height={cellSize}
                    rx={cornerRadius}
                    fill={color}
                    stroke="#2e2b27"
                    strokeWidth={1}
                  />
                  {slot?.cropName && (
                    <>
                      <text
                        x={x + cellSize / 2}
                        y={y + cellSize / 2 - valueFontSize * 0.4}
                        textAnchor="middle"
                        fill="white"
                        fontSize={labelFontSize}
                        fontWeight={500}
                        opacity={0.9}
                      >
                        {slot.cropName}
                      </text>
                      <text
                        x={x + cellSize / 2}
                        y={y + cellSize / 2 + valueFontSize * 0.9}
                        textAnchor="middle"
                        fill="white"
                        fontSize={valueFontSize}
                        fontFamily="monospace"
                        opacity={0.8}
                      >
                        {metricMode === "yield" && slot.estimatedYieldKg !== null
                          ? `${slot.estimatedYieldKg.toFixed(1)}kg`
                          : `${slot.growthStagePercent}%`}
                      </text>
                      {slot.activeStressTypes.length > 0 && (
                        <circle
                          cx={x + cellSize - stressDotR * 2.5}
                          cy={y + stressDotR * 2.5}
                          r={stressDotR}
                          fill="#c75a3a"
                        >
                          <animate
                            attributeName="opacity"
                            values="0.5;1;0.5"
                            dur="1.5s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
                    </>
                  )}
                </g>
              );
            })
          )}
        </g>

        {/* Zone labels at circle edge */}
        {Array.from({ length: rows }, (_, i) => {
          const rowCenterY = gridY0 + i * (cellSize + gap) + cellSize / 2;
          const dy = rowCenterY - cy;
          const circleEdgeX = cx - Math.sqrt(Math.max(0, outerR * outerR - dy * dy));
          return (
            <text
              key={i}
              x={circleEdgeX - 6}
              y={rowCenterY + 3}
              textAnchor="end"
              fill="#9c9488"
              fontSize={9}
              fontFamily="monospace"
              opacity={0.6}
            >
              Z{i + 1}
            </text>
          );
        })}

        {/* Outer highlight ring */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#9c9488" strokeWidth={0.5} opacity={0.15} />
      </svg>
    </div>
  );
}

/* ── Top View Legend ────────────────────────────────────── */

function TopViewLegend({
  metricMode,
  slots,
}: {
  metricMode: MetricMode;
  slots: PlantSlot[];
}) {
  if (metricMode === "status") {
    return (
      <div className="mt-4 rounded-lg border border-border bg-card/50 px-4 py-3">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Status Legend
        </span>
        <div className="mt-2.5 flex flex-wrap items-center gap-5">
          {Object.entries(STATUS_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground capitalize">
                {key.replace("_", " ").toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (metricMode === "growth") {
    // Generate gradient stops matching getCellColor for growth mode
    const gradientStops = Array.from({ length: 11 }, (_, i) => {
      const t = i / 10;
      const r = Math.round(199 - 120 * t);
      const g = Math.round(90 + 64 * t);
      const b = Math.round(58 + 49 * t);
      return `rgb(${r}, ${g}, ${b})`;
    });
    const gradientCSS = `linear-gradient(to right, ${gradientStops.join(", ")})`;

    return (
      <div className="mt-4 rounded-lg border border-border bg-card/50 px-4 py-3">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Growth Stage
        </span>
        <div className="mt-2.5 space-y-1.5">
          <div
            className="h-3 w-full rounded-full"
            style={{ background: gradientCSS }}
          />
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              0%
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Seedling — Vegetative — Mature
            </span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              100%
            </span>
          </div>
        </div>
      </div>
    );
  }

  // yield mode
  const yieldValues = slots
    .map((s) => s.estimatedYieldKg)
    .filter((v): v is number => v !== null);
  const minYield = yieldValues.length > 0 ? Math.min(...yieldValues) : 0;
  const maxYield = yieldValues.length > 0 ? Math.max(...yieldValues) : 1;

  // Yield uses the same status-based coloring, so show a gradient from low to high yield
  const yieldGradientStops = [
    STATUS_COLORS.CRITICAL,
    STATUS_COLORS.NEEDS_ATTENTION,
    STATUS_COLORS.HEALTHY,
  ];
  const yieldGradientCSS = `linear-gradient(to right, ${yieldGradientStops.join(", ")})`;

  return (
    <div className="mt-4 rounded-lg border border-border bg-card/50 px-4 py-3">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        Estimated Yield
      </span>
      <div className="mt-2.5 space-y-1.5">
        <div
          className="h-3 w-full rounded-full"
          style={{ background: yieldGradientCSS }}
        />
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {minYield.toFixed(1)} kg
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Low — Medium — High
          </span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {maxYield.toFixed(1)} kg
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Helper Components ──────────────────────────────────── */

function SensorGauge({
  label, value, unit, status, icon, history,
}: {
  label: string; value: number; unit: string; status: SensorStatus; icon: React.ReactNode; history: number[];
}) {
  const statusCol = sensorStatusColor(status);

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

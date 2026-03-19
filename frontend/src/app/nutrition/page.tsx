"use client";

import { mockNutritionEntries, mockCoverageHeatmap } from "@/lib/mock-data";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSimulation } from "@/providers/simulation-provider";
import { TrendingUp, TrendingDown } from "lucide-react";

// === Helpers ===
function formatShortDate(isoString: string): string {
  const date = new Date(isoString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getCoverageColor(percent: number): string {
  if (percent > 80) return "var(--color-status-healthy)";
  if (percent >= 50) return "var(--color-status-warning)";
  return "var(--color-status-critical)";
}

// === Custom Tooltip Component ===
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded border border-border bg-card px-3 py-2 text-sm">
      <p className="mb-1 font-medium text-primary">{label}</p>
      <p className="text-foreground">
        {payload[0].name}: {Math.round(payload[0].value).toLocaleString()}
      </p>
    </div>
  );
}

// === Page Component ===
export default function NutritionPage() {
  const { state } = useSimulation();
  const latestEntry = mockNutritionEntries[mockNutritionEntries.length - 1];

  // Prepare chart data
  const calorieChartData = mockNutritionEntries.map((entry) => ({
    date: formatShortDate(entry.date),
    calories: entry.totalCalories,
  }));

  // Macro targets for 4 crew members
  const macroTargets = {
    protein: 80,
    carbs: 300,
    fat: 65,
    fiber: 30,
  };

  const macros = [
    {
      name: "Protein",
      value: latestEntry.proteinG,
      target: macroTargets.protein,
      color: "var(--color-mars-blue)",
    },
    {
      name: "Carbs",
      value: latestEntry.carbsG,
      target: macroTargets.carbs,
      color: "var(--color-mars-amber)",
    },
    {
      name: "Fat",
      value: latestEntry.fatG,
      target: macroTargets.fat,
      color: "var(--color-mars-yellow)",
    },
    {
      name: "Fiber",
      value: latestEntry.fiberG,
      target: macroTargets.fiber,
      color: "var(--color-mars-green)",
    },
  ];

  const caloriePercentage = Math.round(
    (latestEntry.totalCalories / latestEntry.targetCalories) * 100
  );

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-medium tracking-tight">
          Nutritional Tracking
        </h1>
        <Badge variant="outline" className="font-mono text-xs tabular-nums">
          SOL {state.currentMissionDay} / {state.totalMissionDays}
        </Badge>
      </div>

      {/* Section 1: Calorie Tracker */}
      <Card className="p-6">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Daily Calorie Intake
        </span>
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Big number */}
          <div className="flex flex-col justify-center">
            <div className="mb-2 flex items-baseline gap-2">
              <span className="text-5xl font-bold text-primary font-mono tabular-nums">
                {latestEntry.totalCalories.toLocaleString()}
              </span>
              <span className="text-2xl text-muted-foreground">/</span>
              <span className="text-2xl text-muted-foreground font-mono tabular-nums">
                {latestEntry.targetCalories.toLocaleString()}
              </span>
              <span className="text-lg text-muted-foreground">kcal</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={caloriePercentage >= 90 ? "default" : "secondary"}
                className={
                  caloriePercentage >= 90
                    ? "bg-[var(--color-status-healthy)] text-white hover:bg-[var(--color-status-healthy)]"
                    : "bg-[var(--color-status-warning)] text-white hover:bg-[var(--color-status-warning)]"
                }
              >
                {caloriePercentage}% of target
              </Badge>
              {caloriePercentage >= 90 ? (
                <TrendingUp className="h-4 w-4" style={{ color: "var(--color-status-healthy)" }} />
              ) : (
                <TrendingDown className="h-4 w-4" style={{ color: "var(--color-status-warning)" }} />
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Latest day: {formatShortDate(latestEntry.date)}
            </p>
          </div>

          {/* Right: Area chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={calorieChartData}>
                <defs>
                  <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--border)"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  stroke="var(--border)"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  domain={[7000, 11000]}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={latestEntry.targetCalories}
                  stroke="var(--primary)"
                  strokeDasharray="5 5"
                  label={{
                    value: "Target",
                    fill: "var(--primary)",
                    fontSize: 11,
                    position: "right",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="calories"
                  name="Calories"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#calorieGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Section 2: Macro Breakdown */}
      <Card className="p-6">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Macronutrient Breakdown
        </span>
        <div className="mt-4 space-y-4">
          {macros.map((macro) => {
            const percentage = Math.min((macro.value / macro.target) * 100, 100);
            return (
              <div key={macro.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {macro.name}
                  </span>
                  <span className="text-muted-foreground font-mono tabular-nums">
                    {macro.value}g / {macro.target}g
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-muted border border-border">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: macro.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Section 3: Nutritional Coverage Heatmap */}
      <Card className="p-6">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Nutritional Coverage Heatmap
        </span>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Mission days {mockCoverageHeatmap.missionDays[0]} –{" "}
          {mockCoverageHeatmap.missionDays[mockCoverageHeatmap.missionDays.length - 1]}
        </p>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Column headers (mission days) */}
            <div className="flex">
              <div className="w-24 shrink-0" />
              {mockCoverageHeatmap.missionDays.map((day) => (
                <div
                  key={day}
                  className="flex h-8 w-[40px] shrink-0 items-center justify-center text-xs text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Rows */}
            {mockCoverageHeatmap.nutrients.map((nutrient, rowIndex) => (
              <div key={nutrient} className="flex">
                {/* Row label */}
                <div className="flex w-24 shrink-0 items-center text-sm font-medium">
                  {nutrient}
                </div>

                {/* Cells */}
                {mockCoverageHeatmap.coverage[rowIndex].map(
                  (percent, colIndex) => (
                    <div
                      key={colIndex}
                      className="group relative flex h-[30px] w-[40px] shrink-0 items-center justify-center"
                      style={{ margin: "1px" }}
                    >
                      <div
                        className="h-full w-full rounded transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: getCoverageColor(percent),
                        }}
                        title={`${nutrient} - Day ${mockCoverageHeatmap.missionDays[colIndex]}: ${percent}%`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {percent}%
                      </div>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-end gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "var(--color-status-critical)" }} />
            <span>&lt; 50%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "var(--color-status-warning)" }} />
            <span>50–80%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "var(--color-status-healthy)" }} />
            <span>&gt; 80%</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

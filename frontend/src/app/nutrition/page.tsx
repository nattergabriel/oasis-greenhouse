"use client";

import { mockNutritionEntries, mockCoverageHeatmap } from "@/lib/mock-data";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Apple, TrendingUp, TrendingDown } from "lucide-react";
import type { DailyNutritionEntry, CoverageHeatmap } from "@/lib/types";

// === Helpers ===
function formatShortDate(isoString: string): string {
  const date = new Date(isoString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getCoverageColor(percent: number): string {
  if (percent > 80) return "#5a9a6b"; // green
  if (percent >= 50) return "#c4a344"; // yellow
  return "#c75a3a"; // red
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
    <div
      className="rounded border px-3 py-2 text-sm"
      style={{
        backgroundColor: "#1a1917",
        borderColor: "#2e2b27",
      }}
    >
      <p className="mb-1 font-medium" style={{ color: "#d4924a" }}>
        {label}
      </p>
      <p className="text-gray-300">
        {payload[0].name}: {Math.round(payload[0].value).toLocaleString()}
      </p>
    </div>
  );
}

// === Page Component ===
export default function NutritionPage() {
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
      color: "#4a7c9e",
    },
    {
      name: "Carbs",
      value: latestEntry.carbsG,
      target: macroTargets.carbs,
      color: "#d4924a",
    },
    {
      name: "Fat",
      value: latestEntry.fatG,
      target: macroTargets.fat,
      color: "#c4a344",
    },
    {
      name: "Fiber",
      value: latestEntry.fiberG,
      target: macroTargets.fiber,
      color: "#5a9a6b",
    },
  ];

  const caloriePercentage = Math.round(
    (latestEntry.totalCalories / latestEntry.targetCalories) * 100
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#d4924a] p-2">
          <Apple className="h-6 w-6 text-[#1a1917]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">
            Nutritional Tracking
          </h1>
          <p className="text-sm text-gray-400">
            4-person crew nutritional status and coverage
          </p>
        </div>
      </div>

      {/* Section 1: Calorie Tracker */}
      <Card className="border-[#2e2b27] bg-[#1a1917] p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-100">
          Daily Calorie Intake
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Big number */}
          <div className="flex flex-col justify-center">
            <div className="mb-2 flex items-baseline gap-2">
              <span className="text-5xl font-bold text-[#d4924a]">
                {latestEntry.totalCalories.toLocaleString()}
              </span>
              <span className="text-2xl text-gray-400">/</span>
              <span className="text-2xl text-gray-400">
                {latestEntry.targetCalories.toLocaleString()}
              </span>
              <span className="text-lg text-gray-500">kcal</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={caloriePercentage >= 90 ? "default" : "secondary"}
                className={
                  caloriePercentage >= 90
                    ? "bg-[#5a9a6b] text-white hover:bg-[#5a9a6b]"
                    : "bg-[#c4a344] text-white hover:bg-[#c4a344]"
                }
              >
                {caloriePercentage}% of target
              </Badge>
              {caloriePercentage >= 90 ? (
                <TrendingUp className="h-4 w-4 text-[#5a9a6b]" />
              ) : (
                <TrendingDown className="h-4 w-4 text-[#c4a344]" />
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Latest day: {formatShortDate(latestEntry.date)}
            </p>
          </div>

          {/* Right: Area chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={calorieChartData}>
                <defs>
                  <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4924a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d4924a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2b27" />
                <XAxis
                  dataKey="date"
                  stroke="#2e2b27"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  stroke="#2e2b27"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  domain={[7000, 11000]}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={latestEntry.targetCalories}
                  stroke="#d4924a"
                  strokeDasharray="5 5"
                  label={{
                    value: "Target",
                    fill: "#d4924a",
                    fontSize: 11,
                    position: "right",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="calories"
                  name="Calories"
                  stroke="#d4924a"
                  strokeWidth={2}
                  fill="url(#calorieGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Section 2: Macro Breakdown */}
      <Card className="border-[#2e2b27] bg-[#1a1917] p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-100">
          Macronutrient Breakdown
        </h2>
        <div className="space-y-4">
          {macros.map((macro) => {
            const percentage = Math.min((macro.value / macro.target) * 100, 100);
            return (
              <div key={macro.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-300">
                    {macro.name}
                  </span>
                  <span className="text-gray-400">
                    {macro.value}g / {macro.target}g
                  </span>
                </div>
                <div className="relative h-6 overflow-hidden rounded-full bg-[#0f0e0d]">
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
      <Card className="border-[#2e2b27] bg-[#1a1917] p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-100">
          Nutritional Coverage Heatmap
        </h2>
        <p className="mb-4 text-sm text-gray-400">
          Mission days {mockCoverageHeatmap.missionDays[0]} -{" "}
          {
            mockCoverageHeatmap.missionDays[
              mockCoverageHeatmap.missionDays.length - 1
            ]
          }
        </p>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Column headers (mission days) */}
            <div className="flex">
              <div className="w-24 shrink-0" />
              {mockCoverageHeatmap.missionDays.map((day) => (
                <div
                  key={day}
                  className="flex h-8 w-[40px] shrink-0 items-center justify-center text-xs text-gray-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Rows */}
            {mockCoverageHeatmap.nutrients.map((nutrient, rowIndex) => (
              <div key={nutrient} className="flex">
                {/* Row label */}
                <div className="flex w-24 shrink-0 items-center text-sm font-medium text-gray-300">
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
                      {/* Optional: show percentage on hover */}
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
        <div className="mt-4 flex items-center justify-end gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded"
              style={{ backgroundColor: "#c75a3a" }}
            />
            <span>&lt; 50%</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded"
              style={{ backgroundColor: "#c4a344" }}
            />
            <span>50-80%</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded"
              style={{ backgroundColor: "#5a9a6b" }}
            />
            <span>&gt; 80%</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

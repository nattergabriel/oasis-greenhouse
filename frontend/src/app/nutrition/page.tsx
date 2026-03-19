"use client";

import { useState } from "react";
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

// === Astronaut profiles (from doc: 4 astronauts, ~75kg avg, 3000 kcal/day each) ===
const CREW = [
  { id: "all", name: "All Crew", weight: 75, kcalTarget: 12000, proteinTarget: 480, preferences: [] as string[], restrictions: [] as string[] },
  { id: "cmdr", name: "Cmdr. Novak", weight: 82, kcalTarget: 3200, proteinTarget: 130, preferences: ["High protein", "Low sodium"], restrictions: [] },
  { id: "eng", name: "Dr. Tanaka", weight: 68, kcalTarget: 2800, proteinTarget: 105, preferences: ["Plant-forward"], restrictions: ["Gluten sensitivity"] },
  { id: "bio", name: "Dr. Okafor", weight: 74, kcalTarget: 3000, proteinTarget: 120, preferences: ["High fiber", "Fermented foods"], restrictions: [] },
  { id: "plt", name: "Lt. Reyes", weight: 78, kcalTarget: 3000, proteinTarget: 125, preferences: ["Calorie dense"], restrictions: ["Soy allergy"] },
];

const MACRO_TARGETS_CREW = { proteinG: 480, carbsG: 1350, fatG: 433, fiberG: 120 };
const MACRO_TARGETS_PERSON = { proteinG: 120, carbsG: 338, fatG: 108, fiberG: 30 };

const MICRO_TARGETS = {
  vitaminAMcg: 900, vitaminCMg: 90, vitaminKMcg: 120,
  folateMcg: 400, ironMg: 18, potassiumMg: 3400, magnesiumMg: 400,
};

const RISK_HIERARCHY = [
  { rank: 1, label: "Caloric sufficiency", key: "calories" as const },
  { rank: 2, label: "Protein supply", key: "protein" as const },
  { rank: 3, label: "Micronutrient diversity", key: "micro" as const },
  { rank: 4, label: "Psychological satisfaction", key: "psych" as const },
];

function getCoverageColor(percent: number): string {
  if (percent > 80) return "var(--color-status-healthy)";
  if (percent >= 50) return "var(--color-status-warning)";
  return "var(--color-status-critical)";
}

function riskStatus(key: string, entry: typeof mockNutritionEntries[0]): { percent: number; status: string } {
  if (key === "calories") {
    const p = Math.round((entry.totalCalories / 12000) * 100);
    return { percent: p, status: p >= 90 ? "HEALTHY" : p >= 70 ? "WARNING" : "CRITICAL" };
  }
  if (key === "protein") {
    const p = Math.round((entry.proteinG / MACRO_TARGETS_CREW.proteinG) * 100);
    return { percent: p, status: p >= 80 ? "HEALTHY" : p >= 60 ? "WARNING" : "CRITICAL" };
  }
  if (key === "micro") {
    const m = entry.micronutrients;
    const coverages = [
      (m.vitaminAMcg ?? 0) / (MICRO_TARGETS.vitaminAMcg * 4),
      (m.vitaminCMg ?? 0) / (MICRO_TARGETS.vitaminCMg * 4),
      (m.vitaminKMcg ?? 0) / (MICRO_TARGETS.vitaminKMcg * 4),
      (m.folateMcg ?? 0) / (MICRO_TARGETS.folateMcg * 4),
      (m.ironMg ?? 0) / (MICRO_TARGETS.ironMg * 4),
      (m.potassiumMg ?? 0) / (MICRO_TARGETS.potassiumMg * 4),
      (m.magnesiumMg ?? 0) / (MICRO_TARGETS.magnesiumMg * 4),
    ];
    const avg = Math.round(coverages.reduce((a, b) => a + b, 0) / coverages.length * 100);
    return { percent: avg, status: avg >= 70 ? "HEALTHY" : avg >= 50 ? "WARNING" : "CRITICAL" };
  }
  return { percent: 75, status: "HEALTHY" };
}

function statusDot(status: string) {
  const color = status === "HEALTHY" ? "var(--color-status-healthy)" : status === "WARNING" ? "var(--color-status-warning)" : "var(--color-status-critical)";
  return <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded border border-border bg-card px-3 py-2 text-sm">
      <p className="mb-1 font-medium text-primary">{label}</p>
      <p className="text-foreground font-mono tabular-nums">
        {Math.round(payload[0].value).toLocaleString()} kcal
      </p>
    </div>
  );
}

export default function NutritionPage() {
  const { state } = useSimulation();
  const [selectedCrew, setSelectedCrew] = useState("all");
  const latestEntry = mockNutritionEntries[mockNutritionEntries.length - 1];

  const crew = CREW.find((c) => c.id === selectedCrew)!;
  const isAll = selectedCrew === "all";
  const divisor = isAll ? 1 : 4;
  const kcalTarget = crew.kcalTarget;
  const displayCalories = isAll ? latestEntry.totalCalories : Math.round(latestEntry.totalCalories / 4);
  const macroTargets = isAll ? MACRO_TARGETS_CREW : MACRO_TARGETS_PERSON;

  const calorieChartData = mockNutritionEntries.map((entry) => ({
    date: `${new Date(entry.date).getMonth() + 1}/${new Date(entry.date).getDate()}`,
    calories: isAll ? entry.totalCalories : Math.round(entry.totalCalories / 4),
  }));

  const caloriePercentage = Math.round((displayCalories / kcalTarget) * 100);

  const macros = [
    { name: "Protein", value: Math.round(latestEntry.proteinG / divisor), target: macroTargets.proteinG, color: "var(--color-mars-blue)", desc: "15–20%" },
    { name: "Carbs", value: Math.round(latestEntry.carbsG / divisor), target: macroTargets.carbsG, color: "var(--color-mars-yellow)", desc: "45–55%" },
    { name: "Fat", value: Math.round(latestEntry.fatG / divisor), target: macroTargets.fatG, color: "var(--color-mars-yellow)", desc: "30–35%" },
    { name: "Fiber", value: Math.round(latestEntry.fiberG / divisor), target: macroTargets.fiberG, color: "var(--color-mars-green)", desc: "" },
  ];

  const microData = [
    { name: "Vitamin A", value: latestEntry.micronutrients.vitaminAMcg ?? 0, target: MICRO_TARGETS.vitaminAMcg * (isAll ? 4 : 1) },
    { name: "Vitamin C", value: latestEntry.micronutrients.vitaminCMg ?? 0, target: MICRO_TARGETS.vitaminCMg * (isAll ? 4 : 1) },
    { name: "Vitamin K", value: latestEntry.micronutrients.vitaminKMcg ?? 0, target: MICRO_TARGETS.vitaminKMcg * (isAll ? 4 : 1) },
    { name: "Folate", value: latestEntry.micronutrients.folateMcg ?? 0, target: MICRO_TARGETS.folateMcg * (isAll ? 4 : 1) },
    { name: "Iron", value: latestEntry.micronutrients.ironMg ?? 0, target: MICRO_TARGETS.ironMg * (isAll ? 4 : 1) },
    { name: "Potassium", value: latestEntry.micronutrients.potassiumMg ?? 0, target: MICRO_TARGETS.potassiumMg * (isAll ? 4 : 1) },
    { name: "Magnesium", value: latestEntry.micronutrients.magnesiumMg ?? 0, target: MICRO_TARGETS.magnesiumMg * (isAll ? 4 : 1) },
  ];

  // Heatmap: compute cell width to fill available space
  const dayCount = mockCoverageHeatmap.missionDays.length;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header with crew selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Nutrition</h1>
        <div className="flex gap-1">
          {CREW.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCrew(c.id)}
              className={`rounded border px-2.5 py-0.5 text-xs transition-colors ${
                selectedCrew === c.id
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {c.id === "all" ? "All" : c.name.split(" ").pop()}
            </button>
          ))}
        </div>
      </div>

      {/* Astronaut profile card (individual only) */}
      {!isAll && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">{crew.name}</span>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{crew.weight} kg</span>
                <span>{crew.kcalTarget} kcal/day target</span>
                <span>{crew.proteinTarget}g protein/day</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 max-w-xs justify-end">
              {crew.preferences.map((p) => (
                <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
              ))}
              {crew.restrictions.map((r) => (
                <Badge key={r} variant="outline" className="text-[10px] border-destructive/30 text-destructive">{r}</Badge>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Greenhouse Fraction — the core success metric */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="p-4">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Calorie GH Fraction</span>
          <p className="mt-2 font-mono text-2xl tabular-nums text-primary">{Math.round(latestEntry.calorieGhFraction * 100)}%</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted border border-border">
            <div className="h-full rounded-full" style={{ width: `${Math.min(latestEntry.calorieGhFraction * 100 * 4, 100)}%`, backgroundColor: latestEntry.calorieGhFraction >= 0.15 ? "var(--color-status-healthy)" : "var(--color-status-warning)" }} />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Target: 15-25% from greenhouse</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Protein GH Fraction</span>
          <p className="mt-2 font-mono text-2xl tabular-nums text-primary">{Math.round(latestEntry.proteinGhFraction * 100)}%</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted border border-border">
            <div className="h-full rounded-full" style={{ width: `${Math.min(latestEntry.proteinGhFraction * 100 * 4, 100)}%`, backgroundColor: latestEntry.proteinGhFraction >= 0.15 ? "var(--color-status-healthy)" : "var(--color-status-warning)" }} />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Target: 15-25% from greenhouse</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Micronutrients Covered</span>
          <p className="mt-2 font-mono text-2xl tabular-nums text-primary">{latestEntry.micronutrientsCovered}<span className="text-lg text-muted-foreground"> / 7</span></p>
          <div className="mt-1 flex gap-1">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="h-2 flex-1 rounded-full" style={{ backgroundColor: i < latestEntry.micronutrientsCovered ? "var(--color-status-healthy)" : "var(--border)" }} />
            ))}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Vit A, C, K, Folate, Fe, K, Mg</p>
        </Card>
      </div>

      {/* Row 1: Calorie chart + Risk hierarchy — matched height */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3" style={{ alignItems: "stretch" }}>
        <div className="lg:col-span-2 flex">
          <Card className="p-6 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Daily Calorie Intake
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl tabular-nums text-primary">
                  {displayCalories.toLocaleString()}
                </span>
                <span className="text-muted-foreground">/</span>
                <span className="font-mono text-lg tabular-nums text-muted-foreground">
                  {kcalTarget.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">kcal</span>
                <Badge
                  variant="outline"
                  className="ml-2 text-xs"
                  style={{
                    borderColor: caloriePercentage >= 90 ? "var(--color-status-healthy)" : "var(--color-status-warning)",
                    color: caloriePercentage >= 90 ? "var(--color-status-healthy)" : "var(--color-status-warning)",
                  }}
                >
                  {caloriePercentage}%
                </Badge>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={calorieChartData}>
                  <defs>
                    <linearGradient id="kcalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4924a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d4924a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: "var(--foreground)", fontSize: 11 }} tickLine={{ stroke: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fill: "var(--foreground)", fontSize: 11 }} tickLine={{ stroke: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--muted-foreground)" }} domain={isAll ? [6000, 14000] : [1500, 4000]} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={kcalTarget} stroke="#d4924a" strokeDasharray="5 5" label={{ value: "Target", fill: "#d4924a", fontSize: 10, position: "right" }} />
                  <Area type="monotone" dataKey="calories" stroke="#d4924a" strokeWidth={2} fill="url(#kcalGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="flex">
          <Card className="p-6 flex flex-col flex-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Nutritional Risk Hierarchy
            </span>
            <p className="mt-1 text-[10px] text-muted-foreground">Priority order per mission protocol</p>
            <div className="mt-4 space-y-3 flex-1">
              {RISK_HIERARCHY.map((risk) => {
                const { percent, status } = riskStatus(risk.key, latestEntry);
                return (
                  <div key={risk.key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground w-4">{risk.rank}.</span>
                        {statusDot(status)}
                        <span className="text-sm">{risk.label}</span>
                      </div>
                      <span className="font-mono text-xs tabular-nums">{percent}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted border border-border ml-6">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${Math.min(percent, 100)}%`,
                          backgroundColor: status === "HEALTHY" ? "var(--color-status-healthy)" : status === "WARNING" ? "var(--color-status-warning)" : "var(--color-status-critical)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto pt-4 border-t border-border">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Recommended Allocation</span>
              <div className="mt-2 space-y-1.5">
                {[
                  { label: "Potatoes", pct: "40–50%", color: "var(--color-mars-amber)" },
                  { label: "Legumes", pct: "20–30%", color: "var(--color-mars-green)" },
                  { label: "Leafy Greens", pct: "15–20%", color: "var(--color-status-healthy)" },
                  { label: "Radishes & Herbs", pct: "5–10%", color: "var(--color-mars-purple)" },
                ].map((a) => (
                  <div key={a.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: a.color }} />
                      <span className="text-muted-foreground">{a.label}</span>
                    </div>
                    <span className="font-mono tabular-nums">{a.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Row 2: Macronutrient Breakdown + Micronutrient Coverage — matched height */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2" style={{ alignItems: "stretch" }}>
        <div className="flex">
          <Card className="p-6 flex flex-col flex-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Macronutrient Breakdown
            </span>
            <div className="mt-4 flex-1 flex flex-col justify-between">
              {macros.map((macro) => {
                const percentage = Math.min((macro.value / macro.target) * 100, 100);
                return (
                  <div key={macro.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{macro.name}</span>
                        {macro.desc && <span className="text-[10px] text-muted-foreground">{macro.desc}</span>}
                      </div>
                      <span className="text-muted-foreground font-mono tabular-nums text-xs">
                        {macro.value}g / {macro.target}g
                      </span>
                    </div>
                    <div className="relative h-2.5 overflow-hidden rounded-full bg-muted border border-border">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${percentage}%`, backgroundColor: macro.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="flex">
          <Card className="p-6 flex flex-col flex-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Micronutrient Coverage
            </span>
            <div className="mt-4 flex-1 flex flex-col justify-between">
              {microData.map((micro) => {
                const displayVal = isAll ? micro.value : Math.round(micro.value / 4);
                const pct = Math.min(Math.round((displayVal / micro.target) * 100), 100);
                return (
                  <div key={micro.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">{micro.name}</span>
                    <div className="flex-1 h-2.5 overflow-hidden rounded-full bg-muted border border-border">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: getCoverageColor(pct) }} />
                    </div>
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground w-10 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-4 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded" style={{ backgroundColor: "var(--color-status-critical)" }} />
                <span>&lt;50%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded" style={{ backgroundColor: "var(--color-status-warning)" }} />
                <span>50–80%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded" style={{ backgroundColor: "var(--color-status-healthy)" }} />
                <span>&gt;80%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Row 3: Coverage heatmap — full width cells */}
      <Card className="p-6">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Coverage Heatmap — 14 Day Trend
        </span>

        <div className="mt-4 space-y-1">
          {/* Header row */}
          <div className="grid gap-x-1 gap-y-1.5" style={{ gridTemplateColumns: `100px repeat(${dayCount}, 1fr)` }}>
            <div />
            {mockCoverageHeatmap.missionDays.map((day) => (
              <div key={day} className="flex h-7 items-center justify-center text-[10px] text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {mockCoverageHeatmap.nutrients.map((nutrient, rowIndex) => (
            <div
              key={nutrient}
              className="grid gap-1"
              style={{ gridTemplateColumns: `100px repeat(${dayCount}, 1fr)` }}
            >
              <div className="flex items-center text-xs text-muted-foreground pr-2">{nutrient}</div>
              {mockCoverageHeatmap.coverage[rowIndex].map((percent, colIndex) => (
                <div
                  key={colIndex}
                  className="group relative flex h-[28px] items-center justify-center"
                >
                  <div
                    className="h-full w-full rounded-sm transition-opacity hover:opacity-80"
                    style={{ backgroundColor: getCoverageColor(percent) }}
                    title={`${nutrient} - Day ${mockCoverageHeatmap.missionDays[colIndex]}: ${percent}%`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {percent}%
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

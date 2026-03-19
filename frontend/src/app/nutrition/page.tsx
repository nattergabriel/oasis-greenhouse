"use client";

import { useState, useMemo } from "react";
import { mockNutritionEntries, mockCoverageHeatmap } from "@/lib/mock-data";
import { api, useApi } from "@/lib/api";
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
import { X, AlertTriangle, ChevronDown } from "lucide-react";

// === Astronaut profiles (from doc: 4 astronauts, ~75kg avg, 3000 kcal/day each) ===
const CREW = [
  { id: "all", name: "All Crew", weight: 75, kcalTarget: 12000, proteinTarget: 480, preferences: [] as string[], restrictions: [] as string[] },
  { id: "cmdr", name: "Cmdr. Novak", weight: 82, kcalTarget: 3200, proteinTarget: 130, preferences: ["High protein", "Low sodium"], restrictions: [] },
  { id: "eng", name: "Dr. Tanaka", weight: 68, kcalTarget: 2800, proteinTarget: 105, preferences: ["Plant-forward"], restrictions: ["Gluten sensitivity"] },
  { id: "bio", name: "Dr. Okafor", weight: 74, kcalTarget: 3000, proteinTarget: 120, preferences: ["High fiber", "Fermented foods"], restrictions: [] },
  { id: "plt", name: "Lt. Reyes", weight: 78, kcalTarget: 3000, proteinTarget: 125, preferences: ["Calorie dense"], restrictions: ["Soy allergy"] },
];

const MACRO_TARGETS_CREW = { proteinG: 480, carbsG: 1350, fatG: 433, fiberG: 120 };

// Per-astronaut share factors and nutrient biases (diet preferences affect distribution)
const ASTRONAUT_FACTORS: Record<string, { calShare: number; proteinBias: number; carbBias: number; fatBias: number; fiberBias: number; microBias: number[] }> = {
  cmdr: { calShare: 3200 / 12000, proteinBias: 1.15, carbBias: 0.97, fatBias: 1.02, fiberBias: 0.90, microBias: [0.92, 0.88, 0.93, 0.88, 1.08, 0.98, 0.93] },
  eng:  { calShare: 2800 / 12000, proteinBias: 0.85, carbBias: 1.08, fatBias: 0.92, fiberBias: 1.15, microBias: [1.12, 1.18, 1.12, 1.08, 0.88, 1.06, 1.12] },
  bio:  { calShare: 3000 / 12000, proteinBias: 1.00, carbBias: 0.98, fatBias: 1.00, fiberBias: 1.20, microBias: [1.02, 1.04, 1.00, 1.12, 1.15, 1.02, 1.08] },
  plt:  { calShare: 3000 / 12000, proteinBias: 1.05, carbBias: 1.02, fatBias: 1.08, fiberBias: 0.85, microBias: [0.94, 0.90, 0.95, 0.92, 0.89, 0.94, 0.88] },
};

const MICRO_KEYS = ["vitaminAMcg", "vitaminCMg", "vitaminKMcg", "folateMcg", "ironMg", "potassiumMg", "magnesiumMg"] as const;
const MICRO_NAMES = ["Vitamin A", "Vitamin C", "Vitamin K", "Folate", "Iron", "Potassium", "Magnesium"];

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

const DEFICIENCY_IMPACTS: Record<string, { warning: string; suggestion: string }> = {
  "Vitamin A": { warning: "Low vitamin A can impair vision adaptation in low-light conditions and weaken immune response.", suggestion: "Increase lettuce and herb allocation; both are high in vitamin A." },
  "Vitamin C": { warning: "Vitamin C below target increases risk of fatigue, slow wound healing, and weakened immunity.", suggestion: "Prioritize radish and lettuce harvests; consider raw consumption to preserve vitamin C." },
  "Vitamin K": { warning: "Insufficient vitamin K impairs blood clotting and bone metabolism.", suggestion: "Herbs (basil) are the richest source — ensure Zone 4 herb allocation is maintained." },
  "Folate": { warning: "Low folate affects cell division and can cause fatigue and cognitive impairment.", suggestion: "Beans & peas provide the highest folate density; maintain legume zones." },
  "Iron": { warning: "Iron deficiency leads to fatigue, reduced cognitive performance, and impaired physical endurance — dangerous for mission-critical tasks.", suggestion: "Increase beans & peas allocation. Iron absorption improves when paired with vitamin C sources." },
  "Potassium": { warning: "Low potassium can cause muscle weakness, cramping, and cardiac irregularities.", suggestion: "Potatoes and beans are top potassium sources; ensure consistent harvesting." },
  "Magnesium": { warning: "Magnesium deficiency affects muscle function, sleep quality, and stress response.", suggestion: "Beans & peas and herbs provide the best magnesium; maintain current allocations." },
};

function getCoverageColor(percent: number): string {
  if (percent > 80) return "var(--color-status-healthy)";
  if (percent >= 50) return "var(--color-status-warning)";
  return "var(--color-status-critical)";
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

function generateAdvisories(selectedCrew: string, heatmap: typeof mockCoverageHeatmap, entries: typeof mockNutritionEntries): { id: string; severity: "warning" | "critical"; nutrient: string; message: string; suggestion: string }[] {
  const advisories: { id: string; severity: "warning" | "critical"; nutrient: string; message: string; suggestion: string }[] = [];
  const factor = selectedCrew !== "all" ? ASTRONAUT_FACTORS[selectedCrew] : null;

  const recentDays = 5;
  const startIdx = heatmap.coverage[0].length - recentDays;

  heatmap.nutrients.forEach((nutrient, rowIdx) => {
    const recentCoverage = heatmap.coverage[rowIdx].slice(startIdx);
    const adjustedCoverage = factor
      ? recentCoverage.map(v => Math.round(v * factor.microBias[rowIdx]))
      : recentCoverage;

    const avg = Math.round(adjustedCoverage.reduce((a, b) => a + b, 0) / adjustedCoverage.length);
    const impact = DEFICIENCY_IMPACTS[nutrient];
    if (!impact) return;

    if (avg < 50) {
      advisories.push({ id: `adv-${selectedCrew}-${nutrient}`, severity: "critical", nutrient, message: impact.warning, suggestion: impact.suggestion });
    } else if (avg < 65) {
      advisories.push({ id: `adv-${selectedCrew}-${nutrient}`, severity: "warning", nutrient, message: impact.warning, suggestion: impact.suggestion });
    }
  });

  // Check protein
  const latestEntry = entries[entries.length - 1];
  const crew = CREW.find(c => c.id === selectedCrew)!;
  const proteinTarget = crew.proteinTarget;
  const proteinValue = selectedCrew === "all"
    ? latestEntry.proteinG
    : Math.round(latestEntry.proteinG * (factor?.calShare ?? 0.25) * (factor?.proteinBias ?? 1));
  if (Math.round((proteinValue / proteinTarget) * 100) < 75) {
    advisories.push({ id: `adv-${selectedCrew}-protein`, severity: "warning", nutrient: "Protein", message: "Protein intake is below 75% of target. Sustained deficiency causes muscle wasting and impaired recovery.", suggestion: "Increase beans & peas zone allocation for higher protein yield." });
  }

  return advisories.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1));
}

export default function NutritionPage() {
  const { state } = useSimulation();
  const [selectedCrew, setSelectedCrew] = useState("all");
  const [dismissedAdvisories, setDismissedAdvisories] = useState<Set<string>>(new Set());
  const [advisoriesExpanded, setAdvisoriesExpanded] = useState(false);
  const nutritionEntries = useApi(() => api.nutrition.consumption("", "").then(r => r.dailyEntries), mockNutritionEntries);
  const coverageHeatmap = useApi(() => api.nutrition.coverageHeatmap(), mockCoverageHeatmap);
  const latestEntry = nutritionEntries[nutritionEntries.length - 1];

  const crew = CREW.find((c) => c.id === selectedCrew)!;
  const isAll = selectedCrew === "all";
  const factor = !isAll ? ASTRONAUT_FACTORS[selectedCrew] : null;
  const kcalTarget = crew.kcalTarget;

  const displayCalories = isAll
    ? latestEntry.totalCalories
    : Math.round(latestEntry.totalCalories * factor!.calShare);

  const macroTargets = isAll
    ? MACRO_TARGETS_CREW
    : {
        proteinG: crew.proteinTarget,
        carbsG: Math.round(crew.kcalTarget * 0.50 / 4),
        fatG: Math.round(crew.kcalTarget * 0.325 / 9),
        fiberG: 30,
      };

  const calorieChartData = nutritionEntries.map((entry) => ({
    date: `${new Date(entry.date).getMonth() + 1}/${new Date(entry.date).getDate()}`,
    calories: isAll ? entry.totalCalories : Math.round(entry.totalCalories * factor!.calShare),
  }));

  const caloriePercentage = Math.round((displayCalories / kcalTarget) * 100);

  const macros = isAll
    ? [
        { name: "Protein", value: latestEntry.proteinG, target: macroTargets.proteinG, color: "var(--color-mars-blue)", desc: "15–20%" },
        { name: "Carbs", value: latestEntry.carbsG, target: macroTargets.carbsG, color: "var(--color-mars-yellow)", desc: "45–55%" },
        { name: "Fat", value: latestEntry.fatG, target: macroTargets.fatG, color: "var(--color-mars-yellow)", desc: "30–35%" },
        { name: "Fiber", value: latestEntry.fiberG, target: macroTargets.fiberG, color: "var(--color-mars-green)", desc: "" },
      ]
    : [
        { name: "Protein", value: Math.round(latestEntry.proteinG * factor!.calShare * factor!.proteinBias), target: macroTargets.proteinG, color: "var(--color-mars-blue)", desc: "15–20%" },
        { name: "Carbs", value: Math.round(latestEntry.carbsG * factor!.calShare * factor!.carbBias), target: macroTargets.carbsG, color: "var(--color-mars-yellow)", desc: "45–55%" },
        { name: "Fat", value: Math.round(latestEntry.fatG * factor!.calShare * factor!.fatBias), target: macroTargets.fatG, color: "var(--color-mars-yellow)", desc: "30–35%" },
        { name: "Fiber", value: Math.round(latestEntry.fiberG * factor!.calShare * factor!.fiberBias), target: macroTargets.fiberG, color: "var(--color-mars-green)", desc: "" },
      ];

  const microData = MICRO_KEYS.map((key, i) => {
    const rawValue = latestEntry.micronutrients[key] ?? 0;
    const value = isAll ? rawValue : Math.round(rawValue * factor!.calShare * factor!.microBias[i]);
    const target = MICRO_TARGETS[key] * (isAll ? 4 : 1);
    return { name: MICRO_NAMES[i], value, target };
  });

  function riskStatus(key: string): { percent: number; status: string } {
    if (key === "calories") {
      const p = Math.round((displayCalories / kcalTarget) * 100);
      return { percent: p, status: p >= 90 ? "HEALTHY" : p >= 70 ? "WARNING" : "CRITICAL" };
    }
    if (key === "protein") {
      const proteinVal = isAll ? latestEntry.proteinG : Math.round(latestEntry.proteinG * factor!.calShare * factor!.proteinBias);
      const p = Math.round((proteinVal / macroTargets.proteinG) * 100);
      return { percent: p, status: p >= 80 ? "HEALTHY" : p >= 60 ? "WARNING" : "CRITICAL" };
    }
    if (key === "micro") {
      const coverages = microData.map(m => m.value / m.target);
      const avg = Math.round(coverages.reduce((a, b) => a + b, 0) / coverages.length * 100);
      return { percent: avg, status: avg >= 70 ? "HEALTHY" : avg >= 50 ? "WARNING" : "CRITICAL" };
    }
    return { percent: 75, status: "HEALTHY" };
  }

  const dayCount = coverageHeatmap.missionDays.length;

  const heatmapCoverage = isAll
    ? coverageHeatmap.coverage
    : coverageHeatmap.coverage.map((row, rowIdx) =>
        row.map(val => Math.min(100, Math.round(val * factor!.microBias[rowIdx])))
      );

  const advisories = useMemo(() => generateAdvisories(selectedCrew, coverageHeatmap, nutritionEntries), [selectedCrew, coverageHeatmap, nutritionEntries]);
  const visibleAdvisories = advisories.filter(a => !dismissedAdvisories.has(a.id));

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

      {/* Nutrition advisories — collapsible stack when multiple */}
      {visibleAdvisories.length === 1 && (
        <div
          className="flex items-start gap-3 rounded-lg border p-3"
          style={{
            borderColor: visibleAdvisories[0].severity === "critical" ? "var(--color-status-critical)" : "var(--color-status-warning)",
            borderLeftWidth: 3,
          }}
        >
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color: visibleAdvisories[0].severity === "critical" ? "var(--color-status-critical)" : "var(--color-status-warning)" }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{visibleAdvisories[0].nutrient} Deficiency</span>
              <Badge
                variant="outline"
                className="text-[10px]"
                style={{
                  borderColor: visibleAdvisories[0].severity === "critical" ? "var(--color-status-critical)" : "var(--color-status-warning)",
                  color: visibleAdvisories[0].severity === "critical" ? "var(--color-status-critical)" : "var(--color-status-warning)",
                }}
              >
                {visibleAdvisories[0].severity}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{visibleAdvisories[0].message}</p>
            <p className="mt-1 text-xs text-foreground/80">{visibleAdvisories[0].suggestion}</p>
          </div>
          <button
            onClick={() => setDismissedAdvisories(prev => new Set(prev).add(visibleAdvisories[0].id))}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {visibleAdvisories.length > 1 && (() => {
        const critCount = visibleAdvisories.filter(a => a.severity === "critical").length;
        const warnCount = visibleAdvisories.length - critCount;
        const worstSeverity = critCount > 0 ? "critical" : "warning";
        const severityColor = worstSeverity === "critical" ? "var(--color-status-critical)" : "var(--color-status-warning)";
        return (
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: severityColor, borderLeftWidth: 3 }}>
            <button
              onClick={() => setAdvisoriesExpanded(prev => !prev)}
              className="flex w-full items-center gap-3 p-3 text-left hover:bg-secondary/50 transition-colors"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: severityColor }} />
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm font-medium">Nutritional Advisories</span>
                {critCount > 0 && (
                  <Badge variant="outline" className="text-[10px]" style={{ borderColor: "var(--color-status-critical)", color: "var(--color-status-critical)" }}>
                    {critCount} critical
                  </Badge>
                )}
                {warnCount > 0 && (
                  <Badge variant="outline" className="text-[10px]" style={{ borderColor: "var(--color-status-warning)", color: "var(--color-status-warning)" }}>
                    {warnCount} warning
                  </Badge>
                )}
              </div>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
                style={{ transform: advisoriesExpanded ? "rotate(180deg)" : undefined }}
              />
            </button>
            {advisoriesExpanded && (
              <div className="border-t border-border">
                {visibleAdvisories.map((advisory) => (
                  <div
                    key={advisory.id}
                    className="flex items-start gap-3 border-b border-border last:border-b-0 px-3 py-2.5"
                  >
                    <div
                      className="mt-1 h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: advisory.severity === "critical" ? "var(--color-status-critical)" : "var(--color-status-warning)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{advisory.nutrient}</span>
                        <span className="text-[10px] text-muted-foreground">{advisory.severity}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{advisory.message}</p>
                      <p className="mt-1 text-xs text-foreground/80">{advisory.suggestion}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDismissedAdvisories(prev => new Set(prev).add(advisory.id)); }}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

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
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Greenhouse Calorie Share</span>
          <p className="mt-2 font-mono text-2xl tabular-nums text-primary">{Math.round(latestEntry.calorieGhFraction * 100)}%</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted border border-border">
            <div className="h-full rounded-full" style={{ width: `${Math.min(latestEntry.calorieGhFraction * 100 * 4, 100)}%`, backgroundColor: latestEntry.calorieGhFraction >= 0.15 ? "var(--color-status-healthy)" : "var(--color-status-warning)" }} />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">% of daily calories grown in greenhouse (target: 15-25%)</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Greenhouse Protein Share</span>
          <p className="mt-2 font-mono text-2xl tabular-nums text-primary">{Math.round(latestEntry.proteinGhFraction * 100)}%</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted border border-border">
            <div className="h-full rounded-full" style={{ width: `${Math.min(latestEntry.proteinGhFraction * 100 * 4, 100)}%`, backgroundColor: latestEntry.proteinGhFraction >= 0.15 ? "var(--color-status-healthy)" : "var(--color-status-warning)" }} />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">% of daily protein grown in greenhouse (target: 15-25%)</p>
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
            <div className="flex-1 min-h-[280px]">
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
                  <YAxis tick={{ fill: "var(--foreground)", fontSize: 11 }} tickLine={{ stroke: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--muted-foreground)" }} domain={isAll ? [6000, 14000] : [Math.round(kcalTarget * 0.6), Math.round(kcalTarget * 1.3)]} />
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
                const { percent, status } = riskStatus(risk.key);
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
                const pct = Math.min(Math.round((micro.value / micro.target) * 100), 100);
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
            {coverageHeatmap.missionDays.map((day) => (
              <div key={day} className="flex h-7 items-center justify-center text-[10px] text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {coverageHeatmap.nutrients.map((nutrient, rowIndex) => (
            <div
              key={nutrient}
              className="grid gap-1"
              style={{ gridTemplateColumns: `100px repeat(${dayCount}, 1fr)` }}
            >
              <div className="flex items-center text-xs text-muted-foreground pr-2">{nutrient}</div>
              {heatmapCoverage[rowIndex].map((percent, colIndex) => (
                <div
                  key={colIndex}
                  className="group relative flex h-[28px] items-center justify-center"
                >
                  <div
                    className="h-full w-full rounded-sm transition-opacity hover:opacity-80"
                    style={{ backgroundColor: getCoverageColor(percent) }}
                    title={`${nutrient} - Day ${coverageHeatmap.missionDays[colIndex]}: ${percent}%`}
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

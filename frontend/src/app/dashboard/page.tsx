"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useSimulation } from "@/providers/simulation-provider";
import { mockSensorSnapshot, mockWeather, mockStockpile, mockStoredFood, mockNutritionEntries } from "@/lib/mock-data";
import { GreenhouseCrossSection } from "@/components/greenhouse-cross-section";

function statusColor(status: string) {
  if (status === "healthy" || status === "HEALTHY" || status === "NORMAL") return "var(--color-status-healthy)";
  if (status === "warning" || status === "NEEDS_ATTENTION" || status === "WARNING") return "var(--color-status-warning)";
  return "var(--color-status-critical)";
}

export default function DashboardPage() {
  const { state } = useSimulation();
  const { resources } = state;
  const sensor = mockSensorSnapshot;
  const weather = mockWeather;
  const totalCalories = mockStockpile.reduce((s, i) => s + i.estimatedCalories, 0);
  const latestNutrition = mockNutritionEntries[mockNutritionEntries.length - 1];
  const ghFractionPct = Math.round(latestNutrition.calorieGhFraction * 100);
  const storedPct = Math.round((mockStoredFood.remainingCalories / mockStoredFood.totalCalories) * 100);

  const openAlerts = state.alerts.filter((a) => a.status === "OPEN");
  const criticalAlert = openAlerts.find((a) => a.severity === "CRITICAL");
  const pendingRecs = state.recommendations.filter((r) => r.status === "PENDING");
  const missionProgress = (state.currentMissionDay / state.totalMissionDays) * 100;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <span className="text-sm text-muted-foreground font-mono tabular-nums">
          SOL {state.currentMissionDay} / {state.totalMissionDays}
        </span>
      </div>

      {/* Mission Progress */}
      <div className="h-1.5 overflow-hidden rounded-full bg-muted border border-border">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${missionProgress}%` }} />
      </div>

      {/* Row 1: Greenhouse visualization (left) + Live stats (right) */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2" style={{ alignItems: "stretch" }}>
        {/* Animated greenhouse — clickable to /greenhouse */}
        <Link href="/greenhouse" className="block hover:opacity-95 transition-opacity">
          <GreenhouseCrossSection compact />
        </Link>

        {/* Companion panel: resources + sensors at a glance */}
        <div className="flex flex-col gap-3">
          {/* Resource meters */}
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Water" value={`${Math.round(resources.waterReservePercent)}%`} status={resources.waterReservePercent > 50 ? "healthy" : resources.waterReservePercent > 25 ? "warning" : "critical"} />
            <MetricCard label="Nutrients" value={`${Math.round(resources.nutrientReservePercent)}%`} status={resources.nutrientReservePercent > 50 ? "healthy" : resources.nutrientReservePercent > 25 ? "warning" : "critical"} />
            <MetricCard label="Energy" value={`${Math.round(resources.energyReservePercent)}%`} status={resources.energyReservePercent > 50 ? "healthy" : resources.energyReservePercent > 25 ? "warning" : "critical"} />
          </div>

          {/* Compact sensor readings */}
          <Card className="p-4 flex-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Environment</span>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
              <SensorRow label="Temp" value={`${sensor.temperature.value}°C`} status={sensor.temperature.status} />
              <SensorRow label="Humidity" value={`${sensor.humidity.value}%`} status={sensor.humidity.status} />
              <SensorRow label="CO₂" value={`${sensor.co2.value} ppm`} status={sensor.co2.status} />
              <SensorRow label="PAR" value={`${sensor.par.value}`} status={sensor.par.status} />
              <SensorRow label="pH" value={`${sensor.nutrientSolution.ph.value}`} status={sensor.nutrientSolution.ph.status} />
              <SensorRow label="EC" value={`${sensor.nutrientSolution.ec.value}`} status={sensor.nutrientSolution.ec.status} />
            </div>
          </Card>
        </div>
      </div>

      {/* Row 2: Weather + Food Supply */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card className="p-4">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Mars Weather</span>
          <div className="mt-3 space-y-2">
            <SensorRow label="External Temp" value={`${weather.externalTemperature}°C`} />
            <SensorRow label="Solar Irradiance" value={`${weather.solarIrradiance} W/m²`} />
            <SensorRow label="Dust Storm Index" value={`${weather.dustStormIndex} / 10`} />
            <SensorRow label="Pressure" value={`${weather.atmosphericPressure} Pa`} />
          </div>
          {weather.forecast.some((f) => f.dustStormRisk === "HIGH") && (
            <div className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Dust storm warning in forecast window
            </div>
          )}
        </Card>

        <Card className="p-4">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Food Supply</span>
          <div className="mt-3 space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">GH Fraction</span>
                <span className="font-mono tabular-nums text-primary">{ghFractionPct}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted border border-border">
                <div className="h-full rounded-full" style={{ width: `${ghFractionPct}%`, backgroundColor: ghFractionPct >= 15 ? "var(--color-status-healthy)" : "var(--color-status-warning)" }} />
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Target: 15-25% of calories from greenhouse</p>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mission Reserves</span>
                <span className="font-mono tabular-nums">{storedPct}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted border border-border">
                <div className="h-full rounded-full" style={{ width: `${storedPct}%`, backgroundColor: storedPct > 50 ? "var(--color-status-healthy)" : storedPct > 25 ? "var(--color-status-warning)" : "var(--color-status-critical)" }} />
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{(mockStoredFood.remainingCalories / 1000).toFixed(0)}k / {(mockStoredFood.totalCalories / 1000).toFixed(0)}k kcal stored</p>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Harvested</span>
                <span className="font-mono tabular-nums">{totalCalories.toLocaleString()} kcal</span>
              </div>
              {mockStockpile.slice(0, 3).map((item) => (
                <div key={item.cropId} className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span>{item.cropName}</span>
                  <span className="font-mono tabular-nums">{item.quantityKg} kg</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3: Alerts + Agent Status */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Link href="/activity" className="block">
          <Card className="p-4 hover:bg-secondary transition-colors h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Alerts</span>
              {openAlerts.length > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-destructive text-[10px] font-bold text-white">
                  {openAlerts.length}
                </span>
              )}
            </div>
            {criticalAlert ? (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: "var(--color-status-critical)" }} />
                <p className="text-sm truncate">{criticalAlert.diagnosis}</p>
              </div>
            ) : openAlerts.length > 0 ? (
              <p className="mt-2 text-sm">{openAlerts.length} open alert{openAlerts.length > 1 ? "s" : ""} — no criticals</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">All systems nominal</p>
            )}
          </Card>
        </Link>

        <Link href="/activity" className="block">
          <Card className="p-4 hover:bg-secondary transition-colors h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">AI Agent</span>
              {pendingRecs.length > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: "var(--color-agent-purple)" }}>
                  {pendingRecs.length}
                </span>
              )}
            </div>
            {pendingRecs.length > 0 ? (
              <p className="mt-2 text-sm">{pendingRecs.length} decision{pendingRecs.length > 1 ? "s" : ""} awaiting approval</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Operating autonomously</p>
            )}
          </Card>
        </Link>
      </div>
    </div>
  );
}

function MetricCard({ label, value, status }: { label: string; value: string; status: string }) {
  return (
    <Card className="p-3 border-l-2" style={{ borderLeftColor: statusColor(status) }}>
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor(status) }} />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1.5 font-mono text-2xl tabular-nums">{value}</p>
    </Card>
  );
}

function SensorRow({ label, value, status }: { label: string; value: string; status?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-1.5">
        {status && (
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor(status) }} />
        )}
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}

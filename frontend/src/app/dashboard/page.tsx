"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useSimulation } from "@/providers/simulation-provider";
import { mockSensorSnapshot, mockWeather, mockStockpile, mockStoredFood, mockNutritionEntries } from "@/lib/mock-data";
import { GreenhouseCrossSection } from "@/components/greenhouse-cross-section";
import { Droplet, Leaf, Zap, Sun, AlertTriangle, Thermometer, Gauge, SunDim, Moon } from "lucide-react";
import type { RiskLevel } from "@/lib/types";

function statusColor(status: string) {
  if (status === "healthy" || status === "HEALTHY" || status === "NORMAL") return "var(--color-status-healthy)";
  if (status === "warning" || status === "NEEDS_ATTENTION" || status === "WARNING") return "var(--color-status-warning)";
  return "var(--color-status-critical)";
}

function riskColor(risk: RiskLevel): string {
  if (risk === "LOW") return "var(--color-status-healthy)";
  if (risk === "MODERATE") return "var(--color-status-warning)";
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

  // Sensor alerts: find any WARNING or CRITICAL sensors
  const sensorStatuses = [
    { label: "Temp", status: sensor.temperature.status },
    { label: "Humidity", status: sensor.humidity.status },
    { label: "CO2", status: sensor.co2.status },
    { label: "PAR", status: sensor.par.status },
    { label: "pH", status: sensor.nutrientSolution.ph.status },
    { label: "EC", status: sensor.nutrientSolution.ec.status },
  ];
  const warningSensors = sensorStatuses.filter((s) => s.status === "WARNING" || s.status === "CRITICAL");

  // Weather: next 3 days for mini forecast
  const next3Days = weather.forecast.slice(0, 3);
  const hasDustWarning = weather.forecast.some((f) => f.dustStormRisk === "HIGH");

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
          {/* Resource meters — distinct colors, clickable */}
          <div className="grid grid-cols-3 gap-3">
            <MetricCard
              label="Water"
              value={`${Math.round(resources.waterReservePercent)}%`}
              status={resources.waterReservePercent > 50 ? "healthy" : resources.waterReservePercent > 25 ? "warning" : "critical"}
              accentColor="#3d8ab0"
              icon={<Droplet className="h-3.5 w-3.5" style={{ color: "#3d8ab0" }} />}
              href="/greenhouse"
            />
            <MetricCard
              label="Nutrients"
              value={`${Math.round(resources.nutrientReservePercent)}%`}
              status={resources.nutrientReservePercent > 50 ? "healthy" : resources.nutrientReservePercent > 25 ? "warning" : "critical"}
              accentColor="#5a9a6b"
              icon={<Leaf className="h-3.5 w-3.5" style={{ color: "#5a9a6b" }} />}
              href="/greenhouse"
            />
            <MetricCard
              label="Energy"
              value={`${Math.round(resources.energyReservePercent)}%`}
              status={resources.energyReservePercent > 50 ? "healthy" : resources.energyReservePercent > 25 ? "warning" : "critical"}
              accentColor="#d4924a"
              icon={<Zap className="h-3.5 w-3.5" style={{ color: "#d4924a" }} />}
              href="/greenhouse"
            />
          </div>

          {/* Compact sensor readings — clickable to /greenhouse */}
          <Link href="/greenhouse" className="block flex-1">
            <Card className="p-4 h-full flex flex-col hover:bg-secondary/50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Environment</span>
                <div className="flex items-center gap-1.5">
                  {sensor.lightCyclePhase === "DAY" ? (
                    <Sun className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{sensor.lightCyclePhase} cycle</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 flex-1">
                <SensorRow label="Temp" value={`${sensor.temperature.value}°C`} status={sensor.temperature.status} />
                <SensorRow label="Humidity" value={`${sensor.humidity.value}%`} status={sensor.humidity.status} />
                <SensorRow label="CO2" value={`${sensor.co2.value} ppm`} status={sensor.co2.status} />
                <SensorRow label="PAR" value={`${sensor.par.value}`} status={sensor.par.status} />
                <SensorRow label="pH" value={`${sensor.nutrientSolution.ph.value}`} status={sensor.nutrientSolution.ph.status} />
                <SensorRow label="EC" value={`${sensor.nutrientSolution.ec.value}`} status={sensor.nutrientSolution.ec.status} />
                <SensorRow label="H2O Flow" value={`${sensor.waterFlowRate.value} L/h`} status={sensor.waterFlowRate.status} />
                <SensorRow label="Recycle" value={`${sensor.waterRecyclingEfficiency.value}%`} status={sensor.waterRecyclingEfficiency.status} />
              </div>
              {/* Sensor alert banner */}
              {warningSensors.length > 0 && (
                <div className="mt-3 rounded-lg px-3 py-2 text-xs flex items-center gap-2" style={{ backgroundColor: "rgba(196, 163, 68, 0.1)", color: "var(--color-status-warning)" }}>
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>{warningSensors.map((s) => s.label).join(", ")} {warningSensors.length === 1 ? "needs" : "need"} attention</span>
                </div>
              )}
            </Card>
          </Link>
        </div>
      </div>

      {/* Row 2: Weather + Food Supply */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Mars Weather — clickable to /forecasting */}
        <Link href="/forecasting" className="block">
          <Card className="p-4 hover:bg-secondary/50 transition-colors h-full">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Mars Weather</span>

            {/* Current readings — 2x2 grid like forecast page */}
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Sun className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="text-muted-foreground">Solar</span>
                <span className="ml-auto font-mono tabular-nums">{weather.solarIrradiance} W/m²</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="text-muted-foreground">Dust</span>
                <span className="ml-auto font-mono tabular-nums">{weather.dustStormIndex.toFixed(1)}/10</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Thermometer className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">Ext Temp</span>
                <span className="ml-auto font-mono tabular-nums">{weather.externalTemperature}°C</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Gauge className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">Pressure</span>
                <span className="ml-auto font-mono tabular-nums">{weather.atmosphericPressure} Pa</span>
              </div>
            </div>

            {/* Dust storm warning */}
            {hasDustWarning && (
              <div className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                Dust storm warning in forecast window
              </div>
            )}

            {/* Mini 3-day forecast */}
            <div className="mt-3 border-t border-border pt-3">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">3-Day Outlook</span>
              <div className="mt-2 space-y-1.5">
                {next3Days.map((day) => (
                  <div key={day.missionDay} className="flex items-center justify-between rounded-lg border border-border px-3 py-1.5">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">SOL {day.missionDay}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <SunDim className="h-3 w-3 text-primary" />
                        <span className="font-mono text-xs tabular-nums">{day.solarIrradiance}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: riskColor(day.dustStormRisk) }} />
                        <span className="text-xs">{day.dustStormRisk}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Link>

        <Card className="p-4 h-full flex flex-col">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Food Supply</span>
          <div className="mt-3 flex-1 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">GH Fraction</span>
                <span className="font-mono tabular-nums text-primary">{ghFractionPct}%</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted border border-border">
                <div className="h-full rounded-full" style={{ width: `${ghFractionPct}%`, backgroundColor: ghFractionPct >= 15 ? "var(--color-status-healthy)" : "var(--color-status-warning)" }} />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">Target: 15-25% of calories from greenhouse</p>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mission Reserves</span>
                <span className="font-mono tabular-nums">{storedPct}%</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted border border-border">
                <div className="h-full rounded-full" style={{ width: `${storedPct}%`, backgroundColor: storedPct > 50 ? "var(--color-status-healthy)" : storedPct > 25 ? "var(--color-status-warning)" : "var(--color-status-critical)" }} />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">{(mockStoredFood.remainingCalories / 1000).toFixed(0)}k / {(mockStoredFood.totalCalories / 1000).toFixed(0)}k kcal stored</p>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Harvested</span>
                <span className="font-mono tabular-nums">{totalCalories.toLocaleString()} kcal</span>
              </div>
              <div className="mt-2 space-y-1.5">
                {mockStockpile.slice(0, 3).map((item) => (
                  <div key={item.cropId} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.cropName}</span>
                    <span className="font-mono tabular-nums">{item.quantityKg} kg</span>
                  </div>
                ))}
              </div>
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

function MetricCard({ label, value, status, accentColor, icon, href }: { label: string; value: string; status: string; accentColor: string; icon: React.ReactNode; href: string }) {
  return (
    <Link href={href} className="block">
      <Card className="p-3 border-l-2 hover:bg-secondary/50 transition-colors" style={{ borderLeftColor: accentColor }}>
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        </div>
        <p className="mt-1.5 font-mono text-2xl tabular-nums">{value}</p>
      </Card>
    </Link>
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

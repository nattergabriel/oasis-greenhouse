"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useSimulation } from "@/providers/simulation-provider";
import { mockSensorSnapshot, mockWeather, mockStockpile } from "@/lib/mock-data";
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

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <h1 className="text-xl font-medium tracking-tight">Dashboard</h1>

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

      {/* Row 2: Weather + Stockpile */}
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
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Stockpile</span>
          <p className="mt-2 font-mono text-2xl tabular-nums">{totalCalories.toLocaleString()} kcal</p>
          <p className="text-xs text-muted-foreground">{mockStockpile.length} crop types stored</p>
          <div className="mt-3 space-y-1">
            {mockStockpile.slice(0, 3).map((item) => (
              <div key={item.cropId} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.cropName}</span>
                <span className="font-mono tabular-nums">{item.quantityKg} kg</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ label, value, status }: { label: string; value: string; status: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor(status) }} />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1.5 font-mono text-lg tabular-nums">{value}</p>
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

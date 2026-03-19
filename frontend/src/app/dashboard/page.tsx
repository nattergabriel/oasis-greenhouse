"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSimulation } from "@/providers/simulation-provider";
import { mockSensorSnapshot, mockWeather, mockStockpile, mockMissionTimeline } from "@/lib/mock-data";

function statusColor(status: string) {
  if (status === "healthy" || status === "HEALTHY" || status === "NORMAL") return "var(--color-status-healthy)";
  if (status === "warning" || status === "NEEDS_ATTENTION" || status === "WARNING") return "var(--color-status-warning)";
  return "var(--color-status-critical)";
}

export default function DashboardPage() {
  const { state } = useSimulation();
  const { greenhouses, resources, alerts, agentLog, recommendations } = state;
  const openAlerts = alerts.filter((a) => a.status === "OPEN").length;
  const pendingRecs = recommendations.filter((r) => r.status === "PENDING").length;
  const sensor = mockSensorSnapshot;
  const weather = mockWeather;
  const totalCalories = mockStockpile.reduce((s, i) => s + i.estimatedCalories, 0);
  const timeline = mockMissionTimeline;
  const nextMilestone = timeline.milestones.find((m) => m.missionDay > state.currentMissionDay);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-medium tracking-tight">Dashboard</h1>
        <Badge variant="outline" className="font-mono text-xs tabular-nums">
          SOL {state.currentMissionDay} / {state.totalMissionDays}
        </Badge>
      </div>

      {/* Row 1: Key metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          label="Greenhouses"
          value={`${greenhouses.length} active`}
          status={greenhouses.some((g) => g.overallStatus === "CRITICAL") ? "critical" : greenhouses.some((g) => g.overallStatus === "NEEDS_ATTENTION") ? "warning" : "healthy"}
        />
        <MetricCard label="Water" value={`${Math.round(resources.waterReservePercent)}%`} status={resources.waterReservePercent > 50 ? "healthy" : resources.waterReservePercent > 25 ? "warning" : "critical"} />
        <MetricCard label="Nutrients" value={`${Math.round(resources.nutrientReservePercent)}%`} status={resources.nutrientReservePercent > 50 ? "healthy" : resources.nutrientReservePercent > 25 ? "warning" : "critical"} />
        <MetricCard label="Energy" value={`${Math.round(resources.energyReservePercent)}%`} status={resources.energyReservePercent > 50 ? "healthy" : resources.energyReservePercent > 25 ? "warning" : "critical"} />
        <MetricCard label="Alerts" value={`${openAlerts} open`} status={openAlerts > 2 ? "critical" : openAlerts > 0 ? "warning" : "healthy"} />
        <MetricCard label="Agent" value={`${agentLog.length} actions`} status="healthy" />
      </div>

      {/* Row 2: Sensors + Weather */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card className="p-4">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Sensor Snapshot</span>
          <div className="mt-3 space-y-2">
            <SensorRow label="Temperature" value={`${sensor.temperature.value}°C`} status={sensor.temperature.status} />
            <SensorRow label="Humidity" value={`${sensor.humidity.value}% RH`} status={sensor.humidity.status} />
            <SensorRow label="CO2" value={`${sensor.co2.value.toLocaleString()} ppm`} status={sensor.co2.status} />
            <SensorRow label="PAR" value={`${sensor.par.value} µmol/m²/s`} status={sensor.par.status} />
            <SensorRow label="pH" value={`${sensor.nutrientSolution.ph.value}`} status={sensor.nutrientSolution.ph.status} />
            <SensorRow label="EC" value={`${sensor.nutrientSolution.ec.value} mS/cm`} status={sensor.nutrientSolution.ec.status} />
          </div>
        </Card>

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
      </div>

      {/* Row 3: Agent + Recommendations + Stockpile */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="p-4">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Agent Activity</span>
          <div className="mt-3 space-y-2">
            {agentLog.slice(0, 3).map((entry) => (
              <div key={entry.id} className="text-sm">
                <p className="text-foreground line-clamp-1">{entry.description}</p>
                <p className="text-xs text-muted-foreground">{entry.actionType}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Pending Actions</span>
            {pendingRecs > 0 && (
              <Badge variant="destructive" className="text-xs">{pendingRecs}</Badge>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {recommendations.filter((r) => r.status === "PENDING").slice(0, 2).map((rec) => (
              <div key={rec.id} className="text-sm">
                <p className="text-foreground line-clamp-1">{rec.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">Confidence: {Math.round(rec.confidence * 100)}%</span>
                  <Badge variant="outline" className="text-[10px]">{rec.urgency}</Badge>
                </div>
              </div>
            ))}
          </div>
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

      {/* Row 4: Timeline */}
      {nextMilestone && (
        <Card className="p-4">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Next Milestone</span>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs tabular-nums">
              SOL {nextMilestone.missionDay}
            </Badge>
            <span className="text-sm">{nextMilestone.label}</span>
          </div>
        </Card>
      )}
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

"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { mockResourceForecast, mockMissionTimeline, mockWeather } from "@/lib/mock-data";
import type { MilestoneType, RiskLevel } from "@/lib/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sun,
  AlertTriangle,
} from "lucide-react";

// === Helpers ===

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const isProjOnly = data.missionDay > mockMissionTimeline.currentMissionDay;

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">SOL {data.missionDay}</span>
        {isProjOnly && <span className="text-[10px] text-primary">projected</span>}
      </div>
      <div className="space-y-1">
        <TooltipRow color="#4a7c9e" label="Water" value={data.waterReservePercent} />
        <TooltipRow color="#5a9a6b" label="Nutrient" value={data.nutrientReservePercent} />
        <TooltipRow color="#d4924a" label="Energy" value={data.energyReservePercent} />
      </div>
    </div>
  );
}

function TooltipRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-mono tabular-nums">{value.toFixed(1)}%</span>
    </div>
  );
}

function getTrend(current: number, future: number): "up" | "down" | "stable" {
  const diff = future - current;
  if (Math.abs(diff) < 2) return "stable";
  return diff > 0 ? "up" : "down";
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5" style={{ color: "var(--color-status-healthy)" }} />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5" style={{ color: "var(--color-status-critical)" }} />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function riskColor(risk: RiskLevel): string {
  if (risk === "LOW") return "var(--color-status-healthy)";
  if (risk === "MODERATE") return "var(--color-status-warning)";
  return "var(--color-status-critical)";
}

function milestoneColor(type: MilestoneType): string {
  if (type === "HARVEST_WINDOW") return "var(--color-status-healthy)";
  if (type === "PLANTING_DEADLINE") return "var(--color-mars-amber)";
  if (type === "RESOURCE_CRITICAL") return "var(--color-status-critical)";
  if (type === "TRIP_END") return "var(--color-mars-blue)";
  return "var(--color-muted-foreground)";
}

function simplifyLabel(label: string): string {
  return label.replace(/\s*[\(\[][^\)\]]*[\)\]]/g, "").replace(/\s*—\s*/, " – ").trim();
}

type WeatherMetric = "solar" | "dust";
type TimeWindow = 7 | 14 | 30;

// Generate some synthetic "past" data before the forecast starts
function generatePastData(forecastStart: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const day = forecastStart - count + i;
    return {
      missionDay: day,
      waterReservePercent: 73 + (count - i) * 0.3 + Math.sin(i * 0.5) * 2,
      nutrientReservePercent: 58 + (count - i) * 0.2 + Math.cos(i * 0.7) * 1.5,
      energyReservePercent: 84 + (count - i) * 0.15 + Math.sin(i * 0.3) * 2,
    };
  });
}

export default function ForecastingPage() {
  const [weatherMetric, setWeatherMetric] = useState<WeatherMetric>("solar");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(30);
  const forecast = mockResourceForecast;
  const timeline = mockMissionTimeline;
  const weather = mockWeather;
  const todayDay = timeline.currentMissionDay;

  // Build chart data: past (actual) + today + future (projected)
  const chartData = useMemo(() => {
    const halfWindow = Math.floor(timeWindow / 2);
    const pastData = generatePastData(forecast[0].missionDay, halfWindow);
    const futureData = forecast.slice(0, halfWindow);

    // Combine and tag
    const combined = [
      ...pastData.map((d) => ({
        ...d,
        waterActual: d.waterReservePercent,
        nutrientActual: d.nutrientReservePercent,
        energyActual: d.energyReservePercent,
        waterProjected: undefined as number | undefined,
        nutrientProjected: undefined as number | undefined,
        energyProjected: undefined as number | undefined,
      })),
      // Bridge point at today (appears in both actual and projected)
      {
        missionDay: forecast[0].missionDay,
        waterReservePercent: forecast[0].waterReservePercent,
        nutrientReservePercent: forecast[0].nutrientReservePercent,
        energyReservePercent: forecast[0].energyReservePercent,
        waterActual: forecast[0].waterReservePercent,
        nutrientActual: forecast[0].nutrientReservePercent,
        energyActual: forecast[0].energyReservePercent,
        waterProjected: forecast[0].waterReservePercent,
        nutrientProjected: forecast[0].nutrientReservePercent,
        energyProjected: forecast[0].energyReservePercent,
      },
      ...futureData.slice(1).map((d) => ({
        ...d,
        waterActual: undefined as number | undefined,
        nutrientActual: undefined as number | undefined,
        energyActual: undefined as number | undefined,
        waterProjected: d.waterReservePercent,
        nutrientProjected: d.nutrientReservePercent,
        energyProjected: d.energyReservePercent,
      })),
    ];
    return combined;
  }, [forecast, timeWindow]);

  // End-of-window values for stat cards
  const endData = useMemo(() => {
    const idx = Math.min(timeWindow - 1, forecast.length - 1);
    return forecast[Math.floor(idx / 2)]; // half window into future
  }, [forecast, timeWindow]);

  const current = forecast[0];
  const waterTrend = getTrend(current.waterReservePercent, endData.waterReservePercent);
  const nutrientTrend = getTrend(current.nutrientReservePercent, endData.nutrientReservePercent);
  const energyTrend = getTrend(current.energyReservePercent, endData.energyReservePercent);

  const progressPercent = (timeline.currentMissionDay / timeline.totalMissionDays) * 100;
  const upcomingMilestones = timeline.milestones.filter((m) => m.missionDay >= timeline.currentMissionDay);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Resource Projections */}
      <Card className="p-6">
        {/* Header row with title + time window toggles */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Resource Forecast
          </span>
          <div className="flex gap-1">
            {([7, 14, 30] as TimeWindow[]).map((w) => (
              <button
                key={w}
                onClick={() => setTimeWindow(w)}
                className={`rounded border px-2.5 py-0.5 text-xs transition-colors ${
                  timeWindow === w
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-accent"
                }`}
              >
                {w}d
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fc-water" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4a7c9e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4a7c9e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fc-nutrient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5a9a6b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#5a9a6b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fc-energy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4924a" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#d4924a" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#2e2b27" />

              <XAxis
                dataKey="missionDay"
                tick={{ fill: "#e8e2d9", fontSize: 11 }}
                tickLine={{ stroke: "#9c9488" }}
                axisLine={{ stroke: "#9c9488" }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#e8e2d9", fontSize: 11 }}
                tickLine={{ stroke: "#9c9488" }}
                axisLine={{ stroke: "#9c9488" }}
                label={{
                  value: "%",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "#9c9488", fontSize: 11 },
                }}
              />

              <ReferenceLine
                x={todayDay}
                stroke="#e8e2d9"
                strokeWidth={1}
                strokeDasharray="4 3"
                label={{ value: "Today", fill: "#e8e2d9", fontSize: 10, position: "insideTopRight" }}
              />

              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" iconSize={8} />

              {/* Actual (solid + fill) */}
              <Area type="monotone" dataKey="waterActual" name="Water" stroke="#4a7c9e" strokeWidth={2} fill="url(#fc-water)" connectNulls={false} dot={false} />
              <Area type="monotone" dataKey="nutrientActual" name="Nutrient" stroke="#5a9a6b" strokeWidth={2} fill="url(#fc-nutrient)" connectNulls={false} dot={false} />
              <Area type="monotone" dataKey="energyActual" name="Energy" stroke="#d4924a" strokeWidth={2} fill="url(#fc-energy)" connectNulls={false} dot={false} />

              {/* Projected (dashed, no fill) */}
              <Area type="monotone" dataKey="waterProjected" stroke="#4a7c9e" strokeWidth={1.5} strokeDasharray="6 3" fill="none" connectNulls={false} dot={false} legendType="none" />
              <Area type="monotone" dataKey="nutrientProjected" stroke="#5a9a6b" strokeWidth={1.5} strokeDasharray="6 3" fill="none" connectNulls={false} dot={false} legendType="none" />
              <Area type="monotone" dataKey="energyProjected" stroke="#d4924a" strokeWidth={1.5} strokeDasharray="6 3" fill="none" connectNulls={false} dot={false} legendType="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stat cards — redesigned layout */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatCard label="Water" value={current.waterReservePercent} endValue={endData.waterReservePercent} trend={waterTrend} color="#4a7c9e" />
          <StatCard label="Nutrient" value={current.nutrientReservePercent} endValue={endData.nutrientReservePercent} trend={nutrientTrend} color="#5a9a6b" />
          <StatCard label="Energy" value={current.energyReservePercent} endValue={endData.energyReservePercent} trend={energyTrend} color="#d4924a" />
        </div>
      </Card>

      {/* Weather + Mission Timeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Weather */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Mars Weather
            </span>
            <div className="flex gap-1">
              {(["solar", "dust"] as WeatherMetric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setWeatherMetric(m)}
                  className={`rounded border px-2.5 py-0.5 text-xs transition-colors ${
                    weatherMetric === m
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {m === "solar" ? "Solar" : "Dust Risk"}
                </button>
              ))}
            </div>
          </div>

          {/* Current conditions */}
          <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Sun className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Solar</span>
              <span className="ml-auto font-mono tabular-nums">{weather.solarIrradiance} W/m²</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Dust</span>
              <span className="ml-auto font-mono tabular-nums">{weather.dustStormIndex.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Ext. Temp</span>
              <span className="ml-auto font-mono tabular-nums">{weather.externalTemperature}°C</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Pressure</span>
              <span className="ml-auto font-mono tabular-nums">{weather.atmosphericPressure} Pa</span>
            </div>
          </div>

          {/* 7-day forecast rows */}
          <div className="space-y-1.5">
            {weather.forecast.map((day) => (
              <div key={day.missionDay} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="font-mono text-xs tabular-nums text-muted-foreground w-16">SOL {day.missionDay}</span>
                {weatherMetric === "solar" ? (
                  <div className="flex items-center gap-2">
                    <Sun className="h-3 w-3 text-primary" />
                    <span className="font-mono text-sm tabular-nums">{day.solarIrradiance} W/m²</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: riskColor(day.dustStormRisk) }} />
                    <span className="text-sm">{day.dustStormRisk}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Mission Timeline */}
        <Card className="p-6">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Mission Timeline
          </span>

          <div className="mt-4 mb-6">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Mission Progress</span>
              <span className="font-mono tabular-nums">{progressPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted border border-border">
              <div className="h-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>SOL {timeline.currentMissionDay}</span>
              <span>SOL {timeline.totalMissionDays}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            {upcomingMilestones.slice(0, 8).map((m) => (
              <div key={m.missionDay} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: milestoneColor(m.type) }} />
                <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0 w-14">SOL {m.missionDay}</span>
                <span className="text-sm truncate">{simplifyLabel(m.label)}</span>
                {m.missionDay === timeline.currentMissionDay && (
                  <span className="ml-auto text-[10px] text-primary shrink-0">TODAY</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label, value, endValue, trend, color,
}: {
  label: string; value: number; endValue: number; trend: "up" | "down" | "stable"; color: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        </div>
        <TrendIcon trend={trend} />
      </div>
      <div className="mt-2 flex items-baseline justify-end">
        <span className="font-mono text-2xl tabular-nums">{value.toFixed(1)}</span>
        <span className="ml-1 text-sm text-muted-foreground">%</span>
      </div>
    </div>
  );
}

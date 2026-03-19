"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockResourceForecast, mockMissionTimeline, mockWeather } from "@/lib/mock-data";
import type { ResourceProjection, MilestoneType, RiskLevel } from "@/lib/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Droplets,
  Zap,
  Leaf,
  Calendar,
  Sun,
  Wind,
  AlertTriangle,
  Flag,
} from "lucide-react";

// Helper: get color for dust storm risk
function riskColor(risk: RiskLevel): string {
  switch (risk) {
    case "LOW":
      return "var(--color-status-healthy)";
    case "MODERATE":
      return "var(--color-status-warning)";
    case "HIGH":
    case "CRITICAL":
      return "var(--color-status-critical)";
    default:
      return "var(--color-muted)";
  }
}

// Helper: get badge variant for risk
function riskBadgeVariant(risk: RiskLevel): "default" | "secondary" | "destructive" | "outline" {
  switch (risk) {
    case "LOW":
      return "secondary";
    case "MODERATE":
      return "outline";
    case "HIGH":
    case "CRITICAL":
      return "destructive";
    default:
      return "default";
  }
}

// Helper: get icon for milestone type
function MilestoneIcon({ type }: { type: MilestoneType }) {
  switch (type) {
    case "HARVEST_WINDOW":
      return <Leaf className="h-4 w-4 text-green-500" />;
    case "PLANTING_DEADLINE":
      return <Calendar className="h-4 w-4 text-amber-500" />;
    case "RESOURCE_CRITICAL":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "TRIP_END":
      return <Flag className="h-4 w-4 text-blue-500" />;
    default:
      return null;
  }
}

// Custom tooltip for charts
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur-sm">
      <p className="mb-2 font-mono text-xs text-muted-foreground">SOL {data.missionDay}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#4a7c9e" }} />
          <span className="text-muted-foreground">Water:</span>
          <span className="font-mono tabular-nums">{data.waterReservePercent.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#5a9a6b" }} />
          <span className="text-muted-foreground">Nutrient:</span>
          <span className="font-mono tabular-nums">{data.nutrientReservePercent.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#d4924a" }} />
          <span className="text-muted-foreground">Energy:</span>
          <span className="font-mono tabular-nums">{data.energyReservePercent.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

// Helper: calculate trend
function getTrend(current: number, future: number): "up" | "down" | "stable" {
  const diff = future - current;
  if (Math.abs(diff) < 2) return "stable";
  return diff > 0 ? "up" : "down";
}

// Helper: get trend icon
function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-green-500" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-red-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

export default function ForecastingPage() {
  const forecast = mockResourceForecast;
  const timeline = mockMissionTimeline;
  const weather = mockWeather;

  // Current values (first forecast point)
  const current = forecast[0];
  const day30 = forecast[forecast.length - 1];

  // Trends
  const waterTrend = getTrend(current.waterReservePercent, day30.waterReservePercent);
  const nutrientTrend = getTrend(current.nutrientReservePercent, day30.nutrientReservePercent);
  const energyTrend = getTrend(current.energyReservePercent, day30.energyReservePercent);

  // Mission progress
  const progressPercent = (timeline.currentMissionDay / timeline.totalMissionDays) * 100;

  // Upcoming milestones
  const upcomingMilestones = timeline.milestones.filter(
    (m) => m.missionDay >= timeline.currentMissionDay
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-medium tracking-tight">Resource Forecasting</h1>
        <Badge variant="outline" className="font-mono text-xs tabular-nums">
          SOL {timeline.currentMissionDay} / {timeline.totalMissionDays}
        </Badge>
      </div>

      {/* Section 1: Resource Projections */}
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Resource Forecast — Next 30 Days
        </h2>

        {/* Chart */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4a7c9e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4a7c9e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="nutrientGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5a9a6b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#5a9a6b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4924a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d4924a" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#2e2b27" />

              <XAxis
                dataKey="missionDay"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={{ stroke: "#2e2b27" }}
                axisLine={{ stroke: "#2e2b27" }}
              />

              <YAxis
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={{ stroke: "#2e2b27" }}
                axisLine={{ stroke: "#2e2b27" }}
                label={{
                  value: "Reserve %",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
                }}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                wrapperStyle={{ fontSize: "11px" }}
                iconType="circle"
                iconSize={8}
              />

              <Area
                type="monotone"
                dataKey="waterReservePercent"
                name="Water"
                stroke="#4a7c9e"
                strokeWidth={2}
                fill="url(#waterGradient)"
              />

              <Area
                type="monotone"
                dataKey="nutrientReservePercent"
                name="Nutrient"
                stroke="#5a9a6b"
                strokeWidth={2}
                fill="url(#nutrientGradient)"
              />

              <Area
                type="monotone"
                dataKey="energyReservePercent"
                name="Energy"
                stroke="#d4924a"
                strokeWidth={2}
                fill="url(#energyGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stat cards below chart */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Water */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Droplets className="h-4 w-4" />
              <span>Water Reserve</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-2xl tabular-nums">
                {current.waterReservePercent.toFixed(1)}%
              </span>
              <TrendIcon trend={waterTrend} />
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Day 30 projection:</span>
              <span className="font-mono tabular-nums">{day30.waterReservePercent.toFixed(1)}%</span>
            </div>
          </div>

          {/* Nutrient */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Leaf className="h-4 w-4" />
              <span>Nutrient Reserve</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-2xl tabular-nums">
                {current.nutrientReservePercent.toFixed(1)}%
              </span>
              <TrendIcon trend={nutrientTrend} />
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Day 30 projection:</span>
              <span className="font-mono tabular-nums">{day30.nutrientReservePercent.toFixed(1)}%</span>
            </div>
          </div>

          {/* Energy */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span>Energy Reserve</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-2xl tabular-nums">
                {current.energyReservePercent.toFixed(1)}%
              </span>
              <TrendIcon trend={energyTrend} />
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Day 30 projection:</span>
              <span className="font-mono tabular-nums">{day30.energyReservePercent.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 2 & 3: Weather Outlook + Mission Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weather Outlook */}
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Mars Weather Forecast
          </h2>

          {/* Current conditions */}
          <div className="mb-4 space-y-2 rounded-lg border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Current Conditions
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Sun className="h-4 w-4 text-amber-400" />
                <span className="text-muted-foreground">Solar:</span>
                <span className="font-mono tabular-nums">{weather.solarIrradiance} W/m²</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Wind className="h-4 w-4 text-blue-400" />
                <span className="text-muted-foreground">Temp:</span>
                <span className="font-mono tabular-nums">{weather.externalTemperature}°C</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <span className="text-muted-foreground">Dust Index:</span>
                <span className="font-mono tabular-nums">{weather.dustStormIndex.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Pressure:</span>
                <span className="font-mono tabular-nums">{weather.atmosphericPressure} Pa</span>
              </div>
            </div>
          </div>

          {/* 7-day forecast */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              7-Day Forecast
            </p>
            <div className="space-y-2">
              {weather.forecast.map((day) => (
                <div
                  key={day.missionDay}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-xs tabular-nums">
                      SOL {day.missionDay}
                    </Badge>
                    <Badge variant={riskBadgeVariant(day.dustStormRisk)} className="text-xs">
                      {day.dustStormRisk}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Sun className="h-3 w-3 text-amber-400" />
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {day.solarIrradiance} W/m²
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Mission Timeline */}
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Mission Timeline
          </h2>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Mission Progress</span>
              <span className="font-mono tabular-nums">{progressPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>SOL {timeline.currentMissionDay}</span>
              <span>SOL {timeline.totalMissionDays}</span>
            </div>
          </div>

          {/* Milestones */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Upcoming Milestones
            </p>
            <div className="space-y-2">
              {upcomingMilestones.slice(0, 6).map((milestone) => (
                <div
                  key={milestone.missionDay}
                  className="flex items-start gap-3 rounded-lg border bg-card p-3"
                >
                  <div className="mt-0.5">
                    <MilestoneIcon type={milestone.type} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs tabular-nums">
                        SOL {milestone.missionDay}
                      </Badge>
                      {milestone.missionDay === timeline.currentMissionDay && (
                        <Badge variant="default" className="text-[10px]">
                          TODAY
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-foreground">{milestone.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

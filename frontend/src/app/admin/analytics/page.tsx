"use client"

import { mockAgentPerformance } from "@/lib/mock-data"
import { api, useApi } from "@/lib/api"
import { Card } from "@/components/ui/card"

function scoreStatus(score: number, good = 80, ok = 60) {
  if (score >= good) return { color: "var(--color-status-healthy)", label: "Good" }
  if (score >= ok) return { color: "var(--color-status-warning)", label: "Fair" }
  return { color: "var(--color-status-critical)", label: "Critical" }
}

export default function AgentAnalyticsPage() {
  const perf = useApi(() => api.analytics.agentPerformance(), mockAgentPerformance)

  const totalDecisions = perf.autonomousActionsCount + perf.humanOverridesCount
  const autoPercent = Math.round((perf.autonomousActionsCount / totalDecisions) * 100)
  const accuracyStatus = scoreStatus(perf.decisionAccuracyPercent)

  const metrics = [
    { label: "Avg Response", value: perf.avgResponseTimeMs >= 1000 ? `${(perf.avgResponseTimeMs / 1000).toFixed(1)}s` : `${perf.avgResponseTimeMs}ms`, score: Math.max(0, 100 - perf.avgResponseTimeMs / 50), color: "var(--color-mars-blue)" },
    { label: "Resource Efficiency", value: `${perf.resourceEfficiencyScore}`, score: perf.resourceEfficiencyScore, color: "var(--color-mars-green)" },
    { label: "Nutrition Hit Rate", value: `${Math.round(perf.nutritionalTargetHitRate * 100)}%`, score: perf.nutritionalTargetHitRate * 100, color: "var(--color-mars-yellow)" },
    { label: "Crop Diversity", value: `${perf.diversityScore}`, score: perf.diversityScore, color: "var(--color-mars-purple)" },
    { label: "Crisis Response", value: `${perf.crisisResponseScore}`, score: perf.crisisResponseScore, color: "var(--color-mars-amber)" },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Agent Analytics</h1>

      {/* Hero: Decision Accuracy */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Decision Accuracy</span>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-mono text-5xl tabular-nums font-bold" style={{ color: accuracyStatus.color }}>
                {perf.decisionAccuracyPercent}%
              </span>
              <span className="text-sm font-medium" style={{ color: accuracyStatus.color }}>{accuracyStatus.label}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {totalDecisions} total decisions · {perf.autonomousActionsCount} autonomous · {perf.humanOverridesCount} overrides
            </p>
          </div>
          <div className="relative w-24 h-24 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={accuracyStatus.color} strokeWidth="8"
                strokeDasharray={`${perf.decisionAccuracyPercent * 2.64} 264`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {metrics.map((m) => (
          <Card key={m.label} className="p-4 border-l-2" style={{ borderLeftColor: m.color }}>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.label}</span>
            <div className="mt-1.5 font-mono text-2xl tabular-nums">{m.value}</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "var(--border)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${m.score}%`, backgroundColor: m.color }} />
            </div>
          </Card>
        ))}
      </div>

      {/* Autonomy Ratio */}
      <Card className="p-6">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Autonomy Ratio</span>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full flex border border-border">
          <div className="h-full bg-primary" style={{ width: `${autoPercent}%` }} />
          <div className="h-full bg-destructive/20" style={{ width: `${100 - autoPercent}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">Autonomous</span>
            <span className="font-mono tabular-nums font-medium">{perf.autonomousActionsCount}</span>
            <span className="text-muted-foreground">({autoPercent}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive/30" />
            <span className="text-muted-foreground">Override</span>
            <span className="font-mono tabular-nums font-medium">{perf.humanOverridesCount}</span>
            <span className="text-muted-foreground">({100 - autoPercent}%)</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

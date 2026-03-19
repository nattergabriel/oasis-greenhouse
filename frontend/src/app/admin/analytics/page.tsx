"use client"

import { mockAgentPerformance } from "@/lib/mock-data"
import { Card } from "@/components/ui/card"

export default function AgentAnalyticsPage() {
  const perf = mockAgentPerformance

  const formatResponseTime = (ms: number) => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(1)}s`
    }
    return `${ms}ms`
  }

  const autoRatio = perf.autonomousActionsCount / (perf.autonomousActionsCount + perf.humanOverridesCount)
  const humanRatio = 1 - autoRatio

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Agent Analytics</h1>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Decision Accuracy" value={`${perf.decisionAccuracyPercent}%`} percent={perf.decisionAccuracyPercent} />
        <StatCard label="Avg Response Time" value={formatResponseTime(perf.avgResponseTimeMs)} />
        <StatCard label="Resource Efficiency" value={`${perf.resourceEfficiencyScore}/100`} percent={perf.resourceEfficiencyScore} />
        <StatCard label="Nutritional Hit Rate" value={`${Math.round(perf.nutritionalTargetHitRate * 100)}%`} percent={perf.nutritionalTargetHitRate * 100} />
        <StatCard label="Diversity Score" value={`${perf.diversityScore}/100`} percent={perf.diversityScore} />
        <StatCard label="Crisis Response" value={`${perf.crisisResponseScore}/100`} percent={perf.crisisResponseScore} />
      </div>

      {/* Autonomy Ratio */}
      <Card className="p-6">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Autonomy vs Human Override
        </span>
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              Autonomous Actions
            </div>
            <div className="text-3xl font-mono tabular-nums">{perf.autonomousActionsCount}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              Human Overrides
            </div>
            <div className="text-3xl font-mono tabular-nums">{perf.humanOverridesCount}</div>
          </div>
        </div>

        <div className="mt-4 w-full bg-muted rounded-full h-6 overflow-hidden flex border border-border">
          <div
            className="h-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground"
            style={{ width: `${autoRatio * 100}%` }}
          >
            {Math.round(autoRatio * 100)}%
          </div>
          <div
            className="h-full bg-destructive/20 flex items-center justify-center text-xs font-medium text-destructive"
            style={{ width: `${humanRatio * 100}%` }}
          >
            {Math.round(humanRatio * 100)}%
          </div>
        </div>

        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Autonomous</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive/30" />
            <span>Human Override</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

function StatCard({ label, value, percent }: { label: string; value: string; percent?: number }) {
  return (
    <Card className="p-4">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-2 text-2xl font-mono tabular-nums">{value}</div>
      {percent !== undefined && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted border border-border">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </Card>
  )
}

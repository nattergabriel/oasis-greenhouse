"use client"

import { mockAgentPerformance } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AgentAnalyticsPage() {
  const perf = mockAgentPerformance

  const formatResponseTime = (ms: number) => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(1)}s`
    }
    return `${ms}ms`
  }

  return (
    <div className="p-6 space-y-6 bg-card text-foreground min-h-screen">
      <h1 className="text-2xl font-bold">Agent Analytics</h1>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Decision Accuracy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Decision Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-mono tabular-nums">{perf.decisionAccuracyPercent}%</div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${perf.decisionAccuracyPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Avg Response Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono tabular-nums">
              {formatResponseTime(perf.avgResponseTimeMs)}
            </div>
          </CardContent>
        </Card>

        {/* Resource Efficiency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Resource Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-mono tabular-nums">
              {perf.resourceEfficiencyScore}/100
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${perf.resourceEfficiencyScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Nutritional Hit Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Nutritional Hit Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-mono tabular-nums">
              {Math.round(perf.nutritionalTargetHitRate * 100)}%
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${perf.nutritionalTargetHitRate * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Diversity Score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Diversity Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-mono tabular-nums">{perf.diversityScore}/100</div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${perf.diversityScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Crisis Response */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Crisis Response
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-mono tabular-nums">{perf.crisisResponseScore}/100</div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${perf.crisisResponseScore}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Autonomy Ratio */}
      <Card>
        <CardHeader>
          <CardTitle>Autonomy vs Human Override</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
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

          <div className="w-full bg-muted rounded-full h-6 overflow-hidden flex">
            <div
              className="h-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground"
              style={{
                width: `${(perf.autonomousActionsCount / (perf.autonomousActionsCount + perf.humanOverridesCount)) * 100}%`,
              }}
            >
              {Math.round(
                (perf.autonomousActionsCount / (perf.autonomousActionsCount + perf.humanOverridesCount)) * 100
              )}%
            </div>
            <div
              className="h-full bg-destructive/20 flex items-center justify-center text-xs font-medium text-destructive"
              style={{
                width: `${(perf.humanOverridesCount / (perf.autonomousActionsCount + perf.humanOverridesCount)) * 100}%`,
              }}
            >
              {Math.round(
                (perf.humanOverridesCount / (perf.autonomousActionsCount + perf.humanOverridesCount)) * 100
              )}%
            </div>
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Autonomous</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/20" />
              <span>Human Override</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

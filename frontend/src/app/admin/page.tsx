"use client"

import { useState } from "react"
import { mockAgentConfig, mockAgentPerformance } from "@/lib/mock-data"
import { api, useApi } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import type { AutonomyLevel, RiskTolerance } from "@/lib/types"

type TabValue = "agent-config" | "analytics"

const TABS: { value: TabValue; label: string }[] = [
  { value: "agent-config", label: "Agent Config" },
  { value: "analytics", label: "Analytics" },
]

// === Agent Config ===

function AgentConfigSection() {
  const initialConfig = useApi(() => api.agent.config(), mockAgentConfig)
  const [config, setConfig] = useState(initialConfig)

  const handleSave = () => {
    console.log("Saving agent config:", config)
  }

  const weightSum = config.priorityWeights.yield + config.priorityWeights.diversity + config.priorityWeights.resourceConservation
  const weightWarning = Math.abs(weightSum - 1.0) > 0.01

  return (
    <Card className="p-6 space-y-8">
      {/* Autonomy Level */}
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Autonomy Level
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {([
            { value: "FULLY_AUTONOMOUS" as AutonomyLevel, label: "Fully Autonomous", description: "Agent acts independently without approval" },
            { value: "HYBRID" as AutonomyLevel, label: "Hybrid", description: "Agent acts on high-confidence decisions, suggests otherwise" },
            { value: "SUGGEST_ONLY" as AutonomyLevel, label: "Suggest Only", description: "Agent only makes recommendations" },
          ]).map((option) => (
            <button
              key={option.value}
              onClick={() => setConfig({ ...config, autonomyLevel: option.value })}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                config.autonomyLevel === option.value
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <div className="font-medium mb-1">{option.label}</div>
              <div className="text-xs text-muted-foreground">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Certainty Threshold */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Certainty Threshold</Label>
          <span className="text-sm font-mono tabular-nums font-medium">{Math.round(config.certaintyThreshold * 100)}%</span>
        </div>
        <Slider
          min={0} max={100} step={1}
          value={config.certaintyThreshold * 100}
          onChange={(val) => setConfig({ ...config, certaintyThreshold: val / 100 })}
        />
        <p className="text-xs text-muted-foreground">Minimum confidence required for autonomous actions (hybrid mode)</p>
      </div>

      {/* Risk Tolerance */}
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Risk Tolerance</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {([
            { value: "CONSERVATIVE" as RiskTolerance, label: "Conservative", description: "Prioritize safety and resource preservation" },
            { value: "MODERATE" as RiskTolerance, label: "Moderate", description: "Balance between safety and efficiency" },
            { value: "AGGRESSIVE" as RiskTolerance, label: "Aggressive", description: "Maximize yield, accept higher risk" },
          ]).map((option) => (
            <button
              key={option.value}
              onClick={() => setConfig({ ...config, riskTolerance: option.value })}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                config.riskTolerance === option.value
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <div className="font-medium mb-1">{option.label}</div>
              <div className="text-xs text-muted-foreground">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Priority Weights */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Priority Weights</Label>
          <div className="text-sm">
            <span className="text-muted-foreground">Sum:</span>{" "}
            <span className={`font-mono tabular-nums font-medium ${weightWarning ? "text-destructive" : ""}`}>
              {weightSum.toFixed(2)}
            </span>
          </div>
        </div>
        {weightWarning && (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2">
            Warning: Weights should sum to 1.0
          </div>
        )}
        <div className="space-y-4">
          {([
            { key: "yield" as const, label: "Yield" },
            { key: "diversity" as const, label: "Diversity" },
            { key: "resourceConservation" as const, label: "Resource Conservation" },
          ]).map((w) => (
            <div key={w.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{w.label}</Label>
                <span className="text-sm font-mono tabular-nums">{config.priorityWeights[w.key].toFixed(2)}</span>
              </div>
              <Slider
                min={0} max={100} step={1}
                value={config.priorityWeights[w.key] * 100}
                onChange={(val) => setConfig({ ...config, priorityWeights: { ...config.priorityWeights, [w.key]: val / 100 } })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} size="lg">Save Configuration</Button>
      </div>
    </Card>
  )
}

// === Analytics ===

function scoreStatus(score: number, good = 80, ok = 60) {
  if (score >= good) return { color: "var(--color-status-healthy)", label: "Good" }
  if (score >= ok) return { color: "var(--color-status-warning)", label: "Fair" }
  return { color: "var(--color-status-critical)", label: "Critical" }
}

function AnalyticsSection() {
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
    <div className="space-y-4">
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

// === Main Page ===

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("agent-config")

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>

      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-lg border px-4 py-1.5 text-sm transition-all duration-150 ${
              activeTab === tab.value
                ? "border-primary bg-primary/20 text-primary font-medium"
                : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "agent-config" && <AgentConfigSection />}
      {activeTab === "analytics" && <AnalyticsSection />}
    </div>
  )
}

"use client"

import { useState } from "react"
import { mockSimulations, mockSimulationDetail, mockScenarios } from "@/lib/mock-data"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SimControls } from "@/components/layout/sim-controls"

type TabValue = "current" | "scenarios" | "history"

const TABS: { value: TabValue; label: string }[] = [
  { value: "current", label: "Current Run" },
  { value: "scenarios", label: "Scenarios" },
  { value: "history", label: "History" },
]

function statusColor(status: string) {
  switch (status) {
    case "RUNNING":
      return "bg-[var(--color-status-healthy)]/20 text-[#4ead6b] border-[var(--color-status-healthy)]/30"
    case "PAUSED":
      return "bg-[var(--color-status-warning)]/20 text-[#d4aa30] border-[var(--color-status-warning)]/30"
    case "COMPLETED":
      return "bg-muted text-muted-foreground border-border"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

function severityColor(severity: string) {
  switch (severity) {
    case "LOW":
      return "bg-[var(--color-status-healthy)]/20 text-[#4ead6b] border-[var(--color-status-healthy)]/30"
    case "MEDIUM":
      return "bg-[var(--color-status-warning)]/20 text-[#d4aa30] border-[var(--color-status-warning)]/30"
    case "HIGH":
      return "bg-primary/20 text-primary border-primary/30"
    case "CATASTROPHIC":
      return "bg-destructive/20 text-destructive border-destructive/30"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

export default function SimulationPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("current")
  const simulation = mockSimulationDetail

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Simulation</h1>
        <SimControls />
      </div>

      {/* Tabs */}
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

      {/* Current Run */}
      {activeTab === "current" && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">{simulation.name}</span>
            <Badge variant="outline" className={statusColor(simulation.status)}>{simulation.status}</Badge>
          </div>

          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Mission Day", value: simulation.currentMetrics.missionDay },
              { label: "Water Reserve", value: `${simulation.currentMetrics.waterReservePercent}%` },
              { label: "Nutrient Reserve", value: `${simulation.currentMetrics.nutrientReservePercent}%` },
              { label: "Energy Reserve", value: `${simulation.currentMetrics.energyReservePercent}%` },
              { label: "Total Yield", value: `${simulation.currentMetrics.totalYieldKg} kg` },
            ].map((m) => (
              <div key={m.label}>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{m.label}</div>
                <div className="text-2xl font-mono tabular-nums">{m.value}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Learning Goal</div>
            <p className="text-muted-foreground">{simulation.learningGoal}</p>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Configuration</div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Autonomy:</span>{" "}
                <span className="font-medium">{simulation.agentConfig.autonomyLevel}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Risk:</span>{" "}
                <span className="font-medium">{simulation.agentConfig.riskTolerance}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Crew:</span>{" "}
                <span className="font-medium font-mono">{simulation.crewSize}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Yield Target:</span>{" "}
                <span className="font-medium font-mono">{simulation.yieldTarget} kg</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Scenarios */}
      {activeTab === "scenarios" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockScenarios.map((scenario) => (
            <Card key={scenario.id} className="p-4 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold">{scenario.name}</span>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {scenario.type.replace(/_/g, " ")}
                </Badge>
              </div>
              <Badge variant="outline" className={severityColor(scenario.severity)}>
                {scenario.severity}
              </Badge>
              <p className="text-sm text-muted-foreground">{scenario.description}</p>
              <Button className="w-full" variant="outline">
                Inject
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* History */}
      {activeTab === "history" && (
        <Card className="p-6">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Past Simulations</span>
          <table className="w-full text-sm mt-4">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Score</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Autonomy</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Risk</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {mockSimulations.map((sim) => (
                <tr key={sim.id} className="border-b border-border last:border-0">
                  <td className="py-3">{sim.name}</td>
                  <td className="py-3">
                    <Badge variant="outline" className={statusColor(sim.status)}>{sim.status}</Badge>
                  </td>
                  <td className="py-3 font-mono tabular-nums">{sim.outcomeScore ?? "--"}</td>
                  <td className="py-3">{sim.autonomyLevel}</td>
                  <td className="py-3">{sim.riskTolerance}</td>
                  <td className="py-3 text-muted-foreground">
                    {new Date(sim.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

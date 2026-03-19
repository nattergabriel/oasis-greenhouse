"use client"

import { mockSimulations, mockSimulationDetail } from "@/lib/mock-data"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function SimulationManagementPage() {
  const simulation = mockSimulationDetail

  const statusColor = (status: string) => {
    switch (status) {
      case "RUNNING":
        return "bg-[var(--color-status-healthy)]/20 text-[#5a9a6b] border-[var(--color-status-healthy)]/30"
      case "PAUSED":
        return "bg-[var(--color-status-warning)]/20 text-[#c4a344] border-[var(--color-status-warning)]/30"
      case "COMPLETED":
        return "bg-muted text-muted-foreground border-border"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <h1 className="text-xl font-medium tracking-tight">Simulation Management</h1>

      {/* Current Simulation */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">{simulation.name}</span>
          <Badge variant="outline" className={statusColor(simulation.status)}>{simulation.status}</Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-5 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Mission Day</div>
            <div className="text-2xl font-mono tabular-nums">{simulation.currentMetrics.missionDay}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Water Reserve</div>
            <div className="text-2xl font-mono tabular-nums">{simulation.currentMetrics.waterReservePercent}%</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Nutrient Reserve</div>
            <div className="text-2xl font-mono tabular-nums">{simulation.currentMetrics.nutrientReservePercent}%</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Energy Reserve</div>
            <div className="text-2xl font-mono tabular-nums">{simulation.currentMetrics.energyReservePercent}%</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Total Yield</div>
            <div className="text-2xl font-mono tabular-nums">{simulation.currentMetrics.totalYieldKg} kg</div>
          </div>
        </div>

        {/* Learning Goal */}
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Learning Goal</div>
          <p className="text-muted-foreground">{simulation.learningGoal}</p>
        </div>

        {/* Config Summary */}
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Configuration</div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Autonomy Level:</span>{" "}
              <span className="font-medium">{simulation.agentConfig.autonomyLevel}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Risk Tolerance:</span>{" "}
              <span className="font-medium">{simulation.agentConfig.riskTolerance}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Crew Size:</span>{" "}
              <span className="font-medium font-mono">{simulation.crewSize}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Yield Target:</span>{" "}
              <span className="font-medium font-mono">{simulation.yieldTarget} kg</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Past Simulations */}
      <Card className="p-6">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Past Simulations</span>
        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 font-medium text-muted-foreground">Name</th>
              <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
              <th className="text-left py-2 font-medium text-muted-foreground">Score</th>
              <th className="text-left py-2 font-medium text-muted-foreground">Autonomy</th>
              <th className="text-left py-2 font-medium text-muted-foreground">Risk Tolerance</th>
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
                <td className="py-3 font-mono tabular-nums">{sim.outcomeScore ?? "—"}</td>
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
    </div>
  )
}

"use client"

import { emptySimulationDetail } from "@/lib/defaults"
import { api, useApi, useApiState } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SimControls } from "@/components/layout/sim-controls"
import { Skeleton } from "@/components/ui/skeleton"

export default function SimulationManagementPage() {
  const { data: simulations, loading: simulationsLoading } = useApiState(() => api.simulations.list().then(r => r.simulations), [] as import("@/lib/types").SimulationSummary[])
  const simulation = useApi(() => simulations[0] ? api.simulations.get(simulations[0].id) : Promise.reject(), emptySimulationDetail, [simulations])

  const statusColor = (status: string) => {
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

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Simulation Management</h1>
        <SimControls />
      </div>

      {/* Current Simulation — Loading */}
      {simulationsLoading && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-24 rounded-lg" />
          </div>
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-full" />
        </Card>
      )}

      {/* Current Simulation — Empty */}
      {!simulationsLoading && simulations.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No simulations</p>
          <p className="text-xs text-muted-foreground mt-1">No simulation data available. Create a simulation to get started.</p>
        </Card>
      )}

      {/* Current Simulation — Data */}
      {!simulationsLoading && simulations.length > 0 && (
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
      )}

      {/* Past Simulations */}
      <Card className="p-6">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Past Simulations</span>
        {simulationsLoading && (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}
        {!simulationsLoading && simulations.length === 0 && (
          <p className="text-muted-foreground text-sm mt-4">No simulation history available.</p>
        )}
        <table className={`w-full text-sm mt-4 ${simulationsLoading || simulations.length === 0 ? "hidden" : ""}`}>
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
            {simulations.map((sim) => (
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

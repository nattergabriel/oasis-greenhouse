"use client"

import { mockScenarios } from "@/lib/mock-data"
import { api, useApi } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function CrisisScenariosPage() {
  const scenarios = useApi(() => api.scenarios.list().then(r => r.scenarios), mockScenarios)
  const severityColor = (severity: string) => {
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

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "—"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Crisis Scenarios</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((scenario) => (
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

            <div className="text-sm">
              <span className="text-muted-foreground">Default Duration:</span>{" "}
              <span className="font-mono tabular-nums font-medium">
                {formatDuration(scenario.defaultDurationMinutes)}
              </span>
            </div>

            <Button className="w-full" variant="outline">
              Inject
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

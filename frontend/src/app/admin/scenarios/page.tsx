"use client"

import { mockScenarios } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function CrisisScenariosPage() {
  const severityColor = (severity: string) => {
    switch (severity) {
      case "LOW":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "HIGH":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "CATASTROPHIC":
        return "bg-red-500/20 text-red-400 border-red-500/30"
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
    <div className="p-6 space-y-6 bg-card text-foreground min-h-screen">
      <h1 className="text-2xl font-bold">Crisis Scenarios</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockScenarios.map((scenario) => (
          <Card key={scenario.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle>{scenario.name}</CardTitle>
                <Badge variant="outline" className="shrink-0">
                  {scenario.type.replace(/_/g, " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge className={severityColor(scenario.severity)}>
                  {scenario.severity}
                </Badge>
              </div>

              <CardDescription>{scenario.description}</CardDescription>

              <div className="text-sm">
                <span className="text-muted-foreground">Default Duration:</span>{" "}
                <span className="font-mono tabular-nums font-medium">
                  {formatDuration(scenario.defaultDurationMinutes)}
                </span>
              </div>

              <Button className="w-full" variant="outline">
                Inject
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

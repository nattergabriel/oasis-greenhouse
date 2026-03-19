"use client"

import { useState } from "react"
import { mockAgentConfig } from "@/lib/mock-data"
import { api, useApi } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import type { AutonomyLevel, RiskTolerance } from "@/lib/types"

export default function AgentConfigPage() {
  const initialConfig = useApi(() => api.agent.config(), mockAgentConfig)
  const [config, setConfig] = useState(initialConfig)

  const handleSave = () => {
    console.log("Saving agent config:", config)
  }

  const weightSum = config.priorityWeights.yield + config.priorityWeights.diversity + config.priorityWeights.resourceConservation
  const weightWarning = Math.abs(weightSum - 1.0) > 0.01

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Agent Configuration</h1>

      <Card className="p-6 space-y-8">
        {/* Autonomy Level */}
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Autonomy Level
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                value: "FULLY_AUTONOMOUS" as AutonomyLevel,
                label: "Fully Autonomous",
                description: "Agent acts independently without approval",
              },
              {
                value: "HYBRID" as AutonomyLevel,
                label: "Hybrid",
                description: "Agent acts on high-confidence decisions, suggests otherwise",
              },
              {
                value: "SUGGEST_ONLY" as AutonomyLevel,
                label: "Suggest Only",
                description: "Agent only makes recommendations",
              },
            ].map((option) => (
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
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Certainty Threshold
            </Label>
            <span className="text-sm font-mono tabular-nums font-medium">
              {Math.round(config.certaintyThreshold * 100)}%
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={config.certaintyThreshold * 100}
            onChange={(val) => setConfig({ ...config, certaintyThreshold: val / 100 })}
          />
          <p className="text-xs text-muted-foreground">
            Minimum confidence required for autonomous actions (hybrid mode)
          </p>
        </div>

        {/* Risk Tolerance */}
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Risk Tolerance
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                value: "CONSERVATIVE" as RiskTolerance,
                label: "Conservative",
                description: "Prioritize safety and resource preservation",
              },
              {
                value: "MODERATE" as RiskTolerance,
                label: "Moderate",
                description: "Balance between safety and efficiency",
              },
              {
                value: "AGGRESSIVE" as RiskTolerance,
                label: "Aggressive",
                description: "Maximize yield, accept higher risk",
              },
            ].map((option) => (
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
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Priority Weights
            </Label>
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
            {/* Yield Weight */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Yield</Label>
                <span className="text-sm font-mono tabular-nums">
                  {config.priorityWeights.yield.toFixed(2)}
                </span>
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={config.priorityWeights.yield * 100}
                onChange={(val) =>
                  setConfig({
                    ...config,
                    priorityWeights: { ...config.priorityWeights, yield: val / 100 },
                  })
                }
              />
            </div>

            {/* Diversity Weight */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Diversity</Label>
                <span className="text-sm font-mono tabular-nums">
                  {config.priorityWeights.diversity.toFixed(2)}
                </span>
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={config.priorityWeights.diversity * 100}
                onChange={(val) =>
                  setConfig({
                    ...config,
                    priorityWeights: { ...config.priorityWeights, diversity: val / 100 },
                  })
                }
              />
            </div>

            {/* Resource Conservation Weight */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Resource Conservation</Label>
                <span className="text-sm font-mono tabular-nums">
                  {config.priorityWeights.resourceConservation.toFixed(2)}
                </span>
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={config.priorityWeights.resourceConservation * 100}
                onChange={(val) =>
                  setConfig({
                    ...config,
                    priorityWeights: {
                      ...config.priorityWeights,
                      resourceConservation: val / 100,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} size="lg">
            Save Configuration
          </Button>
        </div>
      </Card>
    </div>
  )
}

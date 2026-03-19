"use client"

import { useState } from "react"
import { emptySimulationDetail } from "@/lib/defaults"
import { api, useApi } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Pause, Play, FastForward } from "lucide-react"
import type { Scenario, SimulationSummary } from "@/lib/types"

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

/* ---------- Inline per-simulation controls ---------- */
function InlineSimControls({ simId }: { simId: string }) {
  const [speed, setSpeed] = useState<0 | 1 | 10>(1)
  const isRunning = speed > 0

  // In a real app this would dispatch to the simulation runner keyed by simId.
  // For now we just manage local visual state.
  void simId

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
      <button
        onClick={() => setSpeed(0)}
        className={`p-1.5 rounded-md transition-colors ${
          !isRunning
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Pause simulation"
      >
        <Pause className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setSpeed(1)}
        className={`p-1.5 rounded-md transition-colors ${
          isRunning && speed === 1
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Play at 1x speed"
      >
        <Play className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setSpeed(10)}
        className={`p-1.5 rounded-md transition-colors ${
          isRunning && speed === 10
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Play at 10x speed"
      >
        <FastForward className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function SimulationPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("current")
  const simulations = useApi(() => api.simulations.list().then(r => r.simulations), [] as import("@/lib/types").SimulationSummary[])
  const simulation = useApi(() => simulations[0] ? api.simulations.get(simulations[0].id) : Promise.reject(), emptySimulationDetail, [simulations])
  const scenarios = useApi(() => api.scenarios.list().then(r => r.scenarios), [] as import("@/lib/types").Scenario[])
  const runningSimulations = simulations.filter((s) => s.status === "RUNNING")

  // Scenario detail dialog
  const [scenarioDetailOpen, setScenarioDetailOpen] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)

  // Inject dialog
  const [injectOpen, setInjectOpen] = useState(false)
  const [injectScenario, setInjectScenario] = useState<Scenario | null>(null)
  const [selectedSimId, setSelectedSimId] = useState<string | null>(null)

  // History detail dialog
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedSim, setSelectedSim] = useState<SimulationSummary | null>(null)

  function openScenarioDetail(scenario: Scenario) {
    setSelectedScenario(scenario)
    setScenarioDetailOpen(true)
  }

  function openInjectDialog(scenario: Scenario) {
    setInjectScenario(scenario)
    setSelectedSimId(runningSimulations.length > 0 ? runningSimulations[0].id : null)
    setInjectOpen(true)
  }

  function confirmInject() {
    // In a real app this would call the backend inject endpoint
    setInjectOpen(false)
    setInjectScenario(null)
    setSelectedSimId(null)
  }

  function openHistoryDetail(sim: SimulationSummary) {
    setSelectedSim(sim)
    setHistoryOpen(true)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Simulation</h1>
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

      {/* Current Run — per-simulation cards with inline controls */}
      {activeTab === "current" && (
        <div className="space-y-4">
          {simulations
            .filter((s) => s.status === "RUNNING" || s.status === "PAUSED")
            .map((sim) => {
              // Use the detail object if this sim matches, otherwise fall back to summary
              const detail = sim.id === simulation.id ? simulation : null
              return (
                <Card key={sim.id} className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold">{sim.name}</span>
                      <Badge variant="outline" className={statusColor(sim.status)}>
                        {sim.status}
                      </Badge>
                    </div>
                    <InlineSimControls simId={sim.id} />
                  </div>

                  {detail && (
                    <>
                      <div className="grid grid-cols-5 gap-4">
                        {[
                          { label: "Mission Day", value: detail.currentMetrics.missionDay },
                          { label: "Water Reserve", value: `${detail.currentMetrics.waterReservePercent}%` },
                          { label: "Nutrient Reserve", value: `${detail.currentMetrics.nutrientReservePercent}%` },
                          { label: "Energy Reserve", value: `${detail.currentMetrics.energyReservePercent}%` },
                          { label: "Total Yield", value: `${detail.currentMetrics.totalYieldKg} kg` },
                        ].map((m) => (
                          <div key={m.label}>
                            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                              {m.label}
                            </div>
                            <div className="text-2xl font-mono tabular-nums">{m.value}</div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                          Learning Goal
                        </div>
                        <p className="text-muted-foreground">{detail.learningGoal}</p>
                      </div>

                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                          Configuration
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Autonomy:</span>{" "}
                            <span className="font-medium">{detail.agentConfig.autonomyLevel}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Risk:</span>{" "}
                            <span className="font-medium">{detail.agentConfig.riskTolerance}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Crew:</span>{" "}
                            <span className="font-medium font-mono">{detail.crewSize}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Yield Target:</span>{" "}
                            <span className="font-medium font-mono">{detail.yieldTarget} kg</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {!detail && (
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Autonomy:</span>{" "}
                        <span className="font-medium">{sim.autonomyLevel}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Risk:</span>{" "}
                        <span className="font-medium">{sim.riskTolerance}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Crew:</span>{" "}
                        <span className="font-medium font-mono">{sim.crewSize}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Yield Target:</span>{" "}
                        <span className="font-medium font-mono">{sim.yieldTarget} kg</span>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
        </div>
      )}

      {/* Scenarios — redesigned cards */}
      {activeTab === "scenarios" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((scenario) => (
            <Card
              key={scenario.id}
              className="flex flex-col h-full p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => openScenarioDetail(scenario)}
            >
              {/* Top row: severity left, type right */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge variant="outline" className={severityColor(scenario.severity)}>
                  {scenario.severity}
                </Badge>
                <Badge variant="outline" className="shrink-0 text-xs uppercase tracking-wide">
                  {scenario.type.replace(/_/g, " ")}
                </Badge>
              </div>

              {/* Title */}
              <h3 className="font-semibold mb-2">{scenario.name}</h3>

              {/* Description — truncated */}
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                {scenario.description}
              </p>

              {/* Inject button pinned to bottom */}
              <div className="mt-auto">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    openInjectDialog(scenario)
                  }}
                >
                  Inject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* History — clickable rows */}
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
              {simulations.map((sim) => (
                <tr
                  key={sim.id}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => openHistoryDetail(sim)}
                >
                  <td className="py-3">{sim.name}</td>
                  <td className="py-3">
                    <Badge variant="outline" className={statusColor(sim.status)}>
                      {sim.status}
                    </Badge>
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

      {/* ========== Scenario Detail Dialog ========== */}
      <Dialog open={scenarioDetailOpen} onOpenChange={setScenarioDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedScenario && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={severityColor(selectedScenario.severity)}>
                    {selectedScenario.severity}
                  </Badge>
                  <Badge variant="outline" className="text-xs uppercase tracking-wide">
                    {selectedScenario.type.replace(/_/g, " ")}
                  </Badge>
                </div>
                <DialogTitle>{selectedScenario.name}</DialogTitle>
              </DialogHeader>
              <DialogDescription className="leading-relaxed">
                {selectedScenario.description}
              </DialogDescription>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Severity
                  </div>
                  <span className="font-medium">{selectedScenario.severity}</span>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Type
                  </div>
                  <span className="font-medium">{selectedScenario.type.replace(/_/g, " ")}</span>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Default Duration
                  </div>
                  <span className="font-medium font-mono tabular-nums">
                    {selectedScenario.defaultDurationMinutes
                      ? `${selectedScenario.defaultDurationMinutes} min`
                      : "Variable"}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setScenarioDetailOpen(false)
                    openInjectDialog(selectedScenario)
                  }}
                >
                  Inject into Simulation
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== Inject Dialog ========== */}
      <Dialog open={injectOpen} onOpenChange={setInjectOpen}>
        <DialogContent className="sm:max-w-lg">
          {injectScenario && (
            <>
              <DialogHeader>
                <DialogTitle>Inject Scenario</DialogTitle>
                <DialogDescription>
                  Select a running simulation to inject{" "}
                  <span className="font-medium text-foreground">{injectScenario.name}</span> into.
                </DialogDescription>
              </DialogHeader>

              {runningSimulations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No simulations are currently running.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Running Simulations
                  </div>
                  {runningSimulations.map((sim) => (
                    <button
                      key={sim.id}
                      onClick={() => setSelectedSimId(sim.id)}
                      className={`w-full text-left rounded-lg border p-3 transition-colors ${
                        selectedSimId === sim.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{sim.name}</span>
                        <Badge variant="outline" className={statusColor(sim.status)}>
                          {sim.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Crew {sim.crewSize} · {sim.autonomyLevel} · {sim.riskTolerance}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <DialogFooter>
                <Button
                  disabled={!selectedSimId || runningSimulations.length === 0}
                  onClick={confirmInject}
                >
                  Confirm Inject
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== History Detail Dialog ========== */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-2xl">
          {selectedSim && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={statusColor(selectedSim.status)}>
                    {selectedSim.status}
                  </Badge>
                  {selectedSim.outcomeScore !== null && (
                    <span className="text-xs text-muted-foreground font-mono tabular-nums">
                      Score: {selectedSim.outcomeScore}
                    </span>
                  )}
                </div>
                <DialogTitle>{selectedSim.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Configuration */}
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Configuration
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Autonomy:</span>{" "}
                      <span className="font-medium">{selectedSim.autonomyLevel}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Risk:</span>{" "}
                      <span className="font-medium">{selectedSim.riskTolerance}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Crew:</span>{" "}
                      <span className="font-medium font-mono tabular-nums">{selectedSim.crewSize}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Yield Target:</span>{" "}
                      <span className="font-medium font-mono tabular-nums">{selectedSim.yieldTarget} kg</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>{" "}
                      <span className="font-medium font-mono tabular-nums">
                        {selectedSim.missionDuration} days
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>{" "}
                      <span className="font-medium">
                        {new Date(selectedSim.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Learning Goal */}
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Learning Goal
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedSim.learningGoal}</p>
                </div>

                {/* Timeline placeholder */}
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Key Events
                  </div>
                  <div className="space-y-2">
                    {[
                      { day: 1, event: "Simulation started, initial crop assignments" },
                      { day: 30, event: "First scheduled review, minor adjustments" },
                      { day: 75, event: "Water recycling degradation event triggered" },
                      { day: 142, event: "Current state — simulation in progress" },
                    ].map((entry) => (
                      <div
                        key={entry.day}
                        className="flex items-start gap-3 text-sm"
                      >
                        <span className="shrink-0 font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                          SOL {entry.day}
                        </span>
                        <span className="text-muted-foreground">{entry.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter showCloseButton />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

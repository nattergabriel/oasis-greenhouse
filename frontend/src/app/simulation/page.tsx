"use client"

import { useState, useEffect } from "react"
import { api, useApiState } from "@/lib/api"
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
import { Plus, Play, Square, Brain, TrendingUp, Zap } from "lucide-react"
import type { Scenario, SimulationSummary, AgentResults } from "@/lib/types"

type TabValue = "scenarios" | "history"

const TABS: { value: TabValue; label: string }[] = [
  { value: "scenarios", label: "Test Scenarios" },
  { value: "history", label: "Learning History" },
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
  const [activeTab, setActiveTab] = useState<TabValue>("scenarios")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [agentResults, setAgentResults] = useState<AgentResults | null>(null)
  const [loadingAgentResults, setLoadingAgentResults] = useState(false)

  const { data: simulations } = useApiState(
    () => api.simulations.list().then(r => r.simulations),
    [] as SimulationSummary[],
    [refreshTrigger]
  )

  const { data: scenarios } = useApiState(
    () => api.scenarios.list().then(r => r.scenarios),
    [] as Scenario[]
  )

  const runningSimulations = simulations.filter(s => s.status === "RUNNING")

  // Auto-refresh when there's a running simulation
  useEffect(() => {
    if (runningSimulations.length === 0) return

    // Poll every 5 seconds when a simulation is running
    const interval = setInterval(() => {
      refreshSimulations()
    }, 5000)

    return () => clearInterval(interval)
  }, [runningSimulations.length])

  // Scenario detail dialog
  const [scenarioDetailOpen, setScenarioDetailOpen] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)

  // Create simulation dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedScenarioForSim, setSelectedScenarioForSim] = useState<Scenario | null>(null)

  // History detail dialog
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedSim, setSelectedSim] = useState<SimulationSummary | null>(null)

  // Full screen agent decisions dialog
  const [fullScreenDecisionsOpen, setFullScreenDecisionsOpen] = useState(false)

  function refreshSimulations() {
    setRefreshTrigger(prev => prev + 1)
  }

  function openScenarioDetail(scenario: Scenario) {
    setSelectedScenario(scenario)
    setScenarioDetailOpen(true)
  }

  function openCreateDialog(scenario?: Scenario) {
    setSelectedScenarioForSim(scenario ?? null)
    setError(null)
    setCreateOpen(true)
  }

  async function handleStopSimulation(simId: string) {
    if (stopping) return false
    setStopping(true)
    setError(null)

    try {
      const response = await api.simulations.stop(simId)
      console.log("Simulation stopped:", response)

      // Force immediate refresh to show updated status
      refreshSimulations()

      // Wait a moment and refresh again to ensure we got the update
      setTimeout(() => {
        refreshSimulations()
      }, 500)

      return true
    } catch (err) {
      console.error("Failed to stop simulation:", err)
      setError("Failed to stop simulation. Please try again.")
      return false
    } finally {
      setStopping(false)
    }
  }

  async function handleCreateSimulation() {
    if (creating) return
    setCreating(true)
    setError(null)

    try {
      const timestamp = new Date().toISOString().split('T')[0]
      const scenarioName = selectedScenarioForSim ? ` - ${selectedScenarioForSim.name}` : ""

      await api.simulations.create({
        name: `Learning Job ${timestamp}${scenarioName}`,
        learningGoal: selectedScenarioForSim
          ? `Test agent response to ${selectedScenarioForSim.name} scenario`
          : "Optimize crop yield and resource efficiency for Mars conditions",
        missionDuration: 180,
        crewSize: 4,
        yieldTarget: 1000,
        resourceAvailability: {
          waterLiters: 10000,
          nutrientKg: 500,
          energyKwh: 5000
        },
        agentConfig: {
          autonomyLevel: "HYBRID",
          certaintyThreshold: 0.7,
          riskTolerance: "MODERATE",
          priorityWeights: { yield: 0.4, diversity: 0.3, resourceConservation: 0.3 }
        }
      })

      setCreateOpen(false)
      refreshSimulations()
      setActiveTab("history")
    } catch (err: any) {
      const errorMessage = err?.message || String(err)
      if (errorMessage.includes("409") || errorMessage.includes("already running")) {
        setError("Another learning job is already running. Wait for it to complete or stop it first.")
      } else {
        setError("Failed to create simulation. Please try again.")
      }
      console.error("Failed to create simulation:", err)
    } finally {
      setCreating(false)
    }
  }

  function openHistoryDetail(sim: SimulationSummary) {
    setSelectedSim(sim)
    setHistoryOpen(true)
    setAgentResults(null)
  }

  // Fetch agent results when history dialog opens (COMPLETED only) - for metrics and strategy
  useEffect(() => {
    if (!historyOpen || !selectedSim) {
      return
    }

    // Only fetch results for COMPLETED simulations
    if (selectedSim.status === "COMPLETED" && !agentResults) {
      fetchAgentResults()
    }
  }, [historyOpen, selectedSim, refreshTrigger])

  async function fetchAgentResults() {
    if (!selectedSim) return

    try {
      setLoadingAgentResults(true)
      const results = await api.simulations.agentResults(selectedSim.id)
      setAgentResults(results)
    } catch (err: any) {
      // Not available for incomplete simulations or if import failed
      if (err?.message?.includes("404") || err?.message?.includes("not available")) {
        setAgentResults(null)
      } else {
        console.error("Failed to fetch agent results:", err)
      }
    } finally {
      setLoadingAgentResults(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Simulation & Learning</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Run batch learning jobs to test agent behavior under different scenarios
          </p>
        </div>
        <Button onClick={() => openCreateDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          New Learning Job
        </Button>
      </div>

      {runningSimulations.length > 0 && (
        <Card className="p-4 border-[var(--color-status-healthy)]/30 bg-[var(--color-status-healthy)]/10 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusColor("RUNNING")}>
                  RUNNING
                </Badge>
                <span className="text-sm font-medium">{runningSimulations[0].name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Learning job in progress. Only one job can run at a time.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                openHistoryDetail(runningSimulations[0])
              }}
            >
              View Details
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-4 border-destructive/30 bg-destructive/10 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

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

      {/* Scenarios — test scenario cards */}
      {activeTab === "scenarios" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="text-sm text-muted-foreground">
            Select a crisis scenario to test how the AI agent responds. Each scenario becomes a learning job.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.length === 0 && (
              <Card className="col-span-full p-8 text-center">
                <p className="text-muted-foreground">No scenarios available</p>
                <p className="text-xs text-muted-foreground mt-1">Crisis scenarios will appear here when configured.</p>
              </Card>
            )}
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

                {/* Test button pinned to bottom */}
                <div className="mt-auto">
                  <Button
                    className="w-full gap-2"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      openCreateDialog(scenario)
                    }}
                  >
                    <Play className="h-4 w-4" />
                    Run Test
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* History — completed learning jobs */}
      {activeTab === "history" && (
        <Card className="p-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Past Learning Jobs</span>
            {simulations.length > 0 && (
              <span className="text-xs text-muted-foreground">{simulations.length} total</span>
            )}
          </div>

          {simulations.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No simulation history</p>
              <p className="text-xs text-muted-foreground mt-1">Run a learning job to see results here.</p>
              <Button onClick={() => openCreateDialog()} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create First Job
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Score</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Config</th>
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
                    <td className="py-3 font-mono tabular-nums">
                      {sim.outcomeScore !== null ? sim.outcomeScore.toFixed(1) : "--"}
                    </td>
                    <td className="py-3 text-muted-foreground text-xs">
                      {sim.autonomyLevel} · {sim.riskTolerance}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(sim.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
                  onClick={() => {
                    setScenarioDetailOpen(false)
                    openCreateDialog(selectedScenario)
                  }}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Run Learning Job
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== Create Simulation Dialog ========== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Learning Job</DialogTitle>
            <DialogDescription>
              {selectedScenarioForSim
                ? `Run a learning simulation with the ${selectedScenarioForSim.name} scenario.`
                : "Run a baseline learning simulation to test agent behavior."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {runningSimulations.length > 0 && (
              <Card className="p-4 border-[var(--color-status-warning)]/30 bg-[var(--color-status-warning)]/10">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">A job is already running</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Only one simulation can run at a time: <strong>{runningSimulations[0].name}</strong>
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (runningSimulations.length > 0) {
                          const stopped = await handleStopSimulation(runningSimulations[0].id)
                          if (stopped) {
                            setCreateOpen(false)
                          }
                        }
                      }}
                      disabled={stopping}
                      className="h-7 text-xs gap-1.5"
                    >
                      <Square className="h-3 w-3" />
                      {stopping ? "Stopping..." : "Stop Running Job"}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Configuration
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Duration:</span>{" "}
                  <span className="font-medium font-mono">180 days</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Crew Size:</span>{" "}
                  <span className="font-medium font-mono">4</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Autonomy:</span>{" "}
                  <span className="font-medium">HYBRID</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Risk:</span>{" "}
                  <span className="font-medium">MODERATE</span>
                </div>
              </div>
            </div>

            {selectedScenarioForSim && (
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Test Scenario
                </div>
                <Card className="p-3 bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={severityColor(selectedScenarioForSim.severity)}>
                      {selectedScenarioForSim.severity}
                    </Badge>
                    <span className="font-medium text-sm">{selectedScenarioForSim.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedScenarioForSim.description}</p>
                </Card>
              </div>
            )}

            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3">
              <strong>Note:</strong> This will create a batch learning job that runs to completion.
              Results will be available in the Learning History tab.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSimulation}
              disabled={creating || runningSimulations.length > 0}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              {creating ? "Creating..." : runningSimulations.length > 0 ? "Job Already Running" : "Start Job"}
            </Button>
          </DialogFooter>
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
                      Score: {selectedSim.outcomeScore.toFixed(1)}
                    </span>
                  )}
                </div>
                <DialogTitle>{selectedSim.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Learning Goal */}
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Learning Goal
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedSim.learningGoal}</p>
                </div>

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

                {/* Outcome */}
                {selectedSim.status === "COMPLETED" && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                      Outcome
                    </div>
                    <Card className="p-4 bg-secondary/50">
                      <div className="text-2xl font-mono tabular-nums mb-1">
                        {selectedSim.outcomeScore !== null ? selectedSim.outcomeScore.toFixed(1) : "--"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Learning score · Completed {selectedSim.completedAt ? new Date(selectedSim.completedAt).toLocaleDateString() : "--"}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Running Status */}
                {selectedSim.status === "RUNNING" && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                      Status
                    </div>
                    <Card className="p-4 bg-[var(--color-status-healthy)]/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium mb-1">Job in progress</div>
                          <div className="text-xs text-muted-foreground">
                            The learning job is currently running. Results will be available when complete.
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const stopped = await handleStopSimulation(selectedSim.id)
                            if (stopped) {
                              setHistoryOpen(false)
                            }
                          }}
                          disabled={stopping}
                          className="gap-1.5"
                        >
                          <Square className="h-3.5 w-3.5" />
                          {stopping ? "Stopping..." : "Stop Job"}
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}
              </div>

              <DialogFooter>
                {selectedSim.status === "COMPLETED" && (
                  <Button
                    variant="outline"
                    onClick={() => setFullScreenDecisionsOpen(true)}
                    className="gap-2"
                  >
                    <Brain className="h-4 w-4" />
                    View Agent Decisions
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== Full Screen Agent Decisions Dialog ========== */}
      <Dialog open={fullScreenDecisionsOpen} onOpenChange={setFullScreenDecisionsOpen}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Agent Decisions — {selectedSim?.name}
            </DialogTitle>
            <DialogDescription>
              Performance metrics and decision history from the completed simulation
            </DialogDescription>
          </DialogHeader>

          {loadingAgentResults ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <div className="text-center">
                <div className="text-muted-foreground mb-2">Loading agent decisions...</div>
                <div className="text-xs text-muted-foreground">This may take a moment</div>
              </div>
            </div>
          ) : agentResults ? (
            <div className="flex-1 overflow-y-auto -mx-6 px-6">
              {/* Final Metrics */}
              <div className="mb-6">
                <div className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
                  Final Metrics
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 bg-secondary/50">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Total Harvested
                    </div>
                    <div className="text-xl font-mono tabular-nums">
                      {agentResults.final_metrics.total_harvested_kg.toFixed(1)} kg
                    </div>
                  </Card>
                  <Card className="p-4 bg-secondary/50">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Resource Efficiency
                    </div>
                    <div className="text-xl font-mono tabular-nums">
                      {(agentResults.final_metrics.resource_efficiency * 100).toFixed(0)}%
                    </div>
                  </Card>
                  <Card className="p-4 bg-secondary/50">
                    <div className="text-xs text-muted-foreground mb-1">Calorie Coverage</div>
                    <div className="text-xl font-mono tabular-nums">
                      {(agentResults.final_metrics.avg_calorie_gh_fraction * 100).toFixed(0)}%
                    </div>
                  </Card>
                  <Card className="p-4 bg-secondary/50">
                    <div className="text-xs text-muted-foreground mb-1">Protein Coverage</div>
                    <div className="text-xl font-mono tabular-nums">
                      {(agentResults.final_metrics.avg_protein_gh_fraction * 100).toFixed(0)}%
                    </div>
                  </Card>
                  <Card className="p-4 bg-secondary/50">
                    <div className="text-xs text-muted-foreground mb-1">Micronutrients</div>
                    <div className="text-xl font-mono tabular-nums">
                      {agentResults.final_metrics.avg_micronutrient_coverage.toFixed(1)}
                    </div>
                  </Card>
                  <Card className="p-4 bg-secondary/50">
                    <div className="text-xs text-muted-foreground mb-1">Crops Lost</div>
                    <div className="text-xl font-mono tabular-nums">
                      {agentResults.final_metrics.crops_lost}
                    </div>
                  </Card>
                </div>
              </div>

              {/* Agent Decisions */}
              <div className="mb-3">
                <div className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
                  All Decisions ({agentResults.agent_decisions.length})
                </div>
              </div>
              <div className="space-y-3">
                {agentResults.agent_decisions.slice().reverse().map((decision, idx) => (
                  <Card key={idx} className="p-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-sm font-mono text-muted-foreground font-medium">
                        Day {decision.day}
                      </span>
                      <Badge variant="outline" className="shrink-0">
                        {decision.node}
                      </Badge>
                    </div>
                    <p className="text-base leading-relaxed mb-2">{decision.reasoning}</p>
                    {decision.actions.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <div className="text-sm text-muted-foreground font-medium">
                          Actions taken ({decision.actions.length}):
                        </div>
                        <div className="space-y-1">
                          {decision.actions.map((action, actionIdx) => (
                            <div key={actionIdx} className="text-sm text-muted-foreground pl-3 border-l-2 border-border">
                              <code className="text-xs bg-secondary/50 px-2 py-1 rounded">
                                {typeof action === 'string' ? action : JSON.stringify(action)}
                              </code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-16">
              <div className="text-center text-muted-foreground">
                No agent decisions available
              </div>
            </div>
          )}

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client";

import { useState } from "react";
import { useSimulation } from "@/providers/simulation-provider";
import { Card } from "@/components/ui/card";
import { ChevronDown, Check, X, Bot, CheckCircle } from "lucide-react";
import type { AgentLogEntry, Recommendation, AgentOutcome, Alert, AlertSeverity, AlertStatus } from "@/lib/types";

// === Shared helpers ===

function timeAgo(timestamp: string): string {
  const ms = Date.now() - new Date(timestamp).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(ms / 3600000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function outcomeColor(outcome: AgentOutcome): string {
  if (outcome === "SUCCESS") return "var(--color-status-healthy)";
  if (outcome === "PENDING") return "var(--color-status-warning)";
  return "var(--color-status-critical)";
}

function confidenceColor(c: number): string {
  if (c > 0.7) return "var(--color-status-healthy)";
  if (c >= 0.5) return "var(--color-status-warning)";
  return "var(--color-status-critical)";
}

function severityColor(severity: AlertSeverity): string {
  if (severity === "CRITICAL") return "var(--color-status-critical)";
  if (severity === "WARNING") return "var(--color-status-warning)";
  return "var(--color-mars-blue)";
}

function sortAlerts(alerts: Alert[]): Alert[] {
  const weight = { CRITICAL: 3, WARNING: 2, INFO: 1 };
  return [...alerts].sort((a, b) => {
    const w = weight[b.severity] - weight[a.severity];
    if (w !== 0) return w;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// === Pending decision row ===

function RecommendationRow({ rec, onApprove, onDismiss }: {
  rec: Recommendation;
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`border border-border rounded-lg overflow-hidden transition-colors ${open ? "bg-card" : "hover:bg-secondary"}`}>
      <div className="flex items-center px-4 py-4 gap-4">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: confidenceColor(rec.confidence) }} />

        <button onClick={() => setOpen(!open)} className="flex-1 text-left min-w-0 flex items-center gap-3">
          <span className="text-base truncate">{rec.description}</span>
          <span className="text-sm text-muted-foreground shrink-0 font-mono tabular-nums">{Math.round(rec.confidence * 100)}%</span>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onApprove(rec.id)}
            className="flex items-center gap-1.5 rounded-lg border border-[#4ead6b]/30 px-3 py-1.5 text-sm text-[#4ead6b] transition-colors hover:bg-[#4ead6b]/10"
          >
            <Check className="w-3.5 h-3.5" />
            Approve
          </button>
          <button
            onClick={() => onDismiss(rec.id)}
            className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <X className="w-3.5 h-3.5" />
            Dismiss
          </button>
        </div>

        <button onClick={() => setOpen(!open)} className="shrink-0">
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="px-5 pb-5 pt-2 border-t border-border animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Reasoning</span>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{rec.reasoning}</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Details</span>
              <div className="mt-1.5 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Action type</span>
                  <span className="font-mono text-xs">{rec.actionType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Urgency</span>
                  <span>{rec.urgency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-mono tabular-nums">{Math.round(rec.confidence * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// === Decisions stack (collapses when multiple) ===

function DecisionsStack({ pending, onApprove, onDismiss }: {
  pending: Recommendation[];
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (pending.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Bot className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Agent is operating autonomously — no decisions needed</p>
      </Card>
    );
  }

  if (pending.length === 1) {
    return <RecommendationRow rec={pending[0]} onApprove={onApprove} onDismiss={onDismiss} />;
  }

  // Multiple decisions — show first + collapsed stack
  const showAll = expanded;
  const visible = showAll ? pending : [pending[0]];
  const remaining = pending.length - 1;

  return (
    <div className="space-y-2">
      {visible.map((rec) => (
        <RecommendationRow key={rec.id} rec={rec} onApprove={onApprove} onDismiss={onDismiss} />
      ))}
      {!showAll && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full rounded-lg border border-dashed border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground flex items-center justify-center gap-2"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          {remaining} more decision{remaining > 1 ? "s" : ""} awaiting approval
        </button>
      )}
      {showAll && (
        <button
          onClick={() => setExpanded(false)}
          className="w-full rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground flex items-center justify-center gap-2"
        >
          <ChevronDown className="h-3 w-3 rotate-180" />
          Collapse
        </button>
      )}
    </div>
  );
}

// === Alert row ===

function AlertRow({ alert, isFirst }: { alert: Alert; isFirst: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`border-x border-b border-border overflow-hidden transition-colors ${isFirst ? "border-t rounded-t-lg" : ""} ${open ? "bg-card" : "hover:bg-secondary"}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center px-4 py-3.5 text-left transition-colors gap-4"
      >
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: severityColor(alert.severity) }} />
        <div className="flex-1 min-w-0">
          <span className="text-base block truncate">{alert.diagnosis}</span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground">{alert.type.replace(/_/g, " ")}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground font-mono tabular-nums">{timeAgo(alert.createdAt)}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{alert.status}</span>
            {alert.escalatedToHuman && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-destructive">Escalated</span>
              </>
            )}
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 pt-2 border-t border-border animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Diagnosis</span>
              <p className="mt-1.5 text-sm leading-relaxed">{alert.diagnosis}</p>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span>Severity: <span style={{ color: severityColor(alert.severity) }}>{alert.severity}</span></span>
                <span>Confidence: <span className="font-mono tabular-nums">{Math.round(alert.confidence * 100)}%</span></span>
              </div>
            </div>
            <div className="lg:col-span-4">
              {alert.suggestedAction ? (
                <>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Suggested Action</span>
                  <p className="mt-1.5 text-sm leading-relaxed">{alert.suggestedAction}</p>
                </>
              ) : (
                <>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Action</span>
                  <p className="mt-1.5 text-sm text-muted-foreground">No action suggested — monitor only</p>
                </>
              )}
            </div>
            <div className="lg:col-span-3 flex flex-col justify-between">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                {alert.greenhouseId && <div>Location: {alert.greenhouseId.includes("0001") ? "Alpha" : "Beta"}</div>}
                {alert.slotId && <div>Slot: {alert.slotId}</div>}
                {alert.resolvedAt && (
                  <div className="flex items-center gap-1 text-[#4ead6b]">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Resolved {timeAgo(alert.resolvedAt)}
                  </div>
                )}
              </div>
              {alert.status === "OPEN" && (
                <button className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  Acknowledge
                </button>
              )}
              {alert.status === "ACKNOWLEDGED" && (
                <button className="mt-3 w-full rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm transition-colors hover:bg-primary/20">
                  Resolve
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// === Activity log row ===

function LogRow({ entry, isFirst }: { entry: AgentLogEntry; isFirst: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`border-x border-b border-border overflow-hidden transition-colors ${isFirst ? "border-t rounded-t-lg" : ""} ${open ? "bg-card" : "hover:bg-secondary"}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center px-4 py-3.5 text-left transition-colors gap-4"
      >
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: outcomeColor(entry.outcome) }} />
        <div className="flex-1 min-w-0">
          <span className="text-base truncate block">{entry.description}</span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground font-mono">{entry.actionType.replace(/_/g, " ")}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground font-mono tabular-nums">{timeAgo(entry.timestamp)}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs" style={{ color: outcomeColor(entry.outcome) }}>{entry.outcome}</span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 pt-2 border-t border-border animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Reasoning</span>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{entry.reasoning}</p>
            </div>
            {entry.knowledgeBaseSource && (
              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Knowledge Base</span>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{entry.knowledgeBaseSource}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// === Main page ===

type AlertFilter = "ALL" | AlertStatus;

export default function ActivityPage() {
  const { state } = useSimulation();
  const [logFilter, setLogFilter] = useState<AgentOutcome | "ALL">("ALL");
  const [alertFilter, setAlertFilter] = useState<AlertFilter>("ALL");

  const pending = state.recommendations.filter((r) => r.status === "PENDING");

  const filteredAlerts = alertFilter === "ALL" ? state.alerts : state.alerts.filter((a) => a.status === alertFilter);
  const sortedAlerts = sortAlerts(filteredAlerts);

  const filteredLog = logFilter === "ALL" ? state.agentLog : state.agentLog.filter((e) => e.outcome === logFilter);
  const sortedLog = [...filteredLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleApprove = (id: string) => console.log("Approve:", id);
  const handleDismiss = (id: string) => console.log("Dismiss:", id);

  const alertCounts = {
    open: state.alerts.filter((a) => a.status === "OPEN").length,
    ack: state.alerts.filter((a) => a.status === "ACKNOWLEDGED").length,
    resolved: state.alerts.filter((a) => a.status === "RESOLVED").length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>

      {/* Pending decisions */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Needs Your Decision</span>
          {pending.length > 0 && (
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-destructive text-[10px] font-bold text-white">
              {pending.length}
            </span>
          )}
        </div>
        <DecisionsStack pending={pending} onApprove={handleApprove} onDismiss={handleDismiss} />
      </section>

      {/* Alerts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Alerts</span>
            <span className="text-xs text-muted-foreground">
              {alertCounts.open} open · {alertCounts.ack} acknowledged · {alertCounts.resolved} resolved
            </span>
          </div>
          <div className="flex gap-2">
            {(["ALL", "OPEN", "ACKNOWLEDGED", "RESOLVED"] as AlertFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setAlertFilter(s)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  alertFilter === s
                    ? "border-primary bg-primary/20 text-primary font-medium"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {sortedAlerts.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {alertFilter === "ALL" ? "All systems nominal" : `No ${alertFilter.toLowerCase()} alerts`}
            </p>
          </Card>
        ) : (
          <div>
            {sortedAlerts.map((alert, i) => (
              <AlertRow key={alert.id} alert={alert} isFirst={i === 0} />
            ))}
            <div className="border-b border-border rounded-b-lg" />
          </div>
        )}
      </section>

      {/* Activity log */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Agent Log</span>
          <div className="flex gap-2">
            {(["ALL", "SUCCESS", "PENDING", "FAILED"] as (AgentOutcome | "ALL")[]).map((f) => (
              <button
                key={f}
                onClick={() => setLogFilter(f)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  logFilter === f
                    ? "border-primary bg-primary/20 text-primary font-medium"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {sortedLog.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No entries match this filter</p>
          </Card>
        ) : (
          <div>
            {sortedLog.map((entry, i) => (
              <LogRow key={entry.id} entry={entry} isFirst={i === 0} />
            ))}
            <div className="border-b border-border rounded-b-lg" />
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useSimulation } from "@/providers/simulation-provider";
import { ChevronDown, CheckCircle } from "lucide-react";
import type { Alert, AlertSeverity, AlertStatus } from "@/lib/types";

type FilterStatus = "ALL" | AlertStatus;

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

function timeAgo(timestamp: string): string {
  const ms = Date.now() - new Date(timestamp).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(ms / 3600000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

// Expandable alert row
function AlertRow({ alert, isFirst }: { alert: Alert; isFirst: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`border-x border-b border-border overflow-hidden transition-colors ${isFirst ? "border-t rounded-t-lg" : ""} ${open ? "bg-card" : "hover:bg-secondary"}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center px-4 py-3.5 text-left transition-colors gap-4"
      >
        {/* Severity dot */}
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: severityColor(alert.severity) }} />

        {/* Diagnosis — truncated */}
        <div className="flex-1 min-w-0">
          <span className="text-base block truncate">{truncate(alert.diagnosis, 80)}</span>
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
            {/* Left: Full diagnosis */}
            <div className="lg:col-span-5">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Diagnosis</span>
              <p className="mt-1.5 text-sm leading-relaxed">{alert.diagnosis}</p>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span>Severity: <span style={{ color: severityColor(alert.severity) }}>{alert.severity}</span></span>
                <span>Confidence: <span className="font-mono tabular-nums">{Math.round(alert.confidence * 100)}%</span></span>
              </div>
            </div>

            {/* Center: Suggested action */}
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

            {/* Right: Actions + meta */}
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

export default function AlertsPage() {
  const { state } = useSimulation();
  const [filter, setFilter] = useState<FilterStatus>("ALL");

  const counts = {
    open: state.alerts.filter((a) => a.status === "OPEN").length,
    ack: state.alerts.filter((a) => a.status === "ACKNOWLEDGED").length,
    resolved: state.alerts.filter((a) => a.status === "RESOLVED").length,
  };

  const filtered = filter === "ALL" ? state.alerts : state.alerts.filter((a) => a.status === filter);
  const sorted = sortAlerts(filtered);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
          <span className="text-sm text-muted-foreground">
            {counts.open} open · {counts.ack} acknowledged · {counts.resolved} resolved
          </span>
        </div>
        <div className="flex gap-2">
          {(["ALL", "OPEN", "ACKNOWLEDGED", "RESOLVED"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                filter === s
                  ? "border-primary bg-primary/20 text-primary font-medium"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Alert rows */}
      {sorted.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {filter === "ALL" ? "All systems nominal" : `No ${filter.toLowerCase()} alerts`}
          </p>
        </Card>
      ) : (
        <div>
          {sorted.map((alert, i) => (
            <AlertRow key={alert.id} alert={alert} isFirst={i === 0} />
          ))}
          <div className="border-b border-border rounded-b-lg" />
        </div>
      )}
    </div>
  );
}

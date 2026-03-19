"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSimulation } from "@/providers/simulation-provider";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Shield,
} from "lucide-react";
import type { Alert, AlertSeverity, AlertStatus } from "@/lib/types";

type FilterStatus = "ALL" | AlertStatus;

function getSeverityIcon(severity: AlertSeverity) {
  switch (severity) {
    case "CRITICAL":
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case "WARNING":
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    case "INFO":
      return <Info className="h-5 w-5 text-blue-500" />;
  }
}

function getSeverityColor(severity: AlertSeverity) {
  switch (severity) {
    case "CRITICAL":
      return "destructive";
    case "WARNING":
      return "outline";
    case "INFO":
      return "secondary";
  }
}

function getSeverityWeight(severity: AlertSeverity): number {
  switch (severity) {
    case "CRITICAL":
      return 3;
    case "WARNING":
      return 2;
    case "INFO":
      return 1;
  }
}

function sortAlerts(alerts: Alert[]): Alert[] {
  return [...alerts].sort((a, b) => {
    const weightDiff = getSeverityWeight(b.severity) - getSeverityWeight(a.severity);
    if (weightDiff !== 0) return weightDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AlertsPage() {
  const { state } = useSimulation();
  const [filter, setFilter] = useState<FilterStatus>("ALL");

  const openCount = state.alerts.filter((a) => a.status === "OPEN").length;
  const acknowledgedCount = state.alerts.filter(
    (a) => a.status === "ACKNOWLEDGED"
  ).length;
  const resolvedCount = state.alerts.filter((a) => a.status === "RESOLVED").length;

  const filteredAlerts =
    filter === "ALL"
      ? state.alerts
      : state.alerts.filter((a) => a.status === filter);

  const sortedAlerts = sortAlerts(filteredAlerts);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-medium tracking-tight">
            Alerts &amp; Incidents
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{openCount} open</span>
            <span>•</span>
            <span>{acknowledgedCount} acknowledged</span>
            <span>•</span>
            <span>{resolvedCount} resolved</span>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs tabular-nums">
          SOL {state.currentMissionDay} / {state.totalMissionDays}
        </Badge>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "ALL" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("ALL")}
        >
          ALL
        </Button>
        <Button
          variant={filter === "OPEN" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("OPEN")}
        >
          OPEN
        </Button>
        <Button
          variant={filter === "ACKNOWLEDGED" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("ACKNOWLEDGED")}
        >
          ACKNOWLEDGED
        </Button>
        <Button
          variant={filter === "RESOLVED" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("RESOLVED")}
        >
          RESOLVED
        </Button>
      </div>

      {/* Alert list */}
      {sortedAlerts.length === 0 ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No {filter.toLowerCase()} alerts</p>
            <p className="text-sm text-muted-foreground">
              {filter === "ALL"
                ? "All systems operating normally"
                : `No alerts in ${filter.toLowerCase()} state`}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const handleAcknowledge = () => {
    setIsAcknowledging(true);
    // TODO: Call API to acknowledge alert
    setTimeout(() => {
      alert.status = "ACKNOWLEDGED";
      setIsAcknowledging(false);
    }, 300);
  };

  const handleResolve = () => {
    setIsResolving(true);
    // TODO: Call API to resolve alert
    setTimeout(() => {
      alert.status = "RESOLVED";
      alert.resolvedAt = new Date().toISOString();
      setIsResolving(false);
    }, 300);
  };

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        {/* Left: Severity icon */}
        <div className="flex-shrink-0">{getSeverityIcon(alert.severity)}</div>

        {/* Main content */}
        <div className="flex-1 space-y-3">
          {/* Badges */}
          <div className="flex items-center gap-2">
            <Badge variant={getSeverityColor(alert.severity)}>
              {alert.severity}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {alert.type.replace(/_/g, " ")}
            </Badge>
            {alert.escalatedToHuman && (
              <Badge variant="destructive" className="gap-1 text-xs">
                <Shield className="h-3 w-3" />
                ESCALATED
              </Badge>
            )}
            <Badge variant="outline" className="gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {alert.status}
            </Badge>
          </div>

          {/* Diagnosis */}
          <div>
            <p className="text-sm font-medium leading-relaxed">{alert.diagnosis}</p>
          </div>

          {/* Confidence */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>AI Confidence: {Math.round(alert.confidence * 100)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${alert.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Suggested action */}
          {alert.suggestedAction && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Suggested Action
              </p>
              <p className="mt-1 text-sm text-foreground">
                {alert.suggestedAction}
              </p>
            </div>
          )}

          {/* Location info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {alert.greenhouseId && (
              <span>Greenhouse: {alert.greenhouseId}</span>
            )}
            {alert.slotId && <span>Slot: {alert.slotId}</span>}
            {alert.cropId && <span>Crop: {alert.cropId}</span>}
          </div>

          {/* Timestamps and actions */}
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Created: {formatTimestamp(alert.createdAt)}</span>
              {alert.resolvedAt && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Resolved: {formatTimestamp(alert.resolvedAt)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {alert.status === "OPEN" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAcknowledge}
                  disabled={isAcknowledging}
                >
                  {isAcknowledging ? "Acknowledging..." : "Acknowledge"}
                </Button>
              )}
              {alert.status === "ACKNOWLEDGED" && (
                <Button
                  size="sm"
                  onClick={handleResolve}
                  disabled={isResolving}
                >
                  {isResolving ? "Resolving..." : "Resolve"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

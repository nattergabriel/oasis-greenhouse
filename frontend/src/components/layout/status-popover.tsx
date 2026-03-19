"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Alert, Recommendation } from "@/lib/types";

interface StatusPopoverProps {
  alerts: Alert[];
  recommendations: Recommendation[];
  totalIssues: number;
}

export function StatusPopover({ alerts, recommendations, totalIssues }: StatusPopoverProps) {
  const [open, setOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [cleared, setCleared] = useState(false);
  const prevTotalIssuesRef = useRef(totalIssues);
  const ref = useRef<HTMLDivElement>(null);

  // Reset acknowledged/cleared when new alerts come in
  useEffect(() => {
    if (totalIssues !== prevTotalIssuesRef.current) {
      prevTotalIssuesRef.current = totalIssues;
      if (totalIssues > 0) {
        setAcknowledged(false);
        setCleared(false);
      }
    }
  }, [totalIssues]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Derive badge display state
  const badgeLabel = cleared ? 0 : totalIssues > 0 ? totalIssues : "OK";
  const badgeVariant: "destructive" | "outline" = (() => {
    if (cleared || totalIssues === 0) return "outline";
    if (acknowledged) return "outline";
    return "destructive";
  })();
  const badgeColorStyle: React.CSSProperties | undefined = (() => {
    if (cleared) return { backgroundColor: "var(--color-status-healthy)", color: "#fff", borderColor: "var(--color-status-healthy)" };
    if (acknowledged && totalIssues > 0) return { backgroundColor: "color-mix(in srgb, var(--color-status-warning) 15%, transparent)", color: "var(--color-status-warning)", borderColor: "var(--color-status-warning)" };
    return undefined;
  })();
  const showPulse = totalIssues > 0 && !acknowledged && !cleared;

  function handleAcknowledge(e: React.MouseEvent) {
    e.stopPropagation();
    setAcknowledged(true);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setCleared(true);
    setAcknowledged(true);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Badge
          variant={badgeVariant}
          className="text-xs tabular-nums cursor-pointer hover:opacity-80 transition-opacity"
          style={badgeColorStyle}
        >
          {badgeLabel}
        </Badge>
        {showPulse && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
        )}
      </button>

      {open && (
        <Card className="absolute right-0 top-full mt-2 w-80 p-0 border border-border z-50 overflow-hidden rounded-lg">
          {/* Header with notification management */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Notifications
            </span>
            <div className="flex items-center gap-1">
              {totalIssues > 0 && !cleared && (
                <>
                  {!acknowledged && (
                    <button
                      onClick={handleAcknowledge}
                      aria-label="Acknowledge all notifications"
                      className="inline-flex items-center justify-center h-5 w-5 rounded border border-border text-muted-foreground hover:text-[var(--color-status-warning)] hover:border-[var(--color-status-warning)] transition-colors"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={handleClear}
                    aria-label="Clear all notifications"
                    className="inline-flex items-center justify-center h-5 w-5 rounded border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Alerts section */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Open Alerts
              </span>
              <Link
                href="/activity"
                onClick={() => setOpen(false)}
                className="text-xs text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {alerts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No open alerts</p>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-2">
                    <div
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          alert.severity === "CRITICAL"
                            ? "var(--color-status-critical)"
                            : alert.severity === "WARNING"
                            ? "var(--color-status-warning)"
                            : "var(--color-mars-blue)",
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs leading-snug line-clamp-1">{alert.diagnosis}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {alert.severity} · {alert.type.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                ))}
                {alerts.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{alerts.length - 3} more
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Pending Actions section */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Pending Actions
              </span>
              <Link
                href="/activity"
                onClick={() => setOpen(false)}
                className="text-xs text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {recommendations.length === 0 ? (
              <p className="text-xs text-muted-foreground">No pending actions</p>
            ) : (
              <div className="space-y-2">
                {recommendations.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="flex items-start gap-2">
                    <div
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    />
                    <div className="min-w-0">
                      <p className="text-xs leading-snug line-clamp-1">{rec.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {rec.urgency} · {Math.round(rec.confidence * 100)}% confidence
                      </p>
                    </div>
                  </div>
                ))}
                {recommendations.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{recommendations.length - 3} more
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

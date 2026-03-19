"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Badge
          variant={totalIssues > 0 ? "destructive" : "outline"}
          className="text-xs tabular-nums cursor-pointer hover:opacity-80 transition-opacity"
        >
          {totalIssues > 0 ? totalIssues : "OK"}
        </Badge>
        {totalIssues > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
        )}
      </button>

      {open && (
        <Card className="absolute right-0 top-full mt-2 w-80 p-0 shadow-lg border z-50 overflow-hidden">
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

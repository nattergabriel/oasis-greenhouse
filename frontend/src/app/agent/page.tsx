"use client";

import { useState } from "react";
import { useSimulation } from "@/providers/simulation-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Brain,
  BookOpen,
} from "lucide-react";
import type {
  AgentLogEntry,
  Recommendation,
  AgentOutcome,
  Urgency,
} from "@/lib/types";

// Helper: Format timestamp as relative time
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// Helper: Format expires countdown
function formatExpiresIn(expiresAt: string | null): string {
  if (!expiresAt) return "—";
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMs < 0) return "Expired";
  if (diffHours > 0) return `Expires in ${diffHours}h`;
  return `Expires in ${diffMinutes}m`;
}

// Helper: Get confidence color
function getConfidenceColor(confidence: number): string {
  if (confidence > 0.7) return "bg-[var(--color-status-healthy)]";
  if (confidence >= 0.5) return "bg-[var(--color-status-warning)]";
  return "bg-[var(--color-status-critical)]";
}

// Helper: Get urgency badge colors
function getUrgencyColors(urgency: Urgency): string {
  switch (urgency) {
    case "CRITICAL":
      return "bg-destructive/20 text-destructive border-destructive/30";
    case "HIGH":
      return "bg-primary/20 text-primary border-primary/30";
    case "MEDIUM":
      return "bg-[var(--color-status-warning)]/20 text-[var(--color-status-warning)] border-[var(--color-status-warning)]/30";
    case "LOW":
      return "bg-muted text-muted-foreground border-border";
  }
}

// Helper: Get outcome badge colors
function getOutcomeColors(outcome: AgentOutcome): string {
  switch (outcome) {
    case "SUCCESS":
      return "bg-[var(--color-status-healthy)]/20 text-[#5a9a6b] border-[var(--color-status-healthy)]/30";
    case "PENDING":
      return "bg-[var(--color-status-warning)]/20 text-[#c4a344] border-[var(--color-status-warning)]/30";
    case "FAILED":
      return "bg-destructive/20 text-destructive border-destructive/30";
  }
}

// RecommendationCard component
function RecommendationCard({
  recommendation,
  onApprove,
  onDismiss,
}: {
  recommendation: Recommendation;
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg mt-1 bg-[var(--color-mars-purple)]/20 text-[var(--color-mars-purple)]">
          <Brain className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs font-mono">
                  {recommendation.actionType}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs ${getUrgencyColors(recommendation.urgency)}`}
                >
                  {recommendation.urgency}
                </Badge>
              </div>
              <p className="text-sm">
                {recommendation.description}
              </p>
            </div>
          </div>

          {/* Reasoning (expandable) */}
          <div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              <span>Reasoning</span>
            </button>
            {isExpanded && (
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {recommendation.reasoning}
              </p>
            )}
          </div>

          {/* Confidence bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Confidence
              </span>
              <span className="text-xs font-mono tabular-nums">
                {Math.round(recommendation.confidence * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-muted border border-border rounded-full overflow-hidden">
              <div
                className={`h-full ${getConfidenceColor(recommendation.confidence)}`}
                style={{ width: `${recommendation.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Expires + Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatExpiresIn(recommendation.expiresAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onApprove(recommendation.id)}
                className="border-[var(--color-status-healthy)]/30 text-[#5a9a6b] hover:bg-[var(--color-status-healthy)]/20"
              >
                <Check className="w-3 h-3 mr-1" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDismiss(recommendation.id)}
              >
                <X className="w-3 h-3 mr-1" />
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// LogEntryCard component
function LogEntryCard({ entry }: { entry: AgentLogEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg mt-1 bg-[var(--color-mars-purple)]/20 text-[var(--color-mars-purple)]">
          <Bot className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(entry.timestamp)}
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs ${getOutcomeColors(entry.outcome)}`}
                >
                  {entry.outcome}
                </Badge>
                <Badge variant="outline" className="text-xs font-mono">
                  {entry.actionType}
                </Badge>
              </div>
              <p className="text-sm">{entry.description}</p>
            </div>
          </div>

          {/* Expandable details */}
          <div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              <span>Details</span>
            </button>
            {isExpanded && (
              <div className="mt-2 space-y-2">
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground block mb-1">
                    Reasoning
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {entry.reasoning}
                  </p>
                </div>
                {entry.knowledgeBaseSource && (
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1">
                      <BookOpen className="w-3 h-3" />
                      Knowledge Base Source
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {entry.knowledgeBaseSource}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function AgentPage() {
  const { state } = useSimulation();
  const [outcomeFilter, setOutcomeFilter] = useState<
    AgentOutcome | "ALL"
  >("ALL");

  // Filter recommendations (pending only)
  const pendingRecommendations = state.recommendations.filter(
    (r) => r.status === "PENDING"
  );

  // Filter log entries
  const filteredLog =
    outcomeFilter === "ALL"
      ? state.agentLog
      : state.agentLog.filter((entry) => entry.outcome === outcomeFilter);

  // Sort log by timestamp descending (newest first)
  const sortedLog = [...filteredLog].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const handleApprove = (id: string) => {
    console.log("Approve recommendation:", id);
  };

  const handleDismiss = (id: string) => {
    console.log("Dismiss recommendation:", id);
  };

  const filterButtons: Array<{ value: AgentOutcome | "ALL"; label: string }> = [
    { value: "ALL", label: "All" },
    { value: "SUCCESS", label: "Success" },
    { value: "PENDING", label: "Pending" },
    { value: "FAILED", label: "Failed" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-medium tracking-tight">AI Agent</h1>
        <Badge variant="outline" className="font-mono text-xs tabular-nums">
          SOL {state.currentMissionDay} / {state.totalMissionDays}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {state.agentLog.length} actions
        </Badge>
      </div>

      {/* Recommended Actions Queue */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Pending Actions
          </span>
          {pendingRecommendations.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {pendingRecommendations.length}
            </Badge>
          )}
        </div>

        {pendingRecommendations.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="inline-flex p-3 rounded-full mb-3 bg-[var(--color-mars-purple)]/20">
              <Bot className="w-6 h-6 text-[var(--color-mars-purple)]" />
            </div>
            <p className="text-sm text-muted-foreground">
              No pending actions — agent is operating autonomously
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingRecommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onApprove={handleApprove}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}
      </section>

      {/* Activity Log */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Agent Activity Log
          </span>
          <div className="flex items-center gap-1">
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setOutcomeFilter(btn.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                  outcomeFilter === btn.value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-accent"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {sortedLog.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No activity log entries match the current filter
            </p>
          </Card>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {sortedLog.map((entry) => (
              <LogEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

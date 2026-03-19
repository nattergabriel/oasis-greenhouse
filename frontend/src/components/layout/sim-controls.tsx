"use client";

import { Pause, Play, FastForward } from "lucide-react";
import { useSimulation } from "@/providers/simulation-provider";

export function SimControls() {
  const { state, dispatch } = useSimulation();
  const { speed, isRunning, currentMissionDay, totalMissionDays } = state;

  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline text-xs font-mono tabular-nums text-muted-foreground">
        SOL {currentMissionDay} / {totalMissionDays}
      </span>
      <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
        <button
          onClick={() => dispatch({ type: "SET_SPEED", speed: 0 })}
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
          onClick={() => dispatch({ type: "SET_SPEED", speed: 1 })}
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
          onClick={() => dispatch({ type: "SET_SPEED", speed: 10 })}
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
    </div>
  );
}

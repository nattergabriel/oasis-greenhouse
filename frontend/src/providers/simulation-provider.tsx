"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { SimulationState } from "@/lib/types";
import { initialSimulationState } from "@/lib/mock-data";
import { simulationTick } from "@/lib/simulation";

type Action =
  | { type: "SET_SPEED"; speed: 0 | 1 | 10 }
  | { type: "TICK" }
  | { type: "SELECT_GREENHOUSE"; id: string | null };

interface SimulationContextValue {
  state: SimulationState;
  dispatch: React.Dispatch<Action>;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

function simulationReducer(
  state: SimulationState,
  action: Action
): SimulationState {
  switch (action.type) {
    case "SET_SPEED":
      return {
        ...state,
        speed: action.speed,
        isRunning: action.speed > 0,
      };
    case "TICK":
      return simulationTick(state);
    case "SELECT_GREENHOUSE":
      return { ...state, selectedGreenhouseId: action.id };
    default:
      return state;
  }
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    simulationReducer,
    initialSimulationState
  );

  const tick = useCallback(() => {
    dispatch({ type: "TICK" });
  }, []);

  useEffect(() => {
    if (!state.isRunning || state.speed === 0) return;

    const intervalMs = state.speed === 1 ? 2000 : 200;
    const timer = setInterval(tick, intervalMs);
    return () => clearInterval(timer);
  }, [state.isRunning, state.speed, tick]);

  return (
    <SimulationContext.Provider value={{ state, dispatch }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx)
    throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
}

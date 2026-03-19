"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import type { SimulationState } from "@/lib/types";
import { initialSimulationState } from "@/lib/mock-data";
import { simulationTick } from "@/lib/simulation";
import { api } from "@/lib/api";

type Action =
  | { type: "SET_SPEED"; speed: 0 | 1 | 10 }
  | { type: "TICK" }
  | { type: "SELECT_GREENHOUSE"; id: string | null }
  | { type: "HYDRATE"; state: Partial<SimulationState> };

interface SimulationContextValue {
  state: SimulationState;
  dispatch: React.Dispatch<Action>;
  hydrated: boolean;
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
    case "HYDRATE":
      return { ...state, ...action.state };
    default:
      return state;
  }
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    simulationReducer,
    initialSimulationState
  );
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from API on mount
  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      try {
        const [ghList, weather, alertsRes, logRes, recsRes, timeline] = await Promise.all([
          api.greenhouses.list(),
          api.weather.current(),
          api.alerts.list(),
          api.agent.log(),
          api.agent.recommendations(),
          api.forecast.missionTimeline(),
        ]);

        if (cancelled) return;

        const greenhouses = ghList.greenhouses;
        const selectedId = greenhouses[0]?.id ?? null;

        // Fetch detail for the first greenhouse to get resources
        let resources = initialSimulationState.resources;
        if (selectedId) {
          try {
            const detail = await api.greenhouses.get(selectedId);
            resources = detail.resources;
          } catch {}
        }

        dispatch({
          type: "HYDRATE",
          state: {
            greenhouses,
            selectedGreenhouseId: selectedId,
            weather,
            alerts: alertsRes.alerts,
            agentLog: logRes.entries,
            recommendations: recsRes.recommendations,
            resources,
            currentMissionDay: timeline.currentMissionDay,
            totalMissionDays: timeline.totalMissionDays,
          },
        });
      } catch {
        // API unavailable — keep mock data
      }
      if (!cancelled) setHydrated(true);
    }
    hydrate();
    return () => { cancelled = true; };
  }, []);

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
    <SimulationContext.Provider value={{ state, dispatch, hydrated }}>
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

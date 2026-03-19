"use client";

import { NavLink } from "./nav-link";
import { useSimulation } from "@/providers/simulation-provider";
import { StatusPopover } from "./status-popover";

export function Navbar() {
  const { state } = useSimulation();
  const { alerts, recommendations } = state;
  const openAlertCount = alerts.filter((a) => a.status === "OPEN").length;
  const pendingRecs = recommendations.filter((r) => r.status === "PENDING").length;
  const totalIssues = openAlertCount + pendingRecs;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center">
        {/* Main Nav */}
        <div className="flex items-center -ml-3">
          <NavLink href="/dashboard" label="Dashboard" />
          <Divider />
          <NavLink href="/greenhouse" label="Greenhouse" />
          <Divider />
          <NavLink href="/activity" label="Activity" />
          <Divider />
          <NavLink href="/crops" label="Crops" />
          <Divider />
          <NavLink href="/nutrition" label="Nutrition" />
          <Divider />
          <NavLink href="/forecasting" label="Forecast" />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Status badge */}
        <div className="hidden md:flex items-center gap-3">
          <StatusPopover
            alerts={alerts.filter((a) => a.status === "OPEN")}
            recommendations={recommendations.filter((r) => r.status === "PENDING")}
            totalIssues={totalIssues}
          />
        </div>

        {/* Right-side admin links */}
        <div className="flex items-center ml-3">
          <Divider />
          <NavLink href="/simulation" label="Simulation" />
          <Divider />
          <NavLink href="/admin" label="Admin" />
        </div>
      </div>
    </nav>
  );
}

function Divider() {
  return (
    <div className="mx-1.5 w-px h-3.5 bg-border self-center" />
  );
}

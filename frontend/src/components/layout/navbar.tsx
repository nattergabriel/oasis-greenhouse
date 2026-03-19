"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { NavLink } from "./nav-link";
import { useSimulation } from "@/providers/simulation-provider";
import { StatusPopover } from "./status-popover";

export function Navbar() {
  const { state } = useSimulation();
  const { resources, alerts, recommendations } = state;
  const openAlertCount = alerts.filter((a) => a.status === "OPEN").length;
  const pendingRecs = recommendations.filter((r) => r.status === "PENDING").length;
  const totalIssues = openAlertCount + pendingRecs;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center">
        {/* Main Nav — text only, separated by vertical dividers */}
        <div className="flex items-center -ml-3">
          <NavLink href="/dashboard" label="Dashboard" />
          <Divider />
          <NavLink href="/greenhouse" label="Greenhouse" />
          <Divider />
          <NavLink href="/agent" label="Agent" />
          <Divider />
          <NavLink href="/alerts" label="Alerts" />
          <Divider />
          <NavLink href="/crops" label="Crops" />
          <Divider />
          <NavLink href="/nutrition" label="Nutrition" />
          <Divider />
          <NavLink href="/forecasting" label="Forecast" />
          <Divider />

          {/* Admin Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                className="p-0"
                render={<Link href="/admin/simulation" className="flex w-full items-center gap-2 px-2 py-1.5" />}
              >
                Simulation
              </DropdownMenuItem>
              <DropdownMenuItem
                className="p-0"
                render={<Link href="/admin/scenarios" className="flex w-full items-center gap-2 px-2 py-1.5" />}
              >
                Scenarios
              </DropdownMenuItem>
              <DropdownMenuItem
                className="p-0"
                render={<Link href="/admin/agent-config" className="flex w-full items-center gap-2 px-2 py-1.5" />}
              >
                Agent Config
              </DropdownMenuItem>
              <DropdownMenuItem
                className="p-0"
                render={<Link href="/admin/analytics" className="flex w-full items-center gap-2 px-2 py-1.5" />}
              >
                Analytics
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Quick Status — resource bars + clickable badge */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1 w-16">
              <span className="text-[10px] uppercase text-muted-foreground leading-none">Water</span>
              <Progress value={resources.waterReservePercent} className="h-1.5" />
            </div>
            <div className="flex flex-col gap-1 w-16">
              <span className="text-[10px] uppercase text-muted-foreground leading-none">Nutri</span>
              <Progress value={resources.nutrientReservePercent} className="h-1.5" />
            </div>
            <div className="flex flex-col gap-1 w-16">
              <span className="text-[10px] uppercase text-muted-foreground leading-none">Energy</span>
              <Progress value={resources.energyReservePercent} className="h-1.5" />
            </div>
          </div>

          <StatusPopover
            alerts={alerts.filter((a) => a.status === "OPEN")}
            recommendations={recommendations.filter((r) => r.status === "PENDING")}
            totalIssues={totalIssues}
          />
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

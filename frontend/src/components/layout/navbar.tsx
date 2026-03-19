"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Sprout,
  Bot,
  AlertTriangle,
  Wheat,
  Apple,
  TrendingUp,
  Settings,
  FlaskConical,
  Zap,
  SlidersHorizontal,
  BarChart3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NavLink } from "./nav-link";
import { SimControls } from "./sim-controls";
import { useSimulation } from "@/providers/simulation-provider";

export function Navbar() {
  const { state } = useSimulation();
  const { resources, alerts } = state;
  const openAlertCount = alerts.filter((a) => a.status === "OPEN").length;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-full items-center gap-1 px-4">
        {/* Logo + Mission */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-4">
          <Sprout className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline text-sm font-medium tracking-tight">
            GREENHOUSE
          </span>
        </Link>

        {/* Main Nav */}
        <div className="flex items-center gap-0.5">
          <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavLink href="/greenhouse" icon={Sprout} label="Greenhouse" />
          <NavLink href="/agent" icon={Bot} label="Agent" />
          <NavLink href="/alerts" icon={AlertTriangle} label="Alerts" />
          <NavLink href="/crops" icon={Wheat} label="Crops" />
          <NavLink href="/nutrition" icon={Apple} label="Nutrition" />
          <NavLink href="/forecasting" icon={TrendingUp} label="Forecast" />

          {/* Admin Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Settings className="h-4 w-4" />
              <span className="hidden lg:inline">Admin</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                className="p-0"
                render={<Link href="/admin/simulation" className="flex w-full items-center gap-2 px-2 py-1.5" />}
              >
                <FlaskConical className="h-4 w-4" />
                Simulation
              </DropdownMenuItem>
              <DropdownMenuItem
                className="p-0"
                render={<Link href="/admin/scenarios" className="flex w-full items-center gap-2 px-2 py-1.5" />}
              >
                <Zap className="h-4 w-4" />
                Scenarios
              </DropdownMenuItem>
              <DropdownMenuItem
                className="p-0"
                render={<Link href="/admin/agent-config" className="flex w-full items-center gap-2 px-2 py-1.5" />}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Agent Config
              </DropdownMenuItem>
              <DropdownMenuItem
                className="p-0"
                render={<Link href="/admin/analytics" className="flex w-full items-center gap-2 px-2 py-1.5" />}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sim Controls */}
        <SimControls />

        {/* Quick Status */}
        <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l border-border">
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
          {openAlertCount > 0 && (
            <Badge variant="destructive" className="text-xs tabular-nums">
              {openAlertCount}
            </Badge>
          )}
        </div>
      </div>
    </nav>
  );
}

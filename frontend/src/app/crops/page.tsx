"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Thermometer, Sprout, Droplets, Sun, CalendarDays } from "lucide-react";
import { mockCrops, mockPlantingQueue, mockHarvestJournal, mockStockpile } from "@/lib/mock-data";
import { useSimulation } from "@/providers/simulation-provider";
import type { Crop, CropCategory, WaterRequirement, PlantingQueueItem, HarvestEntry, StockpileItem } from "@/lib/types";

// === Helpers ===

function getCategoryColor(category: CropCategory): string {
  switch (category) {
    case "VEGETABLE": return "#4ead6b";
    case "LEGUME": return "#d4924a";
    case "GRAIN": return "#d4aa30";
    case "HERB": return "#7c6aad";
  }
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const MISSION_ROLES: Record<string, { role: string; desc: string }> = {
  Lettuce: { role: "Micronutrient Stabilizer", desc: "Fast-cycle leafy green, rich in Vitamin K and A. Low caloric density but essential for micronutrient coverage and dietary diversity." },
  Tomato: { role: "Dietary Diversity", desc: "Moderate cycle, good potassium and vitamin C source. High yield per m² makes it efficient for supplementing diet variety." },
  Potato: { role: "Energy Backbone", desc: "Primary caloric security crop with high yield per m². Relatively stable storage potential. The energy foundation of the mission diet." },
  Spinach: { role: "Micronutrient Density", desc: "Exceptional folate, iron, and vitamin K content. Short cycle allows rapid nutritional correction when deficits are detected." },
  Soybean: { role: "Protein Security", desc: "Primary plant-based protein source for the crew. Moderate cycle with nitrogen fixation capability. Critical for muscle mass preservation." },
  Wheat: { role: "Caloric Reserve", desc: "High calorie density grain for long-term energy storage. Longest growth cycle but highest caloric return per harvest." },
  Radish: { role: "Fast Buffer", desc: "Very short cycle system feedback and variety crop. Used as rapid response crop when system stability needs verification." },
  Basil: { role: "Crew Morale", desc: "Psychological well-being enhancer. Minimal caloric contribution but improves palatability and supports crew satisfaction." },
};

type TabValue = "catalog" | "queue" | "journal" | "stockpile";

// === Crop Row (expandable) ===

function CropRow({ crop, isFirst }: { crop: Crop; isFirst: boolean }) {
  const [open, setOpen] = useState(false);
  const { name, category, growthDays, waterRequirement, typicalYieldPerM2Kg, nutritionalProfile, environmentalRequirements } = crop;
  const role = MISSION_ROLES[name];
  const catColor = getCategoryColor(category);

  return (
    <div
      className={`border-x border-b border-border overflow-hidden transition-colors ${isFirst ? "border-t rounded-t-lg" : ""} ${open ? "bg-card" : "hover:bg-secondary"}`}
      style={{ borderLeftColor: open ? catColor : undefined, borderLeftWidth: open ? "2px" : undefined }}
    >
      {/* Collapsed summary */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full grid items-center px-4 py-3.5 text-left transition-colors"
        style={{ gridTemplateColumns: "minmax(120px, 1fr) 90px 100px 90px 90px 80px 80px 24px" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: catColor }} />
          <span className="text-base font-medium truncate">{name}</span>
          {role && <span className="text-xs text-muted-foreground truncate hidden lg:inline">{role.role}</span>}
        </div>
        <span className="text-sm text-muted-foreground">{category}</span>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="font-mono tabular-nums">{growthDays}</span>
          <span>days</span>
        </div>
        <span className="text-sm text-muted-foreground">{waterRequirement}</span>
        <span className="text-sm text-muted-foreground font-mono tabular-nums">{typicalYieldPerM2Kg} kg/m²</span>
        <span className="text-sm font-mono tabular-nums">{nutritionalProfile.caloriesPer100g} kcal</span>
        <span className="text-sm font-mono tabular-nums">{nutritionalProfile.proteinG}g</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-5 pb-6 pt-3 border-t border-border animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Mission role + description */}
            <div className="lg:col-span-4 space-y-4">
              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Mission Role</span>
                <p className="mt-1.5 text-primary font-medium">{role?.role}</p>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{role?.desc}</p>
              </div>

              {/* Stress sensitivities */}
              {crop.stressSensitivities.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Sensitivities</span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {crop.stressSensitivities.map((s) => (
                      <span key={s} className="inline-flex items-center rounded border border-destructive/20 bg-destructive/5 px-2.5 py-1 text-xs text-destructive">
                        {s.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Center: Nutritional profile */}
            <div className="lg:col-span-4">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Nutrition per 100g</span>
              <div className="mt-3 space-y-3">
                {[
                  { label: "Calories", value: nutritionalProfile.caloriesPer100g, unit: "kcal", max: 350, color: "#d4924a" },
                  { label: "Protein", value: nutritionalProfile.proteinG, unit: "g", max: 40, color: "#3d8ab0" },
                  { label: "Carbs", value: nutritionalProfile.carbsG, unit: "g", max: 75, color: "#d4aa30" },
                  { label: "Fat", value: nutritionalProfile.fatG, unit: "g", max: 20, color: "#9c9488" },
                  { label: "Fiber", value: nutritionalProfile.fiberG, unit: "g", max: 12, color: "#4ead6b" },
                ].map((n) => (
                  <div key={n.label} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">{n.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((n.value / n.max) * 100, 100)}%`, backgroundColor: n.color }}
                      />
                    </div>
                    <span className="font-mono text-xs tabular-nums w-16 text-right">
                      {n.value} {n.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Environmental requirements */}
            <div className="lg:col-span-4">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Environment</span>
              <div className="mt-3 space-y-3">
                {[
                  { icon: <Thermometer className="w-4 h-4" />, label: "Temperature", value: `${environmentalRequirements.optimalTempMinC}–${environmentalRequirements.optimalTempMaxC}°C`, sub: `stress >${environmentalRequirements.heatStressThresholdC}°C` },
                  { icon: <Sun className="w-4 h-4" />, label: "Light (PAR)", value: `${environmentalRequirements.lightRequirementParMin}–${environmentalRequirements.lightRequirementParMax}`, sub: "µmol/m²/s" },
                  { icon: <Droplets className="w-4 h-4" />, label: "Humidity", value: `${environmentalRequirements.optimalHumidityMinPct}–${environmentalRequirements.optimalHumidityMaxPct}%`, sub: "" },
                  { icon: <Sprout className="w-4 h-4" />, label: "pH Range", value: `${environmentalRequirements.optimalPhMin}–${environmentalRequirements.optimalPhMax}`, sub: "" },
                ].map((env) => (
                  <div key={env.label} className="flex items-center gap-3">
                    <div className="text-muted-foreground shrink-0">{env.icon}</div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground">{env.label}</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-sm tabular-nums">{env.value}</span>
                        {env.sub && <span className="text-xs text-muted-foreground">{env.sub}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// === Column header for catalog ===

function CatalogHeader() {
  return (
    <div
      className="grid items-center px-4 py-2.5 text-xs uppercase tracking-wide text-muted-foreground"
      style={{ gridTemplateColumns: "minmax(120px, 1fr) 90px 100px 90px 90px 80px 80px 24px" }}
    >
      <span>Crop</span>
      <span>Type</span>
      <span>Cycle</span>
      <span>Water</span>
      <span>Yield</span>
      <span>Cal/100g</span>
      <span>Protein</span>
      <span />
    </div>
  );
}

// === Other tab components ===

function PlantingQueueList({ items }: { items: PlantingQueueItem[] }) {
  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div key={item.rank} className="flex items-center gap-4 border border-border rounded-lg px-4 py-3.5 hover:bg-secondary transition-colors">
          <span className="font-mono text-lg font-bold text-primary w-8 shrink-0">#{item.rank}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{item.cropName}</span>
              <Badge variant="outline" className="font-mono text-xs">SOL {item.missionDay}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{item.reason}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {item.nutritionalGapsAddressed.map((gap) => (
              <span key={gap} className="inline-flex items-center rounded border border-[#4ead6b]/30 bg-[#4ead6b]/10 px-2.5 py-0.5 text-xs text-[#4ead6b]">
                {gap}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function HarvestJournalTable({ entries }: { entries: HarvestEntry[] }) {
  return (
    <div className="space-y-1">
      <div
        className="grid items-center px-4 py-2.5 text-xs uppercase tracking-wide text-muted-foreground"
        style={{ gridTemplateColumns: "100px 70px 1fr 90px 100px 1fr" }}
      >
        <span>Date</span>
        <span>SOL</span>
        <span>Crop</span>
        <span>Yield</span>
        <span>Location</span>
        <span>Notes</span>
      </div>
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="grid items-center px-4 py-3 border border-border rounded-lg hover:bg-secondary transition-colors"
          style={{ gridTemplateColumns: "100px 70px 1fr 90px 100px 1fr" }}
        >
          <span className="text-sm text-muted-foreground">{formatDate(entry.harvestedAt)}</span>
          <span className="font-mono tabular-nums text-sm text-primary">{entry.missionDay}</span>
          <span className="font-medium">{entry.cropName}</span>
          <span className="font-mono tabular-nums text-sm text-[#4ead6b]">{entry.yieldKg} kg</span>
          <span className="text-sm text-muted-foreground">{entry.greenhouseId === "a1000000-0000-0000-0000-000000000001" ? "Alpha" : "Beta"}</span>
          <span className="text-sm text-muted-foreground italic truncate">{entry.notes || "—"}</span>
        </div>
      ))}
    </div>
  );
}

function StockpileList({ items }: { items: StockpileItem[] }) {
  const totalCalories = items.reduce((sum, item) => sum + item.estimatedCalories, 0);
  const totalDays = items.reduce((sum, item) => sum + item.daysOfSupply, 0);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {items.map((item) => {
          const isExpiringSoon = item.expiresInDays !== null && item.expiresInDays < 7;
          return (
            <div key={item.cropId} className={`flex items-center justify-between border rounded-lg px-4 py-3.5 hover:bg-secondary transition-colors ${isExpiringSoon ? "border-destructive/40" : "border-border"}`}>
              <div className="flex items-center gap-4">
                <span className="font-medium w-24">{item.cropName}</span>
                <span className="font-mono text-lg tabular-nums text-primary">{item.quantityKg} <span className="text-sm text-muted-foreground">kg</span></span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="font-mono tabular-nums">{item.estimatedCalories.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground ml-1">kcal</span>
                </div>
                <div className="text-right">
                  <span className="font-mono tabular-nums">{item.daysOfSupply.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground ml-1">days</span>
                </div>
                {item.expiresInDays !== null && (
                  <div className={`text-right ${isExpiringSoon ? "text-destructive" : ""}`}>
                    <span className="font-mono tabular-nums">{item.expiresInDays}d</span>
                    {isExpiringSoon && (
                      <span className="ml-1.5 relative inline-flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Card className="bg-primary/10 border-primary/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-primary/70 uppercase font-semibold tracking-wide">Total Stockpile</div>
            <div className="text-xl font-bold font-mono tabular-nums text-primary mt-0.5">
              {totalCalories.toLocaleString()} <span className="text-sm text-primary/70">kcal</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-primary/70 uppercase font-semibold tracking-wide">Days Supply</div>
            <div className="text-xl font-bold font-mono tabular-nums text-primary mt-0.5">
              {totalDays.toFixed(1)} <span className="text-sm text-primary/70">days</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// === Main Page ===

const TABS: { value: TabValue; label: string }[] = [
  { value: "catalog", label: "Catalog" },
  { value: "queue", label: "Planting Queue" },
  { value: "journal", label: "Harvest Journal" },
  { value: "stockpile", label: "Stockpile" },
];

export default function CropsPage() {
  const { state } = useSimulation();
  const [activeTab, setActiveTab] = useState<TabValue>("catalog");

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Crop Management</h1>

      {/* Tab buttons */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-lg border px-4 py-1.5 text-sm transition-all duration-150 ${
              activeTab === tab.value
                ? "border-primary bg-primary/20 text-primary font-medium"
                : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "catalog" && (
        <div>
          <CatalogHeader />
          {mockCrops.map((crop, i) => (
            <CropRow key={crop.id} crop={crop} isFirst={i === 0} />
          ))}
          <div className="border-b border-border rounded-b-lg" />
        </div>
      )}

      {activeTab === "queue" && (
        <PlantingQueueList items={mockPlantingQueue} />
      )}

      {activeTab === "journal" && (
        <HarvestJournalTable entries={mockHarvestJournal} />
      )}

      {activeTab === "stockpile" && (
        <StockpileList items={mockStockpile} />
      )}
    </div>
  );
}

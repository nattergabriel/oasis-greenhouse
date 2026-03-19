"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Thermometer, Sprout, Droplets, Sun, Leaf, Flower2 } from "lucide-react";
import { mockCrops, mockPlantingQueue, mockHarvestJournal, mockStockpile, mockStoredFood, mockGreenhouseDetails } from "@/lib/mock-data";
import { useSimulation } from "@/providers/simulation-provider";
import type { Crop, CropCategory, PlantingQueueItem, HarvestEntry, StockpileItem, PlantSlot } from "@/lib/types";

// === Helpers ===

function getCategoryColor(category: CropCategory): string {
  switch (category) {
    case "VEGETABLE": return "#4ead6b";
    case "LEGUME": return "#d4924a";
    case "HERB": return "#7c6aad";
  }
}

function getCropColor(name: string): string {
  if (name === "Lettuce") return "#4ead6b";
  if (name === "Potato") return "#d4aa30";
  if (name === "Radish") return "#c75a6a";
  if (name === "Beans & Peas") return "#8a9a44";
  if (name === "Herbs") return "#7c6aad";
  return "#9c9488";
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const MISSION_ROLES: Record<string, { role: string; desc: string }> = {
  Lettuce: { role: "Micronutrient Stabilizer", desc: "Fast-cycle leafy green, rich in Vitamin A, K, and folate. Essential for micronutrient coverage. 30-day growth cycle allows rapid nutritional correction." },
  Potato: { role: "Energy Backbone", desc: "Primary caloric security crop. High yield per m\u00b2 with 77 kcal/100g. The energy foundation of the mission diet, providing consistent caloric output across 90-day cycles." },
  Radish: { role: "Fast Buffer", desc: "Shortest growth cycle (25 days). Primary vitamin C source. Used as rapid-response crop when system stability needs verification or nutrient gaps emerge." },
  "Beans & Peas": { role: "Protein Security", desc: "Primary plant-based protein source at 7g/100g. Also provides iron, folate, potassium, and magnesium. Nitrogen-fixing capability supports soil ecosystem." },
  Herbs: { role: "Crew Morale", desc: "Psychological well-being enhancer. Provides vitamins A, C, and K. Minimal caloric contribution but improves palatability and supports crew satisfaction over 450 sols." },
};

type TabValue = "catalog" | "queue" | "journal" | "stockpile";

// === Crop icon per type ===

function CropIcon({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  const color = getCropColor(name);
  const cls = size === "lg" ? "w-8 h-8" : "w-5 h-5";
  switch (name) {
    case "Lettuce": return <Leaf className={cls} style={{ color }} />;
    case "Herbs": return <Flower2 className={cls} style={{ color }} />;
    case "Beans & Peas": return <Sprout className={cls} style={{ color }} />;
    default: return <Leaf className={cls} style={{ color }} />;
  }
}

function getGrowthColor(percent: number): string {
  if (percent >= 85) return "#4ead6b";
  if (percent >= 67) return "#4a7c9e";
  if (percent >= 34) return "#d4aa30";
  return "#c75a3a";
}

// === Crop Card ===

function CropCard({ crop, isExpanded, onToggle }: { crop: Crop; isExpanded: boolean; onToggle: () => void }) {
  const { name, category, nutritionalProfile } = crop;
  const catColor = getCategoryColor(category);
  const cropColor = getCropColor(name);

  return (
    <Card
      className={`overflow-hidden cursor-pointer transition-all duration-200 ${
        isExpanded ? "ring-1 ring-primary/40" : "hover:bg-secondary"
      }`}
      onClick={onToggle}
    >
      {/* Main row: [Icon area 1/3] [Text area 2/3] */}
      <div className="flex">
        {/* Large icon panel — 1/3 width */}
        <div
          className="w-1/3 shrink-0 flex items-center justify-center min-h-[80px]"
          style={{ backgroundColor: cropColor + "14" }}
        >
          <CropIcon name={name} size="lg" />
        </div>
        {/* Text + category + chevron — 2/3 width */}
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span
                className="inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-medium"
                style={{ borderColor: catColor + "60", color: catColor }}
              >
                {name}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{category}</span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom stats row: protein / carbs / fat */}
      <div className="border-t border-border grid grid-cols-3">
        {[
          { label: "Protein", value: `${nutritionalProfile.proteinG}g` },
          { label: "Carbs", value: `${nutritionalProfile.carbsG}g` },
          { label: "Fat", value: `${nutritionalProfile.fatG}g` },
        ].map((stat, i) => (
          <div key={stat.label} className={`text-center px-2 py-2.5 ${i === 1 ? "border-x border-border" : ""}`}>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</div>
            <div className="font-mono text-sm tabular-nums mt-0.5">{stat.value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// === Expansion Detail (full-width panel below card row) ===

function ExpansionDetail({ crop }: { crop: Crop }) {
  const role = MISSION_ROLES[crop.name];
  const { nutritionalProfile, environmentalRequirements, typicalYieldPerM2Kg, waterRequirement, growthDays } = crop;
  const catColor = getCategoryColor(crop.category);

  return (
    <Card className="overflow-hidden" style={{ borderTopWidth: "2px", borderTopColor: catColor }}>
      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Mission role + stats + sensitivities */}
        <div className="space-y-4">
          {role && (
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Mission Role</span>
              <p className="mt-1 text-primary font-medium">{role.role}</p>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{role.desc}</p>
            </div>
          )}
          <div className="flex gap-2">
            {[
              { label: "Cycle", value: `${growthDays}d` },
              { label: "Yield", value: `${typicalYieldPerM2Kg} kg/m\u00b2` },
              { label: "Water", value: waterRequirement },
            ].map((s) => (
              <div key={s.label} className="border border-border rounded-lg px-3 py-1.5 text-center flex-1">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
                <div className="font-mono text-xs tabular-nums mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>
          {crop.stressSensitivities.length > 0 && (
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Sensitivities</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {crop.stressSensitivities.map((s) => (
                  <span key={s} className="inline-flex items-center rounded border border-destructive/20 bg-destructive/5 px-2 py-0.5 text-xs text-destructive">
                    {s.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center: Nutrition bars */}
        <div>
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
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((n.value / n.max) * 100, 100)}%`, backgroundColor: n.color }} />
                </div>
                <span className="font-mono text-xs tabular-nums w-16 text-right">{n.value} {n.unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Environment */}
        <div>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Environment</span>
          <div className="mt-3 space-y-3">
            {[
              { icon: <Thermometer className="w-4 h-4" />, label: "Temperature", value: `${environmentalRequirements.optimalTempMinC}\u2013${environmentalRequirements.optimalTempMaxC}\u00b0C`, sub: `stress >${environmentalRequirements.heatStressThresholdC}\u00b0C` },
              { icon: <Sun className="w-4 h-4" />, label: "Light (PAR)", value: `${environmentalRequirements.lightRequirementParMin}\u2013${environmentalRequirements.lightRequirementParMax}`, sub: "\u00b5mol/m\u00b2/s" },
              { icon: <Droplets className="w-4 h-4" />, label: "Humidity", value: `${environmentalRequirements.optimalHumidityMinPct}\u2013${environmentalRequirements.optimalHumidityMaxPct}%`, sub: "" },
              { icon: <Sprout className="w-4 h-4" />, label: "pH Range", value: `${environmentalRequirements.optimalPhMin}\u2013${environmentalRequirements.optimalPhMax}`, sub: "" },
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
    </Card>
  );
}

// === Catalog View (row grouping + full-width expansion) ===

function CatalogView() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rowDisplay, setRowDisplay] = useState<Record<number, string>>({});

  // Group into rows of 3
  const rows: Crop[][] = [];
  for (let i = 0; i < mockCrops.length; i += 3) {
    rows.push(mockCrops.slice(i, i + 3));
  }

  function handleToggle(cropId: string, rowIdx: number) {
    if (expandedId === cropId) {
      setExpandedId(null);
    } else {
      setExpandedId(cropId);
      setRowDisplay((prev) => ({ ...prev, [rowIdx]: cropId }));
    }
  }

  return (
    <div className="space-y-3">
      {rows.map((rowCrops, rowIdx) => {
        const isRowExpanded = rowCrops.some((c) => c.id === expandedId);
        const displayCropId = rowDisplay[rowIdx];
        const displayCrop = displayCropId ? mockCrops.find((c) => c.id === displayCropId) : null;

        return (
          <div key={rowIdx}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rowCrops.map((crop) => (
                <CropCard
                  key={crop.id}
                  crop={crop}
                  isExpanded={crop.id === expandedId}
                  onToggle={() => handleToggle(crop.id, rowIdx)}
                />
              ))}
            </div>
            {/* Full-width expansion panel below row */}
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: isRowExpanded ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                {displayCrop && (
                  <div
                    className="pt-3"
                    style={{
                      animation: isRowExpanded ? "catalogExpand 300ms ease-out" : "none",
                    }}
                  >
                    <ExpansionDetail crop={displayCrop} />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Balloon animation keyframe */}
      <style>{`
        @keyframes catalogExpand {
          from {
            opacity: 0;
            transform: scaleY(0.92) scaleX(0.98);
            transform-origin: top center;
          }
          to {
            opacity: 1;
            transform: scaleY(1) scaleX(1);
            transform-origin: top center;
          }
        }
      `}</style>
    </div>
  );
}

// === Planting Queue: Greenhouse Grid ===

function SlotCell({ slot }: { slot: PlantSlot }) {
  const isEmpty = !slot.cropId;
  const isNearHarvest = slot.growthStagePercent >= 85;
  const isStressed = slot.activeStressTypes.length > 0;

  if (isEmpty) {
    return (
      <div className="border border-dashed border-primary/40 rounded-lg p-2 flex items-center justify-center min-h-[56px] bg-primary/5">
        <span className="text-[11px] text-primary/70 font-medium">Available</span>
      </div>
    );
  }

  const cropColor = getCropColor(slot.cropName || "");
  const growthColor = getGrowthColor(slot.growthStagePercent);

  return (
    <div className={`border rounded-lg p-2 min-h-[56px] ${isStressed ? "border-destructive/40" : "border-border"}`}>
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cropColor }} />
        <span className="text-[11px] font-medium truncate">{slot.cropName}</span>
      </div>
      <div className="mt-1.5">
        <div className="h-1 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${slot.growthStagePercent}%`, backgroundColor: growthColor }} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] font-mono tabular-nums text-muted-foreground">{slot.growthStagePercent}%</span>
          {isNearHarvest && <span className="text-[10px] font-medium" style={{ color: growthColor }}>harvest</span>}
          {!isNearHarvest && isStressed && <span className="text-[10px] text-destructive font-medium">stress</span>}
        </div>
      </div>
    </div>
  );
}

function PlantingQueueView({ items, slots }: { items: PlantingQueueItem[]; slots: PlantSlot[] }) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Greenhouse Planting Map</span>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 border border-dashed border-primary/40 rounded-sm bg-primary/5" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#4ead6b]" />
              <span>Near harvest</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span>Stressed</span>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          {[0, 1, 2, 3].map((zone) => (
            <div key={zone} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono w-6 shrink-0 text-right">Z{zone + 1}</span>
              <div className="flex-1 grid grid-cols-4 gap-1.5">
                {slots
                  .filter((s) => s.position.row === zone)
                  .sort((a, b) => a.position.col - b.position.col)
                  .map((slot) => (
                    <SlotCell key={slot.id} slot={slot} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <span className="text-xs uppercase tracking-wide text-muted-foreground ml-1 mb-2 block">Planting Priority</span>
        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item.rank} className="flex items-center gap-4 border border-border rounded-lg px-4 py-3.5 hover:bg-secondary transition-colors">
              <span className="font-mono text-lg font-bold text-primary w-8 shrink-0">#{item.rank}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getCropColor(item.cropName) }} />
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
      </div>
    </div>
  );
}

// === Stockpile View (with headers + legend) ===

function StockpileView({ items }: { items: StockpileItem[] }) {
  const totalCalories = items.reduce((sum, item) => sum + item.estimatedCalories, 0);
  const totalDays = items.reduce((sum, item) => sum + item.daysOfSupply, 0);

  return (
    <div className="space-y-3">
      {/* Column headers */}
      <div
        className="grid items-center px-4 py-2.5 text-xs uppercase tracking-wide text-muted-foreground"
        style={{ gridTemplateColumns: "1fr 100px 120px 100px 80px" }}
      >
        <span>Crop</span>
        <span className="text-right">Quantity</span>
        <span className="text-right">Calories</span>
        <span className="text-right">Supply</span>
        <span className="text-right">Expires</span>
      </div>

      {/* Rows */}
      <div className="space-y-1.5">
        {items.map((item) => {
          const isExpiringSoon = item.expiresInDays !== null && item.expiresInDays < 7;
          return (
            <div
              key={item.cropId}
              className={`grid items-center border rounded-lg px-4 py-3.5 hover:bg-secondary transition-colors ${isExpiringSoon ? "border-destructive/40" : "border-border"}`}
              style={{ gridTemplateColumns: "1fr 100px 120px 100px 80px" }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getCropColor(item.cropName) }} />
                <span className="font-medium">{item.cropName}</span>
              </div>
              <span className="text-right font-mono tabular-nums text-primary">{item.quantityKg} <span className="text-sm text-muted-foreground">kg</span></span>
              <span className="text-right font-mono tabular-nums">{item.estimatedCalories.toLocaleString()} <span className="text-sm text-muted-foreground">kcal</span></span>
              <span className="text-right font-mono tabular-nums">{item.daysOfSupply.toFixed(1)} <span className="text-sm text-muted-foreground">days</span></span>
              <div className={`text-right ${isExpiringSoon ? "text-destructive" : "text-muted-foreground"}`}>
                {item.expiresInDays !== null ? (
                  <span className="font-mono tabular-nums">
                    {item.expiresInDays}d
                    {isExpiringSoon && (
                      <span className="ml-1.5 relative inline-flex h-2 w-2 align-middle">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                      </span>
                    )}
                  </span>
                ) : (
                  <span>--</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 px-1 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-4 w-6 border border-destructive/40 rounded" />
          <span>expiring within 7 days</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
          </span>
          <span>requires urgent use</span>
        </div>
      </div>

      {/* Summary cards */}
      <Card className="bg-primary/10 border-primary/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-primary/70 uppercase font-semibold tracking-wide">Harvested Stockpile</div>
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

      <Card className="border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">Mission Reserves (Stored Food)</div>
            <div className="text-xl font-bold font-mono tabular-nums mt-0.5">
              {(mockStoredFood.remainingCalories / 1000000).toFixed(1)}M <span className="text-sm text-muted-foreground">/ {(mockStoredFood.totalCalories / 1000000).toFixed(1)}M kcal</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">Remaining</div>
            <div className="text-xl font-bold font-mono tabular-nums mt-0.5">
              {Math.round(mockStoredFood.remainingCalories / mockStoredFood.totalCalories * 100)}%
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Crew arrived with {(mockStoredFood.totalCalories / 1000000).toFixed(1)}M kcal. Greenhouse supplements stored food -- crew never starves.</p>
      </Card>
    </div>
  );
}

// === Harvest Journal (unchanged) ===

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
          <span className="text-sm text-muted-foreground">Zone {parseInt(entry.slotId.split("-")[1]) + 1}</span>
          <span className="text-sm text-muted-foreground italic truncate">{entry.notes || "--"}</span>
        </div>
      ))}
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

  const ghDetail = state.selectedGreenhouseId ? mockGreenhouseDetails[state.selectedGreenhouseId] : null;
  const slots = ghDetail?.slots || [];

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
      {activeTab === "catalog" && <CatalogView />}

      {activeTab === "queue" && (
        <PlantingQueueView items={mockPlantingQueue} slots={slots} />
      )}

      {activeTab === "journal" && (
        <HarvestJournalTable entries={mockHarvestJournal} />
      )}

      {activeTab === "stockpile" && (
        <StockpileView items={mockStockpile} />
      )}
    </div>
  );
}

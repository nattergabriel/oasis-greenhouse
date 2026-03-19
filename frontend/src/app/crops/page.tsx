"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Wheat, Sprout, Clock, Scale, Droplets, Thermometer, CalendarDays } from "lucide-react";
import { mockCrops, mockPlantingQueue, mockHarvestJournal, mockStockpile } from "@/lib/mock-data";
import type { Crop, CropCategory, WaterRequirement, PlantingQueueItem, HarvestEntry, StockpileItem } from "@/lib/types";

// === Helpers ===

function getCategoryColor(category: CropCategory): string {
  switch (category) {
    case "VEGETABLE": return "bg-green-500/20 text-green-300 border-green-500/30";
    case "LEGUME": return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "GRAIN": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    case "HERB": return "bg-purple-500/20 text-purple-300 border-purple-500/30";
  }
}

function getWaterColor(requirement: WaterRequirement): string {
  switch (requirement) {
    case "LOW": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "MEDIUM": return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
    case "HIGH": return "bg-sky-500/20 text-sky-300 border-sky-500/30";
  }
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// === Components ===

function CropCatalogCard({ crop }: { crop: Crop }) {
  const { name, category, growthDays, waterRequirement, typicalYieldPerM2Kg, nutritionalProfile, environmentalRequirements } = crop;
  const { caloriesPer100g, proteinG, carbsG, fatG } = nutritionalProfile;
  const { optimalTempMinC, optimalTempMaxC, optimalPhMin, optimalPhMax, lightRequirementParMin, lightRequirementParMax } = environmentalRequirements;

  return (
    <Card className="bg-zinc-900/60 border-zinc-800 p-4 hover:border-amber-500/30 transition-colors">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-zinc-100">{name}</h3>
          <Badge className={`${getCategoryColor(category)} border font-mono text-xs`}>
            {category}
          </Badge>
        </div>

        {/* Key Stats Row */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{growthDays}d</span>
          </div>
          <Badge className={`${getWaterColor(waterRequirement)} border text-xs`}>
            {waterRequirement}
          </Badge>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Scale className="w-4 h-4" />
            <span className="font-mono">{typicalYieldPerM2Kg}kg/m²</span>
          </div>
        </div>

        {/* Nutritional Summary */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="bg-zinc-950/50 rounded px-2 py-1.5 border border-zinc-800">
            <div className="text-zinc-500 text-[10px] uppercase">Cal</div>
            <div className="font-mono text-zinc-300">{caloriesPer100g}</div>
          </div>
          <div className="bg-zinc-950/50 rounded px-2 py-1.5 border border-zinc-800">
            <div className="text-zinc-500 text-[10px] uppercase">Protein</div>
            <div className="font-mono text-zinc-300">{proteinG}g</div>
          </div>
          <div className="bg-zinc-950/50 rounded px-2 py-1.5 border border-zinc-800">
            <div className="text-zinc-500 text-[10px] uppercase">Carbs</div>
            <div className="font-mono text-zinc-300">{carbsG}g</div>
          </div>
          <div className="bg-zinc-950/50 rounded px-2 py-1.5 border border-zinc-800">
            <div className="text-zinc-500 text-[10px] uppercase">Fat</div>
            <div className="font-mono text-zinc-300">{fatG}g</div>
          </div>
        </div>

        {/* Environmental Ranges */}
        <div className="space-y-1 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Thermometer className="w-3.5 h-3.5" />
            <span className="font-mono">{optimalTempMinC}–{optimalTempMaxC}°C</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-3.5 text-center">pH</span>
            <span className="font-mono">{optimalPhMin}–{optimalPhMax}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sprout className="w-3.5 h-3.5" />
            <span className="font-mono">{lightRequirementParMin}–{lightRequirementParMax} µmol/m²/s</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PlantingQueueList({ items }: { items: PlantingQueueItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.rank} className="bg-zinc-900/60 border-zinc-800 p-4 hover:border-amber-500/30 transition-colors">
          <div className="flex gap-4">
            {/* Rank Badge */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center">
                <span className="text-xl font-bold text-amber-300 font-mono">#{item.rank}</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-zinc-100">{item.cropName}</h3>
                <div className="flex items-center gap-2">
                  <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 font-mono text-xs">
                    SOL {item.missionDay}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <CalendarDays className="w-4 h-4" />
                <span>{formatDate(item.recommendedPlantDate)}</span>
              </div>

              <p className="text-sm text-zinc-300">{item.reason}</p>

              {item.nutritionalGapsAddressed.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.nutritionalGapsAddressed.map((gap) => (
                    <Badge key={gap} className="bg-green-500/20 text-green-300 border-green-500/30 border text-xs">
                      {gap}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function HarvestJournalTable({ entries }: { entries: HarvestEntry[] }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[120px,80px,1fr,100px,120px,1fr] gap-4 px-4 py-2 bg-zinc-900/40 border border-zinc-800 rounded text-xs uppercase text-zinc-500 font-semibold">
        <div>Date</div>
        <div>SOL</div>
        <div>Crop</div>
        <div>Yield (kg)</div>
        <div>Greenhouse</div>
        <div>Notes</div>
      </div>

      {/* Rows */}
      {entries.map((entry) => (
        <Card key={entry.id} className="bg-zinc-900/60 border-zinc-800">
          <div className="grid grid-cols-[120px,80px,1fr,100px,120px,1fr] gap-4 px-4 py-3 text-sm items-center">
            <div className="text-zinc-300">{formatDate(entry.harvestedAt)}</div>
            <div className="font-mono tabular-nums text-amber-300">{entry.missionDay}</div>
            <div className="text-zinc-100 font-medium">{entry.cropName}</div>
            <div className="font-mono tabular-nums text-green-300">{entry.yieldKg}</div>
            <div className="text-zinc-400 text-xs">{entry.greenhouseId === "a1000000-0000-0000-0000-000000000001" ? "Alpha" : "Beta"}</div>
            <div className="text-zinc-500 text-xs italic">{entry.notes || "—"}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function StockpileList({ items }: { items: StockpileItem[] }) {
  const totalCalories = items.reduce((sum, item) => sum + item.estimatedCalories, 0);
  const totalDays = items.reduce((sum, item) => sum + item.daysOfSupply, 0);

  return (
    <div className="space-y-4">
      {/* Items */}
      <div className="space-y-2">
        {items.map((item) => {
          const isExpiringSoon = item.expiresInDays !== null && item.expiresInDays < 7;

          return (
            <Card key={item.cropId} className={`bg-zinc-900/60 border-zinc-800 p-4 ${isExpiringSoon ? "border-red-500/40" : ""} hover:border-amber-500/30 transition-colors`}>
              <div className="flex items-center justify-between">
                {/* Crop Name & Quantity */}
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-100">{item.cropName}</h3>
                    <div className="text-3xl font-bold font-mono tabular-nums text-amber-300 mt-1">
                      {item.quantityKg} <span className="text-lg text-zinc-500">kg</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <div className="text-xs text-zinc-500 uppercase">Calories</div>
                    <div className="font-mono tabular-nums text-zinc-300 text-lg">{item.estimatedCalories.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase">Days Supply</div>
                    <div className="font-mono tabular-nums text-zinc-300 text-lg">{item.daysOfSupply.toFixed(1)}</div>
                  </div>
                  {item.expiresInDays !== null && (
                    <div>
                      <div className="text-xs text-zinc-500 uppercase">Expires In</div>
                      <div className={`font-mono tabular-nums text-lg ${isExpiringSoon ? "text-red-400" : "text-zinc-300"}`}>
                        {item.expiresInDays}d
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isExpiringSoon && (
                <div className="mt-3 pt-3 border-t border-red-500/20">
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span>Expiring soon — prioritize consumption</span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="bg-amber-950/30 border-amber-500/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-amber-200/70 uppercase font-semibold">Total Stockpile</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-300 mt-1">
              {totalCalories.toLocaleString()} <span className="text-base text-amber-400/70">kcal</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-amber-200/70 uppercase font-semibold">Total Days Supply</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-300 mt-1">
              {totalDays.toFixed(1)} <span className="text-base text-amber-400/70">days</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// === Main Page ===

export default function CropsPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Wheat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">Crop Management</h1>
            <p className="text-sm text-zinc-500">Catalog, planning, harvest records, and inventory</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="catalog" className="space-y-4">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="catalog" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
              Catalog
            </TabsTrigger>
            <TabsTrigger value="queue" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
              Planting Queue
            </TabsTrigger>
            <TabsTrigger value="journal" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
              Harvest Journal
            </TabsTrigger>
            <TabsTrigger value="stockpile" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
              Stockpile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockCrops.map((crop) => (
                <CropCatalogCard key={crop.id} crop={crop} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="queue" className="space-y-4">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-zinc-400">
                AI-recommended planting order based on nutritional gaps, resource availability, and mission timeline.
              </p>
            </div>
            <PlantingQueueList items={mockPlantingQueue} />
          </TabsContent>

          <TabsContent value="journal" className="space-y-4">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-zinc-400">
                Historical record of all harvests with yield metrics and quality notes.
              </p>
            </div>
            <HarvestJournalTable entries={mockHarvestJournal} />
          </TabsContent>

          <TabsContent value="stockpile" className="space-y-4">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-zinc-400">
                Current food inventory with caloric value, supply duration, and expiration tracking.
              </p>
            </div>
            <StockpileList items={mockStockpile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

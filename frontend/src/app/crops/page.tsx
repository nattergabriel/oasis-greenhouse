"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Wheat, Sprout, Clock, Scale, Droplets, Thermometer, CalendarDays } from "lucide-react";
import { mockCrops, mockPlantingQueue, mockHarvestJournal, mockStockpile } from "@/lib/mock-data";
import { useSimulation } from "@/providers/simulation-provider";
import type { Crop, CropCategory, WaterRequirement, PlantingQueueItem, HarvestEntry, StockpileItem } from "@/lib/types";

// === Helpers ===

function getCategoryColor(category: CropCategory): string {
  switch (category) {
    case "VEGETABLE": return "bg-[#5a9a6b]/20 text-[#5a9a6b] border-[#5a9a6b]/30";
    case "LEGUME": return "bg-[#d4924a]/20 text-[#d4924a] border-[#d4924a]/30";
    case "GRAIN": return "bg-[#c4a344]/20 text-[#c4a344] border-[#c4a344]/30";
    case "HERB": return "bg-[#7c6aad]/20 text-[#7c6aad] border-[#7c6aad]/30";
  }
}

function getWaterColor(requirement: WaterRequirement): string {
  switch (requirement) {
    case "LOW": return "bg-[#4a7c9e]/20 text-[#4a7c9e] border-[#4a7c9e]/30";
    case "MEDIUM": return "bg-[#4a7c9e]/30 text-[#4a7c9e] border-[#4a7c9e]/40";
    case "HIGH": return "bg-[#4a7c9e]/40 text-[#4a7c9e] border-[#4a7c9e]/50";
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
    <Card className="p-4 hover:border-primary/30 transition-colors">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">{name}</h3>
          <Badge className={`${getCategoryColor(category)} border font-mono text-xs`}>
            {category}
          </Badge>
        </div>

        {/* Key Stats Row */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{growthDays}d</span>
          </div>
          <Badge className={`${getWaterColor(waterRequirement)} border text-xs`}>
            {waterRequirement}
          </Badge>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Scale className="w-4 h-4" />
            <span className="font-mono">{typicalYieldPerM2Kg}kg/m²</span>
          </div>
        </div>

        {/* Nutritional Summary */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="bg-background/50 rounded px-2 py-1.5 border border-border">
            <div className="text-muted-foreground text-[10px] uppercase">Cal</div>
            <div className="font-mono">{caloriesPer100g}</div>
          </div>
          <div className="bg-background/50 rounded px-2 py-1.5 border border-border">
            <div className="text-muted-foreground text-[10px] uppercase">Protein</div>
            <div className="font-mono">{proteinG}g</div>
          </div>
          <div className="bg-background/50 rounded px-2 py-1.5 border border-border">
            <div className="text-muted-foreground text-[10px] uppercase">Carbs</div>
            <div className="font-mono">{carbsG}g</div>
          </div>
          <div className="bg-background/50 rounded px-2 py-1.5 border border-border">
            <div className="text-muted-foreground text-[10px] uppercase">Fat</div>
            <div className="font-mono">{fatG}g</div>
          </div>
        </div>

        {/* Environmental Ranges */}
        <div className="space-y-1 text-xs text-muted-foreground">
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
        <Card key={item.rank} className="p-4 hover:border-primary/30 transition-colors">
          <div className="flex gap-4">
            {/* Rank Badge */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center">
                <span className="text-xl font-bold text-primary font-mono">#{item.rank}</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold">{item.cropName}</h3>
                <Badge variant="outline" className="font-mono text-xs">
                  SOL {item.missionDay}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                <span>{formatDate(item.recommendedPlantDate)}</span>
              </div>

              <p className="text-sm">{item.reason}</p>

              {item.nutritionalGapsAddressed.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.nutritionalGapsAddressed.map((gap) => (
                    <Badge key={gap} className="bg-[#5a9a6b]/20 text-[#5a9a6b] border-[#5a9a6b]/30 border text-xs">
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
      <div className="grid grid-cols-[120px,80px,1fr,100px,120px,1fr] gap-4 px-4 py-2 bg-muted/40 border border-border rounded text-xs uppercase text-muted-foreground font-semibold">
        <div>Date</div>
        <div>SOL</div>
        <div>Crop</div>
        <div>Yield (kg)</div>
        <div>Greenhouse</div>
        <div>Notes</div>
      </div>

      {/* Rows */}
      {entries.map((entry) => (
        <Card key={entry.id}>
          <div className="grid grid-cols-[120px,80px,1fr,100px,120px,1fr] gap-4 px-4 py-3 text-sm items-center">
            <div className="text-muted-foreground">{formatDate(entry.harvestedAt)}</div>
            <div className="font-mono tabular-nums text-primary">{entry.missionDay}</div>
            <div className="font-medium">{entry.cropName}</div>
            <div className="font-mono tabular-nums text-[#5a9a6b]">{entry.yieldKg}</div>
            <div className="text-muted-foreground text-xs">{entry.greenhouseId === "a1000000-0000-0000-0000-000000000001" ? "Alpha" : "Beta"}</div>
            <div className="text-muted-foreground text-xs italic">{entry.notes || "—"}</div>
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
            <Card key={item.cropId} className={`p-4 ${isExpiringSoon ? "border-destructive/40" : ""} hover:border-primary/30 transition-colors`}>
              <div className="flex items-center justify-between">
                {/* Crop Name & Quantity */}
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{item.cropName}</h3>
                    <div className="text-3xl font-bold font-mono tabular-nums text-primary mt-1">
                      {item.quantityKg} <span className="text-lg text-muted-foreground">kg</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">Calories</div>
                    <div className="font-mono tabular-nums text-lg">{item.estimatedCalories.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">Days Supply</div>
                    <div className="font-mono tabular-nums text-lg">{item.daysOfSupply.toFixed(1)}</div>
                  </div>
                  {item.expiresInDays !== null && (
                    <div>
                      <div className="text-xs text-muted-foreground uppercase">Expires In</div>
                      <div className={`font-mono tabular-nums text-lg ${isExpiringSoon ? "text-destructive" : ""}`}>
                        {item.expiresInDays}d
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isExpiringSoon && (
                <div className="mt-3 pt-3 border-t border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                    <span>Expiring soon — prioritize consumption</span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="bg-primary/10 border-primary/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-primary/70 uppercase font-semibold">Total Stockpile</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-primary mt-1">
              {totalCalories.toLocaleString()} <span className="text-base text-primary/70">kcal</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-primary/70 uppercase font-semibold">Total Days Supply</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-primary mt-1">
              {totalDays.toFixed(1)} <span className="text-base text-primary/70">days</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// === Main Page ===

export default function CropsPage() {
  const { state } = useSimulation();

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-medium tracking-tight">Crop Management</h1>
        <Badge variant="outline" className="font-mono text-xs tabular-nums">
          SOL {state.currentMissionDay} / {state.totalMissionDays}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="catalog" className="space-y-4">
        <TabsList>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="queue">Planting Queue</TabsTrigger>
          <TabsTrigger value="journal">Harvest Journal</TabsTrigger>
          <TabsTrigger value="stockpile">Stockpile</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockCrops.map((crop) => (
              <CropCatalogCard key={crop.id} crop={crop} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">
              AI-recommended planting order based on nutritional gaps, resource availability, and mission timeline.
            </p>
          </Card>
          <PlantingQueueList items={mockPlantingQueue} />
        </TabsContent>

        <TabsContent value="journal" className="space-y-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">
              Historical record of all harvests with yield metrics and quality notes.
            </p>
          </Card>
          <HarvestJournalTable entries={mockHarvestJournal} />
        </TabsContent>

        <TabsContent value="stockpile" className="space-y-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">
              Current food inventory with caloric value, supply duration, and expiration tracking.
            </p>
          </Card>
          <StockpileList items={mockStockpile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

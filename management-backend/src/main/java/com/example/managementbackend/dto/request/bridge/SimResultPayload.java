package com.example.managementbackend.dto.request.bridge;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * Mirrors the Python backend's SimulationResult JSON structure.
 * Used by the bridge controller to import simulation results.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record SimResultPayload(
        String id,
        @JsonProperty("daily_snapshots") List<DailySnapshotPayload> dailySnapshots,
        @JsonProperty("agent_decisions") List<AgentDecisionPayload> agentDecisions,
        @JsonProperty("final_metrics") MetricsPayload finalMetrics,
        @JsonProperty("strategy_doc_before") String strategyDocBefore,
        @JsonProperty("strategy_doc_after") String strategyDocAfter
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DailySnapshotPayload(
            int day,
            List<SlotSnapshotPayload> slots,
            EnvironmentPayload environment,
            ResourcesPayload resources,
            @JsonProperty("food_supply") FoodSupplyPayload foodSupply,
            @JsonProperty("stored_food") StoredFoodPayload storedFood,
            @JsonProperty("daily_nutrition") DailyNutritionPayload nutrition,
            @JsonProperty("active_events") List<ActiveEventPayload> events
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SlotSnapshotPayload(
            int id,
            int row,
            int col,
            @JsonProperty("area_m2") double areaM2,
            @JsonProperty("crop_type") String cropType,
            List<CropSnapshotPayload> crops,
            @JsonProperty("artificial_light") boolean light,
            @JsonProperty("water_allocation") double water,
            @JsonProperty("used_area_m2") double usedArea,
            @JsonProperty("available_area_m2") double availableArea
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CropSnapshotPayload(
            String id,
            String type,
            @JsonProperty("footprint_m2") double footprint,
            int age,
            double health,
            double growth,
            @JsonProperty("active_stress") String stress
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EnvironmentPayload(
            @JsonProperty("solar_hours") double solarHours,
            @JsonProperty("outside_temp") double outsideTemp,
            @JsonProperty("internal_temp") double internalTemp,
            @JsonProperty("target_temp") double targetTemp,
            @JsonProperty("co2_level") double co2Level,
            @JsonProperty("energy_generated") double energyGenerated,
            @JsonProperty("energy_needed") double energyNeeded,
            @JsonProperty("energy_deficit") double energyDeficit,
            @JsonProperty("light_penalty") double lightPenalty
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ResourcesPayload(
            double water,
            double nutrients,
            @JsonProperty("energy_generated") double energyGenerated,
            @JsonProperty("energy_needed") double energyNeeded,
            @JsonProperty("energy_deficit") double energyDeficit,
            @JsonProperty("water_recycling_rate") double waterRecyclingRate,
            @JsonProperty("water_availability") double waterAvailability
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record FoodSupplyPayload(
            Map<String, CropStockPayload> items
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CropStockPayload(
            double kg,
            double kcal,
            @JsonProperty("protein_g") double proteinG
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record StoredFoodPayload(
            @JsonProperty("total_calories") double totalCalories,
            @JsonProperty("remaining_calories") double remainingCalories
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DailyNutritionPayload(
            @JsonProperty("calorie_gh_fraction") double calorieGhFraction,
            @JsonProperty("protein_gh_fraction") double proteinGhFraction,
            @JsonProperty("micronutrients_covered") List<String> micronutrientsCovered,
            @JsonProperty("micronutrient_count") int micronutrientCount,
            @JsonProperty("gh_kcal") double ghKcal,
            @JsonProperty("gh_protein_g") double ghProteinG,
            @JsonProperty("stored_kcal_consumed") double storedKcalConsumed
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ActiveEventPayload(
            String type,
            @JsonProperty("started_day") int startedDay,
            @JsonProperty("duration_sols") int durationSols,
            @JsonProperty("remaining_sols") int remainingSols
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AgentDecisionPayload(
            int day,
            String node,
            String reasoning,
            List<Map<String, Object>> actions
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MetricsPayload(
            @JsonProperty("avg_calorie_gh_fraction") double avgCalorieGhFraction,
            @JsonProperty("avg_protein_gh_fraction") double avgProteinGhFraction,
            @JsonProperty("avg_micronutrient_coverage") double avgMicronutrientCoverage,
            @JsonProperty("total_harvested_kg") double totalHarvestedKg,
            @JsonProperty("crops_lost") int cropsLost,
            @JsonProperty("stored_food_remaining_pct") double storedFoodRemainingPct,
            @JsonProperty("resource_efficiency") double resourceEfficiency,
            @JsonProperty("events_handled") int eventsHandled
    ) {}
}

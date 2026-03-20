package com.example.managementbackend.service.impl;

import com.example.managementbackend.domain.*;
import com.example.managementbackend.dto.request.bridge.SimResultPayload;
import com.example.managementbackend.dto.request.bridge.SimResultPayload.*;
import com.example.managementbackend.model.enums.*;
import com.example.managementbackend.repository.*;
import com.example.managementbackend.service.SimulationBridgeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SimulationBridgeServiceImpl implements SimulationBridgeService {

    private final SimulationRepository simulationRepository;
    private final GreenhouseRepository greenhouseRepository;
    private final PlantSlotRepository plantSlotRepository;
    private final CropRepository cropRepository;
    private final SensorSnapshotRepository sensorSnapshotRepository;
    private final AgentLogEntryRepository agentLogEntryRepository;
    private final TimelineEventRepository timelineEventRepository;
    private final HarvestEntryRepository harvestEntryRepository;
    private final StockpileItemRepository stockpileItemRepository;
    private final StoredFoodRepository storedFoodRepository;
    private final AlertRepository alertRepository;
    private final ObjectMapper objectMapper;

    // Simulation engine crop type string → management-backend crop name
    private static final Map<String, String> CROP_NAME_MAP = Map.of(
            "lettuce", "Lettuce",
            "potato", "Potato",
            "radish", "Radish",
            "beans_peas", "Beans/Peas",
            "herbs", "Herbs"
    );

    // Simulation engine stress string → management-backend StressType
    private static final Map<String, StressType> STRESS_MAP = Map.of(
            "drought", StressType.DROUGHT,
            "overwatering", StressType.OVERWATERING,
            "heat", StressType.HEAT,
            "cold", StressType.COLD,
            "nutrient_deficiency", StressType.NUTRIENT_DEFICIENCY_N,
            "light_insufficient", StressType.LIGHT_INSUFFICIENT,
            "co2_imbalance", StressType.CO2_IMBALANCE
    );

    // Simulation engine event type → scenario type
    private static final Map<String, ScenarioType> EVENT_TYPE_MAP = Map.of(
            "water_recycling_degradation", ScenarioType.WATER_RECYCLING_DEGRADATION,
            "temperature_control_failure", ScenarioType.TEMPERATURE_FAILURE
    );

    // Resource starting values (from simulation config.py)
    private static final double STARTING_WATER_L = 40_000.0;
    private static final double STARTING_NUTRIENTS = 20_000.0;

    @Transactional
    @Override
    public Map<String, Object> importResult(String simulationId, SimResultPayload payload) {
        log.info("Importing simulation result for sim={}, days={}", simulationId, payload.dailySnapshots() != null ? payload.dailySnapshots().size() : 0);

        Simulation sim = simulationRepository.findById(simulationId)
                .orElseThrow(() -> new IllegalArgumentException("Simulation not found: " + simulationId));

        // Build crop name → ID lookup
        Map<String, String> cropIdMap = buildCropIdMap();

        int sensorCount = 0;
        int agentLogCount = 0;
        int timelineCount = 0;
        int harvestCount = 0;

        // Find the greenhouse (use first one)
        Greenhouse greenhouse = greenhouseRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("No greenhouse found. Run seed first."));
        String ghId = greenhouse.getId();

        // Reference time: simulation start
        Instant simStart = sim.getCreatedAt() != null ? sim.getCreatedAt() : Instant.now();

        // --- 1. Import agent decisions → AgentLogEntry + TimelineEvent ---
        if (payload.agentDecisions() != null) {
            for (AgentDecisionPayload decision : payload.agentDecisions()) {
                AgentLogEntry logEntry = new AgentLogEntry();
                logEntry.setTimestamp(simStart.plus(decision.day(), ChronoUnit.DAYS));
                logEntry.setSimulationId(simulationId);
                logEntry.setActionType(decision.node().toUpperCase() + "_DECISION");
                logEntry.setDescription(truncate(decision.reasoning(), 1000));
                logEntry.setReasoning(truncate(decision.reasoning(), 10000));
                logEntry.setOutcome(AgentOutcome.SUCCESS);
                agentLogEntryRepository.save(logEntry);
                agentLogCount++;

                TimelineEvent te = new TimelineEvent();
                te.setSimulationId(simulationId);
                te.setTimestamp(simStart.plus(decision.day(), ChronoUnit.DAYS));
                te.setMissionDay(decision.day());
                te.setType(TimelineEventType.AGENT_ACTION);
                te.setSummary("Agent " + decision.node() + " decision on day " + decision.day());
                timelineEventRepository.save(te);
                timelineCount++;
            }
        }

        // --- 2. Process daily snapshots ---
        DailySnapshotPayload latestSnapshot = null;
        if (payload.dailySnapshots() != null && !payload.dailySnapshots().isEmpty()) {
            // Sample snapshots for sensor data (every 30 days + last day)
            for (DailySnapshotPayload snap : payload.dailySnapshots()) {
                boolean isLastDay = snap == payload.dailySnapshots().get(payload.dailySnapshots().size() - 1);
                boolean isSampleDay = snap.day() % 30 == 0;

                if (isSampleDay || isLastDay) {
                    // Create sensor snapshot from environment data
                    SensorSnapshot sensor = translateEnvironmentToSensor(snap.environment(), snap.resources(), ghId, simStart, snap.day());
                    sensorSnapshotRepository.save(sensor);
                    sensorCount++;
                }

                // Track events as timeline entries + alerts
                if (snap.events() != null) {
                    for (ActiveEventPayload event : snap.events()) {
                        if (event.remainingSols() == event.durationSols()) {
                            // Event just started
                            TimelineEvent te = new TimelineEvent();
                            te.setSimulationId(simulationId);
                            te.setTimestamp(simStart.plus(snap.day(), ChronoUnit.DAYS));
                            te.setMissionDay(snap.day());
                            te.setType(TimelineEventType.SCENARIO_INJECTED);
                            te.setSummary(event.type() + " started on day " + snap.day());
                            timelineEventRepository.save(te);
                            timelineCount++;

                            // Create alert for the event
                            Alert alert = new Alert();
                            alert.setCreatedAt(simStart.plus(snap.day(), ChronoUnit.DAYS));
                            alert.setSeverity(AlertSeverity.CRITICAL);
                            alert.setType(AlertType.EQUIPMENT_FAILURE);
                            alert.setGreenhouseId(ghId);
                            alert.setDiagnosis("Simulation event: " + event.type().replace("_", " ") + ". Duration: " + event.durationSols() + " sols.");
                            alert.setConfidence(1.0);
                            alert.setStatus(AlertStatus.OPEN);
                            alert.setEscalatedToHuman(true);
                            alert.setSuggestedAction("Monitor and adjust greenhouse parameters. Agent is responding.");
                            alertRepository.save(alert);
                        }
                    }
                }

                latestSnapshot = snap;
            }
        }

        // --- 3. Update greenhouse slots from the latest snapshot ---
        if (latestSnapshot != null && latestSnapshot.slots() != null) {
            updateGreenhouseSlots(greenhouse, latestSnapshot, cropIdMap);
        }

        // --- 4. Update stockpile from the latest food supply ---
        if (latestSnapshot != null && latestSnapshot.foodSupply() != null && latestSnapshot.foodSupply().items() != null) {
            updateStockpile(latestSnapshot.foodSupply(), cropIdMap);
        }

        // --- 5. Update stored food ---
        if (latestSnapshot != null && latestSnapshot.storedFood() != null) {
            StoredFood sf = storedFoodRepository.findById(1L).orElse(new StoredFood());
            sf.setId(1L);
            sf.setTotalCalories(latestSnapshot.storedFood().totalCalories());
            sf.setRemainingCalories(latestSnapshot.storedFood().remainingCalories());
            storedFoodRepository.save(sf);
        }

        // --- 6. Store agent results as JSON ---
        try {
            String agentResultsJson = objectMapper.writeValueAsString(payload);
            sim.setAgentResultsJson(agentResultsJson);
        } catch (Exception e) {
            log.error("Failed to serialize agent results to JSON: {}", e.getMessage());
        }

        // --- 7. Update simulation with final metrics ---
        if (payload.finalMetrics() != null) {
            MetricsPayload m = payload.finalMetrics();
            // Compute an outcome score (0-100) from the metrics
            double score = (m.avgCalorieGhFraction() * 40)
                    + (m.avgProteinGhFraction() * 30)
                    + (m.avgMicronutrientCoverage() / 7.0 * 20)
                    + (m.resourceEfficiency() * 10);
            sim.setOutcomeScore(Math.min(100.0, Math.round(score * 10) / 10.0));
        }
        sim.setStatus(SimulationStatus.COMPLETED);
        sim.setCompletedAt(Instant.now());
        simulationRepository.save(sim);

        log.info("Import complete: sensors={}, agentLogs={}, timeline={}, harvests={}", sensorCount, agentLogCount, timelineCount, harvestCount);

        return Map.of(
                "simulationId", simulationId,
                "status", "imported",
                "sensorsCreated", sensorCount,
                "agentLogsCreated", agentLogCount,
                "timelineEventsCreated", timelineCount
        );
    }

    // --- Private helpers ---

    private Map<String, String> buildCropIdMap() {
        Map<String, String> map = new HashMap<>();
        for (Map.Entry<String, String> entry : CROP_NAME_MAP.entrySet()) {
            cropRepository.findByName(entry.getValue())
                    .ifPresent(crop -> map.put(entry.getKey(), crop.getId()));
        }
        return map;
    }

    private void updateGreenhouseSlots(Greenhouse greenhouse, DailySnapshotPayload snapshot, Map<String, String> cropIdMap) {
        List<PlantSlot> slots = plantSlotRepository.findByGreenhouseId(greenhouse.getId());

        for (SlotSnapshotPayload simSlot : snapshot.slots()) {
            // Match by row/col position (directly from Python's SlotSnapshot fields)
            int row = simSlot.row();
            int col = simSlot.col();

            PlantSlot dbSlot = slots.stream()
                    .filter(s -> s.getSlotRow() == row && s.getSlotCol() == col)
                    .findFirst()
                    .orElse(null);

            if (dbSlot == null) continue;

            if (simSlot.cropType() == null || simSlot.crops() == null || simSlot.crops().isEmpty()) {
                // Empty slot
                dbSlot.setStatus(SlotStatus.EMPTY);
                dbSlot.setCropId(null);
                dbSlot.setCropName(null);
                dbSlot.setGrowthStagePercent(0);
                dbSlot.setDaysUntilHarvest(null);
                dbSlot.setPlantedAt(null);
                dbSlot.setEstimatedYieldKg(null);
                dbSlot.setActiveStressTypes(List.of());
            } else {
                // Take the first crop in the slot for display
                CropSnapshotPayload firstCrop = simSlot.crops().get(0);
                String mbCropName = CROP_NAME_MAP.getOrDefault(simSlot.cropType(), simSlot.cropType());
                String mbCropId = cropIdMap.get(simSlot.cropType());

                dbSlot.setCropId(mbCropId);
                dbSlot.setCropName(mbCropName);
                dbSlot.setGrowthStagePercent(firstCrop.growth());
                dbSlot.setEstimatedYieldKg(simSlot.usedArea() * 4.0); // rough estimate

                // Derive SlotStatus from health
                if (firstCrop.health() > 60) {
                    dbSlot.setStatus(SlotStatus.HEALTHY);
                } else if (firstCrop.health() > 30) {
                    dbSlot.setStatus(SlotStatus.NEEDS_ATTENTION);
                } else {
                    dbSlot.setStatus(SlotStatus.CRITICAL);
                }

                // Map stress
                List<StressType> stresses = new ArrayList<>();
                for (CropSnapshotPayload crop : simSlot.crops()) {
                    if (crop.stress() != null && !crop.stress().isEmpty()) {
                        StressType st = STRESS_MAP.get(crop.stress());
                        if (st != null && !stresses.contains(st)) stresses.add(st);
                    }
                }
                dbSlot.setActiveStressTypes(stresses);

                // Estimate days until harvest
                if (firstCrop.growth() < 95) {
                    double growthPerDay = firstCrop.age() > 0 ? firstCrop.growth() / firstCrop.age() : 2.0;
                    int remaining = growthPerDay > 0 ? (int) Math.ceil((95 - firstCrop.growth()) / growthPerDay) : 30;
                    dbSlot.setDaysUntilHarvest(remaining);
                } else {
                    dbSlot.setDaysUntilHarvest(0);
                }
            }
            plantSlotRepository.save(dbSlot);
        }
    }

    private void updateStockpile(FoodSupplyPayload foodSupply, Map<String, String> cropIdMap) {
        // Clear existing stockpile
        stockpileItemRepository.deleteAll();

        if (foodSupply.items() == null) return;

        double dailyCrewKcal = 4 * 3000.0; // 4 crew × 3000 kcal

        for (Map.Entry<String, CropStockPayload> entry : foodSupply.items().entrySet()) {
            String simCropType = entry.getKey();
            CropStockPayload stock = entry.getValue();
            if (stock.kg() <= 0) continue;

            StockpileItem item = new StockpileItem();
            item.setCropId(cropIdMap.get(simCropType));
            item.setCropName(CROP_NAME_MAP.getOrDefault(simCropType, simCropType));
            item.setQuantityKg(stock.kg());
            item.setEstimatedCalories(stock.kcal());
            item.setDaysOfSupply(stock.kcal() / dailyCrewKcal);
            item.setUpdatedAt(Instant.now());
            stockpileItemRepository.save(item);
        }
    }

    private SensorSnapshot translateEnvironmentToSensor(EnvironmentPayload env, ResourcesPayload res, String ghId, Instant simStart, int day) {
        SensorSnapshot sensor = new SensorSnapshot();
        sensor.setGreenhouseId(ghId);
        sensor.setTimestamp(simStart.plus(day, ChronoUnit.DAYS));

        // Temperature
        sensor.setTemperature(env.internalTemp());
        sensor.setTemperatureStatus(tempStatus(env.internalTemp()));

        // Humidity (not in sim — derive a plausible value: 60-70% normal)
        sensor.setHumidity(65.0);
        sensor.setHumidityStatus(SensorStatus.NORMAL);

        // Light intensity (derive from solar hours + light penalty)
        double effectiveSolar = env.solarHours() * (1.0 - env.lightPenalty());
        double lux = effectiveSolar * 5000; // rough conversion
        sensor.setLightIntensity(lux);
        sensor.setLightIntensityStatus(effectiveSolar < 6 ? SensorStatus.WARNING : SensorStatus.NORMAL);

        // PAR (derive from solar hours)
        double par = effectiveSolar * 25; // rough µmol/m²/s from hours
        sensor.setPar(par);
        sensor.setParStatus(par < 150 ? SensorStatus.WARNING : SensorStatus.NORMAL);

        // Light cycle phase
        sensor.setLightCyclePhase(LightCyclePhase.DAY);

        // CO2
        sensor.setCo2(env.co2Level());
        sensor.setCo2Status(env.co2Level() < 400 || env.co2Level() > 1200 ? SensorStatus.WARNING : SensorStatus.NORMAL);

        // Water flow rate (derive from recycling rate)
        double flowRate = res != null ? res.waterAvailability() * 5.0 : 4.0;
        sensor.setWaterFlowRate(flowRate);
        sensor.setWaterFlowRateStatus(flowRate < 2.0 ? SensorStatus.WARNING : SensorStatus.NORMAL);

        // Water recycling efficiency
        double recycling = res != null ? res.waterRecyclingRate() * 100.0 : 90.0;
        sensor.setWaterRecyclingEfficiency(recycling);
        sensor.setWaterRecyclingEfficiencyStatus(recycling < 80 ? SensorStatus.WARNING : SensorStatus.NORMAL);

        // Nutrient solution (not in sim — use defaults)
        sensor.setNutrientPh(6.0);
        sensor.setNutrientPhStatus(SensorStatus.NORMAL);
        sensor.setNutrientEc(1.8);
        sensor.setNutrientEcStatus(SensorStatus.NORMAL);
        sensor.setNutrientDo(6.5);
        sensor.setNutrientDoStatus(SensorStatus.NORMAL);

        return sensor;
    }

    private SensorStatus tempStatus(double temp) {
        if (temp >= 15 && temp <= 25) return SensorStatus.NORMAL;
        if (temp >= 10 && temp <= 30) return SensorStatus.WARNING;
        return SensorStatus.CRITICAL;
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return "";
        return s.length() <= maxLen ? s : s.substring(0, maxLen);
    }
}

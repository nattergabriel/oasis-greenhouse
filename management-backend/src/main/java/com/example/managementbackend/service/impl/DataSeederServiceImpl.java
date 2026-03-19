package com.example.managementbackend.service.impl;

import com.example.managementbackend.domain.*;
import com.example.managementbackend.model.enums.*;
import com.example.managementbackend.repository.*;
import com.example.managementbackend.service.DataSeederService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataSeederServiceImpl implements DataSeederService {

    private final CropRepository cropRepository;
    private final GreenhouseRepository greenhouseRepository;
    private final MissionConfigRepository missionConfigRepository;
    private final ScenarioRepository scenarioRepository;
    private final StoredFoodRepository storedFoodRepository;
    private final AgentConfigRepository agentConfigRepository;
    private final StockpileItemRepository stockpileItemRepository;
    private final AlertRepository alertRepository;
    private final HarvestEntryRepository harvestEntryRepository;
    private final RecommendationRepository recommendationRepository;
    private final TimelineEventRepository timelineEventRepository;
    private final AgentLogEntryRepository agentLogEntryRepository;
    private final SensorSnapshotRepository sensorSnapshotRepository;
    private final PlantingQueueItemRepository plantingQueueItemRepository;
    private final ConsumptionEntryRepository consumptionEntryRepository;
    private final SimulationRepository simulationRepository;

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void seedDatabase() {
        log.info("Starting comprehensive database seeding...");

        // Core configuration
        seedMissionConfig();
        seedAgentConfig();
        seedScenarios();
        seedStoredFood();

        // Greenhouse and crops
        seedCrops();
        seedGreenhouse();
        seedStockpile();

        // Historical data (showcases the app in use)
        seedHarvestHistory();
        seedSensorSnapshots();
        seedTimelineEvents();
        seedAgentLogs();

        // Active operational data
        seedAlerts();
        seedRecommendations();
        seedPlantingQueue();

        // Nutritional tracking
        seedConsumptionEntries();

        // Simulation history
        seedSimulationHistory();

        log.info("Database seeding completed successfully - all tables populated with showcase data");
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void seedCrops() {
        if (cropRepository.count() > 0) {
            log.info("Crops already exist, skipping seed");
            return;
        }

        log.info("Seeding crops from MCP Knowledge Base data...");

        // Data sourced from MCP KB: 03_Crop_Profiles_Extended.md
        List<Crop> crops = Arrays.asList(
            createLettuce(),
            createPotato(),
            createRadish(),
            createBeansPeas(),
            createHerbs()
        );

        cropRepository.saveAll(crops);
        log.info("Seeded {} crops", crops.size());
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void seedGreenhouse() {
        if (greenhouseRepository.count() > 0) {
            log.info("Greenhouse already exists, skipping seed");
            return;
        }

        log.info("Seeding greenhouse with diverse crop allocations...");

        // First ensure crops exist
        if (cropRepository.count() == 0) {
            log.warn("Crops not seeded yet - seeding crops first");
            seedCrops();
        }

        // Fetch seeded crops
        List<Crop> allCrops = cropRepository.findAll();
        Crop lettuce = allCrops.stream().filter(c -> c.getName().equals("Lettuce")).findFirst().orElse(null);
        Crop potato = allCrops.stream().filter(c -> c.getName().equals("Potato")).findFirst().orElse(null);
        Crop radish = allCrops.stream().filter(c -> c.getName().equals("Radish")).findFirst().orElse(null);
        Crop beans = allCrops.stream().filter(c -> c.getName().equals("Beans/Peas")).findFirst().orElse(null);
        Crop herbs = allCrops.stream().filter(c -> c.getName().equals("Herbs")).findFirst().orElse(null);

        Greenhouse greenhouse = new Greenhouse();
        greenhouse.setName("Mars Greenhouse Alpha");
        greenhouse.setDescription("Primary hydroponic greenhouse for 450-day Mars surface mission");
        greenhouse.setRows(4);
        greenhouse.setCols(4);
        greenhouse.setOverallStatus(GreenhouseStatus.HEALTHY);
        greenhouse.setCreatedAt(Instant.now());

        // Create 4x4 = 16 plant slots with diverse crop allocation and growth stages
        // Layout strategy: Mix fast/slow crops, diverse nutrition profile
        Crop[][] layout = {
            {lettuce, potato, radish, beans},   // Row 0
            {beans, lettuce, herbs, potato},    // Row 1
            {radish, herbs, potato, lettuce},   // Row 2
            {potato, beans, lettuce, radish}    // Row 3
        };

        // Growth stage percentages for realistic diversity
        double[][] growthStages = {
            {75.0, 30.0, 90.0, 45.0},   // Row 0: varied stages
            {60.0, 85.0, 50.0, 25.0},   // Row 1
            {95.0, 40.0, 70.0, 80.0},   // Row 2
            {55.0, 65.0, 20.0, 88.0}    // Row 3
        };

        for (int row = 0; row < 4; row++) {
            for (int col = 0; col < 4; col++) {
                PlantSlot slot = new PlantSlot();
                slot.setSlotRow(row);
                slot.setSlotCol(col);

                Crop assignedCrop = layout[row][col];
                double growthPercent = growthStages[row][col];

                if (assignedCrop != null) {
                    slot.setCropId(assignedCrop.getId());
                    slot.setCropName(assignedCrop.getName());
                    slot.setStatus(SlotStatus.HEALTHY);
                    slot.setGrowthStagePercent(growthPercent);
                    slot.setPlantedAt(Instant.now().minusSeconds(
                        (long)(assignedCrop.getGrowthDays() * 86400 * (growthPercent / 100.0))
                    ));
                    slot.setDaysUntilHarvest((int)((100 - growthPercent) / 100.0 * assignedCrop.getGrowthDays()));
                } else {
                    // Fallback: empty slot
                    slot.setStatus(SlotStatus.EMPTY);
                    slot.setGrowthStagePercent(0.0);
                }

                slot.setGreenhouse(greenhouse);
                greenhouse.getSlots().add(slot);
            }
        }

        greenhouseRepository.save(greenhouse);
        log.info("Seeded greenhouse with {} slots (diverse crop allocation)", greenhouse.getSlots().size());
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void seedMissionConfig() {
        if (missionConfigRepository.count() > 0) {
            log.info("Mission config already exists, skipping seed");
            return;
        }

        log.info("Seeding mission configuration...");

        MissionConfig config = new MissionConfig();
        config.setId(1L);
        config.setMissionStartDate(LocalDate.now());
        config.setMissionEndDate(LocalDate.now().plusDays(450));

        missionConfigRepository.save(config);
        log.info("Seeded mission config: {} to {}", config.getMissionStartDate(), config.getMissionEndDate());
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void clearAllData() {
        log.warn("Clearing all seeded data from all tables...");

        // Clear operational data first
        alertRepository.deleteAll();
        recommendationRepository.deleteAll();
        sensorSnapshotRepository.deleteAll();
        timelineEventRepository.deleteAll();
        agentLogEntryRepository.deleteAll();
        harvestEntryRepository.deleteAll();
        stockpileItemRepository.deleteAll();
        plantingQueueItemRepository.deleteAll();
        consumptionEntryRepository.deleteAll();
        simulationRepository.deleteAll();

        // Clear core data
        greenhouseRepository.deleteAll();
        cropRepository.deleteAll();
        missionConfigRepository.deleteAll();
        scenarioRepository.deleteAll();
        storedFoodRepository.deleteAll();
        agentConfigRepository.deleteAll();

        log.info("All data cleared from all repositories");
    }

    private void seedScenarios() {
        if (scenarioRepository.count() > 0) {
            log.info("Scenarios already exist, skipping seed");
            return;
        }
        log.info("Seeding scenarios...");

        Scenario waterDeg = new Scenario();
        waterDeg.setName("Water Recycling Degradation");
        waterDeg.setType(ScenarioType.WATER_RECYCLING_DEGRADATION);
        waterDeg.setDescription("Water recycling system efficiency drops from 90% to 70-80%, accelerating water depletion.");
        waterDeg.setSeverity(ScenarioSeverity.HIGH);
        waterDeg.setDefaultDurationMinutes(7200); // 5 days in minutes

        Scenario tempFailure = new Scenario();
        tempFailure.setName("Temperature Control Failure");
        tempFailure.setType(ScenarioType.TEMPERATURE_FAILURE);
        tempFailure.setDescription("Temperature regulation fails, causing ±5°C drift from target. Crops experience heat or cold stress.");
        tempFailure.setSeverity(ScenarioSeverity.HIGH);
        tempFailure.setDefaultDurationMinutes(4320); // 3 days in minutes

        scenarioRepository.saveAll(List.of(waterDeg, tempFailure));
        log.info("Seeded 2 scenarios");
    }

    private void seedStoredFood() {
        if (storedFoodRepository.count() > 0) {
            log.info("Stored food already exists, skipping seed");
            return;
        }
        log.info("Seeding stored food...");

        StoredFood food = new StoredFood();
        food.setId(1L);
        food.setTotalCalories(5_400_000.0);       // 450 days × 4 crew × 3000 kcal
        food.setRemainingCalories(5_400_000.0);

        storedFoodRepository.save(food);
        log.info("Seeded stored food: {} kcal", food.getTotalCalories());
    }

    private void seedAgentConfig() {
        if (agentConfigRepository.count() > 0) {
            log.info("Agent config already exists, skipping seed");
            return;
        }
        log.info("Seeding agent config...");

        AgentConfig config = new AgentConfig();
        config.setId(1L);
        config.setAutonomyLevel(AutonomyLevel.HYBRID);
        config.setCertaintyThreshold(0.7);
        config.setRiskTolerance(RiskTolerance.MODERATE);
        config.setPriorityWeightYield(0.4);
        config.setPriorityWeightDiversity(0.3);
        config.setPriorityWeightResourceConservation(0.3);

        agentConfigRepository.save(config);
        log.info("Seeded agent config");
    }

    private void seedStockpile() {
        if (stockpileItemRepository.count() > 0) {
            log.info("Stockpile already exists, skipping seed");
            return;
        }
        log.info("Seeding stockpile with harvested crops...");

        // First ensure crops exist
        if (cropRepository.count() == 0) {
            log.warn("Crops not seeded yet - seeding crops first");
            seedCrops();
        }

        List<Crop> allCrops = cropRepository.findAll();

        // Create stockpile items for each crop type with realistic quantities
        // Assume we're 60 days into the mission with multiple harvest cycles completed
        for (Crop crop : allCrops) {
            StockpileItem item = new StockpileItem();
            item.setCropId(crop.getId());
            item.setCropName(crop.getName());

            // Calculate realistic quantities based on crop type and harvest cycles
            double quantityKg;
            double estimatedCalories;
            Integer expiresInDays;

            switch (crop.getName()) {
                case "Lettuce":
                    // Fast cycle (37 days) - ~1.5 cycles completed = ~6 kg/m² × 16 m² × 1.5 = ~144 kg
                    // But lettuce has short shelf life, so current stock is lower
                    quantityKg = 45.0; // Recent harvest
                    estimatedCalories = quantityKg * 1000 * (crop.getCaloriesPer100g() / 100);
                    expiresInDays = 7; // Leafy greens expire quickly
                    break;

                case "Potato":
                    // Longer cycle (95 days) - no full harvest yet, but we have stored from previous missions
                    quantityKg = 120.0; // Good storage capability
                    estimatedCalories = quantityKg * 1000 * (crop.getCaloriesPer100g() / 100);
                    expiresInDays = 180; // Potatoes store well
                    break;

                case "Radish":
                    // Very fast cycle (25 days) - multiple harvests = ~3 kg/m² × 16 m² × 2.4 = ~115 kg
                    quantityKg = 38.0; // Recent harvest, consumed quickly
                    estimatedCalories = quantityKg * 1000 * (crop.getCaloriesPer100g() / 100);
                    expiresInDays = 14; // Medium shelf life
                    break;

                case "Beans/Peas":
                    // Medium cycle (60 days) - 1 full harvest = ~3 kg/m² × 16 m² = ~48 kg
                    quantityKg = 52.0; // Good protein source, prioritized
                    estimatedCalories = quantityKg * 1000 * (crop.getCaloriesPer100g() / 100);
                    expiresInDays = 30; // Dried legumes last longer
                    break;

                case "Herbs":
                    // Fast cycle (30 days) - continuous harvest
                    quantityKg = 8.0; // Low yield, small quantities used
                    estimatedCalories = quantityKg * 1000 * (crop.getCaloriesPer100g() / 100);
                    expiresInDays = 5; // Fresh herbs expire quickly
                    break;

                default:
                    quantityKg = 10.0;
                    estimatedCalories = quantityKg * 1000 * (crop.getCaloriesPer100g() / 100);
                    expiresInDays = 14;
            }

            // Calculate days of supply for 4 crew members
            // Crew daily caloric need: ~12,000 kcal/day total
            item.setQuantityKg(quantityKg);
            item.setEstimatedCalories(estimatedCalories);
            item.setDaysOfSupply(estimatedCalories / 12000.0);
            item.setExpiresInDays(expiresInDays);
            item.setUpdatedAt(Instant.now());

            stockpileItemRepository.save(item);
        }

        log.info("Seeded stockpile with {} crop types", allCrops.size());

        // Calculate total stockpile metrics
        List<StockpileItem> allItems = stockpileItemRepository.findAll();
        double totalKg = allItems.stream().mapToDouble(StockpileItem::getQuantityKg).sum();
        double totalCalories = allItems.stream().mapToDouble(StockpileItem::getEstimatedCalories).sum();
        double totalDaysOfSupply = totalCalories / 12000.0;

        log.info("Total stockpile: {:.2f} kg, {:.0f} kcal, {:.1f} days of supply for 4-person crew",
            totalKg, totalCalories, totalDaysOfSupply);
    }

    private void seedHarvestHistory() {
        if (harvestEntryRepository.count() > 0) {
            log.info("Harvest history already exists, skipping seed");
            return;
        }
        log.info("Seeding harvest history...");

        List<Crop> allCrops = cropRepository.findAll();
        List<Greenhouse> greenhouses = greenhouseRepository.findAll();
        if (greenhouses.isEmpty()) return;

        Greenhouse greenhouse = greenhouses.get(0);
        List<PlantSlot> slots = greenhouse.getSlots();

        // Simulate harvests over the past 60 days at mission day 60
        int currentMissionDay = 60;

        // Lettuce harvests (fast cycle - 37 days, multiple harvests)
        Crop lettuce = allCrops.stream().filter(c -> c.getName().equals("Lettuce")).findFirst().orElse(null);
        if (lettuce != null) {
            createHarvestEntry(lettuce, greenhouse, slots.get(0), currentMissionDay - 3, 3.8, "First lettuce harvest - excellent quality");
            createHarvestEntry(lettuce, greenhouse, slots.get(4), currentMissionDay - 8, 4.2, "High yield, crisp texture");
        }

        // Radish harvests (very fast cycle - 25 days, most harvests)
        Crop radish = allCrops.stream().filter(c -> c.getName().equals("Radish")).findFirst().orElse(null);
        if (radish != null) {
            createHarvestEntry(radish, greenhouse, slots.get(2), currentMissionDay - 2, 2.9, "Fresh radishes, good color");
            createHarvestEntry(radish, greenhouse, slots.get(8), currentMissionDay - 5, 3.1, "Slightly smaller than expected");
            createHarvestEntry(radish, greenhouse, slots.get(15), currentMissionDay - 12, 3.4, "Optimal growing conditions");
        }

        // Beans/Peas harvest (medium cycle - 60 days, 1 harvest)
        Crop beans = allCrops.stream().filter(c -> c.getName().equals("Beans/Peas")).findFirst().orElse(null);
        if (beans != null) {
            createHarvestEntry(beans, greenhouse, slots.get(3), currentMissionDay - 1, 3.2, "First protein harvest - critical milestone");
        }

        // Herbs (continuous harvest)
        Crop herbs = allCrops.stream().filter(c -> c.getName().equals("Herbs")).findFirst().orElse(null);
        if (herbs != null) {
            createHarvestEntry(herbs, greenhouse, slots.get(6), currentMissionDay - 4, 0.9, "Fresh basil for crew morale");
            createHarvestEntry(herbs, greenhouse, slots.get(9), currentMissionDay - 10, 1.1, "Chives - excellent aroma");
        }

        log.info("Seeded {} harvest entries", harvestEntryRepository.count());
    }

    private void createHarvestEntry(Crop crop, Greenhouse greenhouse, PlantSlot slot, int missionDay, double yieldKg, String notes) {
        HarvestEntry entry = new HarvestEntry();
        entry.setHarvestedAt(Instant.now().minusSeconds((60 - missionDay) * 86400L));
        entry.setMissionDay(missionDay);
        entry.setCropId(crop.getId());
        entry.setCropName(crop.getName());
        entry.setYieldKg(yieldKg);
        entry.setSlotId(slot.getId());
        entry.setGreenhouseId(greenhouse.getId());
        entry.setNotes(notes);
        harvestEntryRepository.save(entry);
    }

    private void seedAlerts() {
        if (alertRepository.count() > 0) {
            log.info("Alerts already exist, skipping seed");
            return;
        }
        log.info("Seeding alerts to showcase monitoring system...");

        List<Greenhouse> greenhouses = greenhouseRepository.findAll();
        if (greenhouses.isEmpty()) return;

        Greenhouse greenhouse = greenhouses.get(0);
        List<PlantSlot> slots = greenhouse.getSlots();
        List<Crop> crops = cropRepository.findAll();

        // Alert 1: CRITICAL severity - Water recycling degradation
        Alert alert1 = new Alert();
        alert1.setCreatedAt(Instant.now().minusSeconds(3600 * 12)); // 12 hours ago
        alert1.setSeverity(AlertSeverity.CRITICAL);
        alert1.setType(AlertType.EQUIPMENT_FAILURE);
        alert1.setGreenhouseId(greenhouse.getId());
        alert1.setDiagnosis("Water recycling efficiency has dropped from 90% to 78%. Projected water depletion in 45 days if not addressed.");
        alert1.setConfidence(0.92);
        alert1.setStatus(AlertStatus.OPEN);
        alert1.setEscalatedToHuman(true);
        alert1.setSuggestedAction("Inspect water recycling system filters. Consider reducing high-water crops temporarily.");
        alertRepository.save(alert1);

        // Alert 2: WARNING severity - Crop health degradation
        Alert alert2 = new Alert();
        alert2.setCreatedAt(Instant.now().minusSeconds(3600 * 5)); // 5 hours ago
        alert2.setSeverity(AlertSeverity.WARNING);
        alert2.setType(AlertType.ENVIRONMENTAL_STRESS);
        alert2.setGreenhouseId(greenhouse.getId());
        alert2.setSlotId(slots.get(7).getId());
        Crop potato = crops.stream().filter(c -> c.getName().equals("Potato")).findFirst().orElse(null);
        if (potato != null) alert2.setCropId(potato.getId());
        alert2.setDiagnosis("Potato in slot [1,3] showing signs of heat stress. Temperature exceeded 26°C threshold for 8 hours.");
        alert2.setConfidence(0.85);
        alert2.setStatus(AlertStatus.ACKNOWLEDGED);
        alert2.setEscalatedToHuman(false);
        alert2.setSuggestedAction("Reduce ambient temperature to 18-20°C range. Monitor tuber development.");
        alertRepository.save(alert2);

        // Alert 3: INFO severity - Preventive maintenance
        Alert alert3 = new Alert();
        alert3.setCreatedAt(Instant.now().minusSeconds(3600)); // 1 hour ago
        alert3.setSeverity(AlertSeverity.INFO);
        alert3.setType(AlertType.OTHER);
        alert3.setGreenhouseId(greenhouse.getId());
        alert3.setDiagnosis("CO₂ levels suboptimal for lettuce growth. Current: 420 ppm, optimal: 600-800 ppm.");
        alert3.setConfidence(0.78);
        alert3.setStatus(AlertStatus.OPEN);
        alert3.setEscalatedToHuman(false);
        alert3.setSuggestedAction("Increase CO₂ enrichment during daylight hours to boost photosynthesis.");
        alertRepository.save(alert3);

        // Alert 4: RESOLVED - Previously addressed
        Alert alert4 = new Alert();
        alert4.setCreatedAt(Instant.now().minusSeconds(86400 * 3)); // 3 days ago
        alert4.setResolvedAt(Instant.now().minusSeconds(86400 * 2)); // 2 days ago
        alert4.setSeverity(AlertSeverity.WARNING);
        alert4.setType(AlertType.NUTRIENT_DEFICIENCY);
        alert4.setGreenhouseId(greenhouse.getId());
        alert4.setDiagnosis("Nitrogen deficiency detected in lettuce crops. Yellowing leaves observed.");
        alert4.setConfidence(0.91);
        alert4.setStatus(AlertStatus.RESOLVED);
        alert4.setEscalatedToHuman(false);
        alert4.setSuggestedAction("Adjusted nutrient solution N-P-K ratio. Issue resolved.");
        alertRepository.save(alert4);

        log.info("Seeded {} alerts (1 critical, 2 warning/acknowledged, 1 resolved)", alertRepository.count());
    }

    private void seedRecommendations() {
        if (recommendationRepository.count() > 0) {
            log.info("Recommendations already exist, skipping seed");
            return;
        }
        log.info("Seeding AI recommendations...");

        // Recommendation 1: URGENT - Increase protein production
        Recommendation rec1 = new Recommendation();
        rec1.setCreatedAt(Instant.now().minusSeconds(3600 * 8)); // 8 hours ago
        rec1.setActionType("CROP_ALLOCATION_CHANGE");
        rec1.setDescription("Increase beans/peas allocation by 25% to meet protein requirements");
        rec1.setReasoning("Analysis of crew nutritional intake shows protein deficit of 12% over the past 15 days. " +
            "Current bean/pea production: 280g protein/day. Required: 360-540g/day for 4 crew members. " +
            "MCP KB Section 5.3.2 identifies legumes as primary greenhouse protein source. " +
            "Recommend reallocating 2-3 low-calorie crop slots to beans/peas.");
        rec1.setConfidence(0.88);
        rec1.setUrgency(Urgency.HIGH);
        rec1.setExpiresAt(Instant.now().plusSeconds(86400 * 2)); // Expires in 2 days
        rec1.setStatus(RecommendationStatus.PENDING);
        recommendationRepository.save(rec1);

        // Recommendation 2: MEDIUM - Optimize harvest timing
        Recommendation rec2 = new Recommendation();
        rec2.setCreatedAt(Instant.now().minusSeconds(3600 * 4)); // 4 hours ago
        rec2.setActionType("HARVEST_OPTIMIZATION");
        rec2.setDescription("Harvest radishes in slots [0,2] and [2,0] within next 24 hours");
        rec2.setReasoning("Growth stage analysis indicates radishes at 95% and 96% maturity respectively. " +
            "MCP KB Section 3.5 notes radishes have 14-day shelf life. Early harvest maximizes freshness " +
            "and allows replanting cycle to begin. Projected yield: 6.2kg combined.");
        rec2.setConfidence(0.94);
        rec2.setUrgency(Urgency.MEDIUM);
        rec2.setExpiresAt(Instant.now().plusSeconds(86400)); // Expires in 1 day
        rec2.setStatus(RecommendationStatus.PENDING);
        recommendationRepository.save(rec2);

        // Recommendation 3: LOW - Micronutrient diversification
        Recommendation rec3 = new Recommendation();
        rec3.setCreatedAt(Instant.now().minusSeconds(3600 * 2)); // 2 hours ago
        rec3.setActionType("CROP_DIVERSITY");
        rec3.setDescription("Add one additional herb variety to enhance Vitamin K coverage");
        rec3.setReasoning("Nutritional analysis shows Vitamin K intake at 78% of optimal levels. " +
            "Herbs provide highest Vitamin K density (414 mcg/100g per MCP KB Section 3.7). " +
            "Low resource cost, high psychological benefit. Recommend allocating 0.5 slots.");
        rec3.setConfidence(0.72);
        rec3.setUrgency(Urgency.LOW);
        rec3.setExpiresAt(Instant.now().plusSeconds(86400 * 7)); // Expires in 7 days
        rec3.setStatus(RecommendationStatus.PENDING);
        recommendationRepository.save(rec3);

        // Recommendation 4: APPROVED - Previous action taken
        Recommendation rec4 = new Recommendation();
        rec4.setCreatedAt(Instant.now().minusSeconds(86400 * 5)); // 5 days ago
        rec4.setExecutedAt(Instant.now().minusSeconds(86400 * 4)); // 4 days ago
        rec4.setActionType("TEMPERATURE_ADJUSTMENT");
        rec4.setDescription("Reduce greenhouse temperature to 18°C to prevent potato heat stress");
        rec4.setReasoning("Potato crops showing early heat stress symptoms. MCP KB Section 3.4 indicates " +
            "optimal temperature range of 16-20°C with heat stress threshold at 26°C.");
        rec4.setConfidence(0.89);
        rec4.setUrgency(Urgency.HIGH);
        rec4.setStatus(RecommendationStatus.APPROVED);
        recommendationRepository.save(rec4);

        log.info("Seeded {} recommendations (1 urgent, 1 medium, 1 low, 1 approved)", recommendationRepository.count());
    }

    private void seedTimelineEvents() {
        if (timelineEventRepository.count() > 0) {
            log.info("Timeline events already exist, skipping seed");
            return;
        }
        log.info("Seeding mission timeline events...");

        String simulationId = "sim-showcase-001";

        // Day 0: Mission start
        createTimelineEvent(simulationId, 0, TimelineEventType.SLOT_SNAPSHOT,
            "Mission commenced. Greenhouse initialized with diverse crop allocation.");

        // Day 15: First harvest
        createTimelineEvent(simulationId, 15, TimelineEventType.HARVEST,
            "First radish harvest completed. Yield: 3.4kg. Crew morale boost from fresh food.");

        // Day 30: Agent decision
        createTimelineEvent(simulationId, 30, TimelineEventType.AGENT_ACTION,
            "Agent reallocated 2 slots from lettuce to beans to address protein deficit.");

        // Day 37: Harvest milestone
        createTimelineEvent(simulationId, 37, TimelineEventType.HARVEST,
            "First lettuce harvest. 4.2kg harvested. Vitamin K supplementation achieved.");

        // Day 42: Crisis event (scenario injected)
        createTimelineEvent(simulationId, 42, TimelineEventType.SCENARIO_INJECTED,
            "Water recycling efficiency degradation detected. System efficiency dropped to 78%.");

        // Day 43: Agent response
        createTimelineEvent(simulationId, 43, TimelineEventType.AGENT_ACTION,
            "Agent reduced water-intensive crops by 15%. Prioritized drought-tolerant species.");

        // Day 50: Milestone (sensor snapshot)
        createTimelineEvent(simulationId, 50, TimelineEventType.SENSOR_SNAPSHOT,
            "Greenhouse caloric contribution reached 18% of crew requirements.");

        // Day 58: Warning (stress detected)
        createTimelineEvent(simulationId, 58, TimelineEventType.STRESS_DETECTED,
            "Potato heat stress detected in slot [1,3]. Temperature regulation adjusted.");

        // Day 60: Current state (slot snapshot)
        createTimelineEvent(simulationId, 60, TimelineEventType.SLOT_SNAPSHOT,
            "Current status: 16/16 slots active. Protein 92% of target. Water reserves stable.");

        log.info("Seeded {} timeline events", timelineEventRepository.count());
    }

    private void createTimelineEvent(String simulationId, int missionDay, TimelineEventType type, String summary) {
        TimelineEvent event = new TimelineEvent();
        event.setSimulationId(simulationId);
        event.setTimestamp(Instant.now().minusSeconds((60 - missionDay) * 86400L));
        event.setMissionDay(missionDay);
        event.setType(type);
        event.setSummary(summary);
        event.setPayload("{}"); // Could contain detailed JSON data
        timelineEventRepository.save(event);
    }

    private void seedAgentLogs() {
        if (agentLogEntryRepository.count() > 0) {
            log.info("Agent logs already exist, skipping seed");
            return;
        }
        log.info("Seeding agent decision logs...");

        String simulationId = "sim-showcase-001";

        // Log 1: Initial crop allocation
        createAgentLog(simulationId, 0, "INITIAL_ALLOCATION",
            "Allocated initial crop distribution across 16 slots: 4 lettuce, 4 potato, 3 beans, 3 radish, 2 herbs",
            "Based on MCP KB Section 5.5 crop allocation strategy. Prioritized caloric security (potatoes) " +
                "and protein production (beans) while maintaining micronutrient diversity (lettuce, herbs).",
            "MCP KB Section 3.3-3.7, Section 5.3",
            AgentOutcome.SUCCESS);

        // Log 2: Proactive optimization
        createAgentLog(simulationId, 30, "CROP_REALLOCATION",
            "Increased bean/pea allocation from 3 to 4 slots. Reduced lettuce from 4 to 3 slots.",
            "Nutritional analysis revealed 12% protein deficit. Legumes provide 7g protein/100g (MCP KB 3.6). " +
                "Lettuce provides minimal protein (1.4g/100g) and can be supplemented from stockpile.",
            "MCP KB Section 5.3.2, Section 5.4.2",
            AgentOutcome.SUCCESS);

        // Log 3: Crisis response
        createAgentLog(simulationId, 43, "WATER_CONSERVATION",
            "Reduced water-intensive crops. Prioritized radish and beans over lettuce.",
            "Water recycling degradation scenario triggered (MCP KB 6.3). Lettuce has HIGH water requirement " +
                "(95% tissue water content). Radish and beans have MEDIUM requirements. Decision optimizes " +
                "resource efficiency while maintaining nutritional coverage.",
            "MCP KB Section 6.3, Section 3.3",
            AgentOutcome.SUCCESS);

        // Log 4: Environmental adjustment
        createAgentLog(simulationId, 58, "TEMPERATURE_ADJUSTMENT",
            "Reduced greenhouse temperature from 22°C to 18°C to address potato heat stress.",
            "Potato heat stress threshold: 26°C (MCP KB 3.4). Observed temperature: 27°C for 8 hours. " +
                "Optimal range: 16-20°C. Decision prioritizes primary energy crop health.",
            "MCP KB Section 3.4",
            AgentOutcome.SUCCESS);

        // Log 5: Pending action (for realism)
        createAgentLog(simulationId, 55, "CO2_ENRICHMENT_ATTEMPT",
            "Attempted to increase CO₂ levels to 850 ppm for lettuce growth boost.",
            "MCP KB Section 3.3 indicates strong CO₂ enrichment benefit for lettuce (optimal: 600-800 ppm). " +
                "Attempted 850 ppm but system constraints limited to 780 ppm. Awaiting confirmation.",
            "MCP KB Section 3.3",
            AgentOutcome.PENDING);

        log.info("Seeded {} agent log entries", agentLogEntryRepository.count());
    }

    private void createAgentLog(String simulationId, int missionDay, String actionType, String description,
                                 String reasoning, String kbSource, AgentOutcome outcome) {
        AgentLogEntry log = new AgentLogEntry();
        log.setSimulationId(simulationId);
        log.setTimestamp(Instant.now().minusSeconds((60 - missionDay) * 86400L));
        log.setActionType(actionType);
        log.setDescription(description);
        log.setReasoning(reasoning);
        log.setKnowledgeBaseSource(kbSource);
        log.setOutcome(outcome);
        agentLogEntryRepository.save(log);
    }

    private void seedSensorSnapshots() {
        if (sensorSnapshotRepository.count() > 0) {
            log.info("Sensor snapshots already exist, skipping seed");
            return;
        }
        log.info("Seeding environmental sensor snapshots...");

        List<Greenhouse> greenhouses = greenhouseRepository.findAll();
        if (greenhouses.isEmpty()) return;

        Greenhouse greenhouse = greenhouses.get(0);

        // Create snapshots for the past 24 hours (every 4 hours = 6 snapshots)
        for (int i = 0; i < 6; i++) {
            long hoursAgo = i * 4;
            boolean isDayPhase = (i % 2 == 0); // Alternate day/night

            SensorSnapshot snapshot = new SensorSnapshot();
            snapshot.setGreenhouseId(greenhouse.getId());
            snapshot.setTimestamp(Instant.now().minusSeconds(hoursAgo * 3600));
            snapshot.setLightCyclePhase(isDayPhase ? LightCyclePhase.DAY : LightCyclePhase.NIGHT);

            // Temperature (optimal: 18°C, with some variation)
            snapshot.setTemperature(18.0 + (isDayPhase ? 2.5 : -1.0) + (Math.random() * 1.5 - 0.75));
            snapshot.setTemperatureStatus(SensorStatus.NORMAL);

            // Humidity (optimal: 60-70%)
            snapshot.setHumidity(65.0 + (Math.random() * 10 - 5));
            snapshot.setHumidityStatus(SensorStatus.NORMAL);

            // Light intensity (day: high, night: off)
            snapshot.setLightIntensity(isDayPhase ? 800 + (Math.random() * 100 - 50) : 0);
            snapshot.setLightIntensityStatus(SensorStatus.NORMAL);

            // PAR (day: 250-350, night: 0)
            snapshot.setPar(isDayPhase ? 300 + (Math.random() * 50 - 25) : 0);
            snapshot.setParStatus(SensorStatus.NORMAL);

            // CO2 (slightly suboptimal to match alert)
            snapshot.setCo2(420 + (Math.random() * 40 - 20));
            snapshot.setCo2Status(i < 2 ? SensorStatus.WARNING : SensorStatus.NORMAL); // Recent warning

            // Water flow rate
            snapshot.setWaterFlowRate(1.5 + (Math.random() * 0.4 - 0.2));
            snapshot.setWaterFlowRateStatus(SensorStatus.NORMAL);

            // Water recycling efficiency (degraded per alert)
            snapshot.setWaterRecyclingEfficiency(0.78 + (Math.random() * 0.04 - 0.02));
            snapshot.setWaterRecyclingEfficiencyStatus(SensorStatus.WARNING); // Matches alert

            // Nutrient pH (optimal: 5.8-6.2)
            snapshot.setNutrientPh(6.0 + (Math.random() * 0.3 - 0.15));
            snapshot.setNutrientPhStatus(SensorStatus.NORMAL);

            // Nutrient EC (electrical conductivity)
            snapshot.setNutrientEc(1.8 + (Math.random() * 0.4 - 0.2));
            snapshot.setNutrientEcStatus(SensorStatus.NORMAL);

            // Dissolved Oxygen
            snapshot.setNutrientDo(7.5 + (Math.random() * 1.0 - 0.5));
            snapshot.setNutrientDoStatus(SensorStatus.NORMAL);

            sensorSnapshotRepository.save(snapshot);
        }

        log.info("Seeded {} sensor snapshots (24-hour coverage)", sensorSnapshotRepository.count());
    }

    private void seedPlantingQueue() {
        if (plantingQueueItemRepository.count() > 0) {
            log.info("Planting queue already exists, skipping seed");
            return;
        }
        log.info("Seeding planting queue with AI-recommended priorities...");

        List<Crop> allCrops = cropRepository.findAll();
        List<Greenhouse> greenhouses = greenhouseRepository.findAll();
        if (greenhouses.isEmpty() || allCrops.isEmpty()) return;

        Greenhouse greenhouse = greenhouses.get(0);
        int currentMissionDay = 60;

        // Priority 1: Urgent protein production (beans)
        Crop beans = allCrops.stream().filter(c -> c.getName().equals("Beans/Peas")).findFirst().orElse(null);
        if (beans != null) {
            PlantingQueueItem item1 = new PlantingQueueItem();
            item1.setRank(1);
            item1.setCropId(beans.getId());
            item1.setCropName(beans.getName());
            item1.setGreenhouseId(greenhouse.getId());
            item1.setRecommendedPlantDate(Instant.now().plusSeconds(86400 * 2)); // 2 days from now
            item1.setMissionDay(currentMissionDay + 2);
            item1.setReason("URGENT: Protein deficit detected. Current intake 280g/day vs required 360-540g/day. " +
                "Legumes provide 7g protein per 100g (MCP KB 3.6). Priority planting to close 22% protein gap.");
            item1.setNutritionalGapsAddressed(Arrays.asList("Protein", "Iron", "Folate"));
            plantingQueueItemRepository.save(item1);
        }

        // Priority 2: Caloric security (potato)
        Crop potato = allCrops.stream().filter(c -> c.getName().equals("Potato")).findFirst().orElse(null);
        if (potato != null) {
            PlantingQueueItem item2 = new PlantingQueueItem();
            item2.setRank(2);
            item2.setCropId(potato.getId());
            item2.setCropName(potato.getName());
            item2.setGreenhouseId(greenhouse.getId());
            item2.setRecommendedPlantDate(Instant.now().plusSeconds(86400 * 3));
            item2.setMissionDay(currentMissionDay + 3);
            item2.setReason("HIGH: Primary energy crop. Potatoes provide 77 kcal/100g with excellent storage (180 days). " +
                "Current caloric production at 82% of target. Planting now ensures harvest at Day 155.");
            item2.setNutritionalGapsAddressed(Arrays.asList("Calories", "Carbohydrates", "Potassium"));
            plantingQueueItemRepository.save(item2);
        }

        // Priority 3: Vitamin K supplementation (lettuce)
        Crop lettuce = allCrops.stream().filter(c -> c.getName().equals("Lettuce")).findFirst().orElse(null);
        if (lettuce != null) {
            PlantingQueueItem item3 = new PlantingQueueItem();
            item3.setRank(3);
            item3.setCropId(lettuce.getId());
            item3.setCropName(lettuce.getName());
            item3.setGreenhouseId(greenhouse.getId());
            item3.setRecommendedPlantDate(Instant.now().plusSeconds(86400 * 5));
            item3.setMissionDay(currentMissionDay + 5);
            item3.setReason("MEDIUM: Vitamin K coverage at 78%. Lettuce provides 126 mcg/100g (MCP KB 3.3). " +
                "Fast cycle (37 days) allows rapid micronutrient supplementation. Also addresses Vitamin A gap.");
            item3.setNutritionalGapsAddressed(Arrays.asList("Vitamin K", "Vitamin A", "Folate"));
            plantingQueueItemRepository.save(item3);
        }

        // Priority 4: Fast-cycle dietary diversity (radish)
        Crop radish = allCrops.stream().filter(c -> c.getName().equals("Radish")).findFirst().orElse(null);
        if (radish != null) {
            PlantingQueueItem item4 = new PlantingQueueItem();
            item4.setRank(4);
            item4.setCropId(radish.getId());
            item4.setCropName(radish.getName());
            item4.setGreenhouseId(greenhouse.getId());
            item4.setRecommendedPlantDate(Instant.now().plusSeconds(86400 * 7));
            item4.setMissionDay(currentMissionDay + 7);
            item4.setReason("MEDIUM: Crew morale and dietary variety. Fastest cycle (25 days) provides fresh produce quickly. " +
                "Vitamin C source (14.8 mg/100g). Low resource cost.");
            item4.setNutritionalGapsAddressed(Arrays.asList("Vitamin C", "Dietary Variety"));
            plantingQueueItemRepository.save(item4);
        }

        // Priority 5: Crew well-being (herbs)
        Crop herbs = allCrops.stream().filter(c -> c.getName().equals("Herbs")).findFirst().orElse(null);
        if (herbs != null) {
            PlantingQueueItem item5 = new PlantingQueueItem();
            item5.setRank(5);
            item5.setCropId(herbs.getId());
            item5.setCropName(herbs.getName());
            item5.setGreenhouseId(greenhouse.getId());
            item5.setRecommendedPlantDate(Instant.now().plusSeconds(86400 * 10));
            item5.setMissionDay(currentMissionDay + 10);
            item5.setReason("LOW: Psychological well-being. Herbs enhance meal palatability, improving crew morale. " +
                "Highest Vitamin K (414 mcg/100g) and iron (3.2 mg/100g) among all crops. Continuous harvest model.");
            item5.setNutritionalGapsAddressed(Arrays.asList("Vitamin K", "Iron", "Crew Morale"));
            plantingQueueItemRepository.save(item5);
        }

        log.info("Seeded {} planting queue items with priority rankings", plantingQueueItemRepository.count());
    }

    private void seedConsumptionEntries() {
        if (consumptionEntryRepository.count() > 0) {
            log.info("Consumption entries already exist, skipping seed");
            return;
        }
        log.info("Seeding daily consumption entries for nutritional tracking...");

        List<Crop> allCrops = cropRepository.findAll();
        if (allCrops.isEmpty()) return;

        // Seed consumption data for the past 14 days (Mission Days 46-60)
        // Simulate realistic daily consumption patterns for 4 astronauts
        LocalDate today = LocalDate.now();

        for (int daysAgo = 14; daysAgo >= 0; daysAgo--) {
            LocalDate date = today.minusDays(daysAgo);

            // Daily consumption varies by crop type
            // Target: ~3000 kcal per astronaut per day = 12,000 kcal total crew

            // Lettuce: ~1.5 kg/day crew (225 kcal) - fresh greens daily
            Crop lettuce = allCrops.stream().filter(c -> c.getName().equals("Lettuce")).findFirst().orElse(null);
            if (lettuce != null) {
                createConsumptionEntry(date, lettuce, 1.5, 225.0);
            }

            // Potato: ~6 kg/day crew (4,620 kcal) - primary carb source
            Crop potato = allCrops.stream().filter(c -> c.getName().equals("Potato")).findFirst().orElse(null);
            if (potato != null) {
                createConsumptionEntry(date, potato, 6.0, 4620.0);
            }

            // Radish: ~0.8 kg/day crew (128 kcal) - supplemental variety
            Crop radish = allCrops.stream().filter(c -> c.getName().equals("Radish")).findFirst().orElse(null);
            if (radish != null) {
                createConsumptionEntry(date, radish, 0.8, 128.0);
            }

            // Beans: ~2.5 kg/day crew (2,500 kcal) - protein source
            Crop beans = allCrops.stream().filter(c -> c.getName().equals("Beans/Peas")).findFirst().orElse(null);
            if (beans != null) {
                createConsumptionEntry(date, beans, 2.5, 2500.0);
            }

            // Herbs: ~0.15 kg/day crew (34.5 kcal) - flavoring
            Crop herbs = allCrops.stream().filter(c -> c.getName().equals("Herbs")).findFirst().orElse(null);
            if (herbs != null) {
                createConsumptionEntry(date, herbs, 0.15, 34.5);
            }

            // Total per day: ~7,507 kcal from greenhouse (62.5% of crew needs)
            // Remaining ~4,493 kcal from stored food
        }

        log.info("Seeded {} consumption entries (14 days × 5 crops)", consumptionEntryRepository.count());

        // Calculate and log totals
        List<ConsumptionEntry> allEntries = consumptionEntryRepository.findAll();
        double totalKg = allEntries.stream().mapToDouble(ConsumptionEntry::getQuantityKg).sum();
        double totalKcal = allEntries.stream().mapToDouble(ConsumptionEntry::getCaloriesLogged).sum();
        double avgDailyKcal = totalKcal / 15; // 15 days
        double greenhouseFraction = avgDailyKcal / 12000.0;

        log.info("Total consumed: {:.1f} kg, {:.0f} kcal over 15 days", totalKg, totalKcal);
        log.info("Average daily: {:.0f} kcal ({:.1f}% from greenhouse, {:.1f}% from stored food)",
            avgDailyKcal, greenhouseFraction * 100, (1 - greenhouseFraction) * 100);
    }

    private void createConsumptionEntry(LocalDate date, Crop crop, double quantityKg, double calories) {
        ConsumptionEntry entry = new ConsumptionEntry();
        entry.setDate(date);
        entry.setCropId(crop.getId());
        entry.setQuantityKg(quantityKg);
        entry.setCaloriesLogged(calories);
        consumptionEntryRepository.save(entry);
    }

    private void seedSimulationHistory() {
        if (simulationRepository.count() > 0) {
            log.info("Simulation history already exists, skipping seed");
            return;
        }
        log.info("Seeding simulation history with AI learning runs...");

        // Simulation 1: Initial baseline run (completed)
        Simulation sim1 = new Simulation();
        sim1.setName("Baseline Conservative Strategy");
        sim1.setLearningGoal("Establish baseline performance with conservative resource management. " +
            "Prioritize food security over diversity. Minimize risk.");
        sim1.setStatus(SimulationStatus.COMPLETED);
        sim1.setCreatedAt(Instant.now().minusSeconds(86400 * 20)); // 20 days ago
        sim1.setCompletedAt(Instant.now().minusSeconds(86400 * 18));
        sim1.setMissionDuration(450);
        sim1.setCrewSize(4);
        sim1.setYieldTarget(0.60); // 60% of crew caloric needs
        sim1.setOutcomeScore(0.72); // Exceeded baseline
        sim1.setAutonomyLevel(AutonomyLevel.SUGGEST_ONLY);
        sim1.setRiskTolerance(RiskTolerance.CONSERVATIVE);
        sim1.setWaterLiters(50000.0);
        sim1.setNutrientKg(500.0);
        sim1.setEnergyKwh(100000.0);
        sim1.setCertaintyThreshold(0.85);
        sim1.setPriorityWeightYield(0.6);
        sim1.setPriorityWeightDiversity(0.2);
        sim1.setPriorityWeightResourceConservation(0.2);
        simulationRepository.save(sim1);

        // Simulation 2: Protein optimization run (completed)
        Simulation sim2 = new Simulation();
        sim2.setName("Protein-Focused Strategy");
        sim2.setLearningGoal("Maximize protein production to meet crew requirements without stored food supplementation. " +
            "Increase legume allocation by 40%.");
        sim2.setStatus(SimulationStatus.COMPLETED);
        sim2.setCreatedAt(Instant.now().minusSeconds(86400 * 15));
        sim2.setCompletedAt(Instant.now().minusSeconds(86400 * 13));
        sim2.setMissionDuration(450);
        sim2.setCrewSize(4);
        sim2.setYieldTarget(0.70);
        sim2.setOutcomeScore(0.81); // Significant improvement
        sim2.setAutonomyLevel(AutonomyLevel.HYBRID);
        sim2.setRiskTolerance(RiskTolerance.MODERATE);
        sim2.setWaterLiters(50000.0);
        sim2.setNutrientKg(500.0);
        sim2.setEnergyKwh(100000.0);
        sim2.setCertaintyThreshold(0.75);
        sim2.setPriorityWeightYield(0.5);
        sim2.setPriorityWeightDiversity(0.3);
        sim2.setPriorityWeightResourceConservation(0.2);
        simulationRepository.save(sim2);

        // Simulation 3: Water scarcity scenario (completed)
        Simulation sim3 = new Simulation();
        sim3.setName("Water Scarcity Resilience Test");
        sim3.setLearningGoal("Test agent response to water recycling degradation scenario (MCP KB 6.3). " +
            "Evaluate drought-tolerant crop prioritization.");
        sim3.setStatus(SimulationStatus.COMPLETED);
        sim3.setCreatedAt(Instant.now().minusSeconds(86400 * 10));
        sim3.setCompletedAt(Instant.now().minusSeconds(86400 * 8));
        sim3.setMissionDuration(450);
        sim3.setCrewSize(4);
        sim3.setYieldTarget(0.65);
        sim3.setOutcomeScore(0.68); // Maintained under stress
        sim3.setAutonomyLevel(AutonomyLevel.HYBRID);
        sim3.setRiskTolerance(RiskTolerance.MODERATE);
        sim3.setWaterLiters(40000.0); // Reduced water availability
        sim3.setNutrientKg(500.0);
        sim3.setEnergyKwh(100000.0);
        sim3.setCertaintyThreshold(0.70);
        sim3.setPriorityWeightYield(0.4);
        sim3.setPriorityWeightDiversity(0.3);
        sim3.setPriorityWeightResourceConservation(0.3);
        simulationRepository.save(sim3);

        // Simulation 4: Aggressive optimization (completed with poor outcome - learning opportunity)
        Simulation sim4 = new Simulation();
        sim4.setName("Aggressive Yield Maximization");
        sim4.setLearningGoal("Push resource limits to maximize caloric yield. Test upper bounds of greenhouse productivity. " +
            "RESULT: Failed due to resource exhaustion - valuable learning on sustainability limits.");
        sim4.setStatus(SimulationStatus.COMPLETED);
        sim4.setCreatedAt(Instant.now().minusSeconds(86400 * 5));
        sim4.setCompletedAt(Instant.now().minusSeconds(86400 * 4));
        sim4.setMissionDuration(450);
        sim4.setCrewSize(4);
        sim4.setYieldTarget(0.90); // Ambitious
        sim4.setOutcomeScore(0.42); // Poor outcome - resource exhaustion
        sim4.setAutonomyLevel(AutonomyLevel.FULLY_AUTONOMOUS);
        sim4.setRiskTolerance(RiskTolerance.AGGRESSIVE);
        sim4.setWaterLiters(50000.0);
        sim4.setNutrientKg(500.0);
        sim4.setEnergyKwh(100000.0);
        sim4.setCertaintyThreshold(0.60);
        sim4.setPriorityWeightYield(0.8);
        sim4.setPriorityWeightDiversity(0.1);
        sim4.setPriorityWeightResourceConservation(0.1);
        simulationRepository.save(sim4);

        // Simulation 5: Current optimal strategy (running)
        Simulation sim5 = new Simulation();
        sim5.setName("Balanced Nutrition & Resource Strategy");
        sim5.setLearningGoal("Apply learnings from previous runs. Balance protein, micronutrients, and resource efficiency. " +
            "Target 75% caloric self-sufficiency with full nutritional coverage.");
        sim5.setStatus(SimulationStatus.RUNNING);
        sim5.setCreatedAt(Instant.now().minusSeconds(86400 * 2));
        sim5.setCompletedAt(null);
        sim5.setMissionDuration(450);
        sim5.setCrewSize(4);
        sim5.setYieldTarget(0.75);
        sim5.setOutcomeScore(null); // Still running
        sim5.setAutonomyLevel(AutonomyLevel.HYBRID);
        sim5.setRiskTolerance(RiskTolerance.MODERATE);
        sim5.setWaterLiters(50000.0);
        sim5.setNutrientKg(500.0);
        sim5.setEnergyKwh(100000.0);
        sim5.setCertaintyThreshold(0.70);
        sim5.setPriorityWeightYield(0.4);
        sim5.setPriorityWeightDiversity(0.3);
        sim5.setPriorityWeightResourceConservation(0.3);
        simulationRepository.save(sim5);

        log.info("Seeded {} simulation runs (4 completed, 1 running)", simulationRepository.count());
        log.info("Learning progression: 0.72 → 0.81 → 0.68 (stress) → 0.42 (failed) → current run");
    }

    // ==================== CROP CREATION METHODS (MCP KB DATA) ====================

    /**
     * Source: MCP KB Section 3.3 - Leafy Greens – Lettuce (Lactuca sativa)
     * MICRONUTRIENT STABILIZER CROP - fast turnover, high edible biomass fraction
     * Role: Vitamin K, Vitamin A (beta-carotene), Folate, dietary diversity
     */
    private Crop createLettuce() {
        Crop lettuce = new Crop();
        lettuce.setName("Lettuce");
        lettuce.setCategory(CropCategory.VEGETABLE);

        // Growth characteristics (KB: 30-45 days, harvest index 0.7-0.9, yield 3-5 kg/m²)
        // Fast turnover makes lettuce suitable for continuous harvest systems
        lettuce.setGrowthDays(37); // midpoint of 30-45
        lettuce.setHarvestIndex(0.8); // midpoint of 0.7-0.9 (most biomass edible)
        lettuce.setTypicalYieldPerM2Kg(4.0); // midpoint of 3-5 kg/m²

        // Water requirement (KB: High water demand - tissue water content ~95%)
        // Nitrogen-sensitive crop, requires balanced N-P-K solution
        lettuce.setWaterRequirement(WaterRequirement.HIGH);

        // Environmental requirements (KB: 15-22°C optimal, low tolerance to environmental fluctuation)
        lettuce.setOptimalTempMinC(15.0);
        lettuce.setOptimalTempMaxC(22.0);
        lettuce.setHeatStressThresholdC(25.0); // Risk of bolting above this
        lettuce.setOptimalHumidityMinPct(50.0);
        lettuce.setOptimalHumidityMaxPct(70.0);
        lettuce.setLightRequirementParMin(150.0);
        lettuce.setLightRequirementParMax(250.0);
        lettuce.setOptimalCo2PpmMin(400.0);
        lettuce.setOptimalCo2PpmMax(800.0); // KB: Strong CO2 enrichment benefit
        lettuce.setOptimalPhMin(5.5);
        lettuce.setOptimalPhMax(6.5);

        // Nutritional profile (KB: per 100g fresh weight - ~15 kcal)
        lettuce.setCaloriesPer100g(15.0); // Low caloric density
        lettuce.setProteinG(1.4); // Low protein
        lettuce.setCarbsG(2.9);
        lettuce.setFatG(0.2);
        lettuce.setFiberG(1.3);
        lettuce.setVitaminAMcg(370.0); // Good source of Vitamin A (beta-carotene)
        lettuce.setVitaminCMg(9.0);
        lettuce.setVitaminKMcg(126.0); // Rich in Vitamin K - primary micronutrient supplier
        lettuce.setFolateMcg(38.0); // Moderate folate content
        lettuce.setIronMg(0.9);
        lettuce.setPotassiumMg(194.0);
        lettuce.setMagnesiumMg(13.0);

        // Stress sensitivities (KB: High sensitivity to heat, drought, N deficiency, moderate salinity)
        lettuce.setStressSensitivities(Arrays.asList(
            StressType.HEAT, // High sensitivity
            StressType.DROUGHT, // High sensitivity
            StressType.NUTRIENT_DEFICIENCY_N, // High sensitivity
            StressType.SALINITY // Moderate sensitivity
        ));

        return lettuce;
    }

    /**
     * Source: MCP KB Section 3.4 - Potatoes (Solanum tuberosum)
     * PRIMARY ENERGY SECURITY CROP - high calorie density, high yield per m²
     * Role: Carbohydrate backbone, caloric security, potassium source
     */
    private Crop createPotato() {
        Crop potato = new Crop();
        potato.setName("Potato");
        potato.setCategory(CropCategory.VEGETABLE);

        // Growth characteristics (KB: 70-120 days, harvest index 0.75, yield 4-8 kg/m²)
        // High caloric return per unit area, underground tuber development
        potato.setGrowthDays(95); // midpoint of 70-120
        potato.setHarvestIndex(0.75); // Excellent edible biomass fraction
        potato.setTypicalYieldPerM2Kg(6.0); // midpoint of 4-8 kg/m² - high yield

        // Water requirement (KB: Moderate to high water requirement)
        // High potassium demand, moderate nitrogen demand, sensitive to waterlogging
        potato.setWaterRequirement(WaterRequirement.HIGH);

        // Environmental requirements (KB: 16-20°C optimal, requires good root-zone aeration)
        potato.setOptimalTempMinC(16.0);
        potato.setOptimalTempMaxC(20.0);
        potato.setHeatStressThresholdC(26.5); // midpoint of 25-28°C from KB
        potato.setOptimalHumidityMinPct(60.0);
        potato.setOptimalHumidityMaxPct(80.0);
        potato.setLightRequirementParMin(200.0);
        potato.setLightRequirementParMax(400.0);
        potato.setOptimalCo2PpmMin(400.0);
        potato.setOptimalCo2PpmMax(1000.0); // Benefits from higher CO2 than other crops
        potato.setOptimalPhMin(5.5);
        potato.setOptimalPhMax(6.0);

        // Nutritional profile (KB: per 100g fresh weight - ~77 kcal)
        // Primary carbohydrate and caloric backbone per MCP KB Section 5.3.1
        potato.setCaloriesPer100g(77.0); // High calorie density compared to greens
        potato.setProteinG(2.0); // Low but additive protein contribution
        potato.setCarbsG(17.0); // Primary carbohydrate source
        potato.setFatG(0.1); // Low fat content
        potato.setFiberG(2.2);
        potato.setVitaminAMcg(0.0); // No Vitamin A
        potato.setVitaminCMg(19.7); // Some Vitamin C (better than expected for starch crop)
        potato.setVitaminKMcg(2.0); // Low Vitamin K
        potato.setFolateMcg(16.0);
        potato.setIronMg(0.8);
        potato.setPotassiumMg(425.0); // HIGHEST potassium among all crops - excellent source
        potato.setMagnesiumMg(23.0);

        // Stress sensitivities (KB: Moderate drought/heat, high root hypoxia sensitivity)
        potato.setStressSensitivities(Arrays.asList(
            StressType.DROUGHT, // Moderate sensitivity
            StressType.HEAT, // Moderate sensitivity
            StressType.ROOT_HYPOXIA, // High sensitivity - requires good aeration
            StressType.OVERWATERING // Sensitive to waterlogging
        ));

        return potato;
    }

    /**
     * Source: MCP KB Section 3.5 - Radishes (Raphanus sativus)
     * Fast-cycle root vegetable for dietary diversity
     */
    private Crop createRadish() {
        Crop radish = new Crop();
        radish.setName("Radish");
        radish.setCategory(CropCategory.VEGETABLE);

        // Growth characteristics (KB: 21-30 days, harvest index 0.6-0.8, yield 2-4 kg/m²)
        radish.setGrowthDays(25); // midpoint of 21-30 - very fast biomass turnover
        radish.setHarvestIndex(0.7); // midpoint of 0.6-0.8
        radish.setTypicalYieldPerM2Kg(3.0); // midpoint of 2-4 kg/m²

        // Water requirement (KB: Consistent moisture required, sensitive to inconsistent watering)
        radish.setWaterRequirement(WaterRequirement.MEDIUM);

        // Environmental requirements (KB: 15-22°C optimal, moderate light)
        radish.setOptimalTempMinC(15.0);
        radish.setOptimalTempMaxC(22.0);
        radish.setHeatStressThresholdC(24.0); // KB indicates heat sensitivity
        radish.setOptimalHumidityMinPct(50.0);
        radish.setOptimalHumidityMaxPct(70.0);
        radish.setLightRequirementParMin(150.0);
        radish.setLightRequirementParMax(300.0);
        radish.setOptimalCo2PpmMin(400.0);
        radish.setOptimalCo2PpmMax(800.0);
        radish.setOptimalPhMin(6.0);
        radish.setOptimalPhMax(7.0);

        // Nutritional profile (KB: per 100g fresh weight - ~16 kcal, Vitamin C source)
        radish.setCaloriesPer100g(16.0);
        radish.setProteinG(0.7);
        radish.setCarbsG(3.4);
        radish.setFatG(0.1);
        radish.setFiberG(1.6); // Moderate fiber
        radish.setVitaminAMcg(7.0);
        radish.setVitaminCMg(14.8); // Good Vitamin C source
        radish.setVitaminKMcg(1.3);
        radish.setFolateMcg(25.0);
        radish.setIronMg(0.3);
        radish.setPotassiumMg(233.0); // Good potassium content
        radish.setMagnesiumMg(10.0);

        // Stress sensitivities (KB: High sensitivity to water inconsistency, moderate heat)
        radish.setStressSensitivities(Arrays.asList(
            StressType.DROUGHT,
            StressType.OVERWATERING,
            StressType.HEAT,
            StressType.COLD // KB indicates cool-season crop
        ));

        return radish;
    }

    /**
     * Source: MCP KB Section 3.6 - Beans & Peas (Legumes)
     * Representative: Common bean (Phaseolus vulgaris) / Pea (Pisum sativum)
     * PRIMARY PROTEIN SOURCE for the mission
     */
    private Crop createBeansPeas() {
        Crop beans = new Crop();
        beans.setName("Beans/Peas");
        beans.setCategory(CropCategory.LEGUME);

        // Growth characteristics (KB: 50-70 days, harvest index 0.5-0.6, yield 2-4 kg/m²)
        beans.setGrowthDays(60); // midpoint of 50-70
        beans.setHarvestIndex(0.55); // midpoint of 0.5-0.6
        beans.setTypicalYieldPerM2Kg(3.0); // midpoint of 2-4 kg/m²

        // Water requirement (KB: Moderate water need, nitrogen-fixing capability)
        beans.setWaterRequirement(WaterRequirement.MEDIUM);

        // Environmental requirements (KB: 18-25°C optimal, good for pod development)
        beans.setOptimalTempMinC(18.0);
        beans.setOptimalTempMaxC(25.0);
        beans.setHeatStressThresholdC(28.0);
        beans.setOptimalHumidityMinPct(50.0);
        beans.setOptimalHumidityMaxPct(70.0);
        beans.setLightRequirementParMin(200.0);
        beans.setLightRequirementParMax(400.0);
        beans.setOptimalCo2PpmMin(400.0);
        beans.setOptimalCo2PpmMax(800.0); // Benefits from CO2 enrichment
        beans.setOptimalPhMin(6.0);
        beans.setOptimalPhMax(7.0);

        // Nutritional profile (KB: 80-120 kcal, 5-9g protein per 100g)
        // PRIMARY GREENHOUSE PROTEIN SOURCE per MCP KB Section 5.3.2
        beans.setCaloriesPer100g(100.0); // midpoint of 80-120
        beans.setProteinG(7.0); // midpoint of 5-9g - CRITICAL for crew protein requirements
        beans.setCarbsG(18.0);
        beans.setFatG(0.5);
        beans.setFiberG(6.0); // Fiber-rich - contributes to digestive health
        beans.setVitaminAMcg(15.0);
        beans.setVitaminCMg(12.0);
        beans.setVitaminKMcg(14.0);
        beans.setFolateMcg(106.0); // Good folate source
        beans.setIronMg(2.1); // Higher iron content than other crops
        beans.setPotassiumMg(352.0);
        beans.setMagnesiumMg(44.0); // Highest magnesium among the 5 crops

        // Stress sensitivities (KB: Moderate salinity, water stress, cold sensitive)
        beans.setStressSensitivities(Arrays.asList(
            StressType.SALINITY,
            StressType.DROUGHT,
            StressType.COLD,
            StressType.HEAT // Added for completeness
        ));

        return beans;
    }

    /**
     * Source: MCP KB Section 3.7 - Culinary Herbs (e.g., Basil, Chives)
     * Psychological well-being and dietary diversity role
     */
    private Crop createHerbs() {
        Crop herbs = new Crop();
        herbs.setName("Herbs");
        herbs.setCategory(CropCategory.HERB);

        // Growth characteristics (KB: Short cycle, low yield, psychological role)
        // NOTE: Minimal caloric contribution but important for crew morale
        herbs.setGrowthDays(30); // Fast continuous harvest cycles
        herbs.setHarvestIndex(0.5);
        herbs.setTypicalYieldPerM2Kg(1.0); // Low yield but high psychological value

        // Water requirement (KB: Moderate water needs)
        herbs.setWaterRequirement(WaterRequirement.MEDIUM);

        // Environmental requirements (basil representative per KB)
        herbs.setOptimalTempMinC(18.0);
        herbs.setOptimalTempMaxC(25.0);
        herbs.setHeatStressThresholdC(30.0); // More heat-tolerant than leafy greens
        herbs.setOptimalHumidityMinPct(40.0);
        herbs.setOptimalHumidityMaxPct(60.0);
        herbs.setLightRequirementParMin(200.0);
        herbs.setLightRequirementParMax(400.0);
        herbs.setOptimalCo2PpmMin(400.0);
        herbs.setOptimalCo2PpmMax(800.0);
        herbs.setOptimalPhMin(5.5);
        herbs.setOptimalPhMax(6.5);

        // Nutritional profile (KB: Minimal caloric contribution, high micronutrient density)
        herbs.setCaloriesPer100g(23.0);
        herbs.setProteinG(3.2);
        herbs.setCarbsG(2.7);
        herbs.setFatG(0.6);
        herbs.setFiberG(1.6);
        herbs.setVitaminAMcg(264.0); // Good Vitamin A
        herbs.setVitaminCMg(18.0);
        herbs.setVitaminKMcg(414.0); // HIGHEST Vitamin K among all crops
        herbs.setFolateMcg(68.0);
        herbs.setIronMg(3.2); // HIGHEST iron content among all 5 crops
        herbs.setPotassiumMg(295.0);
        herbs.setMagnesiumMg(64.0); // Second highest magnesium after beans

        // Stress sensitivities (KB: Cold sensitive, drought sensitive)
        herbs.setStressSensitivities(Arrays.asList(
            StressType.COLD, // Primary sensitivity
            StressType.DROUGHT,
            StressType.OVERWATERING // Added based on typical herb cultivation knowledge
        ));

        return herbs;
    }
}

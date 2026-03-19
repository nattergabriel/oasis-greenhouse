package com.example.managementbackend.service.impl;

import com.example.managementbackend.domain.Crop;
import com.example.managementbackend.domain.Greenhouse;
import com.example.managementbackend.domain.MissionConfig;
import com.example.managementbackend.domain.PlantSlot;
import com.example.managementbackend.model.enums.CropCategory;
import com.example.managementbackend.model.enums.GreenhouseStatus;
import com.example.managementbackend.model.enums.SlotStatus;
import com.example.managementbackend.model.enums.StressType;
import com.example.managementbackend.model.enums.WaterRequirement;
import com.example.managementbackend.repository.CropRepository;
import com.example.managementbackend.repository.GreenhouseRepository;
import com.example.managementbackend.repository.MissionConfigRepository;
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

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void seedDatabase() {
        log.info("Starting database seeding...");
        seedCrops();
        seedGreenhouse();
        seedMissionConfig();
        log.info("Database seeding completed successfully");
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

        log.info("Seeding greenhouse...");

        Greenhouse greenhouse = new Greenhouse();
        greenhouse.setName("Mars Greenhouse Alpha");
        greenhouse.setDescription("Primary hydroponic greenhouse for 450-day Mars surface mission");
        greenhouse.setRows(4);
        greenhouse.setCols(15);
        greenhouse.setOverallStatus(GreenhouseStatus.HEALTHY);
        greenhouse.setCreatedAt(Instant.now());

        // Create 4x15 = 60 plant slots
        for (int row = 0; row < 4; row++) {
            for (int col = 0; col < 15; col++) {
                PlantSlot slot = new PlantSlot();
                slot.setSlotRow(row);
                slot.setSlotCol(col);
                slot.setStatus(SlotStatus.EMPTY);
                slot.setGrowthStagePercent(0.0);
                slot.setGreenhouse(greenhouse);
                greenhouse.getSlots().add(slot);
            }
        }

        greenhouseRepository.save(greenhouse);
        log.info("Seeded greenhouse with {} slots", greenhouse.getSlots().size());
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
        log.warn("Clearing all seeded data...");
        greenhouseRepository.deleteAll();
        cropRepository.deleteAll();
        missionConfigRepository.deleteAll();
        log.info("All data cleared");
    }

    // ==================== CROP CREATION METHODS (MCP KB DATA) ====================

    /**
     * Source: MCP KB Section 3.3 - Leafy Greens – Lettuce (Lactuca sativa)
     */
    private Crop createLettuce() {
        Crop lettuce = new Crop();
        lettuce.setName("Lettuce");
        lettuce.setCategory(CropCategory.VEGETABLE);

        // Growth characteristics (KB: 30-45 days, harvest index 0.7-0.9, yield 3-5 kg/m²)
        lettuce.setGrowthDays(37); // midpoint of 30-45
        lettuce.setHarvestIndex(0.8);
        lettuce.setTypicalYieldPerM2Kg(4.0);

        // Water requirement (KB: High water demand)
        lettuce.setWaterRequirement(WaterRequirement.HIGH);

        // Environmental requirements
        lettuce.setOptimalTempMinC(15.0);
        lettuce.setOptimalTempMaxC(22.0);
        lettuce.setHeatStressThresholdC(25.0);
        lettuce.setOptimalHumidityMinPct(50.0);
        lettuce.setOptimalHumidityMaxPct(70.0);
        lettuce.setLightRequirementParMin(150.0);
        lettuce.setLightRequirementParMax(250.0);
        lettuce.setOptimalCo2PpmMin(400.0);
        lettuce.setOptimalCo2PpmMax(800.0);
        lettuce.setOptimalPhMin(5.5);
        lettuce.setOptimalPhMax(6.5);

        // Nutritional profile (KB: per 100g fresh weight)
        lettuce.setCaloriesPer100g(15.0);
        lettuce.setProteinG(1.4);
        lettuce.setCarbsG(2.9);
        lettuce.setFatG(0.2);
        lettuce.setFiberG(1.3);
        lettuce.setVitaminAMcg(370.0); // Good source of Vitamin A
        lettuce.setVitaminCMg(9.0);
        lettuce.setVitaminKMcg(126.0); // Rich in Vitamin K
        lettuce.setFolateMcg(38.0); // Moderate folate
        lettuce.setIronMg(0.9);
        lettuce.setPotassiumMg(194.0);
        lettuce.setMagnesiumMg(13.0);

        // Stress sensitivities (KB: High sensitivity to heat, drought, N deficiency)
        lettuce.setStressSensitivities(Arrays.asList(
            StressType.HEAT,
            StressType.DROUGHT,
            StressType.NUTRIENT_DEFICIENCY_N,
            StressType.SALINITY
        ));

        return lettuce;
    }

    /**
     * Source: MCP KB Section 3.4 - Potatoes (Solanum tuberosum)
     */
    private Crop createPotato() {
        Crop potato = new Crop();
        potato.setName("Potato");
        potato.setCategory(CropCategory.VEGETABLE);

        // Growth characteristics (KB: 70-120 days, harvest index 0.75, yield 4-8 kg/m²)
        potato.setGrowthDays(95); // midpoint of 70-120
        potato.setHarvestIndex(0.75);
        potato.setTypicalYieldPerM2Kg(6.0);

        // Water requirement (KB: Moderate to high)
        potato.setWaterRequirement(WaterRequirement.HIGH);

        // Environmental requirements
        potato.setOptimalTempMinC(16.0);
        potato.setOptimalTempMaxC(20.0);
        potato.setHeatStressThresholdC(26.0); // midpoint of 25-28
        potato.setOptimalHumidityMinPct(60.0);
        potato.setOptimalHumidityMaxPct(80.0);
        potato.setLightRequirementParMin(200.0);
        potato.setLightRequirementParMax(400.0);
        potato.setOptimalCo2PpmMin(400.0);
        potato.setOptimalCo2PpmMax(1000.0);
        potato.setOptimalPhMin(5.5);
        potato.setOptimalPhMax(6.0);

        // Nutritional profile (KB: per 100g fresh weight)
        potato.setCaloriesPer100g(77.0);
        potato.setProteinG(2.0);
        potato.setCarbsG(17.0);
        potato.setFatG(0.1);
        potato.setFiberG(2.2);
        potato.setVitaminAMcg(0.0);
        potato.setVitaminCMg(19.7);
        potato.setVitaminKMcg(2.0);
        potato.setFolateMcg(16.0);
        potato.setIronMg(0.8);
        potato.setPotassiumMg(425.0); // Good potassium source
        potato.setMagnesiumMg(23.0);

        // Stress sensitivities (KB: Moderate drought/heat, high root hypoxia)
        potato.setStressSensitivities(Arrays.asList(
            StressType.DROUGHT,
            StressType.HEAT,
            StressType.ROOT_HYPOXIA,
            StressType.OVERWATERING
        ));

        return potato;
    }

    /**
     * Source: MCP KB Section 3.5 - Radishes (Raphanus sativus)
     */
    private Crop createRadish() {
        Crop radish = new Crop();
        radish.setName("Radish");
        radish.setCategory(CropCategory.VEGETABLE);

        // Growth characteristics (KB: 21-30 days, harvest index 0.6-0.8, yield 2-4 kg/m²)
        radish.setGrowthDays(25); // midpoint of 21-30
        radish.setHarvestIndex(0.7);
        radish.setTypicalYieldPerM2Kg(3.0);

        // Water requirement (KB: Consistent moisture required)
        radish.setWaterRequirement(WaterRequirement.MEDIUM);

        // Environmental requirements
        radish.setOptimalTempMinC(15.0);
        radish.setOptimalTempMaxC(22.0);
        radish.setHeatStressThresholdC(24.0);
        radish.setOptimalHumidityMinPct(50.0);
        radish.setOptimalHumidityMaxPct(70.0);
        radish.setLightRequirementParMin(150.0);
        radish.setLightRequirementParMax(300.0);
        radish.setOptimalCo2PpmMin(400.0);
        radish.setOptimalCo2PpmMax(800.0);
        radish.setOptimalPhMin(6.0);
        radish.setOptimalPhMax(7.0);

        // Nutritional profile (KB: per 100g fresh weight)
        radish.setCaloriesPer100g(16.0);
        radish.setProteinG(0.7);
        radish.setCarbsG(3.4);
        radish.setFatG(0.1);
        radish.setFiberG(1.6); // Moderate fiber
        radish.setVitaminAMcg(7.0);
        radish.setVitaminCMg(14.8); // Vitamin C source
        radish.setVitaminKMcg(1.3);
        radish.setFolateMcg(25.0);
        radish.setIronMg(0.3);
        radish.setPotassiumMg(233.0);
        radish.setMagnesiumMg(10.0);

        // Stress sensitivities (KB: High water inconsistency, moderate heat)
        radish.setStressSensitivities(Arrays.asList(
            StressType.DROUGHT,
            StressType.OVERWATERING,
            StressType.HEAT
        ));

        return radish;
    }

    /**
     * Source: MCP KB Section 3.6 - Beans & Peas (Legumes)
     * Representative: Common bean (Phaseolus vulgaris) / Pea (Pisum sativum)
     */
    private Crop createBeansPeas() {
        Crop beans = new Crop();
        beans.setName("Beans/Peas");
        beans.setCategory(CropCategory.LEGUME);

        // Growth characteristics (KB: 50-70 days, harvest index 0.5-0.6, yield 2-4 kg/m²)
        beans.setGrowthDays(60); // midpoint of 50-70
        beans.setHarvestIndex(0.55);
        beans.setTypicalYieldPerM2Kg(3.0);

        // Water requirement (KB: Moderate water need)
        beans.setWaterRequirement(WaterRequirement.MEDIUM);

        // Environmental requirements
        beans.setOptimalTempMinC(18.0);
        beans.setOptimalTempMaxC(25.0);
        beans.setHeatStressThresholdC(28.0);
        beans.setOptimalHumidityMinPct(50.0);
        beans.setOptimalHumidityMaxPct(70.0);
        beans.setLightRequirementParMin(200.0);
        beans.setLightRequirementParMax(400.0);
        beans.setOptimalCo2PpmMin(400.0);
        beans.setOptimalCo2PpmMax(800.0);
        beans.setOptimalPhMin(6.0);
        beans.setOptimalPhMax(7.0);

        // Nutritional profile (KB: 80-120 kcal, 5-9g protein per 100g)
        beans.setCaloriesPer100g(100.0); // midpoint
        beans.setProteinG(7.0); // midpoint - PRIMARY PROTEIN SOURCE
        beans.setCarbsG(18.0);
        beans.setFatG(0.5);
        beans.setFiberG(6.0); // Fiber-rich
        beans.setVitaminAMcg(15.0);
        beans.setVitaminCMg(12.0);
        beans.setVitaminKMcg(14.0);
        beans.setFolateMcg(106.0);
        beans.setIronMg(2.1);
        beans.setPotassiumMg(352.0);
        beans.setMagnesiumMg(44.0);

        // Stress sensitivities (KB: Moderate salinity, water stress)
        beans.setStressSensitivities(Arrays.asList(
            StressType.SALINITY,
            StressType.DROUGHT,
            StressType.COLD
        ));

        return beans;
    }

    /**
     * Source: MCP KB Section 3.7 - Culinary Herbs (e.g., Basil, Chives)
     */
    private Crop createHerbs() {
        Crop herbs = new Crop();
        herbs.setName("Herbs");
        herbs.setCategory(CropCategory.HERB);

        // Growth characteristics (KB: Short cycle, low yield, psychological role)
        herbs.setGrowthDays(30);
        herbs.setHarvestIndex(0.5);
        herbs.setTypicalYieldPerM2Kg(1.0);

        // Water requirement
        herbs.setWaterRequirement(WaterRequirement.MEDIUM);

        // Environmental requirements (basil representative)
        herbs.setOptimalTempMinC(18.0);
        herbs.setOptimalTempMaxC(25.0);
        herbs.setHeatStressThresholdC(30.0);
        herbs.setOptimalHumidityMinPct(40.0);
        herbs.setOptimalHumidityMaxPct(60.0);
        herbs.setLightRequirementParMin(200.0);
        herbs.setLightRequirementParMax(400.0);
        herbs.setOptimalCo2PpmMin(400.0);
        herbs.setOptimalCo2PpmMax(800.0);
        herbs.setOptimalPhMin(5.5);
        herbs.setOptimalPhMax(6.5);

        // Nutritional profile (KB: Minimal caloric contribution)
        herbs.setCaloriesPer100g(23.0);
        herbs.setProteinG(3.2);
        herbs.setCarbsG(2.7);
        herbs.setFatG(0.6);
        herbs.setFiberG(1.6);
        herbs.setVitaminAMcg(264.0);
        herbs.setVitaminCMg(18.0);
        herbs.setVitaminKMcg(414.0);
        herbs.setFolateMcg(68.0);
        herbs.setIronMg(3.2);
        herbs.setPotassiumMg(295.0);
        herbs.setMagnesiumMg(64.0);

        // Stress sensitivities
        herbs.setStressSensitivities(Arrays.asList(
            StressType.COLD,
            StressType.DROUGHT
        ));

        return herbs;
    }
}

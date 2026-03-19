package com.example.managementbackend.service.impl;

import com.example.managementbackend.domain.ConsumptionEntry;
import com.example.managementbackend.domain.Crop;
import com.example.managementbackend.domain.StoredFood;
import com.example.managementbackend.dto.request.nutrition.LogConsumptionRequest;
import com.example.managementbackend.dto.response.nutrition.ConsumptionLogResponse;
import com.example.managementbackend.dto.response.nutrition.CoverageHeatmapResponse;
import com.example.managementbackend.dto.response.nutrition.DailyNutritionEntryDto;
import com.example.managementbackend.dto.response.nutrition.LogConsumptionResponse;
import com.example.managementbackend.dto.response.nutrition.StoredFoodResponse;
import com.example.managementbackend.model.shared.MicronutrientsDto;
import com.example.managementbackend.repository.ConsumptionEntryRepository;
import com.example.managementbackend.repository.CropRepository;
import com.example.managementbackend.repository.StoredFoodRepository;
import com.example.managementbackend.service.NutritionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class NutritionServiceImpl implements NutritionService {

    private static final Long STORED_FOOD_SINGLETON_ID = 1L;
    private static final int DEFAULT_CREW_SIZE = 4;
    private static final double TARGET_CALORIES_PER_PERSON_PER_DAY = 2500.0;
    private static final int MISSION_DURATION_DAYS = 450;

    // Nutritional macro assumptions (15% protein, 55% carbs, 30% fat)
    private static final double PROTEIN_RATIO = 0.15;
    private static final double CARBS_RATIO = 0.55;
    private static final double FAT_RATIO = 0.30;
    private static final double FIBER_ESTIMATE_RATIO = 0.02;

    // Calories per gram of macronutrient
    private static final double CALORIES_PER_GRAM_PROTEIN = 4.0;
    private static final double CALORIES_PER_GRAM_CARBS = 4.0;
    private static final double CALORIES_PER_GRAM_FAT = 9.0;
    private static final double CALORIES_PER_GRAM_FIBER = 2.0;

    private final ConsumptionEntryRepository consumptionEntryRepository;
    private final CropRepository cropRepository;
    private final StoredFoodRepository storedFoodRepository;

    @Override
    public ConsumptionLogResponse getConsumptionLog(String from, String to) {
        log.debug("Fetching consumption log: from={}, to={}", from, to);

        LocalDate fromDate;
        LocalDate toDate;
        try {
            fromDate = LocalDate.parse(from);
            toDate = LocalDate.parse(to);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid date format. Expected ISO-8601 date format (YYYY-MM-DD).", e);
        }

        if (fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("'from' date cannot be after 'to' date");
        }

        List<ConsumptionEntry> entries = consumptionEntryRepository.findByDateBetween(fromDate, toDate);

        // Group entries by date
        List<DailyNutritionEntryDto> dailyEntries = new ArrayList<>();
        LocalDate currentDate = fromDate;

        while (!currentDate.isAfter(toDate)) {
            final LocalDate date = currentDate;
            List<ConsumptionEntry> dayEntries = entries.stream()
                .filter(entry -> entry.getDate().equals(date))
                .toList();

            DailyNutritionEntryDto dailyEntry = aggregateDailyNutrition(date, dayEntries);
            dailyEntries.add(dailyEntry);

            currentDate = currentDate.plusDays(1);
        }

        log.info("Retrieved consumption log: {} days, {} total entries", dailyEntries.size(), entries.size());

        return new ConsumptionLogResponse(from, to, DEFAULT_CREW_SIZE, dailyEntries);
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public LogConsumptionResponse logConsumption(LogConsumptionRequest request) {
        log.debug("Logging consumption: cropId={}, quantityKg={}, date={}",
            request.cropId(), request.quantityKg(), request.date());

        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }

        ConsumptionEntry entry = new ConsumptionEntry();

        try {
            entry.setDate(LocalDate.parse(request.date()));
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid date format. Expected ISO-8601 date format (YYYY-MM-DD).", e);
        }

        entry.setCropId(request.cropId());
        entry.setQuantityKg(request.quantityKg());

        // Calculate calories based on crop nutritional profile
        Crop crop = cropRepository.findById(request.cropId())
            .orElseThrow(() -> {
                log.warn("Crop not found: cropId={}", request.cropId());
                return new IllegalArgumentException("Crop not found");
            });

        // calories = (caloriesPer100g * quantityKg * 1000) / 100
        double calories = (crop.getCaloriesPer100g() * request.quantityKg() * 1000.0) / 100.0;
        entry.setCaloriesLogged(calories);

        ConsumptionEntry saved = consumptionEntryRepository.save(entry);
        log.info("Logged consumption: id={}, cropId={}, calories={}", saved.getId(), saved.getCropId(), saved.getCaloriesLogged());

        return new LogConsumptionResponse(saved.getId(), saved.getCaloriesLogged());
    }

    @Override
    public StoredFoodResponse getStoredFood() {
        log.debug("Fetching stored food status");

        StoredFood storedFood = storedFoodRepository.findById(STORED_FOOD_SINGLETON_ID)
            .orElseGet(this::createDefaultStoredFood);

        log.info("Stored food: total={}, remaining={}", storedFood.getTotalCalories(), storedFood.getRemainingCalories());

        return new StoredFoodResponse(storedFood.getTotalCalories(), storedFood.getRemainingCalories());
    }

    @Override
    public CoverageHeatmapResponse getCoverageHeatmap(Integer fromDay, Integer toDay) {
        log.debug("Generating coverage heatmap: fromDay={}, toDay={}", fromDay, toDay);

        // TODO: Implement real nutritional coverage tracking
        // For hackathon, return mock heatmap data showing coverage trends

        int startDay = fromDay != null ? fromDay : 0;
        int endDay = toDay != null ? toDay : 30;

        List<String> nutrients = List.of(
            "Calories", "Protein", "Vitamin A", "Vitamin C", "Vitamin K", "Folate", "Iron"
        );

        List<Integer> missionDays = new ArrayList<>();
        for (int day = startDay; day <= endDay; day++) {
            missionDays.add(day);
        }

        // Generate mock coverage data (7 nutrients × days)
        List<List<Double>> coverage = new ArrayList<>();
        for (int i = 0; i < nutrients.size(); i++) {
            List<Double> nutrientCoverage = new ArrayList<>();
            for (int day = startDay; day <= endDay; day++) {
                // Simulate increasing coverage over time with some variation
                double baseCoverage = 0.5 + (day / (double) endDay) * 0.4;
                double variation = Math.sin(day * 0.5) * 0.1;
                double value = Math.max(0.0, Math.min(1.0, baseCoverage + variation));
                nutrientCoverage.add(Math.round(value * 100.0) / 100.0);
            }
            coverage.add(nutrientCoverage);
        }

        log.info("Generated heatmap: {} nutrients, {} days", nutrients.size(), missionDays.size());

        return new CoverageHeatmapResponse(nutrients, missionDays, coverage);
    }

    // Private helper methods

    private DailyNutritionEntryDto aggregateDailyNutrition(LocalDate date, List<ConsumptionEntry> entries) {
        double totalCalories = entries.stream()
            .mapToDouble(ConsumptionEntry::getCaloriesLogged)
            .sum();

        double targetCalories = TARGET_CALORIES_PER_PERSON_PER_DAY * DEFAULT_CREW_SIZE;
        double coveragePercent = (totalCalories / targetCalories) * 100.0;

        // Simplified nutritional aggregation (would need detailed tracking)
        double proteinG = totalCalories * PROTEIN_RATIO / CALORIES_PER_GRAM_PROTEIN;
        double carbsG = totalCalories * CARBS_RATIO / CALORIES_PER_GRAM_CARBS;
        double fatG = totalCalories * FAT_RATIO / CALORIES_PER_GRAM_FAT;
        double fiberG = totalCalories * FIBER_ESTIMATE_RATIO / CALORIES_PER_GRAM_FIBER;

        MicronutrientsDto micronutrients = new MicronutrientsDto(
            800.0, 90.0, 120.0, 400.0, 18.0, 3500.0, 400.0
        );

        // Assume 50% from greenhouse for simulation
        double ghFraction = 0.5;
        int micronutrientsCovered = 5; // Simplified

        return new DailyNutritionEntryDto(
            date.toString(),
            totalCalories,
            proteinG,
            carbsG,
            fatG,
            fiberG,
            targetCalories,
            coveragePercent,
            micronutrients,
            ghFraction,
            ghFraction,
            micronutrientsCovered
        );
    }

    private synchronized StoredFood createDefaultStoredFood() {
        // Double-check pattern to prevent race condition
        return storedFoodRepository.findById(STORED_FOOD_SINGLETON_ID)
            .orElseGet(() -> {
                log.debug("Creating default stored food entry");
                StoredFood storedFood = new StoredFood();
                storedFood.setId(STORED_FOOD_SINGLETON_ID);
                // crew × days × kcal/day
                double totalCalories = DEFAULT_CREW_SIZE * MISSION_DURATION_DAYS * TARGET_CALORIES_PER_PERSON_PER_DAY;
                storedFood.setTotalCalories(totalCalories);
                storedFood.setRemainingCalories(totalCalories);
                return storedFoodRepository.save(storedFood);
            });
    }
}

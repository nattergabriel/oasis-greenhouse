package com.example.managementbackend.dto.response.nutrition;
import com.example.managementbackend.model.shared.MicronutrientsDto;
public record DailyNutritionEntryDto(
    String date,
    double totalCalories, double proteinG, double carbsG, double fatG, double fiberG,
    double targetCalories, double coveragePercent,
    MicronutrientsDto micronutrients,
    double calorieGhFraction, double proteinGhFraction,
    int micronutrientsCovered
) {}

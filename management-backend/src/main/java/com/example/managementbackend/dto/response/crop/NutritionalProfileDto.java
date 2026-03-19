package com.example.managementbackend.dto.response.crop;
import com.example.managementbackend.model.shared.MicronutrientsDto;
public record NutritionalProfileDto(
    double caloriesPer100g, double proteinG, double carbsG, double fatG, double fiberG,
    MicronutrientsDto micronutrients
) {}

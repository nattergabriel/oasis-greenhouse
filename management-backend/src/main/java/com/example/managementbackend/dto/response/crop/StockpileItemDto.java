package com.example.managementbackend.dto.response.crop;
public record StockpileItemDto(
    String cropId, String cropName,
    double quantityKg, double estimatedCalories,
    double daysOfSupply, Integer expiresInDays
) {}

package com.example.managementbackend.dto.response.crop;
public record EnvironmentalRequirementsDto(
    double optimalTempMinC, double optimalTempMaxC, double heatStressThresholdC,
    double optimalHumidityMinPct, double optimalHumidityMaxPct,
    double lightRequirementParMin, double lightRequirementParMax,
    double optimalCo2PpmMin, double optimalCo2PpmMax,
    double optimalPhMin, double optimalPhMax
) {}

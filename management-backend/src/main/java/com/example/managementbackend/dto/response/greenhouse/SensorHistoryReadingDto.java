package com.example.managementbackend.dto.response.greenhouse;
public record SensorHistoryReadingDto(
    String timestamp,
    double temperature, double humidity,
    double lightIntensity, double par, double co2,
    double waterFlowRate, double waterRecyclingEfficiency,
    double nutrientSolutionPh, double nutrientSolutionEc, double nutrientSolutionDissolvedOxygen
) {}

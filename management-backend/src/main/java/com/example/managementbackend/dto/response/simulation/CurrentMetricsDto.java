package com.example.managementbackend.dto.response.simulation;
public record CurrentMetricsDto(
    int missionDay,
    double waterReservePercent, double nutrientReservePercent,
    double energyReservePercent, double totalYieldKg
) {}

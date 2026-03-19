package com.example.managementbackend.dto.response.forecast;
import com.example.managementbackend.model.enums.RiskLevel;
public record ResourceProjectionDto(
    int missionDay,
    double waterReservePercent, double nutrientReservePercent, double energyReservePercent,
    RiskLevel riskLevel
) {}

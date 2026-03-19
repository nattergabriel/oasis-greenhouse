package com.example.managementbackend.dto.request.simulation;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
public record InjectScenarioRequest(
    @NotNull String scenarioId,
    @NotNull @DecimalMin("0.0") @DecimalMax("1.0") Double intensity,
    Integer durationMinutes
) {}

package com.example.managementbackend.dto.request.simulation;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
public record ResourceAvailabilityRequest(
    @NotNull @Positive Double waterLiters,
    @NotNull @Positive Double nutrientKg,
    @NotNull @Positive Double energyKwh
) {}

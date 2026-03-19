package com.example.managementbackend.dto.request.nutrition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
public record LogConsumptionRequest(
    @NotBlank String date,
    @NotNull String cropId,
    @NotNull @Positive Double quantityKg
) {}

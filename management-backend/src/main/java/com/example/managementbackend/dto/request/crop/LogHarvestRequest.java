package com.example.managementbackend.dto.request.crop;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
public record LogHarvestRequest(
    @NotNull String cropId,
    @NotNull String slotId,
    @NotNull @Positive Double yieldKg,
    @NotBlank String harvestedAt,
    String notes
) {}

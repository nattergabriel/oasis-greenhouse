package com.example.managementbackend.dto.request.crop;
import jakarta.validation.constraints.Positive;
public record UpdateHarvestRequest(@Positive Double yieldKg, String notes) {}

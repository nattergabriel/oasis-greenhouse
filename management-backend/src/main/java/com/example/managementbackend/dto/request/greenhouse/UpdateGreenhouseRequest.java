package com.example.managementbackend.dto.request.greenhouse;
import jakarta.validation.constraints.Min;
public record UpdateGreenhouseRequest(
    String name,
    String description,
    @Min(1) Integer rows,
    @Min(1) Integer cols
) {}

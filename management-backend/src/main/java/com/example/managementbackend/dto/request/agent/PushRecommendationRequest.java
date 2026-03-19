package com.example.managementbackend.dto.request.agent;
import com.example.managementbackend.model.enums.Urgency;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
public record PushRecommendationRequest(
    @NotBlank @Size(max = 100) String actionType,
    @NotBlank @Size(max = 500) String description,
    @NotBlank @Size(max = 5000) String reasoning,
    @NotNull @DecimalMin("0.0") @DecimalMax("1.0") Double confidence,
    @NotNull Urgency urgency,
    String expiresAt
) {}

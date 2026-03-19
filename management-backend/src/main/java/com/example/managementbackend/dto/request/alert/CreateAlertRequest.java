package com.example.managementbackend.dto.request.alert;
import com.example.managementbackend.model.enums.AlertSeverity;
import com.example.managementbackend.model.enums.AlertType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
public record CreateAlertRequest(
    @NotNull AlertSeverity severity,
    @NotNull AlertType type,
    String cropId,
    String slotId,
    String greenhouseId,
    @NotBlank @Size(max = 2000) String diagnosis,
    @NotNull @DecimalMin("0.0") @DecimalMax("1.0") Double confidence,
    @NotBlank @Size(max = 500) String suggestedAction
) {}

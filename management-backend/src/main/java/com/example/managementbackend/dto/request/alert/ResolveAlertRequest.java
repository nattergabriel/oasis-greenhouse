package com.example.managementbackend.dto.request.alert;
import jakarta.validation.constraints.NotBlank;
public record ResolveAlertRequest(@NotBlank String resolution) {}

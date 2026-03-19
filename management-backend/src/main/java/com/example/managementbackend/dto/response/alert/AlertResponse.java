package com.example.managementbackend.dto.response.alert;
import com.example.managementbackend.model.enums.AlertSeverity;
import com.example.managementbackend.model.enums.AlertStatus;
import com.example.managementbackend.model.enums.AlertType;
public record AlertResponse(
    String id, String createdAt, String resolvedAt,
    AlertSeverity severity, AlertType type,
    String cropId, String slotId, String greenhouseId,
    String diagnosis, double confidence,
    AlertStatus status, boolean escalatedToHuman,
    String suggestedAction
) {}

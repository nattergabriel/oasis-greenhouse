package com.example.managementbackend.dto.response.alert;
import com.example.managementbackend.model.enums.AlertStatus;
public record ResolveAlertResponse(String id, AlertStatus status, String resolvedAt) {}

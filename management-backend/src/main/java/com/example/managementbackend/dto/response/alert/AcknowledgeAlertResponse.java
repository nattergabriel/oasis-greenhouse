package com.example.managementbackend.dto.response.alert;
import com.example.managementbackend.model.enums.AlertStatus;
public record AcknowledgeAlertResponse(String id, AlertStatus status) {}

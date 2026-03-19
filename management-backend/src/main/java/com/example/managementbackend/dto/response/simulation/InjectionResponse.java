package com.example.managementbackend.dto.response.simulation;
import com.example.managementbackend.model.enums.InjectionStatus;
public record InjectionResponse(
    String id, String scenarioId, String scenarioName,
    String triggeredAt, String resolvedAt,
    double intensity, InjectionStatus status
) {}

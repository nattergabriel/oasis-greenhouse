package com.example.managementbackend.dto.response.simulation;
import com.example.managementbackend.model.enums.InjectionStatus;
public record CreateInjectionResponse(
    String id, String scenarioId,
    String triggeredAt, String estimatedResolutionAt,
    InjectionStatus status
) {}

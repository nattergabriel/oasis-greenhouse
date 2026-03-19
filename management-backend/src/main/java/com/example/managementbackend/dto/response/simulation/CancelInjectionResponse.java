package com.example.managementbackend.dto.response.simulation;
import com.example.managementbackend.model.enums.InjectionStatus;
public record CancelInjectionResponse(String id, InjectionStatus status, String resolvedAt) {}

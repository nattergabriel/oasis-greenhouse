package com.example.managementbackend.dto.response.scenario;
import com.example.managementbackend.model.enums.ScenarioSeverity;
import com.example.managementbackend.model.enums.ScenarioType;
public record ScenarioResponse(
    String id, String name, ScenarioType type, String description,
    ScenarioSeverity severity, Integer defaultDurationMinutes
) {}

package com.example.managementbackend.dto.response.simulation;
import com.example.managementbackend.model.enums.AutonomyLevel;
import com.example.managementbackend.model.enums.RiskTolerance;
import com.example.managementbackend.model.enums.SimulationStatus;
import com.example.managementbackend.model.shared.AgentConfigDto;
public record SimulationDetailResponse(
    String id, String name, String learningGoal,
    SimulationStatus status, String createdAt, String completedAt,
    int missionDuration, int crewSize, double yieldTarget,
    Double outcomeScore, AutonomyLevel autonomyLevel, RiskTolerance riskTolerance,
    ResourceAvailabilityDto resourceAvailability,
    AgentConfigDto agentConfig,
    CurrentMetricsDto currentMetrics
) {}

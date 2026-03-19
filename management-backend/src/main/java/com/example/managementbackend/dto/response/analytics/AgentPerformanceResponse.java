package com.example.managementbackend.dto.response.analytics;
import com.example.managementbackend.model.enums.SimulationStatus;
public record AgentPerformanceResponse(
    String simulationId, String simulationName,
    SimulationStatus status,
    double decisionAccuracyPercent,
    double avgResponseTimeMs,
    double resourceEfficiencyScore,
    double nutritionalTargetHitRate,
    double diversityScore,
    int autonomousActionsCount,
    int humanOverridesCount,
    double crisisResponseScore
) {}

package com.example.managementbackend.dto.response.simulation;
import com.example.managementbackend.model.enums.AutonomyLevel;
import com.example.managementbackend.model.enums.RiskTolerance;
import com.example.managementbackend.model.enums.SimulationStatus;
public record SimulationSummaryResponse(
    String id, String name, String learningGoal,
    SimulationStatus status, String createdAt, String completedAt,
    int missionDuration, int crewSize, double yieldTarget,
    Double outcomeScore, AutonomyLevel autonomyLevel, RiskTolerance riskTolerance
) {}

package com.example.managementbackend.model.shared;
import com.example.managementbackend.model.enums.AutonomyLevel;
import com.example.managementbackend.model.enums.RiskTolerance;
public record AgentConfigDto(
    AutonomyLevel autonomyLevel,
    double certaintyThreshold,
    RiskTolerance riskTolerance,
    PriorityWeightsDto priorityWeights
) {}

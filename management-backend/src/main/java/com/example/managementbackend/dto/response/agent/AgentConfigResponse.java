package com.example.managementbackend.dto.response.agent;
import com.example.managementbackend.model.enums.AutonomyLevel;
import com.example.managementbackend.model.enums.RiskTolerance;
import com.example.managementbackend.model.shared.PriorityWeightsDto;
public record AgentConfigResponse(
    AutonomyLevel autonomyLevel,
    double certaintyThreshold,
    RiskTolerance riskTolerance,
    PriorityWeightsDto priorityWeights
) {}

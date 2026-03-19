package com.example.managementbackend.dto.request.agent;
import com.example.managementbackend.model.enums.AutonomyLevel;
import com.example.managementbackend.model.enums.RiskTolerance;
import com.example.managementbackend.model.shared.PriorityWeightsDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
public record UpdateAgentConfigRequest(
    @NotNull AutonomyLevel autonomyLevel,
    @NotNull @DecimalMin("0.0") @DecimalMax("1.0") Double certaintyThreshold,
    @NotNull RiskTolerance riskTolerance,
    @NotNull @Valid PriorityWeightsDto priorityWeights
) {}

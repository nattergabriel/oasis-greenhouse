package com.example.managementbackend.dto.request.agent;
import com.example.managementbackend.model.enums.AgentOutcome;
import jakarta.validation.constraints.NotNull;
public record UpdateAgentLogOutcomeRequest(@NotNull AgentOutcome outcome) {}

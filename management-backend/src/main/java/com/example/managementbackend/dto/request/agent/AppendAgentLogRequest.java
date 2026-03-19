package com.example.managementbackend.dto.request.agent;
import com.example.managementbackend.model.enums.AgentOutcome;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
public record AppendAgentLogRequest(
    @NotBlank @Size(max = 100) String actionType,
    @NotBlank @Size(max = 500) String description,
    @NotBlank @Size(max = 5000) String reasoning,
    @Size(max = 255) String knowledgeBaseSource,
    @NotNull AgentOutcome outcome
) {}

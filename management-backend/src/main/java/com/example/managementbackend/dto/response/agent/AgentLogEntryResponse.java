package com.example.managementbackend.dto.response.agent;
import com.example.managementbackend.model.enums.AgentOutcome;
public record AgentLogEntryResponse(
    String id, String timestamp,
    String actionType, String description, String reasoning,
    String knowledgeBaseSource, AgentOutcome outcome
) {}

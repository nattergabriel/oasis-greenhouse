package com.example.managementbackend.dto.response.agent;
import java.util.List;
public record AgentLogListResponse(int total, int page, int pageSize, List<AgentLogEntryResponse> entries) {}

package com.example.managementbackend.service;

import com.example.managementbackend.dto.response.analytics.AgentPerformanceResponse;

public interface AnalyticsService {
    AgentPerformanceResponse getAgentPerformance(String simulationId);
}

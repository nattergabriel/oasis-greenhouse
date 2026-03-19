package com.example.managementbackend.service;

import com.example.managementbackend.dto.request.agent.*;
import com.example.managementbackend.dto.response.agent.*;

public interface AgentService {
    AgentLogListResponse getLog(int page, int pageSize, String simulationId);
    AgentLogEntryResponse appendLog(AppendAgentLogRequest request);
    AgentLogEntryResponse updateLogOutcome(String id, UpdateAgentLogOutcomeRequest request);
    RecommendationListResponse getRecommendations(String status, int page, int pageSize);
    RecommendationResponse pushRecommendation(PushRecommendationRequest request);
    ApproveRecommendationResponse approveRecommendation(String id);
    DismissRecommendationResponse dismissRecommendation(String id, DismissRecommendationRequest request);
    AgentConfigResponse getConfig();
    AgentConfigResponse updateConfig(UpdateAgentConfigRequest request);
}

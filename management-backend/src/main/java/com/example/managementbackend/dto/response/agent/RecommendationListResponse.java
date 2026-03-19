package com.example.managementbackend.dto.response.agent;
import java.util.List;
public record RecommendationListResponse(int total, int page, int pageSize, List<RecommendationResponse> recommendations) {}

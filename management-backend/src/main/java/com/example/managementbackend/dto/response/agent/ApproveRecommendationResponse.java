package com.example.managementbackend.dto.response.agent;
import com.example.managementbackend.model.enums.RecommendationStatus;
public record ApproveRecommendationResponse(String id, RecommendationStatus status, String executedAt) {}

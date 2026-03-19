package com.example.managementbackend.dto.response.agent;
import com.example.managementbackend.model.enums.RecommendationStatus;
public record DismissRecommendationResponse(String id, RecommendationStatus status) {}

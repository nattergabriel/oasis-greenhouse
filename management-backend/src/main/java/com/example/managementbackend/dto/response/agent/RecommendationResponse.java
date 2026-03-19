package com.example.managementbackend.dto.response.agent;
import com.example.managementbackend.model.enums.RecommendationStatus;
import com.example.managementbackend.model.enums.Urgency;
public record RecommendationResponse(
    String id, String createdAt,
    String actionType, String description, String reasoning,
    double confidence, Urgency urgency,
    String expiresAt, RecommendationStatus status
) {}

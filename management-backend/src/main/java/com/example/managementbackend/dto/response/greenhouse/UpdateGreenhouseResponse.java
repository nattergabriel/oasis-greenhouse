package com.example.managementbackend.dto.response.greenhouse;
import com.example.managementbackend.model.enums.GreenhouseStatus;
public record UpdateGreenhouseResponse(
    String id, String name, String description,
    int rows, int cols, int totalSlots,
    GreenhouseStatus overallStatus, String createdAt
) {}

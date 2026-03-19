package com.example.managementbackend.dto.response.greenhouse;
public record CreateGreenhouseResponse(
    String id, String name, String description,
    int rows, int cols, int totalSlots, String createdAt
) {}

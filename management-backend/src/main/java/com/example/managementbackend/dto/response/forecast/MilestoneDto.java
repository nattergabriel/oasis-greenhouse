package com.example.managementbackend.dto.response.forecast;
import com.example.managementbackend.model.enums.MilestoneType;
public record MilestoneDto(int missionDay, String date, MilestoneType type, String label, String cropId) {}

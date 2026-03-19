package com.example.managementbackend.model.shared;
import java.util.Map;
public record ZoneDto(int id, double areaM2, Map<String, Double> cropPlan, boolean artificialLight, double waterAllocation) {}

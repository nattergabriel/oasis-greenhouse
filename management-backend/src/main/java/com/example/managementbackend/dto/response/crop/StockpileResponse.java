package com.example.managementbackend.dto.response.crop;
import java.util.List;
public record StockpileResponse(
    String updatedAt, List<StockpileItemDto> items,
    double totalEstimatedCalories, double totalDaysOfSupply
) {}

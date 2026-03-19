package com.example.managementbackend.service;

import com.example.managementbackend.dto.request.nutrition.LogConsumptionRequest;
import com.example.managementbackend.dto.response.nutrition.ConsumptionLogResponse;
import com.example.managementbackend.dto.response.nutrition.CoverageHeatmapResponse;
import com.example.managementbackend.dto.response.nutrition.LogConsumptionResponse;
import com.example.managementbackend.dto.response.nutrition.StoredFoodResponse;

public interface NutritionService {
    ConsumptionLogResponse getConsumptionLog(String from, String to);
    LogConsumptionResponse logConsumption(LogConsumptionRequest request);
    StoredFoodResponse getStoredFood();
    CoverageHeatmapResponse getCoverageHeatmap(Integer fromDay, Integer toDay);
}

package com.example.managementbackend.dto.response.nutrition;
import java.util.List;
public record ConsumptionLogResponse(String from, String to, int crewSize, List<DailyNutritionEntryDto> dailyEntries) {}

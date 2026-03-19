package com.example.managementbackend.dto.response.forecast;
import java.util.List;
public record ResourceForecastResponse(String generatedAt, int forecastDays, List<ResourceProjectionDto> projections) {}

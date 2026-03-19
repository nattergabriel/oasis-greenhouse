package com.example.managementbackend.dto.response.weather;
import com.example.managementbackend.model.enums.RiskLevel;
public record WeatherForecastDayDto(int missionDay, RiskLevel dustStormRisk, double solarIrradiance) {}

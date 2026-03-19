package com.example.managementbackend.dto.response.weather;
import java.util.List;
public record WeatherResponse(
    String timestamp,
    double solarIrradiance,
    double dustStormIndex,
    double externalTemperature,
    double atmosphericPressure,
    List<WeatherForecastDayDto> forecast
) {}

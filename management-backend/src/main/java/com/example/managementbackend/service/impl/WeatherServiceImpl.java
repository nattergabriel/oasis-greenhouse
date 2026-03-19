package com.example.managementbackend.service.impl;

import com.example.managementbackend.dto.response.weather.WeatherForecastDayDto;
import com.example.managementbackend.dto.response.weather.WeatherResponse;
import com.example.managementbackend.model.enums.RiskLevel;
import com.example.managementbackend.service.WeatherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class WeatherServiceImpl implements WeatherService {

    @Override
    public WeatherResponse getCurrentWeather() {
        log.debug("Generating mock Mars weather data");

        // Mock current weather conditions
        double solarIrradiance = 590.0 + (ThreadLocalRandom.current().nextDouble() * 20.0); // 590-610 W/m²
        double dustStormIndex = ThreadLocalRandom.current().nextDouble() * 0.3; // 0-0.3 (low)
        double externalTemperature = -63.0 + (ThreadLocalRandom.current().nextDouble() * 10.0); // -63 to -53°C
        double atmosphericPressure = 600.0 + (ThreadLocalRandom.current().nextDouble() * 50.0); // 600-650 Pa

        // Generate 7-day forecast
        List<WeatherForecastDayDto> forecast = generateForecast();

        log.info("Generated weather: solar={}, dust={}, temp={}, pressure={}",
            String.format("%.1f", solarIrradiance),
            String.format("%.2f", dustStormIndex),
            String.format("%.1f", externalTemperature),
            String.format("%.1f", atmosphericPressure));

        return new WeatherResponse(
            Instant.now().toString(),
            solarIrradiance,
            dustStormIndex,
            externalTemperature,
            atmosphericPressure,
            forecast
        );
    }

    private List<WeatherForecastDayDto> generateForecast() {
        List<WeatherForecastDayDto> forecast = new ArrayList<>();
        for (int day = 1; day <= 7; day++) {
            RiskLevel dustRisk = ThreadLocalRandom.current().nextDouble() < 0.15 ? RiskLevel.MODERATE : RiskLevel.LOW;
            double solar = 590.0 + (ThreadLocalRandom.current().nextDouble() * 20.0);
            forecast.add(new WeatherForecastDayDto(day, dustRisk, solar));
        }
        return forecast;
    }
}

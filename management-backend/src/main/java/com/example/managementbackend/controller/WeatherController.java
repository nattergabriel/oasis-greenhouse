package com.example.managementbackend.controller;

import com.example.managementbackend.dto.response.weather.WeatherResponse;
import com.example.managementbackend.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    @GetMapping("/current")
    public ResponseEntity<WeatherResponse> getCurrentWeather() {
        return ResponseEntity.ok(weatherService.getCurrentWeather());
    }
}

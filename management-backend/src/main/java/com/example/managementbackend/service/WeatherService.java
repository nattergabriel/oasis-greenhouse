package com.example.managementbackend.service;

import com.example.managementbackend.dto.response.weather.WeatherResponse;

public interface WeatherService {
    WeatherResponse getCurrentWeather();
}

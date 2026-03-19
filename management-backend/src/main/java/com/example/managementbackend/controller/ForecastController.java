package com.example.managementbackend.controller;

import com.example.managementbackend.dto.request.forecast.SetMissionDatesRequest;
import com.example.managementbackend.service.ForecastService;
import com.example.managementbackend.dto.response.forecast.MissionTimelineResponse;
import com.example.managementbackend.dto.response.forecast.ResourceForecastResponse;
import com.example.managementbackend.dto.response.forecast.SetMissionDatesResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/forecast")
@RequiredArgsConstructor
@Validated
public class ForecastController {

    private final ForecastService forecastService;

    @GetMapping("/resources")
    public ResponseEntity<ResourceForecastResponse> getResourceForecast(
            @RequestParam(defaultValue = "30") @Min(1) @Max(365) int days) {
        return ResponseEntity.ok(forecastService.getResourceForecast(days));
    }

    @GetMapping("/mission-timeline")
    public ResponseEntity<MissionTimelineResponse> getMissionTimeline() {
        return ResponseEntity.ok(forecastService.getMissionTimeline());
    }

    @PutMapping("/mission-timeline")
    public ResponseEntity<SetMissionDatesResponse> setMissionDates(@Valid @RequestBody SetMissionDatesRequest request) {
        return ResponseEntity.ok(forecastService.setMissionDates(request));
    }
}

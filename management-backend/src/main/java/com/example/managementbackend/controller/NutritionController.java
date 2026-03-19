package com.example.managementbackend.controller;

import com.example.managementbackend.dto.request.nutrition.LogConsumptionRequest;
import com.example.managementbackend.service.NutritionService;
import com.example.managementbackend.dto.response.nutrition.ConsumptionLogResponse;
import com.example.managementbackend.dto.response.nutrition.CoverageHeatmapResponse;
import com.example.managementbackend.dto.response.nutrition.LogConsumptionResponse;
import com.example.managementbackend.dto.response.nutrition.StoredFoodResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/nutrition")
@RequiredArgsConstructor
public class NutritionController {

    private final NutritionService nutritionService;

    @GetMapping("/consumption")
    public ResponseEntity<ConsumptionLogResponse> getConsumptionLog(
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(nutritionService.getConsumptionLog(from, to));
    }

    @PostMapping("/consumption")
    public ResponseEntity<LogConsumptionResponse> logConsumption(@Valid @RequestBody LogConsumptionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(nutritionService.logConsumption(request));
    }

    @GetMapping("/stored-food")
    public ResponseEntity<StoredFoodResponse> getStoredFood() {
        return ResponseEntity.ok(nutritionService.getStoredFood());
    }

    @GetMapping("/coverage-heatmap")
    public ResponseEntity<CoverageHeatmapResponse> getCoverageHeatmap(
            @RequestParam(required = false) Integer fromDay,
            @RequestParam(required = false) Integer toDay) {
        return ResponseEntity.ok(nutritionService.getCoverageHeatmap(fromDay, toDay));
    }
}

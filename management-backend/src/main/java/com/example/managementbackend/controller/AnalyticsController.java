package com.example.managementbackend.controller;

import com.example.managementbackend.dto.response.analytics.AgentPerformanceResponse;
import com.example.managementbackend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/agent-performance")
    public ResponseEntity<AgentPerformanceResponse> getAgentPerformance(
            @RequestParam(required = false) String simulationId) {
        return ResponseEntity.ok(analyticsService.getAgentPerformance(simulationId));
    }
}

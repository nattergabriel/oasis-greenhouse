package com.example.managementbackend.controller;

import com.example.managementbackend.dto.response.scenario.ScenarioListResponse;
import com.example.managementbackend.service.ScenarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/scenarios")
@RequiredArgsConstructor
public class ScenarioController {

    private final ScenarioService scenarioService;

    @GetMapping
    public ResponseEntity<ScenarioListResponse> listScenarios() {
        return ResponseEntity.ok(scenarioService.listScenarios());
    }
}

package com.example.managementbackend.controller;

import com.example.managementbackend.dto.request.bridge.SimResultPayload;
import com.example.managementbackend.service.SimulationBridgeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Bridge between the Python backend (simulation engine orchestrator)
 * and the management-backend (frontend API).
 *
 * The Python backend calls POST /api/bridge/import-result/{simulationId}
 * after completing a training run. This translates simulation output into
 * management-backend entities (slots, sensors, agent log, etc.).
 */
@RestController
@RequestMapping("/api/bridge")
@RequiredArgsConstructor
@Slf4j
public class SimulationBridgeController {

    private final SimulationBridgeService bridgeService;

    @PostMapping("/import-result/{simulationId}")
    public ResponseEntity<Map<String, Object>> importResult(
            @PathVariable String simulationId,
            @RequestBody SimResultPayload payload) {
        log.info("Received simulation result import for sim={}", simulationId);
        Map<String, Object> result = bridgeService.importResult(simulationId, payload);
        return ResponseEntity.ok(result);
    }
}

package com.example.managementbackend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * HTTP client for calling the Python backend (agent orchestrator).
 * Calls are fire-and-forget: the Python backend calls back via the bridge
 * endpoint when the simulation completes.
 */
@Service
@Slf4j
public class PythonBackendClient {

    private final RestClient restClient;

    public PythonBackendClient(@Value("${python.backend.url}") String baseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    /**
     * Trigger a training run asynchronously.
     * The Python backend will call POST /api/bridge/import-result/{simulationId}
     * when the run completes.
     */
    public void triggerTrainingRunAsync(String simulationId) {
        CompletableFuture.runAsync(() -> {
            try {
                log.info("Triggering training run on Python backend for sim={}", simulationId);
                Map<String, Object> body = new HashMap<>();
                body.put("simulation_id", simulationId);
                body.put("seed", 42);
                body.put("crop_assignments", Map.of());
                body.put("inject_events", List.of());

                var response = restClient.post()
                        .uri("/api/training/run")
                        .header("Content-Type", "application/json")
                        .body(body)
                        .retrieve()
                        .body(Map.class);

                log.info("Training run completed for sim={}: {}", simulationId, response);
            } catch (Exception e) {
                log.error("Failed to trigger training run for sim={}: {}", simulationId, e.getMessage());
            }
        });
    }
}

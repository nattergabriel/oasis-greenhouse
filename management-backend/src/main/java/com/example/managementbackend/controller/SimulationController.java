package com.example.managementbackend.controller;

import com.example.managementbackend.service.SimulationService;
import com.example.managementbackend.dto.request.simulation.CreateSimulationRequest;
import com.example.managementbackend.dto.request.simulation.InjectScenarioRequest;
import com.example.managementbackend.dto.request.simulation.UpdateSimulationRequest;
import com.example.managementbackend.dto.response.simulation.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/simulations")
@RequiredArgsConstructor
@Validated
public class SimulationController {

    private final SimulationService simulationService;

    @GetMapping
    public ResponseEntity<SimulationListResponse> listSimulations() {
        return ResponseEntity.ok(simulationService.listSimulations());
    }

    @PostMapping
    public ResponseEntity<CreateSimulationResponse> createSimulation(@Valid @RequestBody CreateSimulationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(simulationService.createSimulation(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SimulationDetailResponse> getSimulationDetail(@PathVariable String id) {
        return ResponseEntity.ok(simulationService.getSimulationDetail(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UpdateSimulationResponse> updateSimulation(
            @PathVariable String id,
            @Valid @RequestBody UpdateSimulationRequest request) {
        return ResponseEntity.ok(simulationService.updateSimulation(id, request));
    }

    @GetMapping("/{id}/injections")
    public ResponseEntity<InjectionListResponse> listInjections(@PathVariable String id) {
        return ResponseEntity.ok(simulationService.listInjections(id));
    }

    @PostMapping("/{id}/injections")
    public ResponseEntity<CreateInjectionResponse> injectScenario(
            @PathVariable String id,
            @Valid @RequestBody InjectScenarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(simulationService.injectScenario(id, request));
    }

    @PostMapping("/{id}/injections/{injectionId}/cancel")
    public ResponseEntity<CancelInjectionResponse> cancelInjection(
            @PathVariable String id,
            @PathVariable String injectionId) {
        return ResponseEntity.ok(simulationService.cancelInjection(id, injectionId));
    }

    @PostMapping("/{id}/pause")
    public ResponseEntity<SimulationStatusResponse> pauseSimulation(@PathVariable String id) {
        return ResponseEntity.ok(simulationService.pauseSimulation(id));
    }

    @PostMapping("/{id}/resume")
    public ResponseEntity<SimulationStatusResponse> resumeSimulation(@PathVariable String id) {
        return ResponseEntity.ok(simulationService.resumeSimulation(id));
    }

    @PostMapping("/{id}/stop")
    public ResponseEntity<StopSimulationResponse> stopSimulation(@PathVariable String id) {
        return ResponseEntity.ok(simulationService.stopSimulation(id));
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<TimelineResponse> getTimeline(
            @PathVariable String id,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String types,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(200) int pageSize) {
        return ResponseEntity.ok(simulationService.getTimeline(id, from, to, types, page, pageSize));
    }

    @GetMapping("/{id}/agent-results")
    public ResponseEntity<String> getAgentResults(@PathVariable String id) {
        return ResponseEntity.ok(simulationService.getAgentResults(id));
    }
}

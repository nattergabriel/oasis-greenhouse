package com.example.managementbackend.controller;

import com.example.managementbackend.service.AgentService;
import com.example.managementbackend.dto.request.agent.*;
import com.example.managementbackend.dto.response.agent.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
@Validated
public class AgentController {

    private final AgentService agentService;

    @GetMapping("/log")
    public ResponseEntity<AgentLogListResponse> getLog(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(200) int pageSize,
            @RequestParam(required = false) String simulationId) {
        return ResponseEntity.ok(agentService.getLog(page, pageSize, simulationId));
    }

    @PostMapping("/log")
    public ResponseEntity<AgentLogEntryResponse> appendLog(
            @Valid @RequestBody AppendAgentLogRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(agentService.appendLog(request));
    }

    @PatchMapping("/log/{id}")
    public ResponseEntity<AgentLogEntryResponse> updateLogOutcome(
            @PathVariable String id,
            @Valid @RequestBody UpdateAgentLogOutcomeRequest request) {
        return ResponseEntity.ok(agentService.updateLogOutcome(id, request));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<RecommendationListResponse> getRecommendations(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(200) int pageSize) {
        return ResponseEntity.ok(agentService.getRecommendations(status, page, pageSize));
    }

    @PostMapping("/recommendations")
    public ResponseEntity<RecommendationResponse> pushRecommendation(
            @Valid @RequestBody PushRecommendationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(agentService.pushRecommendation(request));
    }

    @PostMapping("/recommendations/{id}/approve")
    public ResponseEntity<ApproveRecommendationResponse> approveRecommendation(@PathVariable String id) {
        return ResponseEntity.ok(agentService.approveRecommendation(id));
    }

    @PostMapping("/recommendations/{id}/dismiss")
    public ResponseEntity<DismissRecommendationResponse> dismissRecommendation(
            @PathVariable String id,
            @Valid @RequestBody DismissRecommendationRequest request) {
        return ResponseEntity.ok(agentService.dismissRecommendation(id, request));
    }

    @GetMapping("/config")
    public ResponseEntity<AgentConfigResponse> getConfig() {
        return ResponseEntity.ok(agentService.getConfig());
    }

    @PutMapping("/config")
    public ResponseEntity<AgentConfigResponse> updateConfig(@Valid @RequestBody UpdateAgentConfigRequest request) {
        return ResponseEntity.ok(agentService.updateConfig(request));
    }
}

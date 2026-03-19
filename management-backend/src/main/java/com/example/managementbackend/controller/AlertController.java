package com.example.managementbackend.controller;

import com.example.managementbackend.service.AlertService;
import com.example.managementbackend.dto.request.alert.AcknowledgeAlertRequest;
import com.example.managementbackend.dto.request.alert.CreateAlertRequest;
import com.example.managementbackend.dto.request.alert.ResolveAlertRequest;
import com.example.managementbackend.dto.response.alert.AcknowledgeAlertResponse;
import com.example.managementbackend.dto.response.alert.AlertListResponse;
import com.example.managementbackend.dto.response.alert.AlertResponse;
import com.example.managementbackend.dto.response.alert.ResolveAlertResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
@Validated
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public ResponseEntity<AlertListResponse> listAlerts(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(200) int pageSize) {
        return ResponseEntity.ok(alertService.listAlerts(status, page, pageSize));
    }

    @PostMapping
    public ResponseEntity<AlertResponse> createAlert(
            @Valid @RequestBody CreateAlertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(alertService.createAlert(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlertResponse> getAlert(@PathVariable String id) {
        return ResponseEntity.ok(alertService.getAlert(id));
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<AcknowledgeAlertResponse> acknowledgeAlert(
            @PathVariable String id,
            @Valid @RequestBody AcknowledgeAlertRequest request) {
        return ResponseEntity.ok(alertService.acknowledgeAlert(id, request));
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<ResolveAlertResponse> resolveAlert(
            @PathVariable String id,
            @Valid @RequestBody ResolveAlertRequest request) {
        return ResponseEntity.ok(alertService.resolveAlert(id, request));
    }
}

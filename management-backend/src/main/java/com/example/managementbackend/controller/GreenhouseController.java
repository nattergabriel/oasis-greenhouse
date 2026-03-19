package com.example.managementbackend.controller;

import com.example.managementbackend.dto.request.greenhouse.CreateGreenhouseRequest;
import com.example.managementbackend.dto.request.greenhouse.UpdateGreenhouseRequest;
import com.example.managementbackend.service.GreenhouseService;
import com.example.managementbackend.dto.response.greenhouse.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/greenhouses")
@RequiredArgsConstructor
public class GreenhouseController {

    private final GreenhouseService greenhouseService;

    @GetMapping
    public ResponseEntity<GreenhouseListResponse> listGreenhouses() {
        return ResponseEntity.ok(greenhouseService.listGreenhouses());
    }

    @PostMapping
    public ResponseEntity<CreateGreenhouseResponse> createGreenhouse(@Valid @RequestBody CreateGreenhouseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(greenhouseService.createGreenhouse(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GreenhouseDetailResponse> getGreenhouseDetail(
            @PathVariable String id,
            @RequestParam(required = false) String slotStatus) {
        return ResponseEntity.ok(greenhouseService.getGreenhouseDetail(id, slotStatus));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UpdateGreenhouseResponse> updateGreenhouse(
            @PathVariable String id,
            @Valid @RequestBody UpdateGreenhouseRequest request) {
        return ResponseEntity.ok(greenhouseService.updateGreenhouse(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGreenhouse(@PathVariable String id) {
        greenhouseService.deleteGreenhouse(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/sensors/latest")
    public ResponseEntity<SensorSnapshotResponse> getLatestSensorSnapshot(@PathVariable String id) {
        return ResponseEntity.ok(greenhouseService.getLatestSensorSnapshot(id));
    }

    @GetMapping("/{id}/sensors/history")
    public ResponseEntity<SensorHistoryResponse> getSensorHistory(
            @PathVariable String id,
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam String interval) {
        return ResponseEntity.ok(greenhouseService.getSensorHistory(id, from, to, interval));
    }
}

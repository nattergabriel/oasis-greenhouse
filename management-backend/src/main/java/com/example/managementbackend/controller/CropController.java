package com.example.managementbackend.controller;

import com.example.managementbackend.service.CropService;
import com.example.managementbackend.dto.request.crop.LogHarvestRequest;
import com.example.managementbackend.dto.request.crop.PublishPlantingQueueRequest;
import com.example.managementbackend.dto.request.crop.UpdateHarvestRequest;
import com.example.managementbackend.dto.response.crop.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/crops")
@RequiredArgsConstructor
@Validated
public class CropController {

    private final CropService cropService;

    @GetMapping
    public ResponseEntity<CropListResponse> listCrops() {
        return ResponseEntity.ok(cropService.listCrops());
    }

    @GetMapping("/planting-queue")
    public ResponseEntity<PlantingQueueResponse> getPlantingQueue(
            @RequestParam(required = false) String greenhouseId) {
        return ResponseEntity.ok(cropService.getPlantingQueue(greenhouseId));
    }

    @PostMapping("/planting-queue")
    public ResponseEntity<PublishPlantingQueueResponse> publishPlantingQueue(
            @Valid @RequestBody PublishPlantingQueueRequest request) {
        return ResponseEntity.ok(cropService.publishPlantingQueue(request));
    }

    @GetMapping("/harvest-journal")
    public ResponseEntity<HarvestListResponse> getHarvestJournal(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(200) int pageSize,
            @RequestParam(required = false) String greenhouseId,
            @RequestParam(required = false) String cropId) {
        return ResponseEntity.ok(cropService.getHarvestJournal(page, pageSize, greenhouseId, cropId));
    }

    @PostMapping("/harvest-journal")
    public ResponseEntity<HarvestEntryResponse> logHarvest(@Valid @RequestBody LogHarvestRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cropService.logHarvest(request));
    }

    @PatchMapping("/harvest-journal/{id}")
    public ResponseEntity<HarvestEntryResponse> updateHarvest(
            @PathVariable String id,
            @Valid @RequestBody UpdateHarvestRequest request) {
        return ResponseEntity.ok(cropService.updateHarvest(id, request));
    }

    @GetMapping("/stockpile")
    public ResponseEntity<StockpileResponse> getStockpile() {
        return ResponseEntity.ok(cropService.getStockpile());
    }
}

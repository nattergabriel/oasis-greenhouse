package com.example.managementbackend.controller;

import com.example.managementbackend.service.DataSeederService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/seed")
@RequiredArgsConstructor
@Slf4j
public class DataSeederController {

    private final DataSeederService dataSeederService;

    @PostMapping("/all")
    public ResponseEntity<Map<String, String>> seedAll() {
        log.info("Received request to seed all data");
        dataSeederService.seedDatabase();
        return ResponseEntity.ok(Map.of(
            "message", "Database seeded successfully",
            "status", "success"
        ));
    }

    @PostMapping("/crops")
    public ResponseEntity<Map<String, String>> seedCrops() {
        log.info("Received request to seed crops");
        dataSeederService.seedCrops();
        return ResponseEntity.ok(Map.of(
            "message", "Crops seeded successfully",
            "status", "success"
        ));
    }

    @PostMapping("/greenhouse")
    public ResponseEntity<Map<String, String>> seedGreenhouse() {
        log.info("Received request to seed greenhouse");
        dataSeederService.seedGreenhouse();
        return ResponseEntity.ok(Map.of(
            "message", "Greenhouse seeded successfully",
            "status", "success"
        ));
    }

    @PostMapping("/mission-config")
    public ResponseEntity<Map<String, String>> seedMissionConfig() {
        log.info("Received request to seed mission config");
        dataSeederService.seedMissionConfig();
        return ResponseEntity.ok(Map.of(
            "message", "Mission config seeded successfully",
            "status", "success"
        ));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Map<String, String>> clearAll() {
        log.warn("Received request to clear all data");
        dataSeederService.clearAllData();
        return ResponseEntity.ok(Map.of(
            "message", "All data cleared successfully",
            "status", "success"
        ));
    }
}

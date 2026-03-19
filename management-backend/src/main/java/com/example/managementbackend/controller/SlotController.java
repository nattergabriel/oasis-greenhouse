package com.example.managementbackend.controller;

import com.example.managementbackend.dto.request.slot.UpdateSlotRequest;
import com.example.managementbackend.dto.response.slot.PlantSlotResponse;
import com.example.managementbackend.dto.response.slot.SlotHistoryResponse;
import com.example.managementbackend.service.SlotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/greenhouses/{greenhouseId}/slots")
@RequiredArgsConstructor
public class SlotController {

    private final SlotService slotService;

    @GetMapping("/{slotId}")
    public ResponseEntity<PlantSlotResponse> getSlot(
            @PathVariable String greenhouseId,
            @PathVariable String slotId) {
        return ResponseEntity.ok(slotService.getSlot(greenhouseId, slotId));
    }

    @PatchMapping("/{slotId}")
    public ResponseEntity<PlantSlotResponse> updateSlot(
            @PathVariable String greenhouseId,
            @PathVariable String slotId,
            @Valid @RequestBody UpdateSlotRequest request) {
        return ResponseEntity.ok(slotService.updateSlot(greenhouseId, slotId, request));
    }

    @GetMapping("/{slotId}/history")
    public ResponseEntity<SlotHistoryResponse> getSlotHistory(
            @PathVariable String greenhouseId,
            @PathVariable String slotId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false, defaultValue = "1d") String interval) {
        return ResponseEntity.ok(slotService.getSlotHistory(greenhouseId, slotId, from, to, interval));
    }
}

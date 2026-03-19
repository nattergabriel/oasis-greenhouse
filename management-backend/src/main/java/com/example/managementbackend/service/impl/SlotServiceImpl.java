package com.example.managementbackend.service.impl;

import com.example.managementbackend.domain.Crop;
import com.example.managementbackend.domain.PlantSlot;
import com.example.managementbackend.dto.request.slot.UpdateSlotRequest;
import com.example.managementbackend.dto.response.slot.PlantSlotResponse;
import com.example.managementbackend.dto.response.slot.SlotHistoryResponse;
import com.example.managementbackend.dto.response.slot.SlotHistorySnapshotDto;
import com.example.managementbackend.model.enums.SlotStatus;
import com.example.managementbackend.model.shared.PositionDto;
import com.example.managementbackend.repository.CropRepository;
import com.example.managementbackend.repository.PlantSlotRepository;
import com.example.managementbackend.service.SlotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SlotServiceImpl implements SlotService {

    private final PlantSlotRepository plantSlotRepository;
    private final CropRepository cropRepository;

    @Override
    public PlantSlotResponse getSlot(String greenhouseId, String slotId) {
        log.debug("Fetching slot: greenhouseId={}, slotId={}", greenhouseId, slotId);

        PlantSlot slot = plantSlotRepository.findByGreenhouseIdAndId(greenhouseId, slotId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Slot not found: greenhouseId=" + greenhouseId + ", slotId=" + slotId));

        return mapSlotToResponse(slot);
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public PlantSlotResponse updateSlot(String greenhouseId, String slotId, UpdateSlotRequest request) {
        log.debug("Updating slot: greenhouseId={}, slotId={}", greenhouseId, slotId);

        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }

        PlantSlot slot = plantSlotRepository.findByGreenhouseIdAndId(greenhouseId, slotId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Slot not found: greenhouseId=" + greenhouseId + ", slotId=" + slotId));

        // Update non-null fields
        if (request.cropId() != null) {
            if (request.cropId().isEmpty()) {
                // Empty string = clear the slot
                slot.setCropId(null);
                slot.setCropName(null);
                slot.setStatus(SlotStatus.EMPTY);
                slot.setPlantedAt(null);
                slot.setGrowthStagePercent(0.0);
                slot.setDaysUntilHarvest(null);
                slot.setEstimatedYieldKg(null);
                slot.setActiveStressTypes(new ArrayList<>());
            } else {
                // Non-empty cropId = plant the crop
                Crop crop = cropRepository.findById(request.cropId())
                    .orElseThrow(() -> {
                        log.warn("Crop not found: cropId={}", request.cropId());
                        return new IllegalArgumentException("Crop not found: " + request.cropId());
                    });

                slot.setCropId(request.cropId());
                slot.setCropName(crop.getName());
                slot.setStatus(SlotStatus.HEALTHY);
                slot.setPlantedAt(Instant.now());
                slot.setGrowthStagePercent(0.0);
                slot.setDaysUntilHarvest(crop.getGrowthDays());
                slot.setEstimatedYieldKg(crop.getTypicalYieldPerM2Kg());
            }
        }

        if (request.plantedAt() != null) {
            try {
                slot.setPlantedAt(Instant.parse(request.plantedAt()));
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid plantedAt format. Expected ISO-8601 format.", e);
            }
        }

        if (request.growthStagePercent() != null) {
            slot.setGrowthStagePercent(request.growthStagePercent());
        }

        if (request.activeStressTypes() != null) {
            slot.setActiveStressTypes(new ArrayList<>(request.activeStressTypes()));
        }

        if (request.estimatedYieldKg() != null) {
            slot.setEstimatedYieldKg(request.estimatedYieldKg());
        }

        PlantSlot saved = plantSlotRepository.save(slot);
        log.info("Updated slot: slotId={}, cropId={}, growthPercent={}",
            saved.getId(), saved.getCropId(), saved.getGrowthStagePercent());

        return mapSlotToResponse(saved);
    }

    @Override
    public SlotHistoryResponse getSlotHistory(String greenhouseId, String slotId, String from, String to, String interval) {
        log.debug("Fetching slot history: greenhouseId={}, slotId={}, from={}, to={}", greenhouseId, slotId, from, to);

        PlantSlot slot = plantSlotRepository.findByGreenhouseIdAndId(greenhouseId, slotId)
            .orElseThrow(() -> new IllegalArgumentException("Slot not found"));

        // Validate time range
        Instant fromTime;
        Instant toTime;
        try {
            fromTime = Instant.parse(from);
            toTime = Instant.parse(to);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid timestamp format. Expected ISO-8601 format.", e);
        }

        if (fromTime.isAfter(toTime)) {
            throw new IllegalArgumentException("'from' timestamp cannot be after 'to' timestamp");
        }

        // TODO: Implement actual history tracking
        // For hackathon, return mock historical data showing growth progression
        List<SlotHistorySnapshotDto> snapshots = generateMockHistory(slot, fromTime, toTime);

        log.info("Retrieved {} history snapshots for slot: {}", snapshots.size(), slotId);

        return new SlotHistoryResponse(
            slotId,
            slot.getCropId(),
            slot.getCropName(),
            from,
            to,
            interval,
            snapshots
        );
    }

    // Private methods

    private PlantSlotResponse mapSlotToResponse(PlantSlot slot) {
        return new PlantSlotResponse(
            slot.getId(),
            new PositionDto(slot.getSlotRow(), slot.getSlotCol()),
            slot.getCropId(),
            slot.getCropName(),
            slot.getStatus(),
            slot.getGrowthStagePercent(),
            slot.getDaysUntilHarvest(),
            slot.getPlantedAt() != null ? slot.getPlantedAt().toString() : null,
            slot.getActiveStressTypes(),
            slot.getEstimatedYieldKg()
        );
    }

    private List<SlotHistorySnapshotDto> generateMockHistory(PlantSlot slot, Instant from, Instant to) {
        List<SlotHistorySnapshotDto> snapshots = new ArrayList<>();

        if (slot.getStatus() == SlotStatus.EMPTY) {
            return snapshots;
        }

        // Generate 5 historical snapshots showing growth progression
        long intervalSeconds = (to.getEpochSecond() - from.getEpochSecond()) / 5;

        for (int i = 0; i <= 5; i++) {
            Instant timestamp = from.plusSeconds(intervalSeconds * i);
            double growthPercent = Math.min(100.0, (i * 20.0));

            snapshots.add(new SlotHistorySnapshotDto(
                timestamp.toString(),
                i * 5, // mission day
                slot.getStatus(),
                growthPercent,
                slot.getEstimatedYieldKg(),
                i > 3 && !slot.getActiveStressTypes().isEmpty() ?
                    slot.getActiveStressTypes() : List.of()
            ));
        }

        return snapshots;
    }
}

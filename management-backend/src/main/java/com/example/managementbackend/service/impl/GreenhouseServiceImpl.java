package com.example.managementbackend.service.impl;

import com.example.managementbackend.domain.Greenhouse;
import com.example.managementbackend.domain.PlantSlot;
import com.example.managementbackend.domain.SensorSnapshot;
import com.example.managementbackend.dto.request.greenhouse.CreateGreenhouseRequest;
import com.example.managementbackend.dto.request.greenhouse.UpdateGreenhouseRequest;
import com.example.managementbackend.dto.response.greenhouse.*;
import com.example.managementbackend.dto.response.slot.PlantSlotResponse;
import com.example.managementbackend.model.enums.SlotStatus;
import com.example.managementbackend.model.shared.*;
import com.example.managementbackend.repository.GreenhouseRepository;
import com.example.managementbackend.repository.PlantSlotRepository;
import com.example.managementbackend.repository.SensorSnapshotRepository;
import com.example.managementbackend.service.GreenhouseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class GreenhouseServiceImpl implements GreenhouseService {

    private final GreenhouseRepository greenhouseRepository;
    private final PlantSlotRepository plantSlotRepository;
    private final SensorSnapshotRepository sensorSnapshotRepository;

    @Override
    public GreenhouseListResponse listGreenhouses() {
        log.debug("Fetching all greenhouses");
        List<Greenhouse> greenhouses = greenhouseRepository.findAll();
        List<GreenhouseSummaryResponse> summaries = greenhouses.stream()
            .map(this::mapToSummary)
            .toList();
        log.info("Retrieved {} greenhouses", summaries.size());
        return new GreenhouseListResponse(summaries);
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public CreateGreenhouseResponse createGreenhouse(CreateGreenhouseRequest request) {
        log.debug("Creating greenhouse: name={}, rows={}, cols={}", request.name(), request.rows(), request.cols());

        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }

        Greenhouse greenhouse = new Greenhouse();
        greenhouse.setName(request.name());
        greenhouse.setDescription(request.description());
        greenhouse.setRows(request.rows());
        greenhouse.setCols(request.cols());
        greenhouse.setCreatedAt(Instant.now());

        // Initialize empty slots
        for (int row = 0; row < request.rows(); row++) {
            for (int col = 0; col < request.cols(); col++) {
                PlantSlot slot = new PlantSlot();
                slot.setSlotRow(row);
                slot.setSlotCol(col);
                slot.setStatus(SlotStatus.EMPTY);
                slot.setGreenhouse(greenhouse);
                greenhouse.getSlots().add(slot);
            }
        }

        Greenhouse saved = greenhouseRepository.save(greenhouse);
        log.info("Created greenhouse: id={}, name={}, totalSlots={}", saved.getId(), saved.getName(), saved.getSlots().size());

        return new CreateGreenhouseResponse(
            saved.getId(),
            saved.getName(),
            saved.getDescription(),
            saved.getRows(),
            saved.getCols(),
            saved.getRows() * saved.getCols(),
            saved.getCreatedAt().toString()
        );
    }

    @Override
    public GreenhouseDetailResponse getGreenhouseDetail(String id, String slotStatus) {
        log.debug("Fetching greenhouse detail: id={}, slotStatus={}", id, slotStatus);

        Greenhouse greenhouse = greenhouseRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Greenhouse not found"));

        List<PlantSlot> slots = plantSlotRepository.findByGreenhouseId(id);

        // Filter slots if status provided
        if (slotStatus != null && !slotStatus.isEmpty()) {
            try {
                SlotStatus status = SlotStatus.valueOf(slotStatus.toUpperCase());
                slots = slots.stream()
                    .filter(slot -> slot.getStatus() == status)
                    .toList();
                log.debug("Filtered slots by status {}: {} slots", status, slots.size());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid slot status filter: {}", slotStatus);
            }
        }

        List<PlantSlotResponse> slotResponses = slots.stream()
            .map(this::mapSlotToResponse)
            .toList();

        // Mock resources (for hackathon - real values would come from simulation state)
        GreenhouseResourcesDto resources = new GreenhouseResourcesDto(75.0, 82.0, 68.0);

        // Mock zones (for hackathon - real zones would be configured)
        List<ZoneDto> zones = List.of(
            new ZoneDto(1, 15.0, Map.of("potato", 60.0, "lettuce", 40.0), true, 1.0),
            new ZoneDto(2, 15.0, Map.of("radish", 50.0, "herbs", 50.0), false, 0.9),
            new ZoneDto(3, 15.0, Map.of("beans", 100.0), true, 1.1),
            new ZoneDto(4, 15.0, Collections.emptyMap(), false, 1.0)
        );

        return new GreenhouseDetailResponse(
            greenhouse.getId(),
            greenhouse.getName(),
            greenhouse.getDescription(),
            greenhouse.getRows(),
            greenhouse.getCols(),
            greenhouse.getOverallStatus(),
            slotResponses,
            resources,
            zones
        );
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public UpdateGreenhouseResponse updateGreenhouse(String id, UpdateGreenhouseRequest request) {
        log.debug("Updating greenhouse: id={}", id);

        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }

        Greenhouse greenhouse = greenhouseRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Greenhouse not found"));

        // Update only non-null fields
        if (request.name() != null) {
            greenhouse.setName(request.name());
        }
        if (request.description() != null) {
            greenhouse.setDescription(request.description());
        }

        // Handle rows/cols resize - not supported to prevent data corruption
        if (request.rows() != null && request.rows() != greenhouse.getRows()) {
            throw new UnsupportedOperationException("Greenhouse resize not supported - would require slot migration. Please create a new greenhouse.");
        }
        if (request.cols() != null && request.cols() != greenhouse.getCols()) {
            throw new UnsupportedOperationException("Greenhouse resize not supported - would require slot migration. Please create a new greenhouse.");
        }

        Greenhouse saved = greenhouseRepository.save(greenhouse);
        log.info("Updated greenhouse: id={}, name={}", saved.getId(), saved.getName());

        return new UpdateGreenhouseResponse(
            saved.getId(),
            saved.getName(),
            saved.getDescription(),
            saved.getRows(),
            saved.getCols(),
            saved.getRows() * saved.getCols(),
            saved.getOverallStatus(),
            saved.getCreatedAt().toString()
        );
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void deleteGreenhouse(String id) {
        log.debug("Deleting greenhouse: id={}", id);

        if (!greenhouseRepository.existsById(id)) {
            log.warn("Attempted to delete non-existent greenhouse: id={}", id);
            throw new IllegalArgumentException("Greenhouse not found");
        }

        // Check for occupied slots before deletion
        List<PlantSlot> occupiedSlots = plantSlotRepository.findByGreenhouseId(id).stream()
            .filter(slot -> slot.getStatus() != SlotStatus.EMPTY)
            .toList();

        if (!occupiedSlots.isEmpty()) {
            log.warn("Cannot delete greenhouse with {} occupied slot(s): id={}", occupiedSlots.size(), id);
            throw new IllegalStateException("Cannot delete greenhouse with active crops. Clear " + occupiedSlots.size() + " slot(s) first.");
        }

        greenhouseRepository.deleteById(id);
        log.info("Deleted greenhouse: id={}", id);
    }

    @Override
    public SensorSnapshotResponse getLatestSensorSnapshot(String id) {
        log.debug("Fetching latest sensor snapshot for greenhouse: id={}", id);

        // Verify greenhouse exists
        if (!greenhouseRepository.existsById(id)) {
            throw new IllegalArgumentException("Greenhouse not found: " + id);
        }

        SensorSnapshot snapshot = sensorSnapshotRepository
            .findTopByGreenhouseIdOrderByTimestampDesc(id)
            .orElse(null);

        if (snapshot == null) {
            log.warn("No sensor snapshots found for greenhouse: id={}", id);
            // Return mock data for hackathon
            return createMockSensorSnapshot();
        }

        return mapSensorSnapshotToResponse(snapshot);
    }

    @Override
    public SensorHistoryResponse getSensorHistory(String id, String from, String to, String interval) {
        log.debug("Fetching sensor history: greenhouseId={}, from={}, to={}, interval={}", id, from, to, interval);

        // Verify greenhouse exists
        if (!greenhouseRepository.existsById(id)) {
            throw new IllegalArgumentException("Greenhouse not found");
        }

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

        List<SensorSnapshot> snapshots = sensorSnapshotRepository
            .findByGreenhouseIdAndTimestampBetween(id, fromTime, toTime);

        List<SensorHistoryReadingDto> readings = snapshots.stream()
            .map(this::mapToHistoryReading)
            .toList();

        log.info("Retrieved {} sensor history readings for greenhouse: id={}", readings.size(), id);

        return new SensorHistoryResponse(from, to, interval, readings);
    }

    // Private mapping methods

    private GreenhouseSummaryResponse mapToSummary(Greenhouse greenhouse) {
        int totalSlots = greenhouse.getRows() * greenhouse.getCols();
        long occupiedSlots = greenhouse.getSlots().stream()
            .filter(slot -> slot.getStatus() != SlotStatus.EMPTY)
            .count();

        return new GreenhouseSummaryResponse(
            greenhouse.getId(),
            greenhouse.getName(),
            greenhouse.getDescription(),
            greenhouse.getRows(),
            greenhouse.getCols(),
            totalSlots,
            (int) occupiedSlots,
            greenhouse.getOverallStatus()
        );
    }

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

    private SensorSnapshotResponse mapSensorSnapshotToResponse(SensorSnapshot snapshot) {
        return new SensorSnapshotResponse(
            snapshot.getTimestamp().toString(),
            new SensorValueDto(snapshot.getTemperature(), snapshot.getTemperatureStatus()),
            new SensorValueDto(snapshot.getHumidity(), snapshot.getHumidityStatus()),
            new SensorValueDto(snapshot.getLightIntensity(), snapshot.getLightIntensityStatus()),
            new SensorValueDto(snapshot.getPar(), snapshot.getParStatus()),
            snapshot.getLightCyclePhase(),
            new SensorValueDto(snapshot.getCo2(), snapshot.getCo2Status()),
            new SensorValueDto(snapshot.getWaterFlowRate(), snapshot.getWaterFlowRateStatus()),
            new SensorValueDto(snapshot.getWaterRecyclingEfficiency(), snapshot.getWaterRecyclingEfficiencyStatus()),
            new NutrientSolutionDto(
                new SensorValueDto(snapshot.getNutrientPh(), snapshot.getNutrientPhStatus()),
                new SensorValueDto(snapshot.getNutrientEc(), snapshot.getNutrientEcStatus()),
                new SensorValueDto(snapshot.getNutrientDo(), snapshot.getNutrientDoStatus())
            )
        );
    }

    private SensorHistoryReadingDto mapToHistoryReading(SensorSnapshot snapshot) {
        return new SensorHistoryReadingDto(
            snapshot.getTimestamp().toString(),
            snapshot.getTemperature(),
            snapshot.getHumidity(),
            snapshot.getLightIntensity(),
            snapshot.getPar(),
            snapshot.getCo2(),
            snapshot.getWaterFlowRate(),
            snapshot.getWaterRecyclingEfficiency(),
            snapshot.getNutrientPh(),
            snapshot.getNutrientEc(),
            snapshot.getNutrientDo()
        );
    }

    private SensorSnapshotResponse createMockSensorSnapshot() {
        return new SensorSnapshotResponse(
            Instant.now().toString(),
            new SensorValueDto(22.5, com.example.managementbackend.model.enums.SensorStatus.NORMAL),
            new SensorValueDto(65.0, com.example.managementbackend.model.enums.SensorStatus.NORMAL),
            new SensorValueDto(450.0, com.example.managementbackend.model.enums.SensorStatus.NORMAL),
            new SensorValueDto(380.0, com.example.managementbackend.model.enums.SensorStatus.NORMAL),
            com.example.managementbackend.model.enums.LightCyclePhase.DAY,
            new SensorValueDto(1200.0, com.example.managementbackend.model.enums.SensorStatus.NORMAL),
            new SensorValueDto(2.5, com.example.managementbackend.model.enums.SensorStatus.NORMAL),
            new SensorValueDto(95.0, com.example.managementbackend.model.enums.SensorStatus.NORMAL),
            new NutrientSolutionDto(
                new SensorValueDto(6.2, com.example.managementbackend.model.enums.SensorStatus.NORMAL),
                new SensorValueDto(1.8, com.example.managementbackend.model.enums.SensorStatus.NORMAL),
                new SensorValueDto(7.5, com.example.managementbackend.model.enums.SensorStatus.NORMAL)
            )
        );
    }
}

package com.example.managementbackend.service.impl;

import com.example.managementbackend.domain.*;
import com.example.managementbackend.dto.request.crop.LogHarvestRequest;
import com.example.managementbackend.dto.request.crop.PlantingQueueItemRequest;
import com.example.managementbackend.dto.request.crop.PublishPlantingQueueRequest;
import com.example.managementbackend.dto.request.crop.UpdateHarvestRequest;
import com.example.managementbackend.dto.response.crop.*;
import com.example.managementbackend.model.shared.MicronutrientsDto;
import com.example.managementbackend.repository.*;
import com.example.managementbackend.service.CropService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CropServiceImpl implements CropService {

    private static final int MAX_PAGE_SIZE = 100;
    private final CropRepository cropRepository;
    private final PlantingQueueItemRepository plantingQueueItemRepository;
    private final HarvestEntryRepository harvestEntryRepository;
    private final StockpileItemRepository stockpileItemRepository;
    private final PlantSlotRepository plantSlotRepository;

    @Override
    public CropListResponse listCrops() {
        log.debug("Fetching all crops");
        List<Crop> crops = cropRepository.findAll();
        List<CropResponse> responses = crops.stream()
            .map(this::mapCropToResponse)
            .toList();
        log.info("Retrieved {} crops", responses.size());
        return new CropListResponse(responses);
    }

    @Override
    public PlantingQueueResponse getPlantingQueue(String greenhouseId) {
        log.debug("Fetching planting queue: greenhouseId={}", greenhouseId);

        List<PlantingQueueItem> items;
        if (greenhouseId != null && !greenhouseId.isEmpty()) {
            items = plantingQueueItemRepository.findByGreenhouseIdOrderByRankAsc(greenhouseId);
            log.debug("Filtered queue by greenhouse: {}", greenhouseId);
        } else {
            items = plantingQueueItemRepository.findAllByOrderByRankAsc();
        }

        List<PlantingQueueItemDto> dtos = items.stream()
            .map(this::mapQueueItemToDto)
            .toList();

        log.info("Retrieved {} planting queue items", dtos.size());
        return new PlantingQueueResponse(dtos);
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public PublishPlantingQueueResponse publishPlantingQueue(PublishPlantingQueueRequest request) {
        log.debug("Publishing planting queue with {} items", request.queue().size());

        if (request == null || request.queue() == null) {
            throw new IllegalArgumentException("Request and queue must not be null");
        }

        // Create new queue items first to validate before delete
        List<PlantingQueueItem> items = new ArrayList<>();
        for (PlantingQueueItemRequest itemRequest : request.queue()) {
            if (itemRequest == null) {
                throw new IllegalArgumentException("Queue item must not be null");
            }

            PlantingQueueItem item = new PlantingQueueItem();
            item.setRank(itemRequest.rank());
            item.setCropId(itemRequest.cropId());
            item.setGreenhouseId(itemRequest.greenhouseId());

            // Parse and validate date
            try {
                item.setRecommendedPlantDate(Instant.parse(itemRequest.recommendedPlantDate()));
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid date format for recommendedPlantDate: " + itemRequest.recommendedPlantDate(), e);
            }

            item.setMissionDay(itemRequest.missionDay());
            item.setReason(itemRequest.reason());

            if (itemRequest.nutritionalGapsAddressed() != null) {
                item.setNutritionalGapsAddressed(new ArrayList<>(itemRequest.nutritionalGapsAddressed()));
            }

            // Validate crop exists - throw if not found
            Crop crop = cropRepository.findById(itemRequest.cropId())
                .orElseThrow(() -> {
                    log.warn("Invalid cropId in planting queue: {}", itemRequest.cropId());
                    return new IllegalArgumentException("Crop not found: " + itemRequest.cropId());
                });
            item.setCropName(crop.getName());

            items.add(item);
        }

        // Only delete after full validation succeeds - delete + save in single transaction
        if (items.isEmpty()) {
            log.warn("Publishing empty planting queue - all queue items will be cleared");
        }
        plantingQueueItemRepository.deleteAllInBatch();
        plantingQueueItemRepository.flush();
        plantingQueueItemRepository.saveAll(items);
        plantingQueueItemRepository.flush();

        log.info("Published planting queue: {} items", items.size());
        return new PublishPlantingQueueResponse(Instant.now().toString(), items.size());
    }

    @Override
    public HarvestListResponse getHarvestJournal(int page, int pageSize, String greenhouseId, String cropId) {
        log.debug("Fetching harvest journal: page={}, pageSize={}, greenhouseId={}, cropId={}", page, pageSize, greenhouseId, cropId);

        if (page < 0 || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("Invalid pagination parameters. Page must be >= 0, pageSize must be 1-" + MAX_PAGE_SIZE);
        }

        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("harvestedAt").descending());
        Page<HarvestEntry> harvestPage;

        if (greenhouseId != null && !greenhouseId.isEmpty() && cropId != null && !cropId.isEmpty()) {
            harvestPage = harvestEntryRepository.findByGreenhouseIdAndCropId(greenhouseId, cropId, pageable);
        } else if (greenhouseId != null && !greenhouseId.isEmpty()) {
            harvestPage = harvestEntryRepository.findByGreenhouseId(greenhouseId, pageable);
        } else if (cropId != null && !cropId.isEmpty()) {
            harvestPage = harvestEntryRepository.findByCropId(cropId, pageable);
        } else {
            harvestPage = harvestEntryRepository.findAll(pageable);
        }

        List<HarvestEntryResponse> harvests = harvestPage.getContent().stream()
            .map(this::mapHarvestToResponse)
            .toList();

        log.info("Retrieved {} harvest entries (page {}/{})", harvests.size(), page, harvestPage.getTotalPages());

        return new HarvestListResponse(
            (int) harvestPage.getTotalElements(),
            page,
            pageSize,
            harvests
        );
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public HarvestEntryResponse logHarvest(LogHarvestRequest request) {
        log.debug("Logging harvest: cropId={}, slotId={}, yieldKg={}", request.cropId(), request.slotId(), request.yieldKg());

        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }

        HarvestEntry entry = new HarvestEntry();
        entry.setCropId(request.cropId());
        entry.setSlotId(request.slotId());
        entry.setYieldKg(request.yieldKg());

        try {
            entry.setHarvestedAt(Instant.parse(request.harvestedAt()));
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid harvestedAt format. Expected ISO-8601 format.", e);
        }

        entry.setNotes(request.notes());

        // Look up crop name
        cropRepository.findById(request.cropId())
            .ifPresent(crop -> entry.setCropName(crop.getName()));

        // Look up greenhouse from slot
        plantSlotRepository.findById(request.slotId())
            .ifPresent(slot -> {
                if (slot.getGreenhouse() != null) {
                    entry.setGreenhouseId(slot.getGreenhouse().getId());
                }
            });

        // Calculate mission day (simplified - would need mission start date)
        entry.setMissionDay(0);

        HarvestEntry saved = harvestEntryRepository.save(entry);
        log.info("Logged harvest: id={}, cropId={}, yieldKg={}", saved.getId(), saved.getCropId(), saved.getYieldKg());

        return mapHarvestToResponse(saved);
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public HarvestEntryResponse updateHarvest(String id, UpdateHarvestRequest request) {
        log.debug("Updating harvest: id={}", id);

        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }

        HarvestEntry entry = harvestEntryRepository.findById(id)
            .orElseThrow(() -> {
                log.warn("Harvest entry not found: id={}", id);
                return new IllegalArgumentException("Harvest entry not found");
            });

        if (request.yieldKg() != null) {
            entry.setYieldKg(request.yieldKg());
        }
        if (request.notes() != null) {
            entry.setNotes(request.notes());
        }

        HarvestEntry saved = harvestEntryRepository.save(entry);
        log.info("Updated harvest: id={}, yieldKg={}", saved.getId(), saved.getYieldKg());

        return mapHarvestToResponse(saved);
    }

    @Override
    public StockpileResponse getStockpile() {
        log.debug("Fetching stockpile");

        List<StockpileItem> items = stockpileItemRepository.findAll();
        List<StockpileItemDto> dtos = items.stream()
            .map(this::mapStockpileItemToDto)
            .toList();

        double totalCalories = items.stream()
            .mapToDouble(StockpileItem::getEstimatedCalories)
            .sum();

        double totalDays = items.stream()
            .mapToDouble(StockpileItem::getDaysOfSupply)
            .min()
            .orElse(0.0);

        Instant latestUpdate = items.stream()
            .map(StockpileItem::getUpdatedAt)
            .filter(java.util.Objects::nonNull)
            .max(Instant::compareTo)
            .orElse(Instant.now());

        log.info("Retrieved stockpile: {} items, {} total calories", dtos.size(), totalCalories);

        return new StockpileResponse(
            latestUpdate.toString(),
            dtos,
            totalCalories,
            totalDays
        );
    }

    // Private mapping methods

    private CropResponse mapCropToResponse(Crop crop) {
        EnvironmentalRequirementsDto envReqs = new EnvironmentalRequirementsDto(
            crop.getOptimalTempMinC(),
            crop.getOptimalTempMaxC(),
            crop.getHeatStressThresholdC(),
            crop.getOptimalHumidityMinPct(),
            crop.getOptimalHumidityMaxPct(),
            crop.getLightRequirementParMin(),
            crop.getLightRequirementParMax(),
            crop.getOptimalCo2PpmMin(),
            crop.getOptimalCo2PpmMax(),
            crop.getOptimalPhMin(),
            crop.getOptimalPhMax()
        );

        MicronutrientsDto micronutrients = new MicronutrientsDto(
            crop.getVitaminAMcg(),
            crop.getVitaminCMg(),
            crop.getVitaminKMcg(),
            crop.getFolateMcg(),
            crop.getIronMg(),
            crop.getPotassiumMg(),
            crop.getMagnesiumMg()
        );

        NutritionalProfileDto nutritionProfile = new NutritionalProfileDto(
            crop.getCaloriesPer100g(),
            crop.getProteinG(),
            crop.getCarbsG(),
            crop.getFatG(),
            crop.getFiberG(),
            micronutrients
        );

        return new CropResponse(
            crop.getId(),
            crop.getName(),
            crop.getCategory(),
            crop.getGrowthDays(),
            crop.getHarvestIndex(),
            crop.getTypicalYieldPerM2Kg(),
            crop.getWaterRequirement(),
            envReqs,
            crop.getStressSensitivities(),
            nutritionProfile
        );
    }

    private PlantingQueueItemDto mapQueueItemToDto(PlantingQueueItem item) {
        return new PlantingQueueItemDto(
            item.getRank(),
            item.getCropId(),
            item.getCropName(),
            item.getGreenhouseId(),
            item.getRecommendedPlantDate() != null ? item.getRecommendedPlantDate().toString() : null,
            item.getMissionDay(),
            item.getReason(),
            item.getNutritionalGapsAddressed()
        );
    }

    private HarvestEntryResponse mapHarvestToResponse(HarvestEntry entry) {
        return new HarvestEntryResponse(
            entry.getId(),
            entry.getHarvestedAt() != null ? entry.getHarvestedAt().toString() : null,
            entry.getMissionDay(),
            entry.getCropId(),
            entry.getCropName(),
            entry.getYieldKg(),
            entry.getSlotId(),
            entry.getGreenhouseId(),
            entry.getNotes()
        );
    }

    private StockpileItemDto mapStockpileItemToDto(StockpileItem item) {
        return new StockpileItemDto(
            item.getCropId(),
            item.getCropName(),
            item.getQuantityKg(),
            item.getEstimatedCalories(),
            item.getDaysOfSupply(),
            item.getExpiresInDays()
        );
    }
}

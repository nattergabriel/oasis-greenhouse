package com.example.managementbackend.dto.response.slot;
import com.example.managementbackend.model.enums.SlotStatus;
import com.example.managementbackend.model.enums.StressType;
import com.example.managementbackend.model.shared.PositionDto;
import java.util.List;
public record PlantSlotResponse(
    String id, PositionDto position,
    String cropId, String cropName,
    SlotStatus status,
    double growthStagePercent,
    Integer daysUntilHarvest,
    String plantedAt,
    List<StressType> activeStressTypes,
    Double estimatedYieldKg
) {}

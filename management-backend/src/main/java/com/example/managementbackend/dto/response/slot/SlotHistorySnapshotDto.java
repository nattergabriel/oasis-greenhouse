package com.example.managementbackend.dto.response.slot;
import com.example.managementbackend.model.enums.SlotStatus;
import com.example.managementbackend.model.enums.StressType;
import java.util.List;
public record SlotHistorySnapshotDto(
    String timestamp, int missionDay,
    SlotStatus status, double growthStagePercent,
    Double estimatedYieldKg, List<StressType> activeStressTypes
) {}

package com.example.managementbackend.dto.request.slot;
import com.example.managementbackend.model.enums.StressType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import java.util.List;
public record UpdateSlotRequest(
    String cropId,
    String plantedAt,
    @DecimalMin("0") @DecimalMax("100") Double growthStagePercent,
    List<StressType> activeStressTypes,
    Double estimatedYieldKg
) {}

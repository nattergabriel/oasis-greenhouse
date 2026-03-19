package com.example.managementbackend.dto.request.crop;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
public record PlantingQueueItemRequest(
    @NotNull @Min(1) Integer rank,
    @NotNull String cropId,
    @NotNull String greenhouseId,
    @NotBlank String recommendedPlantDate,
    @NotNull @Min(0) Integer missionDay,
    @NotBlank String reason,
    List<String> nutritionalGapsAddressed
) {}

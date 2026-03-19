package com.example.managementbackend.dto.response.crop;
import java.util.List;
public record PlantingQueueItemDto(
    int rank, String cropId, String cropName, String greenhouseId,
    String recommendedPlantDate, int missionDay,
    String reason, List<String> nutritionalGapsAddressed
) {}

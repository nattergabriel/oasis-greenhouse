package com.example.managementbackend.dto.request.crop;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
public record PublishPlantingQueueRequest(@NotNull @Valid List<PlantingQueueItemRequest> queue) {}

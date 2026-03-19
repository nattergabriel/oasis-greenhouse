package com.example.managementbackend.dto.response.crop;
public record HarvestEntryResponse(
    String id, String harvestedAt, int missionDay,
    String cropId, String cropName, double yieldKg,
    String slotId, String greenhouseId, String notes
) {}

package com.example.managementbackend.dto.response.greenhouse;
import com.example.managementbackend.dto.response.slot.PlantSlotResponse;
import com.example.managementbackend.model.enums.GreenhouseStatus;
import com.example.managementbackend.model.shared.GreenhouseResourcesDto;
import com.example.managementbackend.model.shared.ZoneDto;
import java.util.List;
public record GreenhouseDetailResponse(
    String id, String name, String description,
    int rows, int cols,
    GreenhouseStatus overallStatus,
    List<PlantSlotResponse> slots,
    GreenhouseResourcesDto resources,
    List<ZoneDto> zones
) {}

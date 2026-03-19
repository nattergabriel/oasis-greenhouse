package com.example.managementbackend.dto.response.crop;
import com.example.managementbackend.model.enums.CropCategory;
import com.example.managementbackend.model.enums.StressType;
import com.example.managementbackend.model.enums.WaterRequirement;
import java.util.List;
public record CropResponse(
    String id, String name,
    CropCategory category,
    int growthDays,
    double harvestIndex,
    double typicalYieldPerM2Kg,
    WaterRequirement waterRequirement,
    EnvironmentalRequirementsDto environmentalRequirements,
    List<StressType> stressSensitivities,
    NutritionalProfileDto nutritionalProfile
) {}

package com.example.managementbackend.dto.response.greenhouse;
import com.example.managementbackend.model.enums.LightCyclePhase;
import com.example.managementbackend.model.shared.NutrientSolutionDto;
import com.example.managementbackend.model.shared.SensorValueDto;
public record SensorSnapshotResponse(
    String timestamp,
    SensorValueDto temperature,
    SensorValueDto humidity,
    SensorValueDto lightIntensity,
    SensorValueDto par,
    LightCyclePhase lightCyclePhase,
    SensorValueDto co2,
    SensorValueDto waterFlowRate,
    SensorValueDto waterRecyclingEfficiency,
    NutrientSolutionDto nutrientSolution
) {}

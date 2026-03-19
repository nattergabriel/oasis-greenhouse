package com.example.managementbackend.dto.response.simulation;
import com.example.managementbackend.model.enums.SimulationStatus;
public record SimulationStatusResponse(String id, SimulationStatus status) {}

package com.example.managementbackend.dto.response.simulation;
import com.example.managementbackend.model.enums.SimulationStatus;
public record CreateSimulationResponse(String id, SimulationStatus status, String createdAt) {}

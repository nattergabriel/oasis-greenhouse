package com.example.managementbackend.dto.response.simulation;
import com.example.managementbackend.model.enums.SimulationStatus;
public record StopSimulationResponse(String id, SimulationStatus status, String completedAt, Double outcomeScore) {}

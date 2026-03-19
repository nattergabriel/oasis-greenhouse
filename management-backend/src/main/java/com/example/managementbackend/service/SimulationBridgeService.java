package com.example.managementbackend.service;

import com.example.managementbackend.dto.request.bridge.SimResultPayload;

import java.util.Map;

public interface SimulationBridgeService {

    /**
     * Import a simulation result from the Python backend.
     * Translates sim engine state into management-backend entities:
     * slots, sensors, harvests, agent log, timeline, stockpile, alerts.
     *
     * @param simulationId the management-backend simulation ID to update
     * @param payload      the Python backend's SimulationResult JSON
     * @return summary of what was imported
     */
    Map<String, Object> importResult(String simulationId, SimResultPayload payload);
}

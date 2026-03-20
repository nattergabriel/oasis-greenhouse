package com.example.managementbackend.service;

import com.example.managementbackend.dto.request.simulation.CreateSimulationRequest;
import com.example.managementbackend.dto.request.simulation.InjectScenarioRequest;
import com.example.managementbackend.dto.request.simulation.UpdateSimulationRequest;
import com.example.managementbackend.dto.response.simulation.*;

public interface SimulationService {
    SimulationListResponse listSimulations();
    CreateSimulationResponse createSimulation(CreateSimulationRequest request);
    SimulationDetailResponse getSimulationDetail(String id);
    UpdateSimulationResponse updateSimulation(String id, UpdateSimulationRequest request);
    InjectionListResponse listInjections(String id);
    CreateInjectionResponse injectScenario(String id, InjectScenarioRequest request);
    CancelInjectionResponse cancelInjection(String id, String injectionId);
    SimulationStatusResponse pauseSimulation(String id);
    SimulationStatusResponse resumeSimulation(String id);
    StopSimulationResponse stopSimulation(String id);
    TimelineResponse getTimeline(String id, String from, String to, String types, int page, int pageSize);
    String getAgentResults(String id);
}

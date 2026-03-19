package com.example.managementbackend.service.impl;

import com.example.managementbackend.dto.request.simulation.*;
import com.example.managementbackend.dto.response.simulation.*;
import com.example.managementbackend.repository.*;
import com.example.managementbackend.service.SimulationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SimulationServiceImpl implements SimulationService {

    private final SimulationRepository simulationRepository;
    private final ScenarioInjectionRepository scenarioInjectionRepository;
    private final TimelineEventRepository timelineEventRepository;

    @Override
    public SimulationListResponse listSimulations() {
        log.warn("SimulationService: listSimulations not fully implemented (hackathon stub)");
        return new SimulationListResponse(List.of());
    }

    @Transactional
    @Override
    public CreateSimulationResponse createSimulation(CreateSimulationRequest request) {
        log.warn("SimulationService: createSimulation not fully implemented (hackathon stub)");
        throw new UnsupportedOperationException("Simulation creation not yet implemented - available in next iteration");
    }

    @Override
    public SimulationDetailResponse getSimulationDetail(String id) {
        log.warn("SimulationService: getSimulationDetail not fully implemented (hackathon stub)");
        throw new UnsupportedOperationException("Simulation details not yet implemented - available in next iteration");
    }

    @Transactional
    @Override
    public UpdateSimulationResponse updateSimulation(String id, UpdateSimulationRequest request) {
        log.warn("SimulationService: updateSimulation not fully implemented (hackathon stub)");
        throw new UnsupportedOperationException("Simulation update not yet implemented - available in next iteration");
    }

    @Override
    public InjectionListResponse listInjections(String id) {
        log.warn("SimulationService: listInjections not fully implemented (hackathon stub)");
        return new InjectionListResponse(List.of());
    }

    @Transactional
    @Override
    public CreateInjectionResponse injectScenario(String id, InjectScenarioRequest request) {
        log.warn("SimulationService: injectScenario not fully implemented (hackathon stub)");
        throw new UnsupportedOperationException("Scenario injection not yet implemented - available in next iteration");
    }

    @Transactional
    @Override
    public CancelInjectionResponse cancelInjection(String id, String injectionId) {
        log.warn("SimulationService: cancelInjection not fully implemented (hackathon stub)");
        throw new UnsupportedOperationException("Injection cancellation not yet implemented - available in next iteration");
    }

    @Transactional
    @Override
    public SimulationStatusResponse pauseSimulation(String id) {
        log.warn("SimulationService: pauseSimulation not fully implemented (hackathon stub)");
        throw new UnsupportedOperationException("Simulation pause not yet implemented - available in next iteration");
    }

    @Transactional
    @Override
    public SimulationStatusResponse resumeSimulation(String id) {
        log.warn("SimulationService: resumeSimulation not fully implemented (hackathon stub)");
        throw new UnsupportedOperationException("Simulation resume not yet implemented - available in next iteration");
    }

    @Transactional
    @Override
    public StopSimulationResponse stopSimulation(String id) {
        log.warn("SimulationService: stopSimulation not fully implemented (hackathon stub)");
        throw new UnsupportedOperationException("Simulation stop not yet implemented - available in next iteration");
    }

    @Override
    public TimelineResponse getTimeline(String id, String from, String to, String types, int page, int pageSize) {
        log.warn("SimulationService: getTimeline not fully implemented (hackathon stub)");
        return new TimelineResponse(id, 0, page, pageSize, List.of());
    }
}

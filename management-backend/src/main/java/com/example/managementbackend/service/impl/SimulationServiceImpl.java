package com.example.managementbackend.service.impl;

import com.example.managementbackend.domain.Scenario;
import com.example.managementbackend.domain.ScenarioInjection;
import com.example.managementbackend.domain.Simulation;
import com.example.managementbackend.domain.TimelineEvent;
import com.example.managementbackend.dto.request.simulation.*;
import com.example.managementbackend.dto.response.simulation.*;
import com.example.managementbackend.model.enums.InjectionStatus;
import com.example.managementbackend.model.enums.SimulationStatus;
import com.example.managementbackend.model.enums.TimelineEventType;
import com.example.managementbackend.model.shared.AgentConfigDto;
import com.example.managementbackend.model.shared.PriorityWeightsDto;
import com.example.managementbackend.repository.*;
import com.example.managementbackend.service.SimulationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SimulationServiceImpl implements SimulationService {

    private final SimulationRepository simulationRepository;
    private final ScenarioInjectionRepository scenarioInjectionRepository;
    private final TimelineEventRepository timelineEventRepository;
    private final ScenarioRepository scenarioRepository;

    @Override
    public SimulationListResponse listSimulations() {
        List<SimulationSummaryResponse> summaries = simulationRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::toSummary)
                .toList();
        return new SimulationListResponse(summaries);
    }

    @Transactional
    @Override
    public CreateSimulationResponse createSimulation(CreateSimulationRequest request) {
        // Only one simulation can be RUNNING at a time
        List<Simulation> running = simulationRepository.findByStatus(SimulationStatus.RUNNING);
        if (!running.isEmpty()) {
            throw new IllegalStateException("Another simulation is already running");
        }

        Simulation sim = new Simulation();
        sim.setName(request.name());
        sim.setLearningGoal(request.learningGoal());
        sim.setStatus(SimulationStatus.RUNNING);
        sim.setCreatedAt(Instant.now());
        sim.setMissionDuration(request.missionDuration());
        sim.setCrewSize(request.crewSize());
        sim.setYieldTarget(request.yieldTarget());

        // Resources
        sim.setWaterLiters(request.resourceAvailability().waterLiters());
        sim.setNutrientKg(request.resourceAvailability().nutrientKg());
        sim.setEnergyKwh(request.resourceAvailability().energyKwh());

        // Agent config
        AgentConfigDto ac = request.agentConfig();
        sim.setAutonomyLevel(ac.autonomyLevel());
        sim.setRiskTolerance(ac.riskTolerance());
        sim.setCertaintyThreshold(ac.certaintyThreshold());
        sim.setPriorityWeightYield(ac.priorityWeights().yield());
        sim.setPriorityWeightDiversity(ac.priorityWeights().diversity());
        sim.setPriorityWeightResourceConservation(ac.priorityWeights().resourceConservation());

        sim = simulationRepository.save(sim);
        log.info("Created simulation: id={}, name={}", sim.getId(), sim.getName());

        return new CreateSimulationResponse(sim.getId(), sim.getStatus(), sim.getCreatedAt().toString());
    }

    @Override
    public SimulationDetailResponse getSimulationDetail(String id) {
        Simulation sim = findOrThrow(id);
        return toDetail(sim);
    }

    @Transactional
    @Override
    public UpdateSimulationResponse updateSimulation(String id, UpdateSimulationRequest request) {
        Simulation sim = findOrThrow(id);
        if (request.name() != null) sim.setName(request.name());
        if (request.learningGoal() != null) sim.setLearningGoal(request.learningGoal());
        sim = simulationRepository.save(sim);
        return new UpdateSimulationResponse(sim.getId(), sim.getName(), sim.getLearningGoal());
    }

    @Override
    public InjectionListResponse listInjections(String id) {
        findOrThrow(id);
        List<InjectionResponse> injections = scenarioInjectionRepository.findBySimulationId(id)
                .stream()
                .map(inj -> new InjectionResponse(
                        inj.getId(), inj.getScenarioId(), inj.getScenarioName(),
                        inj.getTriggeredAt().toString(),
                        inj.getResolvedAt() != null ? inj.getResolvedAt().toString() : null,
                        inj.getIntensity(), inj.getStatus()))
                .toList();
        return new InjectionListResponse(injections);
    }

    @Transactional
    @Override
    public CreateInjectionResponse injectScenario(String id, InjectScenarioRequest request) {
        Simulation sim = findOrThrow(id);
        if (sim.getStatus() != SimulationStatus.RUNNING) {
            throw new IllegalStateException("Simulation is not currently running");
        }

        Scenario scenario = scenarioRepository.findById(request.scenarioId())
                .orElseThrow(() -> new IllegalArgumentException("Scenario not found: " + request.scenarioId()));

        ScenarioInjection inj = new ScenarioInjection();
        inj.setSimulationId(id);
        inj.setScenarioId(scenario.getId());
        inj.setScenarioName(scenario.getName());
        inj.setTriggeredAt(Instant.now());
        inj.setIntensity(request.intensity());
        inj.setStatus(InjectionStatus.ACTIVE);
        inj = scenarioInjectionRepository.save(inj);

        log.info("Injected scenario '{}' into simulation {}", scenario.getName(), id);

        return new CreateInjectionResponse(
                inj.getId(), inj.getScenarioId(),
                inj.getTriggeredAt().toString(), null,
                inj.getStatus());
    }

    @Transactional
    @Override
    public CancelInjectionResponse cancelInjection(String id, String injectionId) {
        findOrThrow(id);
        ScenarioInjection inj = scenarioInjectionRepository.findById(injectionId)
                .orElseThrow(() -> new IllegalArgumentException("Injection not found: " + injectionId));

        if (inj.getStatus() != InjectionStatus.ACTIVE) {
            throw new IllegalStateException("Injection is already resolved");
        }

        inj.setStatus(InjectionStatus.RESOLVED);
        inj.setResolvedAt(Instant.now());
        scenarioInjectionRepository.save(inj);

        return new CancelInjectionResponse(inj.getId(), inj.getStatus(), inj.getResolvedAt().toString());
    }

    @Transactional
    @Override
    public SimulationStatusResponse pauseSimulation(String id) {
        Simulation sim = findOrThrow(id);
        if (sim.getStatus() != SimulationStatus.RUNNING) {
            throw new IllegalStateException("Simulation is not currently running");
        }
        sim.setStatus(SimulationStatus.PAUSED);
        simulationRepository.save(sim);
        return new SimulationStatusResponse(sim.getId(), sim.getStatus());
    }

    @Transactional
    @Override
    public SimulationStatusResponse resumeSimulation(String id) {
        Simulation sim = findOrThrow(id);
        if (sim.getStatus() != SimulationStatus.PAUSED) {
            throw new IllegalStateException("Simulation is not currently paused");
        }
        sim.setStatus(SimulationStatus.RUNNING);
        simulationRepository.save(sim);
        return new SimulationStatusResponse(sim.getId(), sim.getStatus());
    }

    @Transactional
    @Override
    public StopSimulationResponse stopSimulation(String id) {
        Simulation sim = findOrThrow(id);
        if (sim.getStatus() == SimulationStatus.COMPLETED) {
            throw new IllegalStateException("Simulation is already completed");
        }
        sim.setStatus(SimulationStatus.COMPLETED);
        sim.setCompletedAt(Instant.now());
        // outcomeScore is set by the bridge when importing results; default to null
        simulationRepository.save(sim);
        return new StopSimulationResponse(sim.getId(), sim.getStatus(), sim.getCompletedAt().toString(), sim.getOutcomeScore());
    }

    @Override
    public TimelineResponse getTimeline(String id, String from, String to, String types, int page, int pageSize) {
        findOrThrow(id);
        PageRequest pageable = PageRequest.of(page - 1, pageSize, Sort.by("timestamp"));

        Page<TimelineEvent> eventPage;
        if (types != null && !types.isBlank()) {
            // Filter by first type for simplicity (comma-separated not fully supported yet)
            String firstType = types.split(",")[0].trim();
            try {
                TimelineEventType eventType = TimelineEventType.valueOf(firstType);
                eventPage = timelineEventRepository.findBySimulationIdAndType(id, eventType, pageable);
            } catch (IllegalArgumentException e) {
                eventPage = timelineEventRepository.findBySimulationId(id, pageable);
            }
        } else {
            eventPage = timelineEventRepository.findBySimulationId(id, pageable);
        }

        List<TimelineEventDto> events = eventPage.getContent().stream()
                .map(ev -> new TimelineEventDto(
                        ev.getId(),
                        ev.getTimestamp().toString(),
                        ev.getMissionDay(),
                        ev.getType(),
                        ev.getSummary(),
                        ev.getPayload() != null ? Map.of("raw", (Object) ev.getPayload()) : Map.of()))
                .toList();

        return new TimelineResponse(id, (int) eventPage.getTotalElements(), page, pageSize, events);
    }

    // --- helpers ---

    private Simulation findOrThrow(String id) {
        return simulationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Simulation not found: " + id));
    }

    private SimulationSummaryResponse toSummary(Simulation sim) {
        return new SimulationSummaryResponse(
                sim.getId(), sim.getName(), sim.getLearningGoal(),
                sim.getStatus(),
                sim.getCreatedAt().toString(),
                sim.getCompletedAt() != null ? sim.getCompletedAt().toString() : null,
                sim.getMissionDuration(), sim.getCrewSize(), sim.getYieldTarget(),
                sim.getOutcomeScore(), sim.getAutonomyLevel(), sim.getRiskTolerance());
    }

    private SimulationDetailResponse toDetail(Simulation sim) {
        return new SimulationDetailResponse(
                sim.getId(), sim.getName(), sim.getLearningGoal(),
                sim.getStatus(),
                sim.getCreatedAt().toString(),
                sim.getCompletedAt() != null ? sim.getCompletedAt().toString() : null,
                sim.getMissionDuration(), sim.getCrewSize(), sim.getYieldTarget(),
                sim.getOutcomeScore(), sim.getAutonomyLevel(), sim.getRiskTolerance(),
                new ResourceAvailabilityDto(sim.getWaterLiters(), sim.getNutrientKg(), sim.getEnergyKwh()),
                new AgentConfigDto(
                        sim.getAutonomyLevel(), sim.getCertaintyThreshold(), sim.getRiskTolerance(),
                        new PriorityWeightsDto(sim.getPriorityWeightYield(), sim.getPriorityWeightDiversity(), sim.getPriorityWeightResourceConservation())),
                new CurrentMetricsDto(0, 100.0, 100.0, 100.0, 0.0));
    }
}

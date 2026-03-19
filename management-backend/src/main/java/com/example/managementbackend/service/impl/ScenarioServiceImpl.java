package com.example.managementbackend.service.impl;

import com.example.managementbackend.domain.Scenario;
import com.example.managementbackend.dto.response.scenario.ScenarioListResponse;
import com.example.managementbackend.dto.response.scenario.ScenarioResponse;
import com.example.managementbackend.repository.ScenarioRepository;
import com.example.managementbackend.service.ScenarioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ScenarioServiceImpl implements ScenarioService {

    private final ScenarioRepository scenarioRepository;

    @Override
    public ScenarioListResponse listScenarios() {
        log.debug("Fetching all scenarios");
        List<Scenario> scenarios = scenarioRepository.findAll();
        List<ScenarioResponse> responses = scenarios.stream()
            .map(this::mapToResponse)
            .toList();
        log.info("Retrieved {} scenarios", responses.size());
        return new ScenarioListResponse(responses);
    }

    private ScenarioResponse mapToResponse(Scenario scenario) {
        return new ScenarioResponse(
            scenario.getId(),
            scenario.getName(),
            scenario.getType(),
            scenario.getDescription(),
            scenario.getSeverity(),
            scenario.getDefaultDurationMinutes()
        );
    }
}

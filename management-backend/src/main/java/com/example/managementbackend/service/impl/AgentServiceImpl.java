package com.example.managementbackend.service.impl;

import com.example.managementbackend.domain.AgentConfig;
import com.example.managementbackend.domain.AgentLogEntry;
import com.example.managementbackend.domain.Recommendation;
import com.example.managementbackend.dto.request.agent.*;
import com.example.managementbackend.dto.response.agent.*;
import com.example.managementbackend.model.enums.AutonomyLevel;
import com.example.managementbackend.model.enums.RecommendationStatus;
import com.example.managementbackend.model.enums.RiskTolerance;
import com.example.managementbackend.model.shared.PriorityWeightsDto;
import com.example.managementbackend.repository.AgentConfigRepository;
import com.example.managementbackend.repository.AgentLogEntryRepository;
import com.example.managementbackend.repository.RecommendationRepository;
import com.example.managementbackend.service.AgentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AgentServiceImpl implements AgentService {

    private static final Long CONFIG_SINGLETON_ID = 1L;
    private static final int MAX_PAGE_SIZE = 100;

    private final AgentLogEntryRepository agentLogEntryRepository;
    private final RecommendationRepository recommendationRepository;
    private final AgentConfigRepository agentConfigRepository;

    @Override
    public AgentLogListResponse getLog(int page, int pageSize, String simulationId) {
        log.debug("Fetching agent log: page={}, pageSize={}, simulationId={}", page, pageSize, simulationId);

        if (page < 0 || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("Invalid pagination parameters. Page must be >= 0, pageSize must be 1-" + MAX_PAGE_SIZE);
        }

        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("timestamp").descending());
        Page<AgentLogEntry> logPage;

        if (simulationId != null && !simulationId.isEmpty()) {
            logPage = agentLogEntryRepository.findBySimulationId(simulationId, pageable);
        } else {
            logPage = agentLogEntryRepository.findAll(pageable);
        }

        List<AgentLogEntryResponse> entries = logPage.getContent().stream()
            .map(this::mapLogEntryToResponse)
            .toList();

        log.info("Retrieved {} agent log entries (page {}/{})", entries.size(), page, logPage.getTotalPages());

        return new AgentLogListResponse(
            (int) logPage.getTotalElements(),
            page,
            pageSize,
            entries
        );
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public AgentLogEntryResponse appendLog(AppendAgentLogRequest request) {
        log.debug("Appending agent log entry: actionType={}", request.actionType());

        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }

        AgentLogEntry entry = new AgentLogEntry();
        entry.setTimestamp(Instant.now());
        entry.setActionType(request.actionType());
        entry.setDescription(request.description());
        entry.setReasoning(request.reasoning());
        entry.setKnowledgeBaseSource(request.knowledgeBaseSource());
        entry.setOutcome(request.outcome());

        AgentLogEntry saved = agentLogEntryRepository.save(entry);
        log.info("Appended agent log entry: id={}, actionType={}, outcome={}",
            saved.getId(), saved.getActionType(), saved.getOutcome());

        return mapLogEntryToResponse(saved);
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public AgentLogEntryResponse updateLogOutcome(String id, UpdateAgentLogOutcomeRequest request) {
        log.debug("Updating agent log outcome: id={}", id);

        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }

        AgentLogEntry entry = agentLogEntryRepository.findById(id)
            .orElseThrow(() -> {
                log.warn("Agent log entry not found: id={}", id);
                return new IllegalArgumentException("Agent log entry not found");
            });

        entry.setOutcome(request.outcome());

        AgentLogEntry saved = agentLogEntryRepository.save(entry);
        log.info("Updated agent log outcome: id={}, outcome={}", saved.getId(), saved.getOutcome());

        return mapLogEntryToResponse(saved);
    }

    @Override
    public RecommendationListResponse getRecommendations(String status, int page, int pageSize) {
        log.debug("Fetching recommendations: status={}, page={}, pageSize={}", status, page, pageSize);

        if (page < 0 || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("Invalid pagination parameters. Page must be >= 0, pageSize must be 1-" + MAX_PAGE_SIZE);
        }

        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("createdAt").descending());
        Page<Recommendation> recommendationPage;

        if (status != null && !status.isEmpty()) {
            try {
                RecommendationStatus recStatus = RecommendationStatus.valueOf(status.toUpperCase());
                recommendationPage = recommendationRepository.findByStatus(recStatus, pageable);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid recommendation status: " + status);
            }
        } else {
            recommendationPage = recommendationRepository.findAll(pageable);
        }

        List<RecommendationResponse> recommendations = recommendationPage.getContent().stream()
            .map(this::mapRecommendationToResponse)
            .toList();

        log.info("Retrieved {} recommendations (page {}/{})", recommendations.size(), page, recommendationPage.getTotalPages());

        return new RecommendationListResponse(
            (int) recommendationPage.getTotalElements(),
            page,
            pageSize,
            recommendations
        );
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public RecommendationResponse pushRecommendation(PushRecommendationRequest request) {
        log.debug("Pushing recommendation: actionType={}, urgency={}", request.actionType(), request.urgency());

        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }

        Recommendation recommendation = new Recommendation();
        recommendation.setCreatedAt(Instant.now());
        recommendation.setActionType(request.actionType());
        recommendation.setDescription(request.description());
        recommendation.setReasoning(request.reasoning());
        recommendation.setConfidence(request.confidence());
        recommendation.setUrgency(request.urgency());
        recommendation.setStatus(RecommendationStatus.PENDING);

        if (request.expiresAt() != null) {
            try {
                recommendation.setExpiresAt(Instant.parse(request.expiresAt()));
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid expiresAt format. Expected ISO-8601 format.", e);
            }
        }

        Recommendation saved = recommendationRepository.save(recommendation);
        log.info("Pushed recommendation: id={}, actionType={}, urgency={}",
            saved.getId(), saved.getActionType(), saved.getUrgency());

        return mapRecommendationToResponse(saved);
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public ApproveRecommendationResponse approveRecommendation(String id) {
        log.debug("Approving recommendation: id={}", id);

        Recommendation recommendation = recommendationRepository.findById(id)
            .orElseThrow(() -> {
                log.warn("Recommendation not found: id={}", id);
                return new IllegalArgumentException("Recommendation not found");
            });

        if (recommendation.getStatus() != RecommendationStatus.PENDING) {
            throw new IllegalStateException("Cannot approve recommendation with status: " + recommendation.getStatus());
        }

        recommendation.setStatus(RecommendationStatus.APPROVED);
        recommendation.setExecutedAt(Instant.now());

        Recommendation saved = recommendationRepository.save(recommendation);
        log.info("Approved recommendation: id={}", saved.getId());

        return new ApproveRecommendationResponse(
            saved.getId(),
            saved.getStatus(),
            saved.getExecutedAt().toString()
        );
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public DismissRecommendationResponse dismissRecommendation(String id, DismissRecommendationRequest request) {
        log.debug("Dismissing recommendation: id={}", id);

        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }

        Recommendation recommendation = recommendationRepository.findById(id)
            .orElseThrow(() -> {
                log.warn("Recommendation not found: id={}", id);
                return new IllegalArgumentException("Recommendation not found");
            });

        if (recommendation.getStatus() == RecommendationStatus.APPROVED) {
            throw new IllegalStateException("Cannot dismiss already approved recommendation: " + id);
        }

        recommendation.setStatus(RecommendationStatus.DISMISSED);
        recommendation.setDismissedReason(request.reason());

        Recommendation saved = recommendationRepository.save(recommendation);
        log.info("Dismissed recommendation: id={}, reason={}", saved.getId(), request.reason());

        return new DismissRecommendationResponse(saved.getId(), saved.getStatus());
    }

    @Override
    public AgentConfigResponse getConfig() {
        log.debug("Fetching agent configuration");

        AgentConfig config = agentConfigRepository.findById(CONFIG_SINGLETON_ID)
            .orElseGet(this::createDefaultConfig);

        return mapConfigToResponse(config);
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public AgentConfigResponse updateConfig(UpdateAgentConfigRequest request) {
        log.debug("Updating agent configuration: autonomyLevel={}", request.autonomyLevel());

        if (request == null || request.priorityWeights() == null) {
            throw new IllegalArgumentException("Request and priorityWeights must not be null");
        }

        AgentConfig config = agentConfigRepository.findById(CONFIG_SINGLETON_ID)
            .orElseGet(this::createDefaultConfig);

        config.setAutonomyLevel(request.autonomyLevel());
        config.setCertaintyThreshold(request.certaintyThreshold());
        config.setRiskTolerance(request.riskTolerance());
        config.setPriorityWeightYield(request.priorityWeights().yield());
        config.setPriorityWeightDiversity(request.priorityWeights().diversity());
        config.setPriorityWeightResourceConservation(request.priorityWeights().resourceConservation());

        AgentConfig saved = agentConfigRepository.save(config);
        log.info("Updated agent configuration: autonomyLevel={}, certaintyThreshold={}",
            saved.getAutonomyLevel(), saved.getCertaintyThreshold());

        return mapConfigToResponse(saved);
    }

    // Private mapping methods

    private AgentLogEntryResponse mapLogEntryToResponse(AgentLogEntry entry) {
        return new AgentLogEntryResponse(
            entry.getId(),
            entry.getTimestamp() != null ? entry.getTimestamp().toString() : null,
            entry.getActionType(),
            entry.getDescription(),
            entry.getReasoning(),
            entry.getKnowledgeBaseSource(),
            entry.getOutcome()
        );
    }

    private RecommendationResponse mapRecommendationToResponse(Recommendation recommendation) {
        return new RecommendationResponse(
            recommendation.getId(),
            recommendation.getCreatedAt().toString(),
            recommendation.getActionType(),
            recommendation.getDescription(),
            recommendation.getReasoning(),
            recommendation.getConfidence(),
            recommendation.getUrgency(),
            recommendation.getExpiresAt() != null ? recommendation.getExpiresAt().toString() : null,
            recommendation.getStatus()
        );
    }

    private AgentConfigResponse mapConfigToResponse(AgentConfig config) {
        PriorityWeightsDto weights = new PriorityWeightsDto(
            config.getPriorityWeightYield(),
            config.getPriorityWeightDiversity(),
            config.getPriorityWeightResourceConservation()
        );

        return new AgentConfigResponse(
            config.getAutonomyLevel(),
            config.getCertaintyThreshold(),
            config.getRiskTolerance(),
            weights
        );
    }

    private synchronized AgentConfig createDefaultConfig() {
        // Double-check pattern to prevent race condition
        return agentConfigRepository.findById(CONFIG_SINGLETON_ID)
            .orElseGet(() -> {
                log.debug("Creating default agent configuration");
                AgentConfig config = new AgentConfig();
                config.setId(CONFIG_SINGLETON_ID);
                config.setAutonomyLevel(AutonomyLevel.SUGGEST_ONLY);
                config.setCertaintyThreshold(0.7);
                config.setRiskTolerance(RiskTolerance.MODERATE);
                config.setPriorityWeightYield(0.4);
                config.setPriorityWeightDiversity(0.3);
                config.setPriorityWeightResourceConservation(0.3);
                return agentConfigRepository.save(config);
            });
    }
}

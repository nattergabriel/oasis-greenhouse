package com.example.managementbackend.service.impl;

import com.example.managementbackend.domain.Alert;
import com.example.managementbackend.dto.request.alert.AcknowledgeAlertRequest;
import com.example.managementbackend.dto.request.alert.CreateAlertRequest;
import com.example.managementbackend.dto.request.alert.ResolveAlertRequest;
import com.example.managementbackend.dto.response.alert.AcknowledgeAlertResponse;
import com.example.managementbackend.dto.response.alert.AlertListResponse;
import com.example.managementbackend.dto.response.alert.AlertResponse;
import com.example.managementbackend.dto.response.alert.ResolveAlertResponse;
import com.example.managementbackend.model.enums.AlertStatus;
import com.example.managementbackend.repository.AlertRepository;
import com.example.managementbackend.service.AlertService;
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
public class AlertServiceImpl implements AlertService {

    private static final int MAX_PAGE_SIZE = 100;
    private final AlertRepository alertRepository;

    @Override
    public AlertListResponse listAlerts(String status, int page, int pageSize) {
        log.debug("Fetching alerts: status={}, page={}, pageSize={}", status, page, pageSize);

        if (page < 0 || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("Invalid pagination parameters. Page must be >= 0, pageSize must be 1-" + MAX_PAGE_SIZE);
        }

        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("createdAt").descending());
        Page<Alert> alertPage;

        if (status != null && !status.isEmpty()) {
            try {
                AlertStatus alertStatus = AlertStatus.valueOf(status.toUpperCase());
                alertPage = alertRepository.findByStatus(alertStatus, pageable);
                log.debug("Filtered alerts by status: {}", alertStatus);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid alert status: " + status);
            }
        } else {
            alertPage = alertRepository.findAll(pageable);
        }

        List<AlertResponse> alerts = alertPage.getContent().stream()
            .map(this::mapToResponse)
            .toList();

        log.info("Retrieved {} alerts (page {}/{})", alerts.size(), page, alertPage.getTotalPages());

        return new AlertListResponse(
            (int) alertPage.getTotalElements(),
            page,
            pageSize,
            alerts
        );
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public AlertResponse createAlert(CreateAlertRequest request) {
        log.debug("Creating alert: type={}, severity={}", request.type(), request.severity());

        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }

        Alert alert = new Alert();
        alert.setSeverity(request.severity());
        alert.setType(request.type());
        alert.setCropId(request.cropId());
        alert.setSlotId(request.slotId());
        alert.setGreenhouseId(request.greenhouseId());
        alert.setDiagnosis(request.diagnosis());
        alert.setConfidence(request.confidence());
        alert.setSuggestedAction(request.suggestedAction());
        alert.setStatus(AlertStatus.OPEN);
        alert.setCreatedAt(Instant.now());
        alert.setEscalatedToHuman(false);

        Alert saved = alertRepository.save(alert);
        log.info("Created alert: id={}, type={}, severity={}", saved.getId(), saved.getType(), saved.getSeverity());

        return mapToResponse(saved);
    }

    @Override
    public AlertResponse getAlert(String id) {
        log.debug("Fetching alert: id={}", id);

        Alert alert = alertRepository.findById(id)
            .orElseThrow(() -> {
                log.warn("Alert not found: id={}", id);
                return new IllegalArgumentException("Alert not found");
            });

        return mapToResponse(alert);
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public AcknowledgeAlertResponse acknowledgeAlert(String id, AcknowledgeAlertRequest request) {
        log.debug("Acknowledging alert: id={}", id);

        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }

        Alert alert = alertRepository.findById(id)
            .orElseThrow(() -> {
                log.warn("Alert not found: id={}", id);
                return new IllegalArgumentException("Alert not found");
            });

        if (alert.getStatus() != AlertStatus.OPEN) {
            throw new IllegalStateException("Cannot acknowledge alert with status: " + alert.getStatus());
        }

        alert.setStatus(AlertStatus.ACKNOWLEDGED);
        alert.setEscalatedToHuman(true);

        Alert saved = alertRepository.save(alert);
        log.info("Acknowledged alert: id={}, operatorNote={}", saved.getId(), request.operatorNote() != null ? "provided" : "none");

        return new AcknowledgeAlertResponse(saved.getId(), saved.getStatus());
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public ResolveAlertResponse resolveAlert(String id, ResolveAlertRequest request) {
        log.debug("Resolving alert: id={}", id);

        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }

        Alert alert = alertRepository.findById(id)
            .orElseThrow(() -> {
                log.warn("Alert not found: id={}", id);
                return new IllegalArgumentException("Alert not found");
            });

        if (alert.getStatus() == AlertStatus.RESOLVED) {
            throw new IllegalStateException("Alert is already resolved: " + id);
        }

        alert.setStatus(AlertStatus.RESOLVED);
        alert.setResolvedAt(Instant.now());

        Alert saved = alertRepository.save(alert);
        log.info("Resolved alert: id={}, resolution={}", saved.getId(), request.resolution());

        return new ResolveAlertResponse(
            saved.getId(),
            saved.getStatus(),
            saved.getResolvedAt().toString()
        );
    }

    private AlertResponse mapToResponse(Alert alert) {
        return new AlertResponse(
            alert.getId(),
            alert.getCreatedAt().toString(),
            alert.getResolvedAt() != null ? alert.getResolvedAt().toString() : null,
            alert.getSeverity(),
            alert.getType(),
            alert.getCropId(),
            alert.getSlotId(),
            alert.getGreenhouseId(),
            alert.getDiagnosis(),
            alert.getConfidence(),
            alert.getStatus(),
            alert.isEscalatedToHuman(),
            alert.getSuggestedAction()
        );
    }
}

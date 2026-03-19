package com.example.managementbackend.service.impl;

import com.example.managementbackend.domain.MissionConfig;
import com.example.managementbackend.dto.request.forecast.SetMissionDatesRequest;
import com.example.managementbackend.dto.response.forecast.*;
import com.example.managementbackend.model.enums.MilestoneType;
import com.example.managementbackend.model.enums.RiskLevel;
import com.example.managementbackend.repository.MissionConfigRepository;
import com.example.managementbackend.service.ForecastService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ForecastServiceImpl implements ForecastService {

    private static final Long MISSION_CONFIG_SINGLETON_ID = 1L;
    private static final int MISSION_DURATION_DAYS = 450;

    // Resource threshold levels for risk assessment
    private static final double WATER_RISK_HIGH_THRESHOLD = 40.0;
    private static final double WATER_RISK_MODERATE_THRESHOLD = 60.0;

    private final MissionConfigRepository missionConfigRepository;

    @Override
    public ResourceForecastResponse getResourceForecast(int daysAhead) {
        log.debug("Generating resource forecast: daysAhead={}", daysAhead);
        List<ResourceProjectionDto> forecast = new ArrayList<>();

        for (int day = 1; day <= daysAhead; day++) {
            double waterPercent = Math.max(20, 75 - (day * 0.5) + Math.sin(day * 0.3) * 5);
            double nutrientPercent = Math.max(25, 80 - (day * 0.4) + Math.cos(day * 0.2) * 3);
            double energyPercent = Math.max(30, 70 - (day * 0.3) + Math.sin(day * 0.4) * 8);

            RiskLevel risk = waterPercent < WATER_RISK_HIGH_THRESHOLD ? RiskLevel.HIGH
                : waterPercent < WATER_RISK_MODERATE_THRESHOLD ? RiskLevel.MODERATE
                : RiskLevel.LOW;

            forecast.add(new ResourceProjectionDto(day, waterPercent, nutrientPercent, energyPercent, risk));
        }

        log.info("Generated resource forecast for {} days", daysAhead);
        return new ResourceForecastResponse(Instant.now().toString(), daysAhead, forecast);
    }

    @Override
    public MissionTimelineResponse getMissionTimeline() {
        log.debug("Generating mission timeline");

        MissionConfig config = missionConfigRepository.findById(MISSION_CONFIG_SINGLETON_ID)
            .orElseGet(this::createDefaultMissionConfig);

        List<MilestoneDto> milestones = List.of(
            new MilestoneDto(0, config.getMissionStartDate().toString(), MilestoneType.PLANTING_DEADLINE, "Mission Start", null),
            new MilestoneDto(30, config.getMissionStartDate().plusDays(30).toString(), MilestoneType.HARVEST_WINDOW, "First Harvest", null),
            new MilestoneDto(90, config.getMissionStartDate().plusDays(90).toString(), MilestoneType.PLANTING_DEADLINE, "Full Production", null),
            new MilestoneDto(180, config.getMissionStartDate().plusDays(180).toString(), MilestoneType.RESOURCE_CRITICAL, "Mid-Mission Review", null),
            new MilestoneDto(270, config.getMissionStartDate().plusDays(270).toString(), MilestoneType.RESOURCE_CRITICAL, "Resource Optimization", null),
            new MilestoneDto(360, config.getMissionStartDate().plusDays(360).toString(), MilestoneType.PLANTING_DEADLINE, "Final Harvest Cycle", null),
            new MilestoneDto(MISSION_DURATION_DAYS, config.getMissionEndDate().toString(), MilestoneType.TRIP_END, "Mission Complete", null)
        );

        log.info("Generated mission timeline with {} milestones", milestones.size());
        return new MissionTimelineResponse(
            config.getMissionStartDate().toString(),
            config.getMissionEndDate().toString(),
            0, MISSION_DURATION_DAYS, milestones
        );
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public SetMissionDatesResponse setMissionDates(SetMissionDatesRequest request) {
        log.debug("Setting mission dates: startDate={}, endDate={}", request.missionStartDate(), request.missionEndDate());

        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }

        MissionConfig config = missionConfigRepository.findById(MISSION_CONFIG_SINGLETON_ID)
            .orElseGet(this::createDefaultMissionConfig);

        try {
            config.setMissionStartDate(LocalDate.parse(request.missionStartDate()));
            config.setMissionEndDate(LocalDate.parse(request.missionEndDate()));
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid date format. Expected ISO-8601 date format (YYYY-MM-DD).", e);
        }

        MissionConfig saved = missionConfigRepository.save(config);
        log.info("Mission dates set: start={}, end={}", saved.getMissionStartDate(), saved.getMissionEndDate());

        int totalDays = (int) java.time.temporal.ChronoUnit.DAYS.between(saved.getMissionStartDate(), saved.getMissionEndDate());

        return new SetMissionDatesResponse(
            saved.getMissionStartDate().toString(),
            saved.getMissionEndDate().toString(),
            totalDays
        );
    }

    private synchronized MissionConfig createDefaultMissionConfig() {
        // Double-check pattern to prevent race condition
        return missionConfigRepository.findById(MISSION_CONFIG_SINGLETON_ID)
            .orElseGet(() -> {
                log.debug("Creating default mission config");
                MissionConfig config = new MissionConfig();
                config.setId(MISSION_CONFIG_SINGLETON_ID);
                config.setMissionStartDate(LocalDate.now());
                config.setMissionEndDate(LocalDate.now().plusDays(MISSION_DURATION_DAYS));
                return missionConfigRepository.save(config);
            });
    }
}

package com.example.managementbackend.dto.response.forecast;
import java.util.List;
public record MissionTimelineResponse(
    String missionStartDate, String missionEndDate,
    int currentMissionDay, int totalMissionDays,
    List<MilestoneDto> milestones
) {}

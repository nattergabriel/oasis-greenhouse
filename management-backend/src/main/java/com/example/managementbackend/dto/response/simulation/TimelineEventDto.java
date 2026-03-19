package com.example.managementbackend.dto.response.simulation;
import com.example.managementbackend.model.enums.TimelineEventType;
import java.util.Map;
public record TimelineEventDto(
    String id, String timestamp, int missionDay,
    TimelineEventType type, String summary,
    Map<String, Object> payload
) {}

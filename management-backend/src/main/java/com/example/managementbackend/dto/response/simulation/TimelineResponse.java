package com.example.managementbackend.dto.response.simulation;
import java.util.List;
public record TimelineResponse(String simulationId, int total, int page, int pageSize, List<TimelineEventDto> events) {}

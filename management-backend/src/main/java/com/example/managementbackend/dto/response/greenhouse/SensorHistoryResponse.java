package com.example.managementbackend.dto.response.greenhouse;
import java.util.List;
public record SensorHistoryResponse(
    String from, String to, String interval,
    List<SensorHistoryReadingDto> readings
) {}

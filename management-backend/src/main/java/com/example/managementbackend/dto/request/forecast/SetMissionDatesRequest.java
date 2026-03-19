package com.example.managementbackend.dto.request.forecast;
import jakarta.validation.constraints.NotBlank;
public record SetMissionDatesRequest(
    @NotBlank String missionStartDate,
    @NotBlank String missionEndDate
) {}

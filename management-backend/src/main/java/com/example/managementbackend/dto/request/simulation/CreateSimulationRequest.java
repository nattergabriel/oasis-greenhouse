package com.example.managementbackend.dto.request.simulation;
import com.example.managementbackend.model.shared.AgentConfigDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
public record CreateSimulationRequest(
    @NotBlank @Size(max = 200) String name,
    @NotBlank @Size(max = 2000) String learningGoal,
    @NotNull @Min(1) Integer missionDuration,
    @NotNull @Min(1) Integer crewSize,
    @NotNull @Positive Double yieldTarget,
    @NotNull @Valid ResourceAvailabilityRequest resourceAvailability,
    @NotNull @Valid AgentConfigDto agentConfig
) {}

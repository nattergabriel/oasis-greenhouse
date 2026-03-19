package com.example.managementbackend.dto.response.onboarding;
import java.util.List;
public record CompleteStepResponse(String stepKey, List<String> completedSteps, boolean allCompleted) {}

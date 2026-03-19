package com.example.managementbackend.dto.response.onboarding;
import java.util.List;
public record OnboardingStatusResponse(boolean completed, List<String> completedSteps, int totalSteps) {}

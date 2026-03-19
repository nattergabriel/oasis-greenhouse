package com.example.managementbackend.service;

import com.example.managementbackend.dto.response.onboarding.CompleteOnboardingResponse;
import com.example.managementbackend.dto.response.onboarding.CompleteStepResponse;
import com.example.managementbackend.dto.response.onboarding.OnboardingStatusResponse;

public interface OnboardingService {
    OnboardingStatusResponse getStatus();
    CompleteOnboardingResponse markComplete();
    CompleteStepResponse markStepComplete(String stepKey);
    void resetOnboarding();
}

package com.example.managementbackend.controller;

import com.example.managementbackend.service.OnboardingService;
import com.example.managementbackend.dto.response.onboarding.CompleteOnboardingResponse;
import com.example.managementbackend.dto.response.onboarding.CompleteStepResponse;
import com.example.managementbackend.dto.response.onboarding.OnboardingStatusResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService onboardingService;

    @GetMapping("/status")
    public ResponseEntity<OnboardingStatusResponse> getStatus() {
        return ResponseEntity.ok(onboardingService.getStatus());
    }

    @PostMapping("/complete")
    public ResponseEntity<CompleteOnboardingResponse> markComplete() {
        return ResponseEntity.ok(onboardingService.markComplete());
    }

    @PostMapping("/steps/{stepKey}/complete")
    public ResponseEntity<CompleteStepResponse> markStepComplete(@PathVariable String stepKey) {
        return ResponseEntity.ok(onboardingService.markStepComplete(stepKey));
    }

    @DeleteMapping("/status")
    public ResponseEntity<Void> resetOnboarding() {
        onboardingService.resetOnboarding();
        return ResponseEntity.noContent().build();
    }
}

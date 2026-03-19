package com.example.managementbackend.service.impl;

import com.example.managementbackend.domain.OnboardingState;
import com.example.managementbackend.dto.response.onboarding.CompleteOnboardingResponse;
import com.example.managementbackend.dto.response.onboarding.CompleteStepResponse;
import com.example.managementbackend.dto.response.onboarding.OnboardingStatusResponse;
import com.example.managementbackend.repository.OnboardingStateRepository;
import com.example.managementbackend.service.OnboardingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OnboardingServiceImpl implements OnboardingService {

    private static final Long SINGLETON_ID = 1L;
    private static final List<String> ALL_STEPS = Arrays.asList(
        "welcome", "greenhouse_tour", "crop_setup", "agent_intro", "first_simulation"
    );

    private final OnboardingStateRepository onboardingStateRepository;

    @Override
    public OnboardingStatusResponse getStatus() {
        OnboardingState state = getOrCreateState();
        return new OnboardingStatusResponse(
            state.isCompleted(),
            state.getCompletedSteps(),
            ALL_STEPS.size()
        );
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public CompleteOnboardingResponse markComplete() {
        OnboardingState state = getOrCreateState();
        state.setCompleted(true);
        state.setCompletedAt(Instant.now());
        state.setCompletedSteps(new ArrayList<>(ALL_STEPS));
        OnboardingState saved = onboardingStateRepository.save(state);
        log.info("Onboarding marked complete at {}", saved.getCompletedAt());
        return new CompleteOnboardingResponse(
            saved.isCompleted(),
            saved.getCompletedAt() != null ? saved.getCompletedAt().toString() : null
        );
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public CompleteStepResponse markStepComplete(String stepKey) {
        if (!ALL_STEPS.contains(stepKey)) {
            throw new IllegalArgumentException("Invalid step key: " + stepKey);
        }

        OnboardingState state = getOrCreateState();
        if (!state.getCompletedSteps().contains(stepKey)) {
            state.getCompletedSteps().add(stepKey);
        }

        boolean allCompleted = state.getCompletedSteps().containsAll(ALL_STEPS);
        if (allCompleted && !state.isCompleted()) {
            state.setCompleted(true);
            state.setCompletedAt(Instant.now());
        }

        OnboardingState saved = onboardingStateRepository.save(state);
        log.info("Step '{}' marked complete. Total completed: {}/{}", stepKey, saved.getCompletedSteps().size(), ALL_STEPS.size());

        return new CompleteStepResponse(
            stepKey,
            saved.getCompletedSteps(),
            saved.isCompleted()
        );
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public void resetOnboarding() {
        OnboardingState state = getOrCreateState();
        state.setCompleted(false);
        state.setCompletedAt(null);
        state.setCompletedSteps(new ArrayList<>());
        onboardingStateRepository.save(state);
        log.info("Onboarding state reset");
    }

    private OnboardingState getOrCreateState() {
        return onboardingStateRepository.findById(SINGLETON_ID)
            .orElseGet(this::createDefaultState);
    }

    private synchronized OnboardingState createDefaultState() {
        // Double-check pattern to prevent race condition
        return onboardingStateRepository.findById(SINGLETON_ID)
            .orElseGet(() -> {
                log.debug("Creating default onboarding state");
                OnboardingState state = new OnboardingState();
                state.setId(SINGLETON_ID);
                state.setCompleted(false);
                state.setCompletedSteps(new ArrayList<>());
                return onboardingStateRepository.save(state);
            });
    }
}

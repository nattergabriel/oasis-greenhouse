package com.example.managementbackend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "onboarding_state")
@Getter
@Setter
@NoArgsConstructor
public class OnboardingState {

    @Id
    private Long id;

    private boolean completed;
    private Instant completedAt;

    @ElementCollection
    @CollectionTable(name = "onboarding_completed_steps", joinColumns = @JoinColumn(name = "state_id"))
    @Column(name = "step_key")
    private List<String> completedSteps = new ArrayList<>();
}

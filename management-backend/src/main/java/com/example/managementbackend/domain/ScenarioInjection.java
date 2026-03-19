package com.example.managementbackend.domain;

import com.example.managementbackend.model.enums.InjectionStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "scenario_injections")
@Getter
@Setter
@NoArgsConstructor
public class ScenarioInjection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String simulationId;
    private String scenarioId;
    private String scenarioName;
    private Instant triggeredAt;
    private Instant resolvedAt;
    private double intensity;

    @Enumerated(EnumType.STRING)
    private InjectionStatus status = InjectionStatus.ACTIVE;
}

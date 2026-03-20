package com.example.managementbackend.domain;

import com.example.managementbackend.model.enums.AutonomyLevel;
import com.example.managementbackend.model.enums.RiskTolerance;
import com.example.managementbackend.model.enums.SimulationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "simulations")
@Getter
@Setter
@NoArgsConstructor
public class Simulation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;

    @Column(length = 5000)
    private String learningGoal;

    @Enumerated(EnumType.STRING)
    private SimulationStatus status;

    private Instant createdAt;
    private Instant completedAt;
    private int missionDuration;
    private int crewSize;
    private double yieldTarget;
    private Double outcomeScore;

    @Enumerated(EnumType.STRING)
    private AutonomyLevel autonomyLevel;

    @Enumerated(EnumType.STRING)
    private RiskTolerance riskTolerance;

    // ResourceAvailability (flattened)
    private double waterLiters;
    private double nutrientKg;
    private double energyKwh;

    // AgentConfig (flattened)
    private double certaintyThreshold;
    private double priorityWeightYield;
    private double priorityWeightDiversity;
    private double priorityWeightResourceConservation;

    // Agent backend results (JSON blob from Python agent)
    @Column(columnDefinition = "TEXT")
    private String agentResultsJson;
}

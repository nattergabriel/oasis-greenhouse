package com.example.managementbackend.domain;

import com.example.managementbackend.model.enums.AutonomyLevel;
import com.example.managementbackend.model.enums.RiskTolerance;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "agent_config")
@Getter
@Setter
@NoArgsConstructor
public class AgentConfig {

    @Id
    private Long id;

    @Enumerated(EnumType.STRING)
    private AutonomyLevel autonomyLevel;

    private double certaintyThreshold;

    @Enumerated(EnumType.STRING)
    private RiskTolerance riskTolerance;

    private double priorityWeightYield;
    private double priorityWeightDiversity;
    private double priorityWeightResourceConservation;
}

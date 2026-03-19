package com.example.managementbackend.domain;

import com.example.managementbackend.model.enums.ScenarioSeverity;
import com.example.managementbackend.model.enums.ScenarioType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "scenarios")
@Getter
@Setter
@NoArgsConstructor
public class Scenario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;

    @Enumerated(EnumType.STRING)
    private ScenarioType type;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    private ScenarioSeverity severity;

    private Integer defaultDurationMinutes;
}

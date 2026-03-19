package com.example.managementbackend.domain;

import com.example.managementbackend.model.enums.AgentOutcome;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "agent_log_entries")
@Getter
@Setter
@NoArgsConstructor
public class AgentLogEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private Instant timestamp;
    private String actionType;

    @Column(length = 1000)
    private String description;

    @Column(length = 10000)
    private String reasoning;

    private String knowledgeBaseSource;

    @Enumerated(EnumType.STRING)
    private AgentOutcome outcome;

    private String simulationId;
}

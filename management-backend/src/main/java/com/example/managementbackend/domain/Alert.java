package com.example.managementbackend.domain;

import com.example.managementbackend.model.enums.AlertSeverity;
import com.example.managementbackend.model.enums.AlertStatus;
import com.example.managementbackend.model.enums.AlertType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "alerts")
@Getter
@Setter
@NoArgsConstructor
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private Instant createdAt;
    private Instant resolvedAt;

    @Enumerated(EnumType.STRING)
    private AlertSeverity severity;

    @Enumerated(EnumType.STRING)
    private AlertType type;

    private String cropId;
    private String slotId;
    private String greenhouseId;

    @Column(length = 5000)
    private String diagnosis;

    private double confidence;

    @Enumerated(EnumType.STRING)
    private AlertStatus status = AlertStatus.OPEN;

    private boolean escalatedToHuman;

    @Column(length = 1000)
    private String suggestedAction;
}

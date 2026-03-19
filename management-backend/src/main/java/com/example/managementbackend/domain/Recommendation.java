package com.example.managementbackend.domain;

import com.example.managementbackend.model.enums.RecommendationStatus;
import com.example.managementbackend.model.enums.Urgency;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "recommendations")
@Getter
@Setter
@NoArgsConstructor
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private Instant createdAt;
    private String actionType;

    @Column(length = 1000)
    private String description;

    @Column(length = 10000)
    private String reasoning;

    private double confidence;

    @Enumerated(EnumType.STRING)
    private Urgency urgency;

    private Instant expiresAt;

    @Enumerated(EnumType.STRING)
    private RecommendationStatus status = RecommendationStatus.PENDING;

    private Instant executedAt;

    @Column(length = 1000)
    private String dismissedReason;
}

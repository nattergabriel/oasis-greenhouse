package com.example.managementbackend.domain;

import com.example.managementbackend.model.enums.TimelineEventType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "timeline_events")
@Getter
@Setter
@NoArgsConstructor
public class TimelineEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String simulationId;
    private Instant timestamp;
    private int missionDay;

    @Enumerated(EnumType.STRING)
    private TimelineEventType type;

    @Column(length = 1000)
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String payload;
}

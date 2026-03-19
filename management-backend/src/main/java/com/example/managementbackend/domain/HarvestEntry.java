package com.example.managementbackend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "harvest_entries")
@Getter
@Setter
@NoArgsConstructor
public class HarvestEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private Instant harvestedAt;
    private int missionDay;
    private String cropId;
    private String cropName;
    private double yieldKg;
    private String slotId;
    private String greenhouseId;

    @Column(length = 1000)
    private String notes;
}

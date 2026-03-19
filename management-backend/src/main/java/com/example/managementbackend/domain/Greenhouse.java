package com.example.managementbackend.domain;

import com.example.managementbackend.model.enums.GreenhouseStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "greenhouses")
@Getter
@Setter
@NoArgsConstructor
public class Greenhouse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;
    private String description;
    private int rows;
    private int cols;

    @Enumerated(EnumType.STRING)
    private GreenhouseStatus overallStatus = GreenhouseStatus.HEALTHY;

    private Instant createdAt;

    @OneToMany(mappedBy = "greenhouse", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PlantSlot> slots = new ArrayList<>();
}

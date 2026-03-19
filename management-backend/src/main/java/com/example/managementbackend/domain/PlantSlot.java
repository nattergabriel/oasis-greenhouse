package com.example.managementbackend.domain;

import com.example.managementbackend.model.enums.SlotStatus;
import com.example.managementbackend.model.enums.StressType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "plant_slots")
@Getter
@Setter
@NoArgsConstructor
public class PlantSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private int slotRow;
    private int slotCol;

    private String cropId;
    private String cropName;

    @Enumerated(EnumType.STRING)
    private SlotStatus status = SlotStatus.EMPTY;

    private double growthStagePercent;
    private Integer daysUntilHarvest;
    private Instant plantedAt;
    private Double estimatedYieldKg;

    @ElementCollection
    @CollectionTable(name = "plant_slot_stress_types", joinColumns = @JoinColumn(name = "slot_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "stress_type")
    private List<StressType> activeStressTypes = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "greenhouse_id")
    private Greenhouse greenhouse;
}

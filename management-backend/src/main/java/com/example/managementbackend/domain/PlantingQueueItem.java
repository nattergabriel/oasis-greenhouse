package com.example.managementbackend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "planting_queue_items")
@Getter
@Setter
@NoArgsConstructor
public class PlantingQueueItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private int rank;
    private String cropId;
    private String cropName;
    private String greenhouseId;
    private Instant recommendedPlantDate;
    private int missionDay;

    @Column(length = 1000)
    private String reason;

    @ElementCollection
    @CollectionTable(name = "planting_queue_nutritional_gaps", joinColumns = @JoinColumn(name = "item_id"))
    @Column(name = "gap")
    private List<String> nutritionalGapsAddressed = new ArrayList<>();
}

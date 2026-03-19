package com.example.managementbackend.domain;

import com.example.managementbackend.model.enums.CropCategory;
import com.example.managementbackend.model.enums.StressType;
import com.example.managementbackend.model.enums.WaterRequirement;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "crops")
@Getter
@Setter
@NoArgsConstructor
public class Crop {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;

    @Enumerated(EnumType.STRING)
    private CropCategory category;

    private int growthDays;
    private double harvestIndex;
    private double typicalYieldPerM2Kg;

    @Enumerated(EnumType.STRING)
    private WaterRequirement waterRequirement;

    // EnvironmentalRequirements (flattened)
    private double optimalTempMinC;
    private double optimalTempMaxC;
    private double heatStressThresholdC;
    private double optimalHumidityMinPct;
    private double optimalHumidityMaxPct;
    private double lightRequirementParMin;
    private double lightRequirementParMax;
    private double optimalCo2PpmMin;
    private double optimalCo2PpmMax;
    private double optimalPhMin;
    private double optimalPhMax;

    // NutritionalProfile (flattened)
    private double caloriesPer100g;
    private double proteinG;
    private double carbsG;
    private double fatG;
    private double fiberG;
    private Double vitaminAMcg;
    private Double vitaminCMg;
    private Double vitaminKMcg;
    private Double folateMcg;
    private Double ironMg;
    private Double potassiumMg;
    private Double magnesiumMg;

    @ElementCollection
    @CollectionTable(name = "crop_stress_sensitivities", joinColumns = @JoinColumn(name = "crop_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "stress_type")
    private List<StressType> stressSensitivities = new ArrayList<>();
}

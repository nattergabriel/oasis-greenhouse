package com.example.managementbackend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "stockpile_items")
@Getter
@Setter
@NoArgsConstructor
public class StockpileItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String cropId;
    private String cropName;
    private double quantityKg;
    private double estimatedCalories;
    private double daysOfSupply;
    private Integer expiresInDays;
    private Instant updatedAt;
}

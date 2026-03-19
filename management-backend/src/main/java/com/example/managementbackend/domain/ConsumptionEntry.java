package com.example.managementbackend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "consumption_entries")
@Getter
@Setter
@NoArgsConstructor
public class ConsumptionEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private LocalDate date;
    private String cropId;
    private double quantityKg;
    private double caloriesLogged;
}

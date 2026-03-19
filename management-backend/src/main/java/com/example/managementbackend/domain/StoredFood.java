package com.example.managementbackend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "stored_food")
@Getter
@Setter
@NoArgsConstructor
public class StoredFood {

    @Id
    private Long id;

    private double totalCalories;
    private double remainingCalories;
}

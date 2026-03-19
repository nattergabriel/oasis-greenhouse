package com.example.managementbackend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "mission_config")
@Getter
@Setter
@NoArgsConstructor
public class MissionConfig {

    @Id
    private Long id;

    private LocalDate missionStartDate;
    private LocalDate missionEndDate;
}

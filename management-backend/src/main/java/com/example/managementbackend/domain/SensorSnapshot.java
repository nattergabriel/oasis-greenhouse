package com.example.managementbackend.domain;

import com.example.managementbackend.model.enums.LightCyclePhase;
import com.example.managementbackend.model.enums.SensorStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "sensor_snapshots")
@Getter
@Setter
@NoArgsConstructor
public class SensorSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String greenhouseId;
    private Instant timestamp;

    @Enumerated(EnumType.STRING)
    private LightCyclePhase lightCyclePhase;

    private double temperature;
    @Enumerated(EnumType.STRING)
    private SensorStatus temperatureStatus;

    private double humidity;
    @Enumerated(EnumType.STRING)
    private SensorStatus humidityStatus;

    private double lightIntensity;
    @Enumerated(EnumType.STRING)
    private SensorStatus lightIntensityStatus;

    private double par;
    @Enumerated(EnumType.STRING)
    private SensorStatus parStatus;

    private double co2;
    @Enumerated(EnumType.STRING)
    private SensorStatus co2Status;

    private double waterFlowRate;
    @Enumerated(EnumType.STRING)
    private SensorStatus waterFlowRateStatus;

    private double waterRecyclingEfficiency;
    @Enumerated(EnumType.STRING)
    private SensorStatus waterRecyclingEfficiencyStatus;

    private double nutrientPh;
    @Enumerated(EnumType.STRING)
    private SensorStatus nutrientPhStatus;

    private double nutrientEc;
    @Enumerated(EnumType.STRING)
    private SensorStatus nutrientEcStatus;

    private double nutrientDo;
    @Enumerated(EnumType.STRING)
    private SensorStatus nutrientDoStatus;
}

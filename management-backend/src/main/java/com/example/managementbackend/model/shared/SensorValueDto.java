package com.example.managementbackend.model.shared;
import com.example.managementbackend.model.enums.SensorStatus;
public record SensorValueDto(double value, SensorStatus status) {}

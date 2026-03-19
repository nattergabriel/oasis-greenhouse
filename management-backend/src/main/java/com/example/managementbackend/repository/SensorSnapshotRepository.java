package com.example.managementbackend.repository;

import com.example.managementbackend.domain.SensorSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface SensorSnapshotRepository extends JpaRepository<SensorSnapshot, String> {
    Optional<SensorSnapshot> findTopByGreenhouseIdOrderByTimestampDesc(String greenhouseId);
    List<SensorSnapshot> findByGreenhouseIdAndTimestampBetween(String greenhouseId, Instant from, Instant to);
}

package com.example.managementbackend.repository;

import com.example.managementbackend.domain.PlantSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlantSlotRepository extends JpaRepository<PlantSlot, String> {
    List<PlantSlot> findByGreenhouseId(String greenhouseId);
    Optional<PlantSlot> findByGreenhouseIdAndId(String greenhouseId, String id);
}

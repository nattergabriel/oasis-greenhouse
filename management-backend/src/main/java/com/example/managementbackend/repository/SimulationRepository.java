package com.example.managementbackend.repository;

import com.example.managementbackend.domain.Simulation;
import com.example.managementbackend.model.enums.SimulationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SimulationRepository extends JpaRepository<Simulation, String> {
    List<Simulation> findByStatus(SimulationStatus status);
}

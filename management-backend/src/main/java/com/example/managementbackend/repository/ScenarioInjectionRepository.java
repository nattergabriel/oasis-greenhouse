package com.example.managementbackend.repository;

import com.example.managementbackend.domain.ScenarioInjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScenarioInjectionRepository extends JpaRepository<ScenarioInjection, String> {
    List<ScenarioInjection> findBySimulationId(String simulationId);
}

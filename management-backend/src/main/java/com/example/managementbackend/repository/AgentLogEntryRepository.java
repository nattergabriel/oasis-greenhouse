package com.example.managementbackend.repository;

import com.example.managementbackend.domain.AgentLogEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AgentLogEntryRepository extends JpaRepository<AgentLogEntry, String> {
    Page<AgentLogEntry> findBySimulationId(String simulationId, Pageable pageable);
}

package com.example.managementbackend.repository;

import com.example.managementbackend.domain.AgentConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AgentConfigRepository extends JpaRepository<AgentConfig, Long> {
}

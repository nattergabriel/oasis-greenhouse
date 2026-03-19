package com.example.managementbackend.repository;

import com.example.managementbackend.domain.MissionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MissionConfigRepository extends JpaRepository<MissionConfig, Long> {
}

package com.example.managementbackend.repository;

import com.example.managementbackend.domain.TimelineEvent;
import com.example.managementbackend.model.enums.TimelineEventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TimelineEventRepository extends JpaRepository<TimelineEvent, String> {
    Page<TimelineEvent> findBySimulationId(String simulationId, Pageable pageable);
    Page<TimelineEvent> findBySimulationIdAndType(String simulationId, TimelineEventType type, Pageable pageable);
}

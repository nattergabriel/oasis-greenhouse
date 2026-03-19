package com.example.managementbackend.repository;

import com.example.managementbackend.domain.PlantingQueueItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlantingQueueItemRepository extends JpaRepository<PlantingQueueItem, String> {
    List<PlantingQueueItem> findAllByOrderByRankAsc();
    List<PlantingQueueItem> findByGreenhouseIdOrderByRankAsc(String greenhouseId);
}

package com.example.managementbackend.repository;

import com.example.managementbackend.domain.StockpileItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StockpileItemRepository extends JpaRepository<StockpileItem, String> {
    Optional<StockpileItem> findByCropId(String cropId);
}

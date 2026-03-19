package com.example.managementbackend.repository;

import com.example.managementbackend.domain.Recommendation;
import com.example.managementbackend.model.enums.RecommendationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, String> {
    Page<Recommendation> findByStatus(RecommendationStatus status, Pageable pageable);
}

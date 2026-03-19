package com.example.managementbackend.repository;

import com.example.managementbackend.domain.StoredFood;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoredFoodRepository extends JpaRepository<StoredFood, Long> {
}

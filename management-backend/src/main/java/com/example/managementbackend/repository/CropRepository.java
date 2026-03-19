package com.example.managementbackend.repository;

import com.example.managementbackend.domain.Crop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CropRepository extends JpaRepository<Crop, String> {
    Optional<Crop> findByName(String name);
}

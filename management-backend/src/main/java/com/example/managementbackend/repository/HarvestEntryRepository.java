package com.example.managementbackend.repository;

import com.example.managementbackend.domain.HarvestEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HarvestEntryRepository extends JpaRepository<HarvestEntry, String> {
    Page<HarvestEntry> findByGreenhouseId(String greenhouseId, Pageable pageable);
    Page<HarvestEntry> findByCropId(String cropId, Pageable pageable);
    Page<HarvestEntry> findByGreenhouseIdAndCropId(String greenhouseId, String cropId, Pageable pageable);
}

package com.example.managementbackend.repository;

import com.example.managementbackend.domain.ConsumptionEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ConsumptionEntryRepository extends JpaRepository<ConsumptionEntry, String> {
    List<ConsumptionEntry> findByDateBetween(LocalDate from, LocalDate to);
}

package com.example.managementbackend.repository;

import com.example.managementbackend.domain.Alert;
import com.example.managementbackend.model.enums.AlertStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AlertRepository extends JpaRepository<Alert, String> {
    Page<Alert> findByStatus(AlertStatus status, Pageable pageable);
}

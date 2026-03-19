package com.example.managementbackend.repository;

import com.example.managementbackend.domain.OnboardingState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OnboardingStateRepository extends JpaRepository<OnboardingState, Long> {
}

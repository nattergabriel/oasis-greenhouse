package com.example.managementbackend.service;

public interface DataSeederService {
    void seedDatabase();
    void seedCrops();
    void seedGreenhouse();
    void seedMissionConfig();
    void clearAllData();
}

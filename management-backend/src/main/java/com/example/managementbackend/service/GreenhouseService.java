package com.example.managementbackend.service;

import com.example.managementbackend.dto.request.greenhouse.CreateGreenhouseRequest;
import com.example.managementbackend.dto.request.greenhouse.UpdateGreenhouseRequest;
import com.example.managementbackend.dto.response.greenhouse.*;

public interface GreenhouseService {
    GreenhouseListResponse listGreenhouses();
    CreateGreenhouseResponse createGreenhouse(CreateGreenhouseRequest request);
    GreenhouseDetailResponse getGreenhouseDetail(String id, String slotStatus);
    UpdateGreenhouseResponse updateGreenhouse(String id, UpdateGreenhouseRequest request);
    void deleteGreenhouse(String id);
    SensorSnapshotResponse getLatestSensorSnapshot(String id);
    SensorHistoryResponse getSensorHistory(String id, String from, String to, String interval);
}

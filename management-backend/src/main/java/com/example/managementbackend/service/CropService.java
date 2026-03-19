package com.example.managementbackend.service;

import com.example.managementbackend.dto.request.crop.LogHarvestRequest;
import com.example.managementbackend.dto.request.crop.PublishPlantingQueueRequest;
import com.example.managementbackend.dto.request.crop.UpdateHarvestRequest;
import com.example.managementbackend.dto.response.crop.*;

public interface CropService {
    CropListResponse listCrops();
    PlantingQueueResponse getPlantingQueue(String greenhouseId);
    PublishPlantingQueueResponse publishPlantingQueue(PublishPlantingQueueRequest request);
    HarvestListResponse getHarvestJournal(int page, int pageSize, String greenhouseId, String cropId);
    HarvestEntryResponse logHarvest(LogHarvestRequest request);
    HarvestEntryResponse updateHarvest(String id, UpdateHarvestRequest request);
    StockpileResponse getStockpile();
}

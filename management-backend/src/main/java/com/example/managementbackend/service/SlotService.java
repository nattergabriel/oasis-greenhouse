package com.example.managementbackend.service;

import com.example.managementbackend.dto.request.slot.UpdateSlotRequest;
import com.example.managementbackend.dto.response.slot.PlantSlotResponse;
import com.example.managementbackend.dto.response.slot.SlotHistoryResponse;

public interface SlotService {
    PlantSlotResponse getSlot(String greenhouseId, String slotId);
    PlantSlotResponse updateSlot(String greenhouseId, String slotId, UpdateSlotRequest request);
    SlotHistoryResponse getSlotHistory(String greenhouseId, String slotId, String from, String to, String interval);
}

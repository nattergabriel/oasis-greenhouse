package com.example.managementbackend.dto.response.slot;
import java.util.List;
public record SlotHistoryResponse(
    String slotId, String cropId, String cropName,
    String from, String to, String interval,
    List<SlotHistorySnapshotDto> snapshots
) {}

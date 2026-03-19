package com.example.managementbackend.dto.response.crop;

import java.util.List;

public record HarvestListResponse(int total, int page, int pageSize, List<HarvestEntryResponse> harvests) {}

package com.example.managementbackend.dto.response.alert;

import java.util.List;

public record AlertListResponse(int total, int page, int pageSize, List<AlertResponse> alerts) {}

package com.example.managementbackend.service;

import com.example.managementbackend.dto.request.alert.AcknowledgeAlertRequest;
import com.example.managementbackend.dto.request.alert.CreateAlertRequest;
import com.example.managementbackend.dto.request.alert.ResolveAlertRequest;
import com.example.managementbackend.dto.response.alert.AcknowledgeAlertResponse;
import com.example.managementbackend.dto.response.alert.AlertListResponse;
import com.example.managementbackend.dto.response.alert.AlertResponse;
import com.example.managementbackend.dto.response.alert.ResolveAlertResponse;

public interface AlertService {
    AlertListResponse listAlerts(String status, int page, int pageSize);
    AlertResponse createAlert(CreateAlertRequest request);
    AlertResponse getAlert(String id);
    AcknowledgeAlertResponse acknowledgeAlert(String id, AcknowledgeAlertRequest request);
    ResolveAlertResponse resolveAlert(String id, ResolveAlertRequest request);
}

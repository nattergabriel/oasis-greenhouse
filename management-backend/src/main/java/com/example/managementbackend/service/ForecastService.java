package com.example.managementbackend.service;

import com.example.managementbackend.dto.request.forecast.SetMissionDatesRequest;
import com.example.managementbackend.dto.response.forecast.MissionTimelineResponse;
import com.example.managementbackend.dto.response.forecast.ResourceForecastResponse;
import com.example.managementbackend.dto.response.forecast.SetMissionDatesResponse;

public interface ForecastService {
    ResourceForecastResponse getResourceForecast(int days);
    MissionTimelineResponse getMissionTimeline();
    SetMissionDatesResponse setMissionDates(SetMissionDatesRequest request);
}

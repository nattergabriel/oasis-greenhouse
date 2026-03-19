package com.example.managementbackend.dto.response.nutrition;
import java.util.List;
public record CoverageHeatmapResponse(List<String> nutrients, List<Integer> missionDays, List<List<Double>> coverage) {}

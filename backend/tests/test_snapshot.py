"""Tests for create_snapshot helper."""
from backend.nodes._snapshot import create_snapshot
from backend.models.state import (
    DailySnapshot,
    ZoneSnapshot,
    CropSnapshot,
)


class TestCreateSnapshot:
    def test_produces_daily_snapshot(self, sample_greenhouse):
        snap = create_snapshot(sample_greenhouse)
        assert isinstance(snap, DailySnapshot)
        assert snap.mission_day == sample_greenhouse.mission_day

    def test_zone_snapshots(self, sample_greenhouse):
        snap = create_snapshot(sample_greenhouse)
        assert len(snap.zones) == len(sample_greenhouse.zones)
        zs = snap.zones[0]
        assert isinstance(zs, ZoneSnapshot)
        assert zs.id == 1
        assert zs.area_m2 == 15.0
        assert zs.used_area_m2 == 2.0  # one crop of 2.0 m²
        assert zs.available_area_m2 == 13.0

    def test_crop_snapshots(self, sample_greenhouse):
        snap = create_snapshot(sample_greenhouse)
        crops = snap.zones[0].crops
        assert len(crops) == 1
        cs = crops[0]
        assert isinstance(cs, CropSnapshot)
        assert cs.id == "potato-z1-1"
        assert cs.type == "potato"
        assert cs.footprint_m2 == 2.0
        assert cs.active_stress is None

    def test_environment_preserved(self, sample_greenhouse):
        snap = create_snapshot(sample_greenhouse)
        assert snap.environment.solar_hours == sample_greenhouse.environment.solar_hours
        assert snap.environment.internal_temp == sample_greenhouse.environment.internal_temp

    def test_resources_preserved(self, sample_greenhouse):
        snap = create_snapshot(sample_greenhouse)
        assert snap.resources.water == sample_greenhouse.resources.water
        assert snap.resources.nutrients == sample_greenhouse.resources.nutrients

    def test_active_events_empty(self, sample_greenhouse):
        snap = create_snapshot(sample_greenhouse)
        assert snap.active_events == []

    def test_zone_plan_preserved(self, sample_greenhouse):
        snap = create_snapshot(sample_greenhouse)
        zs = snap.zones[0]
        assert zs.crop_plan == {"potato": 0.6, "beans_peas": 0.4}
        assert zs.artificial_light is True
        assert zs.water_allocation == 1.0

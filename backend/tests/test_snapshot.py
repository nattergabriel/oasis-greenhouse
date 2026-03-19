"""Tests for create_snapshot helper."""
from backend.nodes._snapshot import create_snapshot
from backend.models.state import (
    DailySnapshot,
    SlotSnapshot,
    CropSnapshot,
)


class TestCreateSnapshot:
    def test_produces_daily_snapshot(self, sample_greenhouse):
        snap = create_snapshot(sample_greenhouse)
        assert isinstance(snap, DailySnapshot)
        assert snap.day == sample_greenhouse.day

    def test_slot_snapshots(self, sample_greenhouse):
        snap = create_snapshot(sample_greenhouse)
        assert len(snap.slots) == len(sample_greenhouse.slots)
        ss = snap.slots[0]
        assert isinstance(ss, SlotSnapshot)
        assert ss.id == 0
        assert ss.area_m2 == 4.0
        assert ss.used_area_m2 == 2.0
        assert ss.available_area_m2 == 2.0

    def test_crop_snapshots(self, sample_greenhouse):
        snap = create_snapshot(sample_greenhouse)
        crops = snap.slots[0].crops
        assert len(crops) == 1
        cs = crops[0]
        assert isinstance(cs, CropSnapshot)
        assert cs.id == "potato-s0-1"
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

    def test_crop_type_preserved(self, sample_greenhouse):
        snap = create_snapshot(sample_greenhouse)
        ss = snap.slots[0]
        assert ss.crop_type == "potato"
        assert ss.artificial_light is True
        assert ss.water_allocation == 1.0

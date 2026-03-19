"""Tests for zone management: plans, two-pass fill, auto-replant."""

from __future__ import annotations

import pytest

from src import config
from src.models import Crop, Zone
from src.zones import auto_replant, create_crop, fill_zone, normalize_plan, set_zone_plan


class TestNormalizePlan:
    """Plan normalization and validation."""

    def test_already_normalized(self) -> None:
        plan = normalize_plan({"potato": 0.6, "beans_peas": 0.4})
        assert plan["potato"] == pytest.approx(0.6)
        assert plan["beans_peas"] == pytest.approx(0.4)

    def test_normalizes_to_one(self) -> None:
        plan = normalize_plan({"potato": 3.0, "beans_peas": 2.0})
        assert plan["potato"] == pytest.approx(0.6)
        assert plan["beans_peas"] == pytest.approx(0.4)
        assert sum(plan.values()) == pytest.approx(1.0)

    def test_filters_unknown_crop(self) -> None:
        plan = normalize_plan({"potato": 0.5, "alien": 0.5})
        assert "alien" not in plan
        assert plan["potato"] == pytest.approx(1.0)

    def test_filters_zero_fractions(self) -> None:
        plan = normalize_plan({"potato": 0.0, "lettuce": 1.0})
        assert "potato" not in plan
        assert plan["lettuce"] == pytest.approx(1.0)

    def test_all_invalid_returns_empty(self) -> None:
        assert normalize_plan({"alien": 0.5}) == {}
        assert normalize_plan({}) == {}

    def test_negative_fractions_filtered(self) -> None:
        plan = normalize_plan({"potato": -1.0, "lettuce": 1.0})
        assert "potato" not in plan


class TestSetZonePlan:
    """set_zone_plan() normalizes and stores on zone."""

    def test_sets_normalized_plan(self) -> None:
        zone = Zone(id=1)
        set_zone_plan(zone, {"potato": 3.0, "lettuce": 2.0})
        assert zone.crop_plan["potato"] == pytest.approx(0.6)
        assert zone.crop_plan["lettuce"] == pytest.approx(0.4)


class TestCreateCrop:
    """create_crop() factory function."""

    def test_creates_with_correct_config(self) -> None:
        crop = create_crop("potato", zone_id=1, day=10, crop_id="crop_1_1")
        assert crop is not None
        assert crop.type == "potato"
        assert crop.zone_id == 1
        assert crop.planted_day == 10
        assert crop.footprint_m2 == config.CROPS["potato"].footprint_m2
        assert crop.growth_cycle_days == config.CROPS["potato"].growth_cycle_days
        assert crop.health == 100.0
        assert crop.growth == 0.0
        assert crop.active_stress is None

    def test_unknown_type_returns_none(self) -> None:
        crop = create_crop("alien", zone_id=1, day=0, crop_id="crop_1_1")
        assert crop is None


# ===================================================================
# Two-pass zone fill (from IMPLEMENTATION-NOTES.md)
# ===================================================================

class TestFillZone:
    """Two-pass fill algorithm."""

    def test_100_percent_potato(self) -> None:
        """100% potato on 15 m² → 7 plantings (14 m²), 1 m² wasted."""
        zone = Zone(id=1, area_m2=15.0, crops=[], crop_plan={"potato": 1.0})
        new_crops, counter = fill_zone(zone, day=1, next_crop_id_counter=1)
        potato_count = sum(1 for c in zone.crops if c.type == "potato")
        assert potato_count == 7
        assert zone.used_area() == pytest.approx(14.0)
        assert zone.available_area() == pytest.approx(1.0)
        assert len(new_crops) == 7
        assert counter == 8

    def test_100_percent_beans(self) -> None:
        """100% beans on 15 m² → 10 plantings (15 m²), 0 wasted."""
        zone = Zone(id=1, area_m2=15.0, crops=[], crop_plan={"beans_peas": 1.0})
        fill_zone(zone, day=1, next_crop_id_counter=1)
        assert sum(1 for c in zone.crops if c.type == "beans_peas") == 10
        assert zone.used_area() == pytest.approx(15.0)
        assert zone.available_area() == pytest.approx(0.0)

    def test_100_percent_lettuce(self) -> None:
        """100% lettuce on 15 m² → 30 plantings (15 m²), 0 wasted."""
        zone = Zone(id=1, area_m2=15.0, crops=[], crop_plan={"lettuce": 1.0})
        fill_zone(zone, day=1, next_crop_id_counter=1)
        assert sum(1 for c in zone.crops if c.type == "lettuce") == 30
        assert zone.used_area() == pytest.approx(15.0)

    def test_60_40_potato_beans(self) -> None:
        """60% potato / 40% beans on 15 m² → 4 potato (8) + 4 beans (6) = 14 m².
        Pass 2: remaining 1 m² — potato needs 2.0 (won't fit), beans needs 1.5 (won't fit).
        """
        zone = Zone(id=1, area_m2=15.0, crops=[],
                     crop_plan={"potato": 0.6, "beans_peas": 0.4})
        fill_zone(zone, day=1, next_crop_id_counter=1)
        potatoes = sum(1 for c in zone.crops if c.type == "potato")
        beans = sum(1 for c in zone.crops if c.type == "beans_peas")
        assert potatoes == 4  # 8 m²
        assert beans == 4     # 6 m²
        assert zone.used_area() == pytest.approx(14.0)
        assert zone.available_area() == pytest.approx(1.0)

    def test_50_50_potato_beans(self) -> None:
        """50% potato / 50% beans on 15 m².
        Pass 1: 3 potato (6 m², target 7.5) + 5 beans (7.5 m², target 7.5) = 13.5 m²
        Pass 2: 1.5 m² left → beans fits (1.5), potato doesn't (2.0)
                 beans deficit (7.5/15=0.5 target, 7.5/15=0.5 actual → 0 deficit)
                 potato deficit (0.5 target, 6/15=0.4 actual → 0.1 deficit)
                 But potato (2.0) > 1.5 available → skip. Beans fits, deficit = 0.0.
                 Actually both have deficit ~ 0, but beans fits → +1 bean
        """
        zone = Zone(id=1, area_m2=15.0, crops=[],
                     crop_plan={"potato": 0.5, "beans_peas": 0.5})
        fill_zone(zone, day=1, next_crop_id_counter=1)
        potatoes = sum(1 for c in zone.crops if c.type == "potato")
        beans = sum(1 for c in zone.crops if c.type == "beans_peas")
        assert potatoes == 3
        assert beans == 6  # 5 from pass 1 + 1 from pass 2
        assert zone.used_area() == pytest.approx(15.0)

    def test_small_crops_pack_tight(self) -> None:
        """50% lettuce / 30% radish / 20% herbs → should pack tightly."""
        zone = Zone(id=1, area_m2=15.0, crops=[],
                     crop_plan={"lettuce": 0.5, "radish": 0.3, "herbs": 0.2})
        fill_zone(zone, day=1, next_crop_id_counter=1)
        lettuce = sum(1 for c in zone.crops if c.type == "lettuce")
        radish = sum(1 for c in zone.crops if c.type == "radish")
        herbs = sum(1 for c in zone.crops if c.type == "herbs")
        # lettuce: target 7.5 m² → 15 × 0.5 = 15 plantings
        # radish: target 4.5 m² → 9 × 0.5 = 9 plantings
        # herbs: target 3.0 m² → 10 × 0.3 = 10 plantings
        # Total: 15*0.5 + 9*0.5 + 10*0.3 = 7.5 + 4.5 + 3.0 = 15.0
        assert zone.used_area() == pytest.approx(15.0)
        assert lettuce >= 14  # ~15
        assert radish >= 8    # ~9
        assert herbs >= 9     # ~10

    def test_empty_plan_no_planting(self) -> None:
        zone = Zone(id=1, area_m2=15.0, crops=[], crop_plan={})
        new_crops, counter = fill_zone(zone, day=1, next_crop_id_counter=1)
        assert len(new_crops) == 0
        assert counter == 1

    def test_doesnt_exceed_zone_area(self) -> None:
        """Fill should never exceed zone.area_m2."""
        zone = Zone(id=1, area_m2=15.0, crops=[], crop_plan={"herbs": 1.0})
        fill_zone(zone, day=1, next_crop_id_counter=1)
        assert zone.used_area() <= zone.area_m2 + 0.001

    def test_fill_respects_existing_crops(self) -> None:
        """If zone already has crops, fill only the remaining space."""
        existing = Crop(id="existing", type="potato", zone_id=1,
                        footprint_m2=2.0, planted_day=0, growth_cycle_days=90)
        zone = Zone(id=1, area_m2=15.0, crops=[existing],
                     crop_plan={"lettuce": 1.0})
        fill_zone(zone, day=1, next_crop_id_counter=10)
        # 15 - 2 = 13 m² available, lettuce = 0.5 m² each → 26 lettuce
        lettuce_count = sum(1 for c in zone.crops if c.type == "lettuce")
        assert lettuce_count == 26
        assert zone.used_area() == pytest.approx(15.0)  # 2 + 26*0.5 = 15

    def test_crop_ids_increment(self) -> None:
        """Each new crop gets a unique sequential ID."""
        zone = Zone(id=2, area_m2=15.0, crops=[], crop_plan={"lettuce": 1.0})
        new_crops, counter = fill_zone(zone, day=1, next_crop_id_counter=5)
        ids = [c.id for c in new_crops]
        assert ids[0] == "crop_2_5"
        assert ids[1] == "crop_2_6"
        assert counter == 5 + len(new_crops)


# ===================================================================
# Auto-replant
# ===================================================================

class TestAutoReplant:
    """auto_replant() after harvest."""

    def test_replant_same_type_when_in_plan(self) -> None:
        """Harvested potato → replant potato if potato is in the plan."""
        zone = Zone(id=1, area_m2=15.0, crops=[],
                     crop_plan={"potato": 0.6, "beans_peas": 0.4})
        crop, counter = auto_replant(zone, "potato", day=50, next_crop_id_counter=20)
        assert crop is not None
        assert crop.type == "potato"
        assert crop.planted_day == 50
        assert counter == 21

    def test_replant_different_type_when_not_in_plan(self) -> None:
        """Harvested lettuce but plan has only potato/beans → replant the one with biggest deficit."""
        zone = Zone(id=1, area_m2=15.0, crops=[],
                     crop_plan={"potato": 0.6, "beans_peas": 0.4})
        crop, counter = auto_replant(zone, "lettuce", day=50, next_crop_id_counter=20)
        assert crop is not None
        assert crop.type in ("potato", "beans_peas")

    def test_no_replant_without_plan(self) -> None:
        zone = Zone(id=1, area_m2=15.0, crops=[], crop_plan={})
        crop, counter = auto_replant(zone, "potato", day=50, next_crop_id_counter=20)
        assert crop is None
        assert counter == 20

    def test_no_replant_when_zone_full(self) -> None:
        """If zone is completely full, can't replant."""
        # Fill with lettuce (0.5 m² each, 30 = 15 m²)
        existing = [Crop(id=f"c{i}", type="lettuce", zone_id=1, footprint_m2=0.5,
                         planted_day=0, growth_cycle_days=37)
                    for i in range(30)]
        zone = Zone(id=1, area_m2=15.0, crops=existing,
                     crop_plan={"potato": 1.0})
        crop, counter = auto_replant(zone, "potato", day=50, next_crop_id_counter=40)
        assert crop is None

    def test_replanted_crop_added_to_zone(self) -> None:
        zone = Zone(id=1, area_m2=15.0, crops=[],
                     crop_plan={"radish": 1.0})
        crop, _ = auto_replant(zone, "radish", day=50, next_crop_id_counter=1)
        assert crop is not None
        assert crop in zone.crops
        assert zone.used_area() == pytest.approx(0.5)

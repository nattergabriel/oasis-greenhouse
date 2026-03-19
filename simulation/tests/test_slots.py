"""Tests for slot management: crop assignment, fill, auto-replant."""

from __future__ import annotations

import pytest

from src import config
from src.models import Crop, Slot
from src.slots import auto_replant, create_crop, fill_slot


class TestCreateCrop:
    """create_crop() factory function."""

    def test_creates_with_correct_config(self) -> None:
        crop = create_crop("potato", slot_id=0, day=10, crop_id="crop_0_1")
        assert crop is not None
        assert crop.type == "potato"
        assert crop.slot_id == 0
        assert crop.planted_day == 10
        assert crop.footprint_m2 == config.CROPS["potato"].footprint_m2
        assert crop.growth_cycle_days == config.CROPS["potato"].growth_cycle_days
        assert crop.health == 100.0
        assert crop.growth == 0.0
        assert crop.active_stress is None

    def test_unknown_type_returns_none(self) -> None:
        crop = create_crop("alien", slot_id=0, day=0, crop_id="crop_0_1")
        assert crop is None


class TestFillSlot:
    """Fill slot with assigned crop type."""

    def test_fill_potato_slot(self) -> None:
        """Potato (2.0m²) in 4m² slot → 2 plants."""
        slot = Slot(id=0, row=0, col=0, area_m2=4.0, crops=[], crop_type="potato")
        new_crops, counter = fill_slot(slot, day=1, next_crop_id_counter=1)
        assert len(new_crops) == 2
        assert slot.used_area() == pytest.approx(4.0)
        assert slot.available_area() == pytest.approx(0.0)
        assert counter == 3

    def test_fill_lettuce_slot(self) -> None:
        """Lettuce (0.5m²) in 4m² slot → 8 plants."""
        slot = Slot(id=0, row=0, col=0, area_m2=4.0, crops=[], crop_type="lettuce")
        fill_slot(slot, day=1, next_crop_id_counter=1)
        assert len(slot.crops) == 8
        assert slot.used_area() == pytest.approx(4.0)

    def test_fill_beans_slot(self) -> None:
        """Beans (1.5m²) in 4m² slot → 2 plants (3.0m² used, 1.0m² wasted)."""
        slot = Slot(id=0, row=0, col=0, area_m2=4.0, crops=[], crop_type="beans_peas")
        fill_slot(slot, day=1, next_crop_id_counter=1)
        assert len(slot.crops) == 2
        assert slot.used_area() == pytest.approx(3.0)
        assert slot.available_area() == pytest.approx(1.0)

    def test_fill_herbs_slot(self) -> None:
        """Herbs (0.3m²) in 4m² slot → 13 plants (3.9m² used)."""
        slot = Slot(id=0, row=0, col=0, area_m2=4.0, crops=[], crop_type="herbs")
        fill_slot(slot, day=1, next_crop_id_counter=1)
        assert len(slot.crops) == 13
        assert slot.used_area() == pytest.approx(3.9)

    def test_fill_radish_slot(self) -> None:
        """Radish (0.5m²) in 4m² slot → 8 plants."""
        slot = Slot(id=0, row=0, col=0, area_m2=4.0, crops=[], crop_type="radish")
        fill_slot(slot, day=1, next_crop_id_counter=1)
        assert len(slot.crops) == 8
        assert slot.used_area() == pytest.approx(4.0)

    def test_no_crop_type_no_fill(self) -> None:
        slot = Slot(id=0, row=0, col=0, area_m2=4.0, crops=[], crop_type=None)
        new_crops, counter = fill_slot(slot, day=1, next_crop_id_counter=1)
        assert len(new_crops) == 0
        assert counter == 1

    def test_fill_respects_existing_crops(self) -> None:
        """If slot already has crops, fill only the remaining space."""
        existing = Crop(id="existing", type="potato", slot_id=0,
                        footprint_m2=2.0, planted_day=0, growth_cycle_days=90)
        slot = Slot(id=0, row=0, col=0, area_m2=4.0, crops=[existing], crop_type="potato")
        fill_slot(slot, day=1, next_crop_id_counter=10)
        # 4 - 2 = 2 m² available → 1 more potato (2.0 m²)
        assert len(slot.crops) == 2
        assert slot.used_area() == pytest.approx(4.0)

    def test_crop_ids_increment(self) -> None:
        """Each new crop gets a unique sequential ID."""
        slot = Slot(id=2, row=1, col=0, area_m2=4.0, crops=[], crop_type="lettuce")
        new_crops, counter = fill_slot(slot, day=1, next_crop_id_counter=5)
        ids = [c.id for c in new_crops]
        assert ids[0] == "crop_2_5"
        assert ids[1] == "crop_2_6"
        assert counter == 5 + len(new_crops)

    def test_doesnt_exceed_slot_area(self) -> None:
        """Fill should never exceed slot.area_m2."""
        slot = Slot(id=0, row=0, col=0, area_m2=4.0, crops=[], crop_type="herbs")
        fill_slot(slot, day=1, next_crop_id_counter=1)
        assert slot.used_area() <= slot.area_m2 + 0.001


class TestAutoReplant:
    """auto_replant() after harvest."""

    def test_replant_same_type(self) -> None:
        slot = Slot(id=0, row=0, col=0, area_m2=4.0, crops=[], crop_type="potato")
        crop, counter = auto_replant(slot, "potato", day=50, next_crop_id_counter=20)
        assert crop is not None
        assert crop.type == "potato"
        assert crop.planted_day == 50
        assert counter == 21

    def test_replant_uses_slot_crop_type(self) -> None:
        """Even if harvested type differs, replant uses slot.crop_type."""
        slot = Slot(id=0, row=0, col=0, area_m2=4.0, crops=[], crop_type="lettuce")
        crop, counter = auto_replant(slot, "potato", day=50, next_crop_id_counter=20)
        assert crop is not None
        assert crop.type == "lettuce"

    def test_no_replant_without_crop_type(self) -> None:
        slot = Slot(id=0, row=0, col=0, area_m2=4.0, crops=[], crop_type=None)
        crop, counter = auto_replant(slot, "potato", day=50, next_crop_id_counter=20)
        assert crop is None
        assert counter == 20

    def test_no_replant_when_slot_full(self) -> None:
        existing = [Crop(id=f"c{i}", type="potato", slot_id=0, footprint_m2=2.0,
                         planted_day=0, growth_cycle_days=90)
                    for i in range(2)]
        slot = Slot(id=0, row=0, col=0, area_m2=4.0, crops=existing, crop_type="potato")
        crop, counter = auto_replant(slot, "potato", day=50, next_crop_id_counter=40)
        assert crop is None

    def test_replanted_crop_added_to_slot(self) -> None:
        slot = Slot(id=0, row=0, col=0, area_m2=4.0, crops=[], crop_type="radish")
        crop, _ = auto_replant(slot, "radish", day=50, next_crop_id_counter=1)
        assert crop is not None
        assert crop in slot.crops
        assert slot.used_area() == pytest.approx(0.5)

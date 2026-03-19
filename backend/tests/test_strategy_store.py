"""Tests for StrategyStore."""
import pytest
from pathlib import Path
from unittest.mock import patch

from src.strategy.store import StrategyStore


@pytest.fixture
def tmp_strategy(tmp_path):
    """Return a StrategyStore pointing at a temp directory."""
    return StrategyStore(file_path=str(tmp_path / "strategy.md"))


class TestStrategyStoreRead:
    def test_read_existing_file(self, tmp_strategy):
        """read() should return content when file exists."""
        Path(tmp_strategy.file_path).parent.mkdir(parents=True, exist_ok=True)
        Path(tmp_strategy.file_path).write_text("# My Strategy\nPlant potatoes.")
        assert tmp_strategy.read() == "# My Strategy\nPlant potatoes."

    def test_read_fallback_to_initial(self, tmp_strategy):
        """read() should fall back to _get_initial_strategy when file missing."""
        result = tmp_strategy.read()
        # Should contain the inline fallback or the initial file content
        assert "Strategy" in result or "Zone" in result

    def test_read_fallback_inline(self, tmp_strategy):
        """When both strategy and initial file are missing, use inline fallback."""
        with patch("src.strategy.store.settings") as mock_settings:
            mock_settings.initial_strategy_path = "/nonexistent/path.md"
            mock_settings.strategy_file_path = str(tmp_strategy.file_path)

            store = StrategyStore(file_path=str(tmp_strategy.file_path))
            result = store.read()
            assert "Initial Strategy" in result
            assert "potato" in result


class TestStrategyStoreWrite:
    def test_write_creates_file(self, tmp_strategy):
        """write() should create the file and parent dirs."""
        tmp_strategy.write("# New Strategy\nMore beans.")
        assert Path(tmp_strategy.file_path).exists()
        assert Path(tmp_strategy.file_path).read_text() == "# New Strategy\nMore beans."

    def test_write_overwrites(self, tmp_strategy):
        """write() should overwrite existing content."""
        tmp_strategy.write("First version")
        tmp_strategy.write("Second version")
        assert Path(tmp_strategy.file_path).read_text() == "Second version"


class TestGetInitialStrategy:
    def test_inline_fallback(self):
        """_get_initial_strategy should return inline fallback when file missing."""
        with patch("src.strategy.store.settings") as mock_settings:
            mock_settings.initial_strategy_path = "/nonexistent/STRATEGY-INITIAL.md"
            result = StrategyStore._get_initial_strategy()
            assert "# Initial Strategy" in result
            assert "Zone 1" in result
            assert "Zone 2" in result
            assert "potato" in result

    def test_reads_initial_file_if_exists(self, tmp_path):
        """_get_initial_strategy should read the file when it exists."""
        initial_file = tmp_path / "STRATEGY-INITIAL.md"
        initial_file.write_text("# Real Initial Strategy")

        with patch("src.strategy.store.settings") as mock_settings:
            mock_settings.initial_strategy_path = str(initial_file)
            result = StrategyStore._get_initial_strategy()
            assert result == "# Real Initial Strategy"

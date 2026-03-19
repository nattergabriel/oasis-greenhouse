"""Tests for KnowledgeBaseCache."""
import pytest
from unittest.mock import AsyncMock, patch


class TestKnowledgBaseCache:
    @pytest.mark.asyncio
    async def test_load_calls_kb_client(self):
        """load() should call kb_client methods and set _loaded."""
        with patch("backend.kb.cache.kb_client") as mock_kb:
            mock_kb.query_crop_profiles = AsyncMock(return_value="crop profiles text")
            mock_kb.query_nutrition_targets = AsyncMock(return_value="nutrition targets text")

            from backend.kb.cache import KnowledgeBaseCache
            cache = KnowledgeBaseCache()

            await cache.load()

            mock_kb.query_crop_profiles.assert_awaited_once()
            mock_kb.query_nutrition_targets.assert_awaited_once()
            assert cache._loaded is True

    @pytest.mark.asyncio
    async def test_load_idempotent(self):
        """load() should not call KB again if already loaded."""
        with patch("backend.kb.cache.kb_client") as mock_kb:
            mock_kb.query_crop_profiles = AsyncMock(return_value="profiles")
            mock_kb.query_nutrition_targets = AsyncMock(return_value="targets")

            from backend.kb.cache import KnowledgeBaseCache
            cache = KnowledgeBaseCache()

            await cache.load()
            await cache.load()  # second call should be no-op

            assert mock_kb.query_crop_profiles.await_count == 1

    @pytest.mark.asyncio
    async def test_get_crop_profiles_text(self):
        with patch("backend.kb.cache.kb_client") as mock_kb:
            mock_kb.query_crop_profiles = AsyncMock(return_value="potato data")
            mock_kb.query_nutrition_targets = AsyncMock(return_value="nutrition data")

            from backend.kb.cache import KnowledgeBaseCache
            cache = KnowledgeBaseCache()

            await cache.load()
            assert cache.get_crop_profiles_text() == "potato data"

    @pytest.mark.asyncio
    async def test_get_nutrition_targets_text(self):
        with patch("backend.kb.cache.kb_client") as mock_kb:
            mock_kb.query_crop_profiles = AsyncMock(return_value="crop data")
            mock_kb.query_nutrition_targets = AsyncMock(return_value="nutrition data")

            from backend.kb.cache import KnowledgeBaseCache
            cache = KnowledgeBaseCache()

            await cache.load()
            assert cache.get_nutrition_targets_text() == "nutrition data"

    def test_get_before_load(self):
        """get methods should return placeholder strings before load()."""
        from backend.kb.cache import KnowledgeBaseCache
        cache = KnowledgeBaseCache()

        assert "not yet loaded" in cache.get_crop_profiles_text()
        assert "not yet loaded" in cache.get_nutrition_targets_text()

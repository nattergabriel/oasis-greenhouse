"""Cached knowledge base data loaded at startup."""
from backend.kb.client import kb_client


class KnowledgeBaseCache:
    """Cache for frequently-used KB data."""

    def __init__(self) -> None:
        """Initialize empty cache."""
        self._crop_profiles_text: str = ""
        self._nutrition_targets_text: str = ""
        self._loaded: bool = False

    async def load(self) -> None:
        """Load crop profiles and nutrition targets from KB."""
        if self._loaded:
            return

        self._crop_profiles_text = await kb_client.query_crop_profiles()
        self._nutrition_targets_text = await kb_client.query_nutrition_targets()
        self._loaded = True

    def get_crop_profiles_text(self) -> str:
        """Get formatted crop profiles text."""
        if not self._loaded:
            return "Crop profiles not yet loaded"
        return self._crop_profiles_text

    def get_nutrition_targets_text(self) -> str:
        """Get formatted nutrition targets text."""
        if not self._loaded:
            return "Nutrition targets not yet loaded"
        return self._nutrition_targets_text


# Global cache instance
kb_cache = KnowledgeBaseCache()

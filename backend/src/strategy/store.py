"""Strategy document storage and retrieval."""
from pathlib import Path

from backend.config import settings


class StrategyStore:
    """Read/write the strategy document on disk."""

    def __init__(self, file_path: str | None = None) -> None:
        self.file_path = Path(file_path or settings.strategy_file_path)

    def read(self) -> str:
        """Read strategy doc; falls back to STRATEGY-INITIAL.md if missing."""
        if self.file_path.exists():
            return self.file_path.read_text(encoding="utf-8")
        return self._get_initial_strategy()

    def write(self, content: str) -> None:
        """Write a new strategy document."""
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        self.file_path.write_text(content, encoding="utf-8")

    @staticmethod
    def _get_initial_strategy() -> str:
        """Load the initial strategy from docs/."""
        initial_path = Path(settings.initial_strategy_path)
        if initial_path.exists():
            return initial_path.read_text(encoding="utf-8")
        # Inline fallback if file is missing
        return (
            "# Initial Strategy\n\n"
            "Zone 1: potato 100%\n"
            "Zone 2: potato 50%, beans_peas 50%\n"
            "Zone 3: lettuce 50%, radish 30%, herbs 20%\n"
            "Zone 4: beans_peas 70%, herbs 30%\n"
            "Temperature: 20°C, all lights ON, water 1.0x\n"
        )


# Global instance
strategy_store = StrategyStore()

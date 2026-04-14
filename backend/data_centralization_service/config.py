"""Configuration for the data centralization ETL and n8n workflow builder."""

from __future__ import annotations

from dataclasses import dataclass
from os import getenv
from pathlib import Path


PACKAGE_ROOT = Path(__file__).resolve().parent
BACKEND_ROOT = PACKAGE_ROOT.parent


@dataclass(slots=True)
class Settings:
    dummy_data_directory: Path = BACKEND_ROOT / "dummy_data"
    mock_volunteers_file: Path = BACKEND_ROOT / "dummy_data" / "mockVolunteers.json"
    ai_provider: str = getenv("DATA_CENTRALIZATION_AI_PROVIDER", "heuristic")
    openai_api_key: str | None = getenv("OPENAI_API_KEY")
    openai_model: str = getenv("DATA_CENTRALIZATION_OPENAI_MODEL", "gpt-4.1-mini")
    backend_url: str = getenv("DATA_CENTRALIZATION_BACKEND_URL", "http://localhost:8000")


settings = Settings()

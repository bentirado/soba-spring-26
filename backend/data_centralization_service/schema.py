"""Canonical payload schema for the data centralization service."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(slots=True)
class ExtractedDataset:
    source_name: str
    source_type: str
    payload: Any
    metadata: dict[str, Any]


@dataclass(slots=True)
class CanonicalPayload:
    """Shared canonical schema consumed by all loaders unchanged."""

    source_name: str
    source_type: str
    classification: str
    fields: list[dict[str, str]]
    sample_records: list[dict[str, Any]]
    derived_outputs: dict[str, Any]
    transformed_payload: dict[str, Any]
    metadata: dict[str, Any]

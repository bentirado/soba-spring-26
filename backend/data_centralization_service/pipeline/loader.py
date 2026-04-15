"""Load stage — protocol and sink adapter implementations."""

from __future__ import annotations

import json
from dataclasses import asdict
from typing import Protocol, runtime_checkable

from ..schema import CanonicalPayload


@runtime_checkable
class Loader(Protocol):
    """Contract that all sink adapters must satisfy."""

    def load(self, payloads: list[CanonicalPayload]) -> None: ...


class TerminalLoader:
    """Prints canonical payloads to the terminal."""

    def load(self, payloads: list[CanonicalPayload]) -> None:
        for payload in payloads:
            print("=" * 88)
            print(f"Dataset:        {payload.source_name}")
            print(f"Source type:    {payload.source_type}")
            print(f"Classification: {payload.classification}")
            print(f"Fields:         {len(payload.fields)}")
            print(f"Records:        {len(payload.sample_records)}")
            print(json.dumps(asdict(payload), indent=2, default=str))

"""FastAPI routes that expose ETL stages for n8n to call via HTTP."""

from __future__ import annotations

from dataclasses import asdict
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from ..pipeline import DummyDataExtractor, TerminalLoader, TransactionLayer, TransformAgent
from ..schema import CanonicalPayload, ExtractedDataset

router = APIRouter(prefix="/etl", tags=["etl"])


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class TransformRequest(BaseModel):
    datasets: list[dict[str, Any]]


class LoadRequest(BaseModel):
    payloads: list[dict[str, Any]]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/extract")
def etl_extract() -> list[dict[str, Any]]:
    """Run the extract stage and return extracted datasets as JSON."""
    extractor = DummyDataExtractor()
    datasets = extractor.extract()
    return [asdict(ds) for ds in datasets]


@router.post("/transform")
def etl_transform(body: TransformRequest) -> list[dict[str, Any]]:
    """Accept extracted datasets, transform each into a canonical payload."""
    agent = TransformAgent()
    payloads: list[CanonicalPayload] = []
    for raw in body.datasets:
        ds = ExtractedDataset(
            source_name=raw["source_name"],
            source_type=raw["source_type"],
            payload=raw["payload"],
            metadata=raw["metadata"],
        )
        payloads.append(agent.transform(ds))
    return [asdict(p) for p in payloads]


@router.post("/load")
def etl_load(body: LoadRequest) -> dict[str, str]:
    """Accept canonical payloads and load them via the transaction layer."""
    canonical = [
        CanonicalPayload(
            source_name=p["source_name"],
            source_type=p["source_type"],
            classification=p["classification"],
            fields=p["fields"],
            sample_records=p["sample_records"],
            derived_outputs=p["derived_outputs"],
            transformed_payload=p["transformed_payload"],
            metadata=p["metadata"],
        )
        for p in body.payloads
    ]
    transaction = TransactionLayer(loader=TerminalLoader())
    transaction.commit(canonical)
    return {"status": "loaded", "count": str(len(canonical))}

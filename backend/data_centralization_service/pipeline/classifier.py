"""AI-powered dataset classifier using OpenAI.

Given an extracted dataset, asks OpenAI to classify what kind of data it is
and suggest what derived analytics would be useful. Returns structured JSON
that the TransformAgent uses to build a CanonicalPayload.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from ..config import settings


@dataclass(slots=True)
class ClassificationResult:
    classification: str
    description: str
    suggested_operations: list[str]


SYSTEM_PROMPT = """\
You are a data classification assistant for a museum volunteer management system.

Given a sample of extracted data, return a JSON object with:
- "classification": a short snake_case label for this data category \
(e.g. "volunteer_operational_data", "volunteer_scheduling", "training_records", "activity_reports")
- "description": one sentence describing what this data represents
- "suggested_operations": a list of 2-5 short strings describing useful \
analytics or transformations (e.g. "group by department", "aggregate hours by month")

Return ONLY valid JSON, no markdown fences or extra text.\
"""


def classify(dataset_summary: dict[str, Any]) -> ClassificationResult | None:
    """Classify a dataset using OpenAI. Returns None if unavailable or on error."""
    if not settings.openai_api_key:
        return None

    try:
        from openai import OpenAI
    except ImportError:
        return None

    try:
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(dataset_summary, default=str)},
            ],
            response_format={"type": "json_object"},
            temperature=0,
        )

        payload = json.loads(response.choices[0].message.content)
        return ClassificationResult(
            classification=str(payload.get("classification", "unclassified")),
            description=str(payload.get("description", "")),
            suggested_operations=[str(op) for op in payload.get("suggested_operations", [])],
        )
    except Exception:
        return None

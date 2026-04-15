"""Transform stage — normalizes extracted datasets into canonical payloads."""

from __future__ import annotations

from collections import Counter
from typing import Any

from ..schema import CanonicalPayload, ExtractedDataset
from .classifier import classify


class TransformAgent:
    """Transforms extracted datasets into canonical payloads.

    Uses hardcoded heuristics for known source types, and falls back to
    OpenAI classification for unrecognized data when an API key is configured.
    """

    def transform(self, dataset: ExtractedDataset) -> CanonicalPayload:
        if dataset.source_type == "json_records" and dataset.source_name == "mock_volunteers":
            return self._transform_volunteers(dataset)
        if dataset.source_type == "excel_file":
            return self._transform_excel(dataset)
        return self._transform_unknown(dataset)

    def _transform_volunteers(self, dataset: ExtractedDataset) -> CanonicalPayload:
        volunteers: list[dict[str, Any]] = dataset.payload

        fields = self._infer_fields(volunteers)

        overview = {
            "total_volunteers": len(volunteers),
            "hours_logged": sum(v.get("life_hours", 0) for v in volunteers),
            "average_age": (
                round(sum(v.get("age", 0) for v in volunteers) / len(volunteers), 1)
                if volunteers
                else 0
            ),
            "cities_represented": len({v.get("city") for v in volunteers if v.get("city")}),
        }

        gender_counts = Counter(v.get("gender", "Unknown") for v in volunteers)
        city_counts = Counter(v.get("city", "Unknown") for v in volunteers)
        month_counts: dict[str, int] = {}
        for v in volunteers:
            last_activity = v.get("last_activity", "")
            if last_activity and len(last_activity) >= 7:
                month = last_activity[:7]
                month_counts[month] = month_counts.get(month, 0) + 1

        return CanonicalPayload(
            source_name=dataset.source_name,
            source_type=dataset.source_type,
            classification="volunteer_operational_data",
            fields=fields,
            sample_records=volunteers,
            derived_outputs={
                "overview": overview,
                "charts": {
                    "last_activity_by_month": [
                        {"month": m, "count": c}
                        for m, c in sorted(month_counts.items())
                    ],
                    "volunteers_by_gender": [
                        {"gender": g, "count": c}
                        for g, c in sorted(gender_counts.items())
                    ],
                    "volunteers_by_city": [
                        {"city": ci, "count": c}
                        for ci, c in sorted(city_counts.items())
                    ],
                },
            },
            transformed_payload={"raw_records": volunteers},
            metadata=dataset.metadata,
        )

    def _transform_excel(self, dataset: ExtractedDataset) -> CanonicalPayload:
        """Transform an Excel file with multiple sheets into a canonical payload."""
        sheets: dict[str, list[dict[str, Any]]] = dataset.payload or {}

        all_records: list[dict[str, Any]] = []
        fields: list[dict[str, str]] = []
        for sheet_name, rows in sheets.items():
            if rows and not fields:
                fields = self._infer_fields(rows)
            for row in rows:
                record = dict(row)
                record["_sheet"] = sheet_name
                all_records.append(record)

        return CanonicalPayload(
            source_name=dataset.source_name,
            source_type=dataset.source_type,
            classification="excel_tabular_data",
            fields=fields,
            sample_records=all_records,
            derived_outputs={
                "sheet_summary": {
                    name: len(rows) for name, rows in sheets.items()
                },
                "total_rows": len(all_records),
            },
            transformed_payload={"sheets": sheets},
            metadata=dataset.metadata,
        )

    def _transform_unknown(self, dataset: ExtractedDataset) -> CanonicalPayload:
        """Classify unrecognized data with OpenAI, fall back to unprocessed stub."""
        records = self._extract_flat_records(dataset)
        fields = self._infer_fields(records)

        # Try AI classification
        result = classify({
            "source_name": dataset.source_name,
            "source_type": dataset.source_type,
            "fields": fields,
            "sample_records": records[:3],
            "metadata": dataset.metadata,
        })

        if result:
            return CanonicalPayload(
                source_name=dataset.source_name,
                source_type=dataset.source_type,
                classification=result.classification,
                fields=fields,
                sample_records=records,
                derived_outputs={
                    "ai_description": result.description,
                    "ai_suggested_operations": result.suggested_operations,
                },
                transformed_payload={"raw_records": records},
                metadata=dataset.metadata,
            )

        return CanonicalPayload(
            source_name=dataset.source_name,
            source_type=dataset.source_type,
            classification="unprocessed",
            fields=fields,
            sample_records=records,
            derived_outputs={},
            transformed_payload={"raw_records": records} if records else {},
            metadata=dataset.metadata,
        )

    def _extract_flat_records(self, dataset: ExtractedDataset) -> list[dict[str, Any]]:
        """Pull a flat record list from any payload shape."""
        if isinstance(dataset.payload, list):
            return dataset.payload
        if isinstance(dataset.payload, dict):
            # Excel-style {sheet_name: [rows]} — flatten
            all_rows: list[dict[str, Any]] = []
            for rows in dataset.payload.values():
                if isinstance(rows, list):
                    all_rows.extend(rows)
            return all_rows
        return []

    def _infer_fields(self, records: list[dict[str, Any]]) -> list[dict[str, str]]:
        if not records:
            return []
        sample = records[0]
        type_map = {int: "integer", float: "float", str: "string", bool: "boolean"}
        return [
            {"name": key, "type": type_map.get(type(value), "unknown")}
            for key, value in sample.items()
        ]

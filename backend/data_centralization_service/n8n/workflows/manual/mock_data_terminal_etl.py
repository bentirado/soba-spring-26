"""n8n workflow builder for the local mock-data ETL flow.

Uses HttpRequest nodes to call the FastAPI ETL endpoints so that
Python handles all extraction, transformation, and loading logic.
"""

from __future__ import annotations

from data_centralization_service.config import settings
from data_centralization_service.n8n.workflows.node_factory import (
    Code,
    HttpRequest,
    ManualTrigger,
    build_workflow,
    connect,
    merge_connections,
)


def build_mock_data_terminal_etl_workflow() -> dict:
    trigger = ManualTrigger().at(240, 280)

    extract = HttpRequest(
        name="Extract Dummy Data",
        method="POST",
        url=f"{settings.backend_url}/etl/extract",
    ).at(500, 280)

    # Pass the extracted datasets array into the transform endpoint body.
    forward_to_transform = Code(
        name="Forward To Transform",
        js_code=(
            "const extracted = items.map(i => i.json);\n"
            "return [{ json: { datasets: extracted } }];"
        ),
    ).at(760, 280)

    transform = HttpRequest(
        name="Transform To Canonical",
        method="POST",
        url=f"{settings.backend_url}/etl/transform",
        send_body=True,
    ).with_parameters(
        specifyBody="json",
        jsonBody="={{ JSON.stringify($json) }}",
    ).at(1020, 280)

    # Pass the canonical payloads array into the load endpoint body.
    forward_to_load = Code(
        name="Forward To Load",
        js_code=(
            "const payloads = items.map(i => i.json);\n"
            "return [{ json: { payloads: payloads } }];"
        ),
    ).at(1280, 280)

    load = HttpRequest(
        name="Load Via Transaction Layer",
        method="POST",
        url=f"{settings.backend_url}/etl/load",
        send_body=True,
    ).with_parameters(
        specifyBody="json",
        jsonBody="={{ JSON.stringify($json) }}",
    ).at(1540, 280)

    return build_workflow(
        name="Mock Data Terminal ETL",
        nodes=[trigger, extract, forward_to_transform, transform, forward_to_load, load],
        connections=merge_connections(
            connect(trigger, extract),
            connect(extract, forward_to_transform),
            connect(forward_to_transform, transform),
            connect(transform, forward_to_load),
            connect(forward_to_load, load),
        ),
        active=False,
        tags=["etl", "dummy-data", "terminal"],
    )

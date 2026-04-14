"""Workflow registry for code-defined n8n workflows."""

from __future__ import annotations

from data_centralization_service.n8n.workflows.manual.mock_data_terminal_etl import (
    build_mock_data_terminal_etl_workflow,
)


WORKFLOW_REGISTRY = {
    "mock_data_terminal_etl": build_mock_data_terminal_etl_workflow,
}

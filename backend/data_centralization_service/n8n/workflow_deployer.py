"""Stub deployer for syncing registry-defined workflows to n8n."""

from __future__ import annotations

from data_centralization_service.n8n.workflow_registry import WORKFLOW_REGISTRY


def get_registered_workflows() -> dict[str, dict]:
    return {name: builder() for name, builder in WORKFLOW_REGISTRY.items()}

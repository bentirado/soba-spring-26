"""
Package using n8n-as-code for the data centralization service, automates the data centralization for disconnected museum data sources.

Instead of manually building workflows in the n8n UI, all workflows are defined
as Python code inside workflows/. Each workflow is registered in the
workflow_registry and automatically deployed to n8n when the service starts.

On startup, FastAPI's lifespan triggers the workflow_deployer which compares the
registry against what currently exists in n8n. Missing workflows are created, outdated workflows 
are updated. This will ensure n8n always reflects the codebase standardizing the source of truth.

This approach will make the entire pipeline reproducible from code alone. The client can spin 
up the full stack and all workflows are live in n8n without any manual intervention in the UI.

How it works under the hood:
    n8n stores and runs all workflows as JSON. Rather than writing raw JSON by hand
    or clicking through the n8n UI, workflow definitions are written as Python
    functions using shared/reusable node builders. These functions
    return Python dicts that are structurally identical to the JSON n8n expects.
    When deployed, we will serialize those dicts to JSON and pushes them to n8n
    via its REST API. The end result in n8n is identical to a manually built
    workflow, just generated and managed entirely from code.

Why Python over raw JSON files:
    - Reusability: node_factory.py eliminates repeated node structures
    - Readability: function calls are clearer than raw JSON blobs
    - Validation: Python catches errors before they reach n8n
    - Composability: shared logic, loops, and conditionals across workflows

This will eliminate manual workflow management in the n8n UI and ensures the pipeline
is fully reproducible from code alone for the client. 
"""
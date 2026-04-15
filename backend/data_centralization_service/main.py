"""CLI entrypoint for the mock ETL pipeline and n8n workflow JSON generation."""

from __future__ import annotations

import argparse
import json

from .pipeline import ETLPipeline
from .n8n.workflow_registry import WORKFLOW_REGISTRY


def run_pipeline() -> None:
    ETLPipeline().run()


def generate_workflows() -> None:
    workflows = {name: builder() for name, builder in WORKFLOW_REGISTRY.items()}
    print(json.dumps(workflows, indent=2))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the mock ETL or emit n8n workflow JSON.")
    parser.add_argument(
        "command",
        choices=["run-pipeline", "generate-workflows"],
        nargs="?",
        default="run-pipeline",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    if args.command == "generate-workflows":
        generate_workflows()
        return
    run_pipeline()


if __name__ == "__main__":
    main()

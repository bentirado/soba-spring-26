"""
Node builder functions for constructing n8n workflow node dictionaries.

Provides reusable factories for the node types used by the data
centralization service. Each helper returns an n8n-compatible node dict or a
connection fragment that can be merged into a full workflow payload.
"""

from __future__ import annotations

from copy import deepcopy
import json
from typing import Any, Literal, Self
import uuid


NodeDict = dict[str, Any]
ConnectionDict = dict[str, dict[str, list[list[dict[str, Any]]]]]
_N8N_UUID_NAMESPACE = uuid.UUID("4c6f4d11-6240-4f22-8dc7-842c0da9fb4c")


class Node:
    """Base builder for an n8n node definition."""

    node_type: str = ""
    type_version: float = 1.0

    def __init__(self, name: str, position: list[int] | None = None):
        if not self.node_type:
            raise ValueError("node_type must be defined on Node subclasses")

        self.name = name
        self.position = position or [250, 300]
        self.parameters: dict[str, Any] = {}
        self.credentials: dict[str, Any] = {}
        self._node_id = _stable_uuid(
            f"node:{self.node_type}:{self.name}:{self.position[0]}:{self.position[1]}"
        )

    @property
    def node_id(self) -> str:
        return self._node_id

    def with_parameters(self, **parameters: Any) -> Self:
        self.parameters.update(parameters)
        return self

    def with_credentials(self, credential_type: str, **credential_fields: Any) -> Self:
        self.credentials[credential_type] = credential_fields
        return self

    def at(self, x: int, y: int) -> Self:
        self.position = [x, y]
        return self

    def build_node(self, *, node_id: str | None = None) -> NodeDict:
        node: NodeDict = {
            "id": node_id or self._node_id,
            "name": self.name,
            "type": self.node_type,
            "typeVersion": self.type_version,
            "position": self.position,
            "parameters": self.parameters,
        }
        if self.credentials:
            node["credentials"] = self.credentials
        return node


class ManualTrigger(Node):
    """Triggered manually from the n8n UI."""

    node_type = "n8n-nodes-base.manualTrigger"
    type_version = 1.0

    def __init__(self, name: str = "Manual Trigger", **kwargs: Any):
        super().__init__(name, **kwargs)


class WebhookTrigger(Node):
    """Starts a workflow from an inbound HTTP webhook."""

    node_type = "n8n-nodes-base.webhook"
    type_version = 2.1

    def __init__(
        self,
        name: str = "Webhook Trigger",
        *,
        path: str = "incoming",
        http_method: str = "POST",
        response_mode: str = "onReceived",
        **kwargs: Any,
    ):
        super().__init__(name, **kwargs)
        self.parameters = {
            "path": path,
            "httpMethod": http_method,
            "responseMode": response_mode,
        }


class ScheduleTrigger(Node):
    """Runs on a cron expression."""

    node_type = "n8n-nodes-base.scheduleTrigger"
    type_version = 1.2

    def __init__(self, name: str = "Schedule Trigger", *, cron_expression: str, **kwargs: Any):
        super().__init__(name, **kwargs)
        self.parameters = {
            "rule": {
                "interval": [
                    {
                        "field": "cronExpression",
                        "expression": cron_expression,
                    }
                ]
            }
        }


class HttpRequest(Node):
    """Calls an external HTTP endpoint."""

    node_type = "n8n-nodes-base.httpRequest"
    type_version = 4.2

    def __init__(
        self,
        name: str = "HTTP Request",
        *,
        method: str = "GET",
        url: str,
        send_body: bool = False,
        response_format: str = "json",
        **kwargs: Any,
    ):
        super().__init__(name, **kwargs)
        self.parameters = {
            "method": method,
            "url": url,
            "responseFormat": response_format,
            "sendBody": send_body,
        }


class Code(Node):
    """Runs JavaScript inside n8n."""

    node_type = "n8n-nodes-base.code"
    type_version = 2.0

    def __init__(
        self,
        name: str = "Code",
        *,
        js_code: str,
        mode: Literal["runOnceForAllItems", "runOnceForEachItem"] = "runOnceForAllItems",
        **kwargs: Any,
    ):
        super().__init__(name, **kwargs)
        self.parameters = {
            "jsCode": js_code,
            "mode": mode,
        }


class SetValues(Node):
    """Creates or updates fields on the current item payload."""

    node_type = "n8n-nodes-base.set"
    type_version = 3.4

    def __init__(self, name: str = "Set", *, keep_only_set: bool = False, **kwargs: Any):
        super().__init__(name, **kwargs)
        self.parameters = {
            "keepOnlySet": keep_only_set,
            "assignments": {"assignments": []},
        }

    def add_value(self, field: str, value: Any, value_type: str = "string") -> Self:
        assignment_index = len(self.parameters["assignments"]["assignments"])
        self.parameters["assignments"]["assignments"].append(
            {
                "id": _stable_uuid(f"assignment:{self.name}:{assignment_index}:{field}"),
                "name": field,
                "value": value,
                "type": value_type,
            }
        )
        return self


class If(Node):
    """Branches the workflow using n8n's IF node."""

    node_type = "n8n-nodes-base.if"
    type_version = 2.2

    def __init__(
        self,
        name: str = "If",
        *,
        left_value: Any,
        operation: str,
        right_value: Any,
        value_type: Literal["string", "number", "boolean"] = "string",
        **kwargs: Any,
    ):
        super().__init__(name, **kwargs)
        self.parameters = {
            "conditions": {
                value_type: [
                    {
                        "value1": left_value,
                        "operation": operation,
                        "value2": right_value,
                    }
                ]
            }
        }


class Merge(Node):
    """Combines inputs from multiple branches."""

    node_type = "n8n-nodes-base.merge"
    type_version = 3.2

    def __init__(self, name: str = "Merge", *, mode: str = "append", **kwargs: Any):
        super().__init__(name, **kwargs)
        self.parameters = {"mode": mode}


class Postgres(Node):
    """Runs a PostgreSQL query or operation."""

    node_type = "n8n-nodes-base.postgres"
    type_version = 2.5

    def __init__(
        self,
        name: str = "Postgres",
        *,
        operation: str = "executeQuery",
        query: str = "",
        **kwargs: Any,
    ):
        super().__init__(name, **kwargs)
        self.parameters = {"operation": operation}
        if query:
            self.parameters["query"] = query


class Gmail(Node):
    """Sends outbound email using Gmail."""

    node_type = "n8n-nodes-base.gmail"
    type_version = 2.1

    def __init__(
        self,
        name: str = "Send Email",
        *,
        to: str,
        subject: str,
        message: str,
        operation: str = "send",
        **kwargs: Any,
    ):
        super().__init__(name, **kwargs)
        self.parameters = {
            "operation": operation,
            "sendTo": to,
            "subject": subject,
            "message": message,
        }


def manual_trigger(name: str = "Manual Trigger", position: list[int] | None = None) -> NodeDict:
    return ManualTrigger(name=name, position=position).build_node()


def webhook_trigger(
    *,
    path: str,
    name: str = "Webhook Trigger",
    http_method: str = "POST",
    response_mode: str = "onReceived",
    position: list[int] | None = None,
) -> NodeDict:
    return WebhookTrigger(
        name=name,
        path=path,
        http_method=http_method,
        response_mode=response_mode,
        position=position,
    ).build_node()


def schedule_trigger(
    cron_expression: str,
    *,
    name: str = "Schedule Trigger",
    position: list[int] | None = None,
) -> NodeDict:
    return ScheduleTrigger(
        name=name,
        cron_expression=cron_expression,
        position=position,
    ).build_node()


def http_node(
    *,
    url: str,
    method: str = "GET",
    name: str = "HTTP Request",
    send_body: bool = False,
    response_format: str = "json",
    position: list[int] | None = None,
    credentials: dict[str, Any] | None = None,
    **parameters: Any,
) -> NodeDict:
    node = HttpRequest(
        name=name,
        method=method,
        url=url,
        send_body=send_body,
        response_format=response_format,
        position=position,
    ).with_parameters(**parameters)
    if credentials:
        node.credentials.update(credentials)
    return node.build_node()


def code_node(
    js_code: str,
    *,
    name: str = "Code",
    mode: Literal["runOnceForAllItems", "runOnceForEachItem"] = "runOnceForAllItems",
    position: list[int] | None = None,
    **parameters: Any,
) -> NodeDict:
    return Code(name=name, js_code=js_code, mode=mode, position=position).with_parameters(
        **parameters
    ).build_node()


def set_node(
    values: dict[str, Any],
    *,
    name: str = "Set",
    keep_only_set: bool = False,
    position: list[int] | None = None,
) -> NodeDict:
    node = SetValues(name=name, keep_only_set=keep_only_set, position=position)
    for field, value in values.items():
        value_type = _infer_set_value_type(value)
        node.add_value(field=field, value=value, value_type=value_type)
    return node.build_node()


def if_node(
    *,
    left_value: Any,
    operation: str,
    right_value: Any,
    value_type: Literal["string", "number", "boolean"] = "string",
    name: str = "If",
    position: list[int] | None = None,
) -> NodeDict:
    return If(
        name=name,
        left_value=left_value,
        operation=operation,
        right_value=right_value,
        value_type=value_type,
        position=position,
    ).build_node()


def merge_node(
    *,
    mode: str = "append",
    name: str = "Merge",
    position: list[int] | None = None,
) -> NodeDict:
    return Merge(name=name, mode=mode, position=position).build_node()


def postgres_node(
    *,
    query: str,
    name: str = "Postgres",
    operation: str = "executeQuery",
    position: list[int] | None = None,
    credentials: dict[str, Any] | None = None,
    **parameters: Any,
) -> NodeDict:
    node = Postgres(
        name=name,
        operation=operation,
        query=query,
        position=position,
    ).with_parameters(**parameters)
    if credentials:
        node.credentials.update(credentials)
    return node.build_node()


def email_node(
    *,
    to: str,
    subject: str,
    message: str,
    name: str = "Send Email",
    position: list[int] | None = None,
    credentials: dict[str, Any] | None = None,
    **parameters: Any,
) -> NodeDict:
    node = Gmail(
        name=name,
        to=to,
        subject=subject,
        message=message,
        position=position,
    ).with_parameters(**parameters)
    if credentials:
        node.credentials.update(credentials)
    return node.build_node()


def connect(
    source: str | Node | NodeDict,
    target: str | Node | NodeDict,
    *,
    branch: str = "main",
    source_output: int = 0,
    target_input: int = 0,
) -> ConnectionDict:
    """Create an n8n connections fragment from one node to another."""

    source_name = _node_name(source)
    target_name = _node_name(target)

    outputs: list[list[dict[str, Any]]] = []
    while len(outputs) <= source_output:
        outputs.append([])
    outputs[source_output].append(
        {
            "node": target_name,
            "type": branch,
            "index": target_input,
        }
    )

    return {source_name: {branch: outputs}}


def merge_connections(*connections: ConnectionDict) -> ConnectionDict:
    """Merge multiple connection fragments into one n8n connections object."""

    merged: ConnectionDict = {}
    for connection in connections:
        for source_name, branch_map in connection.items():
            source_entry = merged.setdefault(source_name, {})
            for branch_name, outputs in branch_map.items():
                branch_entry = source_entry.setdefault(branch_name, [])
                while len(branch_entry) < len(outputs):
                    branch_entry.append([])
                for output_index, destinations in enumerate(outputs):
                    branch_entry[output_index].extend(deepcopy(destinations))
    return merged


def build_workflow(
    *,
    name: str,
    nodes: list[Node | NodeDict],
    connections: ConnectionDict | None = None,
    active: bool = False,
    settings: dict[str, Any] | None = None,
    tags: list[str] | None = None,
) -> dict[str, Any]:
    """Assemble a full n8n workflow payload from nodes and connections."""

    built_nodes = [_build_workflow_node(workflow_name=name, node=node) for node in nodes]
    workflow: dict[str, Any] = {
        "name": name,
        "nodes": built_nodes,
        "connections": connections or {},
        "active": active,
        "settings": settings or {},
    }
    if tags:
        workflow["tags"] = tags
    return workflow


def _node_name(node: str | Node | NodeDict) -> str:
    if isinstance(node, str):
        return node
    if isinstance(node, Node):
        return node.name
    return str(node["name"])


def _build_workflow_node(*, workflow_name: str, node: Node | NodeDict) -> NodeDict:
    if isinstance(node, Node):
        return node.build_node(node_id=_stable_node_id(workflow_name=workflow_name, node=node))

    built_node = deepcopy(node)
    built_node["id"] = _stable_node_id(workflow_name=workflow_name, node=built_node)
    return built_node


def _stable_node_id(*, workflow_name: str, node: Node | NodeDict) -> str:
    if isinstance(node, Node):
        payload = {
            "workflow_name": workflow_name,
            "name": node.name,
            "type": node.node_type,
            "typeVersion": node.type_version,
            "position": node.position,
            "parameters": node.parameters,
            "credentials": node.credentials,
        }
    else:
        payload = {
            "workflow_name": workflow_name,
            "name": node["name"],
            "type": node["type"],
            "typeVersion": node.get("typeVersion"),
            "position": node.get("position"),
            "parameters": node.get("parameters", {}),
            "credentials": node.get("credentials", {}),
        }
    return _stable_uuid(f"workflow-node:{_stable_json(payload)}")


def _stable_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"))


def _stable_uuid(seed: str) -> str:
    return str(uuid.uuid5(_N8N_UUID_NAMESPACE, seed))


def _infer_set_value_type(value: Any) -> Literal["string", "number", "boolean"]:
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int | float) and not isinstance(value, bool):
        return "number"
    return "string"


__all__ = [
    "Code",
    "ConnectionDict",
    "Gmail",
    "HttpRequest",
    "If",
    "ManualTrigger",
    "Merge",
    "Node",
    "NodeDict",
    "Postgres",
    "ScheduleTrigger",
    "SetValues",
    "WebhookTrigger",
    "build_workflow",
    "code_node",
    "connect",
    "email_node",
    "http_node",
    "if_node",
    "manual_trigger",
    "merge_connections",
    "merge_node",
    "postgres_node",
    "schedule_trigger",
    "set_node",
    "webhook_trigger",
]

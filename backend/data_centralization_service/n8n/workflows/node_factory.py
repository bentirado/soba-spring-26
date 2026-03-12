"""
Node builder functions for constructing n8n workflow node dictionaries.

Provides reusable factory functions for each n8n node type used across the 
museum's data pipeline workflow definitions. Each function returns a properly 
structured node dict that can be composed into a complete n8n workflow.

Example functions and what it would do:
    schedule_trigger  — creates a cron-based trigger node
    http_node         — creates an HTTP request node
    code_node         — creates a JavaScript code execution node
    connect           — creates a connection between two nodes
    merge_connections — merges multiple connections into one dict
"""
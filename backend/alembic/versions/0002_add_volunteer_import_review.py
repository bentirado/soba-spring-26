"""No schema changes for destructive spreadsheet uploads.

Revision ID: 0002_add_volunteer_import_review
Revises: 0001_initial_schema
Create Date: 2026-07-14 00:00:00
"""

from __future__ import annotations

from typing import Sequence, Union

revision: str = "0002_add_volunteer_import_review"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

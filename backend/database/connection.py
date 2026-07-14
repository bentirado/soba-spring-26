"""
Async database connection setup for the Science Museum Volunteer Management System.
Uses SQLAlchemy 2.x async engine backed by asyncpg.
"""

import os
from typing import AsyncGenerator

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from database.models import Base

# ---------------------------------------------------------------------------
# Load environment variables
# ---------------------------------------------------------------------------

load_dotenv()

# ---------------------------------------------------------------------------
# Engine & session factory
# ---------------------------------------------------------------------------

# Default falls back to a local PostgreSQL instance using asyncpg dialect.
_SYNC_DEFAULT = "postgresql://postgres:password@localhost:5432/soba_db"
_ASYNC_DEFAULT = "postgresql+asyncpg://postgres:password@localhost:5432/soba_db"

_raw_url: str = os.getenv("DATABASE_URL", _SYNC_DEFAULT)

# Normalise the URL so it always uses the asyncpg driver.
# If the caller set DATABASE_URL without the +asyncpg driver we add it.
if _raw_url.startswith("postgresql://"):
    DATABASE_URL: str = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _raw_url.startswith("postgres://"):
    # Some cloud providers emit postgres:// shorthand
    DATABASE_URL = _raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
else:
    DATABASE_URL = _raw_url

engine: AsyncEngine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Async generator that yields a database session and ensures it is closed
    after the request completes.  Use as a FastAPI dependency:

        @app.get("/example")
        async def example(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ---------------------------------------------------------------------------
# Table initialisation
# ---------------------------------------------------------------------------


async def init_db() -> None:
    """
    Optionally create missing tables for local development.

    Production/staging should set AUTO_CREATE_TABLES=false and run Alembic
    migrations instead, so schema changes are explicit and repeatable.
    """
    if os.getenv("AUTO_CREATE_TABLES", "true").lower() not in {"1", "true", "yes"}:
        return

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

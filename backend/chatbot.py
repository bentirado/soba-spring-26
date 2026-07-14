from __future__ import annotations

import json
import math
import os
import pathlib
import openai
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from auth import CurrentUser, get_current_user, require_roles
from database.connection import get_db
from database.models import Volunteer, ChatCache

# ---------------------------------------------------------------------------
# OpenAI client
# ---------------------------------------------------------------------------

def get_openai_client() -> openai.AsyncOpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Chatbot is unavailable because OPENAI_API_KEY is not configured.",
        )
    return openai.AsyncOpenAI(api_key=api_key)

# ---------------------------------------------------------------------------
# Platform docs
# ---------------------------------------------------------------------------

DOCS_PATH = pathlib.Path(__file__).parent / "platform_docs.md"


def load_platform_docs() -> str:
    try:
        return DOCS_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        return "(platform docs not found)"


# ---------------------------------------------------------------------------
# Live stats
# ---------------------------------------------------------------------------

async def load_live_stats(db: AsyncSession) -> str:
    total = await db.scalar(select(func.count()).select_from(Volunteer))
    active = await db.scalar(
        select(func.count()).select_from(Volunteer).where(Volunteer.is_active == True)
    )
    return (
        f"- Total volunteers in the system: {total}\n"
        f"- Active volunteers: {active}"
    )


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

PROMPT_INTRO = """You are BINJOW, an AI assistant for the Science Museum of Oklahoma volunteer management platform.
Your role is to help users navigate and use the platform accurately and clearly.

The platform is a web-based analytics dashboard for managing and tracking museum volunteers.
It has a left sidebar for navigation and a main content area for each page.
"""

PROMPT_INSTRUCTIONS = """
## How to Answer
- Always give step-by-step instructions when guiding navigation (e.g., "1. Click Volunteers in the left sidebar. 2. Scroll down to the Hall of Fame section.")
- Use the exact feature names and page names from the platform guide above
- If a feature does not exist on the platform, clearly say it is not available
- If a page is disabled or coming soon, say so
- Be concise and friendly
- If the user's question is unclear, ask a short follow-up question
- Do not invent features or data that are not listed above
- When quoting live stats, use the exact numbers from the "Current Live Stats" section above
"""


async def build_system_prompt(db: AsyncSession) -> str:
    docs = load_platform_docs()
    stats = await load_live_stats(db)
    return (
        f"{PROMPT_INTRO}\n"
        f"## Platform Guide\n{docs}\n\n"
        f"## Current Live Stats (pulled from the database right now)\n{stats}\n"
        f"{PROMPT_INSTRUCTIONS}"
    )


# ---------------------------------------------------------------------------
# Semantic cache helpers
# ---------------------------------------------------------------------------

SIMILARITY_THRESHOLD = 0.82  # questions scoring above this reuse the cached answer


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


async def get_embedding(text: str) -> list[float]:
    client = get_openai_client()
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding


async def find_cached_answer(db: AsyncSession, embedding: list[float]) -> str | None:
    result = await db.execute(select(ChatCache))
    cached_entries = result.scalars().all()

    best_score = 0.0
    best_answer = None

    for entry in cached_entries:
        stored_embedding = json.loads(entry.embedding)
        score = _cosine_similarity(embedding, stored_embedding)
        if score > best_score:
            best_score = score
            best_answer = entry.answer

    if best_score >= SIMILARITY_THRESHOLD:
        return best_answer
    return None


async def save_to_cache(
    db: AsyncSession, question: str, embedding: list[float], answer: str
) -> None:
    entry = ChatCache(
        question=question,
        embedding=json.dumps(embedding),
        answer=answer,
        created_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    await db.flush()


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter()


class ChatMessage(BaseModel):
    role: str   # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@router.delete("/api/chat/cache")
async def clear_chat_cache(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("admin")),
):
    result = await db.execute(select(ChatCache))
    entries = result.scalars().all()
    for entry in entries:
        await db.delete(entry)
    await db.flush()
    return {"cleared": len(entries), "message": "Chat cache cleared successfully."}


@router.post("/api/chat")
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    # The last message is the user's current question
    user_question = request.messages[-1].content

    # 1. Compute embedding for the question
    embedding = await get_embedding(user_question)

    # 2. Check semantic cache
    cached = await find_cached_answer(db, embedding)
    if cached:
        return {"reply": cached, "cached": True}

    # 3. Cache miss — call GPT
    system_prompt = await build_system_prompt(db)
    openai_messages = [{"role": "system", "content": system_prompt}]
    for msg in request.messages:
        openai_messages.append({"role": msg.role, "content": msg.content})

    client = get_openai_client()
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=openai_messages,
        max_tokens=500,
        temperature=0.4,
    )
    reply = response.choices[0].message.content

    # 4. Save to cache for future requests
    await save_to_cache(db, user_question, embedding, reply)

    return {"reply": reply, "cached": False}

from __future__ import annotations

import json
import os
from typing import Any, Optional

import openai
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from auth import CurrentUser, get_current_user

router = APIRouter()


class InsightRequest(BaseModel):
    page: str = Field(..., max_length=80)
    subject: str = Field(..., max_length=120)
    data: Any
    context: Optional[str] = Field(default=None, max_length=1200)


class InsightResponse(BaseModel):
    insight: str


def get_openai_client() -> openai.AsyncOpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="AI insights are unavailable because OPENAI_API_KEY is not configured.",
        )

    return openai.AsyncOpenAI(api_key=api_key)


@router.post("/api/insights", response_model=InsightResponse)
async def generate_insight(
    request: InsightRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    client = get_openai_client()
    model = os.getenv("OPENAI_INSIGHT_MODEL", "gpt-4o-mini")
    data_json = json.dumps(request.data, default=str)

    try:
        response = await client.chat.completions.create(
            model=model,
            temperature=0.45,
            max_tokens=180,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You write concise, client-ready insights for an internal volunteer analytics dashboard. "
                        "Use only the provided data. Do not invent causes, names, or recommendations that are not supported. "
                        "Write 2 to 4 natural sentences. Mention the clearest pattern, why it matters, and one practical next review point. "
                        "Avoid markdown, bullets, and technical implementation language."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Page: {request.page}\n"
                        f"Chart or section: {request.subject}\n"
                        f"Additional context: {request.context or 'None'}\n"
                        f"Data JSON: {data_json[:12000]}"
                    ),
                },
            ],
        )
    except openai.RateLimitError as exc:
        error_code = getattr(exc, "code", None)
        if error_code == "insufficient_quota":
            raise HTTPException(
                status_code=402,
                detail="AI insights are unavailable because the OpenAI account has no remaining quota or billing is not active.",
            ) from exc

        raise HTTPException(
            status_code=429,
            detail="AI insights are temporarily rate limited. Please wait a moment and try again.",
        ) from exc
    except openai.AuthenticationError as exc:
        raise HTTPException(
            status_code=401,
            detail="AI insights are unavailable because the OpenAI API key is invalid.",
        ) from exc
    except openai.OpenAIError as exc:
        raise HTTPException(
            status_code=502,
            detail="AI insights are unavailable because the OpenAI request failed.",
        ) from exc

    insight = response.choices[0].message.content or ""
    return InsightResponse(insight=insight.strip())

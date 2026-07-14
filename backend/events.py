from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from auth import CurrentUser, get_current_user, require_roles
from database.connection import get_db
from database.models import Event, EventSkill, Skill

router = APIRouter()

# ---------------------------------------------------------------------------
# Skill constants — must match the volunteer application form
# ---------------------------------------------------------------------------

ALL_SKILLS = [
    "Bilingual", "Customer Service", "Dependable", "Live Performing",
    "Organizing & Cleaning", "Problem-Solving", "Public Speaking",
    "Teaching", "Teamwork", "Time Management",
]

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class EventCreate(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    max_volunteers: Optional[int] = None
    required_skills: list[str] = Field(default_factory=list)


class EventResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    location: Optional[str]
    start_datetime: Optional[datetime]
    end_datetime: Optional[datetime]
    max_volunteers: Optional[int]
    is_cancelled: bool
    required_skills: list[str]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def get_or_create_skill(db: AsyncSession, name: str) -> Skill:
    result = await db.execute(select(Skill).where(Skill.name == name))
    skill = result.scalar_one_or_none()
    if not skill:
        skill = Skill(name=name, category="Event")
        db.add(skill)
        await db.flush()
    return skill


async def event_to_response(event: Event) -> EventResponse:
    return EventResponse(
        id=event.id,
        name=event.name,
        description=event.description,
        location=event.location,
        start_datetime=event.start_datetime,
        end_datetime=event.end_datetime,
        max_volunteers=event.max_volunteers,
        is_cancelled=event.is_cancelled,
        required_skills=[es.skill.name for es in event.event_skills],
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/api/events", response_model=list[EventResponse])
async def list_events(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(
        select(Event)
        .where(Event.is_cancelled == False)
        .order_by(Event.start_datetime.asc().nullslast(), Event.id.asc())
    )
    events = result.scalars().all()

    # Load skills for each event
    responses = []
    for event in events:
        skill_result = await db.execute(
            select(EventSkill).where(EventSkill.event_id == event.id)
        )
        event_skills = skill_result.scalars().all()

        skill_names = []
        for es in event_skills:
            skill_res = await db.execute(select(Skill).where(Skill.id == es.skill_id))
            skill = skill_res.scalar_one_or_none()
            if skill:
                skill_names.append(skill.name)

        responses.append(EventResponse(
            id=event.id,
            name=event.name,
            description=event.description,
            location=event.location,
            start_datetime=event.start_datetime,
            end_datetime=event.end_datetime,
            max_volunteers=event.max_volunteers,
            is_cancelled=event.is_cancelled,
            required_skills=skill_names,
        ))

    return responses


@router.post("/api/events", response_model=EventResponse)
async def create_event(
    payload: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("admin", "staff")),
):
    if not payload.name.strip():
        raise HTTPException(status_code=422, detail="Event name is required.")
    if payload.start_datetime and payload.end_datetime and payload.end_datetime < payload.start_datetime:
        raise HTTPException(status_code=422, detail="End date must be after start date.")
    if payload.max_volunteers is not None and payload.max_volunteers < 1:
        raise HTTPException(status_code=422, detail="Max volunteers must be at least 1.")

    event = Event(
        name=payload.name.strip(),
        description=payload.description,
        location=payload.location,
        start_datetime=payload.start_datetime,
        end_datetime=payload.end_datetime,
        max_volunteers=payload.max_volunteers,
    )
    db.add(event)
    await db.flush()

    skill_names = []
    for skill_name in payload.required_skills:
        skill = await get_or_create_skill(db, skill_name)
        db.add(EventSkill(event_id=event.id, skill_id=skill.id))
        skill_names.append(skill.name)

    await db.flush()

    return EventResponse(
        id=event.id,
        name=event.name,
        description=event.description,
        location=event.location,
        start_datetime=event.start_datetime,
        end_datetime=event.end_datetime,
        max_volunteers=event.max_volunteers,
        is_cancelled=event.is_cancelled,
        required_skills=skill_names,
    )


@router.delete("/api/events/{event_id}")
async def cancel_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("admin", "staff")),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event.is_cancelled = True
    return {"message": "Event cancelled"}


@router.get("/api/skills")
async def list_skills(
    current_user: CurrentUser = Depends(get_current_user),
):
    return {"skills": ALL_SKILLS}

from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from database.connection import get_db
from database.models import Volunteer

router = APIRouter()

# ---------------------------------------------------------------------------
# Schema — mirrors the Apply form fields
# ---------------------------------------------------------------------------

class ApplyRequest(BaseModel):
    first_name: str
    last_name: str
    title: Optional[str] = None
    kind: Optional[str] = "Individual"
    pronouns: Optional[str] = None
    street1: Optional[str] = None
    street2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = "OK"
    zip: Optional[str] = None
    primary_phone: Optional[str] = None
    secondary_phone: Optional[str] = None
    email: str
    availability_days: Optional[dict] = None   # {"Monday": "9am-12pm", ...}
    availability_type: Optional[str] = None
    availability_notes: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[str] = None
    accommodations: Optional[str] = None
    tshirt_size: Optional[str] = None
    dietary_restrictions: Optional[list[str]] = None
    photo_release: Optional[bool] = False
    interests: Optional[list[str]] = None
    skills: Optional[list[str]] = None
    opportunities: Optional[list[str]] = None
    specific_positions: Optional[str] = None
    text_opt_in: Optional[bool] = False
    email_preferences: Optional[list[str]] = None
    agree: bool


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/api/apply")
async def submit_application(payload: ApplyRequest, db: AsyncSession = Depends(get_db)):
    age_value = None
    if payload.age:
        try:
            age_value = int(payload.age)
        except ValueError:
            pass

    # Build a notes string from extra fields the Volunteer model doesn't have columns for
    notes_parts = []
    if payload.pronouns:
        notes_parts.append(f"Pronouns: {payload.pronouns}")
    if payload.title:
        notes_parts.append(f"Title: {payload.title}")
    if payload.accommodations:
        notes_parts.append(f"Accommodations: {payload.accommodations}")
    if payload.tshirt_size:
        notes_parts.append(f"T-Shirt Size: {payload.tshirt_size}")
    if payload.interests:
        notes_parts.append(f"Interests: {', '.join(payload.interests)}")
    if payload.skills:
        notes_parts.append(f"Skills: {', '.join(payload.skills)}")
    if payload.opportunities:
        notes_parts.append(f"Opportunities: {', '.join(payload.opportunities)}")
    if payload.specific_positions:
        notes_parts.append(f"Specific Positions: {payload.specific_positions}")
    if payload.availability_days:
        days_str = ", ".join(f"{d}: {t}" for d, t in payload.availability_days.items() if t)
        if days_str:
            notes_parts.append(f"Availability: {days_str}")
    if payload.availability_type:
        notes_parts.append(f"Availability Type: {payload.availability_type}")
    if payload.email_preferences:
        notes_parts.append(f"Email Preferences: {', '.join(payload.email_preferences)}")
    if payload.photo_release:
        notes_parts.append("Photo Release: Yes")
    if payload.text_opt_in:
        notes_parts.append("Text Opt-In: Yes")

    volunteer = Volunteer(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.primary_phone,
        city=payload.city,
        state=payload.state or "OK",
        zip=payload.zip,
        age=age_value,
        gender=payload.gender,
        dietary_restrictions=", ".join(payload.dietary_restrictions) if payload.dietary_restrictions else "None",
        is_active=False,  # pending review until approved by staff
        notes="\n".join(notes_parts) if notes_parts else None,
    )

    db.add(volunteer)
    await db.flush()

    return {
        "message": "Application submitted successfully. We will be in touch soon!",
        "volunteer_id": volunteer.id,
    }

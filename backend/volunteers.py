from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import CurrentUser, get_current_user, require_roles
from database.connection import get_db
from database.models import Volunteer

router = APIRouter()


# ---------------------------------------------------------------------------
# Pydantic models — one row from the uploaded spreadsheet
# ---------------------------------------------------------------------------

class UploadedVolunteerRow(BaseModel):
    City: Optional[str] = None
    State: Optional[str] = None
    Zip: Optional[str] = None
    Age: Optional[str] = None
    Gender: Optional[str] = None
    Ethnicity: Optional[str] = None
    Dietary_Restrictions: Optional[str] = None
    Hispanic_Latino_Or_Spanish: Optional[str] = None
    Life_Hours: Optional[str] = None
    Date_Of_Last_Activity: Optional[str] = None  # mapped to last_activity
    Age_1: Optional[str] = None


class VolunteerUploadRequest(BaseModel):
    rows: list[UploadedVolunteerRow]
    file_name: Optional[str] = None


class VolunteerWriteRequest(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = "OK"
    zip: Optional[str] = None
    age: Optional[int] = None
    age_group: Optional[str] = None
    gender: Optional[str] = None
    ethnicity: Optional[str] = None
    hispanic_latino: Optional[str] = None
    dietary_restrictions: Optional[str] = "None"
    joined_date: Optional[str] = None
    last_activity: Optional[str] = None
    life_hours: Optional[float] = None
    is_active: bool = True


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

def parse_uploaded_date(raw_value: Optional[str]) -> Optional[date]:
    if not raw_value or not raw_value.strip():
        return None
    cleaned = raw_value.strip()
    for fmt in ("%m/%d/%Y", "%m-%d-%Y", "%Y-%m-%d", "%m/%d/%y", "%m-%d-%y"):
        try:
            return datetime.strptime(cleaned, fmt).date()
        except ValueError:
            continue
    return None


def parse_iso_date(raw_value: Optional[str]) -> Optional[date]:
    if not raw_value or not raw_value.strip():
        return None
    try:
        return date.fromisoformat(raw_value.strip())
    except ValueError:
        raise HTTPException(status_code=422, detail="Dates must use YYYY-MM-DD format.")


def parse_uploaded_float(raw_value: Optional[str]) -> Optional[float]:
    if not raw_value or not raw_value.strip():
        return None
    try:
        return float(raw_value.strip().replace(",", "").replace("$", ""))
    except ValueError:
        return None


def parse_uploaded_int(raw_value: Optional[str]) -> Optional[int]:
    if not raw_value or not raw_value.strip():
        return None
    try:
        return int(float(raw_value.strip().replace(",", "").replace("$", "")))
    except ValueError:
        return None


def parse_hispanic_latino(raw_value: Optional[str]) -> Optional[str]:
    if not raw_value or not raw_value.strip():
        return None
    v = raw_value.strip().lower()
    if v.startswith("no") or "not hispanic" in v:
        return "No"
    if v.startswith("yes") or "hispanic" in v or "latino" in v or "spanish" in v:
        return "Yes"
    return None


def volunteer_to_dict(volunteer: Volunteer) -> dict:
    return {
        "id": volunteer.id,
        "first_name": volunteer.first_name,
        "last_name": volunteer.last_name,
        "email": volunteer.email,
        "phone": volunteer.phone,
        "city": volunteer.city,
        "state": volunteer.state,
        "zip": volunteer.zip,
        "age": volunteer.age,
        "age_group": volunteer.age_group,
        "gender": volunteer.gender,
        "ethnicity": volunteer.ethnicity,
        "hispanic_latino": volunteer.hispanic_latino,
        "dietary_restrictions": volunteer.dietary_restrictions,
        "is_active": volunteer.is_active,
        "joined_date": volunteer.joined_date.isoformat() if volunteer.joined_date else None,
        "last_activity": volunteer.last_activity.isoformat() if volunteer.last_activity else None,
        "life_hours": volunteer.life_hours,
    }


def apply_volunteer_payload(volunteer: Volunteer, payload: VolunteerWriteRequest) -> None:
    volunteer.first_name = payload.first_name.strip()
    volunteer.last_name = payload.last_name.strip()
    volunteer.email = payload.email.strip() if payload.email else None
    volunteer.phone = payload.phone.strip() if payload.phone else None
    volunteer.city = payload.city.strip() if payload.city else None
    volunteer.state = (payload.state or "OK").strip().upper()
    volunteer.zip = payload.zip.strip() if payload.zip else None
    volunteer.age = payload.age
    volunteer.age_group = payload.age_group.strip() if payload.age_group else None
    volunteer.gender = payload.gender.strip() if payload.gender else None
    volunteer.ethnicity = payload.ethnicity.strip() if payload.ethnicity else None
    volunteer.hispanic_latino = payload.hispanic_latino.strip() if payload.hispanic_latino else None
    volunteer.dietary_restrictions = payload.dietary_restrictions.strip() if payload.dietary_restrictions else "None"
    volunteer.joined_date = parse_iso_date(payload.joined_date)
    volunteer.last_activity = parse_iso_date(payload.last_activity)
    volunteer.life_hours = payload.life_hours
    volunteer.is_active = payload.is_active


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.get("/api/volunteers")
async def list_volunteers(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(select(Volunteer))
    volunteers = result.scalars().all()

    return [volunteer_to_dict(volunteer) for volunteer in volunteers]


@router.post("/api/volunteers")
async def create_volunteer(
    payload: VolunteerWriteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("admin", "staff")),
):
    volunteer = Volunteer(first_name="", last_name="")
    apply_volunteer_payload(volunteer, payload)
    db.add(volunteer)
    await db.flush()
    return volunteer_to_dict(volunteer)


@router.put("/api/volunteers/{volunteer_id}")
async def update_volunteer(
    volunteer_id: int,
    payload: VolunteerWriteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("admin", "staff")),
):
    result = await db.execute(select(Volunteer).where(Volunteer.id == volunteer_id))
    volunteer = result.scalar_one_or_none()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found.")

    apply_volunteer_payload(volunteer, payload)
    await db.flush()
    return volunteer_to_dict(volunteer)


@router.post("/api/volunteers/upload")
async def upload_volunteers(
    payload: VolunteerUploadRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("admin", "staff")),
):
    """Replace the active analytics dataset with rows from the uploaded spreadsheet."""
    await db.execute(delete(Volunteer))

    volunteers_to_insert = []
    for index, row in enumerate(payload.rows, start=1):
        volunteers_to_insert.append(
            Volunteer(
                first_name="Volunteer",
                last_name=f"#{index:03d}",
                city=row.City or None,
                state=(row.State or "OK").strip().upper(),
                zip=row.Zip or None,
                age=parse_uploaded_int(row.Age),
                age_group=row.Age_1 or None,
                gender=row.Gender or None,
                ethnicity=row.Ethnicity or None,
                hispanic_latino=parse_hispanic_latino(row.Hispanic_Latino_Or_Spanish),
                dietary_restrictions=row.Dietary_Restrictions or "None",
                life_hours=parse_uploaded_float(row.Life_Hours),
                last_activity=parse_uploaded_date(row.Date_Of_Last_Activity),
                is_active=True,
            )
        )

    db.add_all(volunteers_to_insert)
    await db.flush()
    return {
        "message": "Analytics dataset replaced successfully.",
        "file_name": payload.file_name,
        "rows_inserted": len(volunteers_to_insert),
    }

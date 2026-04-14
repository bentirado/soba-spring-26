from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

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
    Date_Of_Last_Activity: Optional[str] = None  # mapped to joined_date
    Age_1: Optional[str] = None


class VolunteerUploadRequest(BaseModel):
    rows: list[UploadedVolunteerRow]


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


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/api/volunteers/upload")
async def upload_volunteers(
    payload: VolunteerUploadRequest,
    db: AsyncSession = Depends(get_db),
):
    """Replace the volunteers table with rows from the uploaded spreadsheet."""
    await db.execute(delete(Volunteer))

    volunteers_to_insert = []
    for index, row in enumerate(payload.rows, start=1):
        volunteers_to_insert.append(
            Volunteer(
                first_name="Person",
                last_name=str(index),
                city=row.City or None,
                state=(row.State or "OK"),
                zip=row.Zip or None,
                age=parse_uploaded_int(row.Age),
                age_group=row.Age_1 or None,
                gender=row.Gender or None,
                ethnicity=row.Ethnicity or None,
                hispanic_latino=parse_hispanic_latino(row.Hispanic_Latino_Or_Spanish),
                dietary_restrictions=row.Dietary_Restrictions or "None",
                joined_date=parse_uploaded_date(row.Date_Of_Last_Activity),
            )
        )

    db.add_all(volunteers_to_insert)
    await db.commit()
    return {
        "message": "Volunteer data uploaded successfully.",
        "rows_inserted": len(volunteers_to_insert),
    }

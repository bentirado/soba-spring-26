from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db
from database.models import Volunteer
from mock_data.overview import build_overview
from mock_data.charts import (
    volunteers_by_last_activity_month,
    volunteers_by_gender,
    volunteers_by_city,
)
from chatbot import router as chatbot_router


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


# ---------------------------------------------------------------------------
# Helper — load volunteers from DB
# ---------------------------------------------------------------------------

from pydantic import BaseModel
from datetime import date, datetime
from sqlalchemy import delete


# One uploaded spreadsheet row from the frontend.
# The keys match the Excel column names coming from the parsed file.
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
    Date_Of_Last_Activity: Optional[str] = None
    Age_1: Optional[str] = None


# Full request body for the upload endpoint.
class VolunteerUploadRequest(BaseModel):
    rows: list[UploadedVolunteerRow]


def parse_uploaded_date(raw_value: Optional[str]) -> Optional[date]:
    if raw_value is None:
        return None

    cleaned_value = raw_value.strip()
    if not cleaned_value:
        return None

    accepted_formats = (
        "%m/%d/%Y",
        "%m-%d-%Y",
        "%Y-%m-%d",
        "%m/%d/%y",
        "%m-%d-%y",
    )

    for date_format in accepted_formats:
        try:
            return datetime.strptime(cleaned_value, date_format).date()
        except ValueError:
            continue

    raise ValueError(
        "Unsupported Date_Of_Last_Activity value "
        f"{cleaned_value!r}. Expected formats like MM/DD/YYYY, MM-DD-YYYY, or YYYY-MM-DD."
    )


def parse_uploaded_int(raw_value: Optional[str]) -> Optional[int]:
    if raw_value is None:
        return None

    cleaned_value = (
        raw_value.strip()
        .replace(",", "")
        .replace("$", "")
    )
    if not cleaned_value:
        return None

    return int(float(cleaned_value))


def parse_uploaded_float(raw_value: Optional[str]) -> Optional[float]:
    if raw_value is None:
        return None

    cleaned_value = (
        raw_value.strip()
        .replace(",", "")
        .replace("$", "")
    )
    if not cleaned_value:
        return None

    return float(cleaned_value)


def parse_hispanic_latino(raw_value: Optional[str]) -> Optional[str]:
    if raw_value is None:
        return None

    cleaned_value = raw_value.strip()
    if not cleaned_value:
        return None

    normalized_value = cleaned_value.lower()

    if normalized_value.startswith("no"):
        return "No"

    if normalized_value.startswith("yes"):
        return "Yes"

    if "not hispanic" in normalized_value:
        return "No"

    if "hispanic" in normalized_value or "latino" in normalized_value or "spanish" in normalized_value:
        return "Yes"

    return None

# Load volunteers from PostgreSQL and convert them into plain dictionaries
# that match the shape expected by the existing chart/overview helpers.
async def load_volunteers_from_db(db: AsyncSession):
    result = await db.execute(select(Volunteer))
    volunteers = result.scalars().all()

    return [
        {
            "id": volunteer.id,
            "first_name": volunteer.first_name,
            "last_name": volunteer.last_name,
            "city": volunteer.city,
            "state": volunteer.state,
            "zip": volunteer.zip,
            "age": volunteer.age,
            "age_group": volunteer.age_group,
            "gender": volunteer.gender,
            "ethnicity": volunteer.ethnicity,
            "dietary_restrictions": volunteer.dietary_restrictions,
            "hispanic_latino": volunteer.hispanic_latino,
            "life_hours": volunteer.life_hours,
            "last_activity": volunteer.last_activity.isoformat() if volunteer.last_activity else None,
        }
        for volunteer in volunteers
    ]


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(lifespan=lifespan)

app.include_router(chatbot_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Existing endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check():
    return {"status": "ok"}


# Return the dashboard overview using volunteer data from PostgreSQL.
@app.get("/api/overview")
async def get_dashboard_overview(db: AsyncSession = Depends(get_db)):
    volunteers = await load_volunteers_from_db(db)
    return build_overview(volunteers)


# Return chart data for volunteer last activity by month.
@app.get("/api/charts/last-activity-by-month")
async def get_last_activity_by_month(db: AsyncSession = Depends(get_db)):
    volunteers = await load_volunteers_from_db(db)
    return volunteers_by_last_activity_month(volunteers)


# Return chart data showing the number of volunteers in each gender group.
@app.get("/api/charts/volunteers-by-gender")
async def get_volunteers_by_gender(
    start: Optional[str] = None,
    end: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    volunteers = await load_volunteers_from_db(db)

    if start or end:
        filtered_volunteers = []
        for volunteer in volunteers:
            last_activity = volunteer.get("last_activity")
            if not last_activity:
                continue
            month = last_activity[:7]
            if (not start or month >= start) and (not end or month <= end):
                filtered_volunteers.append(volunteer)
        volunteers = filtered_volunteers

    return volunteers_by_gender(volunteers)


# Return chart data showing the number of volunteers in each city.
@app.get("/api/charts/volunteers-by-city")
async def get_volunteers_by_city(
    start: Optional[str] = None,
    end: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    volunteers = await load_volunteers_from_db(db)
    return volunteers_by_city(volunteers)


# Upload volunteer demographic rows from the frontend and replace
# the current volunteers table contents with the uploaded data.
@app.post("/api/volunteers/upload")
async def upload_volunteers(
    payload: VolunteerUploadRequest,
    db: AsyncSession = Depends(get_db),
):
    # Remove existing volunteers first so the dashboard reflects only
    # the latest uploaded spreadsheet data.
    await db.execute(delete(Volunteer))

    volunteers_to_insert = []

    for index, row in enumerate(payload.rows, start=1):
        # Convert spreadsheet values safely into the types expected by the DB.
        age_value = parse_uploaded_int(row.Age)
        life_hours_value = parse_uploaded_float(row.Life_Hours)
        last_activity_value = parse_uploaded_date(row.Date_Of_Last_Activity)
        hispanic_latino_value = parse_hispanic_latino(row.Hispanic_Latino_Or_Spanish)

        volunteers_to_insert.append(
            Volunteer(
                # Placeholder name values until we get a file with real names.
                first_name="Person",
                last_name=str(index),
                city=row.City or None,
                state=(row.State or "OK"),
                zip=row.Zip or None,
                age=age_value,
                age_group=row.Age_1 or None,
                gender=row.Gender or None,
                ethnicity=row.Ethnicity or None,
                hispanic_latino=hispanic_latino_value,
                dietary_restrictions=row.Dietary_Restrictions or "None",
                life_hours=life_hours_value,
                last_activity=last_activity_value,
            )
        )

    db.add_all(volunteers_to_insert)
    await db.commit()

    return {
        "message": "Volunteer data uploaded successfully.",
        "rows_inserted": len(volunteers_to_insert),
    }

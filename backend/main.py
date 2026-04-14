from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db, init_db
from database.models import Volunteer
from mock_data.overview import build_overview
from mock_data.charts import (
    volunteers_by_last_activity_month,
    volunteers_by_gender,
    volunteers_by_city,
)
from chatbot import router as chatbot_router
from events import router as events_router
from apply import router as apply_router
from email_bot import router as email_router
from volunteers import router as volunteers_router


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
            "email": volunteer.email,
            "city": volunteer.city,
            "state": volunteer.state,
            "zip": volunteer.zip,
            "age": volunteer.age,
            "age_group": volunteer.age_group,
            "gender": volunteer.gender,
            "ethnicity": volunteer.ethnicity,
            "dietary_restrictions": volunteer.dietary_restrictions,
            "hispanic_latino": volunteer.hispanic_latino,
            "joined_date": volunteer.joined_date.isoformat() if volunteer.joined_date else None,
        }
        for volunteer in volunteers
    ]


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(lifespan=lifespan)

app.include_router(chatbot_router)
app.include_router(events_router)
app.include_router(apply_router)
app.include_router(email_router)
app.include_router(volunteers_router)

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
            joined_date = volunteer.get("joined_date")
            if not joined_date:
                continue
            month = joined_date[:7]
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




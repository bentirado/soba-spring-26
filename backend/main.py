from fastapi import FastAPI
from mock_data.overview import build_overview
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db
from database.models import Volunteer
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db
from database.models import Volunteer

from mock_data.charts import (
    volunteers_by_last_activity_month,
    volunteers_by_gender,
    volunteers_by_city,
)
    
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
            "life_hours": volunteer.life_hours,
            "last_activity": volunteer.last_activity.isoformat() if volunteer.last_activity else None,
        }
        for volunteer in volunteers
    ]

app = FastAPI()

# Allow the frontend dev server to call the backend during local development.
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

@app.get("/health")
def health_check():
    return {"status": "ok"}


# Return the dashboard overview using volunteer data from PostgreSQL.
# Return the dashboard overview using volunteer data from PostgreSQL.
@app.get("/api/overview")
async def get_dashboard_overview(db: AsyncSession = Depends(get_db)):
    # Load all volunteers from the real database.
    volunteers = await load_volunteers_from_db(db)
async def get_dashboard_overview(db: AsyncSession = Depends(get_db)):
    # Load all volunteers from the real database.
    volunteers = await load_volunteers_from_db(db)

    # Reuse the existing overview helper so the response shape stays the same.
    # Reuse the existing overview helper so the response shape stays the same.
    return build_overview(volunteers)


# Return chart data for volunteer last activity by month
# using volunteer records from PostgreSQL.
# Return chart data for volunteer last activity by month
# using volunteer records from PostgreSQL.
@app.get("/api/charts/last-activity-by-month")
async def get_last_activity_by_month(db: AsyncSession = Depends(get_db)):
    # Load volunteer records from the real database.
    volunteers = await load_volunteers_from_db(db)

    # Reuse the existing grouping helper so the response shape stays the same.
async def get_last_activity_by_month(db: AsyncSession = Depends(get_db)):
    # Load volunteer records from the real database.
    volunteers = await load_volunteers_from_db(db)

    # Reuse the existing grouping helper so the response shape stays the same.
    return volunteers_by_last_activity_month(volunteers)






# Return chart data showing the number of volunteers in each gender group.
# Optional start/end month filters can be used to narrow the data range.
@app.get("/api/charts/volunteers-by-gender")
async def get_volunteers_by_gender(
    start: Optional[str] = None,
    end: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    # Load volunteer records from the real database.
    volunteers = await load_volunteers_from_db(db)
async def get_volunteers_by_gender(
    start: Optional[str] = None,
    end: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    # Load volunteer records from the real database.
    volunteers = await load_volunteers_from_db(db)

    # If a start or end month is provided, filter volunteers by last_activity month.
    if start or end:
        filtered_volunteers = []

        for volunteer in volunteers:
            last_activity = volunteer.get("last_activity")
            if not last_activity:
                continue

            # Extract the year-month part from the full date (YYYY-MM-DD -> YYYY-MM).
            month = last_activity[:7]

            is_after_start = not start or month >= start
            is_before_end = not end or month <= end

            if is_after_start and is_before_end:
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
    # Load volunteer records from the real database.
    volunteers = await load_volunteers_from_db(db)

async def get_volunteers_by_city(
    start: Optional[str] = None,
    end: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    # Load volunteer records from the real database.
    volunteers = await load_volunteers_from_db(db)

    return volunteers_by_city(volunteers)
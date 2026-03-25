from fastapi import FastAPI
import json
from pathlib import Path
from mock_data.overview import build_overview
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from mock_data.charts import (
    volunteers_by_last_activity_month,
    volunteers_by_gender,
    volunteers_by_city,
)


VOLUNTEERS_FILE = Path(__file__).parent / "mockVolunteers.json"

# Load volunteer records from the shared mock JSON file.
def load_volunteers():
    with open(VOLUNTEERS_FILE, "r") as f:
        return json.load(f)

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


# Return overview metrics for the dashboard summary cards.
@app.get("/api/overview")
def get_overview():
    # Read the current mock volunteer dataset from the JSON file.
    volunteers = load_volunteers()

    # Build overview KPI values from the shared volunteer dataset.
    return build_overview(volunteers)


# Return line-chart data based on the month of each volunteer's most recent activity.
@app.get("/api/charts/last-activity-by-month")
def get_last_activity_by_month():
    # Read the current mock volunteer dataset from the JSON file.
    volunteers = load_volunteers()
    return volunteers_by_last_activity_month(volunteers)


# Return chart data showing the number of volunteers in each gender group.
# Optional start/end month filters can be used to narrow the data range.
@app.get("/api/charts/volunteers-by-gender")
def get_volunteers_by_gender(start: Optional[str] = None, end: Optional[str] = None):
    # Read the current mock volunteer dataset from the JSON file.
    volunteers = load_volunteers()

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
def get_volunteers_by_city(start: Optional[str] = None, end: Optional[str] = None):
    # Read the current mock volunteer dataset from the JSON file.
    volunteers = load_volunteers()
    return volunteers_by_city(volunteers)
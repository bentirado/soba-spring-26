from fastapi import FastAPI
import json
from pathlib import Path
from mock_data.overview import build_overview

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
@app.get("/api/charts/volunteers-by-gender")
def get_volunteers_by_gender():
    # Read the current mock volunteer dataset from the JSON file.
    volunteers = load_volunteers()
    return volunteers_by_gender(volunteers)

# Return chart data showing the number of volunteers in each city.
@app.get("/api/charts/volunteers-by-city")
def get_volunteers_by_city():
    # Read the current mock volunteer dataset from the JSON file.
    volunteers = load_volunteers()
    return volunteers_by_city(volunteers)
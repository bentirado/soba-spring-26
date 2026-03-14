from fastapi import FastAPI
from mock_data.overview import OVERVIEW_DATA

app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "ok"}


# Return mock overview metrics for the dashboard summary cards.
# This endpoint provides top-level KPI data such as total volunteers,
# hours logged, active events, and community impact.
@app.get("/api/overview")
def get_overview():
    return OVERVIEW_DATA


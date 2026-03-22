# SoBA Development -- Frontend

## Overview

This is the React frontend application for the SoBA Development project.

The purpose of this application is to provide the user interface layer
for improving volunteer outreach and retention through data-driven
insights.

This frontend communicates with a FastAPI backend service.

------------------------------------------------------------------------

## Tech Stack

-   React\
-   TypeScript\
-   Vite

------------------------------------------------------------------------

## Prerequisites

Ensure the following are installed:

-   Node.js (v18+ recommended)\
-   npm

Verify versions:

``` bash
node -v
npm -v
```

------------------------------------------------------------------------

## Installation

From the `frontend` directory:

``` bash
npm install
```

------------------------------------------------------------------------

## Running the Development Server

``` bash
npm run dev
```

The application will be available at:

http://localhost:5173

------------------------------------------------------------------------

## Project Structure

    src/
    │
    ├── App.tsx
    └── main.tsx

This is a minimal setup for Sprint 1. The structure will expand as
features are implemented.

------------------------------------------------------------------------

## Development Notes

-   This is a foundational setup intended for early-stage development.
-   All new features should be developed in feature branches and
    submitted via pull request for review.

------------------------------------------------------------------------

## Database (PostgreSQL)

The backend uses a PostgreSQL database with 19 tables covering the full
volunteer management domain. The database layer lives in `backend/database/`.

### Prerequisites

-   PostgreSQL installed and running on port 5432
-   Python 3.10+
-   pip

### Setup

**1. Create the database**

``` bash
createdb soba_db
```

**2. Configure environment variables**

``` bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set your PostgreSQL credentials:

```
DATABASE_URL=postgresql://<your_pg_user>@localhost:5432/soba_db
```

**3. Install Python dependencies**

``` bash
cd backend
pip install -r requirements.txt
```

**4. Create all tables and seed the database**

``` bash
cd backend
python3 -m database.seed
```

Expected output:

```
Database seeded successfully!
  Skills:              10
  Certifications:      5
  Programs:            5
  Volunteers:          100
  Events:              30
  Shifts:              65
  Shift Assignments:   237
  Agent Runs:          5
```

### Database Tables

| Domain | Tables |
|---|---|
| Core | volunteers, emergency_contacts, skills, volunteer_skills, certifications, volunteer_certifications, availability |
| Programs & Events | programs, volunteer_programs, events, shifts, shift_assignments |
| Engagement | volunteer_hours, communications, volunteer_status_history |
| AI Agents | agent_runs, agent_insights, agent_recommendations, data_pipeline_runs |

### How the Layers Connect

```
React Frontend  (localhost:5173)
      |
      |  HTTP fetch to /api/... endpoints
      v
FastAPI Backend  (localhost:8000)
      |
      |  SQLAlchemy AsyncSession via get_db()
      v
PostgreSQL Database  (localhost:5432/soba_db)
      ^
      |  n8n Postgres node — INSERT/UPDATE on ingestion
      |
n8n Data Pipeline
      ^
      |
Volgistics API / NAS Files
```

The frontend never talks to the database directly — all data goes through
the FastAPI backend. The n8n data pipeline writes ingested data directly
into the database, with each run logged to the `data_pipeline_runs` table.

------------------------------------------------------------------------

